# Mokshify Desk — progress

| Phase | Status |
|---|---|
| 0 · Spec saved | done |
| 1 · Foundation | done |
| 2 · Leads and Today | done |
| 3 · Pipeline | done |
| 4 · Clients, projects, payments, renewals | in progress |
| 5 · Reports and settings | — |
| 6 · Connect the website | — |
| 7 · Polish | — |

## Phase 1 · Foundation

- **App:** Next.js 16 (App Router), TypeScript 5.9 strict and Tailwind 4 with the brand tokens, in `crm/`.
- **Schema:** 15 tables with foreign keys, indexes, timestamps and check constraints. The first migration is `drizzle/0000_init.sql`.
- **Auth:** Argon2id, hashed session tokens, per-IP rate limit and account lockout, `requireUser`/`requireOwner`, and a real 403 for staff.
- **Proxy:** per-request CSP nonce, sign-in gate, and an Origin check on API writes; security headers in `next.config.ts`.
- **Shell:** oxblood sidebar on desktop, bottom tabs on mobile, and the skip link, error state and loading skeleton.
- **Seeds:** the owner from the environment, default settings and templates, fictional demo data, and one-command removal (verified: load → remove → load).
- **Audit log:** sign-ins, failures, lockouts and sign-outs so far.

## Phase 2 · Leads and the Today screen

- **Today:** exactly four figures, each linking to its report, then Reply now (live timers and one-tap replies), Follow up today, Waiting on the client, Money with totals, and Renewals.
- **Leads:**
  - filters for status, source, industry, owner and date, plus search by name, company, email or phone digits;
  - a table on desktop and cards on phones;
  - bulk assign.
- **Lead detail:**
  - the summary with its timer, Call / WhatsApp (template) / Email, and one-tap "Log it";
  - details and campaign data, and an edit form;
  - deals and tasks;
  - one timeline with log buttons for call, WhatsApp, note and meeting;
  - an owner-only delete.
- **Quick-add sheet** from every screen.
- **Tests:** 28 unit tests covering all seven required rule areas, and 8 end-to-end tests.
- **Review:** `review/phase-2/`, with 0 overflow at 390 and 1440 on every screen.

## Running it locally

```sh
cd crm
npm install
export DATABASE_URL=pglite://./.data/dev OWNER_EMAIL=… OWNER_PASSWORD=… DEMO_STAFF_PASSWORD=…
npm run db:migrate && npm run seed && npm run seed:demo
npm run build && npm start      # http://localhost:3100
```
