/* Reports. Every report takes an Asia/Kolkata date range and returns plain rows — the same rows
   draw the chart, fill the table view and become the CSV export. Called after requireUser(). */
import { and, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { addDays, dayIST } from "@/lib/format";
import { istMidnight } from "./queries";

export type Range = { from: string; to: string };
export type Row = Record<string, string | number | null>;

export function parseRange(sp: { from?: string; to?: string; preset?: string }): Range & { preset: string } {
  const today = dayIST();
  const presets: Record<string, number> = { "30d": 30, "90d": 90, "12m": 365 };
  const valid = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (valid(sp.from) && valid(sp.to) && sp.from! <= sp.to!) return { from: sp.from!, to: sp.to!, preset: "custom" };
  const preset = sp.preset && presets[sp.preset] ? sp.preset : "90d";
  return { from: addDays(today, -(presets[preset]! - 1)), to: today, preset };
}
const window = (r: Range) => ({ start: istMidnight(r.from), end: istMidnight(addDays(r.to, 1)) });
const IST = sql.raw(`'Asia/Kolkata'`);

export async function leadsBySource(r: Range): Promise<Row[]> {
  const db = await getDb(); const w = window(r);
  return db.select({ source: t.leads.source, leads: sql<number>`count(*)::int` }).from(t.leads)
    .where(and(gte(t.leads.createdAt, w.start), lt(t.leads.createdAt, w.end))).groupBy(t.leads.source).orderBy(sql`2 desc`);
}

export async function leadsByIndustry(r: Range): Promise<Row[]> {
  const db = await getDb(); const w = window(r);
  return db.select({ industry: sql<string>`coalesce(${t.leads.industry}, 'Not set')`, leads: sql<number>`count(*)::int` }).from(t.leads)
    .where(and(gte(t.leads.createdAt, w.start), lt(t.leads.createdAt, w.end))).groupBy(sql`1`).orderBy(sql`2 desc`);
}

/** how far deals got: the furthest stage each deal reached, from its stage moves (audit log) and its current stage */
export async function funnel(r: Range): Promise<Row[]> {
  const db = await getDb(); const w = window(r);
  const ORDER = ["new", "contacted", "discovery", "proposal", "negotiation", "won"];
  const [[leads], deals] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(t.leads).where(and(gte(t.leads.createdAt, w.start), lt(t.leads.createdAt, w.end))),
    db.select({ id: t.deals.id, stage: t.deals.stage }).from(t.deals).where(and(gte(t.deals.createdAt, w.start), lt(t.deals.createdAt, w.end))),
  ]);
  const ids = deals.map(d => d.id);
  const moves = ids.length ? await db.select({ id: t.auditLog.entityId, meta: t.auditLog.meta }).from(t.auditLog)
    .where(and(eq(t.auditLog.action, "stage_change"), inArray(t.auditLog.entityId, ids))) : [];
  const reached = new Map<string, number>();
  for (const d of deals) reached.set(d.id, d.stage === "lost" ? 0 : ORDER.indexOf(d.stage));
  for (const m of moves) {
    const meta = (m.meta ?? {}) as { from?: string; to?: string };
    const best = Math.max(ORDER.indexOf(meta.from ?? ""), ORDER.indexOf(meta.to ?? ""));
    if (m.id && best > (reached.get(m.id) ?? 0)) reached.set(m.id, best);
  }
  const at = (i: number) => [...reached.values()].filter(v => v >= i).length;
  const steps: [string, number][] = [["Leads", leads?.n ?? 0], ["Deals", deals.length], ["Contacted", at(1)], ["Discovery call", at(2)], ["Proposal sent", at(3)], ["Negotiation", at(4)], ["Won", at(5)]];
  return steps.map(([stage, count], i) => {
    const prev = i ? steps[i - 1]![1] : null;
    return { stage, count, kept: prev ? `${Math.round((count / prev) * 100)}%` : "—", dropped: prev !== null ? Math.max(0, prev - count) : null };
  });
}

/** average first-reply time per week (Monday start), for leads that arrived in the range */
export async function replyTrend(r: Range): Promise<Row[]> {
  const db = await getDb(); const w = window(r);
  const week = sql<string>`to_char(date_trunc('week', ${t.leads.createdAt} at time zone ${IST}), 'YYYY-MM-DD')`;
  return db.select({ week, avg_seconds: sql<number>`round(avg(${t.leads.firstResponseSeconds}))::int`, replied: sql<number>`count(${t.leads.firstResponseSeconds})::int`, leads: sql<number>`count(*)::int` })
    .from(t.leads).where(and(gte(t.leads.createdAt, w.start), lt(t.leads.createdAt, w.end))).groupBy(sql`1`).orderBy(sql`1`);
}

