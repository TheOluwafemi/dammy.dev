// One-shot scroll reveal (plan 3.7 #2). Content is never hidden by markup: only
// elements below the fold get a start state, and only from here, so if this script
// fails to load nothing stays invisible.
import { inView } from 'motion'
import { animate } from 'motion/mini'

const EASE = [0.23, 1, 0.32, 1] as const

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const all = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-done])')]
  all.forEach((el) => el.setAttribute('data-reveal-done', ''))
  const below = all.filter((el) => el.getBoundingClientRect().top > innerHeight)

  below.forEach((el) => {
    el.style.opacity = '0'
    if (!reduce) el.style.transform = 'translateY(8px)'
  })

  inView(
    below,
    (target) => {
      const el = target as HTMLElement
      const i = Math.min([...(el.parentElement?.children ?? [])].indexOf(el), 5)
      const keyframes = reduce ? { opacity: [0, 1] } : { opacity: [0, 1], transform: ['translateY(8px)', 'none'] }
      // Full transform string (not the x/y shorthand) so it stays off the main thread.
      animate(el, keyframes, { duration: reduce ? 0.16 : 0.24, ease: EASE, delay: i * 0.04 }).finished.then(() => {
        el.style.opacity = ''
        el.style.transform = ''
      })
      // No leave callback: fires once.
    },
    { amount: 0.2 },
  )
}

document.addEventListener('astro:page-load', init)
