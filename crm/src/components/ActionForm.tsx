"use client";
import { useActionState, useEffect, useRef } from "react";

export type Result = { ok?: boolean; error?: string; fields?: Record<string, string>; message?: string };

/** Any server action as a form: shows its error or success, and on success resets itself and
    closes the dialog it sits in. The fields are ordinary server-rendered inputs (children). */
export function ActionForm({ action, children, submit, className = "grid gap-3", keepOpen, submitClass = "btn btn-primary" }: {
  action: (prev: Result, form: FormData) => Promise<Result>;
  children: React.ReactNode; submit: string; className?: string; keepOpen?: boolean; submitClass?: string;
}) {
  const [state, run, pending] = useActionState<Result, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.ok) return;
    ref.current?.reset();
    if (!keepOpen) ref.current?.closest("dialog")?.close();
  }, [state, keepOpen]);
  return (
    <form ref={ref} action={run} className={className} noValidate>
      {children}
      {state.error && <p className="error-text" role="alert">{state.error}</p>}
      <button className={submitClass} disabled={pending}>{pending ? "Saving…" : submit}</button>
      {state.ok && state.message && <p className="text-sm text-success" aria-live="polite">{state.message}</p>}
    </form>
  );
}
