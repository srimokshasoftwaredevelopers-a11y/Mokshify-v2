import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteLead } from "@/actions/leads";
import { Icon } from "@/components/icons";
import { LogButtons } from "@/components/LogButtons";
import { ReplyButtons } from "@/components/ReplyButtons";
import { Tasks } from "@/components/Tasks";
import { Timeline } from "@/components/Timeline";
import { Timer } from "@/components/Timer";
import { Money, Section } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fmtDateTime, fmtPhone } from "@/lib/format";
import { leadStatus, stageLabel } from "@/lib/rules";
import { getLead, getSources, listTemplates, listUsers } from "@/server/queries";
import { LeadEdit } from "./LeadEdit";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [lead, templates, users, sources] = await Promise.all([getLead(id), listTemplates(), listUsers(), getSources()]);
  if (!lead) notFound();
  const st = leadStatus(lead.status);
  const utm = [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="grid min-w-0 gap-6">
        <section className="card p-5" aria-labelledby="lead-h">
          <p className="label mb-2"><Link href="/leads" className="hover:underline">Leads</Link> / {lead.source}</p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 id="lead-h" className="text-[26px]">{lead.name}</h1>
              <p className="text-ink-2">{[lead.company, lead.city, lead.industry].filter(Boolean).join(" · ") || "No company yet"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2"><span className={`badge tone-${st.tone}`}>{st.label}</span>
              {!(lead.status === "closed" && lead.firstResponseSeconds === null) && <Timer since={lead.createdAt.toISOString()} repliedSeconds={lead.firstResponseSeconds} />}</div>
          </div>
          {lead.message && <blockquote className="mt-4 border-l-2 border-brass pl-3 text-[15px]">{lead.message}</blockquote>}
          <div className="mt-5"><ReplyButtons lead={lead} templates={templates} ownerName={user.name} /></div>
        </section>

        <Section title="Timeline" id="timeline">
          <div className="card grid gap-4 p-4">
            <LogButtons target={{ leadId: lead.id }} />
            <Timeline items={lead.activities} />
          </div>
        </Section>
      </div>

      <aside className="grid gap-6">
        <section className="card p-4" aria-labelledby="facts-h">
          <h2 id="facts-h" className="mb-3 text-base">Details</h2>
          <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-ink-2">Phone</dt><dd className="mono">{fmtPhone(lead.phone) || "—"}</dd>
            <dt className="text-ink-2">Email</dt><dd className="break-all">{lead.email ?? "—"}</dd>
            <dt className="text-ink-2">Wants</dt><dd>{lead.serviceInterest ?? "—"}</dd>
            <dt className="text-ink-2">Budget</dt><dd>{lead.budgetRange ?? "—"}</dd>
            <dt className="text-ink-2">Owner</dt><dd>{lead.ownerName ?? "Unassigned"}</dd>
            <dt className="text-ink-2">Received</dt><dd className="mono">{fmtDateTime(lead.createdAt)}</dd>
            {lead.sourcePageUrl && <><dt className="text-ink-2">Page</dt><dd className="break-all">{lead.sourcePageUrl.replace(/^https?:\/\/(www\.)?/, "")}</dd></>}
            {utm && <><dt className="text-ink-2">Campaign</dt><dd>{utm}</dd></>}
            {lead.referrer && <><dt className="text-ink-2">Referrer</dt><dd className="break-all">{lead.referrer}</dd></>}
            <dt className="text-ink-2">Consent</dt><dd>{lead.consent ? `Yes, ${fmtDateTime(lead.consentAt)}` : "Not recorded"}</dd>
          </dl>
          <LeadEdit lead={lead} users={users} sources={sources} />
        </section>

        <section className="card p-4" aria-labelledby="deals-h">
          <h2 id="deals-h" className="mb-3 text-base">Deals</h2>
          {lead.deals.length ? (
            <ul className="grid gap-2">{lead.deals.map(d => (
              <li key={d.id}><Link href={`/deals/${d.id}`} className="flex items-center justify-between gap-2 rounded-[6px] border border-rule px-3 py-2 hover:border-ink">
                <span className="min-w-0"><span className="block truncate font-medium">{d.title}</span><span className="text-xs text-ink-2">{stageLabel(d.stage)}</span></span><Money value={d.value} short /></Link></li>
            ))}</ul>
          ) : <p className="text-sm text-ink-2">No deal yet.</p>}
          <div id="convert" />
        </section>

        <section className="card p-4" aria-labelledby="tasks-h">
          <h2 id="tasks-h" className="mb-3 text-base">Tasks</h2>
          <Tasks tasks={lead.tasks} target={{ leadId: lead.id }} />
        </section>

        {user.role === "owner" && (
          <details className="card p-4">
            <summary className="cursor-pointer text-sm text-danger">Delete this lead…</summary>
            <p className="my-2 text-sm text-ink-2">Removes the lead, its timeline and its tasks. Deals stay, unlinked. This can&apos;t be undone.</p>
            <form action={deleteLead.bind(null, lead.id)}><button className="btn btn-sm border-danger text-danger"><Icon name="trash" size={16} />Delete permanently</button></form>
          </details>
        )}
      </aside>
    </div>
  );
}
