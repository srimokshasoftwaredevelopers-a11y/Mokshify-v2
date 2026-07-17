/* ═══════════════════════════════════════════════════════════════
   MOKSHIFY — the scroll-camera engine
   One continuous timeline, ten chapters. Chapters 1–4 are Gemini
   Flow footage (scrubbed by js/cinema.js); this engine directs the
   typography overlays and the built chapters 5–10. Nothing autoplays.
   ═══════════════════════════════════════════════════════════════ */
(() => {
"use strict";

/* ─────────────── helpers ─────────────── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const seg   = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const lerp  = (a, b, t) => a + (b - a) * t;

const E = {
  io : t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2,
  o  : t => 1 - Math.pow(1 - t, 3),
  i  : t => t*t*t,
  ob : t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch   = matchMedia("(hover: none)").matches;
const MOB     = matchMedia("(max-width:1023px)").matches; // the vertical film (phones + portrait tablets)

/* ─────────────── chapters ─────────────── */
const CH = [
  { id:"sc1",  a:0.000, b:0.100, num:"CH.01", name:"The First Line" },
  { id:"sc2",  a:0.100, b:0.175, num:"CH.02", name:"The Studio"     },
  { id:"sc3",  a:0.175, b:0.250, num:"CH.03", name:"Engineering"    },
  { id:"sc4",  a:0.250, b:0.330, num:"CH.04", name:"Into the World" },
  { id:"sc5",  a:0.330, b:0.410, num:"CH.05", name:"Alive"          },
  { id:"sc6",  a:0.410, b:0.630, num:"CH.06", name:"Case Studies"   },
  { id:"sc7",  a:0.630, b:0.720, num:"CH.07", name:"The Pipeline"   },
  { id:"sc8",  a:0.720, b:0.805, num:"CH.08", name:"Engagement"     },
  { id:"sc9",  a:0.805, b:0.875, num:"CH.09", name:"Trust"          },
  { id:"sc10", a:0.875, b:1.000, num:"CH.10", name:"Contact"        },
];
const PAD = 0.012;

// published for the frame cinema (js/cinema.js) — one shared timeline
window.MOKSHIFY = { CH };

/* ─────────────── dom handles ─────────────── */
const root   = document.documentElement;
const scenes = CH.map(c => $("#" + c.id));
const light  = $(".cursor-light");
const railFill = $(".rail-fill");
const railDots = $$(".rail-dot");

const sc5 = scenes[4], sc6 = scenes[5];

const el = {
  // the master shot spans chapters 1–4 (pixels come from cinema.js)
  hero: $(".cinema-hero"), grade: $(".cinema-grade"),
  cap1: $(".sc1-cap"), whisper: $(".sc1-whisper"), cue: $(".scroll-cue"),
  lbars: $$(".lbar"), veil: $(".focus-veil"),
  mems: $$(".mem"), memls: $$(".meml"), nbGlow: $(".nb-glow"),
  draft: $(".drafting"), dmain: $(".d-main"), dgs: $$(".dg"),
  dts: $$(".dt"), dps: $$(".dp"), dds: $$(".dd"), dlabs: $$(".dlab"),
  heroTitle: $(".hero-title"),
  railBox: $(".rail-progress"),
  line2: $(".sc2-line"), cap2: $(".sc2-cap"),
  line3: $(".sc3-line"), cap3: $(".sc3-cap"),
  line4: $(".sc4-line"), cap4: $(".sc4-cap"), pings: $$(".act-ping"),
  // ch5
  engSub: $(".eng-sub"), engLines: $$(".eng-lines b"),
  engChips: $$(".eng-chips li"), engCallout: $(".eng-callout"),
  term: $(".term"), tls: $$(".term-body .tl"),
  nlinks: $$(".nlink"), nnodes: $$(".net-node"),
  mac: $(".mac"), phone: $(".phone5"), tab: $(".tab5"),
  bars: $$(".ui-bar"), spark: $(".spark-line"), sparkFill: $(".spark-fill"),
  donut: $(".donut-arc"),
  line5: $(".sc5-line"), cap5: $(".sc5-cap"),
  // ch6 · case studies — one browser, four live products
  caseBrowser: $(".case-browser"), cbTyped: $(".cb-typed"), cbShot: $(".cb-shot"),
  cbView: $(".cb-view"), cbLoad: $(".cb-load"), cbBar: $(".cb-bar"),
  cbCursor: $(".cb-cursor"), cbUrl: $(".cb-url"),
  cbPhone: $(".cb-phone"), cbpShot: $(".cbp-shot"),
  cases: $$(".case-copy"), cap6: $(".sc6-cap"),
  // ch7 · pipeline
  pipeline: $(".pipeline"), pipePath: $(".pipe-path"), pipeDot: $(".pipe-dot"),
  stages: $$(".pstage"),
  line7: $(".sc7-line"), cap7: $(".sc7-cap"),
  // ch8 · engagement
  engages: $$(".engage"),
  line8: $(".sc8-line"), cap8: $(".sc8-cap"),
  // ch9 · credibility / the engineering ecosystem
  arch: $(".arch"), alines: $$(".aline"), anodes: $$(".anode"),
  tiers: $$(".tier"), packets: $(".arch-packets"), apks: $$(".apk"),
  tlis: $$(".tlist li"), sysStatus: $(".sys-status"),
  archMobile: $(".arch-mobile"), mtiers: $$(".mtier"), mpk: $(".mpk"),
  contactCard: $(".contact-card"),
  line9: $(".sc9-line"), cap9: $(".sc9-cap"),
  // ch10 · contact
  beams: $$(".beam"), mark: $(".final-mark"), brand: $(".close-brand"),
  chws: $$(".ch-w"), closeSub: $(".close-sub"), closeCtas: $(".close-ctas"),
  closeMeta: $(".close-meta"), closeForm: $(".close-form"), foot: $(".final-foot"),
};

/* the hero headline splits into words so it can breathe around the cursor */
const heroH1 = $(".hero-title h1");
let hws = [];
if (heroH1 && !touch && !reduced) {
  const wrapWords = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else {
            const s = document.createElement("span");
            s.className = "hw";
            s.textContent = part;
            frag.appendChild(s);
          }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  };
  wrapWords(heroH1);
  hws = $$(".hw", heroH1);
}

/* pipeline node coordinates, % of the .pipe-stages box (must match markup) */
const PIPE_PTS = [
  [6.25, 64.3], [18.75, 35.7], [31.25, 64.3], [43.75, 35.7],
  [56.25, 64.3], [68.75, 35.7], [81.25, 64.3], [93.75, 35.7],
];

/* ─────────────── counters ─────────────── */
const counters = $$("[data-count]").map(b => ({
  el: b,
  to: parseFloat(b.dataset.count),
  from: parseFloat(b.dataset.from || 0),
  dec: parseInt(b.dataset.decimals || 0, 10),
  pre: b.dataset.prefix || "",
  suf: b.dataset.suffix || "",
  last: null,
}));
function runCounter(c, t) {
  const v = lerp(c.from, c.to, E.o(t));
  const txt = c.pre + v.toLocaleString("en-IN",
    { minimumFractionDigits: c.dec, maximumFractionDigits: c.dec }) + c.suf;
  if (txt !== c.last) { c.el.textContent = txt; c.last = txt; }
}
const countersIn = elm => counters.filter(c => elm.contains(c.el));
const cCase = el.cases.map(p => countersIn(p));

/* ── the case reel: four live products, one browser that travels ──
   each case has its own camera path: from → hold, then it morphs
   toward the next case's opening pose. urls and shots are real. */
/* poses are LOCAL offsets around the right-column anchor (px / degrees) —
   the grid owns placement; the camera only ever moves the object itself */
const CASES = [
  { url: "fincalix.com",            img: "assets/sites/fincalix.webp",
    from: { x:  60, y: 180, rx: 14, ry:   0, s: .9  },
    hold: { x:   0, y:   0, rx:  1, ry:  -6, s: 1   } },
  { url: "medicodiagnostics.in",    img: "assets/sites/medico.webp",
    from: { x: -220, y: 40, rx:  0, ry:  18, s: .88 },
    hold: { x:   0, y:   0, rx:  0, ry:   7, s: 1   } },
  { url: "terravionproperties.com", img: "assets/sites/terravion.webp",
    from: { x: 140, y: 200, rx: 22, ry: -10, s: .86 },
    hold: { x:   0, y:  10, rx:  4, ry:  -6, s: .99 } },
  { url: "skillforcehub.com",       img: "assets/sites/skillforce.webp",
    from: { x:   0, y: -70, rx: -8, ry:   0, s: .64 },
    hold: { x:   0, y:   0, rx:  1, ry:  -5, s: .98 } },
];
const CASE_OUT = { x: 0, y: -200, rx: -12, ry: 0, s: .78 };
/* where the visitor's cursor travels and clicks, per case (% of viewport) */
const CASE_CLICK = [
  { fx: 46, fy: 62, tx: 80, ty: 12 },  // fincalix → the Play-store badge
  { fx: 60, fy: 70, tx: 16, ty: 30 },  // medico → book a test
  { fx: 40, fy: 66, tx: 18, ty: 58 },  // terravion → view projects
  { fx: 55, fy: 72, tx: 22, ty: 62 },  // skillforce → explore tracks
];
let caseIdx = -1;

/* the deploy terminal script (ch5) */
const TERM_LINES = [
  "$ mokshify deploy --prod",
  "▸ build ✓  14.2s · 312 tests passed",
  "▸ ai review ✓  0 blocking issues",
  "▸ cloud sync ✓ · api live ✓",
  "● deployed — fleet healthy 99.98%",
];

/* ─────────────── generic movers ─────────────── */
function pose(elm, { x = 0, y = 0, s = 1, r = 0, o = null } = {}) {
  elm.style.transform = `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`;
  if (o !== null) elm.style.opacity = o;
}
/* enter (rise) then exit (lift away) — motion + opacity together */
function inOut(elm, t, a1, a2, b1, b2, dist = 44) {
  const ti = E.o(seg(t, a1, a2)), to = E.i(seg(t, b1, b2));
  pose(elm, { y: (1 - ti) * dist - to * dist, o: ti * (1 - to) });
}
const setVar = (elm, k, v) => elm.style.setProperty(k, v);

/* the virtual camera over the master shot: push toward the notebook,
   breathe with the founder, drift, orbit the blueprint, settle */
function heroShot(p, time) {
  const t1 = seg(p, CH[0].a, CH[0].b);
  const t2 = seg(p, CH[1].a, CH[1].b);
  const t3 = seg(p, CH[2].a, CH[2].b);
  const t4 = seg(p, CH[3].a, CH[3].b);
  // subtle breathing while he sits with the closed notebook
  const breath = (reduced || t1 >= 1) ? 0 : Math.sin(time / 2400) * .0016 * (1 - t1);
  const s = 1 + E.io(t1) * .05 + breath + t2 * .025 + t3 * .045 - t4 * .04;
  // the cursor steers the set itself — founder and desk drift up to 6px,
  // fading out as the scroll-film takes the camera
  const alive = (touch || reduced) ? 0 : 1 - E.io(t1);
  // the push-in aims at the notebook (lower third), not the frame centre
  const ty = -(s - 1) * vh * .3 * (1 - t3) * (1 - t4) + cmy * 4 * alive;
  const r = Math.sin(t3 * Math.PI) * .9 * (1 - t4);
  const x = Math.sin(t2 * Math.PI) * vw * .008 - Math.sin(t3 * Math.PI) * vw * .01
          + cmx * 6 * alive;
  el.hero.style.transform =
    `translate3d(${x.toFixed(1)}px,${ty.toFixed(1)}px,0) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;

  // the frame grades darker only while cream lettering is on screen
  const gTitle = E.io(seg(time, 350, 1300)) * (1 - E.io(seg(t1, .04, .1)));
  const gWhisper = E.o(seg(t1, .8, .9)) * (1 - seg(t1, .99, 1));
  const gLine = (u) => E.io(seg(u, .26, .36)) * (1 - E.io(seg(u, .74, .84)));
  const grade = Math.max(gTitle, gWhisper, gLine(t2), gLine(t3), gLine(t4)) * .34;
  el.grade.style.opacity = grade.toFixed(3);
}

/* ─────────────── scroll + pointer state ─────────────── */
let vw = innerWidth, vh = innerHeight, maxScroll = 1;
let target = 0, cur = -0.0001;           // force first render
let mx = 0, my = 0, cmx = 0, cmy = 0;    // pointer raw / lerped
let lx = -600, ly = -600, clx = -600, cly = -600; // cursor light

function measure() {
  vw = innerWidth; vh = innerHeight;
  // the film owns exactly its track; the credits ending after it never remaps timing
  const track = $(".scroll-space");
  maxScroll = Math.max(1, (track ? track.offsetHeight : document.body.scrollHeight) - vh);
}
addEventListener("resize", measure, { passive: true });

let frozen = false; // freeze-frame debug mode (?f=…)
addEventListener("scroll", () => {
  if (!frozen) target = clamp(scrollY / maxScroll, 0, 1);
}, { passive: true });

if (!touch) {
  addEventListener("pointermove", e => {
    mx = (e.clientX / vw) * 2 - 1;
    my = (e.clientY / vh) * 2 - 1;
    lx = e.clientX; ly = e.clientY;
    magnetTrack(e);
  }, { passive: true });
}

/* ─────────────── magnetic buttons ─────────────── */
const magnets = $$(".btn.magnetic");
function magnetTrack(e) {
  for (const b of magnets) {
    const r = b.getBoundingClientRect();
    if (!r.width) continue;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const d = Math.hypot(dx, dy), R = 110;
    if (d < R) {
      const pull = (1 - d / R) * .42;
      setVar(b, "--bx", (dx * pull).toFixed(1) + "px");
      setVar(b, "--by", (dy * pull).toFixed(1) + "px");
      setVar(b, "--shx", (dx / r.width).toFixed(2));
    } else {
      setVar(b, "--bx", "0px"); setVar(b, "--by", "0px");
    }
  }
}

/* ─────────────── rail dots + nav anchors: seek the film ─────────────── */
railDots.forEach(d => d.addEventListener("click", () => {
  scrollTo({ top: parseFloat(d.dataset.goto) * maxScroll, behavior: "auto" });
}));
$$(".nav-link[data-goto]").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  scrollTo({ top: parseFloat(a.dataset.goto) * maxScroll, behavior: "auto" });
}));

/* ─────────────── the mobile shell: fullscreen menu + contact bar ─────────────── */
const mnavBtn = $(".mnav-btn"), mnav = $(".mnav"), mbar = $(".mbar");
function mnavSet(open) {
  mnav.classList.toggle("open", open);
  mnavBtn.classList.toggle("x", open);
  mnavBtn.setAttribute("aria-expanded", String(open));
  mnavBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  mnav.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("mnav-open", open);
  if (touch && navigator.vibrate) navigator.vibrate(6);
}
mnavBtn.addEventListener("click", () => mnavSet(!mnav.classList.contains("open")));
addEventListener("keydown", e => {
  if (e.key === "Escape" && mnav.classList.contains("open")) mnavSet(false);
});
$$(".mnav-link").forEach(a => a.addEventListener("click", e => {
  if (!a.dataset.goto) { mnavSet(false); return; } // real page links navigate normally
  e.preventDefault();
  mnavSet(false);
  scrollTo({ top: parseFloat(a.dataset.goto) * maxScroll, behavior: "auto" });
}));

// the bar steps aside while reading down, returns on the first scroll up
let lastY = scrollY;
addEventListener("scroll", () => {
  const y = scrollY;
  if (y > lastY + 8 && y > vh * .4) mbar.classList.add("hide");
  else if (y < lastY - 8 || y <= vh * .4) mbar.classList.remove("hide");
  lastY = y;
}, { passive: true });

/* ─────────────── chapter renderers ─────────────── */

/* CH1 — three acts: he observes · he decides · the line answers */
function ch1(t, time) {
  // secondary UI holds back until the opening interaction has landed
  const uiIn = Math.max(seg(time, 2600, 3800), seg(t, .1, .16));
  inOut(el.cap1, t, .12, .2, .82, .92, 26);
  el.cap1.style.opacity = Math.min(parseFloat(el.cap1.style.opacity || 0), uiIn).toFixed(3);
  el.cue.style.opacity = (seg(time, 2200, 3400) * (1 - seg(t, 0, .07))).toFixed(3);
  el.cue.style.transform = `translateX(-50%) translateY(${seg(t, 0, .07) * 30}px)`;

  // the opening title card: resolves into focus, yields as the film begins
  el.heroTitle.classList.toggle("on", time > 350 && t < .055);

  /* ── the hero is alive: cursor-lit layers, before the film takes over ── */
  const settle = 1 - E.io(seg(t, .05, .12)); // the effect hands the frame to the film
  if (!touch && !reduced) {
    // typography drifts against the set — one to two pixels, opposite the camera
    setVar(el.heroTitle, "--hpx", (cmx * -2.2 * settle).toFixed(2) + "px");
    setVar(el.heroTitle, "--hpy", (cmy * -1.6 * settle).toFixed(2) + "px");
    // near the title, the words ease apart; away, they settle home
    const prox = clamp(1 - Math.hypot(clx - vw * .5, cly - vh * .36) / (vw * .3), 0, 1) * settle;
    const mid = (hws.length - 1) / 2;
    hws.forEach((w, i) =>
      w.style.transform = `translateX(${((i - mid) * prox * 1.3).toFixed(2)}px)`);
  }
  // the notebook notices a visiting cursor…
  const nbNear = (touch || reduced) ? 0 :
    clamp(1 - Math.hypot(clx - vw * .47, cly - vh * .78) / (vw * .22), 0, 1) * settle;
  // …and offers one quiet hint at four seconds, before any scroll
  const hint = reduced ? 0 :
    E.io(seg(time, 4200, 5000)) * (1 - E.io(seg(time, 5600, 6400))) * (cur < .012 ? 1 : 0);

  // letterbox: open for act one, breathe back in while he decides, release
  const open = E.io(seg(t, .04, .2));
  const think = Math.sin(E.io(seg(t, .42, .56)) * Math.PI * .5) * (1 - E.io(seg(t, .8, .9)));
  el.lbars.forEach(b => setVar(b, "--lb", ((1 - open) + think * .4).toFixed(3)));
  setVar(el.veil, "--veil", think.toFixed(3));
  document.body.classList.toggle("titleframe", open < .5);

  /* ── act one: memories orbit gently, slow to a stop, connect, release ── */
  const orbitPhase = E.o(seg(t, 0, .34));        // decelerates to stillness — he observes
  const mfade = E.o(seg(t, .08, .16)) * (1 - E.io(seg(t, .34, .44))) * .68; // low-opacity context
  const spread = 1 + E.i(seg(t, .36, .5)) * .45; // they let go before the notebook wakes
  const centers = [];
  el.mems.forEach((m, i) => {
    const a = (i / el.mems.length) * Math.PI * 2 + orbitPhase * Math.PI * .5 + .55;
    const depth = (Math.sin(a) + 1) / 2;         // 0 back · 1 front
    const cx = vw * .5 + Math.cos(a) * vw * .3 * spread;
    const cy = vh * .42 + Math.sin(a * 2) * vh * .15 * spread + Math.sin(time / 1600 + i) * 4;
    centers.push([cx, cy]);
    m.style.transform =
      `translate3d(${(cx - m.offsetWidth / 2).toFixed(1)}px,${(cy - m.offsetHeight / 2).toFixed(1)}px,0)` +
      ` scale(${(.8 + depth * .24).toFixed(3)})`;
    m.style.opacity = (mfade * (.42 + depth * .58)).toFixed(3);
  });

  // once still, thin maroon drafting lines connect the memories
  const lkIn = E.o(seg(t, .26, .32)) * (1 - E.io(seg(t, .36, .44)));
  el.memls.forEach((lk, i) => {
    const a = centers[i], b = centers[(i + 1) % centers.length];
    if (a && b) {
      lk.setAttribute("x1", a[0].toFixed(0)); lk.setAttribute("y1", a[1].toFixed(0));
      lk.setAttribute("x2", b[0].toFixed(0)); lk.setAttribute("y2", b[1].toFixed(0));
    }
    setVar(lk, "--lk", (lkIn * .7).toFixed(3));
  });

  // the notebook wakes: a breath of maroon at the decision, brighter as the line arrives
  const wake = E.o(seg(t, .38, .46)) * (1 - E.io(seg(t, .52, .6)));
  const receive = E.o(seg(t, .8, .88)) * (1 - E.io(seg(t, .93, 1)));
  const pulse = reduced ? 0 : Math.sin(time / 1100) * .06;
  setVar(el.nbGlow, "--glow",
    (Math.max(wake * .6, receive, nbNear * .42, hint * .55) + pulse * Math.max(wake, hint)).toFixed(3));

  /* ── act two: architectural drafting — one line becomes a measured study ── */
  const u = seg(t, .42, .92);
  el.draft.style.opacity = (E.o(seg(u, 0, .1)) * (1 - E.i(seg(u, .94, 1)))).toFixed(3);
  // the finished study flows down into the notebook
  const sink = E.io(seg(u, .8, 1));
  el.draft.style.transform =
    `translateY(${(sink * vh * .34).toFixed(1)}px) scale(${(1 - sink * .62).toFixed(3)})`;

  if (u > 0 && u < 1.01) {
    // one maroon pencil line appears, then extends
    setVar(el.dmain, "--draw", E.io(seg(u, .02, .17)).toFixed(4));
    // the construction grid rules itself in
    el.dgs.forEach((g, i) =>
      setVar(g, "--draw", E.io(seg(u, .12 + i * .018, .26 + i * .018)).toFixed(3)));
    // measurement ticks
    el.dts.forEach((k, i) =>
      setVar(k, "--draw", E.o(seg(u, .28 + i * .014, .36 + i * .014)).toFixed(3)));
    // golden-ratio guides: rectangle and subdivisions, then the quarter arcs
    el.dps.forEach((p, i) => {
      const arc = i >= 4;
      const a = arc ? .5 + (i - 4) * .05 : .38 + i * .03;
      setVar(p, "--draw", E.io(seg(u, a, a + (arc ? .12 : .1))).toFixed(3));
    });
    // dimensions animate, figures rise with them
    el.dds.forEach((d, i) =>
      setVar(d, "--draw", E.io(seg(u, .62 + i * .04, .72 + i * .04)).toFixed(3)));
    el.dlabs.forEach((l, i) => {
      const v = E.o(seg(u, .68 + i * .04, .76 + i * .04));
      l.style.opacity = v.toFixed(3);
      l.style.transform = `translateY(${((1 - v) * 6).toFixed(1)}px)`;
    });
  }

  /* ── act three: the answer, as the pencil meets paper ── */
  el.whisper.classList.toggle("on", t > .84);
}

/* CH2 — inside the studio */
function ch2(t) {
  el.line2.classList.toggle("on", t > .3 && t < .78);
  inOut(el.cap2, t, .05, .15, .8, .9, 26);
}

/* CH3 — precision engineering */
function ch3(t) {
  el.line3.classList.toggle("on", t > .3 && t < .78);
  inOut(el.cap3, t, .05, .15, .8, .9, 26);
}

/* CH4 — the live product switches real businesses on */
function ch4(t) {
  el.line4.classList.toggle("on", t > .3 && t < .78);
  el.pings.forEach((p, i) => {
    const a = .34 + i * .14;
    const v = E.ob(seg(t, a, a + .1)) * (1 - E.i(seg(t, .86, .94)));
    p.style.opacity = clamp(v, 0, 1).toFixed(3);
    p.style.transform = `translateY(${((1 - clamp(v, 0, 1)) * 14).toFixed(1)}px) scale(${(0.9 + clamp(v, 0, 1) * .1).toFixed(3)})`;
  });
  inOut(el.cap4, t, .05, .15, .8, .9, 26);
}

/* CH5 — the software breathes */
function ch5(t, time) {
  const exit = E.i(seg(t, .88, 1));
  // the scene fades as it zooms, so ch6 never stacks on top of it
  pose(sc5, { s: 1 + exit * .9, y: -exit * vh * .1, o: 1 - exit });

  const bob = reduced ? 0 : Math.sin(time / 900) * 5;

  if (MOB) { ch5Mobile(t, bob); return; }

  const macIn = E.o(seg(t, .02, .26));
  el.mac.style.transform =
    `translateY(${(1 - macIn) * vh * .3 + bob * .4 - vh * .21}px) scale(${lerp(.72, 1, macIn)})`;
  el.mac.style.opacity = macIn;
  setVar(el.mac, "--lid", E.io(seg(t, .12, .38)).toFixed(3));

  setVar(el.spark, "--draw", seg(t, .3, .58).toFixed(3));
  setVar(el.sparkFill, "--draw", seg(t, .3, .58).toFixed(3));
  el.bars.forEach((b, i) => setVar(b, "--grow", E.ob(seg(t, .34 + i * .03, .5 + i * .03)).toFixed(3)));

  const phIn = E.o(seg(t, .28, .52));
  el.phone.style.transform =
    `translate3d(${(1 - phIn) * vw * .3}px, ${-vh * .28 + bob}px, 0)` +
    ` rotate(${lerp(10, 4, phIn)}deg) scale(${lerp(.8, 1, phIn)})`;
  el.phone.style.opacity = phIn;

  const tbIn = E.o(seg(t, .34, .58));
  el.tab.style.transform =
    `translate3d(${-(1 - tbIn) * vw * .3}px, ${-vh * .26 - bob}px, 0)` +
    ` rotate(${lerp(-10, -4, tbIn)}deg) scale(${lerp(.8, 1, tbIn)})`;
  el.tab.style.opacity = tbIn;
  setVar(el.donut, "--draw", E.o(seg(t, .44, .66)).toFixed(3));

  // engineering activity: API / cloud / AI wiring lights up around the devices
  const leave5 = 1 - E.i(seg(t, .86, .96));
  el.nlinks.forEach((l, i) =>
    setVar(l, "--draw", (E.o(seg(t, .48 + i * .04, .62 + i * .04)) * leave5).toFixed(3)));
  el.nnodes.forEach((n, i) =>
    setVar(n, "--pop", (E.ob(seg(t, .52 + i * .06, .64 + i * .06)) * leave5).toFixed(3)));

  // the deploy terminal types itself — build, tests, ai review, ship
  const tin = E.o(seg(t, .42, .52)) * leave5;
  el.term.style.opacity = tin.toFixed(3);
  el.term.style.transform = `translateY(${((1 - tin) * 30).toFixed(1)}px)`;
  el.tls.forEach((ln, i) => {
    const full = TERM_LINES[i];
    const a = .48 + i * .07;
    const n = Math.round(full.length * seg(t, a, a + .06));
    const txt = full.slice(0, n);
    if (ln.textContent !== txt) ln.textContent = txt;
  });

  el.line5.classList.toggle("on", t > .48 && t < .88);

  // the differentiator and capability rail settle in under the heading
  const sub5 = E.o(seg(t, .54, .64)) * leave5;
  el.engSub.style.opacity = sub5.toFixed(3);
  el.engSub.style.transform = `translateY(${((1 - sub5) * 20).toFixed(1)}px)`;
  el.engLines.forEach((b, i) => {
    const v = E.o(seg(t, .58 + i * .04, .66 + i * .04)) * leave5;
    b.style.opacity = v.toFixed(3);
    b.style.transform = `translateY(${((1 - v) * 16).toFixed(1)}px)`;
  });
  el.engChips.forEach((c, i) => {
    const v = E.ob(seg(t, .64 + i * .03, .72 + i * .03)) * leave5;
    c.style.opacity = clamp(v, 0, 1).toFixed(3);
    c.style.transform = `translateY(${((1 - clamp(v, 0, 1)) * 14).toFixed(1)}px)`;
  });

  // the chapter's last word, as the devices give way to the portfolio
  const co = E.o(seg(t, .88, .96));
  el.engCallout.style.opacity = co.toFixed(3);
  el.engCallout.style.transform =
    `translate(-50%,-50%) translateY(${((1 - co) * 30).toFixed(1)}px)`;

  inOut(el.cap5, t, .05, .15, .82, .92, 26);
}

/* CH5 on the phone — a vertical film: laptop ↓ tablet ↓ phone, one idea
   per screen; each device fully leaves before the next arrives, then the
   deploy terminal slides up underneath. Desktop never runs this. */
function ch5Mobile(t, bob) {
  const dwin = (a, b) => {
    const en  = E.o(seg(t, a, a + .09));
    const out = E.i(seg(t, b - .07, b));
    return { y: (1 - en) * vh * .14 - out * vh * .12,
             s: .92 + en * .08 - out * .05, o: en * (1 - out) };
  };

  const m = dwin(.04, .36);
  el.mac.style.transform = `translateY(${(m.y + bob * .4).toFixed(1)}px) scale(${m.s.toFixed(3)})`;
  el.mac.style.opacity = m.o.toFixed(3);
  setVar(el.mac, "--lid", E.io(seg(t, .07, .2)).toFixed(3));
  setVar(el.spark, "--draw", seg(t, .1, .3).toFixed(3));
  setVar(el.sparkFill, "--draw", seg(t, .1, .3).toFixed(3));
  el.bars.forEach((b, i) => setVar(b, "--grow", E.ob(seg(t, .12 + i * .02, .24 + i * .02)).toFixed(3)));

  const tb = dwin(.34, .62);
  el.tab.style.transform = `translateY(${(tb.y - bob * .5).toFixed(1)}px) scale(${tb.s.toFixed(3)})`;
  el.tab.style.opacity = tb.o.toFixed(3);
  setVar(el.donut, "--draw", E.o(seg(t, .4, .54)).toFixed(3));

  const ph = dwin(.6, .88);
  el.phone.style.transform = `translateY(${(ph.y + bob).toFixed(1)}px) scale(${ph.s.toFixed(3)})`;
  el.phone.style.opacity = ph.o.toFixed(3);

  // the terminal slides up underneath and deploys
  const tin = E.o(seg(t, .78, .86)) * (1 - E.i(seg(t, .97, 1)));
  el.term.style.opacity = tin.toFixed(3);
  el.term.style.transform = `translateY(${((1 - tin) * 40).toFixed(1)}px)`;
  el.tls.forEach((ln, i) => {
    const full = TERM_LINES[i];
    const n = Math.round(full.length * seg(t, .8 + i * .028, .84 + i * .028));
    const txt = full.slice(0, n);
    if (ln.textContent !== txt) ln.textContent = txt;
  });

  el.line5.classList.toggle("on", t > .03 && t < .74);

  const co = E.o(seg(t, .9, .97));
  el.engCallout.style.opacity = co.toFixed(3);
  el.engCallout.style.transform =
    `translate(-50%,-50%) translateY(${((1 - co) * 30).toFixed(1)}px)`;

  inOut(el.cap5, t, .05, .15, .82, .92, 26);
}

/* CH6 — four cinematic case scenes; each fully exits before the next enters */
function ch6(t, time) {
  const g = clamp(t * 4, 0, 3.9999);
  const i = Math.floor(g), lt = g - i;
  const c = CASES[i];

  // the shot swaps only under the load veil, so it never cuts on camera
  if (caseIdx !== i) {
    caseIdx = i;
    el.cbShot.src = c.img;
    el.cbpShot.src = c.img;
    el.cbShot.style.transform = "translateY(0px)";
  }

  // camera: enter → hold (with breath) → morph toward the next opening pose
  const enter = E.io(seg(lt, 0, .24));
  const leave = E.io(seg(lt, .84, 1));
  const nxt = CASES[i + 1] ? CASES[i + 1].from : CASE_OUT;
  const P = {};
  for (const k of ["x", "y", "rx", "ry", "s"]) {
    P[k] = lerp(lerp(c.from[k], c.hold[k], enter), nxt[k], leave);
  }
  const alive = enter * (1 - leave);
  const breathe = reduced ? 0 : Math.sin(time / 2100) * .5 * alive;
  const bob = reduced ? 0 : Math.sin(time / 1700) * 6 * alive;
  el.caseBrowser.style.transform =
    `translate3d(${P.x.toFixed(1)}px,${(P.y + bob).toFixed(1)}px,0)` +
    ` rotateX(${P.rx.toFixed(2)}deg) rotateY(${(P.ry + breathe).toFixed(2)}deg) scale(${P.s.toFixed(4)})`;

  // the address bar types the real url, then the page loads
  const chars = Math.round(c.url.length * seg(lt, .04, .2));
  const typed = c.url.slice(0, chars);
  if (el.cbTyped.textContent !== typed) el.cbTyped.textContent = typed;
  // …enter is pressed, the page loads
  setVar(el.cbUrl, "--ent", (E.o(seg(lt, .2, .22)) * (1 - E.o(seg(lt, .24, .3)))).toFixed(3));
  const loaded = E.o(seg(lt, .22, .3));
  el.cbLoad.style.opacity = Math.max(1 - loaded, E.o(seg(lt, .94, 1))).toFixed(3);
  setVar(el.cbBar, "--pb", seg(lt, .06, .28).toFixed(3));
  el.cbBar.style.opacity = (1 - loaded).toFixed(3);

  // the pocket preview arrives once the desktop read-through is underway
  const ph = E.ob(seg(lt, .56, .68)) * (1 - E.io(seg(lt, .82, .9)));
  el.cbPhone.style.opacity = clamp(ph, 0, 1).toFixed(3);
  el.cbPhone.style.transform =
    `translateY(${((1 - clamp(ph, 0, 1)) * 40).toFixed(1)}px) rotate(${(4 - clamp(ph, 0, 1) * 4).toFixed(2)}deg)`;

  // once loaded, the page browses itself — a slow read-through scroll
  const maxY = Math.max(0, el.cbShot.clientHeight - el.cbView.clientHeight);
  const scrollP = E.io(seg(lt, .34, .82));
  el.cbShot.style.transform = `translateY(${(-maxY * scrollP).toFixed(1)}px)`;

  // the visitor's cursor drifts to a CTA and clicks it
  const cc0 = CASE_CLICK[i];
  const cIn = E.o(seg(lt, .5, .58)) * (1 - E.io(seg(lt, .8, .86)));
  const move = E.io(seg(lt, .52, .68));
  const cx = lerp(cc0.fx, cc0.tx, move) / 100 * el.cbView.clientWidth;
  const cy = lerp(cc0.fy, cc0.ty, move) / 100 * el.cbView.clientHeight;
  el.cbCursor.style.opacity = cIn.toFixed(3);
  el.cbCursor.style.transform =
    `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) scale(${(1 - E.o(seg(lt, .7, .74)) * .25 + E.o(seg(lt, .74, .78)) * .25).toFixed(3)})`;
  setVar(el.cbCursor, "--click", E.io(seg(lt, .7, .8)).toFixed(3));

  // copy: on only inside its own quarter — no overlaps, ever
  el.cases.forEach((cc, k) => cc.classList.toggle("on", k === i && lt > .1 && lt < .86));
  cCase[i].forEach(cc => runCounter(cc, seg(lt, .14, .55)));

  inOut(el.cap6, t, .01, .05, .95, .99, 26);
  // on the phone the browser sits mid-frame, so it may not pre-roll into ch5
  // every viewport: the case stage fades in only once ch5 has fully left
  sc6.style.opacity = E.o(seg(t, .001, .02)) * (1 - E.i(seg(t, .97, 1)));
  sc6.style.transform = `scale(${1 + E.i(seg(t, .95, 1)) * .3})`;
}

/* CH7 — the pipeline: idea → scale as one continuous line */
function ch7(t) {
  const draw = E.io(seg(t, .06, .62));
  setVar(el.pipePath, "--draw", draw.toFixed(4));

  // stage pucks pop as the ink reaches them
  el.stages.forEach((s, i) => {
    setVar(s, "--pop", E.ob(seg(t, .08 + i * .052, .18 + i * .052)).toFixed(3));
  });

  // the product-dot rides the line, then swells into the next chapter
  const prog = clamp(draw * (PIPE_PTS.length - 1), 0, PIPE_PTS.length - 1);
  const i0 = Math.min(Math.floor(prog), PIPE_PTS.length - 2);
  const f = prog - i0;
  const x = lerp(PIPE_PTS[i0][0], PIPE_PTS[i0 + 1][0], f);
  const y = lerp(PIPE_PTS[i0][1], PIPE_PTS[i0 + 1][1], f)
          - Math.sin(f * Math.PI) * 9 * (PIPE_PTS[i0][1] > PIPE_PTS[i0 + 1][1] ? 1 : -1);
  const swell = 1 + E.i(seg(t, .86, 1)) * 26;
  el.pipeDot.style.transform =
    `translate(${(x / 100 * el.pipeline.clientWidth).toFixed(1)}px, ${(y / 100 * el.pipeline.clientHeight).toFixed(1)}px) scale(${swell.toFixed(2)})`;
  el.pipeDot.style.opacity = E.o(seg(t, .06, .12)) * (1 - E.i(seg(t, .96, 1)));

  const scale = 1 + E.i(seg(t, .9, 1)) * .25;
  el.pipeline.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(3)})`;

  el.line7.classList.toggle("on", t > .04 && t < .88);
  inOut(el.cap7, t, .04, .14, .84, .94, 26);
}

