# Mokshify Desk — decisions

Judgement calls, one line of reasoning each. Newest at the bottom of each phase.

## Phase 1 · Foundation

- **PGlite for local development and tests.** No Postgres is installed on this machine, so local work and tests use `DATABASE_URL=pglite://./.data/<name>`. Production uses Neon (`postgres://…?sslmode=require`) through `pg`. Both are the same Drizzle Postgres API, chosen in `src/db/client.ts`.
- **`pg` (TCP) rather than Neon's serverless driver.** It works with Neon from Vercel's Node runtime and keeps one driver for every real Postgres. Pool size is 5, because one to three people use Desk.
- **TypeScript 5.9.3, not 7.** TypeScript 7 is the native port; Next's type-check step needs the JavaScript TypeScript API.
- **Next 16's `proxy.ts`** (the renamed middleware) sets a fresh CSP nonce per request. Every page therefore renders dynamically: the root layout awaits `connection()`, and even the 404 and 403 pages get a nonce.
- **CSP:** `script-src 'self' 'nonce-…' 'strict-dynamic'`; `style-src 'self' 'nonce-…'`, with no `'unsafe-inline'` (Desk uses no inline style attributes); `img-src 'self' data: blob:`; `connect-src 'self'`; `frame-ancestors 'none'`. `upgrade-insecure-requests` is added only on https requests, because on plain-http localhost it broke asset loads.
- **CSRF:** Server Actions use Next's built-in Origin/Host check. Every other state-changing `/api/*` request must carry an `Origin` matching the host (in `proxy.ts`). The session cookie is `SameSite=Lax`, `HttpOnly` and `Secure`. Secure cookies work on `http://localhost` in Chromium; `COOKIE_INSECURE=1` is the escape hatch, and it is never needed in production.
- **Sessions:** a random 32-byte token in the cookie; only its SHA-256 is stored (`sessions.id`), with a 14-day expiry.
- **Passwords:** Argon2id via `@node-rs/argon2`: 19 MiB, 2 passes, OWASP's minimum.
- **Sign-in limits:** 20 attempts per IP per 15 minutes, in a Postgres table so the limit holds across serverless instances. After 5 wrong passwords the account locks for 15 minutes. A sign-in for an unknown email still runs one password verification (against a decoy hash), so response time doesn't reveal whether an account exists.
- **No personal data in logs or audit rows.** `audit_log.meta` holds ids, counts and enum values only. Rate-limit keys are hashed, so raw IPs are never stored.
- **Owner-only routes use Next's `forbidden()`** (`experimental.authInterrupts`). A staff session reaching one by URL gets a real 403 page.
- **Pipeline stage keys are fixed** (`new` … `lost`), because the rules depend on them. Settings can rename their labels. Sources and lost reasons are editable lists in `settings`, and leads store the source as text.
- **The next-step rule is also a database check constraint** (`deals_open_has_next_step`), so no code path can save an open deal without a next action and a date.
- **Money is whole rupees in `integer`.** The largest single value a small studio will see is far below 2^31 (about ₹214 crore).
- **Demo data:** every data table has a `demo` boolean. `npm run demo:remove` deletes `demo = true` rows, children first, and nothing else. Every demo business is named "Demo …", emails are `@example.com`, and phones are `+91 90000 000xx`.
- **The demo staff user (`staff@example.com`) is created only when `DEMO_STAFF_PASSWORD` is set**, so no default password is committed.
- **The marketing site never sees the CRM.** A root `.vercelignore` excludes `crm/` from the static deploy, and `scripts/build.mjs` skips it.
- **Brand assets are copied, not linked, into `crm/public/`** (Switzer and the paper mark). The CRM is its own Vercel project and can't read files outside `crm/`.
- **JetBrains Mono is self-hosted from Fontsource** (`font-src 'self'`; no Google Fonts call from an internal tool).

## Phase 2 · Leads and the Today screen

