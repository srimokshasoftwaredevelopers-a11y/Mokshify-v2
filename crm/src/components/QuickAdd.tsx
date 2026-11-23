"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { quickAddLead, type FormResult } from "@/actions/leads";
import { Icon } from "./icons";

/** A phone enquiry in 20 seconds: name, phone, source, one line. Reachable from every screen
    (the floating button), and from any button that dispatches "desk:quick-add". */
export function QuickAdd({ sources }: { sources: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [round, setRound] = useState(0);
  const [state, action, pending] = useActionState<FormResult, FormData>(quickAddLead, {});
  // the Name field has autoFocus: showModal() focuses it synchronously. (A delayed focus() here once
  // stole focus back from the Phone field mid-typing and put the number into Name.)
  const open = () => dialog.current?.showModal();

  useEffect(() => {
    const on = () => open();
    window.addEventListener("desk:quick-add", on);
    return () => window.removeEventListener("desk:quick-add", on);
  }, []);
  useEffect(() => { if (state.ok) { form.current?.reset(); setRound(r => r + 1); } }, [state]);

  return (
    <>
      <button type="button" onClick={open} aria-haspopup="dialog"
        className="btn btn-primary fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-30 !min-h-14 !rounded-full !px-5 shadow-[0_10px_24px_-8px_rgb(42_10_18/.55)] lg:bottom-8 lg:right-8">
        <Icon name="plus" size={22} /><span>Quick add</span>
      </button>
      <dialog ref={dialog} aria-labelledby="qa-title"
        className="m-0 mt-auto w-full max-w-none rounded-t-[14px] bg-paper p-0 text-ink backdrop:bg-oxblood-900/50 sm:m-auto sm:max-w-md sm:rounded-[6px]"
        onClick={e => { if (e.target === dialog.current) dialog.current?.close(); }}>
        <div className="grid gap-4 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            <h2 id="qa-title" className="text-lg">New enquiry</h2>
            <button type="button" className="btn btn-quiet btn-icon" onClick={() => dialog.current?.close()} aria-label="Close"><Icon name="close" /></button>
          </div>
          <form ref={form} action={action} className="grid gap-3" noValidate>
            <label className="field"><span>Name</span><input className="input" name="name" autoComplete="off" required maxLength={120} aria-invalid={!!state.fields?.name} autoFocus /></label>
            {state.fields?.name && <p className="error-text -mt-2">{state.fields.name}</p>}
            <label className="field"><span>Phone</span><input className="input mono" name="phone" type="tel" inputMode="tel" autoComplete="off" required maxLength={30} placeholder="+91 98765 43210" aria-invalid={!!state.fields?.phone} /></label>
            {state.fields?.phone && <p className="error-text -mt-2">{state.fields.phone}</p>}
            <label className="field"><span>Source</span>
              <select className="input" name="source" defaultValue={sources.includes("Phone call") ? "Phone call" : sources[0]}>
                {sources.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="field"><span>Note</span><input className="input" name="note" maxLength={300} placeholder="One line: what do they need?" /></label>
            <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save enquiry"}</button>
          </form>
          <div aria-live="polite" className="min-h-6 text-sm">
            {state.ok && state.id && round > 0 && (
              <p className="flex flex-wrap items-center gap-2 text-success"><Icon name="check" size={16} />Saved. It&apos;s on Today with its timer running.
                <Link className="link" href={`/leads/${state.id}`} onClick={() => dialog.current?.close()}>Open it</Link></p>
            )}
            {state.error && !state.fields && <p className="error-text" role="alert">{state.error}</p>}
          </div>
        </div>
      </dialog>
    </>
  );
}

export function QuickAddButton({ label = "Add lead", className = "btn btn-primary" }: { label?: string; className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("desk:quick-add"))}><Icon name="plus" size={18} />{label}</button>;
}
