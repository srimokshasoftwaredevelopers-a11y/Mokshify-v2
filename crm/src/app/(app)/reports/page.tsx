import type { Metadata } from "next";
import { Bars, Columns, DataTable, Trend } from "@/components/charts";
import { Icon } from "@/components/icons";
import { Money, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtDuration, rupees } from "@/lib/format";
import { funnel, leadsByIndustry, leadsByPage, leadsBySource, lostReasons, outstanding, parseRange, replyTrend, revenueByMonth, wonLostByMonth, type Range } from "@/server/reports";

export const metadata: Metadata = { title: "Reports" };

function Report({ id, title, sub, children, table, exportKey, range, owner }: {
  id: string; title: string; sub?: string; children: React.ReactNode; table: React.ReactNode; exportKey?: string; range: Range; owner: boolean;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="card grid scroll-mt-20 gap-4 p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div><h2 id={`${id}-h`} className="text-lg">{title}</h2>{sub && <p className="text-sm text-ink-2">{sub}</p>}</div>
        {owner && exportKey && <a className="btn btn-ghost btn-sm" href={`/api/export/${exportKey}?from=${range.from}&to=${range.to}`} download><Icon name="download" size={16} />CSV</a>}
      </header>
      {children}
      <details className="border-t border-rule pt-3"><summary className="cursor-pointer text-sm font-medium">Table view</summary><div className="mt-3">{table}</div></details>
    </section>
  );
}

