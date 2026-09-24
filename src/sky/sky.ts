// The living sky: one fixed WebGL canvas behind the page (spec §5).
// Home: animated, follows the visitor's clock, walks through the day as you scroll, and carries
// the cloud headline. Lite (every other page): a pale morning sky, drawn only when needed.
//
// The loop only reads scroll and pointer values and writes a few things: uniforms, `data-ink`,
// the clock text and two CSS variables on the hero. Colours change through CSS, keyed off data-ink.

import { clamp01, inkAt, litePal, palAt, realProg } from './core.js'
import { buildAnchors, dayAt, type Anchor } from './day'
import { clockToProg, phaseName, progToClock } from './time'
import { drawCloudText, type TextBox } from './cloudText'
import { FRAGMENT, UNIFORMS, VERTEX, type Uniform } from './shader'

type RGB = number[]
type Mode = 'home' | 'lite'

const DPR_CAP = 1.5
const GRAIN = 0.04

const mix = (a: number, b: number, t: number) => a + (b - a) * t
const mixPal = (A: RGB[], B: RGB[], t: number) => A.map((c, i) => c.map((v, j) => mix(v, B[i][j], t)))

/** Fired on document once the first frame (with the cloud text on home) is on screen. */
export const SKY_READY = 'sky:ready'
/** Dispatch on document to let the cloud headline condense (the preloader does this on exit). */
export const SKY_CONDENSE = 'sky:condense'

