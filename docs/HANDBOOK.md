# Mokshify Platform Handbook

Internal engineering document. Governs everything published on mokshify.io.
The homepage (the film) is LOCKED: no changes to its design, animation,
typography or colours without explicit owner approval.

═══════════════════════════════════════════════════════════
1. DESIGN SYSTEM
═══════════════════════════════════════════════════════════

## Tokens (source of truth: css/pages.css :root, css/styles.css :root)
| Token | Value | Use |
|---|---|---|
| --paper | #F7F2EC | page ground |
| --paper-2 | #F1EAE1 | recessed surfaces, code bg |
| --ink | #25180F | headings, strong text |
| --ink-soft | #5C4A3D | body text |
| --ink-faint | #8A7060 | captions, meta |
| --maroon | #5A1423 | brand primary, links, emphasis |
| --maroon-deep | #3E0D18 | gradient depth |
| --rose | #C9917B | accents, rules, kickers |
| --rose-hi | #E8C4AE | on-maroon text/accents |
| --line | #D9CBBB | borders, dividers |

## Typography
- Playfair Display 400/500 (+italic) — h1/h2, emphasis `<em>` in maroon italic.
- Inter 400/500/600 — body, UI. Body 1rem/1.7; max line length 70ch.
- IBM Plex Mono 400/500 — kickers (.pkicker: 600 .7rem, ls .3em, uppercase,
  rose), labels, bylines (.pmeta), code.
- h1: clamp(2rem,5vw,3.2rem)/1.08, ls -.02em. h2: clamp(1.4rem,2.6vw,1.9rem),
  margin 2.6em 0 .7em. Never introduce new fonts.

## Spacing & grid
- Article measure: .pwrap max-width 820px, padding clamp(28px,6vh,64px) x
  clamp(18px,5vw,32px). No multi-column article layouts.
- Card grids: .grid auto-fill minmax(250px,1fr) gap 16px.
- Rhythm: use em-based margins from the type scale; avoid pixel one-offs.

## Components (all in css/pages.css — reuse, never fork)
- .pnav — sticky editorial nav: brand img (assets/icon-192.png, 32px) + up to
  5 links + .cta pill. Mobile hides non-CTA links (<560px).
- .pkicker / h1 with <em> / .plede — page opening pattern, mandatory.
- .pmeta — article byline: "By Mokshify Engineering · Reviewed by the team ·
  Updated DD Mon YYYY · N min read". Never invent named authors.
- .facts — metric strip (b + i). ONLY verifiable numbers.
- .card — hub link cards: b title, span description, i arrow/date line.
- details/summary — FAQ accordion. Every FAQ shown MUST also appear in the
  page's FAQPage schema, verbatim.
- .timeline — vertical process list (b + span per li).
- .tstack — technology cards. .est — tool forms (radio pills + .est-out).
- .diagram — architecture SVG container. SVG rules: viewBox ~760 wide, font
  IBM Plex Mono 13px, boxes rx=10 fill #F1EAE1/#FDFBF7 stroke #D9CBBB,
  emphasis box fill #5A1423 text #F6E3D4, arrows #C9917B marker-end, ALWAYS
  role="img" + aria-label describing the flow. No other illustration styles;
  never stock art, never AI-generated decorative images.
- .pcta — closing CTA: maroon gradient panel, h2 + p + .btn row.
  Primary .btn = /consult/ or contextual mailto; secondary .btn.ghost =
  WhatsApp / related tool. Every page ends with exactly one .pcta
  (legal pages exempt).
- .pfoot — 4-column footer. Current canonical column set: Services /
  Engineering / Company / Contact (see /contact/ for the reference copy).
  When adding a page class, update the reference footer then propagate.

## Animation & dark mode
- Editorial pages: CSS transitions only, nothing scroll-driven — cinema
  belongs to the homepage. Respect prefers-reduced-motion always.
- Dark mode: NOT implemented. If ever built: paper→#1C1310, ink→#F0E6DA,
  maroon stays, film untouched. Requires owner approval.

═══════════════════════════════════════════════════════════
2. CONTENT GOVERNANCE
═══════════════════════════════════════════════════════════

## URLs
- kebab-case, folder + index.html, ALWAYS trailing slash in links.
- Sections: /services/x/ /industries/x/ /work/x/ /library/x/ /guides/x/
  /tools/x/ /legal/x/. New sections need a hub page first.
- URLs are permanent. Never rename; if unavoidable, server redirect + update
  sitemap.xml, llms.txt, and every inbound link (run scripts/audit-site.mjs).

