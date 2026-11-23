/* Formatting: Indian rupees, dates as "23 Nov 2026", times in Asia/Kolkata. Pure functions. */
export const TZ = "Asia/Kolkata";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
/** ₹4,20,000 */
export function rupees(n: number | null | undefined): string {
  return inr.format(Math.round(n ?? 0));
}

const trim = (x: number, digits: number) => x.toFixed(digits).replace(/\.0+$|(\.\d*?)0+$/, "$1");
/** Short form for cards: ₹85K, ₹4.2L, ₹1.25Cr */
export function rupeesShort(n: number | null | undefined): string {
  const v = Math.round(n ?? 0), a = Math.abs(v), sign = v < 0 ? "-" : "";
  if (a >= 1_00_00_000) return `${sign}₹${trim(a / 1_00_00_000, 2)}Cr`;
  if (a >= 1_00_000) return `${sign}₹${trim(a / 1_00_000, a >= 10_00_000 ? 1 : 1)}L`;
  if (a >= 1_000) return `${sign}₹${trim(a / 1_000, a >= 10_000 ? 0 : 1)}K`;
  return `${sign}₹${a}`;
}

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const dayFmtUtc = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });
const isoDay = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ });

/** "23 Nov 2026" from a moment (shown in Asia/Kolkata) or a calendar date "2026-11-23" */
export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return dayFmtUtc.format(new Date(`${d}T00:00:00Z`));
  return dayFmt.format(typeof d === "string" ? new Date(d) : d);
}
/** "4:05 pm" in Asia/Kolkata */
export function fmtTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  return timeFmt.format(typeof d === "string" ? new Date(d) : d).replace(/\s?([ap])\.?m\.?/i, (_, x: string) => ` ${x.toLowerCase()}m`);
}
export function fmtDateTime(d: Date | string | null | undefined): string {
  return d ? `${fmtDate(d)}, ${fmtTime(d)}` : "—";
}

/** The calendar day in Asia/Kolkata, "YYYY-MM-DD" */
export function dayIST(d: Date = new Date()): string {
  return isoDay.format(d);
}
export function addDays(day: string, n: number): string {
  const t = new Date(`${day}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}
/** whole days from `from` to `to` (calendar dates) */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** 42s · 4m 12s · 2h 05m · 3d 4h */
export function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
  return `${Math.floor(s / 86_400)}d ${Math.floor((s % 86_400) / 3600)}h`;
}

/** Indian mobile numbers to +91 98765 43210 for display; anything else as entered */
export function fmtPhone(p: string | null | undefined): string {
  if (!p) return "";
  const d = p.replace(/\D/g, "");
  const ten = d.length === 12 && d.startsWith("91") ? d.slice(2) : d.length === 10 ? d : null;
  return ten ? `+91 ${ten.slice(0, 5)} ${ten.slice(5)}` : p.trim();
}
/** digits for wa.me and tel: (+91 assumed for 10-digit numbers) */
export function phoneDigits(p: string | null | undefined): string {
  const d = (p ?? "").replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
}
