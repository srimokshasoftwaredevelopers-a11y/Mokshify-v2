"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { moveStage, type DealResult } from "@/actions/deals";
import { addDays, dayIST } from "@/lib/format";
import { STAGES, isOpen, type Stage } from "@/lib/rules";
import { Icon } from "./icons";

export type MovableDeal = { id: string; title: string; stage: string; value: number; nextAction: string | null; nextActionDate: string | null };

/** Moving a stage always asks for what the rules need: the next step (open stages), a reason (lost),
    or the final value (won — which also creates the client and the project). */
export function MoveDialog({ deal, to, lostReasons, onClose, onOptimistic }: {
  deal: MovableDeal | null; to?: Stage | null; lostReasons: string[]; onClose: () => void; onOptimistic?: (id: string, to: Stage) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState<Stage>("contacted");
  const [res, setRes] = useState<DealResult>({});
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!deal) { ref.current?.close(); return; }
    setRes({});
    setStage(to ?? (deal.stage as Stage));
    if (!ref.current?.open) ref.current?.showModal();
  }, [deal, to]);

  if (!deal) return <dialog ref={ref} className="hidden" />;
  const open = isOpen(stage);
  const submit = (form: FormData) => {
    const input = stage === "won" ? { to: "won" as const, value: Number(form.get("value")), projectName: String(form.get("projectName") ?? "") }
      : stage === "lost" ? { to: "lost" as const, lostReason: String(form.get("lostReason") ?? ""), note: String(form.get("note") ?? "") }
      : { to: stage as Exclude<Stage, "won" | "lost">, nextAction: String(form.get("nextAction") ?? ""), nextActionDate: String(form.get("nextActionDate") ?? "") };
    start(async () => {
      onOptimistic?.(deal.id, stage);
      const r = await moveStage(deal.id, input);
      setRes(r);
      if (r.ok && stage !== "won") onClose();
    });
  };

  return (
    <dialog ref={ref} aria-labelledby="move-title" onClose={onClose}
      className="m-0 mt-auto w-full max-w-none rounded-t-[14px] bg-paper p-0 text-ink backdrop:bg-oxblood-900/50 sm:m-auto sm:max-w-md sm:rounded-[6px]">
      <form action={submit} className="grid gap-4 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h2 id="move-title" className="text-lg">Move deal</h2><p className="truncate text-sm text-ink-2">{deal.title}</p></div>
          <button type="button" className="btn btn-quiet btn-icon" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>

        {res.ok && res.projectId ? (
          <div className="grid gap-3" aria-live="polite">
            <p className="flex items-center gap-2 text-success"><Icon name="check" />Won. The client and the project are set up.</p>
            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-primary" href={`/projects/${res.projectId}`} onClick={onClose}>Open the project</Link>
              {res.clientId && <Link className="btn btn-ghost" href={`/clients/${res.clientId}`} onClick={onClose}>Open the client</Link>}
            </div>
          </div>
        ) : (<>
          <label className="field"><span>Move to</span>
            <select className="input" name="to" value={stage} onChange={e => { setStage(e.target.value as Stage); setRes({}); }}>
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}{s.key === deal.stage ? " (current)" : ""}</option>)}
            </select>
          </label>

          {open && (<>
            <p className="text-sm text-ink-2">An open deal always has its next step.</p>
            <label className="field"><span>Next action</span><input className="input" name="nextAction" required maxLength={200} defaultValue={deal.nextAction ?? ""} aria-invalid={!!res.fields?.nextAction} /></label>
            <label className="field"><span>By</span><input className="input mono" type="date" name="nextActionDate" required defaultValue={deal.nextActionDate && deal.nextActionDate >= dayIST() ? deal.nextActionDate : addDays(dayIST(), 1)} aria-invalid={!!res.fields?.nextActionDate} /></label>
          </>)}
          {stage === "lost" && (<>
            <label className="field"><span>Why was it lost?</span>
              <select className="input" name="lostReason" required defaultValue="">{[<option key="" value="" disabled>Choose a reason</option>, ...lostReasons.map(r => <option key={r}>{r}</option>)]}</select></label>
            <label className="field"><span>Note (optional)</span><input className="input" name="note" maxLength={500} /></label>
          </>)}
          {stage === "won" && (<>
            <label className="field"><span>Final value (₹)</span><input className="input mono" type="number" name="value" min={0} step={1} required defaultValue={deal.value} /></label>
            <label className="field"><span>Project name</span><input className="input" name="projectName" maxLength={160} defaultValue={deal.title} /></label>
            <p className="text-sm text-ink-2">Winning creates the client (if there isn&apos;t one yet) and the project, with this as the agreed amount.</p>
          </>)}

          {res.error && <p className="error-text" role="alert">{res.error}</p>}
          <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : stage === "won" ? "Mark as won" : stage === "lost" ? "Mark as lost" : "Move"}</button>
        </>)}
      </form>
    </dialog>
  );
}
