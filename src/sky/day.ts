// Scroll position -> day progress (0..3), anchored to the sections (docs/REDESIGN-PLAN.md §6.3).
// The reference mapped the whole document linearly, so a section's label ("18:30 · DUSK") and the
// clock on arrival disagreed. Here each section arrives at its own time.

export interface Anchor {
  /** Scroll offset (px) at which this progress is reached. */
  at: number
  /** Day progress, 0..3. */
  prog: number
}

/** Piecewise-linear interpolation through anchors sorted by `at`. Clamps at both ends. */
export function dayAt(scroll: number, anchors: readonly Anchor[]): number {
  if (anchors.length === 0) return 0
  if (scroll <= anchors[0].at) return anchors[0].prog
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1]
    const b = anchors[i]
    if (scroll <= b.at) {
      const span = b.at - a.at
      return span <= 0 ? b.prog : a.prog + ((scroll - a.at) / span) * (b.prog - a.prog)
    }
  }
  return anchors[anchors.length - 1].prog
}

/**
 * Build anchors: the day starts (at `startProg`, normally dawn) once the hero is 55% scrolled,
 * each section reaches its own time as it meets the header, and the page's end is the end of
 * the night.
 * Anchors that would run backwards (e.g. a section shorter than the viewport near the
 * end) are dropped so the mapping stays monotonic.
 */
export function buildAnchors(heroH: number, maxScroll: number, sections: readonly Anchor[], startProg = 0): Anchor[] {
  const raw: Anchor[] = [{ at: heroH * 0.55, prog: startProg }, ...sections.map((s) => ({ at: Math.min(s.at, maxScroll), prog: s.prog })), { at: maxScroll, prog: 3 }]
  const out: Anchor[] = []
  for (const a of raw) {
    const last = out[out.length - 1]
    if (!last || (a.at > last.at && a.prog >= last.prog)) out.push(a)
  }
  return out
}
