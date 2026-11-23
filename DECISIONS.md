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

## Motion, logo and answers (MOTION_SPEC.md, 23 Nov 2026)

- **Hero video switches on by itself.** The build stamps `data-hero-video="ready"` only when `assets/hero/hero.webm`, `hero.mp4` and `hero-poster.webp` all exist, so desktop visitors get no 404s before then. Vercel runs `npm run build` on deploy, so dropping the files in is enough. Verified with a throwaway test clip (deleted): 0.6× playback, pause button, and no video request at 375px.
- **No CSP change for the video.** It is same-origin, which `default-src 'self'` already covers.
- **The slow zoom runs on the `<picture>`**, not the `<img>`, so it doesn't fight the existing 6% scroll parallax on the image.
- **Lenis is injected by `site.js` with `defer`**, only for `(pointer: fine) and (min-width: 900px)` and never with reduced motion. A static `<script defer>` tag would download it on phones too.
- **`site.js` now ships minified** (`js/site.min.js`, built by esbuild in `scripts/build.mjs`; a verbatim copy if esbuild is missing). Without it, 12 KB of source + 18.8 KB of Lenis would break the 30 KB budget.
- **"Section content" reveals exclude tools, forms and long-form**, per the motion rules ("body text, tables, forms, tools and long-form articles stay still"). Inside ordinary sections, the body block fades and rises once as a whole; nothing inside it animates on its own.
- **Headline line-splitting happens just before the headline enters view, and the original markup is restored after the reveal**, so resizing later never breaks the lines. Headlines containing links or markup are left still.
- **Counting up starts from 0 only for figures below the first screen**; anything already visible keeps its final value. Ranges ("4–6 wks") and words ("HMDA") are never animated. The final text is always restored verbatim from the HTML.
- **The pipeline line follows the brief's easing.** That curve is front-loaded, so the line reaches the last step at about 0.6 s and spends the rest of the 2 s settling.
- **Gallery frames also get the slow zoom**, read as "section plates". Placeholder plates (`.plate.todo`) do not.
- **The logo cut-out is clean on light surfaces, so the transparent copy is used.** On oxblood, the lens flare under the ring breaks into small yellow-green specks at 2× zoom (`review/logo/edges-2x.png`); at the 28px header size that is about 2px. Falling back to the cream original would put a cream box on oxblood, so the transparent mark stays and this is reported.
- **The apple-touch icon (180) sits on paper**, because iOS paints transparent touch icons black. All other icons are transparent. The manifest icons are `purpose: any` (the transparent mark isn't maskable-safe).
- **The JSON-LD logo is the full transparent logo with the tagline** (`/assets/brand/mokshify-logo.png`, 1200×350). `og.jpg` keeps its path and now shows the full logo on paper.
- **Old logo files stay on disk** (`assets/mark.png`, `mark-64.png`, `Mokshify_Logo.png`), but nothing references them now. `scripts/seo-assets.mjs`, which crops the old logo sheet, is superseded by `scripts/brand-logo.mjs`.
- **On phones of 416px and narrower, the header CTA is slightly smaller** (0.75rem), so the 125px logo lockup, the CTA and the menu button fit without horizontal scroll. Verified: 0 overflow at 375px.
- **Answers (part 8): all six were blank.** Nothing applied; every TODO(confirm) stays as it was.

## Film deletion, type-only hero, owner push (23 Nov 2026)

- **The film was deleted without waiting for the remote tag**, on your explicit instruction. The local `film-v1` tag is kept as it was.
- **`css/pages.css` was deleted with the film.** It is the pre-redesign editorial stylesheet, and no page links it.
- **`typescript` was removed** because `tsconfig.json` included only `src/` (the engine). **`esbuild` was kept** because the build minifies `js/site.js` with it.
- **`scripts/redesign/migrate-shell.mjs` was kept.** It is a one-time migration that already ran; it would refuse to run again on pages without `pages.css`, which is correct.
- **The home hero is the existing field variant (`.hero.dark`), with no special height.** Its height doesn't change when the video arrives, so adding the files causes no layout shift.
- **With the video files present, the poster is inserted by `site.js` as the still.** There is no image file to put in the HTML until then, and without JS the hero stays the type-only field, which is complete on its own.
- **The pause button appears only once something moves.** A pause control with nothing to pause would be noise; the keyboard check now tests both states.

## Home visual layer (HOME_VISUAL_SPEC.md, 23 Nov 2026)

- **Showcase projects: Next Edge Realty, Medico Diagnostics and AJ Agritech.** These are three client sites in three different industries. The images are the existing live-site plates, resized to 960×600 and 640×400 by `scripts/home-images.mjs` (`npm run images:home`); nothing is retouched.
- **The showreel shows the six live projects that have screenshots.** Somallamma has none yet. The Mokshify website is left out, because the reel is client work.
- **One pause button for all background motion.** The hero's existing pause control now stops the showcase, the light, the reel and the video together, and appears whenever the showcase moves. Hover and focus also pause the showcase and the reel, as the brief asks. A visible control is still needed so keyboard and touch users can stop motion that runs longer than 5 seconds (WCAG 2.2.2).
- **The marquee runs linear, not on the site easing.** An eased loop would visibly stop and restart at every seam. Everything else uses cubic-bezier(.16,1,.3,1).
- **The showcase's back cards are drawn at 88% and 66% opacity** for depth. The motion check's hidden-content test excludes them by name.
- **The pinned story steps through projects, not industries.** Real estate has two projects, so the story has seven steps; the industry list on the left advances as each one arrives. Every project's copy stays visible this way, with nothing cut to fit a single real-estate slot.
- **The pinned panel is at most 40rem tall and centred under the nav.** A full-height panel left an empty screen under the section heading on entry.
- **A tab chosen in the story scrolls the page with a short lock, so the story doesn't flicker through the projects in between.** Wheel, touch or scroll keys release the lock at once.
- **Below 1024px, and with reduced motion, the tabs are the plain tabs as before.** Without JavaScript all panels show, as before.
- **Image-break lines reuse existing copy:**
  - Break 1: "You bring the problem — we engineer the product." (hero sentence)
  - Break 2: "Enterprise-grade. Cloud-native. AI-first. Built to scale from day one." (capabilities lead)
- **Image-break stand-ins: the Terravion and Medico plates, blurred (5px) and graded down hard.** Unblurred, the screenshots' own headlines fought the line over them. The real images switch in automatically: the build swaps `assets/home/break-1.webp` / `break-2.webp` in when they exist (`TODO(asset)`).
- **Capability previews reuse each service page's own work pairing:** AI Products and SaaS → Qflow, Mobile Apps → FinCalix, Enterprise Software → AJ Agritech, Cloud → Medico Diagnostics. The AI Products preview is captioned "Built by the same team · Qflow", matching that page's honest label.
- **The pipeline dot is CSS scroll-driven (60rem and up).** Where that isn't supported, there is no dot and nothing breaks.
- **The CTA-band light is home only (`.t-home .band`).** The band is a shared partial, and the brief lists it under home details.
- **The flat paper mark is the artwork's own silhouette:** alpha softened (blur 2.5) and thresholded (0.15–0.32), filled with paper colour. It is used on dark surfaces only (the over-hero header, the mobile sheet and the footer). The colour lockup stays on light surfaces, now 40px.
- **`css/site.css` is now minified by the build** (esbuild, already a dependency; `css/src/` stays readable). The new layer would otherwise have put the stylesheet at 59.5 KB against its 60 KB budget; minified it is 51.6 KB.
- **Home-only JavaScript lives in `js/home.js`**, minified to 5.7 KB. The hero-video code moved there from `site.js`, so every other page got lighter.
- **The home page loads 34.0 KB of JS**: the shared 28.3 KB plus the home script. That is over the 30 KB shared budget by 4 KB on this one page; all other pages stay at 28.3 KB. Lighthouse performance on `/` is 98 on desktop and 96 on mobile.
- **The phone screenshots' declared size was corrected from 600×1350 to 600×2597** (59 occurrences in 33 files, and in both generator scripts). Image break 2 made Lighthouse notice the mismatch.
- **The hero headline's scroll "recede" now needs JavaScript (`.js`),** so with JS off nothing moves on its own. The spine is scroll-linked, not self-moving, and stays as built.

## Unresolved

- **Resolved 23 Nov 2026:** the branch and `film-v1` were pushed as `srimokshasoftwaredevelopers-a11y` (see the report, "Pushed as the repo owner"). The next two entries are kept as history.
- **`film-v1` tag not on the remote.** The tag exists locally on `974d9a2` (main), but `git push origin film-v1` returned 403: the credential on this machine (`ajagritecha-hub`) has no write access to `srimokshasoftwaredevelopers-a11y/Mokshify-v2`, and the `gh` account (`qflow-token`) has pull-only access. Following your rule, the frames, film engine, `js/main.js`, `css/styles.css`, `css/pages.css` and GSAP are **not deleted**. The new pages no longer load any of them. Morning action: push the tag, then run the deletion listed in `REDESIGN_REPORT.md`.
- **Branch not pushed.** Same 403, on three attempts (start, mid-run, end). All work is committed locally on `redesign/enterprise` (18 commits ahead of `main`).
- **FinCalix on iOS** is stated in the brief, but fincalix.com links only to Google Play (23 Nov 2026). The site says Android only, with a `TODO(confirm)`.
