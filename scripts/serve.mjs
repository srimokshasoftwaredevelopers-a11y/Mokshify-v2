/* MOKSHIFY — local static server for QA (Python isn't required).
   Serves the repo root like the host does: /x/ → x/index.html, unknown → 404.html (status 404),
   and the plain-path redirects listed in vercel.json.   node scripts/serve.mjs [port] [folder]
   With a folder (npm run serve passes dist), it serves that folder, exactly what Vercel publishes. */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const ROOT = process.argv[3] ? join(REPO, process.argv[3]) : REPO;
const PORT = Number(process.argv[2] || process.env.PORT || 8123);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };
const redirects = (JSON.parse(readFileSync(join(REPO, "vercel.json"), "utf8")).redirects || []).filter(r => !r.has && !r.source.includes(":"));

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const path = decodeURIComponent(url.pathname);
  const r = redirects.find(r => r.source === path || r.source + "/" === path);
  if (r) { res.writeHead(r.permanent ? 301 : 302, { Location: r.destination }); return res.end(); }
  let file = normalize(join(ROOT, path));
  if (!file.startsWith(normalize(ROOT))) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith("/")) { res.writeHead(301, { Location: path + "/" + url.search }); return res.end(); }
    file = join(file, "index.html");
  }
  let status = 200;
  if (!existsSync(file)) { status = 404; file = join(ROOT, "404.html"); }
  if (!existsSync(file)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(status, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
