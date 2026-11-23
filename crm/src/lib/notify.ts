/* New-lead notification email through the SMTP settings in the environment. Without SMTP_HOST it
   is skipped. It never throws and never logs personal data: a failed email can't lose the lead. */
import { getSetting } from "@/server/queries";

export async function notifyNewLead(lead: { id: string; name: string; company?: string | null; source: string; serviceInterest?: string | null; pageUrl?: string | null }) {
  const host = process.env.SMTP_HOST;
  if (!host) return { sent: false, reason: "smtp-not-configured" as const };
  try {
    const to = process.env.NOTIFY_EMAIL || (await getSetting<string>("notificationEmail", ""));
    if (!to) return { sent: false, reason: "no-recipient" as const };
    const nodemailer = (await import("nodemailer")).default;
    const port = Number(process.env.SMTP_PORT) || 587;
    const transport = nodemailer.createTransport({
      host, port, secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    const app = (process.env.APP_URL || "").replace(/\/$/, "");
    await transport.sendMail({
      from: process.env.SMTP_FROM || "Mokshify Desk <desk@mokshify.io>",
      to,
      subject: `New enquiry: ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
      text: [`A new enquiry arrived from the ${lead.source.toLowerCase()}.`, "", `Name: ${lead.name}`, lead.company ? `Company: ${lead.company}` : "",
        lead.serviceInterest ? `Wants: ${lead.serviceInterest}` : "", lead.pageUrl ? `Page: ${lead.pageUrl}` : "", "",
        `Reply now (the timer is running): ${app}/leads/${lead.id}`].filter(l => l !== null).join("\n"),
    });
    return { sent: true as const };
  } catch {
    console.error("new-lead notification failed (lead saved; details withheld)");
    return { sent: false, reason: "send-failed" as const };
  }
}
