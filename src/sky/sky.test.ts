import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { INK_FLIP, PAL_HEX, hexRgb, inkAt, litePal, palAt, realProg, skyClock, skyGradient, veilAt } from './core.js'
import { buildAnchors, dayAt } from './day'
import { clockToProg, heroPhase, hourToProg, progToHour } from './time'
import { bootScript } from './bootstrap'
import { bodyAt, heroSky, hourBetween, SUNRISE, SUNSET, MOONRISE, MOONSET } from './celestial'

describe('realProg', () => {
  it('maps the clock onto dawn, day, dusk and night, realistically', () => {
    expect(realProg(3)).toBe(3)
    expect(realProg(5)).toBe(0)
    expect(realProg(8.5)).toBe(1) // full day by half past eight
    expect(realProg(12)).toBe(1)
    expect(realProg(16)).toBe(1)
    expect(realProg(19.5)).toBe(2) // dusk at sunset
    expect(realProg(22)).toBe(3)
  })
  it('never runs backwards through the day', () => {
    let last = -1
    for (let m = 5 * 60; m < 22 * 60; m++) {
      const p = realProg(m / 60)
      expect(p).toBeGreaterThanOrEqual(last)
      last = p
    }
  })
})

describe('?at= preview', () => {
  it('overrides the clock', () => {
    const d = skyClock('?at=18:30')
    expect([d.getHours(), d.getMinutes()]).toEqual([18, 30])
    expect(skyClock('').getTime()).toBeGreaterThan(0)
  })
})

describe('palette (spec §3.2)', () => {
  it('returns each phase exactly at integer progress', () => {
    for (let i = 0; i < 4; i++)
      palAt(i).forEach((c, k) => c.forEach((v, j) => expect(v).toBeCloseTo(hexRgb(PAL_HEX[i][k])[j], 9)))
  })
  it('interpolates linearly between phases and clamps', () => {
    const mid = palAt(0.5)[0]
    const [a, b] = [hexRgb(PAL_HEX[0][0]), hexRgb(PAL_HEX[1][0])]
    mid.forEach((v, j) => expect(v).toBeCloseTo((a[j] + b[j]) / 2, 6))
    expect(palAt(-1)).toEqual(palAt(0))
    expect(palAt(9)).toEqual(palAt(3)) // clamped to the same input
  })
  it('lightens the lite sky towards white', () => {
    litePal().forEach((c, i) => c.forEach((v, j) => expect(v).toBeGreaterThanOrEqual(palAt(0.85)[i][j])))
  })
  it('keeps the static no-JS fallback in tokens.css in sync with the code', () => {
    const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')
    expect(css).toContain(`--sky-fallback: ${skyGradient(palAt(3), veilAt(3))};`)
  })
})

