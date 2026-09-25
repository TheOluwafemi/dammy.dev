// Where the sun or moon sits for a given clock hour (docs/REDESIGN-PLAN.md, sky notes).
// Seen from the UK you face south to watch them, so east is on the left: both rise from below
// the bottom-left of the screen, arc over the top, and set below the bottom-right. Sun and moon
// are the same disk; it swaps only while below the horizon, so it never visibly jumps.

export const SUNRISE = 5.5
export const SUNSET = 19.5
export const MOONRISE = 20
export const MOONSET = 5 // next morning

/** Horizon sits below the screen edge, so a body at the horizon is fully hidden. */
const HORIZON = -0.1
const PEAK = 0.86
const EAST = 0.06
const WEST = 0.94

export interface Body {
  x: number
  y: number
  /** 0 = sun, 1 = moon (the shader tints and dims the moon). */
  moon: 0 | 1
}

const arc = (u: number, peak: number) => ({
  x: EAST + (WEST - EAST) * u,
  y: HORIZON + (peak - HORIZON) * Math.sin(Math.PI * u),
})

/** Position (0..1, y up) of the visible body at decimal hour h (0..24). */
export function bodyAt(h: number): Body {
  const hr = ((h % 24) + 24) % 24
  if (hr >= SUNRISE && hr <= SUNSET) return { ...arc((hr - SUNRISE) / (SUNSET - SUNRISE), PEAK), moon: 0 }
  const night = (MOONSET + 24 - MOONRISE) % 24
  const since = (hr - MOONRISE + 24) % 24
  if (since <= night) return { ...arc(since / night, PEAK * 0.94), moon: 1 }
  // Between moonset and sunrise, or sunset and moonrise: nothing up. Park the disk below the
  // horizon on the side the next body will rise from.
  return hr < SUNRISE && hr > MOONSET ? { x: EAST, y: HORIZON, moon: 0 } : { x: EAST, y: HORIZON, moon: 1 }
}

/**
 * Walk forward or back from one hour to another by the shortest way round the clock, so that
 * scrolling out of the hero moves the sky on in time rather than jumping.
 */
export function hourBetween(from: number, to: number, t: number): number {
  let d = (((to - from) % 24) + 24) % 24
  if (d > 12) d -= 24
  return (((from + d * t) % 24) + 24) % 24
}
