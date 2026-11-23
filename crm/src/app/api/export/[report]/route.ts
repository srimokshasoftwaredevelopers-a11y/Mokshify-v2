/* CSV export — owner only. Staff get 403 (checked here on the server; the button is also hidden). */
import { audit } from "@/lib/audit";
import { currentUser } from "@/lib/auth";
import { dayIST } from "@/lib/format";
import { REPORTS, parseRange, toCsv, type ReportKey } from "@/server/reports";

export async function GET(req: Request, { params }: { params: Promise<{ report: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (user.role !== "owner") return Response.json({ error: "Only the owner can export data." }, { status: 403 });
  const { report } = await params;
  if (!(report in REPORTS)) return Response.json({ error: "No such report." }, { status: 404 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const range = parseRange(sp);
  const rows = await REPORTS[report as ReportKey].get(range);
  await audit("export", { actorId: user.id, entity: "report", entityId: report, meta: { from: range.from, to: range.to, rows: rows.length } });
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mokshify-${report}-${range.from}-to-${range.to}.csv"`,
      "Cache-Control": "no-store",
      "X-Generated": dayIST(),
    },
  });
}
