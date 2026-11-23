/* MOKSHIFY: publish. Copies the finished site into dist/, the only folder Vercel serves
   (vercel.json "outputDirectory": "dist"). Runs after scripts/build.mjs in `npm run build`.

   What goes in (an allowlist, nothing else):
     - every page: each .html outside the internal folders below
     - assets/, .well-known/ and licences/ (font licence texts), whole
     - the public root files: robots.txt, sitemap.xml, image-sitemap.xml, feed.xml, llms.txt,
       humans.txt, site.webmanifest, search-index.json, 404.html
     - css/site.css, and each file under js/ that a page or a published script actually loads

   Then it checks dist/ and exits 1 if:
     - any .md file, dotfile, script source, config or lock file, or internal folder is in it
     - any page or the stylesheet refers to a local file that is not in dist/

   node scripts/publish.mjs */
import { readFileSync, readdirSync, statSync, existsSync, rmSync, mkdirSync, cpSync, copyFileSync } from "node:fs";
import { join, dirname, relative, extname, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist");
const NOT_PAGES = new Set(["partials", "review", "crm", "docs", "scripts", "marketing", "node_modules", "dist", "css", "js", "assets", "shots", "assets-test"]);
const PUBLIC_ROOT = ["robots.txt", "sitemap.xml", "image-sitemap.xml", "feed.xml", "llms.txt", "humans.txt", "site.webmanifest", "search-index.json", "404.html"];
const REQUIRED = new Set(["robots.txt", "sitemap.xml", "feed.xml", "llms.txt", "site.webmanifest", "404.html"]);
const rel = f => relative(ROOT, f).replace(/\\/g, "/");
const walk = (dir, keep, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (keep(rel(p) + "/")) walk(p, keep, out); }
    else if (keep(rel(p))) out.push(p);
  }
  return out;
};
const copy = r => { const to = join(OUT, r); mkdirSync(dirname(to), { recursive: true }); copyFileSync(join(ROOT, r), to); };
const problems = [];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

// pages
const pages = walk(ROOT, r => {
  const top = r.split("/")[0];
  if (r.endsWith("/")) return !top.startsWith(".") && !NOT_PAGES.has(top);
  return r.endsWith(".html");
}).map(rel);
for (const p of pages) copy(p);
// asset folders and public root files
// licences/: font licence texts (SIL OFL 1.1 asks that each copy of the fonts carries its licence)
for (const d of ["assets", ".well-known", "licences"]) if (existsSync(join(ROOT, d))) cpSync(join(ROOT, d), join(OUT, d), { recursive: true });
for (const f of PUBLIC_ROOT) {
  if (existsSync(join(ROOT, f))) copy(f);
  else if (REQUIRED.has(f)) problems.push(`missing public file: ${f}`);
}
copy("css/site.css");
// scripts: only what is loaded, following references from pages into scripts (site.min.js loads Lenis)
const jsRefs = text => [...text.matchAll(/["'`(]\/?(js\/[\w./-]+\.js)/g)].map(m => m[1]);
const queue = pages.flatMap(p => jsRefs(readFileSync(join(ROOT, p), "utf8")));
const scripts = new Set();
while (queue.length) {
  const r = queue.shift();
  if (scripts.has(r)) continue;
  if (!existsSync(join(ROOT, r))) { problems.push(`a page loads ${r}, which does not exist`); continue; }
  scripts.add(r); copy(r);
  queue.push(...jsRefs(readFileSync(join(ROOT, r), "utf8")));
}

// check: nothing internal in dist/
const INTERNAL_TOP = new Set(["partials", "review", "crm", "docs", "scripts", "marketing", "node_modules", "dist", ".claude", ".git", ".vercel"]);
const INTERNAL_NAMES = new Set(["package.json", "package-lock.json", "vercel.json", "_headers", "_redirects", "README.md", "CLAUDE.md", "AGENTS.md", "LICENSE"]);
const published = walk(OUT, () => true).map(f => relative(OUT, f).replace(/\\/g, "/"));
for (const f of published) {
  const parts = f.split("/"), base = parts[parts.length - 1];
  const why =
    INTERNAL_TOP.has(parts[0]) ? "internal folder" :
    f.startsWith("css/src/") ? "stylesheet source" :
    /\.(md|mjs|cjs|ts|map|env|log|bak)$/i.test(f) ? "internal file type" :
    INTERNAL_NAMES.has(base) ? "config or note" :
    parts.some(p => p.startsWith(".")) && parts[0] !== ".well-known" ? "dotfile" : "";
  if (why) problems.push(`${why} in dist/: ${f}`);
}

// check: every local reference from a page or the stylesheet resolves inside dist/
const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
const redirected = new Set((vercel.redirects || []).filter(r => !r.has).map(r => r.source.replace(/\/$/, "")));
const have = new Set(published);
const resolves = (u, from) => {
  u = u.replace(/^https:\/\/mokshify\.io/, "").split(/[?#]/)[0];
  if (!u) return true;
  if (!u.startsWith("/")) u = posix.join("/" + posix.dirname(from), u);
  let p = u.slice(1);
  try { p = decodeURIComponent(p); } catch {}
  if (redirected.has(u.replace(/\/$/, ""))) return true;
  if (p === "" || p.endsWith("/")) return have.has(p + "index.html");
  return have.has(p) || (!extname(p) && have.has(p + "/index.html"));
};
const refsIn = text => {
  const out = [];
  for (const m of text.matchAll(/\s(?:src|href|poster|data-preview|data-slot)="([^"]+)"/g)) out.push(m[1]);
  for (const m of text.matchAll(/\ssrcset="([^"]+)"/g)) if (!m[1].trim().startsWith("data:")) for (const part of m[1].split(",")) out.push(part.trim().split(/\s+/)[0]);
  for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) out.push(m[1]);
  return out.filter(u => u.startsWith("/") || u.startsWith("https://mokshify.io/") || (/^[\w.-]+\//.test(u) && !/^[a-z]+:/i.test(u)));
};
for (const f of published.filter(f => f.endsWith(".html") || f === "css/site.css")) {
  const text = readFileSync(join(OUT, f), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  for (const u of refsIn(text)) if (!resolves(u, f)) problems.push(`${f} refers to ${u}, which is not in dist/`);
}

if (problems.length) {
  console.log(`publish: ${problems.length} problem(s)\n` + [...new Set(problems)].join("\n"));
  process.exit(1);
}
console.log(`publish: dist/ ${published.length} files (${pages.length} pages, ${scripts.size} scripts); no internal files; every local reference resolves`);
