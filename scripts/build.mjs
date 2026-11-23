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
  "docs", "marketing", "partials", "css", "js", ".well-known", ".claude", ".agents", "shots", "review",
  "crm",                                     // the CRM is a separate Next.js app (its own Vercel project)
  "dist"]);                                  // the published copy, written afterwards by scripts/publish.mjs
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
const cssFiles = readdirSync(cssDir).filter(f => f.endsWith(".css")).sort();
/* one unclosed ( or { silently swallows every rule after it — fail the build instead */
for (const f of cssFiles) {
  const src = readFileSync(join(cssDir, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:\\.|[^"\\])*"/g, '""');
  let depth = { "(": 0, "{": 0 }, line = 1;
  for (const ch of src) {
    if (ch === "\n") line++;
    if (ch === "(" || ch === "{") depth[ch]++;
    if (ch === ")") depth["("]--;
    if (ch === "}") { depth["{"]--; if (depth["("] !== 0) throw new Error(`css/src/${f}:${line}: unbalanced ( before }`); }
    if (depth["("] < 0 || depth["{"] < 0) throw new Error(`css/src/${f}:${line}: unexpected closing bracket`);
  }
  if (depth["("] || depth["{"]) throw new Error(`css/src/${f}: unclosed bracket at end of file`);
}
const cssSrc = cssFiles.map(f => readFileSync(join(cssDir, f), "utf8").trim()).join("\n\n") + "\n";
/* site.js (every page) and home.js (home only) are the readable sources; pages load the
   minified copies (esbuild if installed, else verbatim) */
let esbuild = null;
try { esbuild = await import("esbuild"); } catch { /* no esbuild: ship the source */ }
const minify = name => {
  const src = readFileSync(join(ROOT, "js", `${name}.js`), "utf8");
  const out = esbuild ? esbuild.transformSync(src, { minify: true, target: "es2020" }).code : src;
  write(join(ROOT, "js", `${name}.min.js`), out);
  return out;
};
/* css/site.css is the minified concatenation (css/src/ stays the readable source) */
const css = esbuild ? esbuild.transformSync(cssSrc, { loader: "css", minify: true }).code : cssSrc;
write(join(ROOT, "css", "site.css"), css);
const jsMin = minify("site"), homeMin = minify("home");
const vars = { cssv: hash(css), jsv: hash(jsMin) };
const homev = hash(homeMin);

/* home image breaks: <figure class="break-img" data-slot="/assets/home/break-1.webp" data-fallback="slug">.
   When the slot file exists it is used; until then, the client screenshot <slug>-plate / <slug>-m. */
const breakFigure = (_, slot, slug) => {
  const own = existsSync(join(ROOT, slot.replace(/^\//, "")));
  const inner = own
    ? `<picture><img src="${slot}" alt="" width="2400" height="1350" loading="lazy" decoding="async"></picture>`
    : `<picture><source media="(max-width: 40rem)" srcset="/assets/sites/${slug}-m.webp" width="600" height="2597"><img src="/assets/sites/${slug}-plate.webp" alt="" width="1600" height="1000" loading="lazy" decoding="async"></picture>`;
  return `<figure class="break-img${own ? " own" : ""}" data-slot="${slot}" data-fallback="${slug}">${inner}</figure>`;
};

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
  // section labels on the spine count themselves: "01 / 05", in document order
  const total = (out.match(/<p class="label on-spine">\d\d \/ \d\d/g) || []).length;
  let n = 0;
  const numbered = out.replace(/(<p class="label on-spine">)\d\d \/ \d\d/g,
    (_, open) => `${open}${String(++n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`);
  // home hero video: on only once all three files exist (no 404s before then)
  const heroReady = ["hero.webm", "hero.mp4", "hero-poster.webp"].every(f => existsSync(join(ROOT, "assets", "hero", f)));
  write(file, numbered
    .replace(/data-hero-video="(?:pending|ready)"/, `data-hero-video="${heroReady ? "ready" : "pending"}"`)
    .replace(/\/js\/home\.min\.js\?v=[0-9a-f]{10}/g, `/js/home.min.js?v=${homev}`)
    .replace(/<figure class="break-img(?: own)?" data-slot="([^"]+)" data-fallback="([\w-]+)">[\s\S]*?<\/figure>/g, breakFigure));
}

console.log(`css ${(css.length / 1024).toFixed(1)} KB (${vars.cssv}) · js ${(jsMin.length / 1024).toFixed(1)} KB min (${vars.jsv}) · home js ${(homeMin.length / 1024).toFixed(1)} KB min (${homev})`);
console.log(`${pages.length} pages · ${regions} regions · ${stale.length} ${check ? "out of date" : "written"}`);
if (check && stale.length) { console.log(stale.join("\n")); process.exit(1); }

/* Copy rules (docs/HANDBOOK.md, "Writing guidelines"), checked on every built page except /legal/disclosure/:
   no em or en dash anywhere in the file; no spaced hyphen used as a dash in visible text (code samples
   excepted); no wording that says Mokshify's own content, code or releases are written, generated,
   drafted, reviewed, checked, tested or approved by AI (describe the pipeline as "automated checks"). */
const DASH = /—|–|&mdash;|&ndash;|&#821[12];|&#x201[34];/i;
const AI_LABEL = new RegExp([
  String.raw`\b(?:written|generated|drafted|authored|reviewed|checked|tested|approved|created|produced)\s+(?:with|by|using)\s+(?:an?\s+)?(?:AI|ChatGPT|Claude|Gemini|GPT[\w.-]*|LLMs?|large language models?|artificial intelligence)\b`,
  String.raw`\bAI[- ](?:written|generated|drafted|authored|reviewed|checked|approved|tested|gated)\b`,
  String.raw`\bAI[- ]reviews?\b`,
  String.raw`\bAI[- ]assisted\s+(?:review|QA|testing|development)\b`,
  String.raw`"reviewedBy"\s*:`,
].join("|"), "i");
const around = (s, i) => s.slice(Math.max(0, i - 50), i + 50).replace(/\s+/g, " ");
const voice = [];
for (const file of pages) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  if (rel.startsWith("legal/disclosure/")) continue;
  const html = readFileSync(file, "utf8");
  const visible = html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|pre|svg)\b[\s\S]*?<\/\1>/g, " ").replace(/<code\b[\s\S]*?<\/code>/g, "\u0002").replace(/<[^>]+>/g, "\u0001");   /* inline code stands in as a word, so "<code>#2A0A12</code> - the" is caught */
  let m;
  if ((m = DASH.exec(html))) voice.push(`${rel}: long dash: …${around(html, m.index)}…`);
  if ((m = /[^\s\u0001]\u0001* - \u0001*[^\s\u0001]/.exec(visible)))   /* a tag may sit on either side: "boring - <a>…" */ voice.push(`${rel}: spaced hyphen used as a dash: …${around(visible, m.index).replace(/\u0001/g, " ")}…`);
  if ((m = AI_LABEL.exec(html))) voice.push(`${rel}: AI authorship label: …${around(html, m.index)}…`);
}
if (voice.length) { console.log(`copy rules: ${voice.length} problem(s)\n` + voice.join("\n")); process.exit(1); }
console.log("copy rules: no long dashes, no spaced-hyphen dashes, no AI labels");
