# CLAUDE CODE — Mokshify redesign, complete unattended run

Paste everything below into the same Claude Code session that produced `REDESIGN_AUDIT.md`.

---

I am away until morning. Run the whole redesign from Phase 1 to the final report in one go. This message replaces every "stop and wait for approval" in my earlier instructions. My earlier answers to your seven decisions still stand.

## HOW TO WORK UNATTENDED

1. **First action:** save this whole message as `REDESIGN_SPEC.md` in the repo root and commit it. Re-read it at the start of every phase, because your context will be compacted during the night.
2. **Never ask me a question.** When something is unclear, choose the option that keeps existing content and URLs intact, and record it in `DECISIONS.md` with one line of reasoning.
3. **Keep `PROGRESS.md` current:** phase, templates done, routes done, routes remaining. Update it after every commit so you can resume from it.
4. **Stay on `redesign/enterprise`.** Commit after every template and every phase. Push the branch. Do not merge to main, do not deploy, do not touch DNS or hosting settings.
5. **If something fails three times** (a build step, a screenshot tool, a check), log it in `DECISIONS.md` under "Unresolved" and move on. Do not loop.
6. **Do not invent facts.** No new clients, logos, testimonials, awards, team sizes or metrics. Missing proof becomes a `TODO(proof)` comment and a line in the final report.
7. Every existing URL keeps its path, copy, metadata, JSON-LD and canonical tag. `feed.xml` and the sitemap stay correct. The only exception is SkillForceHub (see "Portfolio changes").

## WHO THE SITE IS FOR

The people who actually hire Mokshify are business owners in Andhra Pradesh and Telangana: real-estate developers, agri-input and pesticide companies, doctors and diagnostic labs, shop and store owners, temples and trusts. Most are not engineers. A few are startup founders and enterprise IT leads.

Design for the owner first. Within ten seconds on the homepage, a real-estate owner, a pesticide company owner or a doctor must be able to:

1. See a real, live website Mokshify built for a business like theirs.
2. Understand in plain words what Mokshify will do for them.
3. Call or WhatsApp in one tap.

What this changes:

- **Work comes first.** The homepage shows built websites by industry directly under the hero, before services and before process.
- **Plain language on top, depth underneath.** Home, hubs, service and industry pages lead with one plain sentence a shop owner understands. Technical detail stays on the page, lower down, and in the Engineering section.
- **Less copy per screen.** Buyers skim. Keep every existing fact, but present it as short statements, spec tables and pictures, with long text collapsed behind "Read more" where needed.
- **Contact is never more than one tap away.** Phone number and WhatsApp in the nav on desktop, a fixed two-button bar (Call, WhatsApp) at the bottom on mobile, on every page.
- **Proof is specific.** Each project shows the industry, the live URL, a real screenshot, and what was built, in a problem → what we built → result shape. Results only where a real number exists.
- **Speed is part of the pitch.** The site must feel instant on a mid-range Android phone on mobile data. Largest image under 200 KB on mobile, no layout shift.

## PORTFOLIO CHANGES

### Remove SkillForceHub

- Delete `/work/skillforcehub/` and every mention of it: home, nav, mega menu, footer, `/work/`, `/services/`, `/industries/education/`, sitemap, JSON-LD, feed.
- Redirect `/work/skillforcehub/` to `/work/` using whatever the host supports (redirects file, or a static page with a canonical link and meta refresh).
- `/industries/education/` stays, without a case study. Rewrite its proof section as capabilities only and add `TODO(proof)`.

### Projects to show

Build one case-study page per project at `/work/<slug>/` using the Case study template, add each to `/work/`, the homepage, nav, footer and sitemap. Use only the facts below plus what is visible on the live site. Mark anything uncertain `TODO(confirm)`.

| Project | Slug | Industry | Type | Live URL | Facts you may state |
|---|---|---|---|---|---|
| FinCalix | `fincalix` (exists) | Finance | Own product | fincalix.com | Indian financial calculator app, live on Google Play and iOS, works offline, multiple languages. Update the calculator count to match the live site and Play listing. |
| Medico Diagnostics | `medico-diagnostics` (exists) | Healthcare | Client | keep current | Keep existing copy. |
| Terravion Properties | `terravion-properties` (exists) | Real estate | Client | keep current | Keep existing copy. |
| Next Edge Realty | `next-edge-realty` (new) | Real estate | Client | nextedgerealty.com | Plotted-development sales site. About 200 pages covering projects, plots, localities and guides. Interactive plot map on satellite imagery with live plot availability. Lead CRM and admin dashboard. Journal and guides. Search-optimised. |
| AJ Agritech | `aj-agritech` (new) | Agriculture | Client | ajagritech.com | Brand and product catalogue site for an agri-inputs company serving Andhra Pradesh and Telangana. Telugu by default, with Hindi and English. Admin dashboard to manage products. Enquiry form to the client's mailbox. Mention no other brand names. |
| Qflow | `qflow` (new) | Product | Own product | qflow.in | Queue and token management for any business with a queue: salons, clinics, hospitals, restaurants, temples, banks, government offices. Separate portals for businesses, customers and admin. Credit line: "A product of Sri Moksha Software Developers". Name no individual. State the release status as `TODO(confirm)`. |
| Somallamma Temple | `somallamma-temple` (new) | Community | Client | `TODO(confirm)` | Temple website, completed and handed over. Build the page with a placeholder plate until the URL is supplied. |

