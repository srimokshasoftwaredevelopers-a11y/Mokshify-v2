/* The rules that make Desk useful (CRM_SPEC.md, "THE RULES"). Pure functions, unit-tested. */
import { addDays, daysBetween, phoneDigits } from "./format";

/* ── pipeline ── */
export const STAGES = [
  { key: "new", label: "New", probability: 10 },
  { key: "contacted", label: "Contacted", probability: 20 },
  { key: "discovery", label: "Discovery call", probability: 35 },
  { key: "proposal", label: "Proposal sent", probability: 55 },
  { key: "negotiation", label: "Negotiation", probability: 75 },
  { key: "won", label: "Won", probability: 100 },
  { key: "lost", label: "Lost", probability: 0 },
] as const;
export type Stage = (typeof STAGES)[number]["key"];
export const OPEN_STAGES: Stage[] = ["new", "contacted", "discovery", "proposal", "negotiation"];
export const isOpen = (s: Stage) => OPEN_STAGES.includes(s);
export const stageLabel = (s: string) => STAGES.find(x => x.key === s)?.label ?? s;

export const PROJECT_STATUSES = [
  { key: "advance_pending", label: "Advance pending" },
  { key: "in_build", label: "In build" },
  { key: "client_review", label: "Client review" },
  { key: "delivered", label: "Delivered" },
  { key: "maintenance", label: "Maintenance" },
] as const;
export const projectStatusLabel = (s: string) => PROJECT_STATUSES.find(x => x.key === s)?.label ?? s;

export const LEAD_STATUSES = [
  { key: "new", label: "New", tone: "info" },
  { key: "contacted", label: "Contacted", tone: "warning" },
  { key: "qualified", label: "Qualified", tone: "info" },
  { key: "converted", label: "Converted", tone: "success" },
  { key: "closed", label: "Closed", tone: "muted" },
] as const;
export const leadStatus = (s: string) => LEAD_STATUSES.find(x => x.key === s) ?? LEAD_STATUSES[0];

export const DEFAULT_SOURCES =["Website form", "Estimator", "WhatsApp", "Phone call", "Referral", "Walk-in", "Other"];
export const DEFAULT_LOST_REASONS = ["Price", "Timing", "Chose another vendor", "No response", "Not a fit", "Other"];

/* ── rule 1 · speed to first reply ── */
export type TimerColour = "green" | "amber" | "red";
/** green under 5 minutes, amber under 60 minutes, red after that */
export function timerColour(elapsedSeconds: number): TimerColour {
  if (elapsedSeconds < 5 * 60) return "green";
  if (elapsedSeconds < 60 * 60) return "amber";
  return "red";
}
/** seconds from arrival to the first logged reply (never negative) */
export function responseSeconds(arrivedAt: Date, repliedAt: Date): number {
  return Math.max(0, Math.round((repliedAt.getTime() - arrivedAt.getTime()) / 1000));
}
/** activity kinds that count as a reply to a lead */
export const REPLY_KINDS = ["call", "whatsapp", "email", "meeting"] as const;

/* ── rule 3 · no open deal without a next step ── */
export function nextActionError(d: { stage: Stage; nextAction?: string | null; nextActionDate?: string | null }): string | null {
  if (!isOpen(d.stage)) return null;
  if (!d.nextAction?.trim()) return "An open deal needs a next action.";
  if (!d.nextActionDate || !/^\d{4}-\d{2}-\d{2}$/.test(d.nextActionDate)) return "An open deal needs a date for its next action.";
  return null;
}

/* ── rule 4 · nothing goes stale silently ── */
export const IDLE_DAYS = 7;
export const PROPOSAL_DAYS = 3;
export type StaleReason = "idle" | "proposal";
/** idle: no activity for 7 days; proposal: sent 3+ days ago with nothing since */
export function staleReasons(d: { stage: Stage; lastActivityAt: Date; stageChangedAt: Date }, now: Date): StaleReason[] {
  if (!isOpen(d.stage)) return [];
  const out: StaleReason[] = [];
  const day = 86_400_000;
  if (now.getTime() - d.lastActivityAt.getTime() >= IDLE_DAYS * day) out.push("idle");
  if (d.stage === "proposal") {
    const since = Math.max(d.stageChangedAt.getTime(), d.lastActivityAt.getTime());
    if (now.getTime() - since >= PROPOSAL_DAYS * day) out.push("proposal");
  }
  return out;
}

/* ── rule 5 · money is visible ── */
export function balance(agreed: number, payments: { amount: number; status: string }[]) {
  const received = payments.filter(p => p.status === "received").reduce((s, p) => s + p.amount, 0);
  return { agreed, received, balance: agreed - received };
}
export function isPaymentOverdue(p: { status: string; dueDate: string | null }, today: string): boolean {
  return p.status === "due" && !!p.dueDate && p.dueDate < today;
}

/* ── rule 6 · renewals are never missed ── */
export const REMINDER_DAYS = [30, 14, 3];
/** the calendar days on which a renewal's reminders fall */
export function reminderDates(renewalDate: string, days: number[] = REMINDER_DAYS): string[] {
  return [...days].sort((a, b) => b - a).map(n => addDays(renewalDate, -n));
}
export type ReminderLevel = "overdue" | "3" | "14" | "30";
/** which reminder is in force today (null: not yet within 30 days) */
export function reminderLevel(renewalDate: string, today: string, days: number[] = REMINDER_DAYS): ReminderLevel | null {
  const left = daysBetween(today, renewalDate);
  if (left < 0) return "overdue";
  const hit = [...days].sort((a, b) => a - b).find(n => left <= n);
  return hit === undefined ? null : (String(hit) as ReminderLevel);
}

/* ── one-tap reply ── */
export function fillTemplate(body: string, vars: Record<string, string | null | undefined>): string {
  return body.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] ?? "").trim() || "there").replace(/\s+([,.!?])/g, "$1");
}
export function waLink(phone: string | null | undefined, text = ""): string | null {
  const d = phoneDigits(phone);
  if (d.length < 10) return null;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
export function telLink(phone: string | null | undefined): string | null {
  const d = phoneDigits(phone);
  return d.length < 10 ? null : `tel:+${d}`;
}

/* ── reports ── */
export function winRate(won: number, lost: number): number | null {
  return won + lost === 0 ? null : won / (won + lost);
}
export function average(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}
