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
  integrations: [mdx(), sitemap()],
})
