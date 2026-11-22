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

## Unresolved

- **`film-v1` tag not on the remote.** The tag exists locally on `974d9a2` (main), but `git push origin film-v1` returned 403: the credential on this machine (`ajagritecha-hub`) has no write access to `srimokshasoftwaredevelopers-a11y/Mokshify-v2`, and the `gh` account (`qflow-token`) has pull-only access. Following your rule, the frames, film engine, `js/main.js`, `css/styles.css`, `css/pages.css` and GSAP are **not deleted**. The new pages no longer load any of them. Morning action: push the tag, then run the deletion listed in `REDESIGN_REPORT.md`.
- **Branch not pushed.** Same 403. All work is committed locally on `redesign/enterprise`.
