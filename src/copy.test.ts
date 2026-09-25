// House style for site copy: no em-dashes anywhere in the source or public files.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const EM_DASH = String.fromCodePoint(0x2014)
const TEXT = /\.(astro|ts|js|mjs|md|mdx|css|txt|json)$/

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : TEXT.test(name) ? [path] : []
  })
}

describe('copy', () => {
  it('has no em-dashes', () => {
    const hits = [...files('src'), ...files('public')].flatMap((path) =>
      readFileSync(path, 'utf8')
        .split('\n')
        .flatMap((line, i) => (line.includes(EM_DASH) ? [`${path}:${i + 1}`] : [])),
    )
    expect(hits).toEqual([])
  })
})