- **The first reply is stamped in the database in the same transaction as the activity.** The update runs only `where first_response_at is null`, so the stored response time can never change later. Reply kinds are call, WhatsApp, email and meeting; a note is not a reply. A first reply also moves a lead from New to Contacted.
- **"Reply now" is every lead without a first reply that isn't closed, oldest first.** The oldest is the one losing the most.
- **"Follow up today" merges open tasks due by the end of today (Asia/Kolkata) with open deals whose next-action date is today or earlier.** Overdue items are shown in red with their date.
- **A Reply-now card over an hour old gets a red edge.** That makes the most urgent thing the most visible, with colour backed by the timer's text label ("Over an hour").
- **One-tap logging appears after the link is used.** Tapping Call, WhatsApp or Email opens the app and shows "Log this … ? [Log it]". The click can't confirm a call really happened, so the person confirms in one tap.
- **The WhatsApp template is chosen on the lead page; Today's cards use the first template.** Today stays one-thumb simple; the lead page has the choice.
- **Quick-add is a native `<dialog>`** (focus trap and Esc for free): a bottom sheet on phones, centred on desktop, from a floating button on every screen. A new lead's owner is whoever added it.
- **Search matches phone digits whatever the formatting.** "00005" finds "+91 90000 00005", because the query strips non-digits on both sides.
- **The lead filters fold away on phones** behind a "Filters (n)" button; search stays visible. In review, the full filter block pushed every lead below the first screen.
- **Grids without explicit columns get one shrinkable column (`minmax(0,1fr)`), as a base CSS rule.** Implicit `auto` columns grew to their widest child and caused phone-width overflow.
- **The review script measures overflow against the configured viewport width.** Mobile emulation widens `innerWidth` to fit overflowing content, which hid the first overflow.
- **Vitest must run from a path with an uppercase drive letter on Windows (`D:\…`).** Otherwise it loads twice and fails before any test. CI on Linux is unaffected.
- **End-to-end tests run against a production build with a throwaway PGlite database** (`.data/e2e`), rebuilt on every run, using the installed Edge. External WhatsApp links are stubbed: the test checks the URL Desk builds, not WhatsApp's site.

## Phase 3 · Pipeline

- **One move dialog serves every way of moving a deal:** drag and drop on desktop, the card's "Move" button (the keyboard route), and "Move to" on phones. It asks for exactly what the rules need:
  - **Open stage:** the next action and its date, prefilled with the current next step and a future date.
  - **Lost:** a reason from the editable list.
  - **Won:** the final value.
- **Winning creates the client and the first project in the same transaction.** That is the spec's Phase 4 rule, but it belongs in the stage move:
  - **The client** comes from the lead's company (or name), phone, email, city and industry, with the lead as the primary contact.
  - **The project** gets the deal's title, the won value as the agreed amount, and "Advance pending".
  - **Winning again later** (after a re-open) reuses the existing project.
- **Stage moves are optimistic.** The card jumps to its new column at once and stays there while the server confirms; the board then refreshes from the server.
- **The board shows every open deal, plus deals won or lost in the last 30 days.** Older closed deals live on the client and reports pages, so the board stays a working tool.
- **Probability follows the stage by default** (10 / 20 / 35 / 55 / 75 / 100 / 0) and can be overridden on the deal.
- **"Convert to deal" is one click.** The title is "{company or name} — {service}", the stage is Contacted, and the next action is a discovery call tomorrow; the lead is marked converted. It is on the lead page and in the leads table.
- **Every stage change is written to the timeline** ("Proposal sent → Won") and audited (`stage_change`, plus `deal_won` / `deal_lost`).
- **Phones open the pipeline on the first stage that has deals,** not on the empty "New" column.

## Phase 4 · Clients, projects, payments, renewals

