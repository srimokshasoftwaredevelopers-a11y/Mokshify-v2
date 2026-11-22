/* MOKSHIFY — logo assets from the owner's original (assets/brand/mokshify-logo-original.png).
   The artwork is never redrawn or recoloured: only the cream background is removed and the
   file is cropped and resized.

   1. Background → alpha. The cream background is a soft vignette, so a smooth quadratic surface
      is fitted to background pixels and each pixel is "colour-to-alpha"ed against its local
      background (the GIMP method). Fully opaque artwork keeps its exact colour.
   2. Crops: the M mark (square), and the lockup without the tagline.
   3. Exports: favicons, apple-touch, manifest icons, nav/footer logos (WebP + PNG), JSON-LD logo, og.jpg.
   node scripts/brand-logo.mjs [--preview]   (--preview also writes edge crops to review/logo/) */
import sharp from "sharp";
import { mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SRC = join(ROOT, "assets/brand/mokshify-logo-original.png");
const OUT = join(ROOT, "assets/brand");
const PAPER = { r: 246, g: 245, b: 241 };
mkdirSync(OUT, { recursive: true });

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;

/* 1a · local background by normalised convolution: blur the background pixels only (foreground
        masked out and dilated), so the radial glow in the cream is followed exactly */
const N = W * H, fg = new Uint8Array(N);
for (let p = 0; p < N; p++) { const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2]; fg[p] = (Math.max(r, g, b) - Math.min(r, g, b) > 28 || Math.min(r, g, b) < 0xcc) ? 255 : 0; }
const dil = await sharp(Buffer.from(fg), { raw: { width: W, height: H, channels: 1 } }).blur(6).raw().toBuffer();
const wgt = Buffer.alloc(N), prem = Buffer.alloc(N * 3);
for (let p = 0; p < N; p++) { const w = dil[p] > 8 ? 0 : 255; wgt[p] = w; for (let c = 0; c < 3; c++) prem[p * 3 + c] = w ? data[p * 3 + c] : 0; }
const SIG = 64;
const num = await sharp(prem, { raw: { width: W, height: H, channels: 3 } }).blur(SIG).raw().toBuffer();
const den = await sharp(wgt, { raw: { width: W, height: H, channels: 1 } }).blur(SIG).raw().toBuffer();
let gm = [0, 0, 0], gn = 0; for (let p = 0; p < N; p++) if (wgt[p]) { gn++; for (let c = 0; c < 3; c++) gm[c] += data[p * 3 + c]; }
gm = gm.map(v => v / gn);
const rows = { length: gn };
const bgAt = (x, y) => { const p = y * W + x, d = den[p] / 255; return d > 0.04 ? [0, 1, 2].map(c => Math.min(255, num[p * 3 + c] / d)) : gm; };

/* 1b · colour-to-alpha against the local background */
const rgba = Buffer.alloc(W * H * 4);
const T0 = 0.07;                               // below this, background noise → fully transparent
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 3, o = (y * W + x) * 4, bg = bgAt(x, y), p = [data[i], data[i + 1], data[i + 2]];
  let a = 0;
  for (let c = 0; c < 3; c++) {
    const d = p[c] - bg[c];
    if (d < 0) a = Math.max(a, -d / bg[c]);       // the artwork only ever darkens the cream; brighter = background
  }
  a = Math.min(1, Math.max(0, (a - T0) / (1 - T0)));
  for (let c = 0; c < 3; c++) rgba[o + c] = a > 0 ? Math.round(Math.min(255, Math.max(0, (p[c] - bg[c]) / a + bg[c]))) : 0;
  rgba[o + 3] = Math.round(a * 255);
}
const full = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
await full.clone().png({ compressionLevel: 9 }).toFile(join(OUT, "mokshify-logo-transparent.png"));

/* 2 · regions, from the alpha itself */
const alphaAt = (x, y) => rgba[(y * W + x) * 4 + 3];
const bbox = (x0, x1, y0, y1, min = 40) => {
  let L = x1, R = x0, T = y1, B = y0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (alphaAt(x, y) > min) { L = Math.min(L, x); R = Math.max(R, x); T = Math.min(T, y); B = Math.max(B, y); }
  return { left: L, top: T, width: R - L + 1, height: B - T + 1 };
};
// the divider (thin vertical gold line) separates mark and wordmark; find the emptiest column between them
let split = 760, best = Infinity;
for (let x = 700; x < 820; x++) { let s = 0; for (let y = 0; y < H; y++) s += alphaAt(x, y) > 40 ? 1 : 0; if (s < best) { best = s; split = x; } }
const mark = bbox(0, split - 8, 0, H);
// tagline rows: in the wordmark column, the lowest separate band of ink
const right0 = split + 8, rowInk = [];
for (let y = 0; y < H; y++) { let s = 0; for (let x = right0; x < W; x++) s += alphaAt(x, y) > 60 ? 1 : 0; rowInk.push(s); }
const bands = []; let inBand = false;
rowInk.forEach((s, y) => { if (s > 20 && !inBand) { bands.push([y, y]); inBand = true; } else if (s > 20) bands[bands.length - 1][1] = y; else inBand = false; });
const tag = bands.filter(([a, b]) => b - a > 8).pop();           // the last solid band of ink = the tagline
const word = bbox(right0, W, 0, tag[0] - 4);

