/* MOKSHIFY — motion acceptance checks (server on :8123).
   Reduced motion: nothing animates, no video, nothing hidden. JavaScript off: everything visible.
   375px: no video request, no horizontal scroll, Call/WhatsApp bar present. */
import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = process.env.BASE || "http://localhost:8123";
const ROUTES = ["/", "/services/", "/work/fincalix/", "/industries/real-estate/", "/library/caching-strategy/", "/estimate/", "/consult/"];
const b = await puppeteer.launch({ executablePath: EDGE, headless: true });
const out = [];
const check = (name, cond) => out.push(`${cond ? "PASS" : "FAIL"} ${name}`);
const hiddenCount = () => [...document.querySelectorAll("main *")].filter(e => {
  const s = getComputedStyle(e);
  return e.getClientRects().length && (parseFloat(s.opacity) < 0.99 || s.visibility === "hidden") && !e.closest(".hp, .hero-img, [aria-hidden=true]") && !e.matches("input[type=radio], input[type=checkbox]");   // native radios sit under visible labels by design
}).length;
const scrollAll = async p => p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); });

/* reduced motion */
for (const r of ROUTES) {
  const p = await b.newPage(); const media = [];
  p.on("request", q => { if (/\.(webm|mp4)$|lenis/.test(q.url())) media.push(q.url().split("/").pop()); });
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + r, { waitUntil: "networkidle0" });
  await scrollAll(p); await new Promise(s => setTimeout(s, 400));
  const anim = await p.evaluate(() => [...document.querySelectorAll("*")].filter(e => { const s = getComputedStyle(e); return (s.animationName !== "none" && s.animationDuration !== "0s") || (s.transitionDuration.split(",").some(d => parseFloat(d) > 0) && s.transitionProperty !== "none"); }).length);
  const hidden = await p.evaluate(hiddenCount);
  const pause = await p.evaluate(() => { const b = document.querySelector(".hero-pause"); return !b || getComputedStyle(b).display === "none"; });
  check(`reduced motion ${r}: ${anim} animating, ${hidden} hidden, video/lenis requests: ${media.length}, pause button hidden: ${pause}`, anim === 0 && hidden === 0 && media.length === 0 && pause);
  await p.close();
}

/* JavaScript off */
for (const r of ROUTES) {
  const p = await b.newPage();
  await p.setJavaScriptEnabled(false);
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + r, { waitUntil: "networkidle0" });
  await new Promise(s => setTimeout(s, 1500));                   // the one-off hero fade-in is CSS and finishes by then
  const hidden = await p.evaluate(hiddenCount);
  const panels = await p.evaluate(() => [...document.querySelectorAll("[role=tabpanel]")].filter(x => x.hidden || getComputedStyle(x).display === "none").length);
  const facts = await p.evaluate(() => [...document.querySelectorAll(".facts b")].filter(b => /^\D*0(\.0+)?\D*$/.test(b.textContent.trim())).length);
  check(`JS off ${r}: ${hidden} hidden elements, ${panels} hidden tab panels, ${facts} zeroed figures`, hidden === 0 && panels === 0 && facts === 0);
  await p.close();
}

/* 375px */
for (const r of ["/", "/work/qflow/", "/services/"]) {
  const p = await b.newPage(); const media = [];
  p.on("request", q => { if (/\.(webm|mp4)$|lenis/.test(q.url())) media.push(q.url().split("/").pop()); });
  await p.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await p.goto(BASE + r, { waitUntil: "networkidle0" });
  await scrollAll(p);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const bar = await p.evaluate(() => { const c = document.querySelector(".contact-bar"); const a = [...c.querySelectorAll("a")]; return getComputedStyle(c).position === "fixed" && a.some(x => x.href.startsWith("tel:+919391248520")) && a.some(x => x.href.includes("wa.me/919391248520")); });
  check(`375 ${r}: video/lenis requests ${media.length}, overflow ${over}, call/WhatsApp bar ${bar}`, media.length === 0 && over <= 0 && bar);
  await p.close();
}
await b.close();
console.log(out.join("\n"));
console.log(out.some(l => l.startsWith("FAIL")) ? "MOTION: FAILURES" : "MOTION: ALL PASS");
