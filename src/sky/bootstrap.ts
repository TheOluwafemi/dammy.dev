// Builds the blocking <head> script from core.js at build time: one source of truth for the
// sky maths, minified to a few hundred bytes and inlined so nothing flashes before first paint.
import { transformSync } from 'esbuild'
import coreSource from './core.js?raw'

export type SkyMode = 'home' | 'lite'

const cache = new Map<SkyMode, string>()

export function bootScript(mode: SkyMode): string {
  let code = cache.get(mode)
  if (!code) {
    const src = coreSource.replace(/^export /gm, '') + `\nboot(document.documentElement, ${JSON.stringify(mode)}, new Date());`
    code = transformSync(src, { loader: 'js', format: 'iife', minify: true, target: 'es2019' }).code
    cache.set(mode, code)
  }
  return code
}
