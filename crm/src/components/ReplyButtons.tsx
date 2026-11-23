"use client";
import { useState, useTransition } from "react";
import { logActivity } from "@/actions/activity";
import { fillTemplate, telLink, waLink } from "@/lib/rules";
import { Icon } from "./icons";

type Tpl = { id: string; channel: "whatsapp" | "email"; name: string; subject: string | null; body: string };
type Lead = { id: string; name: string; phone: string | null; email: string | null; company: string | null; serviceInterest: string | null };
type Kind = "call" | "whatsapp" | "email";

/** Call · WhatsApp (with a chosen template) · Email — and after using one, log it in one tap */
export function ReplyButtons({ lead, templates, ownerName, dealId, compact }: { lead: Lead; templates: Tpl[]; ownerName: string; dealId?: string; compact?: boolean }) {
  const wa = templates.filter(x => x.channel === "whatsapp");
  const em = templates.filter(x => x.channel === "email");
  const [waId, setWaId] = useState(wa[0]?.id ?? "");
  const [pending, setPending] = useState<{ kind: Kind; body: string } | null>(null);
  const [saving, start] = useTransition();
  const [logged, setLogged] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vars = { name: lead.name.split(" ")[0], company: lead.company, service: lead.serviceInterest ?? "your project", owner: ownerName.split(" ")[0] };
  const waTpl = wa.find(x => x.id === waId);
  const waText = waTpl ? fillTemplate(waTpl.body, vars) : "";
  const emTpl = em[0];
  const tel = telLink(lead.phone);
  const waHref = waLink(lead.phone, waText);
  const mail = lead.email ? `mailto:${lead.email}${emTpl ? `?subject=${encodeURIComponent(fillTemplate(emTpl.subject ?? "", vars))}&body=${encodeURIComponent(fillTemplate(emTpl.body, vars))}` : ""}` : null;

  const offer = (kind: Kind, body: string) => { setLogged(null); setError(null); setPending({ kind, body }); };
  const log = () => pending && start(async () => {
    const res = await logActivity({ kind: pending.kind, body: pending.body, leadId: lead.id, dealId });
    if (res.error) setError(res.error); else { setLogged(`${pending.kind === "whatsapp" ? "WhatsApp" : pending.kind === "call" ? "Call" : "Email"} logged.`); setPending(null); }
  });
  // three equal buttons that may shrink (min-w-0) so they always fit a phone-width card
  const btn = `btn ${compact ? "btn-sm" : ""} btn-ghost min-w-0 flex-1 basis-0 !gap-1.5 !px-2`;

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        {tel ? <a className={btn} href={tel} onClick={() => offer("call", `Called ${lead.name}.`)}><Icon name="phone" size={18} />Call</a>
          : <span className={`${btn} opacity-50`} aria-disabled="true" title="No phone number"><Icon name="phone" size={18} />Call</span>}
        {waHref ? <a className={btn} href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => offer("whatsapp", `WhatsApp sent: ${waTpl?.name ?? "message"}.`)}><Icon name="whatsapp" size={18} />WhatsApp</a>
          : <span className={`${btn} opacity-50`} aria-disabled="true" title="No phone number"><Icon name="whatsapp" size={18} />WhatsApp</span>}
        {mail ? <a className={btn} href={mail} onClick={() => offer("email", `Email sent: ${emTpl?.name ?? "message"}.`)}><Icon name="mail" size={18} />Email</a>
          : <span className={`${btn} opacity-50`} aria-disabled="true" title="No email address"><Icon name="mail" size={18} />Email</span>}
      </div>
      {wa.length > 1 && waHref && !compact && (
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <span className="shrink-0">WhatsApp message</span>
          <select className="input !min-h-9 !py-1 text-sm" value={waId} onChange={e => setWaId(e.target.value)}>
            {wa.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
      )}
      <div aria-live="polite">
        {pending && (
          <div className="flex flex-wrap items-center gap-2 rounded-[6px] border border-brass/50 bg-brass/10 px-3 py-2 text-sm">
            <span className="mr-auto">Log this {pending.kind === "whatsapp" ? "WhatsApp" : pending.kind} for {lead.name.split(" ")[0]}?</span>
            <button type="button" className="btn btn-primary btn-sm" onClick={log} disabled={saving}><Icon name="check" size={16} />{saving ? "Logging…" : "Log it"}</button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setPending(null)}>Not now</button>
          </div>
        )}
        {logged && <p className="text-sm text-success">{logged}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
