export const site = {
  name: 'Damilola Oluwafemi',
  url: 'https://dammy.dev',
  // Public address already on the live site. Change it here and it updates everywhere.
  email: 'oluwafemidamilola21@gmail.com',
  location: 'United Kingdom',
} as const

export const nav = [
  { label: 'Work', href: '/work' },
  { label: 'Writing', href: '/writing' },
  { label: 'About', href: '/about' },
  { label: 'Uses', href: '/uses' },
] as const

export const socials = [
  { label: 'GitHub', href: 'https://github.com/TheOluwafemi' },
  { label: 'npm', href: 'https://www.npmjs.com/~dammyskillz_' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/damilola-oluwafemi' },
  { label: 'X', href: 'https://twitter.com/dammyskillz_' },
] as const

/** The "Now" block. Update the date each time you touch the text: it is shown, so staleness is honest. */
export const now = {
  date: 'September 2026',
  text: 'Building Flaghoist. It is pre-alpha, and I am working towards a stable release and a proper docs site. I also maintain a handful of small TypeScript libraries that came out of work I needed done.',
} as const

/**
 * Home "Selected work". Temporary: links go to the live projects until case studies
 * exist (plan Phase 3), when this moves to the `work` content collection.
 * TODO(you): add a real result for Yellowcard (users, markets, scale) if you can share it.
 */
export const featured = [
  {
    title: 'Flaghoist',
    summary: 'OpenFeature-native feature flags you host yourself. Runs on Cloudflare’s free tier, with dashboards, a CLI and an MCP server.',
    meta: 'Open source · 2026',
    href: 'https://flaghoist.dev',
    stats: 'flaghoist',
  },
  {
    title: 'Yellowcard',
    summary: 'Lead developer on the cryptocurrency exchange and on Yellowcard Academy, its learning platform.',
    meta: 'Product · 2021–2022',
    href: 'https://yellowcard.io',
  },
  {
    title: 'dsl-query-builder',
    summary: 'A zero-dependency TypeScript query builder for OpenSearch and Elasticsearch DSL.',
    meta: 'Open source · 2025',
    href: 'https://github.com/TheOluwafemi/dsl-query-builder',
  },
] as const