/* CH8 — engagement models assemble like dealt cards */
function ch8(t) {
  el.engages.forEach((c, i) => {
    const enter = E.ob(seg(t, .1 + i * .08, .3 + i * .08));
    const leave = E.i(seg(t, .88, 1));
    setVar(c, "--in", (enter * (1 - leave)).toFixed(3));
  });
  el.line8.classList.toggle("on", t > .04 && t < .9);
  inOut(el.cap8, t, .04, .14, .86, .96, 26);
}

/* packet routes through the ecosystem: index into el.alines */
const PACKET_ROUTES = [1, 5, 7, 14];
let archRoutes = null;

/* CH9 — credibility: the production ecosystem assembles itself */
function ch9(t, time) {
  const leave = 1 - E.i(seg(t, .88, 1));

  if (MOB) {
    // the vertical architecture: tiers appear, connectors draw,
    // one request travels the whole stack top to bottom
    el.mtiers.forEach((m, i) => {
      setVar(m, "--pop", (E.ob(seg(t, .05 + i * .055, .15 + i * .055)) * leave).toFixed(3));
      if (i) setVar(m, "--ln", (E.io(seg(t, .1 + i * .055, .17 + i * .055)) * leave).toFixed(3));
    });
    const gate = E.o(seg(t, .5, .6)) * leave;
    const u = ((time / 1000) % 3.4) / 3.4;
    const first = el.mtiers[0], last = el.mtiers[el.mtiers.length - 1];
    const y0 = first.offsetTop + 10;
    const y1 = last.offsetTop + last.offsetHeight - 18;
    el.mpk.style.transform = `translateY(${(y0 + E.io(u) * (y1 - y0)).toFixed(1)}px)`;
    el.mpk.style.opacity = (gate * clamp(Math.sin(u * Math.PI) * 4, 0, 1)).toFixed(3);

    el.line9.classList.toggle("on", t > .04 && t < .9);
    inOut(el.cap9, t, .04, .14, .86, .96, 26);
    return;
  }

  // one node at a time, row by row
  el.anodes.forEach((n, i) =>
    setVar(n, "--pop", (E.ob(seg(t, .05 + i * .018, .14 + i * .018)) * leave).toFixed(3)));
  // connections draw after their rows exist
  el.alines.forEach((l, i) =>
    setVar(l, "--draw", (E.io(seg(t, .34 + i * .022, .46 + i * .022)) * leave).toFixed(3)));
  el.tiers.forEach((n, i) =>
    setVar(n, "--tin", (E.o(seg(t, .07 + i * .05, .17 + i * .05)) * leave).toFixed(3)));
  setVar(el.packets, "--pk", (E.o(seg(t, .68, .78)) * leave).toFixed(3));

  // packets: one at a time, easing out of a node and braking into the next
  const pkGate = E.o(seg(t, .68, .78)) * leave;
  if (!archRoutes) archRoutes = PACKET_ROUTES.map(r =>
    ({ p: el.alines[r], L: el.alines[r].getTotalLength() }));
  const cyc = (time / 1000) % 9;
  el.apks.forEach((c, k) => {
    const u0 = (cyc - k * 2.25) / 1.7;
    const live = pkGate > 0 && u0 >= 0 && u0 <= 1;
    if (live) {
      const r = archRoutes[k];
      const pt = r.p.getPointAtLength(E.io(u0) * r.L);
      c.setAttribute("cx", pt.x.toFixed(1));
      c.setAttribute("cy", pt.y.toFixed(1));
    }
    c.style.opacity = live ? pkGate.toFixed(3) : "0";
  });

  // once the system is assembled, it reports in
  const st = E.o(seg(t, .66, .76)) * leave;
  el.sysStatus.style.opacity = st.toFixed(3);
  el.sysStatus.style.transform = `translateY(${((1 - st) * 14).toFixed(1)}px)`;

  // the left rail fills in, one line of the story at a time
  el.tlis.forEach((li, i) => {
    const v = E.o(seg(t, .08 + i * .022, .16 + i * .022)) * leave;
    li.style.opacity = v.toFixed(3);
    li.style.transform = `translateX(${((1 - v) * -14).toFixed(1)}px)`;
  });

  const scale = 1 + E.i(seg(t, .9, 1)) * .18;
  el.arch.style.transform =
    `scale(${scale.toFixed(3)}) rotateY(${(cmx * 1.2).toFixed(2)}deg) rotateX(${(cmy * -.8).toFixed(2)}deg)`;

  el.line9.classList.toggle("on", t > .04 && t < .9);
  inOut(el.cap9, t, .04, .14, .86, .96, 26);
}

