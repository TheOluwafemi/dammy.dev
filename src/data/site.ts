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
  { label: 'About', href: '/about' },
  { label: 'Uses', href: '/uses' },
  { label: 'CV', href: '/cv.pdf' },
  { label: 'RSS', href: '/rss.xml' },
] as const

/**
 * The Conditions strip (spec §4.5). Downloads and package counts are filled in from npm at
 * build time; these are the words around them.
 * `visibility` is a public statement about availability: keep it true.
 */
export const conditions = {
  building: { value: 'Building', note: 'Flaghoist, pre-alpha' },
  visibility: { value: 'Clear', note: 'open to talk' },
} as const

export const socials = [
  { label: 'GitHub', href: 'https://github.com/TheOluwafemi' },
  { label: 'npm', href: 'https://www.npmjs.com/~dammyskillz_' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/damilola-oluwafemi' },
  { label: 'X', href: 'https://twitter.com/dammyskillz_' },
] as const

/** The "Now" block. Update the date each time you touch the text: it is shown, so staleness is honest. */
export const now = {
  updated: 'September 2026',
  /** The large statement (spec §4.6). */
  statement: 'Building Flaghoist. Pre-alpha, heading for a stable release and a real docs site.',
  tiles: [
    { label: 'In progress', value: 'Stable release' },
    { label: 'In progress', value: 'Docs site' },
  ],
} as const

/** Writing published on other sites. Descriptions are the ones from the old site. */
export const elsewhere = [
  {
    title: 'What is NPX?',
    summary: 'NPX is an NPM package runner that makes it really easy to install any sort of node executable that would have normally been installed using NPM.',
    href: 'https://www.educative.io/answers/what-is-npx',
    site: 'Educative',
  },
  {
    title: 'MVC explained',
    summary: 'A brief explanation of the Model-View-Controller architectural pattern, popularly referred to as MVC.',
    href: 'https://www.educative.io/answers/mvc-explained',
    site: 'Educative',
  },
  {
    title: 'Getting started with Vue',
    summary: 'Vue is a JavaScript framework for building user interfaces. It is capable of powering sophisticated single-page applications (SPAs).',
    href: 'https://medium.com/@The_Oluwafemi/getting-started-with-vue-f654da6125dc',
    site: 'Medium',
  },
] as const
