import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDeal } from "@/actions/deals";
import { Icon } from "@/components/icons";
import { LogButtons } from "@/components/LogButtons";
import { ReplyButtons } from "@/components/ReplyButtons";
import { Tasks } from "@/components/Tasks";
import { Timeline } from "@/components/Timeline";
import { Badge, Money, Section } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { dayIST, fmtDate, fmtPhone } from "@/lib/format";
import { isOpen, projectStatusLabel, stageLabel, type Stage } from "@/lib/rules";
import { getDeal } from "@/server/deals";
import { getLostReasons, listTemplates, listUsers } from "@/server/queries";
import { DealEdit, StageControl } from "./DealEdit";

export const metadata: Metadata = { title: "Deal" };

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [deal, templates, users, lostReasons] = await Promise.all([getDeal(id), listTemplates(), listUsers(), getLostReasons()]);
  if (!deal) notFound();
  const core = { id: deal.id, title: deal.title, stage: deal.stage, value: deal.value, probability: deal.probability, expectedCloseDate: deal.expectedCloseDate, ownerId: deal.ownerId, nextAction: deal.nextAction, nextActionDate: deal.nextActionDate };
  const open = isOpen(deal.stage as Stage);
  const late = open && !!deal.nextActionDate && deal.nextActionDate < dayIST();
  const contact = deal.lead ?? (deal.client ? { id: deal.client.id, name: deal.client.businessName, phone: deal.client.phone, email: deal.client.email, company: deal.client.businessName, serviceInterest: null } : null);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="grid min-w-0 gap-6">
        <section className="card p-5" aria-labelledby="deal-h">
          <p className="label mb-2"><Link href="/pipeline" className="hover:underline">Pipeline</Link> / {stageLabel(deal.stage)}</p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 id="deal-h" className="text-[26px]">{deal.title}</h1>
              <p className="text-ink-2">{deal.client ? <Link className="link" href={`/clients/${deal.client.id}`}>{deal.client.businessName}</Link> : deal.lead ? <Link className="link" href={`/leads/${deal.lead.id}`}>{deal.lead.company ?? deal.lead.name}</Link> : "No client yet"}</p>
            </div>
            <div className="text-right"><Money value={deal.value} className="text-2xl font-semibold" /><p className="text-xs text-ink-2">{deal.probability}% likely</p></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone={deal.stage === "won" ? "success" : deal.stage === "lost" ? "muted" : "info"}>{stageLabel(deal.stage)}</Badge>
            {deal.stale.includes("idle") && <Badge tone="danger">Idle {Math.floor((Date.now() - deal.lastActivityAt.getTime()) / 86_400_000)} days</Badge>}
            {deal.stale.includes("proposal") && <Badge tone="warning">Proposal unanswered 3+ days</Badge>}
            {deal.stage === "lost" && deal.lostReason && <span className="text-sm text-ink-2">Lost: {deal.lostReason}</span>}
            {deal.project && <Link className="link text-sm" href={`/projects/${deal.project.id}`}>Project: {deal.project.name} ({projectStatusLabel(deal.project.status)})</Link>}
            <span className="ml-auto"><StageControl deal={core} lostReasons={lostReasons} /></span>
          </div>
          {open && (
            <p className={`mt-4 rounded-[6px] border px-3 py-2 ${late ? "border-danger/40 bg-danger/5" : "border-brass/40 bg-brass/5"}`}>
              <span className="label mr-2">Next</span>{deal.nextAction} <span className={`mono text-sm ${late ? "text-danger" : "text-ink-2"}`}>· {late ? "overdue since " : "by "}{fmtDate(deal.nextActionDate)}</span>
            </p>
          )}
          {contact && <div className="mt-4"><ReplyButtons lead={contact} templates={templates} ownerName={user.name} dealId={deal.id} /></div>}
        </section>

        <Section title="Timeline" id="timeline">
          <div className="card grid gap-4 p-4">
            <LogButtons target={{ dealId: deal.id, ...(deal.leadId ? { leadId: deal.leadId } : {}) }} />
            <Timeline items={deal.activities} />
          </div>
        </Section>
      </div>

      <aside className="grid gap-6">
        <section className="card p-4" aria-labelledby="edit-h"><h2 id="edit-h" className="mb-3 text-base">Deal</h2><DealEdit deal={core} users={users} /></section>
        {deal.lead && (
          <section className="card p-4 text-sm" aria-labelledby="lead-h">
            <h2 id="lead-h" className="mb-2 text-base">From the lead</h2>
            <p><Link className="link" href={`/leads/${deal.lead.id}`}>{deal.lead.name}</Link> · <span className="mono">{fmtPhone(deal.lead.phone)}</span></p>
            <p className="text-ink-2">{deal.lead.source}{deal.lead.serviceInterest ? ` · ${deal.lead.serviceInterest}` : ""}</p>
          </section>
        )}
        <section className="card p-4" aria-labelledby="tasks-h"><h2 id="tasks-h" className="mb-3 text-base">Tasks</h2><Tasks tasks={deal.tasks} target={{ dealId: deal.id }} /></section>
        {user.role === "owner" && (
          <details className="card p-4">
            <summary className="cursor-pointer text-sm text-danger">Delete this deal…</summary>
            <p className="my-2 text-sm text-ink-2">Removes the deal and its timeline. A project created from it stays. This can&apos;t be undone.</p>
            <form action={deleteDeal.bind(null, deal.id)}><button className="btn btn-sm border-danger text-danger"><Icon name="trash" size={16} />Delete permanently</button></form>
          </details>
        )}
      </aside>
    </div>
  );
}
