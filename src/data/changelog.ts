/**
 * "All notable changes to Damilola Oluwafemi" (spec §4.8).
 * The major version is years in the industry since 2018, so 2018–2020 ship as 0.x.
 * Facts come from the CV (src/data/experience.ts) and the work collection; keep them true.
 */
export type Tag = 'planned' | 'feat' | 'breaking' | 'docs' | 'chore'
export interface Release {
  version: string
  date: string
  items: [Tag, string][]
}

export const TAGS: Tag[] = ['planned', 'feat', 'breaking', 'docs', 'chore']

export const releases: Release[] = [
  {
    version: 'Unreleased',
    date: 'in progress',
    items: [
      ['planned', 'Flaghoist stable release.'],
      ['planned', 'A proper docs site for Flaghoist.'],
    ],
  },
  {
    version: '8.0.0',
    date: '2026',
    items: [
      ['feat', 'Flaghoist: OpenFeature-native feature flags you host yourself, with a dashboard, CLI and MCP server on Cloudflare’s free tier.'],
      ['feat', 'Fourteen packages on one release train with changesets.'],
      ['docs', 'Wrote about sticky rollouts, OFREP, and release pipelines that look fine while doing nothing.'],
    ],
  },
  {
    version: '7.0.0',
    date: '2025',
    items: [
      ['feat', 'dsl-query-builder: a zero-dependency TypeScript query builder for OpenSearch and Elasticsearch DSL.'],
      ['feat', 'vue-form-manager: form validation for Vue 3 from plain configuration objects.'],
      ['feat', 'bolsa: state management with persistence, middleware and encryption, for web and React Native.'],
    ],
  },
  {
    version: '3.0.0',
    date: '2021 – 2022',
    items: [
      ['breaking', 'Moved into crypto as a frontend engineer at Yellowcard.'],
      ['feat', 'Shipped through the expansion into 10 new African markets.'],
      ['feat', 'Added multi-language support to the web app and the marketing site.'],
    ],
  },
  {
    version: '0.x',
    date: '2018 – 2020',
    items: [
      ['feat', 'Fidelity Bank: led the front-end and UI/UX unit, and digitised visitor sign-in, cutting sign-in time by 50%.'],
      ['feat', 'Sterling Bank (Gomoney): lifted website conversion by 45% and built admin tooling that cut dispute resolution time by 70%.'],
    ],
  },
]

/** npm dist-tag for a version: "Unreleased" installs as `next`. */
export const distTag = (v: string) => (v === 'Unreleased' ? 'next' : v)
export const releaseId = (v: string) => 'rel-' + v.replace(/[^a-z0-9]/gi, '-').toLowerCase()
