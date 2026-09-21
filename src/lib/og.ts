import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

// Bundled chunks move, so resolve from the project root (builds run there).
const font = (f: string) => readFileSync(resolve(process.cwd(), 'src/assets/og', f))
const fonts = [
  { name: 'Chaviera', data: font('chaviera-regular.otf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Neue Montreal', data: font('neue-montreal-400.otf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Neue Montreal', data: font('neue-montreal-500.otf'), weight: 500 as const, style: 'normal' as const },
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
      fontFamily: 'Neue Montreal',
    },
    [
      h({ fontSize: 30, fontWeight: 500, color: '#a4a4bd' }, 'dammy.dev'),
      h({ flexDirection: 'column', gap: 20 }, [
        h({ fontSize: 26, color: '#a4a4bd', letterSpacing: 4, textTransform: 'uppercase' }, eyebrow),
        h({ fontFamily: 'Chaviera', fontSize: title.length > 18 ? 104 : 132, lineHeight: 1.05, color: '#b8c8ff' }, title),
        h({ fontSize: 36, lineHeight: 1.35, color: '#fdfdff', maxWidth: 940 }, summary),
      ]),
      h({ fontSize: 28, color: '#a4a4bd' }, 'Damilola Oluwafemi · Software engineer'),
    ],
  )
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts })
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
}
