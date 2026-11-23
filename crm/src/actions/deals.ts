"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireOwner, requireUser } from "@/lib/auth";
import { addDays, dayIST } from "@/lib/format";
import { STAGES, isOpen, stageLabel, type Stage } from "@/lib/rules";
import { DealCreate, DealUpdate, StageMove, fieldErrors, firstIssue, type StageMoveInput } from "@/lib/validation";

export type DealResult = { ok?: boolean; error?: string; fields?: Record<string, string>; id?: string; projectId?: string; clientId?: string };
const probabilityOf = (s: Stage) => STAGES.find(x => x.key === s)?.probability ?? 10;
const isId = (v: string) => /^[0-9a-f-]{36}$/.test(v);

function revalidateDeal(id: string, leadId?: string | null) {
  revalidatePath("/pipeline"); revalidatePath("/today"); revalidatePath(`/deals/${id}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function createDeal(_prev: DealResult, form: FormData): Promise<DealResult> {
  const user = await requireUser();
  const parsed = DealCreate.safeParse(Object.fromEntries([...form].filter(([, v]) => v !== "")));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const d = parsed.data;
  const db = await getDb();
  const [deal] = await db.insert(t.deals).values({ ...d, probability: probabilityOf(d.stage), ownerId: user.id }).returning({ id: t.deals.id });
  revalidateDeal(deal!.id, d.leadId);
  return { ok: true, id: deal!.id };
}

/** a lead becomes a deal in one step: sensible title, a next step for tomorrow, the lead marked converted */
export async function convertLead(leadId: string) {
  const user = await requireUser();
  if (!isId(leadId)) return;
  const db = await getDb();
  const [lead] = await db.select().from(t.leads).where(eq(t.leads.id, leadId)).limit(1);
  if (!lead) redirect("/leads");
  const title = [lead.company ?? lead.name, lead.serviceInterest].filter(Boolean).join(" — ");
  const id = await db.transaction(async tx => {
    const [deal] = await tx.insert(t.deals).values({
      title, leadId, clientId: lead.clientId, stage: "contacted", probability: probabilityOf("contacted"),
      nextAction: "Discovery call: understand what they need", nextActionDate: addDays(dayIST(), 1), ownerId: lead.ownerId ?? user.id,
    }).returning({ id: t.deals.id });
    await tx.update(t.leads).set({ status: "converted" }).where(eq(t.leads.id, leadId));
    await tx.insert(t.activities).values({ kind: "system", body: "Converted to a deal.", leadId, dealId: deal!.id, userId: user.id });
    return deal!.id;
  });
  await audit("lead_convert", { actorId: user.id, entity: "deal", entityId: id, meta: { leadId } });
  revalidateDeal(id, leadId); revalidatePath("/leads");
  redirect(`/deals/${id}`);
}

/** move a deal: an open stage needs the next step; lost needs a reason; won needs the final value
    and creates the client (from the lead, if there isn't one) and the first project */
export async function moveStage(dealId: string, input: StageMoveInput): Promise<DealResult> {
  const user = await requireUser();
  if (!isId(dealId)) return { error: "Unknown deal." };
  const parsed = StageMove.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const m = parsed.data;
  const db = await getDb();
  const [deal] = await db.select().from(t.deals).where(eq(t.deals.id, dealId)).limit(1);
  if (!deal) return { error: "This deal no longer exists." };
  const from = deal.stage as Stage;
  const now = new Date();

  const result = await db.transaction(async tx => {
    let clientId = deal.clientId, projectId: string | undefined;
    if (m.to === "won") {
      const lead = deal.leadId ? (await tx.select().from(t.leads).where(eq(t.leads.id, deal.leadId)).limit(1))[0] : undefined;
      if (!clientId) {
        const [c] = await tx.insert(t.clients).values({
          businessName: lead?.company ?? lead?.name ?? deal.title, phone: lead?.phone, email: lead?.email, address: lead?.city,
          industry: lead?.industry, ownerId: deal.ownerId ?? user.id,
        }).returning({ id: t.clients.id });
        clientId = c!.id;
        if (lead) {
          await tx.insert(t.contacts).values({ clientId, name: lead.name, phone: lead.phone, email: lead.email, isPrimary: true });
          await tx.update(t.leads).set({ clientId, status: "converted" }).where(eq(t.leads.id, lead.id));
        }
      }
      const [existing] = await tx.select({ id: t.projects.id }).from(t.projects).where(eq(t.projects.dealId, dealId)).limit(1);
      if (existing) projectId = existing.id;
      else {
        const [p] = await tx.insert(t.projects).values({
          clientId, dealId, name: m.projectName ?? deal.title, type: lead?.serviceInterest ?? null, agreedAmount: m.value,
          status: "advance_pending", startDate: dayIST(now),
        }).returning({ id: t.projects.id });
        projectId = p!.id;
      }
      await tx.update(t.deals).set({ stage: "won", value: m.value, clientId, probability: 100, closedAt: now, lostReason: null, stageChangedAt: now, lastActivityAt: now }).where(eq(t.deals.id, dealId));
    } else if (m.to === "lost") {
      await tx.update(t.deals).set({ stage: "lost", lostReason: m.lostReason, probability: 0, closedAt: now, stageChangedAt: now, lastActivityAt: now }).where(eq(t.deals.id, dealId));
    } else {
      await tx.update(t.deals).set({
        stage: m.to, nextAction: m.nextAction, nextActionDate: m.nextActionDate, probability: probabilityOf(m.to),
        closedAt: null, lostReason: null, lastActivityAt: now, ...(m.to !== from ? { stageChangedAt: now } : {}),
      }).where(eq(t.deals.id, dealId));
    }
    if (m.to !== from) {
      const why = m.to === "lost" ? ` (${m.lostReason}${m.note ? `: ${m.note}` : ""})` : m.to === "won" ? "" : ` · next: ${m.nextAction}`;
      await tx.insert(t.activities).values({ kind: "stage_change", body: `${stageLabel(from)} → ${stageLabel(m.to)}${why}`, dealId, leadId: deal.leadId, userId: user.id });
    }
    return { clientId, projectId };
  });

  if (m.to !== from) {
    await audit("stage_change", { actorId: user.id, entity: "deal", entityId: dealId, meta: { from, to: m.to } });
    if (m.to === "won") await audit("deal_won", { actorId: user.id, entity: "deal", entityId: dealId, meta: { value: m.value, projectId: result.projectId ?? null } });
    if (m.to === "lost") await audit("deal_lost", { actorId: user.id, entity: "deal", entityId: dealId, meta: { reason: m.lostReason } });
  }
  revalidateDeal(dealId, deal.leadId);
  if (result.clientId) { revalidatePath("/clients"); revalidatePath(`/clients/${result.clientId}`); }
  if (result.projectId) { revalidatePath("/projects"); revalidatePath(`/projects/${result.projectId}`); }
  return { ok: true, clientId: result.clientId ?? undefined, projectId: result.projectId };
}

export async function updateDeal(id: string, _prev: DealResult, form: FormData): Promise<DealResult> {
  await requireUser();
  if (!isId(id)) return { error: "Unknown deal." };
  const parsed = DealUpdate.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  const [deal] = await db.select({ stage: t.deals.stage, leadId: t.deals.leadId }).from(t.deals).where(eq(t.deals.id, id)).limit(1);
  if (!deal) return { error: "This deal no longer exists." };
  // rule 3: an open deal is never saved without its next step
  if (isOpen(deal.stage as Stage)) {
    if (!parsed.data.nextAction) return { error: "An open deal needs a next action.", fields: { nextAction: "An open deal needs a next action." } };
    if (!parsed.data.nextActionDate) return { error: "An open deal needs a date for its next action.", fields: { nextActionDate: "Pick a date." } };
  }
  await db.update(t.deals).set(parsed.data).where(eq(t.deals.id, id));
  revalidateDeal(id, deal.leadId);
  return { ok: true };
}

export async function deleteDeal(id: string) {
  const user = await requireOwner();
  if (!isId(id)) return;
  const db = await getDb();
  const [deal] = await db.select({ id: t.deals.id }).from(t.deals).where(eq(t.deals.id, id)).limit(1);
  if (deal) {
    await db.delete(t.deals).where(eq(t.deals.id, id));
    await audit("delete", { actorId: user.id, entity: "deal", entityId: id });
  }
  revalidatePath("/pipeline"); revalidatePath("/today");
  redirect("/pipeline");
}
