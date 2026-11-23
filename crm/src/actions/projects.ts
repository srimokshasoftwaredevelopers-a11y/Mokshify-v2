"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fmtDate, rupees } from "@/lib/format";
import { PaymentInput, PaymentReceived, ProjectInput, fieldErrors, firstIssue } from "@/lib/validation";
import type { Result } from "@/components/ActionForm";

const isId = (v: string) => /^[0-9a-f-]{36}$/.test(v);
const touch = (projectId: string, clientId?: string | null) => {
  revalidatePath(`/projects/${projectId}`); revalidatePath("/projects"); revalidatePath("/today");
  if (clientId) revalidatePath(`/clients/${clientId}`);
};

export async function createProject(clientId: string, _prev: Result, form: FormData): Promise<Result> {
  await requireUser();
  if (!isId(clientId)) return { error: "Unknown client." };
  const parsed = ProjectInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  const [p] = await db.insert(t.projects).values({ ...parsed.data, clientId }).returning({ id: t.projects.id });
  touch(p!.id, clientId);
  redirect(`/projects/${p!.id}`);
}

export async function updateProject(id: string, _prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser();
  if (!isId(id)) return { error: "Unknown project." };
  const parsed = ProjectInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  const [before] = await db.select({ status: t.projects.status, clientId: t.projects.clientId }).from(t.projects).where(eq(t.projects.id, id)).limit(1);
  if (!before) return { error: "This project no longer exists." };
  await db.update(t.projects).set(parsed.data).where(eq(t.projects.id, id));
  if (before.status !== parsed.data.status) {
    await db.insert(t.activities).values({ kind: "system", body: `Project status: ${parsed.data.status.replace(/_/g, " ")}`, projectId: id, clientId: before.clientId, userId: user.id });
  }
  touch(id, before.clientId);
  return { ok: true, message: "Saved." };
}

/** a milestone: what is due, and when */
export async function addPayment(projectId: string, _prev: Result, form: FormData): Promise<Result> {
  await requireUser();
  if (!isId(projectId)) return { error: "Unknown project." };
  const parsed = PaymentInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  const [p] = await db.select({ clientId: t.projects.clientId }).from(t.projects).where(eq(t.projects.id, projectId)).limit(1);
  if (!p) return { error: "This project no longer exists." };
  await db.insert(t.payments).values({ ...parsed.data, projectId, status: "due" });
  touch(projectId, p.clientId);
  return { ok: true };
}

/** money arrived. Less than the milestone? The rest becomes a new due milestone, so the balance stays honest. */
export async function recordPayment(paymentId: string, _prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser();
  if (!isId(paymentId)) return { error: "Unknown payment." };
  const parsed = PaymentReceived.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const r = parsed.data;
  const db = await getDb();
  const [pay] = await db.select({ pay: t.payments, clientId: t.projects.clientId }).from(t.payments).innerJoin(t.projects, eq(t.payments.projectId, t.projects.id)).where(eq(t.payments.id, paymentId)).limit(1);
  if (!pay) return { error: "This payment no longer exists." };
  if (pay.pay.status !== "due") return { error: "This milestone is already settled." };
  await db.transaction(async tx => {
    await tx.update(t.payments).set({ status: "received", amount: r.amount, receivedDate: r.receivedDate, method: r.method, reference: r.reference ?? null }).where(eq(t.payments.id, paymentId));
    if (r.amount < pay.pay.amount) {
      await tx.insert(t.payments).values({ projectId: pay.pay.projectId, milestone: `${pay.pay.milestone} — balance`, amount: pay.pay.amount - r.amount, dueDate: pay.pay.dueDate, status: "due" });
    }
    await tx.insert(t.activities).values({ kind: "system", body: `${rupees(r.amount)} received for "${pay.pay.milestone}" on ${fmtDate(r.receivedDate)} (${r.method}${r.reference ? ` · ${r.reference}` : ""}).`, projectId: pay.pay.projectId, clientId: pay.clientId, userId: user.id });
  });
  touch(pay.pay.projectId, pay.clientId);
  return { ok: true };
}

export async function cancelPayment(paymentId: string) {
  await requireUser();
  if (!isId(paymentId)) return;
  const db = await getDb();
  const [p] = await db.update(t.payments).set({ status: "cancelled" }).where(eq(t.payments.id, paymentId)).returning({ projectId: t.payments.projectId });
  if (p) touch(p.projectId);
}
