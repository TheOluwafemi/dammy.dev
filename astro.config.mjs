// @ts-check
import { defineConfig } from 'astro/config'
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
  markdown: {
    shikiConfig: { themes: { light: 'github-light-high-contrast', dark: 'github-dark' } },
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
    // /cv is the print source for cv.pdf, not a page to index.
    sitemap({ filter: (page) => !/\/cv$/.test(page) }),
  ],
})
