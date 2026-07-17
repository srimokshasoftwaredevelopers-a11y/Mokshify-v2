/* MOKSHIFY - full-site static audit: links, metadata, schema, thinness. */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = "d:/Mokshify";
const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (["node_modules", "frames", "assets", "scripts", "src", "marketing", ".well-known", "js", "css", "docs", ".git"].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e === "index.html") pages.push(p);
  }
})(ROOT);

const titles = {}, descs = {};
const issues = [];
const linkTargets = new Set(pages.map(p => p.replace(/\\/g, "/").replace(ROOT, "").replace("index.html", "")));
linkTargets.add("/feed.xml"); linkTargets.add("/sitemap.xml"); linkTargets.add("/llms.txt");
linkTargets.add("/js/estimator.js"); linkTargets.add("/js/jsonfmt.js");
linkTargets.add("/assets/mark.png"); linkTargets.add("/assets/Mokshify_Logo.png"); linkTargets.add("/assets/icon-512.png");
let inbound = {};
let totalWords = 0, brokenLinks = 0;

for (const p of pages) {
  const rel = p.replace(/\\/g, "/").replace(ROOT, "").replace("index.html", "") || "/";
  const html = readFileSync(p, "utf8");
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1] || "";
  if (titles[title]) issues.push(`DUP TITLE: ${rel} == ${titles[title]}`); else titles[title] = rel;
  if (descs[desc]) issues.push(`DUP DESC: ${rel} == ${descs[desc]}`); else descs[desc] = rel;
  if (!html.includes('rel="canonical"')) issues.push(`NO CANONICAL: ${rel}`);
  if (!html.includes('og:image') && rel !== "/") issues.push(`NO OG IMAGE: ${rel}`);
  if (!html.includes("ld+json")) issues.push(`NO SCHEMA: ${rel}`);
  if (!html.includes("BreadcrumbList") && rel !== "/") issues.push(`NO BREADCRUMB: ${rel}`);
  const words = (html.replace(/<script[^]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length;
  totalWords += words;
  if (words < 250 && rel !== "/sitemap/") issues.push(`THIN (${words}w): ${rel}`);
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const t = m[1].endsWith("/") || !m[1].includes(".") ? (m[1].endsWith("/") ? m[1] : m[1] + "/") : m[1];
    inbound[t] = (inbound[t] || 0) + 1;
    if (!linkTargets.has(t) && !existsSync(join(ROOT, t))) { issues.push(`BROKEN: ${rel} -> ${m[1]}`); brokenLinks++; }
  }
}
const orphans = [...linkTargets].filter(t => t.endsWith("/") && t !== "/" && !inbound[t]);
const least = Object.entries(inbound).filter(([k]) => k.endsWith("/") && k !== "/").sort((a, b) => a[1] - b[1]).slice(0, 8);
console.log(`PAGES: ${pages.length}`);
console.log(`TOTAL WORDS: ${totalWords}`);
console.log(`ISSUES (${issues.length}):`);
issues.forEach(i => console.log("  " + i));
console.log(`ORPHANS: ${orphans.length ? orphans.join(", ") : "none"}`);
console.log("LEAST-LINKED:", least.map(([k, v]) => `${k}(${v})`).join(" "));