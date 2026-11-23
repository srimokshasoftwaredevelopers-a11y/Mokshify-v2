/* Field groups shared by create and edit forms (server components, used inside ActionForm). */
import { addDays, dayIST } from "@/lib/format";
import { PROJECT_STATUSES } from "@/lib/rules";
import { Field, SelectField } from "./ui";

type ClientDefaults = { businessName?: string; phone?: string | null; email?: string | null; address?: string | null; gstin?: string | null; industry?: string | null; notes?: string | null };
export function ClientFields({ c = {} }: { c?: ClientDefaults }) {
  return (<>
    <Field label="Business name" name="businessName" required defaultValue={c.businessName} />
    <div className="grid grid-cols-2 gap-3"><Field label="Phone" name="phone" type="tel" defaultValue={c.phone} /><Field label="Industry" name="industry" defaultValue={c.industry} /></div>
    <Field label="Email" name="email" type="email" defaultValue={c.email} />
    <Field label="Address" name="address" defaultValue={c.address} />
    <Field label="GSTIN (optional)" name="gstin" mono defaultValue={c.gstin} placeholder="36AAAAA0000A1Z5" />
    <Field label="Notes" name="notes" type="textarea" defaultValue={c.notes} />
  </>);
}

type ProjectDefaults = { name?: string; type?: string | null; status?: string; agreedAmount?: number; startDate?: string | null; dueDate?: string | null; liveUrl?: string | null; repoUrl?: string | null; stackNotes?: string | null; showOnWebsite?: boolean };
export function ProjectFields({ p = {} }: { p?: ProjectDefaults }) {
  return (<>
    <Field label="Project name" name="name" required defaultValue={p.name} />
    <div className="grid grid-cols-2 gap-3">
      <Field label="Type" name="type" defaultValue={p.type} placeholder="Website, app…" />
      <SelectField label="Status" name="status" defaultValue={p.status ?? "advance_pending"} options={PROJECT_STATUSES.map(s => ({ value: s.key, label: s.label }))} />
    </div>
    <Field label="Agreed amount (₹)" name="agreedAmount" type="number" min={0} step={1} defaultValue={p.agreedAmount ?? 0} />
    <div className="grid grid-cols-2 gap-3"><Field label="Start" name="startDate" type="date" defaultValue={p.startDate ?? dayIST()} /><Field label="Due" name="dueDate" type="date" defaultValue={p.dueDate} /></div>
    <Field label="Live URL" name="liveUrl" type="url" defaultValue={p.liveUrl} placeholder="https://" />
    <Field label="Repository URL" name="repoUrl" type="url" defaultValue={p.repoUrl} placeholder="https://" />
    <Field label="Stack notes" name="stackNotes" type="textarea" defaultValue={p.stackNotes} />
    <label className="flex min-h-11 items-center gap-3 text-[15px]">
      <input type="checkbox" name="showOnWebsite" className="h-5 w-5 accent-oxblood-700" defaultChecked={p.showOnWebsite} />
      Shown on the website (needs the live URL)
    </label>
  </>);
}

export function RenewalFields({ clients }: { clients?: { id: string; businessName: string }[] }) {
  return (<>
    {clients && <SelectField label="Client" name="clientId" options={clients.map(c => ({ value: c.id, label: c.businessName }))} />}
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Item" name="item" options={[{ value: "domain", label: "Domain" }, { value: "hosting", label: "Hosting" }, { value: "ssl", label: "SSL" }, { value: "maintenance", label: "Maintenance" }]} />
      <Field label="Renews on" name="renewalDate" type="date" required defaultValue={addDays(dayIST(), 365)} />
    </div>
    <Field label="What exactly" name="label" placeholder="e.g. example.com, annual hosting" />
    <div className="grid grid-cols-2 gap-3"><Field label="Provider" name="provider" /><Field label="Amount (₹)" name="amount" type="number" min={0} step={1} defaultValue={0} /></div>
    <p className="text-xs text-ink-2">It appears on Today 30, 14 and 3 days before it&apos;s due.</p>
  </>);
}

export function PaymentFields() {
  return (<>
    <Field label="Milestone" name="milestone" required placeholder="e.g. Advance (40%)" />
    <div className="grid grid-cols-2 gap-3"><Field label="Amount (₹)" name="amount" type="number" min={1} step={1} required /><Field label="Due" name="dueDate" type="date" defaultValue={dayIST()} /></div>
  </>);
}

export function ReceivedFields({ amount }: { amount: number }) {
  return (<>
    <div className="grid grid-cols-2 gap-3"><Field label="Amount received (₹)" name="amount" type="number" min={1} step={1} defaultValue={amount} required /><Field label="Received on" name="receivedDate" type="date" defaultValue={dayIST()} required /></div>
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Method" name="method" options={["UPI", "Bank transfer", "Cheque", "Cash", "Card", "Other"].map(m => ({ value: m, label: m }))} />
      <Field label="Reference" name="reference" mono placeholder="UTR / cheque no." />
    </div>
    <p className="text-xs text-ink-2">Less than the milestone? The rest stays due as a new “balance” milestone.</p>
  </>);
}
