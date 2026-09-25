// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark'
import autolinkHeadings from 'rehype-autolink-headings'

// Fully static output. No server adapter: Cloudflare serves ./dist directly
// via Workers static assets (see wrangler.jsonc).
export default defineConfig({
  site: 'https://dammy.dev',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  // Self-hosted through Astro's Fonts API: no request to Google at runtime.
  fonts: [
    {
      // Variable file with the optical-size axis, which the design relies on for large display type.
      name: 'Bricolage Grotesque',
      cssVariable: '--font-bricolage',
      provider: fontProviders.local(),
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['./node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2'],
            weight: '200 800',
            style: 'normal',
          },
        ],
      },
    },
    {
      name: 'Figtree',
      cssVariable: '--font-figtree',
      provider: fontProviders.fontsource(),
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      name: 'DM Mono',
      cssVariable: '--font-dm-mono',
      provider: fontProviders.fontsource(),
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],
  markdown: {
    shikiConfig: { theme: 'github-light-high-contrast' },
    // Unified (not the default Sätteri) because rehype-autolink-headings is a rehype plugin.
    // It adds a link to each heading so a section can be shared.
    processor: unified({
      rehypePlugins: [
        rehypeHeadingIds,
        [
          autolinkHeadings,
          {
            behavior: 'append',
            properties: { class: 'heading-anchor', ariaLabel: 'Link to this section' },
            content: { type: 'text', value: '#' },
          },
        ],
      ],
    }),
  },
  integrations: [
    mdx(),
    sitemap(),
  ],
})
