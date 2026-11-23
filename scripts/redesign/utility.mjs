/* One-off: the /guides/ hub and 404.html, in the shape of the other pages. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
const page = ({ title, desc, url, body, ld, bodyClass, robots = "index, follow, max-image-preview:large" }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
${url ? `<link rel="canonical" href="${url}">\n` : ""}<meta name="robots" content="${robots}">
<meta property="og:title" content="${title.replace(/ \| Mokshify$/, "")}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
${url ? `<meta property="og:url" content="${url}">\n` : ""}<meta property="og:image" content="https://mokshify.io/assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<!-- include:head -->
<!-- /include:head -->
${ld ? `<script type="application/ld+json">\n${JSON.stringify(ld)}\n</script>\n` : ""}</head>
<body class="${bodyClass}">
<!-- include:nav -->
<!-- /include:nav -->
<main id="main">
${body}
</main>
<!-- include:footer -->
<!-- /include:footer -->
</body>
</html>
`;
const GUIDES = ["choose-software-company", "why-software-projects-fail", "validate-mvp", "software-cost", "cloud-migration-checklist", "ai-readiness"];
const rows = GUIDES.map(g => {
  const s = readFileSync(`guides/${g}/index.html`, "utf8");
  const t = /<title>([^<]*)<\/title>/.exec(s)[1].replace(/\s*\|\s*Mokshify.*$/, "");
  const d = /name="description" content="([^"]*)"/.exec(s)[1];
  const read = (/(\d+)\s*min read/.exec(s) || [])[1];
  return `        <a class="card" href="/guides/${g}/"><b>${t}</b><span>${d}</span>${read ? `<i>${read} min read</i>` : ""}</a>`;
}).join("\n");
const url = "https://mokshify.io/guides/";
if (!existsSync("guides/index.html")) writeFileSync("guides/index.html", page({
  title: "Guides for Planning Software Projects | Mokshify", url, bodyClass: "t-hub",
  desc: "Six free guides for anyone planning software: choosing a company, why projects fail, validating an MVP, what software costs, cloud migration and AI readiness.",
  ld: { "@context": "https://schema.org", "@graph": [
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://mokshify.io/" }, { "@type": "ListItem", position: 2, name: "Guides", item: url }] },
    { "@type": "CollectionPage", "@id": url + "#page", url, name: "Guides", description: "Free guides for planning a software project.", isPartOf: { "@id": "https://mokshify.io/#website" }, about: { "@id": "https://mokshify.io/#org" }, inLanguage: "en-IN" }] },
  body: `<header class="hero dark">
  <div class="wrap">
    <p class="pkicker on-spine">Engineering &middot; Guides</p>
    <h1><span class="ln"><span>Plan it before</span></span> <span class="ln"><span>you pay for it.</span></span></h1>
    <p class="plain">Six free guides for business owners planning a website, app or software project. No sign-up needed.</p>
  </div>
</header>

<section class="section">
  <div class="wrap">
    <header class="section-head">
      <p class="label on-spine">00 / 00 &middot; Guides</p>
      <h2>Every guide</h2>
    </header>
    <div class="section-body wide">
      <div class="grid">
${rows}
      </div>
      <p>Prefer checklists? The same thinking, condensed, is on <a href="/resources/">the resources page</a>.</p>
    </div>
  </div>
</section>

<!-- include:cta-band -->
<!-- slot -->
<h2>Rather talk it through?</h2>
<p>Send one paragraph about what you want to build. An engineer replies within 24 hours.</p>
<!-- /slot -->
<!-- /include:cta-band -->` }));

writeFileSync("404.html", page({
  title: "Page not found | Mokshify", url: null, bodyClass: "t-utility", robots: "noindex, follow",
  desc: "This page does not exist or has moved. Find what you need from the Mokshify homepage, our work, services or search.",
  body: `<header class="hero dark">
  <div class="wrap">
    <p class="pkicker on-spine">Error 404</p>
    <h1><span class="ln"><span>This page</span></span> <span class="ln"><span>is not here.</span></span></h1>
    <p class="plain">It may have moved, or the address has a typo. Everything we publish is one click from the links below.</p>
    <div class="hero-actions"><a class="btn" href="/">Go to the homepage</a><a class="btn ghost" href="/search/">Search the site</a></div>
  </div>
</header>

<section class="section">
  <div class="wrap">
    <header class="section-head">
      <p class="label on-spine">00 / 00 &middot; Popular</p>
      <h2>Where people usually go</h2>
    </header>
    <div class="section-body wide">
      <div class="grid">
        <a class="card" href="/work/"><b>Our work</b><span>Live websites and apps we built, by industry.</span></a>
        <a class="card" href="/services/"><b>Services</b><span>Websites, mobile apps and business software.</span></a>
        <a class="card" href="/contact/"><b>Contact</b><span>Call, WhatsApp or email an engineer.</span></a>
        <a class="card" href="/sitemap/"><b>All pages</b><span>Every page on this site, in one list.</span></a>
      </div>
    </div>
  </div>
</section>` }));
console.log("guides hub + 404 written");
