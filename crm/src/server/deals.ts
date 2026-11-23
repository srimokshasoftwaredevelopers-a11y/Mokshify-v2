/* Deal reads. Called after requireUser(). */
import { and, asc, desc, eq, gte, inArray, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { OPEN_STAGES, staleReasons, type Stage } from "@/lib/rules";
import { timeline } from "./queries";

/** the board: every open deal, plus deals won or lost in the last 30 days */
export async function boardDeals() {
  const db = await getDb();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const rows = await db
    .select({
      id: t.deals.id, title: t.deals.title, stage: t.deals.stage, value: t.deals.value, nextAction: t.deals.nextAction,
      nextActionDate: t.deals.nextActionDate, lastActivityAt: t.deals.lastActivityAt, stageChangedAt: t.deals.stageChangedAt,
      lostReason: t.deals.lostReason, ownerName: t.users.name, leadName: t.leads.name, leadCompany: t.leads.company, clientName: t.clients.businessName,
    })
    .from(t.deals)
    .leftJoin(t.users, eq(t.deals.ownerId, t.users.id))
    .leftJoin(t.leads, eq(t.deals.leadId, t.leads.id))
    .leftJoin(t.clients, eq(t.deals.clientId, t.clients.id))
    .where(or(inArray(t.deals.stage, OPEN_STAGES), and(inArray(t.deals.stage, ["won", "lost"]), gte(t.deals.closedAt, since))))
    .orderBy(asc(t.deals.nextActionDate), desc(t.deals.value));
  const now = new Date();
  return rows.map(d => ({
    ...d,
    who: d.clientName ?? d.leadCompany ?? d.leadName ?? null,
    stale: staleReasons({ stage: d.stage as Stage, lastActivityAt: d.lastActivityAt, stageChangedAt: d.stageChangedAt }, now),
    idleDays: Math.floor((now.getTime() - d.lastActivityAt.getTime()) / 86_400_000),
  }));
}
export type BoardDeal = Awaited<ReturnType<typeof boardDeals>>[number];

export async function getDeal(id: string) {
  const db = await getDb();
  const [row] = await db.select({ deal: t.deals, ownerName: t.users.name }).from(t.deals).leftJoin(t.users, eq(t.deals.ownerId, t.users.id)).where(eq(t.deals.id, id)).limit(1);
  if (!row) return null;
  const d = row.deal;
  const [lead, client, project, tasks, activities] = await Promise.all([
    d.leadId ? db.select().from(t.leads).where(eq(t.leads.id, d.leadId)).limit(1).then(r => r[0] ?? null) : null,
    d.clientId ? db.select().from(t.clients).where(eq(t.clients.id, d.clientId)).limit(1).then(r => r[0] ?? null) : null,
    db.select({ id: t.projects.id, name: t.projects.name, status: t.projects.status }).from(t.projects).where(eq(t.projects.dealId, id)).limit(1).then(r => r[0] ?? null),
    db.select().from(t.tasks).where(eq(t.tasks.dealId, id)).orderBy(asc(t.tasks.done), asc(t.tasks.dueAt)),
    timeline({ dealId: id, ...(d.leadId ? { leadIds: [d.leadId] } : {}) }),
  ]);
  return { ...d, ownerName: row.ownerName, lead, client, project, tasks, activities, stale: staleReasons({ stage: d.stage as Stage, lastActivityAt: d.lastActivityAt, stageChangedAt: d.stageChangedAt }, new Date()) };
}