- Keep `/work/mokshify-website/` as it is, with the dated "film retired" line.
- **Screenshots:** for each live URL, capture the homepage with a headless browser at 1440px and 390px wide, save as WebP under `assets/sites/`, and use them in the work rows and case-study plates. If a capture fails, use a labelled placeholder and list it in the report.
- **New industry page:** add `/industries/agriculture/` using the Industry detail template, with AJ Agritech as its case study. Add it to nav, footer and sitemap.
- `/industries/real-estate/` now shows both Terravion Properties and Next Edge Realty.
- Do not add any project that is not in this table.

## STRUCTURE WORK (do this before any styling)

- Add a small Node build script that assembles pages from partials: `head`, `nav`, `mega-menu`, `footer`, `cta-band`. Source pages hold only their own content. Output is plain static HTML at the same paths as today. No framework.
- One stylesheet with one set of tokens, under a new file name. Split the source into `tokens`, `base`, `components`, `templates` and concatenate at build.
- One small vanilla JS file, loaded with `defer`. No GSAP, no libraries.
- Delete the film engine, frames and old stylesheets only after confirming the `film-v1` tag exists on the remote.

## DESIGN SYSTEM — "The Monograph"

The reference is an architecture firm's monograph: deep colour fields, stone surfaces, large exact type, one metal hairline, real screens and diagrams. Calm and expensive. It must not look like a template, a SaaS landing page or the old cream-and-serif site.

### Tokens

| Token | Value | Use |
|---|---|---|
| `--oxblood-900` | `#2A0A12` | Deepest surface: heroes, mega menu, footer |
| `--oxblood-700` | `#4A1422` | Brand surface, primary button on light |
| `--limestone` | `#E4E2DC` | Main light surface |
| `--paper` | `#F6F5F1` | Long-form reading surface, cards on limestone |
| `--ink` | `#141012` | Text on light |
| `--brass` | `#B08D57` | Hairlines, markers, focus rings only |

- Text on dark: `--paper` at 100%, 70%, 45%. Text on light: `--ink` at 100%, 68%, 45%.
- No pure black, no pure white, no gradients except one soft radial vignette inside oxblood heroes.
- Brass is never a fill and never body text.

### Type

- **Switzer** (self-hosted variable, `font-display: swap`, preload the one file): all headlines and UI. Headlines weight 500, tracking -0.03em, line-height 0.95. Emphasis comes from size and weight. No italic serif accent words anywhere.
- **Newsreader**: body text of articles, decision records, guides and legal pages only.
- **JetBrains Mono**: eyebrows, metadata rows, table figures, code.
- Scale: hero `clamp(3.25rem, 8vw, 8.5rem)`; section `clamp(2.25rem, 4.5vw, 4.5rem)`; sub-head `clamp(1.375rem, 2vw, 1.875rem)`; body `1.0625rem/1.6`; label `0.75rem`, uppercase, `0.16em` tracking.
- Headlines use `text-wrap: balance`. Body uses `text-wrap: pretty`. Maximum body measure is 68 characters.

### Grid and space

- 12 columns, max width 1440px, gutter `clamp(1.25rem, 4vw, 4.5rem)`.
- Section spacing `clamp(5rem, 11vh, 10rem)`. Use it consistently. Never stack two different paddings between sections.
- Layouts are asymmetric on purpose: headline in columns 2–9, supporting text in columns 8–12, labels hanging in column 1 on the spine.
- Radius 2px on cards, inputs and images. Pill radius on the primary CTA only.
- Hairline borders, 1px, at 14% opacity of the text colour. Shadows only on floating UI.

### Signature: the brass spine

A 1px brass line runs down the left edge of the content column on every page, from under the nav into the footer.

- Each section has a mono label that sits on the spine with a small brass tick.
- The line draws downward once as the page scrolls (CSS scroll-driven animation, with a static full line as the fallback).
- On long-form pages the sticky table of contents hangs from it and the current section's tick is filled.
- It ends in the footer at the Mokshify mark.

