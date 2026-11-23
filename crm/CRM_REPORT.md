# Mokshify Desk — report

**Branch:** `feature/crm`, from `redesign/enterprise`. Not merged, not deployed, no cloud resources created.
**App:** `crm/`, a Next.js 16 app with its own `package.json`. The marketing site changed only where Phase 6 asked.

## What was built

| Phase | Built |
|---|---|
| 1 · Foundation | **Stack:** Next.js App Router, TypeScript strict, Tailwind with the brand tokens, Switzer and JetBrains Mono self-hosted.<br>**Schema:** 15 tables with foreign keys, indexes, timestamps and check constraints; the database itself refuses an open deal without a next step. Migrations are in `drizzle/`. Postgres is picked by `DATABASE_URL`: Neon in production, PGlite locally.<br>**Sign-in:** email and password with Argon2id, session tokens stored only as hashes, `HttpOnly`/`Secure`/`SameSite=Lax` cookies, a per-IP limit and a 15-minute lockout after 5 wrong passwords.<br>**Roles:** owner and staff, checked on the server for every read and write; staff get a real 403.<br>**Request security:** a strict CSP with a fresh nonce per request, an Origin check on writes, and the standard security headers.<br>**Seeds:** the owner from the environment; fictional demo data, removable in one command.<br>**Audit log** of sign-ins, exports, deletions, role changes and stage changes. |
| 2 · Leads and Today | **Today:** four figures, each linking to its report, then Reply now (live green/amber/red timers and one-tap replies), Follow up today, Waiting on the client, Money with totals, and Renewals in the next 30 days.<br>**Leads:** a table on desktop and cards on phones; filters for status, source, industry, owner and date; search by name, company, email or phone digits; bulk assign.<br>**Lead page:**<ul><li>Call, WhatsApp (template pre-filled) and Email, each followed by one-tap "Log it";</li><li>the first logged reply stops the timer and stores the response time;</li><li>one timeline with quick buttons to log a call, WhatsApp, note or meeting;</li><li>tasks with optimistic ticks.</li></ul>**Quick-add** on every screen: name, phone, source, one line. |
| 3 · Pipeline | **Board:** one column per stage with count and total. Drag and drop on desktop, plus a Move button for the keyboard; on phones, a stage switcher with "Move to".<br>**Move dialog:** asks for the next step (open stages), the reason (lost) or the final value (won). Moves are optimistic.<br>**Stale flags:** idle 7 days, proposal unanswered 3 days.<br>**Conversion:** lead to deal in one step.<br>**Deal page:** stage control, next step, reply buttons, timeline and tasks. |
| 4 · Clients, projects, payments, renewals | **Won deal:** creates the client (from the lead, with the lead as primary contact) and the project, in one transaction.<br>**Clients:** a list with balances and upcoming renewals; the detail page has tabs for contacts, projects, payments, renewals and timeline.<br>**Projects:** status and balance on every row. The detail page shows agreed / received / balance, milestones, and "Record payment" (a part payment leaves the rest due); a project can be flagged as shown on the website, with its live URL.<br>**Renewals:** sorted by date, with one action to mark renewed and set the next date; they appear on Today 30, 14 and 3 days before they're due. |
| 5 · Reports and settings | **Reports:** leads by source and by industry; the funnel with drop-off per stage; the first-reply trend by week; won and lost by month with lost reasons; revenue by month with the outstanding balance; leads by website page. Every report has a table view and a date range; CSV export is owner only.<br>**Settings (owner only):**<ul><li>users (add, role, deactivate, password);</li><li>pipeline stages (shown);</li><li>sources and lost reasons;</li><li>reply templates;</li><li>notification email and business details;</li><li>retention, with flagged old leads;</li><li>export or delete one person's data.</li></ul> |
| 6 · Connect the website | **CRM endpoint `POST /api/public/leads`:** mokshify.io origins only (CORS), JSON only, size cap, 5 per IP per 10 minutes, honeypot, Zod validation; consent is stored with its time, along with page URL, referrer and UTM tags; the new-lead email goes out after the response and is skipped when SMTP isn't configured.<br>**Website:**<ul><li>`FORM_ENDPOINT` points at the CRM, with the mailto fallback whenever it's unreachable;</li><li>first-touch UTM and referrer capture;</li><li>a consent line with a link to the privacy notice;</li><li>the estimator can send its result;</li><li>`connect-src` allows the CRM origin.</li></ul> |
| 7 · Polish | **PWA:** web app manifest with the M-mark icons, installable.<br>**States:** designed empty, loading and error states on every list.<br>**Fixes:** the mobile pass (no overflow at 390px anywhere) and the accessibility pass (warning text darkened to meet AA; focus ring on everything; 44px touch targets). |