/* CH10 — the close: every thread converges on one invitation */
function ch10(t) {
  el.beams.forEach((b, i) => {
    const grow = E.o(seg(t, .02 + i * .025, .18 + i * .025));
    const gone = E.i(seg(t, .24 + i * .02, .38 + i * .02));
    setVar(b, "--beam", (grow * (1 - gone)).toFixed(3));
    b.style.opacity = 1 - gone;
  });

  setVar(el.mark, "--mark", E.ob(seg(t, .08, .22)).toFixed(3));
  const bi = E.o(seg(t, .08, .2));
  el.brand.style.opacity = bi;
  el.brand.style.transform = `translateY(${((1 - bi) * 20).toFixed(1)}px)`;

  el.chws.forEach((w, i) => {
    const wi = E.ob(seg(t, .14 + i * .07, .3 + i * .07));
    w.style.transform = `translateY(${((1 - wi) * 46).toFixed(1)}px) rotate(${((1 - wi) * -2.5).toFixed(2)}deg)`;
    w.style.opacity = clamp(wi, 0, 1);
  });

  [[el.closeSub, .3], [el.closeCtas, .36], [el.closeMeta, .44]].forEach(([n, a]) => {
    const v = E.o(seg(t, a, a + .14));
    n.style.transform = `translateY(${((1 - v) * 34).toFixed(1)}px)`;
    n.style.opacity = v;
  });

  setVar(el.closeForm, "--in", E.o(seg(t, .3, .5)).toFixed(3));

  const fv = E.o(seg(t, .5, .62));
  el.foot.style.opacity = fv;
  el.foot.style.transform = `translateY(${((1 - fv) * 20).toFixed(1)}px)`;
}

