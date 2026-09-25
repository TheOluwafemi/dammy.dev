// Sky maths shared by two consumers:
//   1. src/sky/sky.ts imports it as a module.
//   2. Base.astro inlines a minified copy into <head> (see ./bootstrap.ts), so the sky and ink
//      are right before first paint.
// Keep it plain JavaScript, dependency-free, with top-level function declarations only.
// Values come from docs/Personal website redesign/BUILD-SPEC.md §3.2, §3.3 and §5.2.

/** Four colours per phase: c0 base, c1 mix, c2 warp, c3 highlight. Dawn, day, dusk, night. */
export const PAL_HEX = [
  ['#fad0d8', '#ffadc4', '#c6b8ff', '#ffe4e8'], // dawn: rose rather than the spec's peach (#ffd0bc, #ffe2d2)
  ['#a6d8ff', '#c8ecff', '#94c4ff', '#ffe6d2'],
  ['#ffa266', '#e85c9c', '#7447b0', '#ffd17a'],
  ['#1d2150', '#1f6e78', '#5b3e9e', '#ffb65e'],
]

/**
 * Sun progress at which ink turns from dark to light. The spec says 1.75, but light ink on the
 * bright dusk palette measured as low as 1.6:1. Flipping at 2.55, with the veil below, keeps
 * every sky colour at 4.5:1 or better (docs/REDESIGN-PLAN.md §3.1, §6.5).
 */
export const INK_FLIP = 2.55

/**
 * Veil laid over the sky so text keeps 4.5:1 against every palette colour, including the
 * highlight at its strongest. [progress, alpha] pairs, interpolated linearly: a pale haze
 * while ink is dark, a dusk shade once it turns light. Derived from the palette with a 0.02 margin.
 */
export const VEIL_LIGHT = [[1.65, 0], [1.7, 0.06], [1.8, 0.13], [1.9, 0.19], [2, 0.24], [2.3, 0.26], [2.55, 0.27]]
export const VEIL_DARK = [[2.55, 0.26], [2.7, 0.25], [2.8, 0.23], [2.9, 0.21], [3, 0.19]]
export const VEIL_LIGHT_RGB = [1, 0.988, 0.973] // #fffcf8
export const VEIL_DARK_RGB = [0.063, 0.055, 0.141] // #100e24

export function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** '#rrggbb' -> [r, g, b] in 0..1 */
export function hexRgb(h) {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}

/**
 * Local decimal hour (e.g. 18.5) -> sky progress in 0..3 (0 dawn, 1 day, 2 dusk, 3 night).
 * Realistic rather than the spec's (§5.2), which kept dawn colours until noon: dawn around
 * sunrise, full day by 08:30, day until 16:00, dusk at sunset (19:30, see celestial.ts), night by 22:00.
 */
export function realProg(hr) {
  if (hr < 5) return 3
  if (hr < 8.5) return (hr - 5) / 3.5
  if (hr < 16) return 1
  if (hr < 19.5) return 1 + (hr - 16) / 3.5
  if (hr < 22) return 2 + (hr - 19.5) / 2.5
  return 3
}

/** Palette at progress p: linear RGB interpolation between neighbouring phases. */
export function palAt(p) {
  const c = p < 0 ? 0 : p > 3 ? 3 : p
  const i = Math.min(2, Math.floor(c))
  const f = c - i
  const a = PAL_HEX[i].map(hexRgb)
  const b = PAL_HEX[i + 1].map(hexRgb)
  return a.map((col, k) => col.map((v, j) => v + (b[k][j] - v) * f))
}

export function inkAt(sp) {
  return sp < INK_FLIP ? 'dark' : 'light'
}

function lerpTable(table, x) {
  if (x <= table[0][0]) return table[0][1]
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) {
      const [x0, y0] = table[i - 1]
      const [x1, y1] = table[i]
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
    }
  }
  return table[table.length - 1][1]
}

/** [r, g, b, alpha] of the contrast veil at sun progress sp. */
export function veilAt(sp) {
  return sp < INK_FLIP ? [...VEIL_LIGHT_RGB, lerpTable(VEIL_LIGHT, sp)] : [...VEIL_DARK_RGB, lerpTable(VEIL_DARK, sp)]
}

function veiled(c, v) {
  return c.map((x, i) => x + (v[i] - x) * v[3])
}

export function rgbCss(c) {
  return 'rgb(' + c.map((v) => Math.round(v * 255)).join(',') + ')'
}

/**
 * The static stand-in for the shader: the spec's no-JS gradient shape. The highlight is used at
 * the shader's strongest mix (40%), not pure, and the contrast veil is applied, so text on it
 * passes the same checks as text on the live sky.
 */
export function skyGradient(P, v) {
  const hl = P[0].map((x, i) => x + (P[3][i] - x) * 0.4)
  return 'linear-gradient(160deg,' + rgbCss(veiled(P[0], v)) + ',' + rgbCss(veiled(P[2], v)) + ' 60%,' + rgbCss(veiled(hl, v)) + ')'
}

/** The visitor's clock, or `?at=HH:MM` to preview the sky at another time of day. */
export function skyClock(search) {
  const m = /[?&]at=(\d{1,2}):(\d{2})/.exec(search || '')
  const d = new Date()
  if (m) d.setHours(Math.min(23, +m[1]), Math.min(59, +m[2]), 0, 0)
  return d
}

/** Runs in <head> before first paint. `mode` is 'home' or 'lite'. */
export function boot(root, mode, date) {
  const rp = realProg(date.getHours() + date.getMinutes() / 60)
  const P = palAt(rp)
  const v = veilAt(rp)
  root.dataset.js = ''
  root.dataset.ink = inkAt(rp)
  root.style.setProperty('--sky-fallback', skyGradient(P, v))
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', rgbCss(P[0]))
  if (mode === 'home') preload(root, rp, P.map((c) => veiled(c, v)), date, location.search)
}

/**
 * The first visit of a session on home shows the preloader (docs/REDESIGN-PLAN.md D4).
 * `?preload` shows it anyway; `?preload=hold` keeps it on screen for review.
 */
export function preload(root, rp, P, date, search) {
  const forced = /[?&]preload\b/.test(search || '')
  try {
    if (!forced && sessionStorage.getItem('sky-seen')) return
  } catch (e) {
    if (!forced) return
  }
  const two = (n) => String(n).padStart(2, '0')
  root.dataset.preloading = ''
  root.style.setProperty('--pre-bg', 'radial-gradient(120% 90% at 50% 100%,' + rgbCss(P[3]) + ' 0%,' + rgbCss(P[2]) + ' 38%,' + rgbCss(P[0]) + ' 100%)')
  root.style.setProperty('--pre-sun', rp < 2.3 ? '#fff4d6' : '#e8ecff')
  root.style.setProperty('--pre-time', '"' + two(date.getHours()) + ':' + two(date.getMinutes()) + '"')
}
