import type { Metadata } from "next";
import Link from "next/link";
import { ReplyButtons } from "@/components/ReplyButtons";
import { TaskCheck } from "@/components/Tasks";
import { Timer } from "@/components/Timer";
import { Badge, EmptyState, Money, PageHeader, Section } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { daysBetween, fmtDate, fmtDuration, rupees, rupeesShort, taskDue } from "@/lib/format";
import { stageLabel, timerColour } from "@/lib/rules";
import { listTemplates, todayData } from "@/server/queries";

export const metadata: Metadata = { title: "Today" };

const ITEM: Record<string, string> = { domain: "Domain", hosting: "Hosting", ssl: "SSL", maintenance: "Maintenance" };

function Figure({ href, label, value, note }: { href: string; label: string; value: string; note: string }) {
  return (
    <Link href={href} className="card group flex flex-col gap-1 p-4 no-underline transition-colors duration-150 hover:border-ink/40">
      <span className="label">{label}</span>
      <span className="mono text-2xl font-semibold tracking-tight sm:text-[28px]">{value}</span>
      <span className="text-xs text-ink-2">{note} <span aria-hidden="true" className="opacity-0 transition-opacity group-hover:opacity-100">→</span></span>
    </Link>
  );
}

export default async function TodayPage() {
  const user = await requireUser();
  const [d, templates] = await Promise.all([todayData(), listTemplates()]);
  const f = d.figures;
  const rate = f.winRate.won + f.winRate.lost ? Math.round((f.winRate.won / (f.winRate.won + f.winRate.lost)) * 100) : null;
  const followCount = d.dueTasks.length + d.nextActions.length;
  const dateLine = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date());

  return (
    <>
      <PageHeader title="Today" sub={dateLine} />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure href="/reports#funnel" label="Open pipeline" value={rupeesShort(f.openPipeline.value)} note={`${f.openPipeline.count} open deal${f.openPipeline.count === 1 ? "" : "s"}`} />
        <Figure href="/reports#won-lost" label="Won this month" value={rupeesShort(f.wonThisMonth.value)} note={`${f.wonThisMonth.count} deal${f.wonThisMonth.count === 1 ? "" : "s"}`} />
        <Figure href="/reports#reply-time" label="Avg first reply" value={f.avgFirstReply.seconds === null ? "—" : fmtDuration(f.avgFirstReply.seconds)} note={`Last 30 days · ${f.avgFirstReply.count} lead${f.avgFirstReply.count === 1 ? "" : "s"}`} />
        <Figure href="/reports#won-lost" label="Win rate" value={rate === null ? "—" : `${rate}%`} note={`Last 90 days · ${f.winRate.won} won, ${f.winRate.lost} lost`} />
      </div>

      <Section title="Reply now" count={d.replyNow.length} id="reply">
        {d.replyNow.length ? (
          <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {d.replyNow.map(l => {
              const late = timerColour((Date.now() - l.createdAt.getTime()) / 1000) === "red";
              return (
                <li key={l.id} className={`card grid min-w-0 grid-cols-1 gap-3 p-4 ${late ? "border-l-4 border-l-danger" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/leads/${l.id}`} className="min-w-0 no-underline">
                      <span className="block truncate text-[17px] font-semibold hover:underline">{l.name}</span>
                      <span className="block truncate text-sm text-ink-2">{[l.company, l.serviceInterest, l.source].filter(Boolean).join(" · ")}</span>
                    </Link>
                    <Timer since={l.createdAt.toISOString()} />
                  </div>
                  <ReplyButtons lead={l} templates={templates} ownerName={user.name} compact />
                </li>
              );
            })}
          </ul>
        ) : <EmptyState icon="check" title="Every enquiry has a reply." body="New enquiries appear here with a timer the moment they arrive." />}
      </Section>

      <Section title="Follow up today" count={followCount} id="follow">
        {followCount ? (
          <ul className="card divide-y divide-rule">
            {d.dueTasks.map(t => { const due = taskDue(t); const href = t.leadId ? `/leads/${t.leadId}` : t.dealId ? `/deals/${t.dealId}` : t.projectId ? `/projects/${t.projectId}` : t.clientId ? `/clients/${t.clientId}` : null; return (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-4 px-4 py-1">
                <TaskCheck task={t} />
                <span className="flex items-center gap-3 text-sm">
                  <span className={`mono text-xs ${due.overdue ? "text-danger" : "text-ink-2"}`}>{due.overdue ? "Overdue · " : ""}{due.text}</span>
                  {href && <Link className="link" href={href}>Open</Link>}
                </span>
              </li>
            ); })}
            {d.nextActions.map(a => { const late = !!a.nextActionDate && a.nextActionDate < d.today; return (
              <li key={a.id}><Link href={`/deals/${a.id}`} className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 no-underline hover:bg-ink/[.025]">
                <span className="min-w-0"><span className="block font-medium">{a.nextAction}</span><span className="block text-sm text-ink-2">{a.title} · {stageLabel(a.stage)}</span></span>
                <span className={`mono text-xs ${late ? "text-danger" : "text-ink-2"}`}>{late ? `Overdue · ${fmtDate(a.nextActionDate)}` : "Today"}</span>
              </Link></li>
            ); })}
          </ul>
        ) : <EmptyState icon="today" title="Nothing due today." body="Tasks and deal next steps due today or overdue appear here." action={{ href: "/pipeline", label: "Open the pipeline" }} />}
      </Section>

      <Section title="Waiting on the client" count={d.waiting.length} id="waiting">
        {d.waiting.length ? (
          <ul className="card divide-y divide-rule">
            {d.waiting.map(w => (
              <li key={w.id}><Link href={`/deals/${w.id}`} className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 no-underline hover:bg-ink/[.025]">
                <span className="min-w-0"><span className="block font-medium">{w.title}</span><span className="block text-sm text-ink-2">{stageLabel(w.stage)} · next: {w.nextAction}</span></span>
                <span className="flex flex-wrap items-center gap-2">
                  {w.reasons.includes("proposal") && <Badge tone="warning">Proposal unanswered {Math.floor((Date.now() - Math.max(w.stageChangedAt.getTime(), w.lastActivityAt.getTime())) / 86_400_000)} days</Badge>}
                  {w.reasons.includes("idle") && <Badge tone="danger">Idle {Math.floor((Date.now() - w.lastActivityAt.getTime()) / 86_400_000)} days</Badge>}
                  <Money value={w.value} short className="text-sm" />
                </span>
              </Link></li>
            ))}
          </ul>
        ) : <EmptyState icon="pipeline" title="Nothing has gone quiet." body="Proposals unanswered for 3 days and deals idle for 7 days show up here." />}
      </Section>

      <Section title="Money" count={d.money.length} id="money"
        total={d.money.length ? <><span className={d.moneyTotals.overdue ? "text-danger" : ""}>Overdue {rupees(d.moneyTotals.overdue)}</span> · Due this week {rupees(d.moneyTotals.week)}</> : undefined}>
        {d.money.length ? (
          <ul className="card divide-y divide-rule">
            {d.money.map(p => (
              <li key={p.id}><Link href={`/projects/${p.projectId}`} className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 no-underline hover:bg-ink/[.025]">
                <span className="min-w-0"><span className="block font-medium">{p.clientName}</span><span className="block text-sm text-ink-2">{p.projectName} · {p.milestone}</span></span>
                <span className="flex items-center gap-3">
                  {p.overdue ? <Badge tone="danger">Overdue since {fmtDate(p.dueDate)}</Badge> : <span className="mono text-xs text-ink-2">Due {fmtDate(p.dueDate)}</span>}
                  <Money value={p.amount} className="font-semibold" />
                </span>
              </Link></li>
            ))}
          </ul>
        ) : <EmptyState icon="rupee" title="No payments due this week." body="Milestone payments due in the next 7 days, and any overdue, appear here." action={{ href: "/projects", label: "See projects" }} />}
      </Section>

      <Section title="Renewals" count={d.renewals.length} id="renewals">
        {d.renewals.length ? (
          <ul className="card divide-y divide-rule">
            {d.renewals.map(r => { const left = daysBetween(d.today, r.renewalDate); return (
              <li key={r.id}><Link href="/renewals" className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 no-underline hover:bg-ink/[.025]">
                <span className="min-w-0"><span className="block font-medium">{ITEM[r.item]}{r.label ? ` · ${r.label}` : ""}</span><span className="block text-sm text-ink-2">{r.clientName}{r.provider ? ` · ${r.provider}` : ""}</span></span>
                <span className="flex items-center gap-3">
                  <Badge tone={r.level === "overdue" || r.level === "3" ? "danger" : r.level === "14" ? "warning" : "info"}>{left < 0 ? `${-left} days overdue` : left === 0 ? "Due today" : `${left} day${left === 1 ? "" : "s"} left`}</Badge>
                  <span className="mono text-xs text-ink-2">{fmtDate(r.renewalDate)}</span>
                  {r.amount > 0 && <Money value={r.amount} className="text-sm" />}
                </span>
              </Link></li>
            ); })}
          </ul>
        ) : <EmptyState icon="renewals" title="No renewals in the next 30 days." body="Domains, hosting, SSL and maintenance show here 30, 14 and 3 days before they're due." action={{ href: "/renewals", label: "See all renewals" }} />}
      </Section>
    </>
  );
}
