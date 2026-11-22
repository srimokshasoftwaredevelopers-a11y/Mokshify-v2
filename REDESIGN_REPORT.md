# Mokshify.io redesign — morning report

Branch `redesign/enterprise` · 23 Nov 2026 · not merged, not deployed, **not pushed** (see "Needs you", item 1).

## Summary

- **All 73 routes are on the new "Monograph" design** (oxblood, limestone, paper, Switzer type, one brass spine). That is 66 kept pages, 7 new pages and the 404; SkillForceHub now redirects to `/work/`.
- **The film is gone from the homepage.** It now leads with live client websites by industry, then services, process, engagement models, trust and a call-to-action band.
- **Contact is one tap from every page:** phone and WhatsApp in the desktop nav, and a fixed Call/WhatsApp bar on phones and tablets.
- **Checks:** every automated check passes, and Lighthouse desktop scores 100 on all four categories for the homepage, a service page and an article. Numbers are below.
- **Your morning list:** push the `film-v1` tag (my credentials can't), confirm 11 facts, supply the hero still, Somallamma's URL and the form key.

## What was built, per phase

| Phase | Result |
|---|---|
| 0 · Audit | `REDESIGN_AUDIT.md`: stack, 67-route inventory, film mechanics, components, fix-list verification. |
| 1 · Structure | `scripts/build.mjs` assembles every page from partials (`head`, `nav`, `mega-menu`, `footer`, `cta-band`, plus `contact-bar`, `engagements`, `enquiry` and one `work-<slug>` per project). CSS source is split into `css/src/1-tokens`, `2-base`, `3-components` and `4-templates`, concatenated into `css/site.css` with content-hash cache busting. There is one shell script, `js/site.js` (9.8 KB, no libraries). Output is plain static HTML at the same paths. |
| 2 · Shell | Nav (transparent over oxblood heroes, limestone after scroll, phone number on desktop), full-width mega menu with a featured case study, full-screen mobile sheet from 900px down, mobile Call/WhatsApp bar, three hero variants (plate, field, paper), CTA band, five-column oxblood footer, and the brass spine with section labels on it. |
| 3 · Templates | Built and reviewed one page per template: `/`, `/services/`, `/services/ai-product-development/`, `/industries/healthcare/` and real-estate, `/work/fincalix/`, `/library/caching-strategy/`, `/stack/`, `/estimate/`, `/enterprise/`, `/consult/`, `/faq/`. |
| 4 · Rollout | All 66 inner pages migrated by script, copy untouched (`scripts/redesign/migrate-shell.mjs`), then a script per template: 10 service pages, 5 industry pages, 4 existing and 4 new case studies, stack, tools, utility. |
| 5 · Fixes + checks | All 8 fixes done (table below). Acceptance checks scripted as `npm run verify`. |

### The homepage

The film is removed. Sections run in this order:

1. Plate hero: "Engineering ideas into scalable software.", one plain sentence, Book a strategy call, WhatsApp us.
2. Work by industry, as six tabs (Real estate, Healthcare, Agriculture, Finance, Community, Products) with live screenshots. All panels are in the HTML.
3. Five-row capability index.
4. Idea → Scale pipeline.
5. Four ways to begin.
6. Trust: industries, cloud and platform, and stack as spec tables.
7. CTA band.

The chapter headlines are reused as section headlines.

### Portfolio

- **New case studies:** Next Edge Realty, AJ Agritech, Qflow and Somallamma Temple (placeholder plate until the URL is supplied).
- **Industries:** new `/industries/agriculture/`. Real estate shows both Next Edge and Terravion. Education now lists capabilities only, with a `TODO(proof)`.
- **SkillForceHub removed:** page and screenshots deleted, 301 to `/work/`, and removed from every page, the JSON-LD, sitemap, image sitemap, `llms.txt` and the search index.
- **FinCalix** now states 47 calculators and six languages, taken from the live site.
- **Screenshots:** live captures for every project at 1440px and 390px under `assets/sites/` (largest mobile image 103 KB).

### Other new pages

`/guides/` hub, `404.html`, and a design-system "Components" table on `/brand/`.

## Routes

**73 of 73 done**: 66 original pages, the 7 new pages (4 case studies, agriculture, guides, 404), and SkillForceHub, which is now a redirect. None are incomplete.

## Review screenshots

`d:\Mokshify\review\` (kept out of git):

- `review/<template>/375.png`, `768.png`, `1440.png`, plus a `-top.png` of the first screen, for all 11 templates.
- `review/rollout/` has every route at 375px; the overflow log is `review/rollout-375.log`.

## Check results

| Check | Result |
|---|---|
| Build | `npm run build` passes, and `npm run check` confirms every page is in sync with its partials. The CSS bracket guard passes. |
| Crawl | All 72 sitemap routes and the 404 checked, plus every internal link and asset: 0 non-200 and 0 orphans. `scripts/audit-site.mjs` finds 0 issues. |
| Sitemap vs disk | 72 = 72 |
| JSON-LD and feed | 72 JSON-LD blocks parse; `feed.xml` is well-formed with 11 items, all linking live pages. |
| Lighthouse (desktop) | `/`, `/services/ai-product-development/` and `/library/caching-strategy/` each score 100 for performance, accessibility, best practices and SEO, with LCP 0.6 s and CLS 0. Mobile `/` scores performance 97 and accessibility 100 (LCP 2.3 s). |
| Contrast (WCAG AA) | All text pairs pass; the lowest is ink at 68% on limestone, 5.86:1. The focus ring passes at 14.57:1 on light surfaces and 16.73:1 on dark (see below). |
| Keyboard | 21 of 21 checks pass: skip link, mega menu open, Tab-in and Escape, mobile sheet and accordion, home tabs with arrow keys, FAQ, form validation and fallback, estimator, and a visible brass focus ring. |
| 375px | 0 horizontal overflow on all 73 routes. |
| Weight | CSS 44.4 KB (limit 60), JS 9.8 KB (limit 20), largest mobile image 103 KB (limit 200). |
| Reduced motion | No element animates and no content stays hidden. |

**Focus ring:** brass alone measures only 2.39:1 on limestone, below the 3:1 minimum, so it now sits over a 3px ink ring.

Re-run everything with `npm run serve`, then `npm run verify` in a second terminal.

### Fixes

| # | Fix | Status |
|---|---|---|
| 1 | "Book a strategy call" goes to `/consult/` everywhere | Done; the crawl asserts it on every page. |
| 2 | Engagement models link to anchors on `/process/` | Done: the new "Four ways to begin" section on `/process/` has the anchors. |
| 3 | Unlinked capabilities get anchors on `/services/` | Done: `#enterprise-software`, `#workflow-automation`, `#data-layer-engineering`. |
| 4 | Each menu destination once; labels match destinations | Done: "Solutions" is now "Industries", and "Engineering home" appears once. |
| 5 | Counters render their final value | Done: the animated homepage counters were removed with the film. All figures are static. |
| 6 | "Honest" at most once per page | Done site-wide; 0 pages exceed one. |
| 7 | Film pages get a dated retired line | Done on 15 pages. |
| 8 | Forms post to one configurable endpoint | Done: `FORM_ENDPOINT` in `js/site.js`, with a mailto fallback and WhatsApp beside the form. |

## TODO(confirm): new case studies

These are HTML comments in the pages; none show as visible "TODO" text.

- [ ] Next Edge Realty: year built
- [ ] Next Edge Realty: database and hosting (the stack table currently shows Next.js and Cloudflare, read from the live site's headers)
- [ ] AJ Agritech: year built
- [ ] Qflow: release status (the page quotes qflow.in on 23 Nov 2026: live in the browser, Android "coming to Google Play", AP and Telangana, Guntur first)
- [ ] Qflow: stack
- [ ] Somallamma Temple: live URL
- [ ] Somallamma Temple: screenshots (once you have the URL, add it to `scripts/capture-sites.mjs` and run it)
- [ ] Somallamma Temple: what the temple needed, plus pages, features and year
- [ ] FinCalix: iOS. Your brief says it's live on iOS, but fincalix.com links only to Google Play, so the page says Android only for now.

## Needs you

1. **Push the tag, then delete the film.** I could not push: the credential on this machine (`ajagritecha-hub`) is refused with a 403, and the `gh` account has read access only. Following your rule, nothing from the film is deleted. The new site no longer loads any of it. From an account with write access:

   ```sh
   git push origin film-v1 && git ls-remote --tags origin film-v1     # must print the tag
   git push -u origin redesign/enterprise
   git rm -r frames src js/cinema.js js/main.js css/styles.css css/pages.css \
     scripts/sync-frames.ps1 scripts/optimize-frames.mjs scripts/export-scene-assets.mjs \
     scripts/storyboard-analyzer.html scripts/mobile-shots.mjs scripts/validate-seo.mjs tsconfig.json
   npm uninstall gsap esbuild typescript
   # then remove the "build:film", "optimize" and "typecheck" scripts from package.json
   # and the /frames/(.*) cache rule from vercel.json and _headers
   ```

   This frees 55 MB of frames plus about 300 KB of engine, script and old CSS.

2. **`TODO(asset)`, a merge blocker:** the hero still. `assets/home-plate.webp` (1920px) and `assets/home-plate-960.webp` are temporary exports of film frame 540. Replace both files, keeping the names.

3. **`TODO(proof)`:**
   - Enquiry or traffic numbers for Next Edge Realty and AJ Agritech, if the clients approve publishing them.
   - Qflow usage numbers, if any.
   - An education case study: `/industries/education/` is capabilities only for now.
   - A real AI or legacy-modernization case study. Those three service pages show "Built by the same team" instead.

4. **Form key.** In `js/site.js`, set `FORM_ENDPOINT`:
   - Web3Forms: `https://api.web3forms.com/submit`, plus `FORM_KEY` set to your access key.
   - Formspree: `https://formspree.io/f/<id>`, with `FORM_KEY` left empty.

   Then add that origin to `connect-src` in the CSP in both `vercel.json` and `_headers`, and run `npm run build`. Until then the form opens the visitor's mail app with everything filled in.

5. **404.html:** nothing to configure. Vercel serves a root `404.html` automatically for static deployments, as do Netlify and Cloudflare Pages. After deploying, check that `https://mokshify.io/anything` shows the new page with status 404.

6. **Cloudflare email obfuscation:** every strategy-call button now points at `/consult/`, so the email-protection URL you saw can no longer appear on a CTA. Plain `hello@mokshify.io` links still exist (footer, contact page). To stop Cloudflare rewriting them, turn off **Scrape Shield → Email Address Obfuscation** for mokshify.io. This is a dashboard setting, so I didn't touch it.

## Removed copy (film-only, dropped as agreed)

- "Scroll — the film follows your hand"
- "Ideas arrive. Products leave."
- "Interfaces, engineered to the micron."
- "Then it steps out into the street."
- "Then it breathes."
- "The film ends. The work begins."
- "Filmed entirely in code · Engineering ideas into scalable products"
- "Built with intention. Every pixel earned."
- "filmed entirely in code" in the footer line
- The `CH.01`–`CH.10` captions
- The five memory cards ("the hospital queue", "the property search", "the business dashboard", "the open ticket", "the spreadsheet, at 2 AM")
- The drafting figures (1.618 / 1.000 / 0.618)
- The deploy terminal lines and the "System healthy · 99.98% · last deployment 2 min ago" status
- The demo dashboard (1,248 deploys, 99.98% uptime, 86ms, ₹4.2L)
- The homepage case bullets and SkillForceHub copy. Homepage-only claims such as "500+ families invested", "₹45L entry price" and "NABL-accredited" are no longer on the homepage.
- The quick-contact card text "Need to discuss your project?"
- The homepage project-brief form; the form now lives on `/consult/` and `/contact/`.
- The `<noscript>` mirror, whose FAQ is still on `/faq/`.

`/work/mokshify-website/`, `/journal/` and `/benchmarks/` still describe the film, with the dated "retired" line.

## Unresolved (from `DECISIONS.md`)

- `film-v1` tag not on the remote (403), so the film files are not deleted.
- Branch not pushed (403, three attempts). There are 18 commits locally on `redesign/enterprise`.
- FinCalix iOS availability is unconfirmed.

Everything else I decided on my own is listed with one line of reasoning in `DECISIONS.md`.

---

# Follow-up run: motion, logo and answers (`MOTION_SPEC.md`)

Each numbered part is its own commit on `redesign/enterprise`. Layout, copy, colours, URLs and the portfolio are unchanged.

## Motion

Every animation uses `cubic-bezier(0.16, 1, 0.3, 1)` and moves only transform and opacity. All motion stops under `prefers-reduced-motion`, and everything is visible without JavaScript.

| Part | What it does |
|---|---|
| 1 · Hero video | A video slot sits behind the home hero, under the oxblood grade: muted, looped, 0.6× speed, `aria-hidden`. It loads only at 900px and wider, and never on Save-Data, 2g or 3g; those visitors get the poster. The files don't exist yet (**TODO(asset)**), so the still zooms from 1 to 1.08 over 25 seconds. A keyboard-usable pause/play button sits in the corner. When `hero.webm`, `hero.mp4` and `hero-poster.webp` exist in `assets/hero/`, the build switches the video on. Tested with a throwaway clip (since deleted): 0.6× playback, pausing, and no video request at 375px. |
| 2 · Slow zoom | Work-row screenshots, case-study plates and gallery frames settle from 1.06 to 1 over 1.8 seconds on entry, once, clipped inside their frames. |
| 3 · Smooth scrolling | Lenis 1.3.27 (MIT), self-hosted in `js/vendor/`, loaded deferred only on fine pointers at 900px and wider, with `lerp: 0.08`. Anchors land below the fixed nav. Keyboard scrolling, menus and tabs are unaffected, and touch devices keep native scrolling. |
| 4 · Reveals | Section headlines reveal line by line behind a clip mask (900ms, 110ms stagger); their markup is restored afterwards. Section content fades and rises 24px over 900ms, once; tools, forms and long-form articles stay still. The spine still draws at scroll speed. The home headline recedes to 0.96 and dims slightly as you scroll past. |
| 5 · Count-up and pipeline | Metric figures count up over 1.6 seconds and finish on the exact HTML value; ranges and words are left alone. The pipeline line draws left to right over 2 seconds, and each step fades in as the line reaches it. |
| 6 · Hover | Work-row screenshots zoom to 1.03 over 700ms; cards lift 2px over 400ms. |

Screenshots are in `review/motion/`: the hero, a work row, a section headline and the pipeline, each with `-mid` (mid-animation) and `-rest` versions.

## Logo

- **Original** saved untouched as `assets/brand/mokshify-logo-original.png` (2172×724).
- **Transparent copy:** `assets/brand/mokshify-logo-transparent.png`. The cream is removed against a locally estimated background, so the artwork pixels are unchanged.
  - Edge check at 2×: `review/logo/edges-2x.png`. Clean on limestone and paper.
  - **One caveat:** on oxblood, the lens flare under the ring breaks into small yellow-green specks. At the 28px header size that's about 2px.
  - I kept the transparent mark rather than the cream original, because the original would show a cream box on oxblood. If you want this perfect, supply a version of the mark made for dark backgrounds.
- **M mark:** cropped square and transparent, exported at 512, 192, 180, 32 and 16px for favicons, `apple-touch-icon` and the manifest. The 180px apple-touch icon sits on paper, because iOS turns transparency black.
- **Light surfaces** (scrolled header, paper pages): the full-colour mark and wordmark, without the tagline, at 36px tall. The 2× WebP is **12.0 KB** (PNG fallback 20.9 KB), with width and height set.
- **Oxblood surfaces** (hero header, mobile menu, footer): the M mark plus "Mokshify" in Switzer, in the paper colour. The footer also shows "Digital solutions. Limitless impact." in the mono label style.
- **Metadata:** the Open Graph image (`assets/og.jpg`, same path) now shows the full logo on paper. The Organization JSON-LD logo is now `/assets/brand/mokshify-logo.png` (1200×350).
- **`/brand/`:** five logo downloads and a usage-rules table.
- **Regenerate** with `npm run logo` if the artwork ever changes.
- **Screenshots** in `review/logo/`: `header-dark-hero.png`, `header-light-scrolled.png`, `header-light-mobile.png`, `mobile-menu.png`, `footer.png`.

## Answers applied

All six answers were blank, so nothing was applied and every TODO stays:

- Somallamma Temple: live URL and screenshots
- Qflow: release status
- FinCalix: App Store link
- Next Edge Realty and AJ Agritech: year built
- The form endpoint and key

## Push

- **Remote:** `origin` → `https://github.com/srimokshasoftwaredevelopers-a11y/Mokshify-v2.git` (owner `srimokshasoftwaredevelopers-a11y`, repo `Mokshify-v2`).
- **Git's credential on this machine** (Windows Credential Manager): GitHub user **`ajagritecha-hub`**. This is the account `git push` uses.
- **`gh` CLI account:** `qflow-token`, which has read access only (`push: false`).
- **Commit author name:** `venki0308`. That's a label on commits, not a login.
- **One attempt each:** `git push origin film-v1` and `git push -u origin redesign/enterprise` both returned **403**, "Permission to srimokshasoftwaredevelopers-a11y/Mokshify-v2.git denied to ajagritecha-hub". I did not retry, and no film files were deleted.
- **To fix:** give **`ajagritecha-hub`** write access to `srimokshasoftwaredevelopers-a11y/Mokshify-v2`, or sign Git Credential Manager in as an account that already has it. Then run the push and deletion commands in "Needs you", item 1 above.

## Checks (this run)

| Check | Result |
|---|---|
| Build | `npm run build` passes; `npm run check` shows 0 pages out of date. |
| Crawl | 125 URLs (72 routes + 404 + links and assets): 0 non-200, 0 orphans, 72 JSON-LD blocks parse. |
| Lighthouse, desktop | `/`: performance 98, accessibility 100, best practices 100, SEO 100, LCP 0.9 s, CLS 0.000. `/work/next-edge-realty/`: 100/100/100/100, LCP 0.6 s, CLS 0.000. |
| Lighthouse, mobile `/` | Performance 97, accessibility 100, LCP 2.3 s, CLS 0.000. |
| Reduced motion | 7 representative routes: 0 animating elements, 0 hidden, 0 video or Lenis requests, pause button hidden. |
| JavaScript off | Same 7 routes: 0 hidden elements, all six home tab panels visible, no figure stuck at 0. |
| 375px | 0 video or Lenis requests; 0 horizontal overflow on all 73 routes; Call/WhatsApp bar fixed and linked. |
| Keyboard | 24 of 24 pass, including the hero pause button (Tab, Enter pauses, Space resumes). |
| Weight | CSS 48.6 KB; JS 29.0 KB (site 10.2 KB minified + Lenis 18.8 KB) against the 30 KB budget; header logo 12.0 KB. |

Re-run everything with `npm run serve`, then `npm run verify` in a second terminal. `verify` now also runs `scripts/check-motion.mjs`.

## Still needs you (this run)

1. **Push access** for `ajagritecha-hub` (see Push). Film files stay until the `film-v1` tag is on GitHub.
2. **TODO(asset), hero video:** add `assets/hero/hero.webm`, `hero.mp4` and `hero-poster.webp`. The build turns the video on by itself.
3. **Optional:** a dark-background version of the M mark, if the small flare specks on oxblood matter to you.
4. **The six answers** from part 8, whenever you have them.
