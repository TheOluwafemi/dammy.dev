// Clock labels for the sky (spec §4.3, §4.4, §5.3). Pure functions: tested in time.test.ts.

/** Day progress 0..3 <-> clock hour. Keyframes from the spec: dawn 05:30, midday 12:00, dusk 18:30, night 23:30. */
const KEYS: readonly [number, number][] = [
  [0, 5.5],
  [1, 12],
  [2, 18.5],
  [3, 23.5],
]

export const pad = (n: number) => String(n).padStart(2, '0')
export const fmtHM = (h: number, m: number) => `${pad(h)}:${pad(m)}`

/** Day progress -> decimal clock hour (e.g. 1 -> 12). */
export function progToHour(p: number): number {
  const c = Math.max(0, Math.min(3, p))
  const i = Math.min(2, Math.floor(c))
  const f = c - i
  return KEYS[i][1] + (KEYS[i + 1][1] - KEYS[i][1]) * f
}

/** Scroll-clock label for a day progress, rounded to 5 minutes. */
export function progToClock(p: number): string {
  const hr = progToHour(p)
  let h = Math.floor(hr)
  let m = Math.round((hr - h) * 12) * 5
  if (m === 60) {
    h += 1
    m = 0
  }
  return fmtHM(h % 24, m)
}

/** Inverse of progToClock for a section label such as "12:10". */
export function clockToProg(label: string): number {
  const [h, m] = label.split(':').map(Number)
  const hr = h + m / 60
  if (hr <= KEYS[0][1]) return 0
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [p0, h0] = KEYS[i]
    const [p1, h1] = KEYS[i + 1]
    if (hr <= h1) return p0 + ((hr - h0) / (h1 - h0)) * (p1 - p0)
  }
  return 3
}

/** Phase word for the scroll clock. */
export function phaseName(p: number): string {
  return p < 0.75 ? 'dawn' : p < 1.4 ? 'midday' : p < 1.8 ? 'afternoon' : p < 2.6 ? 'dusk' : 'night'
}

/** Phase word for the hero eyebrow ("Right now it's … where you are"). */
export function heroPhase(rp: number): string {
  return rp < 0.75 ? 'dawn' : rp < 1.75 ? 'daytime' : rp < 2.6 ? 'dusk' : 'night'
}

/** Hours and minutes in London, whatever the visitor's zone. */
export function londonHM(date: Date): [number, number] {
  try {
    const [h, m] = date
      .toLocaleString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false })
      .split(':')
      .map(Number)
    return [h % 24, m]
  } catch {
    return [date.getHours(), date.getMinutes()]
  }
}

/** The hero time pill (spec §4.3). */
export function timeLine(date: Date): string {
  const you = fmtHM(date.getHours(), date.getMinutes())
  const me = fmtHM(...londonHM(date))
  return you === me ? `Same time as me: ${me} in the UK` : `${you} for you · ${me} for me in the UK`
}
