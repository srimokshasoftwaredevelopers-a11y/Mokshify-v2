"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { RenewalInput, Renewed, fieldErrors, firstIssue } from "@/lib/validation";
import type { Result } from "@/components/ActionForm";

const isId = (v: string) => /^[0-9a-f-]{36}$/.test(v);
const ITEM = { domain: "Domain", hosting: "Hosting", ssl: "SSL", maintenance: "Maintenance" } as const;
const touch = (clientId: string) => { revalidatePath("/renewals"); revalidatePath("/today"); revalidatePath(`/clients/${clientId}`); };

/** for a client: bound to its id on the client page, or chosen in the form on the Renewals page */
export async function createRenewal(boundClientId: string | null, _prev: Result, form: FormData): Promise<Result> {
  await requireUser();
  const clientId = boundClientId ?? String(form.get("clientId") ?? "");
  if (!isId(clientId)) return { error: "Choose the client." };
  const parsed = RenewalInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  await db.insert(t.renewals).values({ ...parsed.data, clientId });
  touch(clientId);
  return { ok: true };
}

/** one action: mark it renewed and set the next date (the reminders start again from there) */
export async function markRenewed(id: string, _prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser();
  if (!isId(id)) return { error: "Unknown renewal." };
  const parsed = Renewed.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  const [r] = await db.select().from(t.renewals).where(eq(t.renewals.id, id)).limit(1);
  if (!r) return { error: "This renewal no longer exists." };
  if (parsed.data.nextDate <= r.renewalDate) return { error: "The next date must be after the current renewal date." };
  await db.transaction(async tx => {
    await tx.update(t.renewals).set({ renewalDate: parsed.data.nextDate, amount: parsed.data.amount, status: "active" }).where(eq(t.renewals.id, id));
    await tx.insert(t.activities).values({ kind: "system", body: `${ITEM[r.item]}${r.label ? ` (${r.label})` : ""} renewed until ${fmtDate(parsed.data.nextDate)}.`, clientId: r.clientId, projectId: r.projectId, userId: user.id });
  });
  touch(r.clientId);
  return { ok: true };
}

export async function cancelRenewal(id: string) {
  await requireUser();
  if (!isId(id)) return;
  const db = await getDb();
  const [r] = await db.update(t.renewals).set({ status: "cancelled" }).where(eq(t.renewals.id, id)).returning({ clientId: t.renewals.clientId });
  if (r) touch(r.clientId);
}
