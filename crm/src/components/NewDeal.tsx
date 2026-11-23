"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createDeal, type DealResult } from "@/actions/deals";
import { addDays, dayIST } from "@/lib/format";
import { OPEN_STAGES, stageLabel } from "@/lib/rules";
import { Icon } from "./icons";

/** a deal that didn't start as a lead (a referral, a repeat client): title, value, stage and the next step */
export function NewDeal({ clientId }: { clientId?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [state, action, pending] = useActionState<DealResult, FormData>(createDeal, {});
  useEffect(() => { if (state.ok && state.id) { ref.current?.close(); router.push(`/deals/${state.id}`); } }, [state, router]);
  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={() => ref.current?.showModal()}><Icon name="plus" size={18} />New deal</button>
      <dialog ref={ref} aria-labelledby="nd-title" className="m-0 mt-auto w-full max-w-none rounded-t-[14px] bg-paper p-0 text-ink backdrop:bg-oxblood-900/50 sm:m-auto sm:max-w-md sm:rounded-[6px]">
        <form action={action} className="grid gap-3 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between"><h2 id="nd-title" className="text-lg">New deal</h2>
            <button type="button" className="btn btn-quiet btn-icon" onClick={() => ref.current?.close()} aria-label="Close"><Icon name="close" /></button></div>
          {clientId && <input type="hidden" name="clientId" value={clientId} />}
          <label className="field"><span>Title</span><input className="input" name="title" required maxLength={160} placeholder="e.g. Clinic booking app" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="field"><span>Value (₹)</span><input className="input mono" type="number" name="value" min={0} step={1} defaultValue={0} required /></label>
            <label className="field"><span>Stage</span><select className="input" name="stage" defaultValue="new">{OPEN_STAGES.map(s => <option key={s} value={s}>{stageLabel(s)}</option>)}</select></label>
          </div>
          <label className="field"><span>Next action</span><input className="input" name="nextAction" required maxLength={200} placeholder="e.g. Discovery call" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="field"><span>By</span><input className="input mono" type="date" name="nextActionDate" required defaultValue={addDays(dayIST(), 1)} /></label>
            <label className="field"><span>Expected close</span><input className="input mono" type="date" name="expectedCloseDate" /></label>
          </div>
          {state.error && <p className="error-text" role="alert">{state.error}</p>}
          <button className="btn btn-primary" disabled={pending}>{pending ? "Creating…" : "Create deal"}</button>
        </form>
      </dialog>
    </>
  );
}
