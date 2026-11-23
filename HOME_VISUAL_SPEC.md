The homepage feels empty: the hero is type only and there are no images to
scroll through. Add a visual layer to the home page on redesign/enterprise.
Keep all copy, colours, URLs and existing sections. Save this as
HOME_VISUAL_SPEC.md and commit first. Work without asking questions; log
judgement calls in DECISIONS.md. Do not merge or deploy.

RULES
- Use only real images already in the repo (assets/sites/ client screenshots,
  assets/brand/) plus the optional image slots named below.
- Slow and smooth. Easing cubic-bezier(0.16, 1, 0.3, 1). Animate transform and
  opacity only. No layout shift.
- Everything is static and fully visible with reduced motion or without
  JavaScript. Phones get lighter versions, as stated per item.

1. HERO: LIVING SHOWCASE
- Split the hero on desktop: headline and actions on the left, a showcase on
  the right.
- The showcase is a stack of three real client site screenshots in browser
  frames, overlapping at slight angles with soft shadows. They float slowly
  (8 to 12 second drift, a few pixels) and tilt gently toward the cursor.
- Every 5 seconds the front card slides back and the next comes forward, with
  the client name and industry shown in a mono label beneath. Pause on hover
  and on focus.
- Behind everything, add a very slow moving light: two large blurred radial
  glows in oxblood-700 and a faint brass tint, drifting over 30 seconds.
- If assets/hero/hero.webm or hero-poster.webp exist, they sit behind the
  glow as already built.
- Mobile: one screenshot card under the headline that cross-fades between
  projects. No tilt.

2. SHOWREEL STRIP (new, directly under the hero)
- A full-width row of client screenshots in frames that scrolls sideways
  slowly and continuously, and also moves with the page scroll.
- Each card links to its case study. Pause on hover. Duplicate the set so the
  loop is seamless. Hide the duplicates from screen readers.

3. PINNED WORK STORY (upgrade the work-by-industry section on desktop)
- At 1024px and above, pin the section for the length of the industries.
  The left column lists the industries; as the user scrolls, the active
  industry advances and the large screenshot on the right cross-fades and
  slides to that industry's project, with its name, one line and links.
- The tabs still work by click and keyboard and jump to the matching scroll
  position. Below 1024px keep the current tabs.

4. FULL-BLEED IMAGE BREAKS
- Add two wide image bands between sections, each 70vh, with a slow zoom from
  1.08 to 1 and a 6 percent parallax, an oxblood gradient at the bottom, and
  one large line of existing copy over it.
- Slots: assets/home/break-1.webp and assets/home/break-2.webp. If a file is
  missing, use a large cropped client screenshot with the oxblood grade and
  mark TODO(asset).

5. SECTION DETAILS
- Capability rows: on hover, a small preview image of a related client site
  follows the cursor.
- Pipeline: a brass dot travels along the line as the section scrolls.
- Four ways to begin: cards rise in one after another, 120ms apart.
- CTA band: the slow moving light from the hero, repeated.

6. HEADER LOGO
- The M mark in the header is too small and shows specks. Raise it to 40px
  high, and if the specks remain on the dark header, use a clean flat version
  of the mark in the paper colour for dark surfaces. Keep the colour logo on
  light surfaces.

CHECKS (run and report)
- Build and crawl pass. Keyboard tests pass, including the pinned section and
  the showcase pause.
- Lighthouse on /: performance 90 or higher on desktop and mobile, CLS under
  0.05. Lazy-load everything below the hero. Mobile total image weight on
  first view under 400 KB.
- Reduced motion and JavaScript-off: all content visible, nothing moving.
- 375px: no horizontal scroll, Call and WhatsApp bar still works.
- Screenshots of every new section at 375 and 1440 into review/home-visual/,
  plus three frames of the hero showcase at different moments.
- Append a "Home visuals" section to REDESIGN_REPORT.md.