## Metadata standards (every page)
- <title> "Page Name | Mokshify" ≤60 chars, unique (audit enforces).
- meta description 140–160 chars, unique, no keyword stuffing.
- canonical, og:title/description/type/url/image (default
  /assets/og.jpg 1200×630; case studies use their real screenshot),
  twitter:card summary_large_image, theme-color #F7F2EC.

## Schema standards
- Every page: BreadcrumbList + one primary type — Service+FAQPage (services),
  TechArticle (library/journal/benchmarks), Article (guides, case studies),
  WebPage/CollectionPage/AboutPage/ContactPage (else), WebApplication (tools).
- Reference @id anchors: https://mokshify.io/#org and /#website.
- Dates ISO YYYY-MM-DD; update dateModified when content meaningfully changes.
- Validate: node scripts/validate-seo.mjs + the JSON-parse loop in
  scripts/audit-site.mjs.

## Images
- Files: kebab-case describing content (medico.png, og.jpg). Screenshots of
  client sites: recapture via headless when clients redesign.
- Every <img> has width/height attributes (CLS) and loading="lazy" below the
  fold. Alt text: describe what the image SHOWS ("FinCalix homepage — Built
  for Real People"), never keyword-stuff, empty alt for decorative marks.

## Internal linking rules
- Every new page links: its hub, ≥2 sibling/related pages, ≥1 service or
  case study. Every new article gets linked FROM its hub + ≥1 older page.
- Update on publish: sitemap.xml, /sitemap/ (HTML), llms.txt, feed.xml
  (articles), hub cards. Then run scripts/audit-site.mjs — zero broken links,
  zero orphans is the merge bar.

## Writing guidelines (the Mokshify voice)
- Plain speech, engineering precision, honest limits. Say the disadvantage
  before the reader wonders. "We will tell you when you don't need us."
- Structures: Problem → Architecture → Advantages → Disadvantages →
  Tradeoffs → Technology selection (library); Context → Decision → Why →
  Tradeoffs accepted → Revisit when (ADRs).
- Em-dash sparingly; sentence case headings except the film's mono labels.
- FORBIDDEN, always: invented testimonials, statistics, certifications,
  awards, partnerships, client claims, team names, "most popular" without
  data. Every number verifiable on-site or in a live product.

## Publishing checklist (run for every new/changed page)
1. Purpose stated in one sentence? (If not — don't publish.)
2. Metadata block complete and unique.
3. Schema present + parses.
4. Opening pattern (.pkicker/h1/.plede) + .pcta + related links.
5. FAQ where questions genuinely exist (visible + schema, matching).
6. Images sized, lazy, alt-texted.
7. sitemap.xml + /sitemap/ + llms.txt (+ feed.xml if article) updated.
8. scripts/audit-site.mjs → 0 broken, 0 orphans, no new dup metadata.
9. Read aloud once. If it sounds like marketing, rewrite it as engineering.

═══════════════════════════════════════════════════════════
3. TEMPLATES
═══════════════════════════════════════════════════════════

## Case study (/work/<slug>/) — required sections
Kicker (Case study · Industry · live-url) → H1 with em → .pmeta →
Executive summary (.plede) → .facts (real metrics only) → Screenshot
figure → The problem → Discovery/Research → Architecture & stack (link
/architecture/ + ADRs) → Design decisions → Security (if relevant) →
Deployment → Performance/Results (numbers already public or client-approved)
→ Lessons learned → Future work (dated honestly) → .pcta → More case studies.

## Library article (/library/<slug>/)
Kicker (Library · Topic) → H1 → .pmeta → The problem → The architecture
(+.diagram with aria-label) → Advantages & disadvantages → Tradeoffs →
Technology selection (link ADRs) → Related. 800–1500 words. Add to: hub
card ("Recently published", newest first), feed.xml, sitemap files, llms.txt.

## Journal entry (/journal/ #NNN)
Numbered anchor, .pmeta with date, 300–700 words, at least one real number
or real mistake. Types: build notes, postmortems (blameless, what changed),
performance reports (measured), release notes. Add item to feed.xml.

## Blog taxonomy (future /blog/ if split from journal)
Categories = library topics + journal types. Same URL rules; journal
anchors must then 301 into articles — prefer keeping /journal/ as the blog.

═══════════════════════════════════════════════════════════
4. QUALITY GATE (every page, every change)
═══════════════════════════════════════════════════════════
Useful · Truthful · Original · Technically accurate · Well structured ·
SEO complete · AI searchable (llms.txt + noscript parity where relevant) ·
Accessible (semantics, keyboard, contrast, reduced-motion) · Fast (no new
JS unless a tool needs it; images optimized) · Mobile-first checked.
Enforcement: publishing checklist above + scripts/audit-site.mjs in every
review. Quality over quantity is policy, not preference.