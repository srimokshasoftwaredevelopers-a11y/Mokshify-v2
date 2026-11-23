# CLAUDE CODE PROMPT — Mokshify CRM ("Mokshify Desk")

Paste everything below into Claude Code at the root of the Mokshify repo.

---

## ROLE AND GOAL

You are the product designer and senior full-stack engineer for Mokshify, a software studio in Hyderabad. Build an internal CRM for the studio, called **Mokshify Desk**.

Its job is narrow and practical: every enquiry from mokshify.io is captured, answered within minutes, followed up until it is won or lost, and then tracked through delivery, payments and renewals. It is used by one to three people, mostly on a phone.

It must also look and feel good enough to show a client as an example of Mokshify's work.

## HOW TO WORK

1. Save this message as `crm/CRM_SPEC.md` and commit it first. Re-read it at the start of each phase.
2. Work on a new branch `feature/crm`, created from `redesign/enterprise`. All CRM code lives in a new top-level folder `crm/`. Do not change the marketing site except where Phase 6 says so.
3. Do not ask me questions. Record judgement calls in `crm/DECISIONS.md`. Keep `crm/PROGRESS.md` current.
4. Commit after every phase. Do not merge, do not deploy, do not create cloud resources.
5. If something fails three times, log it under "Unresolved" and move on.
6. Never invent real client data. Seed data must be obviously fictional and removable with one command.

## STACK

- Next.js (App Router) with TypeScript in strict mode, in `crm/`.
- PostgreSQL through Drizzle ORM. The production database will be Neon. For local development and tests use a local Postgres or PGlite, chosen by `DATABASE_URL`.
- Tailwind CSS with the token set below. No component library that imposes its own look.
- Zod for all input validation. Server actions or route handlers for all writes.
- Charts as light SVG components. No heavy chart library.
- Playwright for end-to-end tests, Vitest for unit tests.
- Installable as a PWA with a manifest and icons from `assets/brand/`.

## WHO USES IT

| Role | Can do |
|---|---|
| Owner | Everything, including users, settings, exports and deletions |
| Staff | Leads, deals, tasks, clients, projects; cannot export, delete or see settings |

## DATA MODEL

Design the schema properly, with foreign keys, indexes and timestamps on every table.

- **users**: name, email, password hash, role, active flag.
- **leads**: name, phone, email, company, city, industry, service interest, budget range, message, source, source page URL, UTM fields, referrer, consent flag and time, status, owner, first response time, created time.
- **deals**: linked lead or client, title, stage, value in rupees, expected close date, probability, lost reason, next action, next action date, owner.
- **clients**: business name, contact people, phone, email, address, GSTIN (optional), industry, notes.
- **projects**: client, name, type, status, start date, due date, live URL, repository URL, stack notes.
- **payments**: project, milestone name, amount, due date, received date, method, reference, status.
- **renewals**: client, item (domain, hosting, SSL, maintenance), provider, amount, renewal date, auto-reminder days, status.
- **tasks**: title, due date and time, linked lead, deal, client or project, owner, done flag.
- **activities**: a timeline of calls, WhatsApp messages, emails, meetings, notes and stage changes, each linked to a lead, deal, client or project.
- **templates**: reusable WhatsApp and email reply texts with placeholders.
- **audit_log**: who did what to which record and when.

**Pipeline stages:** New → Contacted → Discovery call → Proposal sent → Negotiation → Won / Lost.
**Project statuses:** Advance pending → In build → Client review → Delivered → Maintenance.
**Lead sources:** Website form, Estimator, WhatsApp, Phone call, Referral, Walk-in, Other.
**Lost reasons:** Price, Timing, Chose another vendor, No response, Not a fit, Other.

## THE RULES THAT MAKE IT USEFUL

Build these into the product, not only into the documentation:

