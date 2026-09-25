// Draws the hero headline into an offscreen canvas that the shader samples as cloud density
// (spec §5.4). White text on black, softened with a blur so the edges read as vapour.

// The size and baseline formulas below are mirrored in CSS to position the hero block under
// the cloud (src/sections/Hero.astro). Change both together.

/** Matches the page container: max-width 1320px, gutter clamp(16px, 4vw, 56px). */
export function contentBox(cssW: number): { left: number; width: number } {
  const gutter = Math.min(56, Math.max(16, cssW * 0.04))
  const inner = Math.min(cssW, 1320)
  return { left: (cssW - inner) / 2 + gutter, width: inner - gutter * 2 }
}

export function drawCloudText(target: HTMLCanvasElement, W: number, H: number, dpr: number, family: string): void {
  const cssW = W / dpr
  const narrow = cssW < 640
  const lines = narrow ? ['I build', 'developer', 'tools'] : ['I build', 'developer tools']
  const y = narrow ? 0.3 : 0.32
  let size = narrow ? Math.min(W * 0.15, H * 0.085) : Math.min(W * 0.082, H * 0.15, 130 * dpr)

  target.width = W
  target.height = H
  const ctx = target.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)

  const box = contentBox(cssW)
  const font = (px: number) => `800 ${px}px ${family}`
  ctx.font = font(size)
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
  const room = box.width * dpr
  if (widest > room) size *= room / widest
  ctx.font = font(size)

  // Align the ink (not the advance box) with the content edge, so the cloud lines up with the logo.
  const inkLeft = ctx.measureText(lines[0]).actualBoundingBoxLeft || 0
  const x = box.left * dpr + inkLeft - size * 0.02
  ctx.fillStyle = '#fff'
  ctx.shadowColor = '#fff'
  ctx.shadowBlur = size * 0.2
  lines.forEach((line, i) => ctx.fillText(line, x, H * y + i * size * 0.94))
}
