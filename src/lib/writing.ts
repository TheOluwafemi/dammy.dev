import { getCollection, type CollectionEntry } from 'astro:content'

export type Post = CollectionEntry<'writing'>

/** Newest first. Drafts excluded. Ties (same day) fall back to title so the order is stable. */
export async function getPosts(): Promise<Post[]> {
  const all = await getCollection('writing', (p) => !p.data.draft)
  return all.sort((a, b) => +b.data.published - +a.data.published || a.data.title.localeCompare(b.data.title))
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
