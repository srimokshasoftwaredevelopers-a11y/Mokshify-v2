"use server";
import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { REPLY_KINDS } from "@/lib/rules";
import { ActivityInput, TaskInput, firstIssue } from "@/lib/validation";

export type ActionResult = { ok?: boolean; error?: string };

function revalidateFor(a: { leadId?: string | null; dealId?: string | null; clientId?: string | null; projectId?: string | null }) {
  revalidatePath("/today");
  if (a.leadId) { revalidatePath(`/leads/${a.leadId}`); revalidatePath("/leads"); }
  if (a.dealId) { revalidatePath(`/deals/${a.dealId}`); revalidatePath("/pipeline"); }
  if (a.clientId) revalidatePath(`/clients/${a.clientId}`);
  if (a.projectId) revalidatePath(`/projects/${a.projectId}`);
}

/** log a call, WhatsApp, email, meeting or note. The first reply to a lead stops its timer and
    stores the response time (once — later replies never change it). */
export async function logActivity(input: { kind: string; body?: string | null; leadId?: string; dealId?: string; clientId?: string; projectId?: string }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = ActivityInput.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const a = parsed.data;
  const db = await getDb();
  await db.transaction(async tx => {
    await tx.insert(t.activities).values({ kind: a.kind, body: a.body ?? null, leadId: a.leadId, dealId: a.dealId, clientId: a.clientId, projectId: a.projectId, userId: user.id });
    if (a.leadId && (REPLY_KINDS as readonly string[]).includes(a.kind)) {
      await tx.update(t.leads).set({
        firstResponseAt: sql`now()`,
        firstResponseSeconds: sql`greatest(0, extract(epoch from (now() - ${t.leads.createdAt})))::int`,
        status: sql`case when ${t.leads.status} = 'new' then 'contacted'::lead_status else ${t.leads.status} end`,
      }).where(and(eq(t.leads.id, a.leadId), isNull(t.leads.firstResponseAt)));
    }
    if (a.dealId) await tx.update(t.deals).set({ lastActivityAt: sql`now()` }).where(eq(t.deals.id, a.dealId));
  });
  revalidateFor(a);
  return { ok: true };
}

export async function addTask(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = TaskInput.safeParse(Object.fromEntries([...form].filter(([, v]) => v !== "")));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const d = parsed.data;
  const dueAt = d.dueDate ? new Date(`${d.dueDate}T${d.dueTime || "10:00"}:00+05:30`) : null;
  const db = await getDb();
  await db.insert(t.tasks).values({ title: d.title, dueAt, leadId: d.leadId, dealId: d.dealId, clientId: d.clientId, projectId: d.projectId, ownerId: user.id });
  revalidateFor(d);
  return { ok: true };
}

export async function setTaskDone(id: string, done: boolean): Promise<ActionResult> {
  await requireUser();
  if (!/^[0-9a-f-]{36}$/.test(id)) return { error: "Unknown task." };
  const db = await getDb();
  const [task] = await db.update(t.tasks).set({ done, doneAt: done ? new Date() : null }).where(eq(t.tasks.id, id)).returning();
  if (!task) return { error: "This task no longer exists." };
  revalidateFor(task);
  return { ok: true };
}
