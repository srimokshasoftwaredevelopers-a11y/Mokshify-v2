"use server";
/* Settings — every action here is owner-only, checked on the server. */
import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { audit } from "@/lib/audit";
import { hashPassword, requireOwner } from "@/lib/auth";
import { emailField, firstIssue } from "@/lib/validation";
import { findPerson, staleLeads, getSetting } from "@/server/queries";
import type { Result } from "@/components/ActionForm";

const isId = (v: string) => /^[0-9a-f-]{36}$/.test(v);
const done = (message = "Saved."): Result => { revalidatePath("/settings"); return { ok: true, message }; };

const NewUser = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  role: z.enum(["owner", "staff"]),
  password: z.string().min(12, "Use at least 12 characters.").max(200),
});

export async function addUser(_prev: Result, form: FormData): Promise<Result> {
  const me = await requireOwner();
  const parsed = NewUser.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const db = await getDb();
  const [exists] = await db.select({ id: t.users.id }).from(t.users).where(sql`lower(${t.users.email}) = ${parsed.data.email}`).limit(1);
  if (exists) return { error: "Someone already uses that email." };
  const [u] = await db.insert(t.users).values({ name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) }).returning({ id: t.users.id });
  await audit("user_create", { actorId: me.id, entity: "user", entityId: u!.id, meta: { role: parsed.data.role } });
  return done("Added. Share the password with them privately; they can't change it themselves yet.");
}

async function owners() {
  const db = await getDb();
  return db.select({ id: t.users.id }).from(t.users).where(and(eq(t.users.role, "owner"), eq(t.users.active, true)));
}

export async function setRole(userId: string, role: "owner" | "staff") {
  const me = await requireOwner();
  if (!isId(userId) || !["owner", "staff"].includes(role)) return;
  if (userId === me.id && role === "staff") return;                       // never demote yourself
  const db = await getDb();
  await db.update(t.users).set({ role }).where(eq(t.users.id, userId));
  await audit("role_change", { actorId: me.id, entity: "user", entityId: userId, meta: { role } });
  revalidatePath("/settings");
}

export async function setActive(userId: string, active: boolean) {
  const me = await requireOwner();
  if (!isId(userId) || userId === me.id) return;                          // never lock yourself out
  const db = await getDb();
  if (!active) {
    const o = await owners();
    if (o.length === 1 && o[0]!.id === userId) return;                    // always keep one active owner
    await db.delete(t.sessions).where(eq(t.sessions.userId, userId));     // signed out everywhere, now
  }
  await db.update(t.users).set({ active }).where(eq(t.users.id, userId));
  await audit("user_update", { actorId: me.id, entity: "user", entityId: userId, meta: { active } });
  revalidatePath("/settings");
}

export async function resetPassword(userId: string, _prev: Result, form: FormData): Promise<Result> {
  const me = await requireOwner();
  if (!isId(userId)) return { error: "Unknown user." };
  const pw = String(form.get("password") ?? "");
  if (pw.length < 12) return { error: "Use at least 12 characters." };
  const db = await getDb();
  await db.update(t.users).set({ passwordHash: await hashPassword(pw), failedLogins: 0, lockedUntil: null }).where(eq(t.users.id, userId));
  await db.delete(t.sessions).where(eq(t.sessions.userId, userId));
  await audit("user_update", { actorId: me.id, entity: "user", entityId: userId, meta: { passwordReset: true } });
  return done("Password changed; their sessions are signed out.");
}

const lines = (v: FormDataEntryValue | null) => [...new Set(String(v ?? "").split(/\r?\n/).map(s => s.trim()).filter(Boolean))].slice(0, 20).map(s => s.slice(0, 60));

export async function saveLists(_prev: Result, form: FormData): Promise<Result> {
  const me = await requireOwner();
  const sources = lines(form.get("sources")), lostReasons = lines(form.get("lostReasons"));
  if (!sources.length || !lostReasons.length) return { error: "Keep at least one source and one lost reason." };
  const db = await getDb();
  for (const [key, value] of [["sources", sources], ["lostReasons", lostReasons]] as const) {
    await db.insert(t.settings).values({ key, value }).onConflictDoUpdate({ target: t.settings.key, set: { value } });
  }
  await audit("settings_change", { actorId: me.id, entity: "settings", entityId: "lists" });
  revalidatePath("/leads"); revalidatePath("/pipeline");
  return done();
}

