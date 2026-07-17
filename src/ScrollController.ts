/**
 * ScrollController — binds each FrameSequence to the page timeline with
 * GSAP ScrollTrigger.
 *
 * The Mokshify film runs on one tall scroll track; every scene owns a
 * fractional slice of it [a..b]. Each slice becomes one ScrollTrigger whose
 * progress IS the shot's playhead:  frame = progress × totalFrames.
 * Purely scrubbed — nothing autoplays.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { FrameSequence } from "./FrameSequence";

gsap.registerPlugin(ScrollTrigger);

export interface SceneRange {
  /** fraction of the total scroll track where the shot starts (0..1) */
  a: number;
  /** fraction where it ends */
  b: number;
}

export class ScrollController {
  private triggers: ScrollTrigger[] = [];

  /** total scrollable pixels of the page right now */
  private static trackLength(): number {
    // anchor the film to its own track, not total page height — content after
    // the film (the credits ending) must never remap chapter timing
    const track = document.querySelector<HTMLElement>(".scroll-space");
    const h = track ? track.offsetHeight : document.documentElement.scrollHeight;
    return Math.max(1, h - window.innerHeight);
  }

  bind(seq: FrameSequence, range: SceneRange): ScrollTrigger {
    const st = ScrollTrigger.create({
      start: () => ScrollController.trackLength() * range.a,
      end: () => ScrollController.trackLength() * range.b,
      // touch flicks carry momentum that teleports an instant scrub —
      // a ~0.9s smoothed scrub turns them into cinematic glides
      scrub: matchMedia("(hover: none)").matches ? 0.9 : true,
      invalidateOnRefresh: true,
      onUpdate: self => seq.setProgress(self.progress),
      onRefresh: self => seq.setProgress(self.progress),
    });
    this.triggers.push(st);
    return st;
  }

  refresh(): void {
    ScrollTrigger.refresh();
  }

  destroy(): void {
    for (const t of this.triggers) t.kill();
    this.triggers = [];
  }
}
