/* Mokshify Desk — the data model.
   Money is whole rupees (integer). Calendar dates are `date` (YYYY-MM-DD, Asia/Kolkata days);
   moments are timestamptz. Every data table carries `demo` so fictional seed data can be
   removed with one command (npm run demo:remove). */
import { sql } from "drizzle-orm";
import {
  pgTable, pgEnum, uuid, text, integer, boolean, timestamp, date, jsonb, index, uniqueIndex, check,
} from "drizzle-orm/pg-core";

export const role = pgEnum("role", ["owner", "staff"]);
export const leadStatus = pgEnum("lead_status", ["new", "contacted", "qualified", "converted", "closed"]);
export const dealStage = pgEnum("deal_stage", ["new", "contacted", "discovery", "proposal", "negotiation", "won", "lost"]);
export const projectStatus = pgEnum("project_status", ["advance_pending", "in_build", "client_review", "delivered", "maintenance"]);
export const paymentStatus = pgEnum("payment_status", ["due", "received", "cancelled"]);
export const renewalItem = pgEnum("renewal_item", ["domain", "hosting", "ssl", "maintenance"]);
export const renewalStatus = pgEnum("renewal_status", ["active", "renewed", "cancelled"]);
export const activityKind = pgEnum("activity_kind", ["call", "whatsapp", "email", "meeting", "note", "stage_change", "system"]);
export const templateChannel = pgEnum("template_channel", ["whatsapp", "email"]);

const stamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull(),
  passwordHash: text().notNull(),
  role: role().notNull().default("staff"),
  active: boolean().notNull().default(true),
  failedLogins: integer().notNull().default(0),
  lockedUntil: timestamp({ withTimezone: true }),
  lastLoginAt: timestamp({ withTimezone: true }),
  demo: boolean().notNull().default(false),
  ...stamps,
}, t => [uniqueIndex("users_email_uq").on(sql`lower(${t.email})`)]);

export const sessions = pgTable("sessions", {
  id: text().primaryKey(),                                  // sha-256 of the cookie token; the token itself is never stored
  userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  ...stamps,
}, t => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)]);

export const clients = pgTable("clients", {
  id: uuid().primaryKey().defaultRandom(),
  businessName: text().notNull(),
  phone: text(),
  email: text(),
  address: text(),
  gstin: text(),
  industry: text(),
  notes: text(),
  ownerId: uuid().references(() => users.id, { onDelete: "set null" }),
  demo: boolean().notNull().default(false),
  ...stamps,
}, t => [index("clients_name_idx").on(t.businessName), index("clients_owner_idx").on(t.ownerId)]);

export const contacts = pgTable("contacts", {
  id: uuid().primaryKey().defaultRandom(),
  clientId: uuid().notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text().notNull(),
  role: text(),
  phone: text(),
  email: text(),
  isPrimary: boolean().notNull().default(false),
  demo: boolean().notNull().default(false),
  ...stamps,
}, t => [index("contacts_client_idx").on(t.clientId)]);

export const leads = pgTable("leads", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  phone: text(),
  email: text(),
  company: text(),
  city: text(),
  industry: text(),
  serviceInterest: text(),
  budgetRange: text(),
  message: text(),
  source: text().notNull().default("Website form"),
  sourcePageUrl: text(),
  utmSource: text(),
  utmMedium: text(),
  utmCampaign: text(),
  utmTerm: text(),
  utmContent: text(),
  referrer: text(),
  consent: boolean().notNull().default(false),
  consentAt: timestamp({ withTimezone: true }),
  status: leadStatus().notNull().default("new"),
  ownerId: uuid().references(() => users.id, { onDelete: "set null" }),
  firstResponseAt: timestamp({ withTimezone: true }),
  firstResponseSeconds: integer(),                          // stored once, when the first reply is logged
  clientId: uuid().references(() => clients.id, { onDelete: "set null" }),
  demo: boolean().notNull().default(false),
  ...stamps,
}, t => [
  index("leads_status_idx").on(t.status),
  index("leads_created_idx").on(t.createdAt),
  index("leads_owner_idx").on(t.ownerId),
  index("leads_source_idx").on(t.source),
  index("leads_phone_idx").on(t.phone),
  index("leads_unreplied_idx").on(t.createdAt).where(sql`${t.firstResponseAt} is null`),
]);

export const deals = pgTable("deals", {
  id: uuid().primaryKey().defaultRandom(),
  leadId: uuid().references(() => leads.id, { onDelete: "set null" }),
  clientId: uuid().references(() => clients.id, { onDelete: "set null" }),
  title: text().notNull(),
  stage: dealStage().notNull().default("new"),
  value: integer().notNull().default(0),                    // rupees
  expectedCloseDate: date({ mode: "string" }),
  probability: integer().notNull().default(10),
  lostReason: text(),
  nextAction: text(),
  nextActionDate: date({ mode: "string" }),
  ownerId: uuid().references(() => users.id, { onDelete: "set null" }),
  stageChangedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  lastActivityAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp({ withTimezone: true }),
  demo: boolean().notNull().default(false),
  ...stamps,
}, t => [
  index("deals_stage_idx").on(t.stage),
  index("deals_owner_idx").on(t.ownerId),
  index("deals_lead_idx").on(t.leadId),
  index("deals_client_idx").on(t.clientId),
  index("deals_next_action_idx").on(t.nextActionDate),
  check("deals_value_nonneg", sql`${t.value} >= 0`),
  check("deals_probability_range", sql`${t.probability} between 0 and 100`),
  // the rule, in the database too: an open deal always has a next action and a date
  check("deals_open_has_next_step", sql`${t.stage} in ('won','lost') or (${t.nextAction} is not null and ${t.nextActionDate} is not null)`),
]);

