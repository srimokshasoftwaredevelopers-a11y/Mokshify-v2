"use client";
import { useId, useRef } from "react";
import { Icon, type IconName } from "./icons";

/** A button that opens a native dialog (focus trap, Esc to close): a bottom sheet on phones,
    centred on desktop. The content is server-rendered and passed in as children. */
export function DialogButton({ label, title, icon, children, className = "btn btn-ghost" }: {
  label: string; title: string; icon?: IconName; children: React.ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
        {icon && <Icon name={icon} size={18} />}{label}
      </button>
      <dialog ref={ref} aria-labelledby={id} onClick={e => { if (e.target === ref.current) ref.current?.close(); }}
        className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-[14px] bg-paper p-0 text-ink backdrop:bg-oxblood-900/50 sm:m-auto sm:max-w-md sm:rounded-[6px]">
        <div className="grid gap-4 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3">
            <h2 id={id} className="text-lg">{title}</h2>
            <button type="button" className="btn btn-quiet btn-icon" onClick={() => ref.current?.close()} aria-label="Close"><Icon name="close" /></button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
