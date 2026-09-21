import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getPosts } from '../lib/writing'

export async function GET(context: APIContext) {
  const posts = await getPosts()
  return rss({
    title: 'Damilola Oluwafemi: writing',
    description: 'Build notes from Flaghoist and other projects.',
    site: context.site!,
    trailingSlash: false,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.summary,
      pubDate: p.data.published,
      link: `/writing/${p.id}`,
    })),
  })
}
