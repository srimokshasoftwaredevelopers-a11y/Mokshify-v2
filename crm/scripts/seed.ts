/* Seeds.
     npm run seed          owner account from OWNER_EMAIL / OWNER_PASSWORD, default settings and reply templates
     npm run seed:demo     fictional demo data (every row flagged demo = true; names say "Demo", emails are @example.com,
                           phones are +91 90000 000xx). A demo staff user is added when DEMO_STAFF_PASSWORD is set.
     npm run demo:remove   deletes every demo row, and nothing else */
import { eq, sql } from "drizzle-orm";
import { handle } from "../src/db/client";
import * as t from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";
import { addDays, dayIST } from "../src/lib/format";
import { DEFAULT_LOST_REASONS, DEFAULT_SOURCES } from "../src/lib/rules";

const mode = process.argv[2] ?? "owner";
const h = await handle();
const db = h.db;

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
const daysAgo = (d: number) => minutesAgo(d * 1440);
const today = dayIST();

async function seedOwner() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password) throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD.");
  if (password.length < 12) throw new Error("OWNER_PASSWORD must be at least 12 characters.");
  const [existing] = await db.select({ id: t.users.id }).from(t.users).where(eq(sql`lower(${t.users.email})`, email)).limit(1);
  if (existing) console.log("owner already exists — left unchanged");
  else {
    await db.insert(t.users).values({ name: process.env.OWNER_NAME?.trim() || "Owner", email, passwordHash: await hashPassword(password), role: "owner" });
    console.log("owner created");
  }
  const defaults: Record<string, unknown> = {
    sources: DEFAULT_SOURCES,
    lostReasons: DEFAULT_LOST_REASONS,
    stageLabels: {},
    retentionDays: 365,
    notificationEmail: process.env.NOTIFY_EMAIL || "",
    business: { name: "Mokshify", city: "Hyderabad", phone: "+91 93912 48520", email: "hello@mokshify.io", website: "https://mokshify.io", gstin: null },
  };
  for (const [key, value] of Object.entries(defaults)) await db.insert(t.settings).values({ key, value }).onConflictDoNothing();
  const [{ n } = { n: 0 }] = await db.select({ n: sql<number>`count(*)::int` }).from(t.templates);
  if (!n) {
    await db.insert(t.templates).values([
      { channel: "whatsapp", name: "First reply", sortOrder: 1, body: "Hello {name}, this is {owner} from Mokshify. Thank you for your enquiry about {service}. Is now a good time for a quick call?" },
      { channel: "whatsapp", name: "Follow-up", sortOrder: 2, body: "Hello {name}, just following up on your enquiry with Mokshify. Would you like to fix a short call this week?" },
      { channel: "whatsapp", name: "Proposal sent", sortOrder: 3, body: "Hello {name}, I've sent the proposal for {company}. Happy to walk you through it whenever suits you." },
      { channel: "email", name: "First reply", subject: "Your enquiry with Mokshify", sortOrder: 1, body: "Hello {name},\n\nThank you for writing to Mokshify about {service}. I'd like to understand what you need in a short call. When would suit you?\n\nRegards,\n{owner}\nMokshify · +91 93912 48520" },
      { channel: "email", name: "Follow-up", subject: "Following up — Mokshify", sortOrder: 2, body: "Hello {name},\n\nFollowing up on your enquiry. Shall we set up a 20-minute call this week?\n\nRegards,\n{owner}" },
    ]);
    console.log("default reply templates added");
  }
}

