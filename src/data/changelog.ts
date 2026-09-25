/**
 * "All notable changes to Damilola Oluwafemi" (spec §4.8).
 * The major version is years in the industry since 2018, so 2018–2020 ship as 0.x.
 * Facts come from the career history and the work collection; keep them true.
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
    version: '8.0.0',
    date: '2026',
    items: [
      [
        'feat',
        'Flaghoist: OpenFeature-native feature flags you host yourself, rolled with a dashboard, CLI and MCP server.',
      ],
      ['feat', '14 packages on one release train with Changesets.'],
      ['feat', 'Launched the Flaghoist docs and a live demo.'],
      [
        'docs',
        'Wrote about sticky rollouts, OFREP and silent failures in release pipelines.',
      ],
    ],
  },
  {
    version: '7.1.0',
    date: '2026',
    items: [
      ['feat', 'Lead and managed a team of frontend developers.'],
      [
        'feat',
        'Build and architect projects including a full component design system.',
      ],
    ],
  },
  {
    version: '7.0.0',
    date: '2025',
    items: [
      [
        'feat',
        'dsl-query-builder: a zero-dependency TypeScript query builder for OpenSearch and Elasticsearch DSL.',
      ],
      [
        'feat',
        'vue-form-manager: form validation for Vue 3 from plain configuration objects.',
      ],
      [
        'feat',
        'bolsa: state management with persistence, middleware and encryption, for web and React Native.',
      ],
    ],
  },
  {
    version: '3.0.0',
    date: '2021-',
    items: [
      ['breaking', 'Moved into digital assets as a frontend engineer.'],
      ['feat', 'Helped launch in heavily-regulated global markets.'],
    ],
  },
  {
    version: '0.x',
    date: '2018–2020',
    items: [
      [
        'feat',
        'Banking: led the front-end and UI/UX unit, and digitised visitor sign-in, cutting sign-in time by 50%.',
      ],
      [
        'feat',
        'Banking: lifted website conversion by 45% and built admin tooling that cut dispute resolution time by 70%.',
      ],
    ],
  },
]

export const releaseId = (v: string) => 'rel-' + v.replace(/[^a-z0-9]/gi, '-').toLowerCase()
