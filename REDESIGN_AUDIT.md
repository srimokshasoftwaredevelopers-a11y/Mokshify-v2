# Mokshify.io redesign — Phase 0 audit

Branch `redesign/enterprise`, audited 2026-11-23 from commit `974d9a2`. No design changes have been made.

This audit reflects the revised Home brief: the scroll film is removed and the homepage is rebuilt as a normal-scrolling page.

## 1. Stack

| Item | What the repo has |
|---|---|
| Framework | None. 67 hand-written static HTML files. |
| Router | The file system: `<route>/index.html`, trailing slash on every internal link. |
| Templating | None. Head, nav and footer are copied into every file. Earlier rollouts were done by scripted find-and-replace. |
| Styling | Two plain CSS files. `css/pages.css` (259 lines) styles all 66 inner pages. `css/styles.css` (1,804 lines) styles the homepage only. |
| Design tokens | `:root` in both CSS files, duplicated. `docs/HANDBOOK.md` documents them. |
| Fonts | Google Fonts: Playfair Display, Inter, IBM Plex Mono. Nothing self-hosted. |
| Animation | GSAP ScrollTrigger (homepage frame scrubbing only) plus a hand-written `requestAnimationFrame` engine in `js/main.js`. Inner pages use CSS transitions only. |
| Build | `npm run build` = esbuild bundles `src/*.ts` into `js/cinema.js`. `npm run typecheck` = `tsc --noEmit` over `src/`. There is no linter and no HTML build step. |
| Hosting | Vercel, output directory `.`, build command `npm run build`. Security headers and CSP are in `vercel.json` and mirrored in `_headers`. |
| Scripts on pages | `js/analytics.js` on every page (inert event prep, plus Escape-to-close for menus). `js/estimator.js`, `js/dbselect.js`, `js/jsonfmt.js`, `js/search.js` on their own pages. |

Baseline before any change: `npm run typecheck` passes. `scripts/audit-site.mjs` reports 67 pages, 0 broken links, 0 orphans, 2 accepted thin-page flags (`/search/`, `/tools/json-formatter/`). All 67 JSON-LD blocks parse. Every canonical matches its path. `sitemap.xml` lists exactly the 67 pages on disk.

## 2. Routes

67 pages. "Imagery today" counts only what is inside `<main>`.

### Home (template 1)

| Path | Source | Imagery today |
|---|---|---|
| `/` | `index.html` | Frame-sequence film, 20 inline SVGs, 1 client screenshot swapped by script |

### Hub (template 2)

| Path | Source | Imagery today |
|---|---|---|
| `/services/` | `services/index.html` | None |
| `/industries/` | `industries/index.html` | None |
| `/work/` | `work/index.html` | None |
| `/engineering/` | `engineering/index.html` | None |
| `/resources/` | `resources/index.html` | None |
| `/library/` | `library/index.html` | None |
| `/guides/` | **Missing.** No `guides/index.html`; the URL returns 404 today. `/resources/` acts as the guides hub. | — |

### Service detail (template 3)

| Path | Source | Imagery today |
|---|---|---|
| `/services/ai-product-development/` | `services/ai-product-development/index.html` | None |
| `/services/ai-transformation/` | `services/ai-transformation/index.html` | None |
| `/services/custom-software-development/` | `services/custom-software-development/index.html` | None |
| `/services/saas-development/` | `services/saas-development/index.html` | None |
| `/services/web-application-development/` | `services/web-application-development/index.html` | None |
| `/services/mobile-app-development/` | `services/mobile-app-development/index.html` | None |
| `/services/cloud-engineering/` | `services/cloud-engineering/index.html` | None |
| `/services/api-development/` | `services/api-development/index.html` | None |
| `/services/product-design/` | `services/product-design/index.html` | None |
| `/services/legacy-modernization/` | `services/legacy-modernization/index.html` | None |

### Industry detail (template 4)

| Path | Source | Imagery today |
|---|---|---|
| `/industries/healthcare/` | `industries/healthcare/index.html` | None |
| `/industries/fintech/` | `industries/fintech/index.html` | None |
| `/industries/real-estate/` | `industries/real-estate/index.html` | None |
| `/industries/education/` | `industries/education/index.html` | None |

### Case study (template 5)

| Path | Source | Imagery today |
|---|---|---|
| `/work/fincalix/` | `work/fincalix/index.html` | 1 screenshot (`assets/sites/fincalix.png`) |
| `/work/medico-diagnostics/` | `work/medico-diagnostics/index.html` | 1 screenshot (`medico.png`) |
| `/work/terravion-properties/` | `work/terravion-properties/index.html` | 1 screenshot (`terravion.png`) |
| `/work/skillforcehub/` | `work/skillforcehub/index.html` | 1 screenshot (`skillforce.png`) |
| `/work/mokshify-website/` | `work/mokshify-website/index.html` | None |

