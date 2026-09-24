// Sky maths shared by two consumers:
//   1. src/sky/sky.ts imports it as a module.
//   2. Base.astro inlines a minified copy into <head> (see ./bootstrap.ts), so the sky and ink
//      are right before first paint.
// Keep it plain JavaScript, dependency-free, with top-level function declarations only.
// Values come from docs/Personal website redesign/BUILD-SPEC.md §3.2, §3.3 and §5.2.

/** Four colours per phase: c0 base, c1 mix, c2 warp, c3 highlight. Dawn, day, dusk, night. */
export const PAL_HEX = [
  ['#ffd0bc', '#ffadc4', '#c6b8ff', '#ffe2d2'],
  ['#a6d8ff', '#c8ecff', '#94c4ff', '#ffe6d2'],
  ['#ffa266', '#e85c9c', '#7447b0', '#ffd17a'],
  ['#1d2150', '#1f6e78', '#5b3e9e', '#ffb65e'],
]

/** Sun progress at which ink turns from dark to light. */
export const INK_FLIP = 1.75

/** Secondary pages sit under a pale morning sky: palette at 0.85, lightened 50%. */
export const LITE_PROG = 0.85

export function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** '#rrggbb' -> [r, g, b] in 0..1 */
export function hexRgb(h) {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}

/** Local decimal hour (e.g. 18.5) -> sun progress in 0..3 (spec §5.2). */
export function realProg(hr) {
  if (hr < 5) return 3
  if (hr < 12) return (hr - 5) / 7
  if (hr < 18.5) return 1 + (hr - 12) / 6.5
  if (hr < 22) return 2 + (hr - 18.5) / 3.5
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

export function litePal() {
  return palAt(LITE_PROG).map((c) => c.map((v) => v + (1 - v) * 0.5))
}

export function inkAt(sp) {
  return sp < INK_FLIP ? 'dark' : 'light'
}

export function rgbCss(c) {
  return 'rgb(' + c.map((v) => Math.round(v * 255)).join(',') + ')'
}

/** The static stand-in for the shader: the same gradient shape as the spec's no-JS fallback. */
export function skyGradient(P) {
  return 'linear-gradient(160deg,' + rgbCss(P[0]) + ',' + rgbCss(P[2]) + ' 60%,' + rgbCss(P[3]) + ')'
}

/** Runs in <head> before first paint. `mode` is 'home' or 'lite'. */
export function boot(root, mode, date) {
  const lite = mode === 'lite'
  const rp = realProg(date.getHours() + date.getMinutes() / 60)
  const P = lite ? litePal() : palAt(rp)
  root.dataset.js = ''
  root.dataset.ink = lite ? 'dark' : inkAt(rp)
  root.style.setProperty('--sky-fallback', skyGradient(P))
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', rgbCss(P[0]))
  if (mode === 'home') preload(root, rp, P, date)
}

/** The first visit of a session on home shows the preloader (docs/REDESIGN-PLAN.md D4). */
export function preload(root, rp, P, date) {
  try {
    if (sessionStorage.getItem('sky-seen')) return
  } catch (e) {
    return
  }
  const two = (n) => String(n).padStart(2, '0')
  root.dataset.preloading = ''
  root.style.setProperty('--pre-bg', 'radial-gradient(120% 90% at 50% 100%,' + rgbCss(P[3]) + ' 0%,' + rgbCss(P[2]) + ' 38%,' + rgbCss(P[0]) + ' 100%)')
  root.style.setProperty('--pre-sun', rp < 2.3 ? '#fff4d6' : '#e8ecff')
  root.style.setProperty('--pre-time', '"' + two(date.getHours()) + ':' + two(date.getMinutes()) + '"')
}
