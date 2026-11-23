/* Reads for clients, projects, payments and renewals. Called after requireUser(). */
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { dayIST } from "@/lib/format";
import { balance } from "@/lib/rules";
import { timeline } from "./queries";

const received = sql<number>`coalesce((select sum(p.amount) from payments p where p.project_id = "projects"."id" and p.status = 'received'), 0)::int`;
const overdueDue = (today: string) => sql<number>`coalesce((select sum(p.amount) from payments p where p.project_id = "projects"."id" and p.status = 'due' and p.due_date < ${today}), 0)::int`;

export async function listClients(q?: string) {
  const db = await getDb();
  const like = q ? `%${q.replace(/[%_\\]/g, m => `\\${m}`)}%` : null;
  return db.select({
    id: t.clients.id, businessName: t.clients.businessName, industry: t.clients.industry, phone: t.clients.phone, address: t.clients.address,
    projects: sql<number>`(select count(*) from projects p where p.client_id = "clients"."id")::int`,
    agreed: sql<number>`coalesce((select sum(p.agreed_amount) from projects p where p.client_id = "clients"."id"), 0)::int`,
    received: sql<number>`coalesce((select sum(x.amount) from payments x join projects p on p.id = x.project_id where p.client_id = "clients"."id" and x.status = 'received'), 0)::int`,
    nextRenewal: sql<string | null>`(select min(r.renewal_date)::text from renewals r where r.client_id = "clients"."id" and r.status = 'active')`,
  }).from(t.clients)
    .where(like ? or(ilike(t.clients.businessName, like), ilike(t.clients.phone, like), ilike(t.clients.email, like)) : undefined)
    .orderBy(asc(t.clients.businessName)).limit(300);
}

export async function getClient(id: string) {
  const db = await getDb();
  const [client] = await db.select().from(t.clients).where(eq(t.clients.id, id)).limit(1);
  if (!client) return null;
  const [contacts, projects, renewals, deals, leads] = await Promise.all([
    db.select().from(t.contacts).where(eq(t.contacts.clientId, id)).orderBy(desc(t.contacts.isPrimary), asc(t.contacts.name)),
    db.select({ id: t.projects.id, name: t.projects.name, status: t.projects.status, agreedAmount: t.projects.agreedAmount, dueDate: t.projects.dueDate, liveUrl: t.projects.liveUrl, received })
      .from(t.projects).where(eq(t.projects.clientId, id)).orderBy(desc(t.projects.createdAt)),
    db.select().from(t.renewals).where(eq(t.renewals.clientId, id)).orderBy(asc(t.renewals.renewalDate)),
    db.select({ id: t.deals.id, title: t.deals.title, stage: t.deals.stage, value: t.deals.value }).from(t.deals).where(eq(t.deals.clientId, id)).orderBy(desc(t.deals.createdAt)),
    db.select({ id: t.leads.id }).from(t.leads).where(eq(t.leads.clientId, id)),
  ]);
  const projectIds = projects.map(p => p.id);
  const [payments, activity] = await Promise.all([
    projectIds.length
      ? db.select({ id: t.payments.id, milestone: t.payments.milestone, amount: t.payments.amount, dueDate: t.payments.dueDate, receivedDate: t.payments.receivedDate, method: t.payments.method, status: t.payments.status, projectId: t.payments.projectId, projectName: t.projects.name })
        .from(t.payments).innerJoin(t.projects, eq(t.payments.projectId, t.projects.id)).where(inArray(t.payments.projectId, projectIds)).orderBy(asc(t.payments.dueDate))
      : Promise.resolve([]),
    timeline({ clientId: id, projectIds, dealIds: deals.map(d => d.id), leadIds: leads.map(l => l.id) }),
  ]);
  return { client, contacts, projects, renewals, deals, payments, activity };
}

export async function listProjects(status?: string) {
  const db = await getDb();
  const today = dayIST();
  const valid = ["advance_pending", "in_build", "client_review", "delivered", "maintenance"];
  return db.select({
    id: t.projects.id, name: t.projects.name, status: t.projects.status, agreedAmount: t.projects.agreedAmount, dueDate: t.projects.dueDate,
    showOnWebsite: t.projects.showOnWebsite, liveUrl: t.projects.liveUrl, clientId: t.clients.id, clientName: t.clients.businessName,
    received, overdue: overdueDue(today),
  }).from(t.projects).innerJoin(t.clients, eq(t.projects.clientId, t.clients.id))
    .where(status && valid.includes(status) ? eq(t.projects.status, status as "in_build") : undefined)
    .orderBy(asc(sql`case ${t.projects.status} when 'advance_pending' then 0 when 'in_build' then 1 when 'client_review' then 2 when 'delivered' then 3 else 4 end`), asc(t.projects.dueDate));
}

export async function getProject(id: string) {
  const db = await getDb();
  const [row] = await db.select({ project: t.projects, clientName: t.clients.businessName }).from(t.projects).innerJoin(t.clients, eq(t.projects.clientId, t.clients.id)).where(eq(t.projects.id, id)).limit(1);
  if (!row) return null;
  const [payments, tasks, activity, renewals] = await Promise.all([
    db.select().from(t.payments).where(eq(t.payments.projectId, id)).orderBy(asc(sql`case ${t.payments.status} when 'cancelled' then 1 else 0 end`), asc(t.payments.dueDate), asc(t.payments.createdAt)),
    db.select().from(t.tasks).where(eq(t.tasks.projectId, id)).orderBy(asc(t.tasks.done), asc(t.tasks.dueAt)),
    timeline({ projectId: id, ...(row.project.dealId ? { dealIds: [row.project.dealId] } : {}) }),
    db.select().from(t.renewals).where(and(eq(t.renewals.projectId, id), ne(t.renewals.status, "cancelled"))).orderBy(asc(t.renewals.renewalDate)),
  ]);
  return { ...row.project, clientName: row.clientName, payments, tasks, activity, renewals, money: balance(row.project.agreedAmount, payments) };
}

export async function listRenewals() {
  const db = await getDb();
  return db.select({
    id: t.renewals.id, item: t.renewals.item, label: t.renewals.label, provider: t.renewals.provider, amount: t.renewals.amount,
    renewalDate: t.renewals.renewalDate, reminderDays: t.renewals.reminderDays, status: t.renewals.status, clientId: t.clients.id, clientName: t.clients.businessName,
  }).from(t.renewals).innerJoin(t.clients, eq(t.renewals.clientId, t.clients.id))
    .orderBy(asc(sql`case ${t.renewals.status} when 'active' then 0 else 1 end`), asc(t.renewals.renewalDate));
}
