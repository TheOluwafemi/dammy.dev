export const site = {
  name: 'Damilola Oluwafemi',
  url: 'https://dammy.dev',
  // Public address already on the live site. Change it here and it updates everywhere.
  email: 'oluwafemidamilola21@gmail.com',
  location: 'United Kingdom',
} as const

/** Main nav: sections of the home page (spec §4). `/#…` works from every page. */
export const nav = [
  { label: 'Work', href: '/#work' },
  { label: 'Changelog', href: '/#changelog' },
  { label: 'Writing', href: '/#writing' },
  { label: 'Contact', href: '/#contact' },
] as const

/** Pages that are not sections of home; linked from the footer. */
export const footerLinks = [
  { label: 'RSS', href: '/rss.xml' },
] as const

/**
 * The strip under the hero (spec §4.5, with plain labels instead of the spec's weather words).
 * Downloads and package counts are filled in from npm at build time; these are the rest.
 * `availability` is a public statement: keep it true.
 */
export const conditions = {
  building: { value: 'Flaghoist', note: 'open-source feature flags' },
  availability: { value: 'Open to talk', note: 'contact details below' },
} as const

/** Profile links shown in the Contact section. */
export const socials = [
  { label: 'GitHub', href: 'https://github.com/TheOluwafemi' },
  { label: 'npm', href: 'https://www.npmjs.com/~dammyskillz_' },
] as const

/** The "Now" block. Update the date each time you touch the text: it is shown, so staleness is honest. */
export const now = {
  updated: 'September 2026',
  /** The large statement (spec §4.6). */
  statement: 'Flaghoist is live.',
  tiles: [
    { label: 'Docs', value: 'docs.flaghoist.dev', href: 'https://docs.flaghoist.dev' },
    { label: 'Demo', value: 'demo.flaghoist.dev', href: 'https://demo.flaghoist.dev' },
  ],
} as const

/** Writing published on other sites. */
export const elsewhere = [
  {
    title: 'What is NPX?',
    summary: 'What npx does, and how it runs a package without a global install.',
    href: 'https://www.educative.io/answers/what-is-npx',
    site: 'Educative',
  },
  {
    title: 'MVC explained',
    summary: 'A short explanation of the Model-View-Controller pattern.',
    href: 'https://www.educative.io/answers/mvc-explained',
    site: 'Educative',
  },
  {
    title: 'Getting started with Vue',
    summary: 'An introduction to Vue, the JavaScript framework for building user interfaces.',
    href: 'https://medium.com/@The_Oluwafemi/getting-started-with-vue-f654da6125dc',
    site: 'Medium',
  },
] as const
