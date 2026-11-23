"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireOwner, requireUser } from "@/lib/auth";
import { BulkAssign, LeadUpdate, QuickLead, fieldErrors, firstIssue } from "@/lib/validation";

export type FormResult = { ok?: boolean; error?: string; fields?: Record<string, string>; id?: string };

/** the 20-second phone enquiry: name, phone, source, one line */
export async function quickAddLead(_prev: FormResult, form: FormData): Promise<FormResult> {
  const user = await requireUser();
  const parsed = QuickLead.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  const [lead] = await db.insert(t.leads).values({
    name: parsed.data.name, phone: parsed.data.phone, source: parsed.data.source, message: parsed.data.note ?? null, ownerId: user.id,
  }).returning({ id: t.leads.id });
  await audit("lead_create", { actorId: user.id, entity: "lead", entityId: lead!.id, meta: { via: "quick_add" } });
  revalidatePath("/today"); revalidatePath("/leads");
  return { ok: true, id: lead!.id };
}

export async function updateLead(id: string, _prev: FormResult, form: FormData): Promise<FormResult> {
  const user = await requireUser();
  const parsed = LeadUpdate.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  const [before] = await db.select({ ownerId: t.leads.ownerId, status: t.leads.status }).from(t.leads).where(eq(t.leads.id, id)).limit(1);
  if (!before) return { error: "This lead no longer exists." };
  await db.update(t.leads).set(parsed.data).where(eq(t.leads.id, id));
  if (before.ownerId !== parsed.data.ownerId || before.status !== parsed.data.status) {
    await audit("user_update", { actorId: user.id, entity: "lead", entityId: id, meta: { status: parsed.data.status, reassigned: before.ownerId !== parsed.data.ownerId } });
  }
  revalidatePath(`/leads/${id}`); revalidatePath("/leads"); revalidatePath("/today");
  return { ok: true };
}

export async function bulkAssign(ids: string[], ownerId: string): Promise<FormResult> {
  const user = await requireUser();
  const parsed = BulkAssign.safeParse({ ids, ownerId });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const db = await getDb();
  const [owner] = await db.select({ id: t.users.id }).from(t.users).where(eq(t.users.id, ownerId)).limit(1);
  if (!owner) return { error: "That person isn't a Desk user." };
  await db.update(t.leads).set({ ownerId }).where(inArray(t.leads.id, parsed.data.ids));
  await audit("user_update", { actorId: user.id, entity: "lead", meta: { bulkAssigned: parsed.data.ids.length } });
  revalidatePath("/leads"); revalidatePath("/today");
  return { ok: true };
}

/** owner only: removes the lead and its timeline and tasks (deals keep their history, unlinked) */
export async function deleteLead(id: string) {
  const user = await requireOwner();
  const db = await getDb();
  await db.delete(t.leads).where(eq(t.leads.id, id));
  await audit("delete", { actorId: user.id, entity: "lead", entityId: id });
  revalidatePath("/leads"); revalidatePath("/today");
  redirect("/leads");
}
