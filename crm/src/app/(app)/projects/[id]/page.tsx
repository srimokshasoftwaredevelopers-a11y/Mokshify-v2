import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addPayment, cancelPayment, recordPayment, updateProject } from "@/actions/projects";
import { ActionForm } from "@/components/ActionForm";
import { DialogButton } from "@/components/DialogButton";
import { PaymentFields, ProjectFields, ReceivedFields } from "@/components/forms";
import { LogButtons } from "@/components/LogButtons";
import { Tasks } from "@/components/Tasks";
import { Timeline } from "@/components/Timeline";
import { Badge, Money, Section } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { dayIST, fmtDate } from "@/lib/format";
import { isPaymentOverdue, projectStatusLabel } from "@/lib/rules";
import { getProject } from "@/server/clients";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const p = await getProject(id);
  if (!p) notFound();
  const today = dayIST();
  const { agreed, received, balance } = p.money;
  const pct = agreed > 0 ? Math.min(100, Math.round((received / agreed) * 100)) : 0;
  const scheduled = p.payments.filter(x => x.status !== "cancelled").reduce((s, x) => s + x.amount, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="grid min-w-0 gap-6">
        <section className="card p-5" aria-labelledby="project-h">
          <p className="label mb-2"><Link href="/projects" className="hover:underline">Projects</Link> / {projectStatusLabel(p.status)}</p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 id="project-h" className="text-[26px]">{p.name}</h1>
              <p className="text-ink-2"><Link className="link" href={`/clients/${p.clientId}`}>{p.clientName}</Link>{p.type ? ` · ${p.type}` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={p.status === "delivered" || p.status === "maintenance" ? "success" : p.status === "advance_pending" ? "warning" : "info"}>{projectStatusLabel(p.status)}</Badge>
              {p.showOnWebsite && <Badge tone="success">On the website</Badge>}
            </div>
          </div>
          {/* rule 5: money is visible */}
          <dl className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-[6px] bg-limestone/60 p-3"><dt className="label">Agreed</dt><dd><Money value={agreed} className="text-lg font-semibold sm:text-xl" /></dd></div>
            <div className="rounded-[6px] bg-limestone/60 p-3"><dt className="label">Received</dt><dd><Money value={received} className="text-lg font-semibold text-success sm:text-xl" /></dd></div>
            <div className="rounded-[6px] bg-limestone/60 p-3"><dt className="label">Balance</dt><dd data-testid="balance"><Money value={balance} className={`text-lg font-semibold sm:text-xl ${balance > 0 ? "text-danger" : ""}`} /></dd></div>
          </dl>
          <svg className="mt-3 block h-2 w-full" viewBox="0 0 100 2" preserveAspectRatio="none" role="img" aria-label={`${pct}% received`}>
            <rect width="100" height="2" rx="1" className="fill-ink/10" /><rect width={pct} height="2" rx="1" className="fill-success" />
          </svg>
          {(p.liveUrl || p.repoUrl) && <p className="mt-3 flex flex-wrap gap-4 text-sm">{p.liveUrl && <a className="link" href={p.liveUrl} target="_blank" rel="noopener noreferrer">Live site ↗</a>}{p.repoUrl && <a className="link" href={p.repoUrl} target="_blank" rel="noopener noreferrer">Repository ↗</a>}</p>}
        </section>

        <Section title="Milestones and payments" id="payments" count={p.payments.length}
          action={<DialogButton label="Add milestone" title="New payment milestone" icon="plus" className="btn btn-ghost btn-sm"><ActionForm action={addPayment.bind(null, p.id)} submit="Add milestone"><PaymentFields /></ActionForm></DialogButton>}>
          {scheduled !== agreed && agreed > 0 && <p className="mb-2 text-sm text-warning-ink">Milestones add up to <Money value={scheduled} />, not the agreed <Money value={agreed} />.</p>}
          {p.payments.length ? (
            <ul className="card divide-y divide-rule">
              {p.payments.map(x => {
                const overdue = isPaymentOverdue(x, today);
                return (
                  <li key={x.id} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${x.status === "cancelled" ? "opacity-60" : ""}`}>
                    <span className="min-w-0">
                      <span className={`block font-medium ${x.status === "cancelled" ? "line-through" : ""}`}>{x.milestone}</span>
                      <span className="mono block text-xs text-ink-2">{x.status === "received" ? `Received ${fmtDate(x.receivedDate)} · ${x.method}${x.reference ? ` · ${x.reference}` : ""}` : `Due ${fmtDate(x.dueDate)}`}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      {x.status === "received" ? <Badge tone="success">Received</Badge> : x.status === "cancelled" ? <Badge tone="muted">Cancelled</Badge> : overdue ? <Badge tone="danger">Overdue</Badge> : <Badge tone="info">Due</Badge>}
                      <Money value={x.amount} className="font-semibold" />
                      {x.status === "due" && (<>
                        <DialogButton label="Record payment" title={`Payment for “${x.milestone}”`} className="btn btn-primary btn-sm">
                          <ActionForm action={recordPayment.bind(null, x.id)} submit="Record payment"><ReceivedFields amount={x.amount} /></ActionForm>
                        </DialogButton>
                        <form action={cancelPayment.bind(null, x.id)}><button className="btn btn-quiet btn-sm text-ink-2">Cancel</button></form>
                      </>)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="card px-4 py-6 text-center text-sm text-ink-2">No milestones yet. Add the advance first.</p>}
        </Section>

        <Section title="Timeline" id="timeline">
          <div className="card grid gap-4 p-4"><LogButtons target={{ projectId: p.id, clientId: p.clientId }} /><Timeline items={p.activity} /></div>
        </Section>
      </div>

      <aside className="grid gap-6">
        <section className="card p-4" aria-labelledby="edit-h"><h2 id="edit-h" className="mb-3 text-base">Project</h2>
          <ActionForm action={updateProject.bind(null, p.id)} submit="Save" keepOpen submitClass="btn btn-ghost"><ProjectFields p={p} /></ActionForm>
        </section>
        {p.dealId && <p className="text-sm"><Link className="link" href={`/deals/${p.dealId}`}>The deal this came from</Link></p>}
        <section className="card p-4" aria-labelledby="tasks-h"><h2 id="tasks-h" className="mb-3 text-base">Tasks</h2><Tasks tasks={p.tasks} target={{ projectId: p.id }} /></section>
      </aside>
    </div>
  );
}
