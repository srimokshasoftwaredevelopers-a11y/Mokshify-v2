import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { addUser, deletePerson, deleteStaleLeads, deleteTemplate, resetPassword, saveGeneral, saveLists, saveTemplate, setActive, setRole } from "@/actions/settings";
import { ActionForm } from "@/components/ActionForm";
import { DialogButton } from "@/components/DialogButton";
import { Badge, Field, PageHeader, SelectField } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { STAGES } from "@/lib/rules";
import { findPerson, getLostReasons, getSetting, getSources, listTemplates, staleLeads } from "@/server/queries";

export const metadata: Metadata = { title: "Settings" };

function Card({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="card grid gap-4 p-4 sm:p-5">
      <header><h2 id={`${id}-h`} className="text-lg">{title}</h2>{sub && <p className="text-sm text-ink-2">{sub}</p>}</header>
      {children}
    </section>
  );
}

type Business = { name?: string; city?: string; phone?: string; email?: string; website?: string; gstin?: string | null };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const me = await requireOwner();                      // a staff session gets 403 here
  const person = (await searchParams).person?.slice(0, 200);
  const db = await getDb();
  const [users, sources, reasons, templates, notify, business, retention] = await Promise.all([
    db.select().from(t.users).orderBy(asc(t.users.name)),
    getSources(), getLostReasons(), listTemplates(),
    getSetting<string>("notificationEmail", ""), getSetting<Business>("business", {}), getSetting<number>("retentionDays", 365),
  ]);
  const [stale, found] = await Promise.all([staleLeads(retention), person ? findPerson(person) : Promise.resolve(null)]);

  return (
    <>
      <PageHeader title="Settings" sub="Owner only." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card id="users" title="Users" sub="Owners can do everything. Staff work leads, deals, tasks, clients and projects, but can't export, delete or open settings.">
          <ul className="divide-y divide-rule">
            {users.map(u => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0"><span className="block font-medium">{u.name}{u.id === me.id && <span className="label ml-2">You</span>}</span>
                  <span className="block truncate text-sm text-ink-2">{u.email} · last in {u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : "never"}</span></span>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={u.role === "owner" ? "info" : "muted"}>{u.role === "owner" ? "Owner" : "Staff"}</Badge>
                  {!u.active && <Badge tone="danger">Deactivated</Badge>}
                  {u.id !== me.id && (<>
                    <form action={setRole.bind(null, u.id, u.role === "owner" ? "staff" : "owner")}><button className="btn btn-quiet btn-sm">{u.role === "owner" ? "Make staff" : "Make owner"}</button></form>
                    <form action={setActive.bind(null, u.id, !u.active)}><button className="btn btn-quiet btn-sm">{u.active ? "Deactivate" : "Reactivate"}</button></form>
                  </>)}
                  <DialogButton label="Password" title={`New password for ${u.name}`} className="btn btn-quiet btn-sm">
                    <ActionForm action={resetPassword.bind(null, u.id)} submit="Set password"><Field label="New password (12+ characters)" name="password" type="password" required /></ActionForm>
                  </DialogButton>
                </span>
              </li>
            ))}
          </ul>
          <DialogButton label="Add user" title="Add a user" icon="plus" className="btn btn-ghost justify-self-start">
            <ActionForm action={addUser} submit="Add user">
              <Field label="Name" name="name" required /><Field label="Email" name="email" type="email" required />
              <SelectField label="Role" name="role" defaultValue="staff" options={[{ value: "staff", label: "Staff" }, { value: "owner", label: "Owner" }]} />
              <Field label="Starting password (12+ characters)" name="password" type="password" required />
            </ActionForm>
          </DialogButton>
        </Card>

        <Card id="stages" title="Pipeline stages" sub="Fixed: the rules (next step, stale flags, won and lost) and the reports depend on them.">
          <ol className="flex flex-wrap gap-2">{STAGES.map((s, i) => <li key={s.key} className="badge tone-muted !text-ink"><span className="mono text-ink-2">{i + 1}</span>{s.label} <span className="mono text-ink-2">{s.probability}%</span></li>)}</ol>
        </Card>

        <Card id="lists" title="Sources and lost reasons" sub="One per line. Existing leads keep the source they were saved with.">
          <ActionForm action={saveLists} submit="Save lists" keepOpen submitClass="btn btn-ghost justify-self-start">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field"><span>Lead sources</span><textarea className="input" name="sources" rows={8} defaultValue={sources.join("\n")} /></label>
              <label className="field"><span>Lost reasons</span><textarea className="input" name="lostReasons" rows={8} defaultValue={reasons.join("\n")} /></label>
            </div>
          </ActionForm>
        </Card>

        <Card id="templates" title="Reply templates" sub="Placeholders: {name} {company} {service} {owner}.">
          <ul className="divide-y divide-rule">
            {templates.map(x => (
              <li key={x.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <span className="min-w-0 flex-1"><span className="block font-medium">{x.name} <span className="label ml-1">{x.channel === "whatsapp" ? "WhatsApp" : "Email"}</span></span>
                  <span className="line-clamp-2 block text-sm text-ink-2">{x.body}</span></span>
                <span className="flex gap-1">
                  <DialogButton label="Edit" title={`Edit “${x.name}”`} className="btn btn-quiet btn-sm">
                    <ActionForm action={saveTemplate.bind(null, x.id)} submit="Save template">
                      <input type="hidden" name="channel" value={x.channel} />
                      <Field label="Name" name="name" required defaultValue={x.name} />
                      {x.channel === "email" && <Field label="Subject" name="subject" defaultValue={x.subject} />}
                      <Field label="Message" name="body" type="textarea" required defaultValue={x.body} />
                    </ActionForm>
                  </DialogButton>
                  <form action={deleteTemplate.bind(null, x.id)}><button className="btn btn-quiet btn-sm text-ink-2">Delete</button></form>
                </span>
              </li>
            ))}
          </ul>
          <DialogButton label="Add template" title="New reply template" icon="plus" className="btn btn-ghost justify-self-start">
            <ActionForm action={saveTemplate.bind(null, null)} submit="Add template">
              <SelectField label="Channel" name="channel" options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "email", label: "Email" }]} />
              <Field label="Name" name="name" required /><Field label="Subject (email only)" name="subject" />
              <Field label="Message" name="body" type="textarea" required placeholder="Hello {name}, …" />
            </ActionForm>
          </DialogButton>
        </Card>

        <Card id="general" title="Notifications and business details" sub="New website enquiries are emailed to the notification address (when SMTP is set up).">
          <ActionForm action={saveGeneral} submit="Save" keepOpen submitClass="btn btn-ghost justify-self-start">
            <Field label="Notification email" name="notificationEmail" type="email" defaultValue={notify} placeholder="you@mokshify.io" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Business name" name="name" required defaultValue={business.name ?? "Mokshify"} /><Field label="City" name="city" defaultValue={business.city} />
              <Field label="Phone" name="phone" type="tel" defaultValue={business.phone} /><Field label="Email" name="email" type="email" defaultValue={business.email} />
              <Field label="Website" name="website" type="url" defaultValue={business.website} /><Field label="GSTIN" name="gstin" mono defaultValue={business.gstin} />
            </div>
            <Field label="Keep leads with no deal for (days)" name="retentionDays" type="number" min={90} max={3650} defaultValue={retention} hint="Older ones are flagged for deletion below." />
          </ActionForm>
        </Card>

        <Card id="data" title="Personal data" sub="Export or delete everything Desk holds about one person, and clear out old leads.">
          <form method="get" className="flex flex-wrap items-end gap-2">
            <Field label="Email or 10-digit phone" name="person" defaultValue={person} className="min-w-0 flex-1" />
            <button className="btn btn-ghost">Find</button>
          </form>
          {person && (found ? (
            <div className="grid gap-3 rounded-[6px] border border-rule p-3 text-sm">
              <p>Found {found.leads.length} lead{found.leads.length === 1 ? "" : "s"}, {found.contacts.length} contact entr{found.contacts.length === 1 ? "y" : "ies"} and {found.clients.length} client record{found.clients.length === 1 ? "" : "s"}.</p>
              <div className="flex flex-wrap gap-2">
                <a className="btn btn-ghost btn-sm" href={`/api/person-export?q=${encodeURIComponent(person)}`} download>Export as JSON</a>
                <form action={deletePerson.bind(null, person)}><button className="btn btn-sm border-danger text-danger">Delete this person&apos;s data</button></form>
              </div>
              <p className="text-xs text-ink-2">Deleting removes their leads (with timeline and tasks) and contact entries. On client records only their phone and email are cleared; invoices and payments stay.</p>
            </div>
          ) : <p className="error-text">Search by a full email address or a 10-digit phone number.</p>)}
          <div className="border-t border-rule pt-3">
            <p className="text-sm"><span className="font-medium">{stale.length}</span> lead{stale.length === 1 ? "" : "s"} older than {retention} days with no deal {stale.length === 1 ? "is" : "are"} flagged for deletion.</p>
            {stale.length > 0 && (<>
              <ul className="mt-2 max-h-40 overflow-y-auto text-sm text-ink-2">{stale.slice(0, 50).map(s => <li key={s.id}>{s.name} · {s.source} · {fmtDate(s.createdAt)}</li>)}</ul>
              <form action={deleteStaleLeads} className="mt-2"><button className="btn btn-sm border-danger text-danger">Delete {stale.length} flagged lead{stale.length === 1 ? "" : "s"}</button></form>
            </>)}
          </div>
        </Card>
      </div>
    </>
  );
}
