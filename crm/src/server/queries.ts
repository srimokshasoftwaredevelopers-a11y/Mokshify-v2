/* Reads. Every function here is called only after requireUser()/requireOwner() in the page or
   action that uses it. Calendar days are Asia/Kolkata days. */
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { addDays, dayIST } from "@/lib/format";
import { DEFAULT_LOST_REASONS, DEFAULT_SOURCES, OPEN_STAGES, reminderLevel, staleReasons, type Stage } from "@/lib/rules";

/** midnight at the start of an Asia/Kolkata day, as a moment */
export const istMidnight = (day: string) => new Date(`${day}T00:00:00+05:30`);

/* ── settings ── */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  const [row] = await db.select({ value: t.settings.value }).from(t.settings).where(eq(t.settings.key, key)).limit(1);
  return (row?.value as T | undefined) ?? fallback;
}
export const getSources = () => getSetting<string[]>("sources", DEFAULT_SOURCES);
export const getLostReasons = () => getSetting<string[]>("lostReasons", DEFAULT_LOST_REASONS);

export async function listUsers() {
  const db = await getDb();
  return db.select({ id: t.users.id, name: t.users.name, role: t.users.role }).from(t.users).where(eq(t.users.active, true)).orderBy(asc(t.users.name));
}

export async function listTemplates() {
  const db = await getDb();
  return db.select().from(t.templates).orderBy(asc(t.templates.channel), asc(t.templates.sortOrder), asc(t.templates.name));
}

/* ── leads ── */
export type LeadFilters = { q?: string; status?: string; source?: string; industry?: string; owner?: string; from?: string; to?: string };

