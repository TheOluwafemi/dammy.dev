import { describe, expect, it } from 'vitest'
import { INK_FLIP, PAL_HEX, hexRgb, inkAt, litePal, palAt, realProg, skyGradient } from './core.js'
import { buildAnchors, dayAt } from './day'
import { clockToProg, heroPhase, phaseName, progToClock, timeLine } from './time'
import { bootScript } from './bootstrap'

describe('realProg (spec §5.2)', () => {
  it('maps the clock onto dawn, day, dusk and night', () => {
    expect(realProg(3)).toBe(3)
    expect(realProg(5)).toBe(0)
    expect(realProg(12)).toBe(1)
    expect(realProg(18.5)).toBe(2)
    expect(realProg(21.99)).toBeCloseTo(2.997, 2)
    expect(realProg(22)).toBe(3)
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
  it('builds a CSS gradient from c0, c2 and c3', () => {
    expect(skyGradient(palAt(3))).toBe('linear-gradient(160deg,rgb(29,33,80),rgb(91,62,158) 60%,rgb(255,182,94))')
  })
})

describe('ink (spec §3.3)', () => {
  it('flips from dark to light at 1.75', () => {
    expect(INK_FLIP).toBe(1.75)
    expect(inkAt(1.749)).toBe('dark')
    expect(inkAt(1.75)).toBe('light')
  })
})

describe('clock labels (spec §5.3)', () => {
  it('maps day progress to the clock keyframes', () => {
    expect(progToClock(0)).toBe('05:30')
    expect(progToClock(1)).toBe('12:00')
    expect(progToClock(2)).toBe('18:30')
    expect(progToClock(3)).toBe('23:30')
  })
  it('inverts the section labels', () => {
    for (const label of ['06:40', '12:10', '16:00', '18:30', '23:00']) expect(progToClock(clockToProg(label))).toBe(label)
  })
  it('names each section by its own time', () => {
    expect(phaseName(clockToProg('06:40'))).toBe('dawn')
    expect(phaseName(clockToProg('12:10'))).toBe('midday')
    expect(phaseName(clockToProg('16:00'))).toBe('afternoon')
    expect(phaseName(clockToProg('18:30'))).toBe('dusk')
    expect(phaseName(clockToProg('23:00'))).toBe('night')
  })
  it('names the hero phase', () => {
    expect([0.2, 1, 2, 3].map(heroPhase)).toEqual(['dawn', 'daytime', 'dusk', 'night'])
  })
  it('writes the time pill', () => {
    expect(timeLine(new Date('2026-09-24T14:05:00Z'))).toMatch(/for me in the UK|Same time as me/)
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
    expect(progToClock(dayAt(2000, anchors))).toBe('12:10')
    expect(progToClock(dayAt(4500, anchors))).toBe('18:30')
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
    expect(code.length).toBeLessThan(2000)
    const props: Record<string, string> = {}
    const root = { dataset: {} as Record<string, string>, style: { setProperty: (k: string, v: string) => (props[k] = v) } }
    const meta = { content: '', setAttribute: (_: string, v: string) => (meta.content = v) }
    const doc = { documentElement: root, querySelector: () => meta }
    new Function('document', code)(doc)
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
      new Function('document', 'sessionStorage', bootScript(mode))({ documentElement: root, querySelector: () => null }, sessionStorage)
      return { root, props }
    }
    const first = run('home', false)
    expect(first.root.dataset.preloading).toBe('')
    expect(first.props['--pre-time']).toMatch(/^"\d\d:\d\d"$/)
    expect(run('home', true).root.dataset.preloading).toBeUndefined()
    expect(run('lite', false).root.dataset.preloading).toBeUndefined()
  })
  it('always uses dark ink on lite pages', () => {
    const root = { dataset: {} as Record<string, string>, style: { setProperty: () => {} } }
    new Function('document', bootScript('lite'))({ documentElement: root, querySelector: () => null })
    expect(root.dataset.ink).toBe('dark')
  })
})
