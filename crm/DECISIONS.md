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

## Unresolved

- **ESLint config blocked by a local hook.** Creating `crm/eslint.config.mjs` is refused by the `everything-claude-code` plugin's config-protection hook ("Modifying eslint.config.mjs is not allowed"). That hook exists to stop lint rules being weakened, and getting around it by renaming the file would defeat its purpose. So `npm run lint` has no config yet. Static checking meanwhile is `tsc --noEmit` in strict mode (with `noUncheckedIndexedAccess`). To enable lint, disable that hook once, or create the file yourself with:
  ```js
  import next from "eslint-config-next";
  export default [...next, { ignores: [".next/**", "drizzle/**", "review/**"] }];
  ```
