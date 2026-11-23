"use client";
import { useRef, useState, useTransition } from "react";
import { logActivity } from "@/actions/activity";
import { Icon, type IconName } from "./icons";

const KINDS: { kind: "call" | "whatsapp" | "note" | "meeting"; label: string; icon: IconName }[] = [
  { kind: "call", label: "Call", icon: "phone" },
  { kind: "whatsapp", label: "WhatsApp", icon: "whatsapp" },
  { kind: "note", label: "Note", icon: "note" },
  { kind: "meeting", label: "Meeting", icon: "meeting" },
];

/** quick buttons to log a call, a WhatsApp message, a note or a meeting on the timeline */
export function LogButtons({ target }: { target: { leadId?: string; dealId?: string; clientId?: string; projectId?: string } }) {
  const [open, setOpen] = useState<(typeof KINDS)[number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const text = useRef<HTMLTextAreaElement>(null);

  const save = () => open && start(async () => {
    const body = text.current?.value.trim() || null;
    if (open.kind === "note" && !body) { setError("Write the note first."); return; }
    const res = await logActivity({ kind: open.kind, body, ...target });
    if (res.error) setError(res.error); else { setOpen(null); setError(null); }
  });

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Log an activity">
        {KINDS.map(k => (
          <button key={k.kind} type="button" className={`btn btn-sm ${open?.kind === k.kind ? "btn-primary" : "btn-ghost"}`} aria-pressed={open?.kind === k.kind}
            onClick={() => { setError(null); setOpen(o => (o?.kind === k.kind ? null : k)); }}>
            <Icon name={k.icon} size={16} />{k.label}
          </button>
        ))}
      </div>
      {open && (
        <div className="grid gap-2">
          <label className="field">
            <span>{open.kind === "note" ? "Note" : `What happened on the ${open.label.toLowerCase()}? (optional)`}</span>
            <textarea ref={text} className="input" rows={2} maxLength={2000} autoFocus />
          </label>
          {error && <p className="error-text" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? "Saving…" : `Log ${open.label.toLowerCase()}`}</button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setOpen(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
