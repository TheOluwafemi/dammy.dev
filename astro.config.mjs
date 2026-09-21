// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'

// Fully static output. No server adapter: Cloudflare serves ./dist directly
// via Workers static assets (see wrangler.jsonc).
export default defineConfig({
  site: 'https://dammy.dev',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
  integrations: [
    mdx(),
    // Stub pages are noindex until Phase 4 replaces them; keep them out of the sitemap too.
    sitemap({ filter: (page) => !/\/(writing|about|uses)$/.test(page) }),
  ],
})
