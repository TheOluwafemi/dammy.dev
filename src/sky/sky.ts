// The living sky: one fixed WebGL canvas behind the page (spec §5).
// Home: animated, follows the visitor's clock, walks through the day as you scroll, and carries
// the cloud headline. Lite (every other page): a pale morning sky, drawn only when needed.
//
// The loop only reads scroll and pointer values and writes a few things: uniforms, `data-ink`
// and the clock text. Colours change through CSS, keyed off data-ink, and the hero block is
// positioned in CSS from the same formulas the cloud text uses (see Hero.astro).
//
// Cost control (docs/REDESIGN-PLAN.md §6.4): the sky starts only after the page has loaded and
// the browser is idle, compiles its shader without blocking where supported, renders below
// screen resolution (the clouds are soft), drops to ~30fps when nothing is moving, and lowers
// its resolution and then stops animating if frames stay slow.

import { clamp01, inkAt, litePal, palAt, realProg, skyClock, veilAt } from './core.js'
import { buildAnchors, dayAt, type Anchor } from './day'
import { clockToProg, hourToProg, phaseName, progToClock, progToHour } from './time'
import { SUNRISE, bodyAt, heroSky } from './celestial'
import { drawCloudText } from './cloudText'
import { FRAGMENT, UNIFORMS, VERTEX, type Uniform } from './shader'
import { SKY_CONDENSE, markSkyReady } from './events'

type RGB = number[]
type Mode = 'home' | 'lite'

const DPR_CAP = 1.5
/** Render resolution relative to the (capped) device pixel ratio; the next step is taken when frames stay slow. */
const SCALES = [0.6, 0.45]
/** Callbacks further apart than this (below ~30fps), sustained, mean the device is struggling. */
const SLOW_FRAME_MS = 34
const IDLE_MS = 600
const GRAIN = 0.04

const mix = (a: number, b: number, t: number) => a + (b - a) * t
const mixPal = (A: RGB[], B: RGB[], t: number) => A.map((c, i) => c.map((v, j) => mix(v, B[i][j], t)))

/** Run after load, when the browser is idle, so the sky never delays the page's first paint. */
function whenIdle(fn: () => void) {
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200))
  if (document.readyState === 'complete') go()
  else addEventListener('load', go, { once: true })
}

