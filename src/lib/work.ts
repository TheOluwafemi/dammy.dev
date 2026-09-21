import { getCollection, type CollectionEntry } from 'astro:content'

export type Work = CollectionEntry<'work'>

const KIND: Record<Work['data']['kind'], string> = {
  product: 'Product',
  'open-source': 'Open source',
  experiment: 'Experiment',
}
export const kindLabel = (w: Work) => KIND[w.data.kind]

/** Newest first, then by weight. Drafts excluded. */
export async function getWork(): Promise<Work[]> {
  const all = await getCollection('work', (w) => !w.data.draft)
  return all.sort((a, b) => b.data.start.localeCompare(a.data.start) || a.data.weight - b.data.weight)
}

export async function getFeatured(): Promise<Work[]> {
  return (await getWork()).filter((w) => w.data.featured).sort((a, b) => a.data.weight - b.data.weight)
}

export function years(w: Work): string {
  const s = w.data.start.slice(0, 4)
  const e = w.data.end?.slice(0, 4)
  if (!w.data.end) return `${s}–present`
  return e === s ? s : `${s}–${e}`
}

/** Case studies live on-site; everything else links out. */
export function hrefFor(w: Work): string {
  return w.data.caseStudy ? `/work/${w.id}` : (w.data.links[0]?.href ?? '/work')
}
export const isExternal = (w: Work) => !w.data.caseStudy
