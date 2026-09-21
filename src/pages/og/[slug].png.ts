import type { APIRoute } from 'astro'
import { getWork, kindLabel } from '../../lib/work'
import { renderOg, type OgCard } from '../../lib/og'

export async function getStaticPaths() {
  const cards: Record<string, OgCard> = {
    home: {
      eyebrow: 'Software engineer',
      title: 'Damilola Oluwafemi',
      summary: 'I build developer tools and the products around them.',
    },
  }
  for (const w of (await getWork()).filter((w) => w.data.caseStudy)) {
    cards[w.id] = { eyebrow: `${kindLabel(w)} · Work`, title: w.data.title, summary: w.data.summary }
  }
  return Object.entries(cards).map(([slug, card]) => ({ params: { slug }, props: { card } }))
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props.card as OgCard)
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } })
}