/* the M mark, square */
const side = Math.max(mark.width, mark.height) + 16;
const markImg = await full.clone().extract(mark).png().toBuffer();
const markSq = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: markImg, left: Math.round((side - mark.width) / 2), top: Math.round((side - mark.height) / 2) }]).png().toBuffer();
await sharp(markSq).png({ compressionLevel: 9 }).toFile(join(OUT, "mokshify-mark.png"));
for (const s of [512, 192]) await sharp(markSq).resize(s, s).png({ compressionLevel: 9 }).toFile(join(ROOT, `assets/icon-${s}.png`));
for (const s of [32, 16]) await sharp(markSq).resize(s, s).png({ compressionLevel: 9 }).toFile(join(ROOT, `assets/favicon-${s}.png`));
// iOS paints transparent touch icons black; this one alone sits on paper
await sharp(markSq).resize(160, 160).extend({ top: 10, bottom: 10, left: 10, right: 10, background: { ...PAPER, alpha: 1 } }).flatten({ background: PAPER }).png().toFile(join(ROOT, "assets/icon-180.png"));
// nav / footer mark: 28px and 36px display, 2× pixels
for (const s of [56, 72]) {
  await sharp(markSq).resize(s, s).webp({ quality: 88, alphaQuality: 100 }).toFile(join(OUT, `mark-${s}.webp`));
  await sharp(markSq).resize(s, s).png({ compressionLevel: 9 }).toFile(join(OUT, `mark-${s}.png`));
}

/* the lockup without the tagline: mark + divider + wordmark, tagline rows cleared */
const lock = { left: mark.left, top: Math.min(mark.top, word.top), width: word.left + word.width - mark.left, height: Math.max(mark.top + mark.height, word.top + word.height) - Math.min(mark.top, word.top) };
const noTag = Buffer.from(rgba);
for (let y = Math.max(0, tag[0] - 6); y <= Math.min(H - 1, tag[1] + 6); y++) for (let x = right0; x < W; x++) noTag[(y * W + x) * 4 + 3] = 0;
const lockBuf = await sharp(noTag, { raw: { width: W, height: H, channels: 4 } }).extract(lock).png().toBuffer();
const lockW = h => Math.round(lock.width * h / lock.height);
for (const h of [36, 72]) {
  await sharp(lockBuf).resize(lockW(h), h).webp({ quality: 88, alphaQuality: 100 }).toFile(join(OUT, `lockup-${h}.webp`));
  await sharp(lockBuf).resize(lockW(h), h).png({ compressionLevel: 9 }).toFile(join(OUT, `lockup-${h}.png`));
}

/* JSON-LD logo (full logo with tagline, transparent) and the Open Graph card */
const logoBox = bbox(0, W, 0, H, 20);
const logoBuf = await full.clone().extract(logoBox).png().toBuffer();
await sharp(logoBuf).resize({ width: 1200 }).png({ compressionLevel: 9 }).toFile(join(OUT, "mokshify-logo.png"));
const ogLogo = await sharp(logoBuf).resize({ width: 980 }).png().toBuffer();
const ogMeta = await sharp(ogLogo).metadata();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: PAPER } })
  .composite([{ input: ogLogo, left: Math.round((1200 - ogMeta.width) / 2), top: Math.round((630 - ogMeta.height) / 2) }])
  .jpeg({ quality: 86 }).toFile(join(ROOT, "assets/og.jpg"));

/* --preview: 2× crops of hard edges on light, paper and oxblood grounds, for the edge check */
if (process.argv.includes("--preview")) {
  mkdirSync(join(ROOT, "review/logo"), { recursive: true });
  const crops = { "m-edge": { left: mark.left, top: mark.top + Math.round(mark.height * .35), width: 260, height: 220 },
    "word-edge": { left: word.left, top: word.top, width: 300, height: Math.min(200, word.height) },
    "glow": { left: mark.left + Math.round(mark.width * .3), top: mark.top + Math.round(mark.height * .62), width: 260, height: 200 } };
  const grounds = { limestone: { r: 228, g: 226, b: 220 }, oxblood: { r: 42, g: 10, b: 18 }, paper: PAPER };
  const tiles = [];
  for (const [name, c] of Object.entries(crops)) for (const [g, col] of Object.entries(grounds)) {
    const t = await full.clone().extract(c).resize(c.width * 2, c.height * 2, { kernel: "nearest" }).png().toBuffer();
    tiles.push(await sharp({ create: { width: c.width * 2, height: c.height * 2, channels: 3, background: col } }).composite([{ input: t }]).png().toBuffer());
  }
  const tw = 520, th = 440, sheet = [];
  for (let i = 0; i < tiles.length; i++) sheet.push({ input: await sharp(tiles[i]).resize(tw, th, { fit: "contain", background: "#888" }).toBuffer(), left: (i % 3) * tw, top: Math.floor(i / 3) * th });
  await sharp({ create: { width: tw * 3, height: th * 3, channels: 3, background: "#888" } }).composite(sheet).png().toFile(join(ROOT, "review/logo/edges-2x.png"));
}

const kb = f => (statSync(join(ROOT, f)).size / 1024).toFixed(1);
console.log(`bg model from ${rows.length} samples · split x=${split} · mark ${mark.width}×${mark.height} · tagline rows ${tag[0]}–${tag[1]}`);
console.log(`lockup 36: ${lockW(36)}×36 (${kb("assets/brand/lockup-36.webp")} KB webp) · lockup 72: ${lockW(72)}×72 (${kb("assets/brand/lockup-72.webp")} KB webp, ${kb("assets/brand/lockup-72.png")} KB png) · mark-56 ${kb("assets/brand/mark-56.webp")} KB`);
