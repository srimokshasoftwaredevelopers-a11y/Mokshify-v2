# Mokshify Platform Roadmap & Operations

Internal document. Companion to HANDBOOK.md.

═══════════════════════════════════════════════════════════
1. OPEN SOURCE (prepared, NOT published — no repos exist yet)
═══════════════════════════════════════════════════════════
Candidates already in this repo, publish-ready when a GitHub org exists:
- optimize-frames.mjs — 4K PNG → streaming WebP pipeline (the 97.7% story)
- mobile-shots.mjs — device-emulation screenshot QA via installed Edge
- audit-site.mjs — static-site link/metadata/schema auditor
- seo-assets.mjs — brand-mark → icon/OG generator

Release checklist per tool:
1. Create github.com/mokshify org; repo per tool or one `mokshify/tools`.
2. Strip machine-specific paths (Edge path → env var; ROOT → cwd).
3. Add: MIT LICENSE (recommended — permissive matches "take our
   checklists" positioning), README with the honest origin story linking
   the relevant journal entry, CONTRIBUTING.md (small PRs, tests where
   logic lives, the same review bar as client work), SECURITY.md pointing
   at /legal/disclosure/.
4. THEN build /open-source/ page (template: hub pattern, cards per repo,
   real GitHub links only) + add sameAs GitHub URL to the Organization
   schema in index.html + llms.txt entry + sitemap files.
5. Never list a repo that isn't public and working.

═══════════════════════════════════════════════════════════
2. ANALYTICS ACTIVATION (wired, dormant — no IDs anywhere)
═══════════════════════════════════════════════════════════
Already in place: js/analytics.js pushes named events into window.dataLayer
ONLY when a tag defines it — call_click, email_click, whatsapp_click,
cta_click, outbound_click, scroll_depth, estimator_change, dbselector_change.

Activation order:
1. Google Search Console — verify via the commented meta slot in
   index.html head; submit sitemap.xml.
2. GTM — one container snippet in index.html + every page footer
   (scripted insert across pages; then CSP must gain
   https://www.googletagmanager.com in script-src — update _headers AND
   vercel.json together).
3. GA4 via GTM — map the dataLayer events; conversions: call_click,
   whatsapp_click, email_click, cta_click.
4. Microsoft Clarity / LinkedIn Insight / Meta Pixel — via GTM only,
   AFTER updating /legal/privacy/ and /legal/cookies/ (both currently
   promise "no cookies / inert analytics" — the pages MUST change in the
   same deploy that enables tracking; consent banner becomes required
   for pixels).
5. Bing Webmaster + Yandex if markets warrant — meta slots exist.

═══════════════════════════════════════════════════════════
3. CMS-READY ARCHITECTURE
═══════════════════════════════════════════════════════════
Invariant: URLs never change. The site is already CMS-shaped:
- Content types map 1:1 to sections (service, industry, case-study,
  library-article, guide, adr, journal-entry, tool, legal).
- Each type has a fixed template (HANDBOOK §3) and a fixed URL scheme —
  a headless CMS (or git-based CMS) can render into the same paths via
  any static generator; pages.css is the only styling contract.
- Migration path: (1) extract per-page front-matter (title, desc, dates,
  type — all currently in the HTML head, machine-readable) via script;
  (2) move body HTML to markdown per template; (3) generator renders
  identical URLs; (4) scripts/audit-site.mjs is the regression gate —
  zero diffs in links/metadata = safe cutover.
- Until volume demands it, hand-authored HTML + the audit script IS the
  CMS. Do not add a CMS for fewer than ~30 articles/year.

═══════════════════════════════════════════════════════════
4. FUTURE FEATURES (designed, build only on request)
═══════════════════════════════════════════════════════════
- Client portal — REJECT until real: describing the weekly-demo rhythm
  (/enterprise/) stays more honest than mock dashboards. If built: portal
  = auth + per-client staging links, decision log, invoices. Real data
  only, never marketing screenshots of it.
- Cost calculator v2 — extend /estimate/ with rupee RANGES only after
  the owner supplies real engagement pricing bands; logic stays in
  readable JS per the current honesty pattern.
- Cloud cost calculator — inputs: workload shape, traffic band, cloud;
  outputs: the cost DRIVERS + right-sizing checklist (real numbers need
  live pricing APIs — link providers' own calculators rather than
  approximating them badly).
- AI architecture advisor — a guided version of /tools/database-selector/
  covering the whole stack; recommendation text mirrors ADRs; every
  answer links its reasoning. No LLM backend needed — decision tree first.
- Architecture generator / proposal generator — internal tooling first
  (generate .diagram SVGs and scope docs from templates); publish only
  if output quality matches hand-made.

═══════════════════════════════════════════════════════════
5. LIVING-PLATFORM CADENCE (the actual growth engine)
═══════════════════════════════════════════════════════════
- Journal entry per meaningful ship (real numbers or real mistakes).
- Library article per month max, quality-gated; update hub + feed.
- dateModified honestly on real updates; sitemap lastmod follows.
- Quarterly: run audit-site.mjs, re-verify the four client sites'
  screenshots, renew security.txt Expires (2027-07-17), recheck the
  "Real numbers" strips still hold.
- The moment real assets exist (team names, testimonials, repos,
  certifications), they replace their honest placeholders per the
  recommendations list in the Phase-7 report.