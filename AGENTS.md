## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project

Personal site for dammy.dev, rebuilt in Astro (static output, Cloudflare Workers static assets).
The full plan lives in `docs/PLAN.md` (gitignored, local only). Work through Part 4 phases in order.

- Motion is CSS-first. Tokens (`--ease-out`, `--dur-*`) are in `src/styles/tokens.css`. Never `transition: all`, `ease-in`, or `scale(0)`; no UI animation over 300ms. Content ships visible (no `opacity:0` in markup).
- Emil Kowalski's animation skills are in `.claude/skills`; run `review-animations` before shipping.
- Fonts (Chaviera, Neue Montreal) are commercial. Confirm the web-embedding licence before this repo goes public.
- Deploy: `npm run deploy` (needs `wrangler login`).
