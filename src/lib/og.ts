import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

// Satori cannot read woff2 or variable fonts, so OG cards use fontsource's static woff files
// (devDependencies). Resolved from the project root, because bundled chunks move.
const font = (pkg: string, file: string) => readFileSync(resolve(process.cwd(), 'node_modules/@fontsource', pkg, 'files', file))
const fonts = [
  { name: 'Bricolage Grotesque', data: font('bricolage-grotesque', 'bricolage-grotesque-latin-800-normal.woff'), weight: 800 as const, style: 'normal' as const },
  { name: 'Figtree', data: font('figtree', 'figtree-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Figtree', data: font('figtree', 'figtree-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
]

type Node = { type: string; props: { style?: Record<string, unknown>; children?: Node | string | (Node | string)[] } }
const h = (style: Record<string, unknown>, children?: Node['props']['children']): Node => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } })

export interface OgCard {
  eyebrow: string
  title: string
  summary: string
}

/** 1200x630 PNG, built at deploy time. Palette matches the dark theme tokens. */
export async function renderOg({ eyebrow, title, summary }: OgCard): Promise<Buffer> {
  const tree = h(
    {
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      padding: '72px 80px',
      background: '#0f0f1b',
      color: '#fdfdff',
      fontFamily: 'Figtree',
    },
    [
      h({ fontSize: 30, fontWeight: 500, color: '#a4a4bd' }, 'dammy.dev'),
      h({ flexDirection: 'column', gap: 20 }, [
        h({ fontSize: 26, color: '#a4a4bd', letterSpacing: 4, textTransform: 'uppercase' }, eyebrow),
        h({ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: title.length > 18 ? 96 : 124, lineHeight: 1, letterSpacing: '-0.04em', color: '#ffb65e' }, title),
        h({ fontSize: 36, lineHeight: 1.35, color: '#fdfdff', maxWidth: 940 }, summary),
      ]),
      h({ fontSize: 28, color: '#a4a4bd' }, 'Damilola Oluwafemi · Software engineer'),
    ],
  )
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts })
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
}
