"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { bulkAssign } from "@/actions/leads";
import { Timer } from "@/components/Timer";
import { fmtDate, fmtPhone } from "@/lib/format";
import { leadStatus } from "@/lib/rules";

type Lead = {
  id: string; name: string; phone: string | null; company: string | null; city: string | null; industry: string | null; source: string;
  status: string; createdAt: string; firstResponseSeconds: number | null; ownerName: string | null; serviceInterest: string | null;
};

function Status({ s }: { s: string }) { const x = leadStatus(s); return <span className={`badge tone-${x.tone}`}>{x.label}</span>; }

/** table on desktop, cards on phones; select rows to assign them in one go */
export function LeadsList({ leads, users }: { leads: Lead[]; users: { id: string; name: string }[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [owner, setOwner] = useState(users[0]?.id ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toggle = (id: string) => setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const all = sel.size === leads.length;
  const assign = () => start(async () => {
    const res = await bulkAssign([...sel], owner);
    setMsg(res.error ?? `${sel.size} lead${sel.size === 1 ? "" : "s"} assigned.`);
    if (!res.error) setSel(new Set());
  });

  return (
    <>
      {sel.size > 0 && (
        <div className="sticky top-14 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-[6px] bg-oxblood-900 p-3 text-paper on-dark lg:top-3" role="region" aria-label="Bulk actions">
          <span className="mono text-sm">{sel.size} selected</span>
          <label className="ml-auto flex items-center gap-2 text-sm">Assign to
            <select className="input !min-h-9 !w-auto !py-1 text-sm" value={owner} onChange={e => setOwner(e.target.value)}>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          </label>
          <button type="button" className="btn btn-sm bg-paper text-ink" onClick={assign} disabled={pending}>{pending ? "Assigning…" : "Assign"}</button>
          <button type="button" className="btn btn-quiet btn-sm !text-paper" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}
      <p aria-live="polite" className="mb-2 text-sm text-success">{msg}</p>

      {/* desktop: compact table */}
      <div className="card hidden overflow-x-auto lg:block">
        <table className="table">
          <thead><tr>
            <th className="w-10"><input type="checkbox" className="h-4 w-4 accent-oxblood-700" aria-label="Select all" checked={all} onChange={() => setSel(all ? new Set() : new Set(leads.map(l => l.id)))} /></th>
            <th>Name</th><th>Phone</th><th>Company</th><th>Source</th><th>Status</th><th>First reply</th><th>Owner</th><th>Received</th>
          </tr></thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id} className={sel.has(l.id) ? "bg-brass/10" : ""}>
                <td><input type="checkbox" className="h-4 w-4 accent-oxblood-700" aria-label={`Select ${l.name}`} checked={sel.has(l.id)} onChange={() => toggle(l.id)} /></td>
                <td><Link className="font-medium hover:underline" href={`/leads/${l.id}`}>{l.name}</Link>{l.serviceInterest && <span className="block text-xs text-ink-2">{l.serviceInterest}</span>}</td>
                <td className="mono whitespace-nowrap">{fmtPhone(l.phone)}</td>
                <td>{l.company ?? <span className="text-ink-2">—</span>}{l.city && <span className="block text-xs text-ink-2">{l.city}</span>}</td>
                <td className="whitespace-nowrap">{l.source}</td>
                <td><Status s={l.status} /></td>
                <td>{l.status === "closed" && l.firstResponseSeconds === null ? <span className="text-ink-2">—</span> : <Timer since={l.createdAt} repliedSeconds={l.firstResponseSeconds} />}</td>
                <td className="whitespace-nowrap">{l.ownerName ?? <span className="text-ink-2">Unassigned</span>}</td>
                <td className="mono whitespace-nowrap text-ink-2">{fmtDate(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phones: cards */}
      <ul className="grid grid-cols-1 gap-2 lg:hidden">
        {leads.map(l => (
          <li key={l.id} className={`card flex min-w-0 gap-3 p-3 ${sel.has(l.id) ? "ring-2 ring-brass" : ""}`}>
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-oxblood-700" aria-label={`Select ${l.name}`} checked={sel.has(l.id)} onChange={() => toggle(l.id)} />
            <Link href={`/leads/${l.id}`} className="grid min-w-0 flex-1 gap-1.5 no-underline">
              <span className="flex items-start justify-between gap-2">
                <span className="min-w-0"><span className="block truncate font-medium">{l.name}</span><span className="block truncate text-sm text-ink-2">{[l.company, l.city].filter(Boolean).join(" · ") || l.source}</span></span>
                <Status s={l.status} />
              </span>
              <span className="flex flex-wrap items-center gap-2 text-sm">
                {!(l.status === "closed" && l.firstResponseSeconds === null) && <Timer since={l.createdAt} repliedSeconds={l.firstResponseSeconds} />}
                <span className="mono text-ink-2">{fmtPhone(l.phone)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
