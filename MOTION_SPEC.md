# Motion, logo and answers — owner brief (saved verbatim, 23 Nov 2026)

The redesign run is complete. Now do three things on the same branch,
redesign/enterprise: add a slow-motion layer, install the logo, and apply my
answers. Do not change layout, copy, colours, URLs or the portfolio beyond
what is written here. Save this message as MOTION_SPEC.md and commit it first.
Work without asking me questions. Record judgement calls in DECISIONS.md.
Commit after each numbered part.

RULES FOR ALL MOTION
- Slow, calm and smooth. Nothing bounces, spins, flashes or loops fast.
- Use it in a few key places only. Body text, tables, forms, tools and
  long-form articles stay still.
- All motion is off when prefers-reduced-motion is set. Everything must be
  fully visible and usable without JavaScript.
- No layout shift. Animate only transform and opacity.
- Easing for everything: cubic-bezier(0.16, 1, 0.3, 1).

1. SLOW-MOTION HERO VIDEO (home only)
- Add a background video slot behind the home hero, under the oxblood grade.
- Sources: /assets/hero/hero.webm and /assets/hero/hero.mp4, poster
  /assets/hero/hero-poster.webp. Muted, loop, playsinline, preload="metadata",
  aria-hidden. Play at 0.6 speed.
- Load the video only at 900px wide and above, and only when the connection is
  not Save-Data or 2g/3g. Otherwise show the poster.
- The files do not exist yet. Until they do, show the current hero still with a
  25-second slow zoom from scale 1 to 1.08. Mark this TODO(asset).
- Add a small pause/play button in the hero corner, keyboard usable.
- Add the video host rules to the security policy in vercel.json and _headers
  if the policy needs them.

2. SLOW ZOOM ON IMAGES
- Work-row screenshots, case-study plates and section plates start at scale
  1.06 and settle to 1 over 1.8 seconds when they enter the viewport. Once only.
- Clip inside their frame so nothing overflows.

3. SMOOTH SCROLLING (desktop only)
- Add Lenis as the single allowed library, self-hosted, loaded with defer,
  only on pointer:fine devices at 900px and above. lerp 0.08.
- Anchor links, the mega menu, the mobile menu, the industry tabs and keyboard
  scrolling must still work. Native scrolling stays on touch devices.
- The JS budget rises to 30 KB before compression.

4. SLOW REVEALS
- Section headlines reveal line by line with a clip mask, 900ms, 110ms stagger.
- Section content fades and rises 24px over 900ms. Once only.
- The brass spine draws at scroll speed, as already built.
- Home hero only: the headline scales from 1 to 0.96 and fades slightly as the
  user scrolls past it.

5. COUNT-UP AND PIPELINE
- Metric figures count up over 1.6 seconds when they enter view. The final
  value stays in the HTML.
- On the pipeline, the line draws left to right over 2 seconds and each step
  fades in as the line reaches it.

6. HOVER
- Work rows: the screenshot zooms to 1.03 over 700ms.
- Cards: 2px lift over 400ms.

7. LOGO
- I have attached the Mokshify logo (M mark, MOKSHIFY wordmark, tagline
  "Digital solutions. Limitless impact."). Save the original to
  assets/brand/mokshify-logo-original.png.
- The file has a light cream background. Make a transparent-background copy.
  Check the edges at 2x zoom. If the cut-out is rough, keep the original and
  report it.
- Crop the M mark alone to a square, transparent, and export it at 512, 192,
  180, 32 and 16 pixels for the favicon, apple-touch-icon and web manifest.
- On LIGHT surfaces (scrolled nav, paper pages): use the full colour logo,
  mark and wordmark, without the tagline, at 36px height.
- On DARK oxblood surfaces (hero nav, mega menu, mobile menu, footer): the
  maroon and teal wordmark is unreadable there. Use the M mark only, followed
  by "Mokshify" set in the site's headline font in the paper colour.
- Footer only: show the tagline under the logo in the mono label style.
- Serve WebP with a PNG fallback, with width and height set, so there is no
  layout shift. The header logo must stay under 20 KB.
- Update the Open Graph image and the Organization JSON-LD logo URL.
- Add the logo files and usage rules to the /brand/ page.
- Do not redraw, recolour or alter the logo artwork.

8. MY ANSWERS (apply each one that is filled in; leave the TODO where blank)
- Somallamma Temple live URL: 
- Qflow release status to show: 
- FinCalix App Store link (if live on iPhone): 
- Next Edge Realty, year built: 
- AJ Agritech, year built: 
- Form endpoint and key: 
For any live URL given here, capture screenshots at 1440 and 390 wide and
replace the placeholder plates.

9. PUSH
- Run git remote -v and report which GitHub account and repo the remote uses,
  and which account the machine is signed in as.
- Try once to push the film-v1 tag and the redesign/enterprise branch.
- If it still returns 403, do not retry and do not delete any film files.
  Tell me the exact account that needs write access.
- Do not merge to main and do not deploy.

CHECKS (run and report)
- Build passes. Crawl: every route returns 200, 0 broken internal links.
- Lighthouse on / and one case study: performance 90 or higher on desktop,
  CLS under 0.05. Mobile home performance 90 or higher.
- With reduced motion on: no animation, no video, all content visible.
- With JavaScript off: all content visible.
- 375px: no video request, no horizontal scroll, Call and WhatsApp bar works.
- Keyboard tests still pass, including the hero pause button.
- Screenshots saved to review/motion/ (home hero and one work row,
  mid-animation and at rest) and review/logo/ (dark hero header, scrolled
  light header, mobile menu, footer).
- Append "Motion", "Logo" and "Answers applied" sections to
  REDESIGN_REPORT.md, with results and anything that still needs me.

(The logo was attached to the message; the original is saved at assets/brand/mokshify-logo-original.png.)