**Left out:**
- **Dark theme.** It was optional and comes last; the light theme is complete.
- **Offline service worker.** The manifest makes Desk installable, but it needs a connection to work.
- **Editable stage labels.** The stages are shown in Settings but stay fixed, because the rules and the funnel depend on them.

Every judgement call is in `crm/DECISIONS.md`, phase by phase.

## Tests and checks

| Check | Result |
|---|---|
| Type check (`tsc --noEmit`, strict + `noUncheckedIndexedAccess`) | Pass, 0 errors |
| Build (`next build`) | Pass |
| Lint | **Not run.** A local hook blocks creating the ESLint config (see Unresolved). |
| Unit tests (Vitest) | **28 / 28.** Covers timer colour thresholds, response-time calculation, the next-action rule, stale-deal detection, balance calculation, renewal reminder dates and rupee formatting, plus dates, phones, reply links, templates and win rate. |
| End-to-end (Playwright, production build, fresh database each run) | **25 / 25:** <ul><li>login, wrong password, lockout, signed-out redirect;</li><li>a website form submission appearing on Today (with page, campaign and consent);</li><li>reply and log (stores the response time);</li><li>lead → deal → won → client and project;</li><li>the next-step and lost-reason rules;</li><li>the board, and the phone stage switcher;</li><li>recording a payment changes the balance, and a part payment;</li><li>mark renewed;</li><li>a staff user refused an export;</li><li>staff refused owner-only routes by URL (403);</li><li>CSV export and person export;</li><li>quick-add on a 390px phone;</li><li>the public endpoint rejecting a wrong origin, a filled honeypot, invalid input and a burst.</li></ul> |
| Lighthouse, Today, mobile (signed in, two runs) | Performance **91 and 93**, accessibility **100**, best practices **100**, CLS **0.000** |
| No horizontal scroll at 390px | **0 px** on all 14 screens (and 0 at 1440px) |
| Console errors (CSP) | None on any screen |
| Website checks after Phase 6 | `npm run verify` all pass: crawl 0 non-200, 0 orphans, keyboard (including consent and the mailto fallback), motion. Shared JS is 29.3 KB, under the 30 KB budget. |

**Review screenshots:** `crm/review/phase-1/` … `crm/review/phase-7/`, every screen at 390px and 1440px. The folder is local only (git-ignored), and `npx tsx scripts/review.ts <phase> <routes…>` regenerates it.

## Deployment checklist

1. **Create the Neon database** (region: Singapore or Mumbai, closest to Hyderabad). Copy its connection string with `?sslmode=require`.
2. **Set the environment variables** in a new Vercel project:

   | Variable | What it is |
   |---|---|
   | `DATABASE_URL` | The Neon connection string. |
   | `OWNER_NAME` | Your name, as shown in Desk. |
   | `OWNER_EMAIL` | Your sign-in email (the first owner). |
   | `OWNER_PASSWORD` | A long passphrase, 12+ characters. Used once by the seed. Remove it afterwards. |
   | `PUBLIC_FORM_ORIGINS` | `https://mokshify.io,https://www.mokshify.io`: the sites allowed to send enquiries. |
   | `APP_URL` | `https://crm.mokshify.io`, used for links in notification emails. |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Your mail provider's SMTP details, for the new-enquiry email. Leave empty to skip email. |
   | `SMTP_FROM` | The sender, e.g. `Mokshify Desk <desk@mokshify.io>`. |
   | `NOTIFY_EMAIL` | Where new-enquiry emails go. It can also be set later in Settings. |
   | `DEMO_STAFF_PASSWORD` | Leave unset in production. It is only for the fictional demo staff user. |
   | `LOGIN_IP_LIMIT`, `PUBLIC_LEAD_LIMIT` | Leave unset. The defaults (20 sign-ins and 5 enquiries per IP per window) are the right ones; these exist for the test server. |

