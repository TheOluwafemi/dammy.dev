/**
 * Live npm data, fetched at build time (plan 3.6). The build must never break because
 * npm is slow or down: every field has a fallback, and SKIP_NPM_FETCH=1 forces it.
 */
export interface Pkg {
  name: string
  description: string
  /** Last-month downloads, or null when unavailable. */
  downloads: number | null
  url: string
}

const FALLBACK: Record<string, string> = {
  flaghoist: 'Scaffold, deploy, and manage your Flaghoist feature-flag service from the terminal.',
  'create-flaghoist': 'Scaffold a Flaghoist feature-flag service, the package behind `npm create flaghoist`.',
  '@flaghoist/server': 'Hono app factory for Flaghoist: OFREP evaluate, admin CRUD, and pluggable auth.',
  '@flaghoist/core': 'Flag schema, evaluation engine, and storage/auth interfaces for Flaghoist. Zero dependencies.',
  '@flaghoist/adapter-cloudflare-kv': 'Cloudflare Workers KV StorageAdapter for Flaghoist, the default storage backend.',
  '@flaghoist/adapter-redis': 'Redis StorageAdapter for Flaghoist. Works with ioredis (Node) and Upstash (edge).',
  '@flaghoist/adapter-postgres': 'Postgres StorageAdapter for Flaghoist. Stores flags in a jsonb table.',
  '@flaghoist/adapter-sqlite': 'SQLite StorageAdapter for Flaghoist, via any better-sqlite3-compatible driver.',
  '@flaghoist/adapter-memory': 'In-memory StorageAdapter for Flaghoist: development, tests, and fallback defaults.',
  '@flaghoist/provider-web': 'OpenFeature web SDK provider for Flaghoist, pre-wired for browser and client apps.',
  '@flaghoist/provider-node': 'OpenFeature server SDK provider for Flaghoist, pre-wired for Node and server apps.',
  '@flaghoist/vue': 'Vue 3 bindings for Flaghoist: the useFeatureFlag() composable and a FlaghoistProvider.',
  '@flaghoist/mcp': 'MCP server for Flaghoist feature-flag management. Lets coding agents read and manage flags.',
  '@flaghoist/admin-client': 'HTTP client for the Flaghoist admin API, shared by the CLI, dashboard, and MCP server.',
  'dsl-query-builder': 'A lightweight, zero-dependency TypeScript query builder for OpenSearch/Elasticsearch DSL.',
  'vue-form-manager': 'A lightweight, type-safe form validation and management library for Vue 3 with Zod.',
}

const NAMES = Object.keys(FALLBACK)
const TIMEOUT_MS = 8000

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

async function load(name: string): Promise<Pkg> {
  const offline = process.env.SKIP_NPM_FETCH === '1'
  const [meta, dl] = offline
    ? [null, null]
    : await Promise.all([
        getJson(`https://registry.npmjs.org/${name.replace('/', '%2F')}/latest`),
        getJson(`https://api.npmjs.org/downloads/point/last-month/${name}`),
      ])
  return {
    name,
    description: (typeof meta?.description === 'string' && meta.description) || FALLBACK[name],
    downloads: typeof dl?.downloads === 'number' ? dl.downloads : null,
    url: `https://www.npmjs.com/package/${name}`,
  }
}

let cached: Promise<Pkg[]> | undefined

export function getPackages(): Promise<Pkg[]> {
  cached ??= Promise.all(NAMES.map(load)).then((all) =>
    all.sort((a, b) => (b.downloads ?? -1) - (a.downloads ?? -1) || a.name.localeCompare(b.name)),
  )
  return cached
}

export interface Summary {
  count: number
  /** Total last-month downloads, or null unless every package reported one. */
  downloads: number | null
}

export function summarise(pkgs: Pkg[]): Summary {
  const known = pkgs.filter((p) => p.downloads !== null)
  return {
    count: pkgs.length,
    downloads: known.length === pkgs.length ? known.reduce((n, p) => n + (p.downloads as number), 0) : null,
  }
}

export const isFlaghoist = (p: Pkg) => p.name === 'flaghoist' || p.name.endsWith('flaghoist') || p.name.startsWith('@flaghoist/')

/** 5,512 -> "5,500". Keeps the claim honest without false precision. */
export function roughly(n: number): string {
  const step = n >= 1000 ? 100 : 10
  return (Math.round(n / step) * step).toLocaleString('en-GB')
}
