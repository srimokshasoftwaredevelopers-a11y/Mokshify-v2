/* MOKSHIFY — the build. No framework; the output is plain static HTML at the
   same paths as before, committed to the repo and served as-is.

   1. CSS   css/src/*.css (in name order) → css/site.css
   2. HTML  every page marks shared regions:
              <!-- include:nav --> … <!-- /include:nav -->
            and the build replaces what sits between the markers with
            partials/nav.html. Partials may pull in other partials with
            <!-- partial:name -->. A region may keep page-owned copy in a slot:
              <!-- slot --> … <!-- /slot -->   (re-inserted at {{slot}})
   3. Cache  {{cssv}} / {{jsv}} in partials become content hashes, because
            /css and /js are served immutable for a year.

   node scripts/build.mjs           build
   node scripts/build.mjs --check   exit 1 if anything is out of date */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".git", "frames", "assets", "assets-test", "scripts", "src",
  "docs", "marketing", "partials", "css", "js", ".well-known", ".claude", ".agents", "shots", "review"]);
const check = process.argv.includes("--check");
const stale = [];
const write = (file, body) => {
  const prev = existsSync(file) ? readFileSync(file, "utf8") : null;
  if (prev === body) return false;
  stale.push(relative(ROOT, file).replace(/\\/g, "/"));
  if (!check) writeFileSync(file, body);
  return true;
};
const hash = s => createHash("sha256").update(s).digest("hex").slice(0, 10);

/* 1 · CSS */
const cssDir = join(ROOT, "css", "src");
const css = readdirSync(cssDir).filter(f => f.endsWith(".css")).sort()
  .map(f => readFileSync(join(cssDir, f), "utf8").trim()).join("\n\n") + "\n";
write(join(ROOT, "css", "site.css"), css);
const jsSrc = readFileSync(join(ROOT, "js", "site.js"), "utf8");
const vars = { cssv: hash(css), jsv: hash(jsSrc) };

/* 2 · partials */
const raw = {};
for (const f of readdirSync(join(ROOT, "partials"))) {
  if (f.endsWith(".html")) raw[f.replace(/\.html$/, "")] = readFileSync(join(ROOT, "partials", f), "utf8").trim();
}
const expand = (name, seen = []) => {
  if (seen.includes(name)) throw new Error("partial cycle: " + [...seen, name].join(" → "));
  if (!(name in raw)) throw new Error(`no partial named "${name}"`);
  return raw[name]
    .replace(/([ \t]*)<!-- partial:([\w-]+) -->/g, (_, pad, n) =>
      expand(n, [...seen, name]).split("\n").map(l => (l ? pad + l : l)).join("\n"))
    .replace(/\{\{(cssv|jsv)\}\}/g, (_, k) => vars[k]);
};
const partials = Object.fromEntries(Object.keys(raw).map(n => [n, expand(n)]));

/* the same nav everywhere; each page marks its own link and its own section */
const SECTION_OF = { "/library/": "/engineering/", "/journal/": "/engineering/", "/decisions/": "/engineering/",
  "/guides/": "/engineering/", "/resources/": "/engineering/", "/stack/": "/engineering/", "/architecture/": "/engineering/",
  "/benchmarks/": "/engineering/", "/devops/": "/engineering/", "/quality/": "/engineering/", "/estimate/": "/engineering/",
  "/tools/": "/engineering/", "/process/": "/work/", "/enterprise/": "/work/", "/security/": "/work/",
  "/careers/": "/about/", "/brand/": "/about/", "/contact/": "/about/", "/faq/": "/about/", "/search/": "/about/",
  "/sitemap/": "/about/", "/legal/": "/about/" };
function localise(name, html, route) {
  if (!["nav", "mega-menu"].includes(name)) return html;
  const top = "/" + (route.split("/")[1] || "") + "/";
  const section = SECTION_OF[top] || top;
  return html
    .replaceAll(`href="${route}"`, `href="${route}" aria-current="page"`)
    .replaceAll(`data-section="${section}"`, `data-section="${section}" data-current`);
}

const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (!SKIP.has(e)) walk(p); }
    else if (e.endsWith(".html")) pages.push(p);
  }
})(ROOT);

let regions = 0;
for (const file of pages) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const route = "/" + rel.replace(/(index|404)\.html$/, "");
  const src = readFileSync(file, "utf8");
  const out = src.replace(
    /([ \t]*)<!-- include:([\w-]+) -->([\s\S]*?)<!-- \/include:\2 -->/g,
    (whole, pad, name, body) => {
      if (!(name in partials)) throw new Error(`${rel}: no partial named "${name}"`);
      regions++;
      let html = localise(name, partials[name], route);
      if (html.includes("{{slot}}")) {
        const slot = /<!-- slot -->([\s\S]*?)<!-- \/slot -->/.exec(body);
        if (!slot) throw new Error(`${rel}: region "${name}" needs a <!-- slot -->`);
        const copy = slot[1].replace(/^\s*\n|\s+$/g, "").split("\n").map(l => l.replace(/^\s+/, "")).join("\n");
        html = html.replace(/([ \t]*)\{\{slot\}\}/, (_, p) =>
          `${p}<!-- slot -->\n${copy.split("\n").map(l => (l ? p + l : l)).join("\n")}\n${p}<!-- /slot -->`);
      }
      const indented = html.split("\n").map(l => (l ? pad + l : l)).join("\n");
      return `${pad}<!-- include:${name} -->\n${indented}\n${pad}<!-- /include:${name} -->`;
    });
  write(file, out);
}

console.log(`css ${(css.length / 1024).toFixed(1)} KB (${vars.cssv}) · js ${(jsSrc.length / 1024).toFixed(1)} KB (${vars.jsv})`);
console.log(`${pages.length} pages · ${regions} regions · ${stale.length} ${check ? "out of date" : "written"}`);
if (check && stale.length) { console.log(stale.join("\n")); process.exit(1); }
