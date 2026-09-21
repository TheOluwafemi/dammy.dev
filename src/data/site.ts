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
