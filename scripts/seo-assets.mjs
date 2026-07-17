/* One-shot: generates the social/OG image and PWA icons.
   Usage: node scripts/seo-assets.mjs  (server must be running on :8123) */
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

/* ── icons from the official logo (assets/Mokshify_Logo.png):
     crop the M emblem from the brand sheet, square it on the
     sheet's own warm-white ground, then derive every size ── */
/* NOTE: separate toBuffer passes — sharp reorders extract/extend/resize
   inside one pipeline, which crops wrongly */
const cut = await sharp("assets/Mokshify_Logo.png")
  .extract({ left: 180, top: 155, width: 845, height: 555 })
  .toBuffer();
const mark = await sharp(cut)
  .extend({ top: 145, bottom: 145, background: { r: 250, g: 246, b: 242 } })
  .toBuffer();
await sharp(mark).resize(1024, 1024).png().toFile("assets/mark.png");
for (const size of [64, 180, 192, 512]) {
  const out = size === 64 ? "assets/mark-64.png" : `assets/icon-${size}.png`;
  await sharp(mark).resize(size, size).png().toFile(out);
  console.log(out);
}

/* ── og.jpg: the hero frame, cleaned of chrome, 1200×630 ── */
const browser = await puppeteer.launch({
  executablePath: EDGE, headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
await page.goto("http://localhost:8123/index.html?f=0.001&v=og" + Date.now(), {
  waitUntil: "load", timeout: 30000,
});
await page.addStyleTag({ content: `
  .nav,.rail-progress,.contact-card,.scroll-cue,.film-cap,.mbar,.mnav-btn,
  .cursor-light{display:none!important}
` });
await new Promise(r => setTimeout(r, 3200));
const shot = await page.screenshot({ type: "png" });
await browser.close();
await sharp(shot).resize(1200, 630).jpeg({ quality: 82 }).toFile("assets/og.jpg");
console.log("assets/og.jpg");