async function seedDemo() {
  const [owner] = await db.select().from(t.users).where(eq(t.users.role, "owner")).limit(1);
  if (!owner) throw new Error("Run `npm run seed` first: the demo data is assigned to the owner.");
  let staffId: string | null = null;
  if (process.env.DEMO_STAFF_PASSWORD) {
    const [s] = await db.insert(t.users).values({ name: "Staff Demo", email: "staff@example.com", passwordHash: await hashPassword(process.env.DEMO_STAFF_PASSWORD), role: "staff", demo: true }).onConflictDoNothing().returning();
    staffId = s?.id ?? null;
  }
  const o = owner.id, s = staffId ?? owner.id;

  const L = await db.insert(t.leads).values([
    { name: "Ravi Example", phone: "+91 90000 00001", email: "ravi@example.com", company: "Demo Tiffin Centre", city: "Hyderabad", industry: "Food", serviceInterest: "Website", budgetRange: "₹50K–1L", message: "Need a simple website with our menu and WhatsApp ordering.", source: "Website form", sourcePageUrl: "https://mokshify.io/services/web-application-development/", utmSource: "google", utmMedium: "organic", consent: true, consentAt: minutesAgo(3), createdAt: minutesAgo(3), ownerId: o, demo: true },
    { name: "Priya Sample", phone: "+91 90000 00002", email: "priya@example.com", company: "Demo Physio Clinic", city: "Vijayawada", industry: "Healthcare", serviceInterest: "Booking app", budgetRange: "₹1L–3L", message: "Patients should book slots online and get reminders.", source: "Website form", sourcePageUrl: "https://mokshify.io/industries/healthcare/", consent: true, consentAt: minutesAgo(38), createdAt: minutesAgo(38), ownerId: s, demo: true },
    { name: "Kiran Test", phone: "+91 90000 00003", company: "Demo Agro Traders", city: "Guntur", industry: "Agriculture", serviceInterest: "Product catalogue", source: "WhatsApp", createdAt: minutesAgo(190), ownerId: o, demo: true },
    { name: "Anil Demo", phone: "+91 90000 00004", email: "anil@example.com", company: "Demo Realty Partners", city: "Hyderabad", industry: "Real estate", serviceInterest: "Plot map website", budgetRange: "₹3L–6L", source: "Referral", createdAt: daysAgo(12), firstResponseAt: new Date(daysAgo(12).getTime() + 4 * 60_000), firstResponseSeconds: 240, status: "converted", ownerId: o, demo: true },
    { name: "Meena Placeholder", phone: "+91 90000 00005", email: "meena@example.com", company: "Demo Diagnostics Lab", city: "Warangal", industry: "Healthcare", serviceInterest: "Test booking website", budgetRange: "₹1L–3L", source: "Estimator", sourcePageUrl: "https://mokshify.io/estimate/", createdAt: daysAgo(20), firstResponseAt: new Date(daysAgo(20).getTime() + 22 * 60_000), firstResponseSeconds: 1320, status: "converted", ownerId: s, demo: true },
    { name: "Suresh Fictional", phone: "+91 90000 00006", company: "Demo Temple Trust", city: "Nellore", industry: "Community", serviceInterest: "Website", source: "Phone call", createdAt: daysAgo(30), firstResponseAt: daysAgo(30), firstResponseSeconds: 60, status: "converted", ownerId: o, demo: true },
    { name: "Lata Example", phone: "+91 90000 00007", email: "lata@example.com", company: "Demo Boutique", city: "Hyderabad", industry: "Retail", serviceInterest: "Online store", budgetRange: "Under ₹50K", source: "Website form", sourcePageUrl: "https://mokshify.io/", createdAt: daysAgo(45), firstResponseAt: new Date(daysAgo(45).getTime() + 95 * 60_000), firstResponseSeconds: 5700, status: "closed", ownerId: o, demo: true },
    { name: "Vijay Sample", phone: "+91 90000 00008", company: "Demo Coaching Centre", city: "Karimnagar", industry: "Education", serviceInterest: "Student app", source: "Walk-in", createdAt: daysAgo(4), firstResponseAt: daysAgo(4), firstResponseSeconds: 0, status: "contacted", ownerId: s, demo: true },
  ]).returning();
  const lead = (name: string) => L.find(l => l.name === name)!;

  const C = await db.insert(t.clients).values([
    { businessName: "Demo Realty Partners", phone: "+91 90000 00004", email: "anil@example.com", address: "Demo Road, Hyderabad", industry: "Real estate", ownerId: o, demo: true },
    { businessName: "Demo Diagnostics Lab", phone: "+91 90000 00005", email: "meena@example.com", address: "Demo Street, Warangal", gstin: "36AAAAA0000A1Z5", industry: "Healthcare", ownerId: s, demo: true },
    { businessName: "Demo Temple Trust", phone: "+91 90000 00006", address: "Demo Lane, Nellore", industry: "Community", ownerId: o, demo: true },
  ]).returning();
  const client = (n: string) => C.find(c => c.businessName === n)!;
  await db.insert(t.contacts).values([
    { clientId: client("Demo Realty Partners").id, name: "Anil Demo", role: "Partner", phone: "+91 90000 00004", email: "anil@example.com", isPrimary: true, demo: true },
    { clientId: client("Demo Diagnostics Lab").id, name: "Meena Placeholder", role: "Lab manager", phone: "+91 90000 00005", email: "meena@example.com", isPrimary: true, demo: true },
    { clientId: client("Demo Temple Trust").id, name: "Suresh Fictional", role: "Trustee", phone: "+91 90000 00006", isPrimary: true, demo: true },
  ]);

  const D = await db.insert(t.deals).values([
    { title: "Coaching centre student app", leadId: lead("Vijay Sample").id, stage: "discovery", value: 240000, probability: 35, nextAction: "Discovery call with the founder", nextActionDate: today, expectedCloseDate: addDays(today, 30), ownerId: s, stageChangedAt: daysAgo(3), lastActivityAt: daysAgo(3), demo: true },
    { title: "Realty phase-2 plot map", leadId: lead("Anil Demo").id, clientId: client("Demo Realty Partners").id, stage: "proposal", value: 420000, probability: 55, nextAction: "Call about the proposal", nextActionDate: addDays(today, -1), expectedCloseDate: addDays(today, 14), ownerId: o, stageChangedAt: daysAgo(5), lastActivityAt: daysAgo(5), demo: true },
    { title: "Lab home-collection booking", leadId: lead("Meena Placeholder").id, stage: "won", value: 180000, probability: 100, clientId: client("Demo Diagnostics Lab").id, ownerId: s, stageChangedAt: daysAgo(15), lastActivityAt: daysAgo(15), closedAt: daysAgo(15), demo: true },
    { title: "Temple website", leadId: lead("Suresh Fictional").id, stage: "won", value: 60000, probability: 100, clientId: client("Demo Temple Trust").id, ownerId: o, stageChangedAt: daysAgo(25), lastActivityAt: daysAgo(25), closedAt: daysAgo(25), demo: true },
    { title: "Boutique online store", leadId: lead("Lata Example").id, stage: "lost", value: 45000, probability: 0, lostReason: "Price", ownerId: o, stageChangedAt: daysAgo(40), lastActivityAt: daysAgo(40), closedAt: daysAgo(40), demo: true },
    { title: "Agro traders catalogue refresh", stage: "negotiation", value: 150000, probability: 75, nextAction: "Send revised quote", nextActionDate: addDays(today, 2), ownerId: o, stageChangedAt: daysAgo(9), lastActivityAt: daysAgo(9), demo: true },
  ]).returning();
  const deal = (title: string) => D.find(d => d.title === title)!;

  const P = await db.insert(t.projects).values([
    { clientId: client("Demo Diagnostics Lab").id, dealId: deal("Lab home-collection booking").id, name: "Home-collection booking site", type: "Website", status: "in_build", agreedAmount: 180000, startDate: addDays(today, -14), dueDate: addDays(today, 21), stackNotes: "Next.js, Postgres", demo: true },
    { clientId: client("Demo Temple Trust").id, dealId: deal("Temple website").id, name: "Temple website", type: "Website", status: "delivered", agreedAmount: 60000, startDate: addDays(today, -24), dueDate: addDays(today, -4), liveUrl: "https://temple.example.com", demo: true },
    { clientId: client("Demo Realty Partners").id, name: "Phase-1 sales site", type: "Website", status: "maintenance", agreedAmount: 250000, startDate: addDays(today, -120), dueDate: addDays(today, -60), liveUrl: "https://realty.example.com", showOnWebsite: false, demo: true },
  ]).returning();
  const project = (n: string) => P.find(p => p.name === n)!;

  await db.insert(t.payments).values([
    { projectId: project("Home-collection booking site").id, milestone: "Advance (40%)", amount: 72000, dueDate: addDays(today, -14), receivedDate: addDays(today, -13), method: "UPI", reference: "DEMO-UPI-001", status: "received", demo: true },
    { projectId: project("Home-collection booking site").id, milestone: "Design sign-off (30%)", amount: 54000, dueDate: addDays(today, -2), status: "due", demo: true },
    { projectId: project("Home-collection booking site").id, milestone: "Launch (30%)", amount: 54000, dueDate: addDays(today, 21), status: "due", demo: true },
    { projectId: project("Temple website").id, milestone: "Advance (50%)", amount: 30000, dueDate: addDays(today, -24), receivedDate: addDays(today, -24), method: "Bank transfer", reference: "DEMO-NEFT-002", status: "received", demo: true },
    { projectId: project("Temple website").id, milestone: "Handover (50%)", amount: 30000, dueDate: addDays(today, 4), status: "due", demo: true },
    { projectId: project("Phase-1 sales site").id, milestone: "Full payment", amount: 250000, dueDate: addDays(today, -60), receivedDate: addDays(today, -58), method: "Bank transfer", reference: "DEMO-NEFT-003", status: "received", demo: true },
  ]);

  await db.insert(t.renewals).values([
    { clientId: client("Demo Realty Partners").id, projectId: project("Phase-1 sales site").id, item: "domain", label: "realty.example.com", provider: "Demo Registrar", amount: 1200, renewalDate: addDays(today, 12), demo: true },
    { clientId: client("Demo Realty Partners").id, projectId: project("Phase-1 sales site").id, item: "hosting", label: "Annual hosting", provider: "Demo Cloud", amount: 9000, renewalDate: addDays(today, 2), demo: true },
    { clientId: client("Demo Temple Trust").id, projectId: project("Temple website").id, item: "ssl", label: "temple.example.com", provider: "Demo CA", amount: 0, renewalDate: addDays(today, 28), demo: true },
    { clientId: client("Demo Realty Partners").id, item: "maintenance", label: "Monthly care plan", provider: "Mokshify", amount: 6000, renewalDate: addDays(today, 60), demo: true },
  ]);

  const at = (d: number, hour: number) => { const x = new Date(`${addDays(today, d)}T00:00:00+05:30`); x.setHours(x.getHours() + hour); return x; };
  await db.insert(t.tasks).values([
    { title: "Send the agro catalogue samples", dueAt: at(-1, 11), dealId: deal("Agro traders catalogue refresh").id, ownerId: o, demo: true },
    { title: "Share login details with the lab", dueAt: at(0, 16), projectId: project("Home-collection booking site").id, clientId: client("Demo Diagnostics Lab").id, ownerId: s, demo: true },
    { title: "Check temple site analytics", dueAt: at(1, 10), clientId: client("Demo Temple Trust").id, ownerId: o, demo: true },
  ]);

  await db.insert(t.activities).values([
    { kind: "call", body: "Spoke about plot map phase 2. Wants the proposal this week.", leadId: lead("Anil Demo").id, dealId: deal("Realty phase-2 plot map").id, userId: o, occurredAt: daysAgo(7), demo: true },
    { kind: "stage_change", body: "Discovery call → Proposal sent", dealId: deal("Realty phase-2 plot map").id, userId: o, occurredAt: daysAgo(5), demo: true },
    { kind: "whatsapp", body: "Sent the first-reply template.", leadId: lead("Meena Placeholder").id, userId: s, occurredAt: daysAgo(20), demo: true },
    { kind: "meeting", body: "Walk-in visit; wants a student app with attendance.", leadId: lead("Vijay Sample").id, dealId: deal("Coaching centre student app").id, userId: s, occurredAt: daysAgo(4), demo: true },
    { kind: "note", body: "Lost on price; may come back next year.", dealId: deal("Boutique online store").id, userId: o, occurredAt: daysAgo(40), demo: true },
    { kind: "email", body: "Sent revised scope.", dealId: deal("Agro traders catalogue refresh").id, userId: o, occurredAt: daysAgo(9), demo: true },
  ]);
  console.log(`demo data loaded: ${L.length} leads, ${D.length} deals, ${C.length} clients, ${P.length} projects${staffId ? ", staff@example.com" : " (no staff user: DEMO_STAFF_PASSWORD not set)"}`);
}

async function removeDemo() {
  // children first; every table is filtered on demo = true and nothing else
  const order = [t.activities, t.tasks, t.payments, t.renewals, t.projects, t.deals, t.contacts, t.leads, t.clients, t.users] as const;
  for (const table of order) await db.delete(table).where(eq(table.demo, true));
  console.log("demo data removed");
}

try {
  if (mode === "owner") await seedOwner();
  else if (mode === "demo") await seedDemo();
  else if (mode === "remove-demo") await removeDemo();
  else throw new Error(`unknown mode: ${mode}`);
} finally {
  await h.close();
}
