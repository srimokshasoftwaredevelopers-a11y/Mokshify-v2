/* MOKSHIFY — acceptance checks against the local server (npm run serve first).
   Crawl: every sitemap route + every internal link → status. Orphans. Sitemap vs disk.
   JSON-LD and feed parse. Strategy-call CTAs. Asset weights. Token contrast (WCAG AA).
   node scripts/check-site.mjs   → exit 1 on any failure */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const BASE = process.env.BASE || "http://localhost:8123";
const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); return cond; };

/* pages on disk vs sitemap */
const SKIP = new Set(["node_modules", ".git", "frames", "assets", "assets-test", "scripts", "src", "docs", "marketing", "partials", "css", "js", "review", "shots", ".claude", ".agents", ".well-known", "crm", ".vercel", "dist"]);
const disk = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) { if (!SKIP.has(e)) walk(p); }
    else if (e === "index.html") disk.push("/" + relative(ROOT, d).split(sep).join("/") + (d === ROOT ? "" : "/"));
  }
})(ROOT);
const sitemap = [...readFileSync(join(ROOT, "sitemap.xml"), "utf8").matchAll(/<loc>https:\/\/mokshify\.io([^<]*)<\/loc>/g)].map(m => m[1]);
const missing = disk.filter(p => !sitemap.includes(p)), extra = sitemap.filter(p => !disk.includes(p));
ok(!missing.length && !extra.length, `sitemap mismatch: missing ${missing.join(" ")} extra ${extra.join(" ")}`);

