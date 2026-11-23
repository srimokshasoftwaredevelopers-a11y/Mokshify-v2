/* The website's enquiry endpoint. Public by design, so it is strict:
   only the mokshify.io origins (CORS + an Origin check), small JSON bodies only, a per-IP rate limit,
   a honeypot, Zod validation, and the consent flag stored with its time. Answers are small JSON. */
import { after } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import * as t from "@/db/schema";
import { audit } from "@/lib/audit";
import { notifyNewLead } from "@/lib/notify";
import { clientIp, hit } from "@/lib/ratelimit";

const allowed = () => (process.env.PUBLIC_FORM_ORIGINS || "https://mokshify.io,https://www.mokshify.io").split(",").map(s => s.trim()).filter(Boolean);
const cors = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "600",
  Vary: "Origin",
  "Cache-Control": "no-store",
});
const reply = (body: Record<string, unknown>, status: number, origin?: string) => Response.json(body, { status, headers: origin ? cors(origin) : { "Cache-Control": "no-store" } });

const s = (max: number) => z.string().trim().max(max).optional().transform(v => (v ? v : null));
const Lead = z.object({
  name: z.string().trim().min(2, "Please give your name.").max(120),
  email: z.string().trim().toLowerCase().max(200).optional().refine(v => !v || z.email().safeParse(v).success, "Please check the email address.").transform(v => v || null),
  phone: z.string().trim().max(30).optional().refine(v => !v || v.replace(/\D/g, "").length >= 10, "Please check the phone number.").transform(v => v || null),
  company: s(160), city: s(80), industry: s(80), service: s(120), budget: s(60),
  message: s(4000),
  consent: z.literal(true, { error: "Please tick the consent box." }),
  source: z.enum(["Website form", "Estimator"]).default("Website form"),
  page_url: z.string().trim().max(500).optional().refine(v => !v || /^https?:\/\//.test(v), "Bad page address.").transform(v => v || null),
  referrer: s(500),
  utm_source: s(100), utm_medium: s(100), utm_campaign: s(150), utm_term: s(150), utm_content: s(150),
  website: z.string().max(200).optional(),                               // the honeypot: people never see it
}).refine(l => l.email || l.phone, { message: "Please give an email address or a phone number.", path: ["email"] });

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (!allowed().includes(origin)) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: cors(origin) });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (!allowed().includes(origin)) return reply({ ok: false, error: "Not allowed from this site." }, 403);
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return reply({ ok: false, error: "Send JSON." }, 415, origin);
  if (Number(req.headers.get("content-length") ?? 0) > 16_000) return reply({ ok: false, error: "Too long." }, 413, origin);

  const limit = await hit("public-lead", clientIp(req.headers), Number(process.env.PUBLIC_LEAD_LIMIT) || 5, 10 * 60);
  if (!limit.allowed) return Response.json({ ok: false, error: "Too many messages from here. Please WhatsApp us instead." }, { status: 429, headers: { ...cors(origin), "Retry-After": String(limit.retryAfter) } });

  let body: unknown;
  try { body = JSON.parse((await req.text()).slice(0, 16_000)); } catch { return reply({ ok: false, error: "Send JSON." }, 400, origin); }
  if (body && typeof body === "object" && "website" in body && String((body as { website: unknown }).website ?? "").trim() !== "") {
    return reply({ ok: false, error: "Rejected." }, 400, origin);         // honeypot filled: a bot
  }
  const parsed = Lead.safeParse(body);
  if (!parsed.success) return reply({ ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form.", field: String(parsed.error.issues[0]?.path[0] ?? "") }, 422, origin);
  const l = parsed.data;

  const db = await getDb();
  const [lead] = await db.insert(t.leads).values({
    name: l.name, email: l.email, phone: l.phone, company: l.company, city: l.city, industry: l.industry, serviceInterest: l.service, budgetRange: l.budget,
    message: l.message, source: l.source, sourcePageUrl: l.page_url, referrer: l.referrer,
    utmSource: l.utm_source, utmMedium: l.utm_medium, utmCampaign: l.utm_campaign, utmTerm: l.utm_term, utmContent: l.utm_content,
    consent: true, consentAt: new Date(),
  }).returning({ id: t.leads.id });
  await audit("lead_create", { entity: "lead", entityId: lead!.id, meta: { via: "website", source: l.source } });
  // the notification goes out after the response: the visitor never waits on email
  after(() => notifyNewLead({ id: lead!.id, name: l.name, company: l.company, source: l.source, serviceInterest: l.service, pageUrl: l.page_url }));
  return reply({ ok: true }, 201, origin);
}
