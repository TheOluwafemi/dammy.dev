/**
 * Career history. Source: the CV in the old repo (portfolio-v2/public/doc), with the bullets
 * edited for length. Upflow (Sep 2022 onwards) is left out on purpose: it is not a current role.
 */
export interface Role {
  org: string
  orgNote?: string
  role: string
  where: string
  start: string // "Sep 2022"
  end?: string // omit = present
  url?: string
  /** One line for the About page. */
  highlight: string
  /** Full bullets for the CV. */
  bullets: string[]
}

export const experience: Role[] = [
  {
    org: 'Yellowcard Financials',
    role: 'Frontend engineer',
    where: 'Remote',
    start: 'Apr 2021',
    end: 'Aug 2022',
    url: 'https://yellowcard.io',
    highlight: 'Helped launch in 10 new African markets, led the website revamp after a brand refresh and added multi-language support.',
    bullets: [
      'Updated transaction and KYC flows for the launch in 10 new African markets.',
      'Led the revamp of the company website after a brand refresh.',
      'Maintained the Yellowcard web app and shipped new features for customers.',
      'Added multi-language support to the marketing site and web apps, to reach customers in non-English-speaking countries.',
      "Raised the marketing site's Lighthouse score by 33% through accessibility and performance work, to improve search ranking and conversion.",
    ],
  },
  {
    org: 'Sterling Bank',
    orgNote: 'Gomoney',
    role: 'Frontend engineer',
    where: 'Remote',
    start: 'Nov 2019',
    end: 'Mar 2021',
    url: 'https://gomoney.global',
    highlight: 'Raised website conversion by 45% and built the admin system that cut dispute resolution time by 70%.',
    bullets: [
      'Worked with design and marketing to improve the website, raising its conversion rate by 45% and its visibility in search.',
      'Maintained and extended the admin system for the flagship product, cutting dispute resolution time by 70%.',
      'Built modular, reusable Vue components.',
      'Integrated the back-end REST APIs.',
    ],
  },
  {
    org: 'Fidelity Bank',
    role: 'Frontend engineer',
    where: 'Lagos, Nigeria',
    start: 'Aug 2018',
    end: 'Nov 2019',
    url: 'https://fidelitybank.ng',
    highlight: 'Led the front-end and UI/UX unit. Digitised visitor and staff attendance, cutting sign-in time by 50% and going fully paperless.',
    bullets: [
      'Led the front-end and UI/UX unit.',
      'Built modular Angular components.',
      'Digitised the visitor and staff attendance system, halving sign-in and sign-out time and making it fully paperless.',
      'Built an in-house system for designing, publishing, documenting, analysing and monitoring APIs.',
    ],
  },
]

export const education = {
  degree: 'Bachelor of Technology, Computer Science',
  school: 'Federal University of Technology, Akure',
  where: 'Akure, Nigeria',
} as const

export const years = (r: Role) => `${r.start}–${r.end ?? 'present'}`
