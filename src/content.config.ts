import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const month = z.string().regex(/^\d{4}(-\d{2})?$/, 'use YYYY or YYYY-MM')

const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    /** One line. Used on the index, in the home list and as the OG description. */
    summary: z.string(),
    kind: z.enum(['product', 'open-source', 'experiment']),
    role: z.string().optional(),
    org: z.string().optional(),
    start: month,
    /** Omit for ongoing. */
    end: month.optional(),
    /** Shown in the home "Selected work" list. */
    featured: z.boolean().default(false),
    /** Sort order among featured entries; lower first. */
    weight: z.number().default(100),
    /** Has its own /work/[slug] page. Otherwise the row links out to links[0]. */
    caseStudy: z.boolean().default(false),
    stack: z.array(z.string()).default([]),
    /** Static facts. Live npm numbers come from `npm`, so they never go stale. */
    metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    /** 'flaghoist' = every Flaghoist package; or an explicit list of package names. */
    npm: z.union([z.literal('flaghoist'), z.array(z.string())]).optional(),
    links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
    draft: z.boolean().default(false),
  }),
})

export const collections = { work }
