/* MOKSHIFY — the projects, in one place.
   Every fact here is either from the owner's brief (REDESIGN_SPEC.md, "Projects to show"),
   already published on mokshify.io, or visible on the project's live site on 23 Nov 2026.
   Anything unconfirmed carries a TODO(confirm) comment and is listed in the report.

   node scripts/redesign/projects.mjs
     → partials/work-<slug>.html   (a work row, reused on home, /work/, industries, services)
     → work/<slug>/index.html      (case studies for the four new projects only) */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TODAY = "2026-11-23";

export const PROJECTS = [
  {
    slug: "next-edge-realty", name: "Next Edge Realty", industry: "Real estate", kind: "Client website",
    url: "https://nextedgerealty.com/", host: "nextedgerealty.com", shot: "next-edge-realty",
    // captures cropped above every availability figure (23 Nov 2026): home hero 1040×650 at 1440, phone top 500 px
    dims: { desk: [1200, 750], m: [600, 1000] },
    line: "A plotted-development sales site: about 200 pages, and a live plot map on satellite imagery.",
    facts: [["~200", "pages"], ["677", "plots on the live map"]],
    page: {
      title: "Next Edge Realty — Real Estate Website | Mokshify",
      desc: "Case study: a ~200-page sales website for Next Edge Realty, a West Hyderabad plot developer — live plot map on satellite imagery, lead CRM and admin dashboard.",
      h1: ["Next Edge Realty —", "every plot, on the map."],
      plain: "A sales website for a plotted-development company in West Hyderabad, where buyers can see every project, plot and locality — and which plots are still free.",
      problem: ["Open plots are bought on trust. Before a buyer visits a layout they want three answers: where it is, which plots are still available, and what approvals it has.",
        "A brochure cannot answer the second question, because availability changes every week."],
      built: [["Sales website", "About 200 pages covering projects, plots, localities and guides."],
        ["Live plot map", "An interactive 2D and 3D map on satellite imagery showing every plot, with live availability."],
        ["Lead CRM", "Enquiries collected into a lead CRM, with an admin dashboard behind the site."],
        ["Journal and guides", "A journal and buyer guides, written for search."],
        ["Search", "Search-optimised pages, structure and metadata."],
        ["Languages", "English, Telugu and Hindi."]],
      result: ["The site is live at <a href=\"https://nextedgerealty.com/\" rel=\"noopener\">nextedgerealty.com</a>. On 23 November 2026 its plot map showed 677 plots across two layouts."],
      // the plot-map recording near the top, a section on the map, and a three-image gallery.
      // Everything below is what nextedgerealty.com shows publicly on 23 Nov 2026; no prices, counts of
      // plots for sale, approval or registration numbers, or names. Captures cropped or redacted to match.
      film: "ner",
      map: {
        title: "The plot map",
        intro: ["Each layout has its own map page. The plot layout, drawn from the approved layout sheet, sits over satellite imagery, with the roads, parks, clubhouse and social-infrastructure sites labelled. As the live site shows on 23 Nov 2026:"],
        rows: [["Views", "Flat 2D or a tilted 3D view; the layout as a drawing, on satellite imagery, or both"],
          ["Find a plot", "Search by plot number, filter by size (under 200, 200–300 or 300+ sq yd) or show only available plots. The filters apply to the map and the list together"],
          ["Plot list", "Every plot listed beside the map with its size and status: tap a plot on the map or pick it from the list"],
          ["Status", "A colour legend: available, reserved, sold out, mortgage, under review"],
          ["Controls", "Zoom, north-up, fit to the layout, and a share link"],
          ["Layouts", "Sanctuary at Julkal and Raghunath County at Shankarpally, side by side on the live-plots page"]],
        note: ["The recording above is the live map in its 3D satellite view. In it, every plot is drawn in one colour and the plot numbers are hidden, so no plot&rsquo;s status can be read; on the live site, colour shows each plot&rsquo;s status."],
      },
      gallery: [
        ["/assets/sites/next-edge-realty.webp", "Next Edge Realty homepage hero: Land you can verify before you visit", "Homepage, 1440 px — nextedgerealty.com", "https://nextedgerealty.com/"],
        ["/assets/sites/next-edge-realty-project.webp", "The Sanctuary project page on nextedgerealty.com", "Project page: Sanctuary, Julkal", "https://nextedgerealty.com/projects/sanctuary"],
        ["/assets/sites/next-edge-realty-map.webp", "The Sanctuary plot map in its 3D satellite view, with every plot in one colour", "Plot map, 3D satellite view (status colours and plot numbers hidden). Imagery &copy; 2026 Google", "https://nextedgerealty.com/projects/sanctuary/map"]],
      stack: [["Framework", "Next.js (visible in the live site's response headers)"], ["Delivery", "Served through Cloudflare"],
        ["Map", "Satellite imagery with a plot overlay and live availability"], ["Admin", "Lead CRM and admin dashboard"]],
      todo: ["TODO(proof): enquiry or traffic numbers, once the client approves publishing them", "TODO(confirm): database and hosting, for the stack table", "TODO(confirm): year built"],
    },
  },
  {
    slug: "terravion-properties", name: "Terravion Properties", industry: "Real estate", kind: "Client website",
    url: "https://terravionproperties.com/", host: "terravionproperties.com", shot: "terravion",
    also: [{ url: "https://terravionproperties.in/", host: "terravionproperties.in" }],   // the second Terravion site (23 Nov 2026)
    line: "HMDA-approved plots in the Shankarpally growth corridor, discovered and booked online.",
    facts: [["HMDA", "approved projects"], ["Online", "discovery to booking"]],
  },
  {
    slug: "medico-diagnostics", name: "Medico Diagnostics", industry: "Healthcare", kind: "Client website",
    url: "https://medicodiagnostics.in/", host: "medicodiagnostics.in", shot: "medico",
    line: "A diagnostics website where patients find a test, see the price, book a home collection and download reports.",
    facts: [["3,291+", "tests published"], ["4–6h", "reporting"]],
  },
  {
    slug: "aj-agritech", name: "AJ Agritech", industry: "Agriculture", kind: "Client website",
    url: "https://ajagritech.com/", host: "ajagritech.com", shot: "aj-agritech",
    line: "A Telugu-first brand and product catalogue for an agri-inputs company in Andhra Pradesh and Telangana.",
    facts: [["3", "languages"], ["3", "product ranges"]],
    page: {
      title: "AJ Agritech — Agri-Inputs Website | Mokshify",
      desc: "Case study: a Telugu-first brand and product catalogue website for AJ Agritech, an agri-inputs company in Andhra Pradesh and Telangana, with an admin dashboard.",
      h1: ["AJ Agritech —", "a catalogue farmers can read."],
      plain: "A brand and product website for an agri-inputs company, in Telugu first, so farmers and dealers can find the right product for their crop.",
      problem: ["An agri-inputs company sells to farmers and dealers across Andhra Pradesh and Telangana. Most of them read Telugu first, and most of them are on a phone.",
        "They need to know which product suits which crop and stage, and how to reach the company — not a brochure in English."],
      built: [["Brand and catalogue", "A brand and product catalogue site for an agri-inputs company serving Andhra Pradesh and Telangana."],
        ["Languages", "Telugu by default, with Hindi and English."],
        ["Catalogue", "Products grouped by range — growth promoters, flowering boosters and micronutrients — and by crop."],
        ["Admin dashboard", "The company manages its own products from an admin dashboard."],
        ["Enquiries", "An enquiry form that delivers straight to the company's mailbox."],
        ["Dealers and farmers", "Pages for dealer enquiries, crop tips and a farmer helpline."]],
      result: ["The site is live at <a href=\"https://ajagritech.com/\" rel=\"noopener\">ajagritech.com</a>, in three languages."],
      stack: [["Framework", "Next.js (visible in the live site's response headers)"], ["Hosting", "Vercel"],
        ["Admin", "Product management dashboard"], ["Enquiries", "Form delivered to the client's mailbox"]],
      todo: ["TODO(proof): enquiry numbers, once the client approves publishing them", "TODO(confirm): year built"],
    },
  },
  {
    slug: "somallamma-temple", name: "Somallamma Temple", industry: "Community", kind: "Client website",
    // live site and what it shows: from the owner (address) and srisomaalammatalli.in itself, 23 Nov 2026
    url: "https://www.srisomaalammatalli.in/", host: "srisomaalammatalli.in", shot: "somallamma",
    line: "The website of Srisomaalammatalli Temple, Mungandapalem — poojas, events, gallery and donations, handed over to the temple.",
    facts: [],
    page: {
      title: "Somallamma Temple Website | Mokshify",
      desc: "Case study: the website of Srisomaalammatalli Temple in Mungandapalem, Andhra Pradesh — poojas, events, gallery, videos and donations — built by Mokshify and handed over to the temple.",
      h1: ["Somallamma Temple —", "a website, handed over."],
      plain: "The website of Srisomaalammatalli Temple in Mungandapalem, East Godavari, completed and handed over to the temple.",
      problem: ["Temples and trusts need a simple, dignified place online where devotees can find darshan timings, poojas and events, and give to the temple. <!-- TODO(confirm): what the temple needed, in the temple's words -->"],
      built: [
        ["Temple website", "Home, poojas, events, gallery, videos and contact, in English with Telugu, as published at srisomaalammatalli.in."],
        ["Donations", "A donate page, reachable from every screen."],
        ["Temple's own updates", "An admin login so the temple keeps its own timings, events and gallery current."],
      ],
      result: ['The website is live at <a href="https://www.srisomaalammatalli.in/" rel="noopener">srisomaalammatalli.in</a> and has been handed over to the temple.'],
      stack: [],
      todo: ["TODO(confirm): what the temple needed, in its own words, and the year it launched"],
    },
  },
  {
    slug: "fincalix", name: "FinCalix", industry: "Finance", kind: "Our product",
    url: "https://fincalix.com/", host: "fincalix.com", shot: "fincalix",
    line: "Indian financial calculators on the web and Android — free, offline in the app, in six Indian languages.",
    facts: [["47", "calculators"], ["6", "Indian languages"]],
  },
  {
    slug: "qflow", name: "Qflow", industry: "Product", kind: "Our product",
    url: "https://qflow.in/", host: "qflow.in", shot: "qflow",
    line: "Queue and token management for any business with a queue — salons, clinics, temples, banks and offices.",
    facts: [["3", "portals: business, customer, admin"]],
    page: {
      title: "Qflow — Queue and Token Management | Mokshify",
      desc: "Case study: Qflow, our queue and token product for salons, clinics, temples, banks and offices — separate portals for businesses, customers and admins.",
      h1: ["Qflow —", "skip the wait."],
      plain: "A queue and token system for any business with a queue: customers take a token on their phone, wait anywhere, and walk in when it is their turn.",
      problem: ["Salons, clinics, hospitals, restaurants, temples, banks and government offices all share one problem: people standing in a line, unsure how long it will take.",
        "Paper tokens tell nobody when their turn is coming."],
      built: [["For customers", "Take a token from the phone, wait anywhere, and get told when it is your turn."],
        ["For businesses", "A business portal to register the shop and run the queue."],
        ["For the platform", "An admin portal across every business on Qflow."],
        ["Access", "Runs in the browser at app.qflow.in — nothing to install."],
        ["Languages", "English and Telugu."]],
      result: ["As qflow.in states on 23 November 2026: live in the browser, an Android app coming to Google Play, available in Andhra Pradesh and Telangana with Guntur first, and a 60-day free trial for businesses. <!-- TODO(confirm): release status -->",
        "Qflow is a product of Sri Moksha Software Developers."],
      stack: [],
      todo: ["TODO(confirm): release status", "TODO(confirm): stack, for the stack table", "TODO(proof): usage numbers, if any are to be published"],
    },
  },
];
const NEXT = ["next-edge-realty", "terravion-properties", "medico-diagnostics", "aj-agritech", "somallamma-temple", "fincalix", "qflow", "mokshify-website"];
export const bySlug = Object.fromEntries(PROJECTS.map(p => [p.slug, p]));