### Long-form (template 6)

| Path | Source | Imagery today |
|---|---|---|
| `/library/multi-tenant-saas/` | `library/multi-tenant-saas/index.html` | 1 SVG diagram |
| `/library/caching-strategy/` | `library/caching-strategy/index.html` | 1 SVG diagram |
| `/library/background-jobs/` | `library/background-jobs/index.html` | 1 SVG diagram |
| `/library/authentication-architecture/` | `library/authentication-architecture/index.html` | 1 SVG diagram |
| `/library/monolith-vs-microservices/` | `library/monolith-vs-microservices/index.html` | 1 SVG diagram |
| `/library/rag-explained/` | `library/rag-explained/index.html` | None |
| `/library/llm-evaluation/` | `library/llm-evaluation/index.html` | None |
| `/library/choosing-a-cloud/` | `library/choosing-a-cloud/index.html` | None |
| `/library/observability/` | `library/observability/index.html` | None |
| `/journal/` | `journal/index.html` (one page, entries `#001`, `#002`) | None |
| `/guides/ai-readiness/` | `guides/ai-readiness/index.html` | None |
| `/guides/choose-software-company/` | `guides/choose-software-company/index.html` | None |
| `/guides/cloud-migration-checklist/` | `guides/cloud-migration-checklist/index.html` | None |
| `/guides/software-cost/` | `guides/software-cost/index.html` | None |
| `/guides/validate-mvp/` | `guides/validate-mvp/index.html` | None |
| `/guides/why-software-projects-fail/` | `guides/why-software-projects-fail/index.html` | None |
| `/legal/privacy/` | `legal/privacy/index.html` | None |
| `/legal/terms/` | `legal/terms/index.html` | None |
| `/legal/accessibility/` | `legal/accessibility/index.html` | None |
| `/legal/cookies/` | `legal/cookies/index.html` (not in the brief's list) | None |
| `/legal/disclosure/` | `legal/disclosure/index.html` (not in the brief's list) | None |

### Reference (template 7)

| Path | Source | Imagery today |
|---|---|---|
| `/stack/` | `stack/index.html` | None (18 text cards) |
| `/benchmarks/` | `benchmarks/index.html` | None |
| `/architecture/` | `architecture/index.html` | 4 SVG diagrams |
| `/decisions/` | `decisions/index.html` (one page, 10 records as anchors) | None |
| `/devops/` | `devops/index.html` | None |

### Tools (template 8)

| Path | Source | Imagery today |
|---|---|---|
| `/estimate/` | `estimate/index.html` + `js/estimator.js` | None |
| `/tools/database-selector/` | `tools/database-selector/index.html` + `js/dbselect.js` | None |
| `/tools/json-formatter/` | `tools/json-formatter/index.html` + `js/jsonfmt.js` | None |

### Company (template 9)

| Path | Source | Imagery today |
|---|---|---|
| `/about/` | `about/index.html` | None |
| `/process/` | `process/index.html` | None |
| `/enterprise/` | `enterprise/index.html` | None |
| `/security/` | `security/index.html` | None |
| `/careers/` | `careers/index.html` | None |
| `/brand/` | `brand/index.html` | None inline (links to downloadable logo files) |
| `/quality/` | `quality/index.html` (not in the brief's list) | None |

### Conversion (template 10)

| Path | Source | Imagery today |
|---|---|---|
| `/consult/` | `consult/index.html` | None. No form; booking is email or WhatsApp. |
| `/contact/` | `contact/index.html` | None. No form. |

### Utility (template 11)

| Path | Source | Imagery today |
|---|---|---|
| `/faq/` | `faq/index.html` (15 accordions) | None |
| `/search/` | `search/index.html` + `js/search.js` + `search-index.json` | None |
| `/sitemap/` | `sitemap/index.html` | None |
| 404 | **Missing.** No `404.html`; Vercel serves its default page. | — |

### Differences from the brief's route list

- **Missing:** `/guides/` hub and the 404 page.
- **Present but not listed:** `/quality/`, `/legal/cookies/`, `/legal/disclosure/`. They stay and get the Company and Long-form templates.
- **Library:** 9 article pages exist. `/engineering/` says "ten articles".
- **Decision records** are one page with ten anchors, not separate pages.

## 3. The homepage film as built

| Question | Answer |
|---|---|
| Chapters | Ten, not nine. The timing table is `CH` in `js/main.js`. |
| Chapters that play footage | 1 to 4 only (0% to 33% of the scroll track). One continuous shot. |
| Chapters 5 to 10 | Built in DOM and SVG: device mock-ups, case-study browser, pipeline, engagement cards, architecture diagram, contact. No footage. |
| Asset files | `frames/1/web/frame_000001.webp` to `frame_000914.webp` plus `manifest.json`. 914 frames at 1920×1080, 55 MB in total. |
| Video files | None. There is also no `public/` directory. |
| Duration | No fixed duration; the frames are scrubbed by scroll. The source frame rate is not recorded in the repo. |
| Scroll mechanics | A spacer `.scroll-space` is 2800vh tall (1500vh at 1023px and below). `<main class="stage">` is fixed and full-screen. Progress = scroll position ÷ track length. GSAP ScrollTrigger maps progress to a frame index and paints it to a canvas. `js/main.js` shows and hides each `.scene` and drives all overlay animation from the same progress value. |
| After the film | `.film-end` is a normal-flow section with a CTA and a five-column link block. |
| Reduced motion | Decorative animation and inertia are switched off. The film still scrubs; it does not fall back to stills. |
| Without JavaScript | A hidden `.static-page` article mirrors the content. |

### Chapter headlines available for reuse

| Chapter | Headline | Proposed new section |
|---|---|---|
| 1 | Engineering ideas into scalable software. | Hero |
| 2 | Where problems become products. | Capability strip |
| 3 | Interfaces, engineered to the micron. | Selected work, as its sub-line |
| 4 | Then it steps out into the street. | Selected work |
| 5 | Then it breathes. | No natural home (see section 6) |
| 6 | (none; case titles only) | — |
| 7 | From idea to scale, one continuous line. | How it gets built |
| 8 | Four ways to begin. One standard. | Four ways to begin |
| 9 | Trust is an engineering discipline. | Trust |
| 10 | Let's build what competitors can't. | CTA band |

### What removing the film deletes

| Item | Size | Note |
|---|---|---|
| `frames/1/web/` | 915 files, 55 MB | A few stills would be exported first if they are used as plates. |
| `src/` (6 TypeScript files) | 37 KB | The frame engine. |
| `js/cinema.js` | 124 KB | Its bundle, including GSAP. |
| `js/main.js` | 40 KB | The scroll engine; replaced by a small script or none. |
| `css/styles.css` | 88 KB | Replaced by the shared stylesheet. |
| `gsap` dependency | — | No other user. |
| `scripts/sync-frames.ps1`, `optimize-frames.mjs`, `export-scene-assets.mjs`, `storyboard-analyzer.html` | 32 KB | Film tooling only. |
| `scripts/mobile-shots.mjs`, `validate-seo.mjs` | 3 KB | Film-specific checks; rewritten as general ones. |
| Frame preload tag, `/frames/*` cache rules | — | In `index.html`, `vercel.json`, `_headers`. |
| Film sections of `README.md` and `docs/HANDBOOK.md` | — | The handbook currently says the homepage is locked. |

With `src/` gone, `npm run build` has nothing to bundle. The build script and the Vercel build command must change in the same commit or the deploy fails.

## 4. Shared components

All inner-page components live in `css/pages.css`. The nav and footer markup is byte-identical on all 66 inner pages.

| Component | Class | Used on | Notes |
|---|---|---|---|
| Nav bar | `.pnav` | 66 inner pages | Logo, five groups, CTA pill. Sticky, blurred cream. |
| Mega menu | `.pnav .grp` / `.panel` | 66 inner pages | CSS-only, opens on hover or focus. Small per-group dropdowns, not full width. No `aria-expanded`. |
| Mobile nav | — | — | **None on inner pages.** At 560px and below every link except the CTA is hidden. |
| Homepage nav | `.nav`, `.nav-explore`, `.xpanel`, `.mnav`, `.mbar` | `/` | Separate markup and CSS from the inner nav. |
| Footer | `.pfoot` | 66 inner pages | Five columns: Services, Industries, Engineering, Company, Connect. |
| Homepage footer | `.film-end .fe-nav` | `/` | Same five columns, separate markup. |
| Page opening | `.pkicker`, `h1` with `<em>`, `.plede` | 66 inner pages | The italic maroon `<em>` word is in every `h1`. |
| CTA band | `.pcta` + `.btn` / `.btn.ghost` | 44 pages | Maroon gradient panel, 22px radius. |
| Card grid | `.grid` + `.card` | 5 hubs (not `/resources/`), `/brand/` | Gradient cards with shadows. |
| Fact strip | `.facts` | 10 pages | Static numbers in HTML. |
| Byline | `.pmeta` | 24 pages | Date and read time in mono. |
| FAQ accordion | `details` / `summary` | 15 pages | Native, keyboard usable. |
| Timeline | `.timeline` | `/process/`, `/enterprise/` | Vertical list with dots. |
| Stack cards | `.tstack` | `/stack/` | 18 cards. |
| Diagram frame | `.diagram` | `/architecture/`, 5 articles | Inline SVG with hard-coded cream and maroon colours. |
| Tool form | `.est`, `.opts`, `.est-out` | 3 tools | Radio pills and a result panel. |
| Search | `.search-box`, `.sres` | `/search/` | Client-side. |
| Tables | — | — | **No page uses a `<table>` today.** |
| Article layout | `.pwrap` | 66 inner pages | One 820px column for every page type. No table of contents. |

## 5. Fix list, checked against the code

| # | Finding | Status |
|---|---|---|
| 1 | "Book a strategy call" goes to `mailto:` instead of `/consult/` in 15 places: the closing CTA on 11 inner pages (`/services/`, `/process/`, `/work/`, four service pages, four case studies) and 4 on the homepage. The repo contains no Cloudflare URL. Cloudflare's email obfuscation rewrites `mailto:` links at the edge, which matches what you saw. | Confirmed. The Cloudflare setting itself cannot be checked from the repo. |
| 2 | The four engagement models on `/services/` are plain text. `/process/` has no anchors to link to yet. | Confirmed |
| 3 | Enterprise software, Workflow automation and Data layer engineering have no link in "Everything we build". | Confirmed |
| 4 | "Solutions" points to `/industries/` in both menus, while the footer calls the same pages "Industries". Each menu links `/engineering/` twice: the group label and "Engineering home". On the homepage the "Explore" label also goes to `/engineering/`. | Confirmed |
| 5 | The chapter 5 dashboard shows 1,248 deploys, 99.98% uptime, 86ms p95 and ₹4.2L with no label. Chapter 9 shows "System healthy · 99.98% uptime · last deployment 2 min ago". | Confirmed. Both sit in film scenes that the new Home brief removes. |
| 6 | Eight case-study counters on the homepage are `0` in the HTML and filled by script. Inner-page fact strips are already static. | Confirmed |
| 7 | "honest" appears four times in the body of `/engineering/`. | Confirmed |

## 6. Conflicts and decisions needed

1. **Pages that describe the film.** `/work/mokshify-website/` ("You are inside the deliverable"), `/benchmarks/`, `/journal/` entries 001 and 002, `/about/` and `/legal/accessibility/` describe the film as the live homepage. So do single lines on ten other pages, plus `feed.xml` and `humans.txt`. Hard rule 2 keeps that copy; after the film is removed it describes something that is no longer there.
2. **Hero plate source.** The brief says footage is being replaced with files of the same names, and that stills come from `public/`. Neither exists yet. The only footage in the repo is the current frame sequence.
3. **"Enterprise Software" in the capability strip** has no service page.
4. **Film-only homepage copy** cannot survive the rebuild as written: "Scroll — the film follows your hand", "The film ends. The work begins.", "Filmed entirely in code", the `CH.0x` captions, the deploy terminal lines and the demo dashboard. "Then it breathes." has no section in the new order.
5. **Forms on `/consult/` and `/contact/`.** Neither page has a form and the site has no backend. The homepage form posts through `mailto:`.
6. **`/guides/` hub and 404 page** do not exist. Creating them adds two new URLs.
7. **Case-study gaps.** Each client has one tall screenshot (1440×2400), so a gallery has to be crops of that one capture. No page states a project year or platform line for the fact strip.

## 7. Risks the redesign has to handle

- **Stale CSS.** `/css/*` and `/js/*` are served as immutable for one year and inner pages link `/css/pages.css` with no version. Returning visitors would keep the old stylesheet unless the file name changes.
- **CSP.** `font-src` allows only `fonts.gstatic.com`. Self-hosted Switzer needs `'self'` added in `vercel.json` and `_headers`. `script-src 'self'` means all new script must be external files.
- **Speakable schema.** The homepage JSON-LD points at `.hero-title h1` and `.hero-sub`. The new hero must keep those class names for the JSON-LD to stay unchanged.
- **Metadata.** `theme-color` is `#F7F2EC` on every page and in the manifest. Updating it to the new palette is a metadata change.
- **Diagrams.** The nine inline SVG diagrams hard-code the old colours and IBM Plex Mono.
- **Rollout method.** With no templating, the shell and templates are applied to 66 files by Node scripts in `scripts/`, the same way earlier rollouts were done.
- **Checks.** There is no linter and Lighthouse is not installed. Python is not on this machine, so `npm run serve` does not work here.
- **This file** sits at the repo root and would be publicly served if merged as is.
