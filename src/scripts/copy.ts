// Copy-to-clipboard for any <button data-copy="text">. The label swaps to "Copied" for a moment
// and a polite live region announces it. Buttons are hidden without JS (see global.css).
const timers = new WeakMap<HTMLElement, number>()

document.addEventListener('click', async (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-copy]')
  if (!btn) return
  const label = btn.querySelector<HTMLElement>('[data-copy-label]') ?? btn
  const idle = btn.dataset.copyIdle ?? label.textContent ?? 'Copy'
  btn.dataset.copyIdle = idle
  let ok = true
  try {
    await navigator.clipboard.writeText(btn.dataset.copy ?? '')
  } catch {
    ok = false
  }
  label.textContent = ok ? 'Copied' : 'Copy failed'
  const status = document.querySelector<HTMLElement>('[data-copy-status]')
  if (status) status.textContent = ok ? 'Copied to the clipboard' : 'Could not copy'
  clearTimeout(timers.get(btn))
  timers.set(
    btn,
    window.setTimeout(() => {
      label.textContent = idle
      if (status) status.textContent = ''
    }, 1800),
  )
})