const esc = s => s.replace(/&(?!(?:[a-z]+|#\d+);)/g, "&amp;");
const ind = (s, n) => s.split("\n").map(l => (l ? " ".repeat(n) + l : l)).join("\n");

/* a browser frame with the real capture; phones get the phone capture */
export function frame(p, { eager = false } = {}) {
  if (!p.shot) return `<div class="frame"><div class="frame-bar"><i></i><i></i><i></i><span>${p.host}</span></div><div class="frame-view plate todo"><span>Screenshot to follow</span></div></div>`;
  const lazy = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  const [dw, dh] = p.dims?.desk ?? [1200, 2000], [mw, mh] = p.dims?.m ?? [600, 2597];   // redacted captures are cropped shorter
  return `<div class="frame"><div class="frame-bar"><i></i><i></i><i></i><span>${p.host}</span></div><div class="frame-view"><picture><source media="(max-width: 40rem)" srcset="/assets/sites/${p.shot}-m.webp" width="${mw}" height="${mh}"><img src="/assets/sites/${p.shot}.webp" alt="${p.name} homepage, captured from the live site" width="${dw}" height="${dh}" ${lazy} decoding="async"></picture></div></div>`;
}
const factsHtml = p => p.facts.length ? `<ul class="facts">${p.facts.map(([b, i]) => `<li><b>${b}</b><i>${i}</i></li>`).join("")}</ul>` : "";

export function workRow(p) {
  // a project may have more than one live address (also), and a row may point at another project's case study (caseSlug)
  const live = [...(p.url ? [{ url: p.url, host: p.host }] : []), ...(p.also ?? [])].map(s => `<a href="${s.url}" rel="noopener">${s.host} ↗</a>`).join(" ");
  const cs = p.caseSlug ?? p.slug;
  return `<article class="work-row">
  <a class="work-shot" href="/work/${cs}/" tabindex="-1" aria-hidden="true">${frame(p)}</a>
  <div class="work-text">
    <p class="label">${p.industry} &middot; ${p.kind}</p>
    <h3><a href="/work/${cs}/">${p.name}</a></h3>
    <p>${esc(p.line)}</p>
    ${factsHtml(p)}
    <p class="work-links"><a href="/work/${cs}/">Read the case study</a>${live ? " " + live : ""}</p>
  </div>
</article>`;
}

/* a screen recording with its own play/pause button. preload="none": nothing is fetched until it plays,
   and site.js only starts it on its own for wide screens, decent connections and no reduced motion */
export function filmFigure(f) {
  return `<figure class="film" data-film>
  <div class="film-view">
    <video muted loop playsinline preload="none" poster="${f.poster}" width="1920" height="1080" aria-label="${f.label}">
      <source src="${f.webm}" type="video/webm">
      <source src="${f.mp4}" type="video/mp4">
    </video>
    <button class="film-btn" type="button" aria-pressed="false"><span class="film-icon" aria-hidden="true"></span><span class="sr">Play the recording</span></button>
  </div>
  <figcaption><span class="film-cap">${f.caption}</span> ${f.note}</figcaption>
</figure>`;
}
const filmSection = f => `<section class="section film-sec">
  <div class="wrap">
    <div class="section-body wide">
      <!-- include:${f.partial} -->
      <!-- /include:${f.partial} -->
    </div>
  </div>
</section>`;

/* the Next Edge plot-map recording (23 Nov 2026): used by the case study, the home hero and /industries/real-estate/ */
export const NER_FILM = {
  webm: "/assets/hero/hero.webm", mp4: "/assets/hero/hero.mp4", poster: "/assets/hero/hero-poster.webp",
  caption: "Live plot map, Next Edge Realty",
  label: "Screen recording of the Next Edge Realty plot map in its 3D satellite view: the camera turns slowly across the Sanctuary layout, then moves in toward the plots.",
  note: "The 3D satellite view of the Sanctuary layout, recorded from nextedgerealty.com on 23 Nov 2026. Every plot is drawn in one colour and plot numbers are hidden, so no plot&rsquo;s status can be read here. Imagery &copy; 2026 Google.",
  desc: "The live plot map Mokshify built for Next Edge Realty, in its 3D satellite view: a slow turn across the Sanctuary layout and a move in toward the plots. Plot status colours and numbers are hidden in the recording. Imagery © 2026 Google.",
  date: "2026-11-23", duration: "PT11S",
};
NER_FILM.partial = "film-ner";            // written to partials/, so every page that shows it gets the same markup
const FILMS = { ner: NER_FILM };

function page(p) {
  const P = p.page, url = `https://mokshify.io/work/${p.slug}/`;
  const F = P.film ? FILMS[P.film] : null;   // a film by name (the recordings are defined below the project list)
  const image = p.shot ? `https://mokshify.io/assets/sites/${p.shot}-plate.webp` : "https://mokshify.io/assets/og.jpg";
  const nextSlug = NEXT[(NEXT.indexOf(p.slug) + 1) % NEXT.length];
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://mokshify.io/" },
      { "@type": "ListItem", position: 2, name: "Work", item: "https://mokshify.io/work/" },
      { "@type": "ListItem", position: 3, name: p.name, item: url }] },
    { "@type": "Article", headline: P.title.replace(/ \| Mokshify$/, ""), description: P.desc, image,
      author: { "@id": "https://mokshify.io/#org" }, publisher: { "@id": "https://mokshify.io/#org" },
      datePublished: TODAY, dateModified: TODAY, mainEntityOfPage: url, inLanguage: "en-IN",
      about: { "@type": "CreativeWork", name: p.name, ...(p.url ? { url: p.url } : {}) } },
    ...(F ? [{ "@type": "VideoObject", name: F.caption, description: F.desc,
      thumbnailUrl: `https://mokshify.io${F.poster}`, contentUrl: `https://mokshify.io${F.mp4}`,
      uploadDate: F.date, duration: F.duration, isFamilyFriendly: true }] : [])] };
  const hero = p.shot
    ? `<header class="hero plate hero-case">
  <figure class="hero-img"><img src="/assets/sites/${p.shot}-plate.webp" alt="" width="1600" height="1000" fetchpriority="high" decoding="async"></figure>`
    : `<header class="hero dark">`;
  const rows = rs => `<table class="spec">\n  <tbody>\n${rs.map(([a, b]) => `    <tr><th scope="row">${a}</th><td>${esc(b)}</td></tr>`).join("\n")}\n  </tbody>\n</table>`;
  const strip = [["Industry", p.industry], ["Type", p.kind], ["Live at", p.url ? `<a href="${p.url}" rel="noopener">${p.host}</a>` : "Address to follow <!-- TODO(confirm): live URL -->"]];
  const fig = ([src, alt, cap, href]) => `<figure><div class="frame"><div class="frame-bar"><i></i><i></i><i></i><span>${p.host}</span></div><div class="frame-view"><img src="${src}" alt="${alt}" width="1200" height="750" loading="lazy" decoding="async"></div></div><figcaption>${href ? `<a href="${href}" rel="noopener">${cap}</a>` : cap}</figcaption></figure>`;
  const sections = [
    ["The problem", P.problem.map(t => `<p>${esc(t)}</p>`).join("\n")],
    ["What we built", rows(P.built)],
    ...(P.map ? [[P.map.title, P.map.intro.map(t => `<p>${t}</p>`).join("\n") + "\n" + rows(P.map.rows) + "\n" + P.map.note.map(t => `<p class="note">${t}</p>`).join("\n")]] : []),
    ["The result", P.result.map(t => `<p>${t}</p>`).join("\n") + (p.facts.length ? "\n" + factsHtml(p) : "")],
    ["Gallery", P.gallery
      ? `<div class="gallery-three">\n${P.gallery.map(g => "  " + fig(g)).join("\n")}\n</div>`
      : p.shot
      ? `<div class="gallery">\n  <figure>${frame(p)}<figcaption>Desktop, 1440 px — captured from the live site on 23 Nov 2026.</figcaption></figure>\n  <figure><div class="frame phone"><div class="frame-view"><img src="/assets/sites/${p.shot}-m.webp" alt="${p.name} on a phone" width="600" height="2597" loading="lazy" decoding="async"></div></div><figcaption>Phone, 390 px.</figcaption></figure>\n</div>`
      : `<figure class="plate todo"><span>Screenshots to follow once the live address is confirmed</span></figure>`],
    ...(P.stack.length ? [["The stack", rows(P.stack)]] : []),
  ];
  const total = sections.length;
  const body = sections.map(([h, html], i) => `<section class="section">
  <div class="wrap">
    <header class="section-head">
      <p class="label on-spine">${String(i + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</p>
      <h2>${h}</h2>
    </header>
    <div class="section-body">
${ind(html, 6)}
    </div>
  </div>
</section>`).join("\n\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${P.title}</title>
<meta name="description" content="${P.desc}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:title" content="${P.title.replace(/ \| Mokshify$/, "")}">
<meta property="og:description" content="${P.desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<!-- include:head -->
<!-- /include:head -->
<script type="application/ld+json">
${JSON.stringify(ld)}
</script>
</head>
<body class="t-case">
<!-- include:nav -->
<!-- /include:nav -->
<main id="main">
<!-- ${P.todo.join(" · ")} -->
${hero}
  <div class="wrap">
    <p class="pkicker on-spine">Case study &middot; ${p.industry} &middot; ${p.url ? `<a href="${p.url}" rel="noopener">${p.host}</a>` : p.host}</p>
    <h1><span class="ln"><span>${P.h1[0]}</span></span> <span class="ln"><span>${P.h1[1]}</span></span></h1>
    <p class="plain">${esc(P.plain)}</p>
    ${p.url ? `<div class="hero-actions"><a class="btn" href="${p.url}" rel="noopener">Open ${p.host} ↗</a></div>` : ""}
  </div>
</header>

<section class="section strip">
  <div class="wrap">
    <div class="section-body wide">
${ind(rows(strip).replace('class="spec"', 'class="spec strip-table"'), 6)}
    </div>
  </div>
</section>
${F ? "\n" + filmSection(F) + "\n" : ""}
${body}

<!-- include:cta-band -->
<!-- slot -->
<h2>Need something like ${p.name}?</h2>
<p>Tell us what your business needs in one paragraph. An engineer replies within 24 hours.</p>
<!-- /slot -->
<!-- /include:cta-band -->

<section class="section next-case">
  <div class="wrap">
    <header class="section-head">
      <p class="label on-spine">Next case study</p>
    </header>
    <div class="section-body wide">
      <!-- include:work-${nextSlug} -->
      <!-- /include:work-${nextSlug} -->
    </div>
  </div>
</section>
</main>
<!-- include:footer -->
<!-- /include:footer -->
</body>
</html>
`;
}

/* mokshify-website keeps its own page; it still needs a row for "next case study" */
const SELF = { slug: "mokshify-website", name: "This website", industry: "Engineering", kind: "Our product", url: "https://mokshify.io/", host: "mokshify.io", shot: "mokshify-website",
  line: "The site you are reading: static, framework-free, every page checked by script before it ships.", facts: [] };

/* extra cards that share a case study (they are not projects of their own, so they never change
   the "next case study" order): the second Terravion site, linking to /work/terravion-properties/.
   Counts are from terravionproperties.in on 23 Nov 2026. No prices, plot counts or approval numbers. */
const EXTRA_ROWS = [
  { slug: "terravion-in", caseSlug: "terravion-properties", name: "Terravion Properties — terravionproperties.in", industry: "Real estate", kind: "Client website",
    url: "https://terravionproperties.in/", host: "terravionproperties.in", shot: "terravion-in",
    line: "The second Terravion site: a GIS master plan of every plot, location pages, buyer guides, a journal, and site-visit booking.",
    facts: [["13", "location pages"], ["12", "buyer guides"], ["72", "journal articles"]] },
];

mkdirSync(join(ROOT, "partials"), { recursive: true });
for (const p of [...PROJECTS, SELF, ...EXTRA_ROWS]) writeFileSync(join(ROOT, "partials", `work-${p.slug}.html`), workRow(p) + "\n");
for (const f of Object.values(FILMS)) writeFileSync(join(ROOT, "partials", `${f.partial}.html`), filmFigure(f) + "\n");
let made = 0;
for (const p of PROJECTS) {
  if (!p.page) continue;
  const dir = join(ROOT, "work", p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), page(p));
  made++;
}
console.log(`${PROJECTS.length + 1} work rows, ${made} case-study pages${existsSync(join(ROOT, "work", "skillforcehub")) ? " (skillforcehub still on disk)" : ""}`);