export async function wonLostByMonth(r: Range): Promise<Row[]> {
  const db = await getDb(); const w = window(r);
  const month = sql<string>`to_char(${t.deals.closedAt} at time zone ${IST}, 'YYYY-MM')`;
  return db.select({
    month, won: sql<number>`count(*) filter (where ${t.deals.stage} = 'won')::int`, won_value: sql<number>`coalesce(sum(${t.deals.value}) filter (where ${t.deals.stage} = 'won'), 0)::int`,
    lost: sql<number>`count(*) filter (where ${t.deals.stage} = 'lost')::int`, lost_value: sql<number>`coalesce(sum(${t.deals.value}) filter (where ${t.deals.stage} = 'lost'), 0)::int`,
  }).from(t.deals).where(and(inArray(t.deals.stage, ["won", "lost"]), isNotNull(t.deals.closedAt), gte(t.deals.closedAt, w.start), lt(t.deals.closedAt, w.end))).groupBy(sql`1`).orderBy(sql`1`);
}

export async function lostReasons(r: Range): Promise<Row[]> {
  const db = await getDb(); const w = window(r);
  return db.select({ reason: sql<string>`coalesce(${t.deals.lostReason}, 'Not given')`, deals: sql<number>`count(*)::int`, value: sql<number>`coalesce(sum(${t.deals.value}), 0)::int` })
    .from(t.deals).where(and(eq(t.deals.stage, "lost"), gte(t.deals.closedAt, w.start), lt(t.deals.closedAt, w.end))).groupBy(sql`1`).orderBy(sql`2 desc`);
}

export async function revenueByMonth(r: Range): Promise<Row[]> {
  const db = await getDb();
  const month = sql<string>`to_char(${t.payments.receivedDate}, 'YYYY-MM')`;
  return db.select({ month, received: sql<number>`sum(${t.payments.amount})::int`, payments: sql<number>`count(*)::int` }).from(t.payments)
    .where(and(eq(t.payments.status, "received"), gte(t.payments.receivedDate, r.from), lt(t.payments.receivedDate, addDays(r.to, 1)))).groupBy(sql`1`).orderBy(sql`1`);
}

/** outstanding right now, whatever the range: agreed − received over every project, and the overdue part */
export async function outstanding() {
  const db = await getDb();
  const [row] = await db.select({
    agreed: sql<number>`coalesce((select sum(agreed_amount) from projects), 0)::int`,
    received: sql<number>`coalesce((select sum(amount) from payments where status = 'received'), 0)::int`,
    overdue: sql<number>`coalesce((select sum(amount) from payments where status = 'due' and due_date < ${dayIST()}), 0)::int`,
  }).from(sql`(select 1) as one`);
  return { agreed: row?.agreed ?? 0, received: row?.received ?? 0, balance: (row?.agreed ?? 0) - (row?.received ?? 0), overdue: row?.overdue ?? 0 };
}

/** which website page each lead came from (path only; the query string is dropped) */
export async function leadsByPage(r: Range): Promise<Row[]> {
  const db = await getDb(); const w = window(r);
  const path = sql<string>`coalesce(nullif(regexp_replace(regexp_replace(${t.leads.sourcePageUrl}, '^https?://[^/]+', ''), '[?#].*$', ''), ''), '/')`;
  return db.select({ page: path, leads: sql<number>`count(*)::int` }).from(t.leads)
    .where(and(isNotNull(t.leads.sourcePageUrl), gte(t.leads.createdAt, w.start), lt(t.leads.createdAt, w.end))).groupBy(sql`1`).orderBy(sql`2 desc`);
}

export const REPORTS = {
  "leads-by-source": { title: "Leads by source", get: leadsBySource },
  "leads-by-industry": { title: "Leads by industry", get: leadsByIndustry },
  funnel: { title: "Funnel", get: funnel },
  "reply-time": { title: "First-reply time by week", get: replyTrend },
  "won-lost": { title: "Won and lost by month", get: wonLostByMonth },
  "lost-reasons": { title: "Lost reasons", get: lostReasons },
  revenue: { title: "Revenue received by month", get: revenueByMonth },
  pages: { title: "Leads by website page", get: leadsByPage },
} as const;
export type ReportKey = keyof typeof REPORTS;

export function toCsv(rows: Row[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  // quote every cell; neutralise spreadsheet formulas (=, +, -, @ at the start)
  const cell = (v: unknown) => { let s = v === null || v === undefined ? "" : String(v); if (/^[=+\-@]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
  return [cols.map(cell).join(","), ...rows.map(r => cols.map(c => cell(r[c])).join(","))].join("\r\n") + "\r\n";
}