- **Balances are always calculated, never stored.** Balance = agreed − received; only payments marked received count. Lists compute it in SQL; detail pages use the unit-tested `balance()` rule.
- **A part payment splits the milestone.** The received part is recorded, and the rest becomes a new due milestone, "{name} — balance", with the same due date, so the balance and the overdue flags stay honest. Every payment is written to the project timeline with amount, date, method and reference.
- **A cancelled milestone stays visible, struck through,** so the history is honest.
- **The project page warns when the milestones don't add up to the agreed amount.**
- **"Mark renewed" moves the renewal date forward,** by a year by default and editable, and writes "Hosting renewed until …" to the client's timeline. Reminders then fall 30, 14 and 3 days before the new date. "Stop" sets the status to cancelled; nothing is deleted.
- **Client tabs are links (`?tab=`),** so they work without JavaScript and can be shared. The default tab is Projects (where the money is); the order follows the spec: contacts, projects, payments, renewals, timeline.
- **"Shown on the website" requires the live URL** (validated). It is a flag for whoever updates the website's work section; nothing is published automatically.
- **GSTIN is optional and checked against the 15-character format** (e.g. `36AAAAA0000A1Z5`).
- **Two small reusable pieces carry every form:**
  - **`ActionForm`:** any server action; shows its error or success, then resets or closes.
  - **`DialogButton`:** a native `<dialog>` around server-rendered content.

  The pages stay server components.
- **Fixed a focus race in quick-add.** A focus moved to the Name field after a 30 ms delay could steal focus back mid-typing and drop the phone number into Name. Name now uses `autofocus`, which native dialogs apply synchronously. The e2e test asserts both values before saving and passed three runs in a row.
- **Fixed a won-flow regression.** The move dialog's open effect keyed on the deal object; the refresh after saving handed in a new object, which wiped the "Won" confirmation. It now keys on the deal's id.
- **Subqueries name the outer column explicitly** (`"clients"."id"`). Drizzle renders a bare `"id"` there, which Postgres rejects as ambiguous.
- **The 1440 px board shows five of seven columns and scrolls sideways for Won and Lost.** All seven fit from about 1600 px. Narrower columns would have squeezed every card; the spec asks for one column per stage, so the board scrolls.

## Phase 5 · Reports and settings

- **One set of rows per report** draws the chart, fills the table view and becomes the CSV, so the three can never disagree.
- **The funnel counts each deal at the furthest stage it reached.** That comes from the audit log's stage moves (from and to) plus its current stage, so a deal lost at Proposal still counts as having reached Proposal. Leads at the top are those that arrived in the range.
- **Revenue is grouped by the month the money arrived** (`receivedDate`). "Outstanding now" ignores the date range on purpose: it is what is owed today.
- **Website pages are reported as paths** (`/services/…`), with the query string dropped so UTM tags don't split one page into many.
- **The CSV is hardened against spreadsheet formula injection.** Every cell is quoted, and values starting with `=`, `+`, `-` or `@` are prefixed with an apostrophe.
- **Staff can read reports but not export them.** The export routes return 403 for staff, checked on the server, and the buttons are hidden as well. Every export is audited with its row count.
- **Owner-only paths are refused in the app layout, before the page streams.** The loading skeleton is a streaming boundary, so a page-level `forbidden()` could only send a 200 with the refusal page. The proxy passes the path in a request header; each page still calls `requireOwner()` too.
- **Pipeline stages are shown in settings but not editable.** The next-step rule, the stale flags, won and lost, and the funnel all depend on them. Sources and lost reasons are editable lists, one per line (at most 20).
- **You can't lock yourself out.** You can't demote or deactivate yourself, and the last active owner can't be deactivated. Deactivating or resetting a password signs that person out everywhere at once.
- **Deleting a person's data:** matched by full email or the last 10 phone digits, it removes their leads (with timeline and tasks) and contact entries. On client records only their phone and email are cleared, because invoicing history must stay. It is audited with counts only.
- **Retention:** leads older than the retention period (365 days by default, at least 90) that never became a deal or a client are listed in Settings, and the owner deletes them in one action. Nothing is deleted automatically.
- **`LOGIN_IP_LIMIT`** raises the per-IP sign-in limit only for the e2e test server, which signs in about 30 times from one address. Production keeps 20 per 15 minutes.