3. **Run the migrations and the owner seed once**, from your machine with the production `DATABASE_URL` set:
   ```sh
   cd crm && npm ci
   npm run db:migrate
   npm run seed        # creates the owner from OWNER_EMAIL / OWNER_PASSWORD, default lists and templates
   ```
   Don't run `npm run seed:demo` against production.
4. **Create the second Vercel project** from this repository, with **Root Directory `crm/`**. Framework: Next.js; build `npm run build`; Node 22 or later. The marketing project is unaffected: the root `.vercelignore` keeps `crm/` out of it.
5. **Point `crm.mokshify.io` at the new project.** In Vercel, add the domain; at your DNS provider, add the CNAME record Vercel shows.
6. **Confirm the website's form endpoint.** `js/site.js` already has `FORM_ENDPOINT = "https://crm.mokshify.io/api/public/leads"` (marked `TODO(deploy)`), and `vercel.json` / `_headers` allow it in `connect-src`. Once the CRM answers there, send one test enquiry from `/consult/` and check it appears on Today. If the CRM gets a different address, change that one line and the two `connect-src` entries.
7. **Sign in, open Settings,** add the other users, and set the notification email and business details.

## Removing the demo data

```sh
cd crm
DATABASE_URL=<the database that has demo data> npm run demo:remove
```

This deletes every row flagged `demo` (fictional leads, deals, clients, projects, payments, renewals, tasks, timeline entries and the demo staff user), and nothing else.

## Unresolved

1. **ESLint config not created.** The local `everything-claude-code` plugin's config-protection hook refuses to create `crm/eslint.config.mjs`. I didn't get around it by renaming the file. To enable `npm run lint`, disable the hook once, or create the file with the two lines given in `crm/DECISIONS.md` (Unresolved).
2. **Tested only on PGlite, not real Postgres.** Every automated check ran on PGlite. The production path (Neon through `pg`) uses the same SQL and migrations, but it hasn't run against a real Neon database. Run step 3 above on a Neon branch first.
3. **SMTP never sent a real email.** Sending is skipped without `SMTP_HOST`, so no real email went out. Send one test enquiry after setting SMTP.
4. **`FORM_ENDPOINT` (website)** points at `crm.mokshify.io`, which doesn't exist yet. Until it does, website enquiries use the mailto fallback, exactly as before.
5. **The per-IP limits trust `X-Forwarded-For`.** Vercel sets it to the real client address. Behind any other proxy, make sure it is overwritten there.
6. **Board width at 1440px.** Five of the seven stage columns are visible and the board scrolls sideways for Won and Lost; all seven fit from about 1600px.
7. **Windows only: run Vitest from an uppercase drive path (`D:\…`).** Otherwise it loads twice and fails before any test runs. Linux CI is unaffected.

## Next steps (not in this version)

- Quotation and invoice PDFs.
- The WhatsApp Business API (sending and receiving inside Desk, rather than `wa.me` links).
- A client login portal.
- Calendar sync.
- Automatic email sequences.
- AI features.

## Summary

Mokshify Desk is built on `feature/crm`: all seven phases, with every rule from the spec enforced in the product. Five of them are also enforced on the server or in the database:
- the reply timer;
- the next step on open deals;
- stale flags;
- balances;
- the renewal reminders.

Type check and build pass. 28/28 unit tests and 25/25 end-to-end tests pass. Lighthouse on Today (mobile) scores 91–93 for performance and 100 for accessibility, with no horizontal scroll at 390px on any screen. To go live: create the Neon database, set the environment variables, migrate and seed, deploy `crm/` as a second Vercel project on `crm.mokshify.io`, and send one test enquiry from the website. Still open: the ESLint config (blocked by a local hook), and a first run against real Neon and real SMTP.
