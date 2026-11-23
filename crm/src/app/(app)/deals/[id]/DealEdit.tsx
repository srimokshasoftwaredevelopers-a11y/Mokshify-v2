"use client";
import { useActionState, useState } from "react";
import { updateDeal, type DealResult } from "@/actions/deals";
import { MoveDialog } from "@/components/MoveDialog";
import { Icon } from "@/components/icons";
import { isOpen, type Stage } from "@/lib/rules";

type Deal = { id: string; title: string; stage: string; value: number; probability: number; expectedCloseDate: string | null; ownerId: string | null; nextAction: string | null; nextActionDate: string | null };

export function StageControl({ deal, lostReasons }: { deal: Deal; lostReasons: string[] }) {
  const [moving, setMoving] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setMoving(true)}><Icon name="move" size={18} />Move stage</button>
      <MoveDialog deal={moving ? deal : null} lostReasons={lostReasons} onClose={() => setMoving(false)} />
    </>
  );
}

export function DealEdit({ deal, users }: { deal: Deal; users: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<DealResult, FormData>(updateDeal.bind(null, deal.id), {});
  const open = isOpen(deal.stage as Stage);
  return (
    <form action={action} className="grid gap-3">
      {open && (
        <fieldset className="grid gap-3 rounded-[6px] border border-brass/50 bg-brass/5 p-3">
          <legend className="label px-1">Next step</legend>
          <label className="field"><span>Next action</span><input className="input" name="nextAction" required maxLength={200} defaultValue={deal.nextAction ?? ""} aria-invalid={!!state.fields?.nextAction} /></label>
          <label className="field"><span>By</span><input className="input mono" type="date" name="nextActionDate" required defaultValue={deal.nextActionDate ?? ""} aria-invalid={!!state.fields?.nextActionDate} /></label>
        </fieldset>
      )}
      {!open && <><input type="hidden" name="nextAction" value={deal.nextAction ?? ""} /><input type="hidden" name="nextActionDate" value={deal.nextActionDate ?? ""} /></>}
      <label className="field"><span>Title</span><input className="input" name="title" required maxLength={160} defaultValue={deal.title} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field"><span>Value (₹)</span><input className="input mono" type="number" name="value" min={0} step={1} defaultValue={deal.value} /></label>
        <label className="field"><span>Probability %</span><input className="input mono" type="number" name="probability" min={0} max={100} defaultValue={deal.probability} /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="field"><span>Expected close</span><input className="input mono" type="date" name="expectedCloseDate" defaultValue={deal.expectedCloseDate ?? ""} /></label>
        <label className="field"><span>Owner</span><select className="input" name="ownerId" defaultValue={deal.ownerId ?? ""}><option value="">Unassigned</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
      </div>
      <button className="btn btn-ghost" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      <p aria-live="polite" className={`text-sm ${state.error ? "error-text" : "text-success"}`}>{state.error ?? (state.ok ? "Saved." : "")}</p>
    </form>
  );
}
