import type { Metadata } from "next";
import { FiltersToggle } from "@/components/FiltersToggle";
import { QuickAddButton } from "@/components/QuickAdd";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/rules";
import { getSources, leadIndustries, listLeads, listUsers } from "@/server/queries";
import { LeadsList } from "./LeadsList";

export const metadata: Metadata = { title: "Leads" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 120) || undefined;

export default async function LeadsPage({ searchParams }: { searchParams: SP }) {
  await requireUser();
  const sp = await searchParams;
  const f = { q: one(sp.q), status: one(sp.status), source: one(sp.source), industry: one(sp.industry), owner: one(sp.owner), from: one(sp.from), to: one(sp.to) };
  const [leads, users, sources, industries] = await Promise.all([listLeads(f), listUsers(), getSources(), leadIndustries()]);
  const filtered = Object.values(f).some(Boolean);

  return (
    <>
      <PageHeader title="Leads" sub={`${leads.length} ${filtered ? "matching" : "in total"}${leads.length === 300 ? " (first 300)" : ""}`} actions={<QuickAddButton />} />

      <form method="get" className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)_auto]" role="search" aria-label="Filter leads">
        <label className="field sm:col-span-2 lg:col-span-1"><span>Search</span><input className="input" type="search" name="q" defaultValue={f.q} placeholder="Name, phone or company" /></label>
        <FiltersToggle active={[f.status, f.source, f.industry, f.owner, f.from, f.to].filter(Boolean).length}>
        <label className="field"><span>Status</span>
          <select className="input" name="status" defaultValue={f.status ?? ""}><option value="">Any</option>{LEAD_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></label>
        <label className="field"><span>Source</span>
          <select className="input" name="source" defaultValue={f.source ?? ""}><option value="">Any</option>{sources.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="field"><span>Industry</span>
          <select className="input" name="industry" defaultValue={f.industry ?? ""}><option value="">Any</option>{industries.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="field"><span>Owner</span>
          <select className="input" name="owner" defaultValue={f.owner ?? ""}><option value="">Anyone</option><option value="none">Unassigned</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
        </FiltersToggle>
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1 lg:flex lg:items-end">
          <button className="btn btn-primary">Filter</button>
          {filtered && <a className="btn btn-quiet" href="/leads">Clear</a>}
        </div>
        <details className="sm:col-span-2 lg:col-span-6" open={!!(f.from || f.to)}>
          <summary className="cursor-pointer text-sm text-ink-2">Date received</summary>
          <div className="mt-2 grid max-w-md grid-cols-2 gap-3">
            <label className="field"><span>From</span><input className="input mono" type="date" name="from" defaultValue={f.from} /></label>
            <label className="field"><span>To</span><input className="input mono" type="date" name="to" defaultValue={f.to} /></label>
          </div>
        </details>
      </form>

      {leads.length ? <LeadsList leads={leads.map(l => ({ ...l, createdAt: l.createdAt.toISOString() }))} users={users} />
        : filtered ? <EmptyState icon="search" title="No leads match these filters." body="Try fewer filters, or search by part of a phone number." action={{ href: "/leads", label: "Clear filters" }} />
        : <EmptyState icon="leads" title="No leads yet." body="Website enquiries arrive here on their own. Phone and walk-in enquiries take 20 seconds to add." action={<QuickAddButton label="Add the first lead" className="btn btn-ghost btn-sm" />} />}
    </>
  );
}