This is the one bold device. Do not add other decorative elements.

### Motion (CSS and vanilla JS only)

- **Page load:** hero headline sets line by line (clip reveal, 700ms, staggered 90ms), then the spine starts drawing.
- **Scroll:** sections fade and rise 16px once on entry. Nothing loops. Nothing parallaxes except the hero plate at a maximum of 6%.
- **Navigation:** enable cross-document view transitions with a 200ms cross-fade as progressive enhancement.
- **Hover:** links get a left-to-right underline wipe; cards lift 2px and their hairline turns brass; work rows reveal their screenshot.
- `prefers-reduced-motion`: everything is static and fully visible.

### Components (build each once, document in `/brand/`)

- **Nav:** 64px bar, transparent over oxblood heroes and solid limestone after scroll. Logo, five items, one pill CTA.
- **Mega menu:** full-width oxblood panel, four columns with mono headings, each destination listed once, a featured case study on the right with its real screenshot. Fully keyboard operable, closes on Escape.
- **Mobile menu:** full-screen oxblood sheet with accordion groups, on every page, from 900px down.
- **Contact bar:** on mobile, a fixed bottom bar with two buttons, Call and WhatsApp, on every page. On desktop, the phone number sits in the nav beside the CTA.
- **Hero (three variants):** `plate` (full-bleed image with oxblood grade), `field` (oxblood with type only), `paper` (light, for long-form). Each has a mono breadcrumb, headline, one sentence, and at most two actions.
- **Spec table:** two columns, label in mono, value in Switzer, hairline rows. Used for "what you get", fact strips, enterprise and security checklists.
- **Index list:** large rows with title, one-line description, mono metadata on the right, and an arrow. Used on all hub pages in place of bullet lists.
- **Work card / work row:** real screenshot in a plain browser or phone frame, industry in mono, one real metric.
- **Metric:** large Switzer figure with a mono caption and a source link. Only for numbers that already exist in the copy.
- **Pipeline:** the Idea → Scale steps as a horizontal line with ticks, drawn in brass, scrolling horizontally on mobile.
- **Diagram frame:** SVG diagrams redrawn in token colours with 1px strokes and mono labels.
- **Article kit:** drop-in styles for headings, lists, block quotes, code blocks with a copy button, callouts, footnotes, figure captions.
- **Form kit:** labelled fields with hairline boxes, brass focus ring, inline validation, success state.
- **CTA band:** oxblood field, one headline, one sentence, "Book a strategy call" and "WhatsApp us".
- **Footer:** oxblood, all five link columns kept, address line, the spine ending at the mark.

### Imagery rules

55 inner pages have no imagery. Fix that without inventing anything:

- **Case studies and anything that cites them:** the real screenshots, framed.
- **Service pages:** an SVG diagram of how that service is delivered, built only from what the page copy already says.
- **Industry pages:** the matching case study screenshot plus a small system diagram.
- **Engineering and reference pages:** diagrams and tables are the imagery.
- **Company pages:** typographic plates (a large statement on an oxblood field) and spec tables.
- **Home hero:** export the best still from the current frames, then grade it to the palette with an oxblood multiply layer and reduced saturation, so it looks intentional. Mark it `TODO(asset)`.
- No stock photos, no AI-generated people, no decorative 3D shapes, no icon grids.

## TEMPLATES

Build one real page per template first, then roll it out to every route of that type in the audit table.

1. **Home** (film removed). Sections in order:
   - `plate` hero: "Engineering ideas into scalable software.", one plain sentence saying Mokshify builds websites, apps and software for businesses, two actions (Book a strategy call, WhatsApp us).
   - Work by industry, directly under the hero: a row of industry tabs (Real estate, Healthcare, Agriculture, Finance, Community, Products). Each tab shows its real projects as large work rows with the live screenshot, one line on what was built, and a link to the case study and the live site. The first tab is open by default and all content is in the HTML.
   - Capability index: five rows linking to service pages.
   - Pipeline: Idea → Scale, linking to `/process/`.
   - Four ways to begin: four spec cards.
   - Trust: industries, clouds and stack as three spec tables, linking to `/enterprise/` and `/stack/`.
   - CTA band.