const RENDER = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10];

/* ─────────────── nav chapter label + rail ─────────────── */
let activeCh = -1;
function chapterUi(p) {
  p = clamp(p, 0, 1);
  let idx = CH.findIndex(c => p >= c.a && p < c.b);
  if (idx === -1) idx = CH.length - 1;
  if (idx !== activeCh) {
    activeCh = idx;
    railDots.forEach((d, k) => d.classList.toggle("active", k === idx));
  }
  setVar(railFill, "--p", p.toFixed(4));
}

/* ─────────────── the loop ─────────────── */
let running = true;
document.addEventListener("visibilitychange", () => {
  const was = running;
  running = !document.hidden;
  if (running && !was) requestAnimationFrame(frame);
});

function frame(time) {
  if (!running) return;

  const k = reduced ? 1 : (Math.abs(target - cur) > .12 ? .14 : .085);
  cur += (target - cur) * k;
  if (Math.abs(target - cur) < 5e-6) cur = target;

  if (!touch && !reduced) {
    cmx += (mx - cmx) * .07;
    cmy += (my - cmy) * .07;
    root.style.setProperty("--mx", cmx.toFixed(4));
    root.style.setProperty("--my", cmy.toFixed(4));
    clx += (lx - clx) * .1;   // the light glides — Apple-store slow
    cly += (ly - cly) * .1;
    light.style.transform = `translate3d(${clx.toFixed(1)}px,${cly.toFixed(1)}px,0)`;
  }

  for (let i = 0; i < CH.length; i++) {
    const c = CH[i];
    const on = cur >= c.a - PAD && cur <= c.b + PAD;
    if (on !== scenes[i].classList.contains("on")) scenes[i].classList.toggle("on", on);
    if (on) RENDER[i](seg(cur, c.a, c.b), time);
  }
  if (el.hero && cur <= CH[3].b + PAD) heroShot(cur, time);
  document.body.classList.toggle("on-film", cur <= CH[3].b + PAD);
  // past the film, the chrome bows out so the credits stand alone
  const filmdone = !frozen && scrollY > maxScroll + vh * .25;
  document.body.classList.toggle("filmdone", filmdone);
  // the progress rail holds back through the opening beat — and bows out with the film
  el.railBox.style.opacity = filmdone ? "0" :
    Math.max(seg(time, 2600, 4000), seg(cur, .01, .018)).toFixed(3);
  // the card yields to the case chapter — its browser owns the upper right
  const inCases = cur > CH[5].a - PAD && cur < CH[5].b;
  el.contactCard.classList.toggle("show", !filmdone && !inCases && (time > 3800 || cur > .02));
  chapterUi(cur);

  requestAnimationFrame(frame);
}

/* ─────────────── go ─────────────── */
measure();
// deep link: #p=0.42 seeks the film there; ?f=0.42 / #f=0.42 freezes the frame (no scroll)
const hashP = /[?#&](p|f)=([\d.]+)/.exec(location.search + location.hash);
if (hashP) {
  target = clamp(parseFloat(hashP[2]), 0, 1);
  if (hashP[1] === "p") scrollTo(0, target * maxScroll);
  else frozen = true;
  cur = target - 0.0001;
} else {
  target = clamp(scrollY / maxScroll, 0, 1);
}
requestAnimationFrame(frame);

/* ─────────────── the film ending: credits fade in as they arrive ─────────────── */
const feFades = $$(".fe-fade");
if (feFades.length) {
  if (reduced || !("IntersectionObserver" in window)) {
    feFades.forEach(f => f.classList.add("on"));
  } else {
    const feObs = new IntersectionObserver(entries => {
      for (const en of entries)
        if (en.isIntersecting) { en.target.classList.add("on"); feObs.unobserve(en.target); }
    }, { threshold: 0.15 });
    feFades.forEach(f => feObs.observe(f));
  }
}
})();