export async function listLeads(f: LeadFilters) {
  const db = await getDb();
  const where: SQL[] = [];
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, m => `\\${m}`)}%`;
    const digits = f.q.replace(/\D/g, "");
    where.push(or(
      ilike(t.leads.name, like), ilike(t.leads.company, like), ilike(t.leads.email, like),
      ...(digits.length >= 3 ? [sql`regexp_replace(coalesce(${t.leads.phone}, ''), '\\D', '', 'g') like ${`%${digits}%`}`] : []),
    )!);
  }
  if (f.status && ["new", "contacted", "qualified", "converted", "closed"].includes(f.status)) where.push(eq(t.leads.status, f.status as "new"));
  if (f.source) where.push(eq(t.leads.source, f.source));
  if (f.industry) where.push(eq(t.leads.industry, f.industry));
  if (f.owner === "none") where.push(isNull(t.leads.ownerId));
  else if (f.owner && /^[0-9a-f-]{36}$/.test(f.owner)) where.push(eq(t.leads.ownerId, f.owner));
  if (f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from)) where.push(gte(t.leads.createdAt, istMidnight(f.from)));
  if (f.to && /^\d{4}-\d{2}-\d{2}$/.test(f.to)) where.push(lt(t.leads.createdAt, istMidnight(addDays(f.to, 1))));
  return db
    .select({
      id: t.leads.id, name: t.leads.name, phone: t.leads.phone, email: t.leads.email, company: t.leads.company, city: t.leads.city,
      industry: t.leads.industry, source: t.leads.source, status: t.leads.status, createdAt: t.leads.createdAt,
      firstResponseAt: t.leads.firstResponseAt, firstResponseSeconds: t.leads.firstResponseSeconds, serviceInterest: t.leads.serviceInterest,
      ownerId: t.leads.ownerId, ownerName: t.users.name,
    })
    .from(t.leads).leftJoin(t.users, eq(t.leads.ownerId, t.users.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(t.leads.createdAt))
    .limit(300);
}

export async function leadIndustries() {
  const db = await getDb();
  const rows = await db.selectDistinct({ v: t.leads.industry }).from(t.leads).where(isNotNull(t.leads.industry)).orderBy(asc(t.leads.industry));
  return rows.map(r => r.v!).filter(Boolean);
}

export async function getLead(id: string) {
  const db = await getDb();
  const [lead] = await db.select({ lead: t.leads, ownerName: t.users.name }).from(t.leads).leftJoin(t.users, eq(t.leads.ownerId, t.users.id)).where(eq(t.leads.id, id)).limit(1);
  if (!lead) return null;
  const [activities, tasks, deals] = await Promise.all([
    timeline({ leadId: id }),
    db.select().from(t.tasks).where(eq(t.tasks.leadId, id)).orderBy(asc(t.tasks.done), asc(t.tasks.dueAt)),
    db.select({ id: t.deals.id, title: t.deals.title, stage: t.deals.stage, value: t.deals.value }).from(t.deals).where(eq(t.deals.leadId, id)),
  ]);
  return { ...lead.lead, ownerName: lead.ownerName, activities, tasks, deals };
}

/** one timeline: every activity linked to any of the given records, newest first */
export async function timeline(ids: { leadId?: string; dealId?: string; clientId?: string; projectId?: string; leadIds?: string[]; dealIds?: string[]; projectIds?: string[] }) {
  const db = await getDb();
  const conds: SQL[] = [];
  if (ids.leadId) conds.push(eq(t.activities.leadId, ids.leadId));
  if (ids.dealId) conds.push(eq(t.activities.dealId, ids.dealId));
  if (ids.clientId) conds.push(eq(t.activities.clientId, ids.clientId));
  if (ids.projectId) conds.push(eq(t.activities.projectId, ids.projectId));
  if (ids.leadIds?.length) conds.push(inArray(t.activities.leadId, ids.leadIds));
  if (ids.dealIds?.length) conds.push(inArray(t.activities.dealId, ids.dealIds));
  if (ids.projectIds?.length) conds.push(inArray(t.activities.projectId, ids.projectIds));
  if (!conds.length) return [];
  return db
    .select({ id: t.activities.id, kind: t.activities.kind, body: t.activities.body, occurredAt: t.activities.occurredAt, userName: t.users.name })
    .from(t.activities).leftJoin(t.users, eq(t.activities.userId, t.users.id))
    .where(or(...conds)).orderBy(desc(t.activities.occurredAt)).limit(200);
}

/* ── Today ── */
export async function todayData() {
  const db = await getDb();
  const now = new Date();
  const today = dayIST(now);
  const endOfToday = istMidnight(addDays(today, 1));
  const monthStart = istMidnight(`${today.slice(0, 7)}-01`);

  const [replyNow, dueTasks, nextActions, openDeals, money, renewals, figures] = await Promise.all([
    db.select({ id: t.leads.id, name: t.leads.name, phone: t.leads.phone, email: t.leads.email, company: t.leads.company, serviceInterest: t.leads.serviceInterest, source: t.leads.source, createdAt: t.leads.createdAt, ownerName: t.users.name })
      .from(t.leads).leftJoin(t.users, eq(t.leads.ownerId, t.users.id))
      .where(and(isNull(t.leads.firstResponseAt), ne(t.leads.status, "closed")))
      .orderBy(asc(t.leads.createdAt)).limit(30),
    db.select({ id: t.tasks.id, title: t.tasks.title, dueAt: t.tasks.dueAt, done: t.tasks.done, leadId: t.tasks.leadId, dealId: t.tasks.dealId, clientId: t.tasks.clientId, projectId: t.tasks.projectId, ownerName: t.users.name })
      .from(t.tasks).leftJoin(t.users, eq(t.tasks.ownerId, t.users.id))
      .where(and(eq(t.tasks.done, false), lt(t.tasks.dueAt, endOfToday)))
      .orderBy(asc(t.tasks.dueAt)).limit(50),
    db.select({ id: t.deals.id, title: t.deals.title, nextAction: t.deals.nextAction, nextActionDate: t.deals.nextActionDate, value: t.deals.value, stage: t.deals.stage })
      .from(t.deals).where(and(inArray(t.deals.stage, OPEN_STAGES), lte(t.deals.nextActionDate, today)))
      .orderBy(asc(t.deals.nextActionDate)).limit(50),
    db.select({ id: t.deals.id, title: t.deals.title, stage: t.deals.stage, value: t.deals.value, lastActivityAt: t.deals.lastActivityAt, stageChangedAt: t.deals.stageChangedAt, nextAction: t.deals.nextAction, nextActionDate: t.deals.nextActionDate })
      .from(t.deals).where(inArray(t.deals.stage, OPEN_STAGES)),
    db.select({ id: t.payments.id, milestone: t.payments.milestone, amount: t.payments.amount, dueDate: t.payments.dueDate, projectId: t.projects.id, projectName: t.projects.name, clientName: t.clients.businessName })
      .from(t.payments).innerJoin(t.projects, eq(t.payments.projectId, t.projects.id)).innerJoin(t.clients, eq(t.projects.clientId, t.clients.id))
      .where(and(eq(t.payments.status, "due"), lte(t.payments.dueDate, addDays(today, 7))))
      .orderBy(asc(t.payments.dueDate)),
    db.select({ id: t.renewals.id, item: t.renewals.item, label: t.renewals.label, provider: t.renewals.provider, amount: t.renewals.amount, renewalDate: t.renewals.renewalDate, reminderDays: t.renewals.reminderDays, clientId: t.clients.id, clientName: t.clients.businessName })
      .from(t.renewals).innerJoin(t.clients, eq(t.renewals.clientId, t.clients.id))
      .where(and(eq(t.renewals.status, "active"), lte(t.renewals.renewalDate, addDays(today, 30))))
      .orderBy(asc(t.renewals.renewalDate)),
    headlineFigures(now, monthStart),
  ]);

  const waiting = openDeals
    .map(d => ({ ...d, reasons: staleReasons({ stage: d.stage as Stage, lastActivityAt: d.lastActivityAt, stageChangedAt: d.stageChangedAt }, now) }))
    .filter(d => d.reasons.length)
    .sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime());
  const moneyRows = money.map(p => ({ ...p, overdue: !!p.dueDate && p.dueDate < today }));
  return {
    today, replyNow, dueTasks, nextActions, waiting,
    money: moneyRows,
    moneyTotals: { overdue: moneyRows.filter(p => p.overdue).reduce((s, p) => s + p.amount, 0), week: moneyRows.filter(p => !p.overdue).reduce((s, p) => s + p.amount, 0) },
    renewals: renewals.map(r => ({ ...r, level: reminderLevel(r.renewalDate, today, r.reminderDays) })),
    figures,
  };
}

export async function headlineFigures(now: Date, monthStart: Date) {
  const db = await getDb();
  const d30 = new Date(now.getTime() - 30 * 86_400_000), d90 = new Date(now.getTime() - 90 * 86_400_000);
  const [[open], [won], [reply], [rate]] = await Promise.all([
    db.select({ v: sql<number>`coalesce(sum(${t.deals.value}), 0)::int`, n: sql<number>`count(*)::int` }).from(t.deals).where(inArray(t.deals.stage, OPEN_STAGES)),
    db.select({ v: sql<number>`coalesce(sum(${t.deals.value}), 0)::int`, n: sql<number>`count(*)::int` }).from(t.deals).where(and(eq(t.deals.stage, "won"), gte(t.deals.closedAt, monthStart))),
    db.select({ v: sql<number | null>`avg(${t.leads.firstResponseSeconds})::int`, n: sql<number>`count(${t.leads.firstResponseSeconds})::int` }).from(t.leads).where(gte(t.leads.createdAt, d30)),
    db.select({ won: sql<number>`count(*) filter (where ${t.deals.stage} = 'won')::int`, lost: sql<number>`count(*) filter (where ${t.deals.stage} = 'lost')::int` }).from(t.deals).where(gte(t.deals.closedAt, d90)),
  ]);
  return {
    openPipeline: { value: open?.v ?? 0, count: open?.n ?? 0 },
    wonThisMonth: { value: won?.v ?? 0, count: won?.n ?? 0 },
    avgFirstReply: { seconds: reply?.v ?? null, count: reply?.n ?? 0 },
    winRate: { won: rate?.won ?? 0, lost: rate?.lost ?? 0 },
  };
}