2. **Hub.** `field` hero with a one-line thesis, then an index list. No bullet lists.
3. **Service detail.** `field` hero; "what you get" spec table; delivery diagram; one relevant case study; engagement options; CTA band.
4. **Industry detail.** `field` hero; the problems; the matching case study with its metric; relevant services as an index list; CTA band.
5. **Case study.** `plate` hero from the product screenshot; fact strip; problem → build → result; gallery; stack table; next case study.
6. **Long-form.** `paper` hero; Newsreader body; sticky contents on the spine; article kit; related reading.
7. **Reference.** Compact `field` hero; dense tables or diagram gallery with simple client-side filters.
8. **Tools.** Compact hero; an app-like panel on paper; results in mono; one CTA after the result.
9. **Company.** Alternating oxblood and limestone editorial sections; spec tables on `/enterprise/`, `/security/`, `/quality/`.
10. **Conversion.** Two columns: three plain steps of what happens next, and the form.
11. **Utility.** FAQ as an accessible accordion; search; sitemap as an index list; `404.html`; the new `/guides/` hub.

## FIXES (all confirmed in your audit)

1. Every "Book a strategy call" links to `/consult/`. No `mailto:` on CTAs.
2. Engagement models link to the right anchor on `/process/`.
3. The three unlinked capabilities get anchors on `/services/`.
4. Each menu destination appears once. Labels match destinations.
5. Counters render their final value in the HTML.
6. "Honest" appears at most once per page.
7. Pages that describe the film get one dated line saying it was retired.
8. `/consult/` and `/contact/` forms post to one configurable endpoint constant, with a mailto fallback until I supply the key.

## SELF-REVIEW LOOP (this replaces my approval)

After each template's first page, and again after rollout:

1. Screenshot it at 375, 768 and 1440 pixels wide with a headless browser.
2. Look at each screenshot and check it against this list:
   - Does the headline dominate, with clear hierarchy below it?
   - Is the spine present, aligned, and are labels sitting on it?
   - Is spacing between sections consistent?
   - Any text overflow, orphaned word, cramped line or horizontal scroll?
   - Any section that is still a plain bullet list or a wall of text?
   - Does it look like the same site as the other templates?
   - Would this page look at home on the site of a large engineering firm?
   - Could a real-estate owner or a doctor understand the first screen and find the Call or WhatsApp button without scrolling?
3. Fix what fails. Do at most two fix passes per page, then move on.
4. Save final screenshots to `review/<template>/<width>.png`.

## FINAL CHECKS

- Build passes with no errors.
- Crawl the built site: every route in the audit table returns 200, zero broken internal links, zero orphans.
- Sitemap matches pages on disk. `feed.xml` and all JSON-LD still parse.
- Lighthouse on `/`, one service page and one article: performance 90 or higher on desktop, accessibility 95 or higher.
- Contrast meets WCAG AA on oxblood, limestone and paper.
- Keyboard: mega menu, mobile menu, accordion, forms and tools all work, with a visible brass focus ring.
- 375px: no horizontal scroll on any route.
- Total CSS under 60 KB and JS under 20 KB before compression.

## MORNING REPORT

Write `REDESIGN_REPORT.md` and end your last message with its summary:

- What was built, per phase.
- Routes completed out of the total. Any not completed, and why.
- The `review/` screenshot folder path.
- Check results, with numbers.
- Every `TODO(confirm)` in the new case studies, as a checklist.
- What needs me: `TODO(asset)` and `TODO(proof)` items, the form key, hosting configuration for `404.html`, the Cloudflare email-obfuscation setting.
- Everything in `DECISIONS.md` under "Unresolved".

---

## Earlier answers that still stand (copied from the previous message, for resumption)

1. Film pages: keep the copy, add one dated line saying the film was retired.
2. Hero plate: export a still from the current frames as a temporary plate, mark it TODO(asset) as a merge blocker. The owner will supply the real hero still.
3. Frames: before deleting anything, tag the current main commit as `film-v1` and push the tag to the remote. Confirm the tag exists on the remote, then delete the frames, engine, main.js, styles.css and GSAP from the branch.
4. Enterprise Software: link to /services/custom-software-development/.
5. Film-only copy: drop it and list it in the final report.
6. Forms: a real form on /consult/ and /contact/ that posts to a configurable endpoint (one constant, Web3Forms or Formspree style), with name, work email, company, message, a honeypot field and a success state. Until the key is given, fall back to mailto and show WhatsApp beside it.
7. New URLs: create /guides/ and 404.html. Add /guides/ to the sitemap and report what the host needs so 404.html is actually served.
- Stylesheet: use a new file name.
- Every "Book a strategy call" CTA links to /consult/, never mailto.
- One stylesheet with one set of tokens for all pages, replacing the two copies.
- Build-time include script so nav and footer live in one partial each. Output stays plain static HTML at the same paths. No framework.
- Inner pages need a working mobile menu below 560px.
- Keep /quality/, /legal/cookies/ and /legal/disclosure/.
