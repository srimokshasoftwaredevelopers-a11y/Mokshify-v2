# Mokshify — mokshify.io

Plain static HTML, assembled from partials at build time. No framework.

```sh
npm install
npm run build     # node scripts/build.mjs — stamps partials/*.html into every page,
                  # css/src/* → css/site.css, js/site.js → js/site.min.js
npm run check     # fails if any page is out of date with its partials
npm run serve     # node scripts/serve.mjs — local server on :8123 (redirects + 404.html)
npm run verify    # crawl, orphans, JSON-LD, contrast, weights, keyboard, motion
npm run audit     # links, orphans, metadata, schema
npm run logo      # regenerate logo cut-outs and icons from assets/brand/mokshify-logo-original.png
```

| Path | Role |
|---|---|
| `partials/` | Shared shell: head, nav, mega menu, footer, contact bar, CTA band, enquiry form |
| `css/src/` | Tokens, base, components, templates → concatenated into `css/site.css` |
| `js/site.js` | All shared behaviour (nav, reveals, tabs, form, motion); pages load the minified build |
| `js/vendor/` | Lenis smooth scroll, self-hosted, loaded only on desktop pointers |
| `scripts/redesign/projects.mjs` | Single source for work rows and the generated case studies |
| `assets/hero/` | Drop `hero.webm`, `hero.mp4`, `hero-poster.webp` here and the home hero video turns on at the next build |

Design system: tokens in `css/src/1-tokens.css`, components documented on `/brand/`.
Decisions are in `DECISIONS.md`; the redesign record is `REDESIGN_REPORT.md`.

## SEO / discovery

`robots.txt` → `sitemap.xml` + `image-sitemap.xml`; `llms.txt` for AI assistants;
`site.webmanifest` + icons; security headers in `_headers` (Netlify/Cloudflare) and
`vercel.json` (Vercel). Every page carries canonical/OG/Twitter metadata and JSON-LD.

## The retired scroll film

Until November 2026 the homepage was a scroll-scrubbed film (914 WebP frames, a
TypeScript + GSAP engine). It was removed from this branch on 23 Nov 2026. The last
version that contains it is the git tag `film-v1`:

```sh
git checkout film-v1
```