export const projects = pgTable("projects", {
  id: uuid().primaryKey().defaultRandom(),
  clientId: uuid().notNull().references(() => clients.id, { onDelete: "restrict" }),
  dealId: uuid().references(() => deals.id, { onDelete: "set null" }),
  name: text().notNull(),
  type: text(),
  status: projectStatus().notNull().default("advance_pending"),
  agreedAmount: integer().notNull().default(0),             // rupees
  startDate: date({ mode: "string" }),
  dueDate: date({ mode: "string" }),
  liveUrl: text(),
  repoUrl: text(),
  stackNotes: text(),
  showOnWebsite: boolean().notNull().default(false),
  demo: boolean().notNull().default(false),
  ...stamps,
}, t => [index("projects_client_idx").on(t.clientId), index("projects_status_idx").on(t.status), check("projects_amount_nonneg", sql`${t.agreedAmount} >= 0`)]);

export const payments = pgTable("payments", {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid().notNull().references(() => projects.id, { onDelete: "cascade" }),
  milestone: text().notNull(),
  amount: integer().notNull(),                              // rupees
  dueDate: date({ mode: "string" }),
  receivedDate: date({ mode: "string" }),
  method: text(),
  reference: text(),
  status: paymentStatus().notNull().default("due"),
  demo: boolean().notNull().default(false),
  ...stamps,
}, t => [index("payments_project_idx").on(t.projectId), index("payments_due_idx").on(t.dueDate), index("payments_status_idx").on(t.status), check("payments_amount_pos", sql`${t.amount} > 0`)]);

export const renewals = pgTable("renewals", {
  id: uuid().primaryKey().defaultRandom(),
  clientId: uuid().notNull().references(() => clients.id, { onDelete: "cascade" }),
  projectId: uuid().references(() => projects.id, { onDelete: "set null" }),
  item: renewalItem().notNull(),
  label: text(),                                            // e.g. the domain name
  provider: text(),
  amount: integer().notNull().default(0),                   // rupees
  renewalDate: date({ mode: "string" }).notNull(),
  reminderDays: jsonb().$type<number[]>().notNull().default([30, 14, 3]),
  status: renewalStatus().notNull().default("active"),
  demo: boolean().notNull().default(false),
  ...stamps,
}, t => [index("renewals_client_idx").on(t.clientId), index("renewals_date_idx").on(t.renewalDate)]);

export const tasks = pgTable("tasks", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  dueAt: timestamp({ withTimezone: true }),
  leadId: uuid().references(() => leads.id, { onDelete: "cascade" }),
  dealId: uuid().references(() => deals.id, { onDelete: "cascade" }),
  clientId: uuid().references(() => clients.id, { onDelete: "cascade" }),
  projectId: uuid().references(() => projects.id, { onDelete: "cascade" }),
  ownerId: uuid().references(() => users.id, { onDelete: "set null" }),
  done: boolean().notNull().default(false),
  doneAt: timestamp({ withTimezone: true }),
  demo: boolean().notNull().default(false),
  ...stamps,
}, t => [index("tasks_due_idx").on(t.dueAt).where(sql`${t.done} = false`), index("tasks_owner_idx").on(t.ownerId), index("tasks_lead_idx").on(t.leadId), index("tasks_deal_idx").on(t.dealId)]);

export const activities = pgTable("activities", {
  id: uuid().primaryKey().defaultRandom(),
  kind: activityKind().notNull(),
  body: text(),
  leadId: uuid().references(() => leads.id, { onDelete: "cascade" }),
  dealId: uuid().references(() => deals.id, { onDelete: "cascade" }),
  clientId: uuid().references(() => clients.id, { onDelete: "cascade" }),
  projectId: uuid().references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid().references(() => users.id, { onDelete: "set null" }),
  occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  demo: boolean().notNull().default(false),
  ...stamps,
}, t => [
  index("activities_lead_idx").on(t.leadId, t.occurredAt),
  index("activities_deal_idx").on(t.dealId, t.occurredAt),
  index("activities_client_idx").on(t.clientId, t.occurredAt),
  index("activities_project_idx").on(t.projectId, t.occurredAt),
]);

export const templates = pgTable("templates", {
  id: uuid().primaryKey().defaultRandom(),
  channel: templateChannel().notNull(),
  name: text().notNull(),
  subject: text(),
  body: text().notNull(),                                   // placeholders: {name} {company} {service} {owner}
  sortOrder: integer().notNull().default(0),
  ...stamps,
}, t => [index("templates_channel_idx").on(t.channel, t.sortOrder)]);

export const auditLog = pgTable("audit_log", {
  id: uuid().primaryKey().defaultRandom(),
  actorId: uuid().references(() => users.id, { onDelete: "set null" }),
  action: text().notNull(),                                 // login, login_failed, export, delete, role_change, stage_change, …
  entity: text(),
  entityId: text(),
  meta: jsonb().$type<Record<string, unknown>>(),           // never personal data: ids, counts and enum values only
  ...stamps,
}, t => [index("audit_created_idx").on(t.createdAt), index("audit_actor_idx").on(t.actorId), index("audit_entity_idx").on(t.entity, t.entityId)]);

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  ...stamps,
});

export const rateLimits = pgTable("rate_limits", {
  key: text().primaryKey(),                                 // e.g. "login:ip:<sha256>" — hashed, never the raw IP
  count: integer().notNull().default(0),
  windowStart: timestamp({ withTimezone: true }).notNull().defaultNow(),
  ...stamps,
});