const money = (v: unknown) => rupees(Number(v) || 0);
const dur = (v: unknown) => (v === null || v === undefined ? "—" : fmtDuration(Number(v)));

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const user = await requireUser();
  const range = parseRange(await searchParams);
  const [bySource, byIndustry, fun, reply, wonLost, reasons, revenue, owed, pages] = await Promise.all([
    leadsBySource(range), leadsByIndustry(range), funnel(range), replyTrend(range), wonLostByMonth(range), lostReasons(range), revenueByMonth(range), outstanding(), leadsByPage(range),
  ]);
  const owner = user.role === "owner";
  const P = { range, owner };
  const preset = (k: string, label: string) => <a key={k} href={`/reports?preset=${k}`} aria-current={range.preset === k ? "page" : undefined} className={`btn btn-sm !rounded-full ${range.preset === k ? "btn-primary" : "btn-ghost"}`}>{label}</a>;

  return (
    <>
      <PageHeader title="Reports" sub={`${fmtDate(range.from)} – ${fmtDate(range.to)}`} />
      <form method="get" className="card mb-6 flex flex-wrap items-end gap-3 p-4" aria-label="Date range">
        <div className="flex flex-wrap gap-2">{preset("30d", "30 days")}{preset("90d", "90 days")}{preset("12m", "12 months")}</div>
        <label className="field"><span>From</span><input className="input mono" type="date" name="from" defaultValue={range.from} /></label>
        <label className="field"><span>To</span><input className="input mono" type="date" name="to" defaultValue={range.to} /></label>
        <button className="btn btn-ghost">Apply</button>
      </form>

      <div className="grid gap-5 xl:grid-cols-2">
        <Report id="sources" title="Leads by source" exportKey="leads-by-source" {...P}
          table={<DataTable rows={bySource} columns={[{ key: "source", label: "Source" }, { key: "leads", label: "Leads", align: "right" }]} />}>
          <Bars rows={bySource} label="source" value="leads" title="Leads by source" />
        </Report>
        <Report id="industries" title="Leads by industry" exportKey="leads-by-industry" {...P}
          table={<DataTable rows={byIndustry} columns={[{ key: "industry", label: "Industry" }, { key: "leads", label: "Leads", align: "right" }]} />}>
          <Bars rows={byIndustry} label="industry" value="leads" title="Leads by industry" />
        </Report>

        <Report id="funnel" title="Funnel" sub="How many reach each stage, and where they drop. Deals count at the furthest stage they reached." exportKey="funnel" {...P}
          table={<DataTable rows={fun} columns={[{ key: "stage", label: "Stage" }, { key: "count", label: "Reached", align: "right" }, { key: "kept", label: "Kept", align: "right" }, { key: "dropped", label: "Dropped", align: "right", format: v => (v === null ? "—" : String(v)) }]} />}>
          <ol className="grid gap-1.5" aria-label="Funnel">
            {fun.map((s, i) => {
              const top = Number(fun[0]?.count) || 1, n = Number(s.count) || 0;
              return (
                <li key={i} className="grid grid-cols-[7.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
                  <span>{s.stage}</span>
                  <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-5 w-full" aria-hidden="true"><rect x={(100 - Math.max(2, (n / top) * 100)) / 2} width={Math.max(2, (n / top) * 100)} height="10" rx="1.5" className={s.stage === "Won" ? "fill-success" : "fill-oxblood-700"} /></svg>
                  <span className="mono text-right">{n}<span className="ml-1 text-xs text-ink-2">{i ? s.kept : ""}</span></span>
                </li>
              );
            })}
          </ol>
        </Report>

        <Report id="reply-time" title="First-reply time" sub="Average per week, for enquiries that arrived in the range. Lower is better." exportKey="reply-time" {...P}
          table={<DataTable rows={reply} columns={[{ key: "week", label: "Week of", format: v => fmtDate(String(v)) }, { key: "avg_seconds", label: "Average", align: "right", format: dur }, { key: "replied", label: "Replied", align: "right" }, { key: "leads", label: "Leads", align: "right" }]} />}>
          <Trend rows={reply} x="week" y="avg_seconds" title="Average first-reply time per week" format={fmtDuration} />
        </Report>

        <Report id="won-lost" title="Won and lost by month" exportKey="won-lost" {...P}
          table={<>
            <DataTable rows={wonLost} columns={[{ key: "month", label: "Month" }, { key: "won", label: "Won", align: "right" }, { key: "won_value", label: "Won value", align: "right", format: money }, { key: "lost", label: "Lost", align: "right" }, { key: "lost_value", label: "Lost value", align: "right", format: money }]} />
            <h3 className="mb-2 mt-4 text-sm font-semibold">Lost reasons</h3>
            <DataTable rows={reasons} columns={[{ key: "reason", label: "Reason" }, { key: "deals", label: "Deals", align: "right" }, { key: "value", label: "Value", align: "right", format: money }]} />
          </>}>
          <Columns rows={wonLost} x="month" title="Deals won and lost per month" series={[{ key: "won", label: "Won", tone: "primary" }, { key: "lost", label: "Lost", tone: "brass" }]} />
          <div><h3 className="mb-2 text-sm font-semibold">Why deals were lost</h3><Bars rows={reasons} label="reason" value="deals" title="Lost reasons" /></div>
        </Report>

        <Report id="revenue" title="Revenue received" sub="By the month the money arrived." exportKey="revenue" {...P}
          table={<DataTable rows={revenue} columns={[{ key: "month", label: "Month" }, { key: "received", label: "Received", align: "right", format: money }, { key: "payments", label: "Payments", align: "right" }]} />}>
          <Columns rows={revenue} x="month" title="Revenue received per month" money series={[{ key: "received", label: "Received", tone: "primary" }]} />
          <dl className="grid grid-cols-3 gap-3 border-t border-rule pt-3 text-sm">
            <div><dt className="label">Outstanding now</dt><dd><Money value={owed.balance} className="text-lg font-semibold" /></dd></div>
            <div><dt className="label">Of which overdue</dt><dd><Money value={owed.overdue} className={`text-lg font-semibold ${owed.overdue ? "text-danger" : ""}`} /></dd></div>
            <div><dt className="label">Agreed, all projects</dt><dd><Money value={owed.agreed} className="text-lg" /></dd></div>
          </dl>
        </Report>

        <Report id="pages" title="Which website page leads came from" exportKey="pages" {...P}
          table={<DataTable rows={pages} columns={[{ key: "page", label: "Page" }, { key: "leads", label: "Leads", align: "right" }]} />}>
          <Bars rows={pages} label="page" value="leads" title="Leads by website page" />
        </Report>
      </div>
    </>
  );
}
