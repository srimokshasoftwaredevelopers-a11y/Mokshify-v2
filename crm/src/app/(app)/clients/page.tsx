import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/actions/clients";
import { ActionForm } from "@/components/ActionForm";
import { DialogButton } from "@/components/DialogButton";
import { ClientFields } from "@/components/forms";
import { Badge, EmptyState, Money, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { daysBetween, dayIST, fmtDate, fmtPhone } from "@/lib/format";
import { listClients } from "@/server/clients";

export const metadata: Metadata = { title: "Clients" };

function NewClient({ className }: { className?: string }) {
  return (
    <DialogButton label="New client" title="New client" icon="plus" className={className}>
      <ActionForm action={createClient} submit="Create client"><ClientFields /></ActionForm>
    </DialogButton>
  );
}

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser();
  const q = (await searchParams).q?.slice(0, 100) || undefined;
  const clients = await listClients(q);
  const today = dayIST();
  return (
    <>
      <PageHeader title="Clients" sub={`${clients.length} client${clients.length === 1 ? "" : "s"}`} actions={<NewClient className="btn btn-primary" />} />
      <form method="get" role="search" className="mb-5 flex gap-2">
        <label className="field flex-1"><span className="sr-only">Search clients</span><input className="input" type="search" name="q" defaultValue={q} placeholder="Search by business, phone or email" /></label>
        <button className="btn btn-ghost">Search</button>
      </form>
      {clients.length ? (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clients.map(c => {
            const due = c.agreed - c.received;
            const left = c.nextRenewal ? daysBetween(today, c.nextRenewal) : null;
            return (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`} className="card flex h-full flex-col gap-2 p-4 no-underline transition-colors duration-150 hover:border-ink/40">
                  <span className="flex items-start justify-between gap-2"><span className="font-semibold">{c.businessName}</span>{c.industry && <span className="label shrink-0">{c.industry}</span>}</span>
                  <span className="text-sm text-ink-2">{[fmtPhone(c.phone), c.address].filter(Boolean).join(" · ") || "No contact details yet"}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm">
                    <span>{c.projects} project{c.projects === 1 ? "" : "s"}</span>
                    {due > 0 ? <span>Balance <Money value={due} short className="font-semibold" /></span> : c.projects > 0 && <Badge tone="success">Paid up</Badge>}
                    {left !== null && left <= 30 && <Badge tone={left <= 3 ? "danger" : left <= 14 ? "warning" : "info"}>Renewal {fmtDate(c.nextRenewal)}</Badge>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : q ? <EmptyState icon="search" title="No client matches that." action={{ href: "/clients", label: "Clear search" }} />
        : <EmptyState icon="clients" title="No clients yet." body="A won deal becomes a client on its own. You can also add one directly." action={<NewClient className="btn btn-ghost btn-sm" />} />}
    </>
  );
}