## Phase 6 · Connect the website

- **`POST /api/public/leads` checks, in order:**
  - the Origin header against `PUBLIC_FORM_ORIGINS` (403 otherwise; preflight answered only for those origins);
  - JSON only (415) and at most 16 KB (413);
  - 5 per IP per 10 minutes (429 with `Retry-After`);
  - the honeypot (400);
  - Zod validation (422, with the first problem as a sentence).

  It returns `{ ok: true }` (201).
- **Consent is required and stored with its time.** The website forms have a required checkbox, "Mokshify may use these details to reply to this enquiry", linking to the privacy notice. The endpoint refuses a lead without it.
- **Page URL, referrer and UTM tags travel with each lead.** The site keeps the visit's first-touch UTM tags and outside referrer in `sessionStorage` (wrapped in try/catch), and sends them with whichever form the visitor finally uses.
- **The per-IP limit trusts `X-Forwarded-For`,** which Vercel sets to the real client address. A self-hosted deployment behind another proxy must make sure that proxy overwrites it.
- **The notification email is sent after the response (`after()`),** so the visitor never waits on SMTP. Without `SMTP_HOST`, or without a recipient (`NOTIFY_EMAIL`, or the notification email in Settings), it is skipped. A failure logs one line with no personal data, and the lead is already saved.
- **Website `FORM_ENDPOINT` is `https://crm.mokshify.io/api/public/leads`.** Until that address is live, the fetch fails and the form opens the visitor's mail app with everything filled in, as it did before. A 4xx refusal (validation, rate limit) is shown as a message instead, so a person never loses what they typed.
- **The estimator has its own small share form** (name, phone or email, optional note, consent), because its results box sits inside the estimator's form and forms can't nest. It sends the estimate summary as the message, with source "Estimator". The old "Send this estimate" mail link stays as the no-JavaScript path.
- **Website changes are kept to the spec:**
  - `FORM_ENDPOINT` and the shared send helper in `js/site.js`;
  - the consent line in `partials/enquiry.html` and on the estimator;
  - `connect-src https://crm.mokshify.io` in `vercel.json` and `_headers`;
  - the estimator share form;
  - the keyboard test.

## Phase 7 · Polish

- **Warning text is `#7D5710`; the spec's warning colour `#9A6B14` stays on the badge dot and border.** `#9A6B14` on paper is 4.28:1, under the 4.5:1 that small text needs (it was Lighthouse's only accessibility finding). The darker text is 5.9:1 on paper and 5.0:1 on limestone. Success, danger and info pass as specified.
- **The PWA is a web app manifest (Next's `app/manifest.ts`) with the M-mark icons:** start URL `/today`, standalone, theme oxblood, with shortcuts to Today, Leads and Pipeline. There is no service worker, so Desk is installable but needs a connection; caching personal data offline on a phone would also be a privacy question.
- **The dark theme was not built.** The spec marks it optional and last; the light theme is complete.
- **Lighthouse ran signed in,** with a session cookie from the local review database passed as a header, because Today is behind sign-in.

## Unresolved

- **ESLint config blocked by a local hook.** Creating `crm/eslint.config.mjs` is refused by the `everything-claude-code` plugin's config-protection hook ("Modifying eslint.config.mjs is not allowed"). That hook exists to stop lint rules being weakened, and getting around it by renaming the file would defeat its purpose. So `npm run lint` has no config yet. Static checking meanwhile is `tsc --noEmit` in strict mode (with `noUncheckedIndexedAccess`). To enable lint, disable that hook once, or create the file yourself with:
  ```js
  import next from "eslint-config-next";
  export default [...next, { ignores: [".next/**", "drizzle/**", "review/**"] }];
  ```
