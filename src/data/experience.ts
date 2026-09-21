/**
 * Career history. Source: the CV in the old repo (portfolio-v2/public/doc). It is the only
 * dated record, and it predates this rebuild, so CONFIRM the top entry is still current.
 * Bullets are the CV's own wording.
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
    org: 'Upflow',
    role: 'Frontend engineer',
    where: 'Remote',
    start: 'Sep 2022',
    url: 'https://upflow.io',
    highlight: 'Owns the marketing site: reusable sections, lead-generation tooling, and content modelled in Storyblok so other teams can edit without a developer.',
    bullets: [
      'Collaborating with the design and marketing teams to improve the website, and add new reusable website sections and pages.',
      'Interfacing directly with the internal marketing team and other stakeholders to implement lead-generation tools and strategies.',
      'Managing tracking and lead generation tools: Chili Piper, HubSpot, Segment.',
      'Managing and delegating the content management process using Storyblok. This helps halve the development cycle and allows other team members to change and improve the website content.',
    ],
  },
  {
    org: 'Yellowcard Financials',
    role: 'Frontend engineer',
    where: 'Remote',
    start: 'Apr 2021',
    end: 'Aug 2022',
    url: 'https://yellowcard.io',
    highlight: 'Supported the launch in 10 new African markets, led the website revamp after a brand refresh, and added multi-language support.',
    bullets: [
      'Supported the process of launching in 10 new markets (countries) in Africa, by updating transactions and KYC methods.',
      "Coordinated and managed the revamp of the company's website, following a brand refresh.",
      'Maintained and added new features to the Yellowcard web application to improve customer experience.',
      'Integrated multi-language support in the marketing website and web applications to improve engagement and acquisition in non-English speaking countries.',
      'Iterated on marketing website performance to increase SERP rankings and conversions. Improved the Lighthouse audit by 33% by following accessibility and performance best practice.',
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
      'Collaborated with the design and marketing teams to improve the website, increasing conversion rates from the website by 45% and improving page visibility.',
      'Maintained and added features to the admin management system for the flagship product, improving customer management and dispute resolution by 70%.',
      'Created modular, reusable Vue components with the front-end logic to deliver the best user experience.',
      'Integrated and consumed back-end REST APIs designed for system operations.',
    ],
  },
  {
    org: 'Fidelity Bank',
    role: 'Frontend engineer',
    where: 'Lagos, Nigeria',
    start: 'Aug 2018',
    end: 'Nov 2019',
    url: 'https://fidelitybank.ng',
    highlight: 'Unit lead for front-end and UI/UX. Digitised visitor and staff attendance, cutting sign-in time by 50% and going fully paperless.',
    bullets: [
      'Unit lead for the front-end and UI/UX unit.',
      'Created modular Angular components with the front-end logic to deliver the best user experience.',
      'Fully digitised the visitor and staff attendance management system, which led to a 50% reduction in visitor sign-in and sign-out time and a 100% paperless system.',
      'Implemented an in-house API management system for designing, publishing, documenting, analysing and monitoring APIs in a secure environment.',
    ],
  },
]

export const education = {
  degree: 'Bachelor of Technology, Computer Science',
  school: 'Federal University of Technology, Akure',
  where: 'Akure, Nigeria',
} as const

export const years = (r: Role) => `${r.start} – ${r.end ?? 'present'}`
