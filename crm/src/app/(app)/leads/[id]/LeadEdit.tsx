"use client";
import { useActionState } from "react";
import { updateLead, type FormResult } from "@/actions/leads";
import { LEAD_STATUSES } from "@/lib/rules";

type Lead = { id: string; name: string; phone: string | null; email: string | null; company: string | null; city: string | null; industry: string | null; serviceInterest: string | null; budgetRange: string | null; source: string; status: string; ownerId: string | null };

export function LeadEdit({ lead, users, sources }: { lead: Lead; users: { id: string; name: string }[]; sources: string[] }) {
  const [state, action, pending] = useActionState<FormResult, FormData>(updateLead.bind(null, lead.id), {});
  const f = (name: keyof Lead, label: string, type = "text") => (
    <label className="field"><span>{label}</span>
      <input className={`input ${type === "tel" ? "mono" : ""}`} name={name} type={type} defaultValue={(lead[name] as string | null) ?? ""} aria-invalid={!!state.fields?.[name]} />
      {state.fields?.[name] && <span className="error-text">{state.fields[name]}</span>}
    </label>
  );
  return (
    <details className="mt-4 border-t border-rule pt-3">
      <summary className="cursor-pointer text-sm font-medium">Edit details</summary>
      <form action={action} className="mt-3 grid gap-3">
        {f("name", "Name")}{f("phone", "Phone", "tel")}{f("email", "Email", "email")}{f("company", "Company")}
        {f("city", "City")}{f("industry", "Industry")}{f("serviceInterest", "Service wanted")}{f("budgetRange", "Budget range")}
        <label className="field"><span>Source</span><select className="input" name="source" defaultValue={lead.source}>{[...new Set([lead.source, ...sources])].map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="field"><span>Status</span><select className="input" name="status" defaultValue={lead.status}>{LEAD_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></label>
        <label className="field"><span>Owner</span><select className="input" name="ownerId" defaultValue={lead.ownerId ?? ""}><option value="">Unassigned</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
        <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
        <p aria-live="polite" className={`text-sm ${state.error ? "error-text" : "text-success"}`}>{state.error ?? (state.ok ? "Saved." : "")}</p>
      </form>
    </details>
  );
}