1. **Speed to first reply.** Every new lead shows a live timer since it arrived. The timer is green under 5 minutes, amber under 60 minutes, red after that. The first logged reply stops it and stores the response time.
2. **One-tap reply.** On every lead: Call (a `tel:` link), WhatsApp (a `wa.me` link with the lead's number and a chosen template pre-filled), and Email. Using any of them offers to log the activity in one tap.
3. **No open deal without a next step.** A deal cannot be saved in an open stage without a next action and a date. Moving a stage asks for the next one.
4. **Nothing goes stale silently.** A deal with no activity for 7 days, or a proposal unanswered for 3 days, is flagged and appears on the Today screen.
5. **Money is visible.** Each project shows the agreed amount, the amount received and the balance. Payments past their due date are flagged and appear on the Today screen.
6. **Renewals are never missed.** Domain, hosting and maintenance renewals appear on the Today screen 30, 14 and 3 days before they are due.
7. **A phone enquiry takes 20 seconds to record.** A quick-add sheet with name, phone, source and one line of notes, reachable from every screen.

## SCREENS

### 1. Today (the home screen)

This is a work queue, not a wall of charts. In this order:

- **Reply now:** new leads without a first reply, oldest first, with the timer and the three reply buttons.
- **Follow up today:** tasks and next actions due today or overdue.
- **Waiting on the client:** proposals sent more than 3 days ago, deals idle for 7 days.
- **Money:** payments due this week and overdue, with totals.
- **Renewals:** due in the next 30 days.

Above the queue, four figures only: open pipeline value, won this month, average first-reply time (last 30 days), win rate (last 90 days). Each links to its report.

### 2. Leads
Table on desktop, cards on mobile. Filters for status, source, industry, owner and date. Search by name, phone or company. Bulk assign. Convert a lead to a deal in one step.

### 3. Pipeline
A board with one column per stage, showing the count and total value per column. Drag and drop on desktop. On mobile, a stage switcher with a "move to" action, because dragging is unreliable on phones. Each card shows the title, value, next action and its date, and an idle warning.

### 4. Lead and deal detail
Summary at the top, reply buttons, stage control, next action. Below it, one timeline of every activity, with quick buttons to log a call, a WhatsApp message, a note or a meeting.

### 5. Clients
List and detail. The detail shows contacts, projects, payments, renewals and the full timeline in tabs.

### 6. Projects and payments
List with status and balance. Detail with milestones and payments. A project can be marked as shown on the website, with its live URL.

### 7. Renewals
List sorted by date, with provider, amount and status. One action to mark renewed and set the next date.

### 8. Reports
- Leads by source and by industry.
- Funnel: how many reach each stage, and where they drop.
- First-reply time trend.
- Won and lost by month, with lost reasons.
- Revenue received by month, and outstanding balance.
- Which website page each lead came from.

Every chart has a table view and a date range. Owner only: CSV export.

### 9. Settings (owner only)
Users, pipeline stages, sources, lost reasons, reply templates, notification email, business details, data retention period, export and delete a person's data.

## DESIGN

Use the Mokshify brand, tuned for a working tool.

| Token | Value | Use |
|---|---|---|
| `--oxblood-900` | `#2A0A12` | Sidebar, login screen |
| `--oxblood-700` | `#4A1422` | Primary buttons, active states |
| `--limestone` | `#E4E2DC` | App background |
| `--paper` | `#F6F5F1` | Cards, tables, sheets |
| `--ink` | `#141012` | Text |
| `--brass` | `#B08D57` | Hairlines, focus rings, selected markers |

Status colours, used only for status and always with a text label or icon:
success `#2F6B4F`, warning `#9A6B14`, danger `#A12B2B`, info `#2B5C7A`.

- **Type:** Switzer for interface and headings, JetBrains Mono for money, dates, phone numbers and timers. Base size 15px, table rows 14px.
- **Layout:** oxblood sidebar on desktop; bottom tab bar on mobile with Today, Leads, Pipeline, Clients and More. A floating quick-add button on every screen.
- **Density:** comfortable on mobile, compact tables on desktop. Radius 6px on cards and inputs. Hairline borders, very light shadows.
- **Numbers:** Indian formatting for rupees (₹4,20,000), short form on cards (₹4.2L). Dates as 23 Nov 2026. Times in Asia/Kolkata.
- **States:** every list has a designed empty state with one clear action, a loading skeleton and an error state.
- **Feel:** fast and calm. Optimistic updates on stage moves and task ticks. Transitions under 200ms. Respect reduced motion.
- **Accessibility:** WCAG AA contrast, full keyboard use, visible focus, labelled inputs, touch targets of at least 44px.
- A light theme is required. A dark theme is optional and comes last.

## SECURITY AND PRIVACY

Treat this as a system holding personal data.

- Email and password login. Passwords hashed with Argon2id. Sessions in httpOnly, Secure, SameSite=Lax cookies. Login rate limiting and lockout.
- The first owner account is created from `OWNER_EMAIL` and `OWNER_PASSWORD` in the environment by a seed command. No public sign-up.
- Role checks on the server for every read and write. Never rely on hidden buttons.
- All input validated with Zod. Parameterised queries only. Output escaped.
- CSRF protection on all state-changing requests.
- Strict Content-Security-Policy and standard security headers.
- No personal data in logs or error messages.
- `audit_log` records logins, exports, deletions, role changes and stage changes.
- A person's data can be exported and deleted from Settings. Leads older than the retention period with no deal are flagged for deletion.
- All secrets come from environment variables. Provide `crm/.env.example`. Commit no secrets.

## PHASES

**Phase 1. Foundation.** Project setup, tokens, layout shell, schema and migrations, auth, roles, seed command with fictional demo data, audit log.

**Phase 2. Leads and the Today screen.** Lead list, detail, quick-add, timers, reply buttons, templates, activity timeline, tasks.

**Phase 3. Pipeline.** Deals, board, stage rules, next-action rule, stale flags, convert lead to deal, won and lost flows.

**Phase 4. Clients, projects, payments, renewals.** Won deal creates a client and a project. Milestones, payments, balances, renewals and their reminders.

**Phase 5. Reports and settings.** All reports, CSV export, settings screens, data export and deletion.

**Phase 6. Connect the website.**
- Public endpoint `POST /api/public/leads` in the CRM: accepts the website form fields, validates them, enforces a honeypot and a per-IP rate limit, allows requests only from the mokshify.io origins, stores the consent flag, and returns a small JSON result.
- Capture the page URL, referrer and UTM parameters with each submission.
- In the marketing site, point the `FORM_ENDPOINT` constant in `js/site.js` at a placeholder for this endpoint, keep the mailto fallback when it is unreachable, and add the CRM origin to `connect-src` in `vercel.json` and `_headers`.
- Add a short consent line under the website forms, linking to the privacy page.
- Send the estimator result to the same endpoint when a visitor chooses to share it.
- On a new lead, send a notification email through SMTP settings from the environment. If SMTP is not configured, skip it without failing.

**Phase 7. Polish.** PWA, empty states, mobile pass, performance, accessibility, optional dark theme.

## SELF-REVIEW

After each phase, with the fictional seed data loaded:

1. Screenshot every new screen at 390px and 1440px wide into `crm/review/<phase>/`.
2. Check each one: Is the most urgent thing the most visible? Can the main action be done with one thumb? Is any screen crowded, or showing more than four headline figures? Are money and dates formatted correctly? Does it look like part of the Mokshify brand?
3. Fix what fails, with at most two passes per screen.

## ACCEPTANCE CHECKS

- Type check, lint and build pass.
- Unit tests cover: timer colour thresholds, response-time calculation, the next-action rule, stale-deal detection, balance calculation, renewal reminder dates, rupee formatting.
- End-to-end tests cover: login and lockout; a website form submission appearing on Today; reply and log; lead to deal to won to client and project; recording a payment and seeing the balance change; a staff user being refused an export; quick-add on a phone-sized viewport.
- The public endpoint rejects a wrong origin, a filled honeypot, invalid input and a burst of requests.
- A staff session cannot reach owner-only routes by URL.
- Lighthouse on the Today screen: performance 90 or higher and accessibility 95 or higher on mobile.
- No horizontal scroll at 390px on any screen.

## FINAL REPORT

Write `crm/CRM_REPORT.md` and end with its summary:

- What was built per phase, and what was left out.
- Test and check results, with numbers.
- The path to the review screenshots.
- A deployment checklist for me: create the Neon database, set each environment variable (list them with one line each), run migrations and the owner seed, create the second Vercel project with `crm/` as its root, point `crm.mokshify.io` at it, then set the real `FORM_ENDPOINT` on the website.
- How to remove the demo data.
- Everything under "Unresolved".

## NOT IN THIS VERSION

List these in the report as next steps and do not build them now: quotation and invoice PDFs, the WhatsApp Business API, a client login portal, calendar sync, automatic email sequences, and AI features.
