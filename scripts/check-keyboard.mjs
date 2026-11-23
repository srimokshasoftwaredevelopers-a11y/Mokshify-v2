/* MOKSHIFY — keyboard checks with the installed Edge (server on :8123).
   Mega menu, mobile sheet, home tabs, FAQ accordion, enquiry form, estimator, visible focus ring. */
import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = process.env.BASE || "http://localhost:8123";
const b = await puppeteer.launch({ executablePath: EDGE, headless: true });
let p = await b.newPage();
const fresh = async (w, h, mobile = false) => { await p.close(); p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile }); };
const out = [];
const check = (name, cond) => out.push(`${cond ? "PASS" : "FAIL"} ${name}`);
const tabTo = async (sel, max = 60) => {
  for (let i = 0; i < max; i++) { await p.keyboard.press("Tab"); if (await p.evaluate(s => document.activeElement?.matches(s), sel)) return true; }
  return false;
};

/* desktop mega menu */
await p.setViewport({ width: 1440, height: 900 });
await p.goto(BASE + "/services/", { waitUntil: "networkidle0" });
await p.keyboard.press("Tab");
check("first Tab reaches the skip link", await p.evaluate(() => document.activeElement.classList.contains("skip")));
check("Tab reaches the Services menu button", await tabTo('.nav-top[aria-controls="menu-services"]'));
const ring = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== "none" && s.outlineColor; });
check(`focus ring visible (outline ${ring})`, ring && ring.includes("176, 141, 87"));
await p.keyboard.press("Enter");
check("Enter opens the mega menu", await p.evaluate(() => document.querySelector('[aria-controls="menu-services"]').getAttribute("aria-expanded") === "true" && getComputedStyle(document.getElementById("menu-services")).display !== "none"));
await p.keyboard.press("Tab");
check("Tab moves into the open panel", await p.evaluate(() => !!document.activeElement.closest("#menu-services")));
await p.keyboard.press("Escape");
check("Escape closes it and returns focus", await p.evaluate(() => document.querySelector('[aria-controls="menu-services"]').getAttribute("aria-expanded") === "false" && document.activeElement.matches('[aria-controls="menu-services"]')));

/* mobile sheet */
await fresh(375, 812, true);
await p.goto(BASE + "/services/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 400));
check("Tab reaches the menu toggle", await tabTo(".nav-toggle"));
await p.keyboard.press("Enter");
check("Enter opens the mobile sheet", await p.evaluate(() => document.documentElement.classList.contains("nav-open") && getComputedStyle(document.getElementById("nav-main")).display !== "none"));
check("Tab reaches an accordion group in the sheet", await tabTo('.nav-top[aria-controls="menu-work"]', 10));
await p.keyboard.press("Enter");
check("Enter expands the group", await p.evaluate(() => document.querySelector('[aria-controls="menu-work"]').getAttribute("aria-expanded") === "true"));
await p.keyboard.press("Escape");
check("Escape closes the sheet, focus on the toggle", await p.evaluate(() => !document.documentElement.classList.contains("nav-open") && document.activeElement.matches(".nav-toggle")));
check("contact bar shows Call and WhatsApp", await p.evaluate(() => { const c = document.querySelector(".contact-bar"); return getComputedStyle(c).display !== "none" && c.querySelectorAll('a[href^="tel:"], a[href*="wa.me"]').length === 2; }));

/* home tabs */
await fresh(1440, 900);
await p.goto(BASE + "/", { waitUntil: "networkidle0" });
await p.focus("#tab-re");
await p.keyboard.press("ArrowRight");
check("ArrowRight moves to the next industry tab", await p.evaluate(() => document.activeElement.id === "tab-hc" && document.getElementById("tab-hc").getAttribute("aria-selected") === "true" && !document.getElementById("panel-hc").hidden && document.getElementById("panel-re").hidden));
check("all six panels are in the HTML", await p.evaluate(() => document.querySelectorAll('[role="tabpanel"] .work-row').length >= 7));

/* hero pause/play: only when assets/hero/* exist; before then nothing moves, so there is no button */
if (await p.evaluate(() => document.querySelector(".hero-img").dataset.heroVideo === "ready")) {
  await p.focus(".hero-actions .btn.ghost");
  check("Tab reaches the hero pause button", await tabTo(".hero-pause", 3));
  await p.keyboard.press("Enter");
  check("Enter pauses the hero motion", await p.evaluate(() => document.querySelector(".hero-pause").getAttribute("aria-pressed") === "true" && document.querySelector(".hero-img").classList.contains("is-paused")));
  await p.keyboard.press("Space");
  check("Space resumes it", await p.evaluate(() => document.querySelector(".hero-pause").getAttribute("aria-pressed") === "false" && !document.querySelector(".hero-img").classList.contains("is-paused")));
} else {
  await p.focus(".hero-actions .btn.ghost");
  await p.keyboard.press("Tab");
  check("type-only hero: no pause button, Tab moves on", await p.evaluate(() => document.querySelector(".hero-pause").hidden && !document.activeElement.matches(".hero-pause")));
}

/* FAQ accordion */
await p.goto(BASE + "/faq/", { waitUntil: "networkidle0" });
check("Tab reaches an FAQ question", await tabTo("summary", 80));
await p.keyboard.press("Enter");
check("Enter opens the answer", await p.evaluate(() => document.activeElement.parentElement.open === true));

/* enquiry form */
await p.goto(BASE + "/consult/", { waitUntil: "networkidle0" });
await p.focus("#f-name");
await p.keyboard.press("Enter");
await p.click('#enquiry button[type="submit"]');
check("empty submit flags fields and focuses the first", await p.evaluate(() => document.getElementById("f-name").getAttribute("aria-invalid") === "true" && document.getElementById("f-name-err").textContent.length > 0 && document.activeElement.id === "f-name"));
await p.type("#f-name", "Test Owner"); await p.type("#f-email", "owner@example.com"); await p.type("#f-message", "A website for my shop.");
await p.evaluate(() => { window.__mail = null; const d = Object.getOwnPropertyDescriptor(Location.prototype, "href"); });
await p.click('#enquiry button[type="submit"]');
await new Promise(r => setTimeout(r, 400));
check("valid submit falls back to mail (no endpoint set) and says so", await p.evaluate(() => /mail app/i.test(document.querySelector("#enquiry .form-status").textContent)));
check("honeypot is out of the tab order", await p.evaluate(() => document.getElementById("f-website").tabIndex === -1));

/* estimator by keyboard */
await p.goto(BASE + "/estimate/", { waitUntil: "networkidle0" });
check("Tab reaches an estimator option", await tabTo('.est input[type="radio"]', 60));
const before = await p.evaluate(() => document.getElementById("est-weeks")?.textContent);
await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowRight");
const after = await p.evaluate(() => document.getElementById("est-weeks")?.textContent);
check(`arrow keys change the estimate (${before} → ${after})`, before !== after);

await b.close();
console.log(out.join("\n"));
console.log(out.some(l => l.startsWith("FAIL")) ? "KEYBOARD: FAILURES" : "KEYBOARD: ALL PASS");
