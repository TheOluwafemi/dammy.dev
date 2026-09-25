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

Personal site for dammy.dev: "A day with Damilola". Astro, static output, served as Cloudflare Workers static assets.

- **Design source of truth:** `docs/Personal website redesign/BUILD-SPEC.md` and the reference `Dammy Site.dc.html` (the reference wins on conflict). The implementation plan is `docs/REDESIGN-PLAN.md`; work through its phases (R0–R7) in order. `docs/` is gitignored and local only.
- **Tokens** live in `src/styles/tokens.css`. The ink skin is `data-ink="dark|light"` on `<html>`, set by the head script and the sky loop, never by hand. Don't add aliases or second names for a token: rename the usages instead.
- **Fonts:** Bricolage Grotesque (a variable file with the opsz axis), Figtree and DM Mono, all OFL, self-hosted through Astro's Fonts API (`astro.config.mjs`). OG images use fontsource `.woff` files because Satori can't read woff2.
- **Motion:**
  - Only `transform`, `opacity`, colour and `filter` animate. Never `transition: all`, `ease-in` or `scale(0)`.
  - Responses to input stay under 300ms. Spec values over that are documented exceptions:
    - The work-row slide (350ms) and the card and button lifts (overshoot curve) are hover-only, gated to `(hover: hover) and (pointer: fine)`.
    - Sky-driven colour changes (`--dur-skin`, 0.8s), the changelog row highlight (0.5s), the scroll-clock fade (0.4s) and the preloader fade (0.7s) are ambient, not responses to input.
  - Content ships visible: no `opacity: 0` in markup.
  - Emil Kowalski's skills are in `.claude/skills`; run `review-animations` before shipping.
- **The sky** (`src/sky/`) is shared maths in `core.js` (also inlined into `<head>` by `bootstrap.ts`), with Vitest tests in `sky.test.ts` (`npm test`). The tests guard the contrast of every sky colour against the ink shown over it. `?at=HH:MM` previews the sky at any time of day.
- **No bloat:** delete what a change makes unused (tokens, components, dependencies, assets) in the same change.
- **Deploy:** `npm run deploy` (needs `wrangler login`). Cutover steps are in `docs/CUTOVER.md`.
