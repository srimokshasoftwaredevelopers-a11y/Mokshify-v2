/**
 * SceneManager — mounts the Gemini Flow footage into the Mokshify film.
 *
 * Every `.cinema[data-scene]` element gets a cover-fit canvas backed by a
 * FrameSequence reading `frames/<n>/`. A mount may span several chapters
 * (`data-chapters="1-4"`), so one master sequence can play across multiple
 * typography scenes. Scene scroll ranges come from the site engine
 * (window.MOKSHIFY.CH, published by js/main.js) — one shared timeline.
 *
 * The source frames are 4K; decode is downscaled to what the viewport can
 * actually show, so memory stays bounded no matter the master resolution.
 * A single rAF loop ticks only near-playhead sequences; dead mounts
 * (missing folders) simply never go live.
 */

import { FrameSequence } from "./FrameSequence";
import { ScrollController, SceneRange } from "./ScrollController";

interface Chapter { id: string; a: number; b: number }

declare global {
  interface Window {
    MOKSHIFY?: { CH: Chapter[] };
  }
}

/** fallback chapter ranges if main.js hasn't published its table */
const DEFAULT_CH: SceneRange[] = [
  { a: 0.00, b: 0.13 },
  { a: 0.13, b: 0.24 },
  { a: 0.24, b: 0.36 },
  { a: 0.36, b: 0.49 },
];

const VISIBLE_PAD = 0.02;

interface Mounted {
  seq: FrameSequence;
  range: SceneRange;
  host: HTMLElement;
  dead: boolean;
}

export class SceneManager {
  private mounted: Mounted[] = [];
  private controller = new ScrollController();
  private raf = 0;
  /** ?f=0.42 freeze-frame (QA deep link, mirrors js/main.js) */
  private frozen: number | null = null;

  static boot(): SceneManager {
    const mgr = new SceneManager();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => mgr.start());
    } else {
      mgr.start();
    }
    return mgr;
  }

  /** chapter table from the site engine, else defaults */
  private chapters(): SceneRange[] {
    const ch = window.MOKSHIFY?.CH;
    return ch ? ch.map(c => ({ a: c.a, b: c.b })) : DEFAULT_CH;
  }

  /**
   * A mount's slice of the timeline.
   *   data-chapters="1-4"  → from chapter 1's start to chapter 4's end
   *   data-chapters="2"    → exactly chapter 2
   *   (absent)             → chapter = data-scene number
   */
  private rangeFor(host: HTMLElement): SceneRange | null {
    const ch = this.chapters();
    const spec = host.dataset.chapters ?? host.dataset.scene ?? "";
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(spec.trim());
    if (!m) return null;
    const i = parseInt(m[1], 10) - 1;
    const j = (m[2] ? parseInt(m[2], 10) : parseInt(m[1], 10)) - 1;
    if (!ch[i] || !ch[j]) return null;
    return { a: ch[i].a, b: ch[j].b };
  }

  private async start(): Promise<void> {
    const hosts = Array.from(
      document.querySelectorAll<HTMLElement>(".cinema[data-scene]"),
    );
    if (!hosts.length) return;

    const fz = /[?#&]f=([\d.]+)/.exec(location.search + location.hash);
    if (fz) this.frozen = Math.min(Math.max(parseFloat(fz[1]), 0), 1);

    // decode no larger than the viewport can show (and never upscale the
    // 1920px web derivatives) — big sources stay cheap either way
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const mobile = Math.min(innerWidth, innerHeight) < 700;
    const decodeW = mobile
      ? Math.min(1280, Math.ceil(innerWidth * dpr))
      : Math.min(1920, Math.ceil(innerWidth * dpr));

    for (const host of hosts) {
      const scene = host.dataset.scene!;
      const range = this.rangeFor(host);
      if (!range) continue;

      const canvas = document.createElement("canvas");
      canvas.className = "cinema-canvas";
      canvas.setAttribute("aria-hidden", "true");
      host.prepend(canvas);

      const seq = new FrameSequence({
        dir: `frames/${scene}`,
        canvas,
        cacheBudget: mobile ? 24 : 48,
        resizeWidth: decodeW,
        preloadRadius: mobile ? 14 : 28,
      });
      this.mounted.push({ seq, range, host, dead: false });
      this.controller.bind(seq, range);
    }

    this.fitAll();
    addEventListener("resize", () => {
      this.fitAll();
      this.controller.refresh();
    }, { passive: true });

    // discover + first-frame paint, nearest mount first; flag dead folders
    const p = this.pageProgress();
    const byDistance = [...this.mounted].sort(
      (x, y) => this.distance(x.range, p) - this.distance(y.range, p),
    );
    for (const m of byDistance) {
      m.seq.init().then(() => { m.dead = m.seq.totalFrames === 0; });
    }

    const loop = () => {
      const prog = this.pageProgress();
      for (const m of this.mounted) {
        const within = !m.dead
          && prog >= m.range.a - VISIBLE_PAD && prog <= m.range.b + VISIBLE_PAD;
        m.host.classList.toggle("live", within);
        if (within) {
          if (this.frozen !== null) {
            // frozen mode bypasses ScrollTrigger — feed progress directly
            const local = (prog - m.range.a) / (m.range.b - m.range.a);
            m.seq.setProgress(Math.min(Math.max(local, 0), 1));
          }
          m.seq.tick();
        }
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private pageProgress(): number {
    if (this.frozen !== null) return this.frozen;
    const trackEl = document.querySelector<HTMLElement>(".scroll-space");
    const trackH = trackEl ? trackEl.offsetHeight : document.documentElement.scrollHeight;
    const max = Math.max(1, trackH - innerHeight);
    return Math.min(Math.max(scrollY / max, 0), 1);
  }

  private distance(r: SceneRange, p: number): number {
    if (p >= r.a && p <= r.b) return 0;
    return Math.min(Math.abs(p - r.a), Math.abs(p - r.b));
  }

  private fitAll(): void {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    for (const m of this.mounted) {
      const rect = m.host.getBoundingClientRect();
      m.seq.resize(rect.width || innerWidth, rect.height || innerHeight, dpr);
    }
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.controller.destroy();
    for (const m of this.mounted) m.seq.destroy();
    this.mounted = [];
  }
}
