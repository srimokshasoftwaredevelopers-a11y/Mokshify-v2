import Link from "next/link";
import { Icon, type IconName } from "./icons";
import { rupees, rupeesShort } from "@/lib/format";

export function PageHeader({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-ink-2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Section({ title, count, total, children, id, action }: { title: string; count?: number; total?: React.ReactNode; children: React.ReactNode; id?: string; action?: React.ReactNode }) {
  return (
    <section aria-labelledby={id ? `${id}-h` : undefined} className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id ? `${id}-h` : undefined} className="text-lg">
          {title}
          {count !== undefined && <span className="mono ml-2 text-sm font-normal text-ink-2">{count}</span>}
        </h2>
        <div className="flex items-baseline gap-3">{total && <span className="mono text-sm text-ink-2">{total}</span>}{action}</div>
      </div>
      {children}
    </section>
  );
}

/** every list has one: what it is, and the one thing to do about it */
export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: { href: string; label: string } | React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-limestone text-ink-2"><Icon name={icon} /></span>
      <p className="font-medium">{title}</p>
      {body && <p className="max-w-sm text-sm text-ink-2">{body}</p>}
      {action && (typeof action === "object" && action !== null && "href" in action
        ? <Link href={action.href} className="btn btn-ghost btn-sm mt-2">{action.label}</Link>
        : <div className="mt-2">{action as React.ReactNode}</div>)}
    </div>
  );
}

/** a labelled input (server-rendered, for ActionForm) */
export function Field({ label, name, type = "text", defaultValue, required, placeholder, mono, min, max, step, hint, className = "" }: {
  label: string; name: string; type?: string; defaultValue?: string | number | null; required?: boolean; placeholder?: string; mono?: boolean;
  min?: number | string; max?: number | string; step?: number; hint?: string; className?: string;
}) {
  return (
    <label className={`field ${className}`}><span>{label}</span>
      {type === "textarea"
        ? <textarea className="input" name={name} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} rows={3} />
        : <input className={`input ${mono || ["number", "date", "tel"].includes(type) ? "mono" : ""}`} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} min={min} max={max} step={step} />}
      {hint && <span className="text-xs text-ink-2">{hint}</span>}
    </label>
  );
}
export function SelectField({ label, name, options, defaultValue, className = "" }: { label: string; name: string; options: { value: string; label: string }[]; defaultValue?: string | null; className?: string }) {
  return (
    <label className={`field ${className}`}><span>{label}</span>
      <select className="input" name={name} defaultValue={defaultValue ?? undefined}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    </label>
  );
}

export type Tone ="success" | "warning" | "danger" | "info" | "muted";
export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function Money({ value, short, className = "" }: { value: number; short?: boolean; className?: string }) {
  return <span className={`mono ${className}`} title={short ? rupees(value) : undefined}>{short ? rupeesShort(value) : rupees(value)}</span>;
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton h-16" />)}
    </div>
  );
}

export function ErrorState({ message, retry }: { message?: string; retry?: React.ReactNode }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-2 border-danger/30 px-6 py-8 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-danger/10 text-danger"><Icon name="alert" /></span>
      <p className="font-medium">Something went wrong loading this.</p>
      <p className="max-w-sm text-sm text-ink-2">{message ?? "Nothing was lost. Try again; if it keeps happening, tell the owner."}</p>
      {retry}
    </div>
  );
}
