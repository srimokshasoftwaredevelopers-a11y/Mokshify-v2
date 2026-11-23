import type { Metadata } from "next";
import Link from "next/link";
import { cancelRenewal, createRenewal, markRenewed } from "@/actions/renewals";
import { ActionForm } from "@/components/ActionForm";
import { DialogButton } from "@/components/DialogButton";
import { RenewalFields } from "@/components/forms";
import { Badge, EmptyState, Field, Money, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { addDays, dayIST, daysBetween, fmtDate } from "@/lib/format";
import { reminderLevel } from "@/lib/rules";
import { listClients, listRenewals } from "@/server/clients";

export const metadata: Metadata = { title: "Renewals" };
const ITEM: Record<string, string> = { domain: "Domain", hosting: "Hosting", ssl: "SSL", maintenance: "Maintenance" };

export default async function RenewalsPage() {
  await requireUser();
  const [renewals, clients] = await Promise.all([listRenewals(), listClients()]);
  const today = dayIST();
  const active = renewals.filter(r => r.status === "active");
  const soon = active.filter(r => daysBetween(today, r.renewalDate) <= 30);
  const add = clients.length ? (
    <DialogButton label="Add renewal" title="Add a renewal" icon="plus" className="btn btn-primary">
      <ActionForm action={createRenewal.bind(null, null)} submit="Add renewal"><RenewalFields clients={clients} /></ActionForm>
    </DialogButton>
  ) : null;
  return (
    <>
      <PageHeader title="Renewals" sub={`${active.length} active · ${soon.length} due in the next 30 days · ${active.reduce((s, r) => s + r.amount, 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })} a cycle`} actions={add} />
      {renewals.length ? (
        <ul className="grid grid-cols-1 gap-2">
          {renewals.map(r => {
            const left = daysBetween(today, r.renewalDate);
            const level = r.status === "active" ? reminderLevel(r.renewalDate, today, r.reminderDays) : null;
            return (
              <li key={r.id} className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${r.status !== "active" ? "opacity-60" : ""}`}>
                <span className="min-w-0">
                  <span className="block font-medium">{ITEM[r.item]}{r.label ? ` · ${r.label}` : ""}</span>
                  <span className="block text-sm text-ink-2"><Link className="hover:underline" href={`/clients/${r.clientId}?tab=renewals`}>{r.clientName}</Link>{r.provider ? ` · ${r.provider}` : ""}</span>
                </span>
                <span className="flex flex-wrap items-center gap-3">
                  {r.status !== "active" ? <Badge tone="muted">{r.status === "cancelled" ? "Cancelled" : "Renewed"}</Badge>
                    : <Badge tone={level === "overdue" || level === "3" ? "danger" : level === "14" ? "warning" : level === "30" ? "info" : "muted"}>{left < 0 ? `${-left} days overdue` : left === 0 ? "Due today" : `${left} days left`}</Badge>}
                  <span className="mono text-sm">{fmtDate(r.renewalDate)}</span>
                  {r.amount > 0 && <Money value={r.amount} className="text-sm" />}
                  {r.status === "active" && (<>
                    <DialogButton label="Mark renewed" title={`Renewed: ${ITEM[r.item]}${r.label ? ` · ${r.label}` : ""}`} className="btn btn-primary btn-sm">
                      <ActionForm action={markRenewed.bind(null, r.id)} submit="Mark renewed">
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Next renewal date" name="nextDate" type="date" required defaultValue={addDays(r.renewalDate, 365)} />
                          <Field label="Amount (₹)" name="amount" type="number" min={0} step={1} defaultValue={r.amount} />
                        </div>
                        <p className="text-xs text-ink-2">The reminders start again 30, 14 and 3 days before the new date.</p>
                      </ActionForm>
                    </DialogButton>
                    <form action={cancelRenewal.bind(null, r.id)}><button className="btn btn-quiet btn-sm text-ink-2" aria-label={`Stop tracking ${ITEM[r.item]} for ${r.clientName}`}>Stop</button></form>
                  </>)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : <EmptyState icon="renewals" title="No renewals tracked yet." body="Add each client's domain, hosting, SSL and care plan; they appear on Today 30, 14 and 3 days before they're due." action={add ?? { href: "/clients", label: "Add a client first" }} />}
    </>
  );
}
