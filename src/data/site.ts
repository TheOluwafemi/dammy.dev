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
