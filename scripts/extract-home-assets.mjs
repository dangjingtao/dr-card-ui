import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const htmlPath = join(root, 'reference/首页.html')
const outDir = join(root, 'src/assets/brand/home')
mkdirSync(outDir, { recursive: true })

const html = readFileSync(htmlPath, 'utf8')

const names = [
  ['__b64_0', 'home-avatar.png'],
  ['__b64_1', 'home-banner-checkin.png'],
  ['__b64_2', 'home-icon-shower.png'],
  ['__b64_3', 'home-icon-dryer.png'],
  ['__b64_4', 'home-icon-water.png'],
  ['__b64_5', 'home-icon-blower.png'],
]

for (const [id, file] of names) {
  const re = new RegExp(`<script type="text\\/b64" id="${id}">([^<]+)<\\/script>`)
  const m = html.match(re)
  if (!m) {
    console.error(`MISSING ${id}`)
    continue
  }
  const data = m[1].trim()
  const match = data.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    console.error(`NOT DATA URI ${id}`)
    continue
  }
  const buf = Buffer.from(match[2], 'base64')
  const outPath = join(outDir, file)
  writeFileSync(outPath, buf)
  console.log(`wrote ${file} (${match[1]}, ${buf.length} bytes)`)
}
