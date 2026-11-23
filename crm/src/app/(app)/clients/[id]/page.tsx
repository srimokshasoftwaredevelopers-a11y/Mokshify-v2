import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addContact, removeContact, updateClient } from "@/actions/clients";
import { createProject } from "@/actions/projects";
import { createRenewal } from "@/actions/renewals";
import { ActionForm } from "@/components/ActionForm";
import { DialogButton } from "@/components/DialogButton";
import { ClientFields, ProjectFields, RenewalFields } from "@/components/forms";
import { LogButtons } from "@/components/LogButtons";
import { NewDeal } from "@/components/NewDeal";
import { Timeline } from "@/components/Timeline";
import { Badge, EmptyState, Field, Money } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { dayIST, daysBetween, fmtDate, fmtPhone } from "@/lib/format";
import { isPaymentOverdue, projectStatusLabel, stageLabel, telLink } from "@/lib/rules";
import { getClient } from "@/server/clients";

export const metadata: Metadata = { title: "Client" };
const TABS = [["contacts", "Contacts"], ["projects", "Projects"], ["payments", "Payments"], ["renewals", "Renewals"], ["timeline", "Timeline"]] as const;
type Tab = (typeof TABS)[number][0];
const ITEM: Record<string, string> = { domain: "Domain", hosting: "Hosting", ssl: "SSL", maintenance: "Maintenance" };

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const data = await getClient(id);
  if (!data) notFound();
  const sp = await searchParams;
  const tab: Tab = (TABS.find(([k]) => k === sp.tab)?.[0]) ?? "projects";
  const { client: c, contacts, projects, payments, renewals, deals, activity } = data;
  const agreed = projects.reduce((s, p) => s + p.agreedAmount, 0), received = projects.reduce((s, p) => s + p.received, 0);
  const today = dayIST();
  const count: Record<Tab, number> = { contacts: contacts.length, projects: projects.length, payments: payments.length, renewals: renewals.length, timeline: activity.length };

  return (
    <>
      <section className="card mb-5 p-5" aria-labelledby="client-h">
        <p className="label mb-2"><Link href="/clients" className="hover:underline">Clients</Link>{c.industry ? ` / ${c.industry}` : ""}</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 id="client-h" className="text-[26px]">{c.businessName}</h1>
            <p className="text-ink-2">{[fmtPhone(c.phone), c.email, c.address].filter(Boolean).join(" · ") || "No contact details yet"}</p>
            {c.gstin && <p className="mono mt-1 text-sm text-ink-2">GSTIN {c.gstin}</p>}
          </div>
          <dl className="grid grid-cols-3 gap-4 text-right">
            <div><dt className="label">Agreed</dt><dd><Money value={agreed} short className="text-lg font-semibold" /></dd></div>
            <div><dt className="label">Received</dt><dd><Money value={received} short className="text-lg font-semibold" /></dd></div>
            <div><dt className="label">Balance</dt><dd><Money value={agreed - received} short className={`text-lg font-semibold ${agreed - received > 0 ? "text-danger" : ""}`} /></dd></div>
          </dl>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {telLink(c.phone) && <a className="btn btn-ghost btn-sm" href={telLink(c.phone)!}>Call</a>}
          <DialogButton label="Edit client" title="Edit client" className="btn btn-ghost btn-sm"><ActionForm action={updateClient.bind(null, c.id)} submit="Save"><ClientFields c={c} /></ActionForm></DialogButton>
          <DialogButton label="New project" title="New project" icon="plus" className="btn btn-ghost btn-sm"><ActionForm action={createProject.bind(null, c.id)} submit="Create project"><ProjectFields /></ActionForm></DialogButton>
          <NewDeal clientId={c.id} />
        </div>
        {c.notes && <p className="mt-4 whitespace-pre-line border-l-2 border-brass pl-3 text-sm">{c.notes}</p>}
      </section>

      <nav aria-label="Client sections" className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-rule px-4 sm:mx-0 sm:px-0">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/clients/${c.id}?tab=${k}`} aria-current={tab === k ? "page" : undefined} scroll={false}
            className={`relative shrink-0 px-3 py-3 text-[15px] no-underline ${tab === k ? "font-semibold after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:bg-brass" : "text-ink-2 hover:text-ink"}`}>
            {label} <span className="mono text-xs text-ink-2">{count[k]}</span>
          </Link>
        ))}
      </nav>

      {tab === "contacts" && (
        <div className="grid gap-3">
          {contacts.length ? <ul className="card divide-y divide-rule">{contacts.map(p => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span><span className="font-medium">{p.name}</span>{p.isPrimary && <span className="label ml-2">Primary</span>}<span className="block text-sm text-ink-2">{[p.role, fmtPhone(p.phone), p.email].filter(Boolean).join(" · ")}</span></span>
              <span className="flex gap-2">{telLink(p.phone) && <a className="btn btn-ghost btn-sm" href={telLink(p.phone)!}>Call</a>}
                <form action={removeContact.bind(null, c.id, p.id)}><button className="btn btn-quiet btn-sm text-ink-2" aria-label={`Remove ${p.name}`}>Remove</button></form></span>
            </li>))}</ul> : <EmptyState icon="user" title="No contact people yet." />}
          <DialogButton label="Add contact" title="Add a contact person" icon="plus" className="btn btn-ghost justify-self-start">
            <ActionForm action={addContact.bind(null, c.id)} submit="Add contact">
              <Field label="Name" name="name" required /><Field label="Role" name="role" placeholder="Owner, manager…" />
              <div className="grid grid-cols-2 gap-3"><Field label="Phone" name="phone" type="tel" /><Field label="Email" name="email" type="email" /></div>
            </ActionForm>
          </DialogButton>
        </div>
      )}

      {tab === "projects" && (projects.length ? (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">{projects.map(p => (
          <li key={p.id}><Link href={`/projects/${p.id}`} className="card flex flex-col gap-2 p-4 no-underline hover:border-ink/40">
            <span className="flex items-start justify-between gap-2"><span className="font-semibold">{p.name}</span><Badge tone={p.status === "delivered" || p.status === "maintenance" ? "success" : "info"}>{projectStatusLabel(p.status)}</Badge></span>
            <span className="flex flex-wrap gap-x-4 text-sm"><span>Agreed <Money value={p.agreedAmount} short /></span><span>Received <Money value={p.received} short /></span><span className={p.agreedAmount - p.received > 0 ? "text-danger" : "text-success"}>Balance <Money value={p.agreedAmount - p.received} short /></span></span>
            {p.dueDate && <span className="mono text-xs text-ink-2">Due {fmtDate(p.dueDate)}</span>}
          </Link></li>))}
        </ul>) : <EmptyState icon="projects" title="No projects yet." body="Winning a deal for this client creates its project." />)}

      {tab === "payments" && (payments.length ? (
        <div className="card overflow-x-auto"><table className="table"><thead><tr><th>Project</th><th>Milestone</th><th>Due</th><th>Status</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{payments.map(p => (
            <tr key={p.id}><td><Link className="link" href={`/projects/${p.projectId}`}>{p.projectName}</Link></td><td>{p.milestone}</td><td className="mono whitespace-nowrap">{fmtDate(p.dueDate)}</td>
              <td>{p.status === "received" ? <Badge tone="success">Received {fmtDate(p.receivedDate)}</Badge> : p.status === "cancelled" ? <Badge tone="muted">Cancelled</Badge> : isPaymentOverdue(p, today) ? <Badge tone="danger">Overdue</Badge> : <Badge tone="info">Due</Badge>}</td>
              <td className="text-right"><Money value={p.amount} /></td></tr>))}
          </tbody></table></div>) : <EmptyState icon="rupee" title="No payment milestones yet." body="Add milestones on a project page." />)}

      {tab === "renewals" && (
        <div className="grid gap-3">
          {renewals.length ? <ul className="card divide-y divide-rule">{renewals.map(r => { const left = daysBetween(today, r.renewalDate); return (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span><span className="font-medium">{ITEM[r.item]}{r.label ? ` · ${r.label}` : ""}</span><span className="block text-sm text-ink-2">{r.provider ?? "Provider not set"}</span></span>
              <span className="flex items-center gap-3">{r.status === "active" ? <Badge tone={left < 0 || left <= 3 ? "danger" : left <= 14 ? "warning" : left <= 30 ? "info" : "muted"}>{left < 0 ? `${-left} days overdue` : `${left} days left`}</Badge> : <Badge tone="muted">{r.status}</Badge>}
                <span className="mono text-sm">{fmtDate(r.renewalDate)}</span>{r.amount > 0 && <Money value={r.amount} className="text-sm" />}</span>
            </li>); })}</ul> : <EmptyState icon="renewals" title="No renewals tracked." body="Add the domain, hosting, SSL and care plan so nothing lapses." />}
          <DialogButton label="Add renewal" title="Add a renewal" icon="plus" className="btn btn-ghost justify-self-start"><ActionForm action={createRenewal.bind(null, c.id)} submit="Add renewal"><RenewalFields /></ActionForm></DialogButton>
        </div>
      )}

      {tab === "timeline" && (
        <div className="card grid gap-4 p-4">
          <LogButtons target={{ clientId: c.id }} />
          {deals.length > 0 && <p className="text-sm text-ink-2">Deals: {deals.map((d, i) => <span key={d.id}>{i > 0 && ", "}<Link className="link" href={`/deals/${d.id}`}>{d.title}</Link> ({stageLabel(d.stage)})</span>)}</p>}
          <Timeline items={activity} />
        </div>
      )}
    </>
  );
}
