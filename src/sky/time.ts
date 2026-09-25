// Clock maths for the sky (spec §5.3). Pure functions: tested in sky.test.ts.

/** Day progress 0..3 <-> clock hour. Keyframes from the spec: dawn 05:30, midday 12:00, dusk 18:30, night 23:30. */
const KEYS: readonly [number, number][] = [
  [0, 5.5],
  [1, 12],
  [2, 18.5],
  [3, 23.5],
]

/** Day progress -> decimal clock hour (e.g. 1 -> 12). */
export function progToHour(p: number): number {
  const c = Math.max(0, Math.min(3, p))
  const i = Math.min(2, Math.floor(c))
  const f = c - i
  return KEYS[i][1] + (KEYS[i + 1][1] - KEYS[i][1]) * f
}

/** Day progress for a section's `data-sky-time`, such as "12:10". */
export function clockToProg(label: string): number {
  const [h, m] = label.split(':').map(Number)
  return hourToProg(h + m / 60)
}

/** Inverse of progToHour: decimal hour -> day progress, clamped to 0..3. */
export function hourToProg(hr: number): number {
  if (hr <= KEYS[0][1]) return 0
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [p0, h0] = KEYS[i]
    const [p1, h1] = KEYS[i + 1]
    if (hr <= h1) return p0 + ((hr - h0) / (h1 - h0)) * (p1 - p0)
  }
  return 3
}

/** Phase word for the hero eyebrow ("Dawn where you are"), from the local hour. */
// Matches the sky's sun (celestial.ts): it rises at 05:30 and sets at 19:30, so dusk is the
// hour and a half around sunset, not the whole evening.
export function heroPhase(hr: number): string {
  if (hr >= 5 && hr < 7) return 'dawn'
  if (hr >= 7 && hr < 12) return 'morning'
  if (hr >= 12 && hr < 17) return 'afternoon'
  if (hr >= 17 && hr < 19) return 'evening'
  if (hr >= 19 && hr < 20.5) return 'dusk'
  return 'night'
}
