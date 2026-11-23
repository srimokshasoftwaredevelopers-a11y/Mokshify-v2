"use client";
import Link from "next/link";
import { useOptimistic, useState } from "react";
import { Icon } from "@/components/icons";
import { MoveDialog, type MovableDeal } from "@/components/MoveDialog";
import { dayIST, fmtDate, rupeesShort } from "@/lib/format";
import { STAGES, isOpen, type Stage } from "@/lib/rules";

export type Card = MovableDeal & { who: string | null; ownerName: string | null; stale: string[]; idleDays: number; lostReason: string | null };

function DealCard({ d, onMove, today }: { d: Card; onMove: (d: Card) => void; today: string }) {
  const late = !!d.nextActionDate && d.nextActionDate < today && isOpen(d.stage as Stage);
  return (
    <article draggable onDragStart={e => { e.dataTransfer.setData("text/deal", d.id); e.dataTransfer.effectAllowed = "move"; }}
      className="card grid cursor-grab gap-2 p-3 active:cursor-grabbing" aria-label={d.title}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/deals/${d.id}`} className="min-w-0 font-medium leading-snug hover:underline">{d.title}</Link>
        <span className="mono shrink-0 text-sm font-semibold" title={`₹${d.value.toLocaleString("en-IN")}`}>{rupeesShort(d.value)}</span>
      </div>
      {d.who && <p className="-mt-1 truncate text-xs text-ink-2">{d.who}</p>}
      {isOpen(d.stage as Stage) && d.nextAction && (
        <p className="text-[13px] leading-snug"><span className="text-ink-2">Next:</span> {d.nextAction}
          <span className={`mono block text-xs ${late ? "text-danger" : "text-ink-2"}`}>{late ? "Overdue · " : ""}{d.nextActionDate === today ? "Today" : fmtDate(d.nextActionDate)}</span></p>
      )}
      {d.stage === "lost" && d.lostReason && <p className="text-xs text-ink-2">Lost: {d.lostReason}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap gap-1">
          {d.stale.includes("idle") && <span className="badge tone-danger"><Icon name="alert" size={12} />Idle {d.idleDays}d</span>}
          {d.stale.includes("proposal") && <span className="badge tone-warning">Unanswered 3d+</span>}
        </span>
        <button type="button" className="btn btn-quiet btn-sm !min-h-9 !px-2 text-xs" onClick={() => onMove(d)} aria-label={`Move ${d.title} to another stage`}><Icon name="move" size={14} />Move</button>
      </div>
    </article>
  );
}

export function Board({ deals, lostReasons }: { deals: Card[]; lostReasons: string[] }) {
  const [moving, setMoving] = useState<{ deal: Card; to: Stage | null } | null>(null);
  const [shown, setOptimistic] = useOptimistic(deals, (state, m: { id: string; to: Stage }) => state.map(d => (d.id === m.id ? { ...d, stage: m.to, stale: [] } : d)));
  // phones open on the first stage that has something in it
  const [mobileStage, setMobileStage] = useState<Stage>(() => (STAGES.find(s => isOpen(s.key) && deals.some(d => d.stage === s.key))?.key ?? "new"));
  const [over, setOver] = useState<Stage | null>(null);
  const today = dayIST();
  const col = (s: Stage) => shown.filter(d => d.stage === s);
  const total = (s: Stage) => col(s).reduce((a, d) => a + d.value, 0);
  // called inside MoveDialog's async transition, so the card stays in its new column until the server answers
  const optimistic = (id: string, to: Stage) => setOptimistic({ id, to });

  return (
    <>
      {/* desktop: one column per stage, drag a card to move it (or use its Move button) */}
      <div className="hidden gap-3 overflow-x-auto pb-3 lg:grid lg:auto-cols-[minmax(13rem,1fr)] lg:grid-flow-col" role="list" aria-label="Pipeline">
        {STAGES.map(s => (
          <section key={s.key} role="listitem" aria-labelledby={`col-${s.key}`}
            onDragOver={e => { e.preventDefault(); setOver(s.key); }} onDragLeave={() => setOver(o => (o === s.key ? null : o))}
            onDrop={e => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/deal"); const d = shown.find(x => x.id === id); if (d && d.stage !== s.key) setMoving({ deal: d, to: s.key }); }}
            className={`flex min-h-64 flex-col gap-2 rounded-[6px] p-2 transition-colors duration-150 ${over === s.key ? "bg-brass/15 outline-2 outline-dashed outline-brass" : "bg-ink/[.035]"}`}>
            <header className="flex items-baseline justify-between gap-2 px-1 pb-1">
              <h2 id={`col-${s.key}`} className={`text-sm font-semibold ${s.key === "won" ? "text-success" : s.key === "lost" ? "text-ink-2" : ""}`}>{s.label} <span className="mono font-normal text-ink-2">{col(s.key).length}</span></h2>
              <span className="mono text-xs text-ink-2">{rupeesShort(total(s.key))}</span>
            </header>
            {col(s.key).map(d => <DealCard key={d.id} d={d} today={today} onMove={x => setMoving({ deal: x, to: null })} />)}
            {!col(s.key).length && <p className="rounded-[6px] border border-dashed border-rule px-2 py-6 text-center text-xs text-ink-2">{isOpen(s.key) ? "Drop a deal here" : s.key === "won" ? "Wins of the last 30 days" : "Losses of the last 30 days"}</p>}
          </section>
        ))}
      </div>

      {/* phones: a stage switcher, one column at a time, and "Move to" on each card */}
      <div className="lg:hidden">
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Stage">
          {STAGES.map(s => (
            <button key={s.key} type="button" aria-pressed={mobileStage === s.key} onClick={() => setMobileStage(s.key)}
              className={`btn btn-sm shrink-0 !rounded-full ${mobileStage === s.key ? "btn-primary" : "btn-ghost"}`}>
              {s.label} <span className="mono opacity-75">{col(s.key).length}</span>
            </button>
          ))}
        </div>
        <p className="mb-2 flex items-baseline justify-between text-sm text-ink-2"><span>{STAGES.find(s => s.key === mobileStage)?.label}</span><span className="mono">{col(mobileStage).length} · {rupeesShort(total(mobileStage))}</span></p>
        <div className="grid gap-2">
          {col(mobileStage).map(d => <DealCard key={d.id} d={d} today={today} onMove={x => setMoving({ deal: x, to: null })} />)}
          {!col(mobileStage).length && <p className="card px-4 py-8 text-center text-sm text-ink-2">No deals in this stage.</p>}
        </div>
      </div>

      <MoveDialog deal={moving?.deal ?? null} to={moving?.to ?? null} lostReasons={lostReasons} onClose={() => setMoving(null)} onOptimistic={optimistic} />
    </>
  );
}