export function startSky(canvas: HTMLCanvasElement, mode: Mode) {
  const root = document.documentElement
  const ready = markSkyReady
  /** No WebGL: keep the CSS gradient and show the real <h1> instead of the cloud headline. */
  const noGL = () => {
    root.dataset.noGl = ''
    ready()
  }

  // Default alpha: until the first frame the canvas is transparent and the CSS gradient shows.
  const gl = canvas.getContext('webgl', { antialias: false })
  if (!gl) return noGL()

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const home = mode === 'home'
  /** Animated (time runs, pointer ripples). Off for lite pages, reduced motion, or a struggling device. */
  let animate = home && !reduceMotion

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
  let needText = home
  let anchors: Anchor[] = []
  let heroH = 0
  let real = 0
  let realAt = 0
  const t0 = performance.now()
  let frozenT = 0
  let raf = 0
  let running = false
  let announced = false
  let lastInk = root.dataset.ink
  let lastClock = ''
  let scaleStep = 0
  let lastActive = 0

  function compile(type: number, src: string) {
    const sh = gl!.createShader(type)!
    gl!.shaderSource(sh, src)
    gl!.compileShader(sh)
    return sh
  }

  /** Compile and link; with KHR_parallel_shader_compile the wait happens off the main thread. */
  function setup(done: (ok: boolean) => void) {
    const pr = gl!.createProgram()!
    gl!.attachShader(pr, compile(gl!.VERTEX_SHADER, VERTEX))
    gl!.attachShader(pr, compile(gl!.FRAGMENT_SHADER, FRAGMENT))
    gl!.linkProgram(pr)
    const ext = gl!.getExtension('KHR_parallel_shader_compile')

    const finish = () => {
      if (!gl!.getProgramParameter(pr, gl!.LINK_STATUS)) return done(false)
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
      done(true)
    }

    if (!ext) return finish()
    const poll = () => (gl!.getProgramParameter(pr, ext.COMPLETION_STATUS_KHR) ? finish() : setTimeout(poll, 16))
    poll()
  }

  const displayFamily = () => getComputedStyle(root).getPropertyValue('--font-bricolage').trim() || '"Bricolage Grotesque", sans-serif'

  function uploadText(W: number, H: number, dpr: number) {
    drawCloudText(textCanvas, W, H, dpr, displayFamily())
    gl!.bindTexture(gl!.TEXTURE_2D, tex)
    gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true)
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, textCanvas)
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
    // Time never runs backwards on scroll. If it is already past sunrise but before the first
    // section's time, the scroll day starts from now; otherwise it starts at dawn and the
    // disk fades across the hero instead of rewinding (see `frame`).
    const firstHour = sections.length ? progToHour(sections[0].prog) : SUNRISE
    walkFromNow = realHour >= SUNRISE && realHour < firstHour
    anchors = buildAnchors(heroH, max, sections, walkFromNow ? hourToProg(realHour) : 0)
  }
  let walkFromNow = false

  let realHour = 12
  function realNow() {
    const now = Date.now()
    if (now - realAt > 30_000) {
      const d = skyClock(location.search)
      const h = d.getHours() + d.getMinutes() / 60
      const changed = h !== realHour
      realHour = h
      real = realProg(realHour)
      realAt = now
      if (changed) measure()
    }
    return real
  }

  function frame() {
    const dpr = Math.min(devicePixelRatio || 1, DPR_CAP) * SCALES[scaleStep]
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

    // Sun and moon follow the clock: the visitor's hour on the hero, the scroll-clock hour once
    // past it, walked between in time as the hero scrolls away. Lite pages sit mid-morning.
    // Across the hero: walk forward from now when the scroll day starts from now; otherwise fade
    // the disk out where it is and back in at the scroll day's position, so it never rewinds.
    const { hour, alpha: sunAlpha } = home ? heroSky(realHour, progToHour(day), tH, walkFromNow) : { hour: 10, alpha: 1 }
    const body = bodyAt(hour)
    const moon = body.moon
    const sunX = body.x
    const sunY = body.y
    const warm = clamp01((sp - 1.5) / 0.6) * (1 - moon)
    const veil = home ? veilAt(sp) : [0, 0, 0, 0]

    m[0] += (mt[0] - m[0]) * 0.08
    m[1] += (mt[1] - m[1]) * 0.08
    mp += ((animate ? mpt : 0) - mp) * 0.05
    condense += (condenseTarget - condense) * (reduceMotion ? 1 : 0.09)
    const t = animate ? (frozenT = (performance.now() - t0) / 1000) : frozenT
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
    gl!.uniform1f(U.veil, veil[3])
    gl!.uniform3f(U.vc, veil[0], veil[1], veil[2])
    gl!.uniform3fv(U.c0, cols[0])
    gl!.uniform3fv(U.c1, cols[1])
    gl!.uniform3fv(U.c2, cols[2])
    gl!.uniform3fv(U.c3, cols[3])
    gl!.uniform3f(U.sun, sunX, sunY, moon)
    gl!.uniform1f(U.sa, sunAlpha)
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

  // --- Scheduling -------------------------------------------------------------------------
  // Animated: a continuous loop, ~30fps when idle, with adaptive quality.
  // Otherwise: one frame per change (scroll, resize, condense).
  let lastCb = 0
  let lastDraw = 0
  let slow = 0
  let samples = 0

  const degrade = () => {
    slow = samples = 0
    if (scaleStep < SCALES.length - 1) scaleStep++
    else {
      animate = false // keep the sky, stop the motion
      stop()
      addEventListener('scroll', request, { passive: true })
      request()
    }
  }

  const loop = (ts: number) => {
    raf = requestAnimationFrame(loop)
    if (lastCb) {
      samples++
      slow = ts - lastCb > SLOW_FRAME_MS ? slow + 1 : Math.max(0, slow - 1)
    }
    lastCb = ts
    if (samples > 20 && slow > 30) return degrade()
    if (ts - lastActive > IDLE_MS && ts - lastDraw < 30) return // idle: every other frame
    lastDraw = ts
    frame()
  }
  function request() {
    if (raf || document.hidden || !running) return
    raf = requestAnimationFrame(() => {
      raf = 0
      frame()
      // Let the headline finish condensing even when nothing else moves.
      if (Math.abs(condenseTarget - condense) > 0.002) request()
    })
  }
  function start() {
    if (raf || !running) return
    lastCb = 0
    if (animate) raf = requestAnimationFrame(loop)
    else request()
  }
  function stop() {
    cancelAnimationFrame(raf)
    raf = 0
  }

  const active = () => (lastActive = performance.now())
  addEventListener('pointermove', (e) => {
    mt[0] = e.clientX / innerWidth
    mt[1] = 1 - e.clientY / innerHeight
    mpt = 1
    active()
  }, { passive: true })
  root.addEventListener('pointerleave', () => (mpt = 0))
  addEventListener('scroll', active, { passive: true })
  if (home && !animate) addEventListener('scroll', request, { passive: true })
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
    running = false
  })
  canvas.addEventListener('webglcontextrestored', () =>
    setup((ok) => {
      if (!ok) return
      running = true
      needText = home
      start()
    }),
  )

  measure()
  whenIdle(() =>
    setup((ok) => {
      if (!ok) return noGL()
      running = true
      start()
    }),
  )
}
