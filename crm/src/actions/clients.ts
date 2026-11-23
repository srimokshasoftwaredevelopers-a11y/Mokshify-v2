"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ClientInput, ContactInput, fieldErrors, firstIssue } from "@/lib/validation";
import type { Result } from "@/components/ActionForm";

const isId = (v: string) => /^[0-9a-f-]{36}$/.test(v);

export async function createClient(_prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser();
  const parsed = ClientInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  const [c] = await db.insert(t.clients).values({ ...parsed.data, ownerId: user.id }).returning({ id: t.clients.id });
  revalidatePath("/clients");
  redirect(`/clients/${c!.id}`);
}

export async function updateClient(id: string, _prev: Result, form: FormData): Promise<Result> {
  await requireUser();
  if (!isId(id)) return { error: "Unknown client." };
  const parsed = ClientInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  await db.update(t.clients).set(parsed.data).where(eq(t.clients.id, id));
  revalidatePath(`/clients/${id}`); revalidatePath("/clients");
  return { ok: true, message: "Saved." };
}

export async function addContact(clientId: string, _prev: Result, form: FormData): Promise<Result> {
  await requireUser();
  if (!isId(clientId)) return { error: "Unknown client." };
  const parsed = ContactInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error), fields: fieldErrors(parsed.error) };
  const db = await getDb();
  const existing = await db.select({ id: t.contacts.id }).from(t.contacts).where(eq(t.contacts.clientId, clientId)).limit(1);
  await db.insert(t.contacts).values({ ...parsed.data, clientId, isPrimary: existing.length === 0 });
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function removeContact(clientId: string, contactId: string) {
  await requireUser();
  if (!isId(clientId) || !isId(contactId)) return;
  const db = await getDb();
  await db.delete(t.contacts).where(and(eq(t.contacts.id, contactId), eq(t.contacts.clientId, clientId)));
  revalidatePath(`/clients/${clientId}`);
}
