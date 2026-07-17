/* Build search-index.json from every page: url, title, description, section. */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = process.cwd();
const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (["node_modules","frames","assets","scripts","src","marketing",".well-known","js","css","docs",".git"].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e === "index.html") pages.push(p);
  }
})(ROOT);
const idx = pages.map(p => {
  const rel = p.replace(/\\/g, "/").replace(ROOT.replace(/\\/g, "/"), "").replace("index.html", "") || "/";
  const html = readFileSync(p, "utf8");
  const t = ((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "").split("|")[0].trim();
  const d = (html.match(/name="description" content="([^"]*)"/) || [])[1] || "";
  const s = rel === "/" ? "Home" : rel.split("/")[1].replace(/-/g, " ");
  return { u: rel, t, d, s };
});
writeFileSync("search-index.json", JSON.stringify(idx));
console.log("indexed", idx.length, "pages");