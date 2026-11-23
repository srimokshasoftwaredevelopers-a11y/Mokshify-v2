"use client";
import { useActionState, useEffect, useOptimistic, useRef, useTransition } from "react";
import { addTask, setTaskDone, type ActionResult } from "@/actions/activity";
import { dayIST, taskDue } from "@/lib/format";
import { Icon } from "./icons";

type Task = { id: string; title: string; dueAt: Date | string | null; done: boolean };

export function TaskCheck({ task }: { task: Task }) {
  const [done, setDone] = useOptimistic(task.done);
  const [, start] = useTransition();
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" className="h-5 w-5 accent-oxblood-700" checked={done}
        onChange={e => { const v = e.target.checked; start(async () => { setDone(v); await setTaskDone(task.id, v); }); }} />
      <span className={done ? "text-ink-2 line-through" : ""}>{task.title}</span>
    </label>
  );
}

/** tasks for one record: tick them off (optimistically) and add new ones */
export function Tasks({ tasks, target }: { tasks: Task[]; target: { leadId?: string; dealId?: string; clientId?: string; projectId?: string } }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(addTask, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) form.current?.reset(); }, [state]);
  return (
    <div className="grid gap-3">
      {tasks.length ? (
        <ul className="divide-y divide-rule">
          {tasks.map(t => { const d = taskDue(t); return (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-3">
              <TaskCheck task={t} />
              <span className={`mono text-xs ${d.overdue ? "text-danger" : "text-ink-2"}`}>{d.overdue && "Overdue · "}{d.text}</span>
            </li>
          ); })}
        </ul>
      ) : <p className="text-sm text-ink-2">No tasks yet.</p>}
      {/* works at any width, including the 22rem sidebar: title on its own row, then date · time · add */}
      <form ref={form} action={action} className="grid grid-cols-[minmax(0,1fr)_minmax(0,7rem)] items-end gap-2">
        {Object.entries(target).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
        <label className="field col-span-2"><span>New task</span><input className="input" name="title" maxLength={200} required placeholder="e.g. Send the revised quote" /></label>
        <label className="field"><span>Due</span><input className="input mono" type="date" name="dueDate" defaultValue={dayIST()} /></label>
        <label className="field"><span>Time</span><input className="input mono" type="time" name="dueTime" defaultValue="10:00" /></label>
        <button className="btn btn-ghost col-span-2" disabled={pending}><Icon name="plus" size={18} />Add task</button>
      </form>
      {state.error && <p className="error-text" role="alert">{state.error}</p>}
    </div>
  );
}
