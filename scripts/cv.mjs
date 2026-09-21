// Renders /cv to public/cv.pdf with headless Chrome. Run after `npm run build`:
//   npm run build && npm run cv
// Serves ./dist on a throwaway port so the print CSS and fonts load exactly as on the site.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const dist = resolve('dist')
const chrome = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p))
if (!chrome) throw new Error('Chrome not found. Set CHROME_PATH.')

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = createServer(async (req, res) => {
  let path = new URL(req.url, 'http://x').pathname
  if (!extname(path)) path += path.endsWith('/') ? 'index.html' : '.html'
  try {
    const body = await readFile(join(dist, path))
    res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
})
await new Promise((r) => server.listen(0, r))
const { port } = server.address()
try {
  // Async spawn: a sync one would block this event loop, and with it the server Chrome is loading from.
  const child = spawn(
    chrome,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${resolve('public/cv.pdf')}`,
      `http://localhost:${port}/cv`,
    ],
    { stdio: 'ignore' },
  )
  const code = await new Promise((res, rej) => {
    const t = setTimeout(() => {
      child.kill()
      rej(new Error('Chrome timed out'))
    }, 60000)
    child.on('exit', (c) => {
      clearTimeout(t)
      res(c)
    })
  })
  if (code !== 0) throw new Error(`Chrome exited with ${code}`)
  console.log('wrote public/cv.pdf')
} finally {
  server.close()
}