export function startSky(canvas: HTMLCanvasElement, mode: Mode) {
  const root = document.documentElement
  /** No WebGL: keep the CSS gradient and show the real <h1> instead of the cloud headline. */
  const noGL = () => {
    root.dataset.noGl = ''
    ready()
  }
  const ready = () => {
    ;(window as unknown as { __skyReady?: boolean }).__skyReady = true
    document.dispatchEvent(new Event(SKY_READY))
  }

  // Default alpha: until the first frame the canvas is transparent and the CSS gradient shows.
  const gl = canvas.getContext('webgl', { antialias: false })
  if (!gl) return noGL()

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const still = reduceMotion || mode === 'lite'
  const home = mode === 'home'

  const hero = document.querySelector<HTMLElement>('[data-sky-hero]')
  const clock = document.querySelector<HTMLElement>('[data-sky-clock]')
  const clockText = document.querySelector<HTMLElement>('[data-sky-clock-text]')
  const header = document.querySelector<HTMLElement>('.site-header')

  // Pointer, eased (spec §5.3).
  const m = [0.5, 0.6]
  const mt = [0.5, 0.6]
  let mp = 0
  let mpt = 0

  // Headline condense: waits for the preloader when there is one.
  let condense = 0
  let condenseTarget = root.hasAttribute('data-preloading') ? 0 : 1
  document.addEventListener(SKY_CONDENSE, () => (condenseTarget = 1))

  let U = {} as Record<Uniform, WebGLUniformLocation | null>
  let tex: WebGLTexture | null = null
  const textCanvas = document.createElement('canvas')
  let textBox: TextBox | null = null
  let needText = home
  let anchors: Anchor[] = []
  let heroH = 0
  let real = 0
  let realAt = 0
  const t0 = performance.now()
  let raf = 0
  let announced = false
  let lastInk = root.dataset.ink
  let lastClock = ''

  function compile(type: number, src: string) {
    const s = gl!.createShader(type)!
    gl!.shaderSource(s, src)
    gl!.compileShader(s)
    return s
  }

  function setup() {
    const pr = gl!.createProgram()!
    gl!.attachShader(pr, compile(gl!.VERTEX_SHADER, VERTEX))
    gl!.attachShader(pr, compile(gl!.FRAGMENT_SHADER, FRAGMENT))
    gl!.linkProgram(pr)
    if (!gl!.getProgramParameter(pr, gl!.LINK_STATUS)) return false
    gl!.useProgram(pr)
    const buf = gl!.createBuffer()
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buf)
    gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl!.STATIC_DRAW)
    const loc = gl!.getAttribLocation(pr, 'p')
    gl!.enableVertexAttribArray(loc)
    gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0)
    U = Object.fromEntries(UNIFORMS.map((u) => [u, gl!.getUniformLocation(pr, u)])) as typeof U
    tex = gl!.createTexture()
    gl!.bindTexture(gl!.TEXTURE_2D, tex)
    for (const [k, v] of [
      [gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE],
      [gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE],
      [gl!.TEXTURE_MIN_FILTER, gl!.LINEAR],
      [gl!.TEXTURE_MAG_FILTER, gl!.LINEAR],
    ])
      gl!.texParameteri(gl!.TEXTURE_2D, k, v)
    // An empty 1x1 texture until the headline is drawn (lite pages never draw one).
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, 1, 1, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]))
    gl!.uniform1i(U.tx, 0)
    return true
  }

  const displayFamily = () => getComputedStyle(root).getPropertyValue('--font-bricolage').trim() || '"Bricolage Grotesque", sans-serif'

  function uploadText(W: number, H: number, dpr: number) {
    textBox = drawCloudText(textCanvas, W, H, dpr, displayFamily())
    gl!.bindTexture(gl!.TEXTURE_2D, tex)
    gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true)
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, textCanvas)
    placeHero()
  }

  /** Put the hero block directly under the cloud headline, on its left edge (spec §4.3). */
  function placeHero() {
    if (!hero || !textBox) return
    const r = hero.getBoundingClientRect()
    const heroTop = r.top + scrollY
    hero.style.setProperty('--hero-top', `${Math.round(textBox.bottom - heroTop + Math.max(22, innerHeight * 0.04))}px`)
    hero.style.setProperty('--hero-left', `${Math.round(textBox.left - r.left)}px`)
  }

  /** Section anchors: each [data-sky-time] section reaches its time as it meets the header. */
  function measure() {
    const se = document.scrollingElement || root
    const max = Math.max(1, se.scrollHeight - innerHeight)
    const offset = header?.offsetHeight ?? 0
    heroH = hero?.offsetHeight || innerHeight
    const sections = [...document.querySelectorAll<HTMLElement>('[data-sky-time]')].map((el) => ({
      at: el.getBoundingClientRect().top + scrollY - offset,
      prog: clockToProg(el.dataset.skyTime!),
    }))
    anchors = buildAnchors(heroH, max, sections)
    placeHero()
  }

  function realNow() {
    const now = Date.now()
    if (now - realAt > 30_000) {
      const d = new Date()
      real = realProg(d.getHours() + d.getMinutes() / 60)
      realAt = now
    }
    return real
  }

  function frame() {
    const dpr = Math.min(devicePixelRatio || 1, DPR_CAP)
    const W = Math.round(canvas.clientWidth * dpr)
    const H = Math.round(canvas.clientHeight * dpr)
    if (!W || !H) return
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W
      canvas.height = H
      gl!.viewport(0, 0, W, H)
      needText = home
    }
    if (needText) {
      uploadText(W, H, dpr)
      needText = false
    }

    const s = scrollY
    const vh = canvas.clientHeight
    let cols: RGB[]
    let sp: number
    let tH = 0
    let day = 0

    if (home) {
      tH = clamp01(s / (heroH * 0.8))
      day = dayAt(s, anchors) // walks the day as you scroll
      const rp = realNow()
      cols = mixPal(palAt(rp), palAt(day), tH)
      sp = mix(rp, day, tH)
    } else {
      cols = litePal()
      sp = 0.7
    }

    const u = clamp01(sp / 2.4)
    const moon = clamp01((sp - 2.3) / 0.5)
    const sunX = mix(0.12 + 0.76 * u, 0.82, moon)
    const sunY = mix(0.5 + 0.36 * Math.sin(Math.PI * u), 0.82, moon)
    const warm = clamp01((sp - 1.5) / 0.6) * (1 - moon)

    m[0] += (mt[0] - m[0]) * 0.08
    m[1] += (mt[1] - m[1]) * 0.08
    mp += ((still ? 0 : mpt) - mp) * 0.05
    condense += (condenseTarget - condense) * (reduceMotion ? 1 : 0.09)
    const t = still ? 0 : (performance.now() - t0) / 1000
    const textFade = home ? 1 - clamp01(s / (heroH * 0.55)) : 0

    gl!.uniform2f(U.r, W, H)
    gl!.uniform2f(U.m, m[0], m[1])
    gl!.uniform1f(U.t, t)
    gl!.uniform1f(U.mp, mp)
    gl!.uniform1f(U.stars, home ? clamp01((sp - 2.2) / 0.8) : 0)
    gl!.uniform1f(U.sc, s / vh)
    gl!.uniform1f(U.txtOn, textFade * condense)
    gl!.uniform1f(U.g, GRAIN)
    gl!.uniform1f(U.warm, warm)
    gl!.uniform3fv(U.c0, cols[0])
    gl!.uniform3fv(U.c1, cols[1])
    gl!.uniform3fv(U.c2, cols[2])
    gl!.uniform3fv(U.c3, cols[3])
    gl!.uniform3f(U.sun, sunX, sunY, moon)
    gl!.activeTexture(gl!.TEXTURE0)
    gl!.bindTexture(gl!.TEXTURE_2D, tex)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)

    if (!announced) {
      announced = true
      ready()
    }

    if (home) {
      const ink = inkAt(sp)
      if (ink !== lastInk) root.dataset.ink = lastInk = ink
      if (clock) {
        const show = tH > 0.5
        if (clock.hasAttribute('data-visible') !== show) clock.toggleAttribute('data-visible', show)
        const label = `${progToClock(day)} · ${phaseName(day)}`
        if (show && clockText && label !== lastClock) clockText.textContent = lastClock = label
      }
    }
  }

  // Scheduling: continuous while animated; otherwise one frame per change.
  const loop = () => {
    raf = requestAnimationFrame(loop)
    frame()
  }
  const request = () => {
    if (raf || document.hidden) return
    raf = requestAnimationFrame(() => {
      raf = 0
      frame()
      // Let the headline finish condensing even when nothing else moves.
      if (Math.abs(condenseTarget - condense) > 0.002) request()
    })
  }
  const start = () => {
    if (raf) return
    if (still) request()
    else loop()
  }
  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
  }

  if (!setup()) return noGL()

  addEventListener('pointermove', (e) => {
    mt[0] = e.clientX / innerWidth
    mt[1] = 1 - e.clientY / innerHeight
    mpt = 1
  }, { passive: true })
  root.addEventListener('pointerleave', () => (mpt = 0))
  if (home && still) addEventListener('scroll', request, { passive: true })
  addEventListener('resize', () => {
    measure()
    request()
  })
  document.addEventListener(SKY_CONDENSE, request)
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()))
  new ResizeObserver(() => {
    measure()
    request()
  }).observe(document.body)
  document.fonts?.ready.then(() => {
    needText = home
    measure()
    request()
  })

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    stop()
  })
  canvas.addEventListener('webglcontextrestored', () => {
    if (setup()) {
      needText = home
      start()
    }
  })

  measure()
  start()
}