const General = z.object({
  notificationEmail: emailField,
  retentionDays: z.coerce.number().int().min(90, "Keep leads at least 90 days.").max(3650),
  name: z.string().trim().min(1).max(120), city: z.string().trim().max(80), phone: z.string().trim().max(30),
  email: z.string().trim().max(200), website: z.string().trim().max(200), gstin: z.string().trim().toUpperCase().max(15),
});

export async function saveGeneral(_prev: Result, form: FormData): Promise<Result> {
  const me = await requireOwner();
  const parsed = General.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { notificationEmail, retentionDays, ...business } = parsed.data;
  const db = await getDb();
  const set = async (key: string, value: unknown) => db.insert(t.settings).values({ key, value }).onConflictDoUpdate({ target: t.settings.key, set: { value } });
  await set("notificationEmail", notificationEmail ?? "");
  await set("retentionDays", retentionDays);
  await set("business", { ...business, gstin: business.gstin || null });
  await audit("settings_change", { actorId: me.id, entity: "settings", entityId: "general" });
  return done();
}

const Template = z.object({
  channel: z.enum(["whatsapp", "email"]),
  name: z.string().trim().min(1, "Name the template.").max(60),
  subject: z.string().trim().max(160).optional(),
  body: z.string().trim().min(1, "Write the message.").max(2000),
});

export async function saveTemplate(id: string | null, _prev: Result, form: FormData): Promise<Result> {
  await requireOwner();
  const parsed = Template.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const db = await getDb();
  const v = { ...parsed.data, subject: parsed.data.channel === "email" ? parsed.data.subject || null : null };
  if (id && isId(id)) await db.update(t.templates).set(v).where(eq(t.templates.id, id));
  else await db.insert(t.templates).values({ ...v, sortOrder: 99 });
  return done(id ? "Saved." : "Template added.");
}

export async function deleteTemplate(id: string) {
  const me = await requireOwner();
  if (!isId(id)) return;
  const db = await getDb();
  await db.delete(t.templates).where(eq(t.templates.id, id));
  await audit("delete", { actorId: me.id, entity: "template", entityId: id });
  revalidatePath("/settings");
}

/** delete one person's data: their leads (with timeline and tasks) and contact entries; on client
    records their phone and email are cleared (invoicing history stays) */
export async function deletePerson(q: string) {
  const me = await requireOwner();
  const found = await findPerson(q);
  if (!found) return;
  const db = await getDb();
  await db.transaction(async tx => {
    if (found.leads.length) await tx.delete(t.leads).where(inArray(t.leads.id, found.leads.map(l => l.id)));
    if (found.contacts.length) await tx.delete(t.contacts).where(inArray(t.contacts.id, found.contacts.map(c => c.id)));
    if (found.clients.length) await tx.update(t.clients).set({ phone: null, email: null }).where(inArray(t.clients.id, found.clients.map(c => c.id)));
  });
  await audit("data_delete", { actorId: me.id, entity: "person", meta: { leads: found.leads.length, contacts: found.contacts.length, clientsCleared: found.clients.length } });
  revalidatePath("/settings"); revalidatePath("/leads"); revalidatePath("/today");
}

/** delete the leads flagged by the retention rule (older than the period, never a deal or client) */
export async function deleteStaleLeads() {
  const me = await requireOwner();
  const days = await getSetting<number>("retentionDays", 365);
  const stale = await staleLeads(days);
  if (!stale.length) return;
  const db = await getDb();
  await db.delete(t.leads).where(and(inArray(t.leads.id, stale.map(s => s.id)), ne(t.leads.status, "converted")));
  await audit("data_delete", { actorId: me.id, entity: "lead", meta: { retentionDays: days, leads: stale.length } });
  revalidatePath("/settings"); revalidatePath("/leads");
}
