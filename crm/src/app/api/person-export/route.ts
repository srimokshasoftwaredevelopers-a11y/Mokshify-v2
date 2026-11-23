/* Owner only: everything Desk holds about one person (by email or phone), as JSON. */
import { audit } from "@/lib/audit";
import { currentUser } from "@/lib/auth";
import { findPerson } from "@/server/queries";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (user.role !== "owner") return Response.json({ error: "Only the owner can export a person's data." }, { status: 403 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 200);
  const found = await findPerson(q);
  if (!found) return Response.json({ error: "Search by a full email address or a 10-digit phone number." }, { status: 400 });
  const leads = found.leads.map(l => ({ ...l, activities: found.activities.filter(a => a.leadId === l.id), tasks: found.tasks.filter(x => x.leadId === l.id) }));
  await audit("data_export", { actorId: user.id, entity: "person", meta: { leads: leads.length, contacts: found.contacts.length, clients: found.clients.length } });
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), query: q, leads, contacts: found.contacts, clients: found.clients }, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="mokshify-person-export.json"`, "Cache-Control": "no-store" },
  });
}
