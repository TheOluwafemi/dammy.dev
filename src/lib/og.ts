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
/** 1200x630 PNG, built at deploy time, on the sky's night palette (the site's no-JS look). */
export async function renderOg({ eyebrow, title, summary }: OgCard): Promise<Buffer> {
  const ink = '#fbf5ff'
  const soft = 'rgba(251,245,255,0.72)'
  const tree = h(
    {
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      padding: '72px 80px',
      backgroundImage: 'linear-gradient(160deg, #1d2150, #5b3e9e 60%, #ffb65e)',
      color: ink,
      fontFamily: 'Figtree',
    },
    [
      h({ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 34, letterSpacing: '-0.01em' }, 'dammy.dev'),
      h({ flexDirection: 'column', gap: 22 }, [
        h({ fontSize: 24, color: soft, letterSpacing: 4, textTransform: 'uppercase' }, eyebrow),
        h({ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: title.length > 18 ? 100 : 132, lineHeight: 0.95, letterSpacing: '-0.05em' }, title),
        h({ fontSize: 34, lineHeight: 1.35, maxWidth: 960 }, summary),
      ]),
      h({ fontSize: 26, color: soft }, 'Damilola Oluwafemi · Software engineer · United Kingdom'),
    ],
  )
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts })
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
}