describe('ink and contrast (spec §3.3, plan §6.5)', () => {
  const lum = (c: number[]) => {
    const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
  }
  const ratio = (a: number[], b: number[]) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  const mixc = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t)
  const DARK = hexRgb('#17131d')
  const LIGHT = hexRgb('#fbf5ff')

  it('flips late, at 2.55', () => {
    expect(INK_FLIP).toBe(2.55)
    expect(inkAt(2.549)).toBe('dark')
    expect(inkAt(2.55)).toBe('light')
  })

  it('keeps the see-through changelog panel at 4.5:1 over every sky', () => {
    const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')
    const alpha = Number(css.match(/--paper: rgba\(255, 252, 247, ([\d.]+)\)/)![1])
    const muted = hexRgb(css.match(/--paper-ink-muted: (#[0-9a-f]{6})/)![1])
    const paper = hexRgb('#fffcf7')
    let worst = Infinity
    for (let i = 0; i <= 300; i++) {
      const sp = i / 100
      const [c0, c1, c2, c3] = palAt(sp)
      const v = veilAt(sp)
      for (const px of [c0, c1, c2, mixc(c0, c3, 0.4), mixc(c1, c3, 0.4)]) {
        worst = Math.min(worst, ratio(muted, mixc(mixc(px, v.slice(0, 3), v[3]), paper, alpha)))
      }
    }
    expect(worst).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps every veiled sky colour at 4.5:1 against the ink, all day', () => {
    let worst = Infinity
    for (let i = 0; i <= 300; i++) {
      const sp = i / 100
      const [c0, c1, c2, c3] = palAt(sp)
      const v = veilAt(sp)
      const ink = inkAt(sp) === 'dark' ? DARK : LIGHT
      for (const px of [c0, c1, c2, mixc(c0, c3, 0.4), mixc(c1, c3, 0.4)]) {
        worst = Math.min(worst, ratio(ink, mixc(px, v.slice(0, 3), v[3])))
      }
    }
    expect(worst).toBeGreaterThanOrEqual(4.5)
  })
})

describe('clock (spec §5.3)', () => {
  it('maps day progress to the clock keyframes', () => {
    expect([0, 1, 2, 3].map(progToHour)).toEqual([5.5, 12, 18.5, 23.5])
  })
  it('inverts the section times', () => {
    for (const h of [6 + 40 / 60, 12 + 10 / 60, 16, 18.5, 23]) expect(progToHour(hourToProg(h))).toBeCloseTo(h)
    expect(progToHour(clockToProg('12:10'))).toBeCloseTo(12 + 10 / 60)
  })
  it('names the hero phase from the hour', () => {
    expect([6, 8.5, 14, 17 + 25 / 60, 19.5, 23, 3].map(heroPhase)).toEqual(['dawn', 'morning', 'afternoon', 'evening', 'dusk', 'night', 'night'])
  })
})

describe('anchor-based day (plan §6.3)', () => {
  const anchors = buildAnchors(900, 6000, [
    { at: 1000, prog: clockToProg('06:40') },
    { at: 2000, prog: clockToProg('12:10') },
    { at: 3000, prog: clockToProg('16:00') },
    { at: 4500, prog: clockToProg('18:30') },
    { at: 5500, prog: clockToProg('23:00') },
  ])
  it('reaches each section at its own time', () => {
    expect(progToHour(dayAt(2000, anchors))).toBeCloseTo(12 + 10 / 60)
    expect(progToHour(dayAt(4500, anchors))).toBeCloseTo(18.5)
    expect(dayAt(6000, anchors)).toBe(3)
    expect(dayAt(0, anchors)).toBe(0)
  })
  it('is monotonic', () => {
    let last = -1
    for (let s = 0; s <= 6000; s += 50) {
      const d = dayAt(s, anchors)
      expect(d).toBeGreaterThanOrEqual(last)
      last = d
    }
  })
  it('drops anchors that would run backwards', () => {
    const a = buildAnchors(900, 3000, [
      { at: 2000, prog: 1 },
      { at: 3000, prog: 2.9 },
      { at: 3000, prog: 2 },
    ])
    for (let i = 1; i < a.length; i++) expect(a[i].at).toBeGreaterThan(a[i - 1].at)
  })
})

describe('head bootstrap', () => {
  it('is small, and sets ink and sky before paint', () => {
    const code = bootScript('home')
    // It is inlined into every page's <head>: keep the transfer small.
    expect(gzipSync(code).length).toBeLessThan(1400)
    const props: Record<string, string> = {}
    const root = { dataset: {} as Record<string, string>, style: { setProperty: (k: string, v: string) => (props[k] = v) } }
    const meta = { content: '', setAttribute: (_: string, v: string) => (meta.content = v) }
    const doc = { documentElement: root, querySelector: () => meta }
    new Function('document', 'location', code)(doc, { search: '' })
    expect(root.dataset.js).toBe('')
    expect(['dark', 'light']).toContain(root.dataset.ink)
    expect(props['--sky-fallback']).toMatch(/^linear-gradient\(160deg,rgb/)
    expect(meta.content).toMatch(/^rgb\(/)
  })
  it('asks for the preloader only on the first home visit of a session', () => {
    const run = (mode: 'home' | 'lite', seen: boolean) => {
      const props: Record<string, string> = {}
      const root = { dataset: {} as Record<string, string>, style: { setProperty: (k: string, v: string) => (props[k] = v) } }
      const sessionStorage = { getItem: () => (seen ? '1' : null) }
      new Function('document', 'sessionStorage', 'location', bootScript(mode))({ documentElement: root, querySelector: () => null }, sessionStorage, { search: '' })
      return { root, props }
    }
    const first = run('home', false)
    expect(first.root.dataset.preloading).toBe('')
    expect(first.props['--pre-time']).toMatch(/^"\d\d:\d\d"$/)
    expect(run('home', true).root.dataset.preloading).toBeUndefined()
    expect(run('lite', false).root.dataset.preloading).toBeUndefined()
  })
  it('shows the preloader on every load with ?preload', () => {
    const root = { dataset: {} as Record<string, string>, style: { setProperty: () => {} } }
    const seen = { getItem: () => '1' }
    new Function('document', 'sessionStorage', 'location', bootScript('home'))({ documentElement: root, querySelector: () => null }, seen, { search: '?preload' })
    expect(root.dataset.preloading).toBe('')
  })
  it('always uses dark ink on lite pages', () => {
    const root = { dataset: {} as Record<string, string>, style: { setProperty: () => {} } }
    new Function('document', 'location', bootScript('lite'))({ documentElement: root, querySelector: () => null }, { search: '' })
    expect(root.dataset.ink).toBe('dark')
  })
})

describe('sun and moon (facing north: east on the right, west on the left)', () => {
  const HIDDEN = -0.06 // the disk's radius is about 0.06 of the screen height
  it('rises in the east (right) and sets in the west (left), below the screen', () => {
    const rise = bodyAt(SUNRISE)
    const set = bodyAt(SUNSET)
    expect(rise.moon).toBe(0)
    expect(rise.x).toBeGreaterThan(0.9)
    expect(set.x).toBeLessThan(0.1)
    expect(rise.y).toBeLessThan(HIDDEN)
    expect(set.y).toBeLessThan(HIDDEN)
  })
  it('is high and central at midday', () => {
    const noon = bodyAt((SUNRISE + SUNSET) / 2)
    expect(noon.y).toBeGreaterThan(0.8)
    expect(Math.abs(noon.x - 0.5)).toBeLessThan(0.02)
  })
  it('brings the moon up in the east (right) after sunset and down in the west (left) before dawn', () => {
    expect(bodyAt(MOONRISE).moon).toBe(1)
    expect(bodyAt(MOONRISE).x).toBeGreaterThan(0.9)
    expect(bodyAt(MOONSET - 0.001).x).toBeLessThan(0.1)
    expect(bodyAt(0.5).moon).toBe(1)
    expect(bodyAt(0.5).y).toBeGreaterThan(0.6)
  })
  it('only swaps sun and moon while the disk is below the horizon', () => {
    let prev = bodyAt(0)
    for (let m = 1; m <= 24 * 60; m++) {
      const cur = bodyAt(m / 60)
      if (cur.moon !== prev.moon) {
        expect(prev.y).toBeLessThan(HIDDEN)
        expect(cur.y).toBeLessThan(HIDDEN)
      }
      prev = cur
    }
  })
  it('walks the short way round the clock', () => {
    expect(hourBetween(23, 5.5, 0.5)).toBeCloseTo(2.25, 5)
    expect(hourBetween(14, 5.5, 0.5)).toBeCloseTo(9.75, 5)
    expect(hourBetween(14, 5.5, 0)).toBe(14)
    expect(hourBetween(14, 5.5, 1)).toBeCloseTo(5.5, 5)
  })
})

describe('scrolling never runs time backwards', () => {
  it('inverts hour and progress', () => {
    for (const h of [5.5, 6.2, 12, 16, 18.5, 23]) expect(progToHour(hourToProg(h))).toBeCloseTo(h, 6)
  })
  it('starts the scroll day from now when now is between sunrise and the first section', () => {
    const real = 6.2 // e.g. 06:12, before the Now section's 06:40
    const anchors = buildAnchors(900, 6000, [{ at: 1000, prog: clockToProg('06:40') }, { at: 2000, prog: clockToProg('12:10') }], hourToProg(real))
    let last = -Infinity
    for (let s = 0; s <= 2000; s += 10) {
      const tH = Math.min(1, s / (900 * 0.8))
      const { hour, alpha } = heroSky(real, progToHour(dayAt(s, anchors)), tH, true)
      expect(alpha).toBe(1)
      expect(hour).toBeGreaterThanOrEqual(last - 1e-9)
      last = hour
    }
  })
  it('otherwise hides the disk at the moment it jumps', () => {
    expect(heroSky(14, 5.6, 0.5, false).alpha).toBe(0)
    expect(heroSky(14, 5.6, 0, false)).toEqual({ hour: 14, alpha: 1 })
    expect(heroSky(14, 5.6, 1, false)).toEqual({ hour: 5.6, alpha: 1 })
  })
})
