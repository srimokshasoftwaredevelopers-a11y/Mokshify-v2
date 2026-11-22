# Redesign decisions

One line of reasoning each. Newest at the bottom of each list.

## Decisions

- **Build model: include regions edited in place.** `scripts/build.mjs` stamps each partial between `<!-- include:name -->` markers inside the page file itself. Pages stay plain static HTML at today's paths, and Vercel's output directory (`.`) does not change. A separate source tree would have required changing the hosting config. Deviation from the brief ("source pages hold only their own content"): the stamped shell is in the file, but it is generated, and you only ever edit it in `partials/`.
- **The `cta-band` partial carries the page's own copy through a slot.** Each page's existing CTA headline and sentence sit inside `<!-- slot -->` in the region and are re-inserted on every build, so no copy is lost while buttons and markup live in one partial.
- **Asset cache-busting by content hash.** `/css/*` and `/js/*` are served immutable for a year, so the build stamps `?v=<hash>` on `site.css` and `site.js`. Changed files always reach returning visitors.
- **Switzer self-hosted from Fontshare** (ITF Free Font License permits web self-hosting) as one variable WOFF2 (43 KB), preloaded. Newsreader and JetBrains Mono stay on Google Fonts, which the CSP already allows.
- **CSP gains `font-src 'self'`** in `vercel.json` and `_headers`. Without it the self-hosted font is blocked. This is a header line in the repo, not a dashboard setting.
- **Mobile menu from 900px down** (the newer brief) supersedes the earlier "below 560px" request; it covers it.
- **`js/analytics.js` folded into `js/site.js`** so every page loads one shell script, as the brief asks. The page-specific tool scripts (`estimator`, `dbselect`, `jsonfmt`, `search`) stay separate because only their own page needs them.
- **SkillForceHub redirect** uses `vercel.json` `redirects` (301 to `/work/`), plus `_redirects` for Netlify parity. The page file is deleted so it cannot be crawled as a duplicate.
- **Hero still is film frame 540 (the blueprint), not a frame with the presenter.** The frames with a person are AI-generated, which the brief bans. Marked `TODO(asset)`.
- **The spine draws with CSS scroll-driven animation**, as the brief asks, plus a one-time draw on load. Where unsupported, or with reduced motion, it is a static full line. Consequence: scrolling back up retracts it slightly; "draws once" and "CSS scroll-driven" cannot both hold literally, and the brief named the technique.
- **Headlines reveal line by line on their authored line breaks** (the old `<em>` split), in CSS only. Splitting by measured lines needs JavaScript before first paint, which the CSP (no inline script) would make flash.
- **Case-study plate heroes are blurred and heavily graded.** A light product screenshot behind a 6rem headline was illegible in review; the type has to win.
- **The homepage `<noscript>` mirror was removed**, because the homepage is now real HTML. Its FAQ duplicates `/faq/`, and its other copy now lives in the page sections.
- **Homepage portfolio JSON-LD changed**: SkillForceHub removed, Next Edge Realty, AJ Agritech and Qflow added, FinCalix count 30+ → 47. Hard rule 7 allows the SkillForceHub change; the others follow the brief's "add each to the homepage". Somallamma is left out until its URL is confirmed.
- **"Honest" fix applied site-wide (fix 6)**: 24 later occurrences reworded across 16 pages; the first on each page is kept. Where an FAQ answer changed, its FAQPage JSON-LD text changed identically so schema and page still match.
- **Copy changes made by necessity, beyond the fixes**: FinCalix 30+ → 47 calculators (brief), SkillForceHub sentences, `/industries/` counts (4 → 6 live products, 4 → 5 industries, verifiable on `/work/`), "The film (homepage)" → "Homepage" on `/sitemap/`, the `/brand/` palette and type rows (they described the retired system), and the `/work/` meta description (SkillForceHub).
- **A plain sentence was added under the headline of 27 owner-facing pages**, as the brief asks. The existing lede moves just below the hero, unchanged.
- **Weak case-study matches are labelled honestly**: AI Product Development, AI Transformation and Legacy Modernization show work under "Built by the same team" with `TODO(proof)`, not "Recent work".
- **Service delivery diagrams** are the site's stated eight-stage pipeline with each page's own deliverables at the Engineering stage. Industry diagrams chain the page's own "what we build" labels. Nothing in either is new information.
- **`/decisions/` stays long-form, not a table.** Its sticky contents list already indexes all ten records by anchor, and each record is prose.
- **No extra "statement plates" on company pages.** The alternating oxblood sections already carry the large-type rhythm, and the brief says to add no decorative elements beyond the spine.
- **The Qflow and Somallamma pages show what can be stated publicly.** Qflow's status is quoted from qflow.in with the date; Somallamma shows "Address to follow" and a labelled placeholder. Both carry `TODO(confirm)` comments rather than visible TODO text.
- **Review screenshots are not committed** (`review/` is in `.gitignore`). On Vercel with output directory `.`, committed PNGs would be publicly served and would bloat the repo.
- **Inline styles stripped from the JSON formatter**, because they referenced old tokens (`var(--line)`) and a 14px radius.
- **Menu toggle moved before the sheet in the DOM** (CSS `order` keeps it on the right). The keyboard test showed Tab skipping the opened sheet.
- **Focus indicator: brass outline over a 3px ink ring (paper on dark).** Brass alone is 2.39:1 on limestone, below the 3:1 non-text minimum.
- **`npm run build` is now the partial build** (no dev dependencies needed on Vercel). The film bundle moved to `npm run build:film`, kept only until the film files are deleted.

## Unresolved

- **`film-v1` tag not on the remote.** The tag exists locally on `974d9a2` (main), but `git push origin film-v1` returned 403: the credential on this machine (`ajagritecha-hub`) has no write access to `srimokshasoftwaredevelopers-a11y/Mokshify-v2`, and the `gh` account (`qflow-token`) has pull-only access. Following your rule, the frames, film engine, `js/main.js`, `css/styles.css`, `css/pages.css` and GSAP are **not deleted**. The new pages no longer load any of them. Morning action: push the tag, then run the deletion listed in `REDESIGN_REPORT.md`.
- **Branch not pushed.** Same 403, on three attempts (start, mid-run, end). All work is committed locally on `redesign/enterprise` (18 commits ahead of `main`).
- **FinCalix on iOS** is stated in the brief, but fincalix.com links only to Google Play (23 Nov 2026). The site says Android only, with a `TODO(confirm)`.