/* crawl */
const status = {}, inbound = {}, pageHtml = {};
const queue = [...sitemap, "/404.html"];
const seen = new Set(queue);
while (queue.length) {
  const path = queue.shift();
  // VERCEL_BYPASS (optional): crawl a protected Vercel preview; the secret is sent as a header, never printed
  const res = await fetch(BASE + path, { redirect: "manual", headers: process.env.VERCEL_BYPASS ? { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS } : {} });
  status[path] = res.status;
  if (!res.headers.get("content-type")?.includes("text/html") || res.status !== 200) continue;
  const html = await res.text();
  pageHtml[path] = html;
  for (const m of html.matchAll(/(?:href|src|srcset)="(\/[^"#?\s]*)/g)) {
    const t = m[1];
    if (t !== path) (inbound[t] ||= new Set()).add(path);
    if (!seen.has(t)) { seen.add(t); queue.push(t); }
  }
}
const bad = Object.entries(status).filter(([p, s]) => s !== 200 && !(p === "/404.html"));
ok(!bad.length, `non-200: ${bad.map(([p, s]) => `${p} ${s}`).join(", ")}`);
const brokenFrom = bad.map(([p]) => `${p} ← ${[...(inbound[p] || [])].slice(0, 3).join(", ")}`);
const orphans = sitemap.filter(p => p !== "/" && !(inbound[p] && [...inbound[p]].some(src => src !== p)));
ok(!orphans.length, `orphans: ${orphans.join(" ")}`);

/* JSON-LD, feed, CTAs, counters */
let ld = 0;
for (const [p, html] of Object.entries(pageHtml)) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); ld++; } catch (e) { fail.push(`JSON-LD parse ${p}: ${e.message}`); }
  }
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>\s*Book (?:a )?strategy call/gi))
    ok(m[1] === "/consult/", `strategy-call CTA on ${p} → ${m[1]}`);
  ok(!/data-count="[^"]*"[^>]*>0</.test(html), `counter renders 0 on ${p}`);
}
const feed = readFileSync(join(ROOT, "feed.xml"), "utf8");
const items = (feed.match(/<item>/g) || []).length;
ok(items === (feed.match(/<\/item>/g) || []).length && /^<\?xml/.test(feed) && feed.trim().endsWith("</rss>"), "feed.xml malformed");
const feedLinks = [...feed.matchAll(/<link>https:\/\/mokshify\.io([^<#]*)/g)].map(m => m[1]);
ok(feedLinks.every(l => status[l] === 200 || disk.includes(l)), "feed.xml links a missing page");

/* weights */
const kb = f => statSync(join(ROOT, f)).size / 1024;
const css = kb("css/site.css"), js = kb("js/site.min.js") + kb("js/vendor/lenis-1.3.27.min.js");
ok(css < 60, `css ${css.toFixed(1)} KB ≥ 60`); ok(js < 30, `js ${js.toFixed(1)} KB ≥ 30`);
const homeJs = js + kb("js/home.min.js");                       // the home page adds its own script
console.log(`home page js ${homeJs.toFixed(1)} KB (shared ${js.toFixed(1)} KB + home.min.js ${kb("js/home.min.js").toFixed(1)} KB)`);
const imgs = readdirSync(join(ROOT, "assets", "sites")).filter(f => f.endsWith(".webp")).map(f => [f, kb("assets/sites/" + f)]);
const mobileImgs = imgs.filter(([f]) => /-m\.webp$|-thumb\.webp$/.test(f));
const heaviestMobile = mobileImgs.sort((a, b) => b[1] - a[1])[0];
ok(heaviestMobile[1] < 200, `largest mobile image ${heaviestMobile[0]} ${heaviestMobile[1].toFixed(0)} KB`);

/* contrast — WCAG 2.x relative luminance, alpha composited over its surface */
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const lum = rgb => { const [r, g, b] = rgb.map(c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
const T = { ox9: hex("#2A0A12"), ox7: hex("#4A1422"), lime: hex("#E4E2DC"), paper: hex("#F6F5F1"), ink: hex("#141012"), brass: hex("#B08D57") };
const pairs = [
  ["ink on limestone", T.ink, 1, T.lime, 4.5], ["ink 68% on limestone", T.ink, .68, T.lime, 4.5],
  ["ink on paper", T.ink, 1, T.paper, 4.5], ["ink 68% on paper", T.ink, .68, T.paper, 4.5],
  ["paper on oxblood 900", T.paper, 1, T.ox9, 4.5], ["paper 70% on oxblood 900", T.paper, .7, T.ox9, 4.5],
  ["paper 70% on oxblood 700", T.paper, .7, T.ox7, 4.5], ["paper on oxblood 700 (button)", T.paper, 1, T.ox7, 4.5],
  ["oxblood 700 on limestone (links)", T.ox7, 1, T.lime, 4.5], ["oxblood 900 on paper (button on dark)", T.ox9, 1, T.paper, 4.5],
  ["focus: ink inner ring on limestone (non-text, 3:1)", T.ink, 1, T.lime, 3], ["focus: brass outline against its ink ring (3:1)", T.brass, 1, T.ink, 3], ["focus: paper inner ring on oxblood 900 (3:1)", T.paper, 1, T.ox9, 3], ["brass ring on oxblood 900 (non-text, 3:1)", T.brass, 1, T.ox9, 3],
];
const contrast = pairs.map(([name, fg, a, bg, min]) => {
  const r = ratio(mix(fg, a, bg), bg);
  return { name, r: r.toFixed(2), pass: r >= min, min };
});

console.log(`routes crawled: ${Object.keys(status).length} (${sitemap.length} sitemap + 404 + assets/links)`);
console.log(`sitemap ${sitemap.length} = disk ${disk.length}: ${!missing.length && !extra.length}`);
console.log(`non-200: ${bad.length}${bad.length ? " — " + brokenFrom.join("; ") : ""}`);
console.log(`orphans: ${orphans.length}`);
console.log(`JSON-LD blocks parsed: ${ld} · feed items: ${items}`);
console.log(`css ${css.toFixed(1)} KB · js ${js.toFixed(1)} KB · largest mobile image ${heaviestMobile[0]} ${heaviestMobile[1].toFixed(0)} KB`);
console.log("contrast:\n" + contrast.map(c => `  ${c.pass ? "PASS" : "FAIL"} ${c.r}:1 (≥${c.min}) ${c.name}`).join("\n"));
contrast.filter(c => !c.pass).forEach(c => fail.push(`contrast ${c.name} ${c.r}`));
console.log(fail.length ? `\nFAILURES (${fail.length}):\n  ${fail.join("\n  ")}` : "\nALL CHECKS PASS");
process.exit(fail.length ? 1 : 0);
