import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, Money, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { PROJECT_STATUSES, projectStatusLabel } from "@/lib/rules";
import { listProjects } from "@/server/clients";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser();
  const status = (await searchParams).status;
  const projects = await listProjects(status);
  const outstanding = projects.reduce((s, p) => s + Math.max(0, p.agreedAmount - p.received), 0);
  const chip = (key: string | undefined, label: string) => (
    <Link key={label} href={key ? `/projects?status=${key}` : "/projects"} aria-current={status === key || (!status && !key) ? "page" : undefined}
      className={`btn btn-sm shrink-0 !rounded-full ${status === key || (!status && !key) ? "btn-primary" : "btn-ghost"}`}>{label}</Link>
  );
  return (
    <>
      <PageHeader title="Projects" sub={<>{projects.length} shown · outstanding <Money value={outstanding} /></>} />
      <nav aria-label="Filter by status" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {chip(undefined, "All")}{PROJECT_STATUSES.map(s => chip(s.key, s.label))}
      </nav>
      {projects.length ? (
        <>
          <div className="card hidden overflow-x-auto lg:block">
            <table className="table">
              <thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Due</th><th className="text-right">Agreed</th><th className="text-right">Received</th><th className="text-right">Balance</th></tr></thead>
              <tbody>{projects.map(p => (
                <tr key={p.id}>
                  <td><Link className="font-medium hover:underline" href={`/projects/${p.id}`}>{p.name}</Link>{p.showOnWebsite && <span className="label ml-2 !text-success">On website</span>}</td>
                  <td><Link className="hover:underline" href={`/clients/${p.clientId}`}>{p.clientName}</Link></td>
                  <td><Badge tone={p.status === "delivered" || p.status === "maintenance" ? "success" : p.status === "advance_pending" ? "warning" : "info"}>{projectStatusLabel(p.status)}</Badge></td>
                  <td className="mono whitespace-nowrap">{fmtDate(p.dueDate)}</td>
                  <td className="text-right"><Money value={p.agreedAmount} /></td>
                  <td className="text-right"><Money value={p.received} /></td>
                  <td className="text-right"><Money value={p.agreedAmount - p.received} className={p.agreedAmount - p.received > 0 ? "font-semibold" : "text-success"} />{p.overdue > 0 && <span className="block"><Badge tone="danger">Overdue <Money value={p.overdue} short /></Badge></span>}</td>
                </tr>))}
              </tbody>
            </table>
          </div>
          <ul className="grid grid-cols-1 gap-2 lg:hidden">{projects.map(p => (
            <li key={p.id}><Link href={`/projects/${p.id}`} className="card flex flex-col gap-1.5 p-3 no-underline">
              <span className="flex items-start justify-between gap-2"><span className="font-medium">{p.name}</span><Badge tone={p.status === "delivered" || p.status === "maintenance" ? "success" : p.status === "advance_pending" ? "warning" : "info"}>{projectStatusLabel(p.status)}</Badge></span>
              <span className="text-sm text-ink-2">{p.clientName}{p.dueDate ? ` · due ${fmtDate(p.dueDate)}` : ""}</span>
              <span className="flex flex-wrap items-center gap-x-3 text-sm"><span>Balance <Money value={p.agreedAmount - p.received} className="font-semibold" /></span><span className="text-ink-2">of <Money value={p.agreedAmount} short /></span>{p.overdue > 0 && <Badge tone="danger">Overdue <Money value={p.overdue} short /></Badge>}</span>
            </Link></li>))}
          </ul>
        </>
      ) : <EmptyState icon="projects" title={status ? "No projects with this status." : "No projects yet."} body="Winning a deal creates its project. You can also start one from a client's page." action={{ href: status ? "/projects" : "/pipeline", label: status ? "Show all" : "Open the pipeline" }} />}
    </>
  );
}
