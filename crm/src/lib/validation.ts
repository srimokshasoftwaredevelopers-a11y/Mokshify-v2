/* Zod schemas for every write. Server actions parse FormData through these; nothing reaches
   the database unvalidated. Empty strings become null. */
import { z } from "zod";

const opt = (max = 200) => z.string().trim().max(max).transform(v => (v === "" ? null : v)).nullable().optional();
const req = (label: string, max = 200) => z.string({ error: `${label} is required.` }).trim().min(1, `${label} is required.`).max(max);
export const phoneField = z.string().trim().max(30)
  .refine(v => v === "" || v.replace(/\D/g, "").length >= 10, "Enter a phone number with at least 10 digits.")
  .transform(v => (v === "" ? null : v)).nullable().optional();
export const emailField = z.string().trim().toLowerCase().max(200)
  .refine(v => v === "" || z.email().safeParse(v).success, "Enter a valid email address.")
  .transform(v => (v === "" ? null : v)).nullable().optional();
export const dayField = z.string().trim().refine(v => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a date.").transform(v => (v === "" ? null : v)).nullable().optional();
export const uuidField = z.uuid();
export const rupeeField = z.coerce.number({ error: "Enter an amount in rupees." }).int("Whole rupees only.").min(0).max(1_000_000_000);

export const QuickLead = z.object({
  name: req("Name", 120),
  phone: phoneField.refine(v => !!v, "Phone is required."),
  source: req("Source", 60),
  note: opt(300),
});

export const LeadUpdate = z.object({
  name: req("Name", 120),
  phone: phoneField,
  email: emailField,
  company: opt(160),
  city: opt(80),
  industry: opt(80),
  serviceInterest: opt(120),
  budgetRange: opt(60),
  source: req("Source", 60),
  status: z.enum(["new", "contacted", "qualified", "converted", "closed"]),
  ownerId: z.union([z.uuid(), z.literal("")]).transform(v => (v === "" ? null : v)),
});

export const ActivityInput = z.object({
  kind: z.enum(["call", "whatsapp", "email", "meeting", "note"]),
  body: opt(2000),
  leadId: z.uuid().optional(),
  dealId: z.uuid().optional(),
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
}).refine(a => a.leadId || a.dealId || a.clientId || a.projectId, "An activity belongs to a lead, deal, client or project.");

export const TaskInput = z.object({
  title: req("Task", 200),
  dueDate: dayField,
  dueTime: z.string().trim().regex(/^(\d{2}:\d{2})?$/, "Use a time.").optional(),
  leadId: z.uuid().optional(),
  dealId: z.uuid().optional(),
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
});

const openStage = z.enum(["new", "contacted", "discovery", "proposal", "negotiation"]);
const anyStage = z.enum(["new", "contacted", "discovery", "proposal", "negotiation", "won", "lost"]);
const nextStep = {
  nextAction: z.string({ error: "An open deal needs a next action." }).trim().min(1, "An open deal needs a next action.").max(200),
  nextActionDate: z.string({ error: "An open deal needs a date for its next action." }).trim().regex(/^\d{4}-\d{2}-\d{2}$/, "An open deal needs a date for its next action."),
};

export const DealCreate = z.object({
  title: req("Title", 160),
  value: rupeeField,
  stage: openStage,
  expectedCloseDate: dayField,
  leadId: z.uuid().optional(),
  clientId: z.uuid().optional(),
  ...nextStep,
});

export const DealUpdate = z.object({
  title: req("Title", 160),
  value: rupeeField,
  probability: z.coerce.number().int().min(0, "0 to 100.").max(100, "0 to 100."),
  expectedCloseDate: dayField,
  ownerId: z.union([z.uuid(), z.literal("")]).transform(v => (v === "" ? null : v)),
  nextAction: opt(200),
  nextActionDate: dayField,
});

/** moving a stage asks for the next step (open), a reason (lost) or the final value (won) */
export const StageMove = z.discriminatedUnion("to", [
  z.object({ to: openStage, ...nextStep }),
  z.object({ to: z.literal("lost"), lostReason: req("Lost reason", 80), note: opt(500) }),
  z.object({ to: z.literal("won"), value: rupeeField, projectName: opt(160) }),
]);
export type StageMoveInput = z.input<typeof StageMove>;
export { anyStage };

export const BulkAssign =z.object({ ids: z.array(z.uuid()).min(1).max(500), ownerId: z.uuid() });

/** the first problem as a sentence, for forms */
export const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Check the form.";
export const fieldErrors = (e: z.ZodError) => Object.fromEntries(e.issues.map(i => [String(i.path[0] ?? "form"), i.message]));
