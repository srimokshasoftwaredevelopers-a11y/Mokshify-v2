/**
 * FrameSequence — one cinematic shot, scrubbed by scroll.
 *
 * Owns a canvas, a FrameLoader and an ImageCache. ScrollTrigger feeds it a
 * 0..1 progress; the sequence maps that to a fractional frame index, chases
 * it with critically-damped smoothing (Apple-style weight, no snapping), and
 * paints via drawImage with cover fitting. Between integer frames it
 * cross-blends the two neighbours, so motion stays continuous even at slow
 * scroll speeds. If a frame isn't decoded yet, the nearest cached neighbour
 * stays on screen — the canvas is never blank, never flickers.
 */

import { FrameLoader } from "./FrameLoader";
import { ImageCache } from "./ImageCache";
import type { Frame } from "./ImageCache";

export interface SequenceOptions {
  dir: string;
  canvas: HTMLCanvasElement;
  cacheBudget: number;
  resizeWidth?: number;
  /** frames fetched ahead/behind the playhead */
  preloadRadius: number;
}

export class FrameSequence {
  readonly loader: FrameLoader;
  readonly cache: ImageCache;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: SequenceOptions;

  private total = 0;
  private target = 0;      // fractional frame index scroll wants
  private display = -1;    // smoothed index actually shown
  private lastPaintedKey = "";
  private ready = false;
  private velocity = 0;

  /** warm paper — what the lens sees before the first frame decodes */
  private static readonly BLANK = "#F1EAE1";
  private pendingP = 0;

  constructor(opts: SequenceOptions) {
    this.opts = opts;
    this.canvas = opts.canvas;
    this.ctx = opts.canvas.getContext("2d", { alpha: false })!;
    this.blank();
    this.loader = new FrameLoader(opts.dir);
    this.cache = new ImageCache({ budget: opts.cacheBudget, resizeWidth: opts.resizeWidth });
  }

  /** never show a black canvas — fill with the site's paper tone */
  private blank(): void {
    this.ctx.fillStyle = FrameSequence.BLANK;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  async init(): Promise<void> {
    const info = await this.loader.discover();
    this.total = info.count;
    if (this.total === 0) return; // dead sequence — stays unready, never paints
    // the opening frame wins the network before the preload window opens
    await this.cache.load(0, this.loader.url(0));
    this.ready = true;
    this.setProgress(this.pendingP);
    this.target = Math.min(Math.max(this.pendingP, 0), 1) * (this.total - 1);
    this.display = this.target;
    this.paint(true);
  }

  get totalFrames(): number {
    return this.total;
  }

  /** ScrollTrigger progress (0..1) → target frame */
  setProgress(p: number): void {
    this.pendingP = p; // remembered even pre-ready, applied after init
    if (!this.ready) return;
    const t = Math.min(Math.max(p, 0), 1) * (this.total - 1);
    this.velocity = t - this.target;
    this.target = t;
  }

  /** advance smoothing + repaint; called from the shared rAF loop */
  tick(): void {
    if (!this.ready || this.total === 0) return;

    if (this.display < 0) this.display = this.target;
    const diff = this.target - this.display;
    // heavier chase on big seeks so the shot catches up without popping
    const k = Math.abs(diff) > 12 ? 0.4 : 0.22;
    this.display += diff * k;
    if (Math.abs(diff) < 0.002) this.display = this.target;

    this.cache.setPlayhead(this.display);
    this.preload();
    this.paint(false);
  }

  /** window the network: near frames now, direction-of-travel biased */
  private preload(): void {
    const r = this.opts.preloadRadius;
    const center = Math.round(this.display);
    const bias = Math.sign(this.velocity);
    for (let d = 0; d <= r; d++) {
      for (const dir of bias >= 0 ? [1, -1] : [-1, 1]) {
        const i = center + d * dir;
        if (i < 0 || i >= this.total) continue;
        if (!this.cache.has(i)) this.cache.load(i, this.loader.url(i));
      }
    }
  }

  private paint(force: boolean): void {
    const lo = Math.floor(this.display);
    const hi = Math.min(lo + 1, this.total - 1);
    const frac = this.display - lo;

    const a = this.cache.get(lo) ?? null;
    const b = frac > 0.02 ? this.cache.get(hi) ?? null : null;
    const fallback = a ? null : this.cache.nearest(this.display);

    const key = `${a ? lo : fallback?.index ?? -1}|${b ? hi : -1}|${frac.toFixed(2)}|${this.canvas.width}x${this.canvas.height}`;
    if (!force && key === this.lastPaintedKey) return;

    const base = a ?? fallback?.bitmap ?? null;
    if (!base) return; // nothing decoded yet — keep previous pixels
    this.lastPaintedKey = key;

    this.drawCover(base, 1);
    if (a && b) this.drawCover(b, frac); // cross-blend neighbours
  }

  /** object-fit: cover */
  private drawCover(bmp: Frame, alpha: number): void {
    const { width: cw, height: ch } = this.canvas;
    const s = Math.max(cw / bmp.width, ch / bmp.height);
    const dw = bmp.width * s;
    const dh = bmp.height * s;
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(bmp, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    this.ctx.globalAlpha = 1;
  }

  /** viewport changed — resize backing store and force a repaint */
  resize(cssW: number, cssH: number, dpr: number): void {
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.blank(); // resizing clears to black — repaint paper first
      this.paint(true);
    }
  }

  destroy(): void {
    this.cache.clear();
  }
}
