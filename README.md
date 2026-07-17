# Mokshify — a film you scroll

One continuous cinematic experience driven entirely by scroll. Chapters 1–4
play **one Gemini Flow master shot** — 914 extracted 4K frames in `frames/1/`
scrubbed like an Apple product film (pencil → studio → engineering → street).
Chapters 5–8 (devices, flagships, connected India, finale) are built in
DOM/SVG and continue underneath on the same timeline.

**After changing frames** (add/replace/remove sequences), run both:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\sync-frames.ps1   # validate + master manifest
npm run optimize                                                   # build web derivatives
```

`optimize` converts the 4K masters to 1920px WebP (~59 KB/frame vs ~2.5 MB —
this is what makes scroll-speed scrubbing smooth). The engine automatically
prefers `frames/<n>/web/` when it exists and falls back to the masters.

## Run

```sh
python -m http.server 8123     # or any static server
# open http://localhost:8123
```

## Develop

```sh
npm install
npm run build        # bundles src/*.ts → js/cinema.js (esbuild + GSAP)
npm run typecheck    # tsc --noEmit
```

## Architecture

| File | Role |
|---|---|
| `frames/1/` | The master shot: 914 × 3840×2160 PNG — the source of truth |
| `scripts/sync-frames.ps1` | Folder control: validates sequences, writes manifests |
| `src/FrameLoader.ts` | Auto-discovers every frame (manifest or HEAD-probe binary search, nothing hardcoded) |
| `src/ImageCache.ts` | Budgeted ImageBitmap store — preloads near frames, lazy-loads distant, evicts by playhead distance |
| `src/FrameSequence.ts` | progress × totalFrames → smoothed playhead, cover-fit canvas paint, neighbour cross-blend, no flicker |
| `src/ScrollController.ts` | GSAP ScrollTrigger bindings — scroll IS the timeline, no autoplay |
| `src/SceneManager.ts` | Mounts the four shots, shared rAF loop, ticks only near-playhead scenes |
| `js/main.js` | Site engine: chapter table (`window.MOKSHIFY.CH`), typography overlays, chapters 5–8, magnetic buttons |
| `css/styles.css` | Design system: warm white, maroon `#5A1423`, rose gold; cinema scrims |
| `index.html` | Eight scenes; 1–4 host `.cinema[data-scene]` frame mounts |

## The chapters

The master shot (`frames/1`, mounted with `data-chapters="1-4"`) spans 1–4:

1. **The First Line** — a pencil meets handmade paper
2. **The Studio** — through the glass doors of Mokshify
3. **Engineering** — blueprints extrude into interfaces
4. **Into the World** — the product on a living street
5. **Alive** — MacBook, phone, tablet wake up
6. **Case Studies** — FinCalix · MedicoDiagnostics · Terravion · Saheli, each with problem/solution, stack, outcome, live metrics and an interactive preview
7. **The Pipeline** — Idea → Research → UX → Architecture → Engineering → Cloud → Launch → Scale, drawn as one continuous ink line
8. **Engagement** — MVP Sprint · Product Engineering · Dedicated Team · AI Transformation
9. **Trust** — an animated architecture diagram: React/Next.js/Flutter → Node.js/Python/AI → AWS/Azure/Docker/Kubernetes, lines drawn on scroll with traveling packets
10. **Contact** — "Let's build what competitors can't." — strategy-call CTA, brief form, WhatsApp, Hyderabad, 24-hour response

## The mobile film (≤1023px)

Phones and portrait tablets get a dedicated vertical cinema (not a resize):
glass hamburger + fullscreen menu, sticky call/CTA bar (hides while reading
down, returns on scroll-up), sequential device stack in ch5, a 7-tier vertical
architecture in ch9, and safe-area/notch support. Desktop layout and timing
are untouched — everything lives behind `max-width:1023px` media queries and
the `MOB` flag in `js/main.js` (the two must stay in sync).

QA screenshots with true device emulation (headless `--screenshot` mis-sizes
mobile viewports under Windows display scaling):

```sh
node scripts/mobile-shots.mjs 390x844 p390     # SHOT_DIR / ONLY env to filter
```

## The authority site (Phase 2)

Beyond the film, 12 static editorial pages share `css/pages.css`:
`/services/` (+ AI, SaaS, mobile, cloud flagships with Service + FAQ schema),
`/work/` (+ four real case studies with Article schema and live screenshots),
`/process/` (HowTo schema of the eight-stage pipeline) and `/faq/` (FAQPage).
All are interlinked via shared nav/footer and listed in `sitemap.xml`.
`js/analytics.js` pre-wires conversion events (call/email/WhatsApp/CTA/scroll)
into `dataLayer` — inert until a real GTM/GA4 tag is added.

## SEO / discovery layer

`robots.txt` (AI crawlers explicitly welcomed) → `sitemap.xml` + `image-sitemap.xml`;
`llms.txt` for AI assistants; `site.webmanifest` + icons; security headers in
`_headers` (Netlify/Cloudflare) and `vercel.json` (Vercel). The page head carries
canonical/hreflang/geo/OG/Twitter metadata and a 7-node JSON-LD graph
(Organization → ProfessionalService → WebSite → WebPage + breadcrumbs, services,
portfolio). The `<noscript>` static article mirrors the film for non-JS crawlers —
keep it in sync when services/clients change.

```sh
node scripts/seo-assets.mjs     # regenerate assets/og.jpg + PWA icons
node scripts/validate-seo.mjs   # JSON-LD parse + live-page smoke test
```

## Debug / deep links

- `#p=0.42` — seek the film to 42% (scrolls there)
- `?f=0.42` — freeze-frame at 42% without scrolling (screenshot QA; drives both engines)

## Performance notes

- 4K sources are decode-downscaled to the viewport (≤2048px desktop, ≤1280px mobile), so a decoded frame costs ~9 MB instead of ~33 MB; the cache keeps ≈36 (desktop) / 20 (mobile) alive
- Six-way fetch concurrency gate; direction-of-travel biased preloading
- Canvas paints only when the displayed frame/blend actually changes
- `prefers-reduced-motion` collapses inertia; scrubbing stays user-controlled either way
