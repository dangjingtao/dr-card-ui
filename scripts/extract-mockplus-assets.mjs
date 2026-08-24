import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const srcDir = join(root, 'mockplus/卡博士诗得丽/data')

const files = [
  ['88ba4d30-653c-11f1-bd33-7bdcb357e944.png', 'home/home-banner-carousel.png'],
  ['6c65a6d0-63ce-11f1-b651-49d59b7e2ffa.png', 'exchange/exchange-pick-shampoo-a.png'],
  ['71be5c20-653c-11f1-bb71-37b016454b24.png', 'exchange/exchange-pick-shampoo-b.png'],
  ['ef4c2310-6605-11f1-bc47-a5b4fa35a797.png', 'ip/brand-culture-longpage.png'],
  ['12.jpg', 'buddy/buddy-avatar-xiaomei.jpg'],
  ['25.jpg', 'buddy/buddy-avatar-self.jpg'],
  ['8e4b6bd0-6ea6-11f1-8114-0ba903cda343.png', 'buddy/buddy-ip-shower.png'],
]

function jpgSize(buf) {
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) return null
  let i = 2
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1
      continue
    }
    const marker = buf[i + 1]
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return `${buf.readUInt16BE(i + 7)}x${buf.readUInt16BE(i + 5)}`
    }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  return null
}

function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null
  return `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`
}

for (const [source, target] of files) {
  const from = join(srcDir, source)
  if (!existsSync(from)) {
    console.error(`MISSING ${source}`)
    continue
  }
  const to = join(root, 'src/assets/brand', target)
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
  const buf = readFileSync(to)
  const size = pngSize(buf) ?? jpgSize(buf) ?? 'unknown'
  console.log(`wrote ${target} (${size}, ${buf.length} bytes)`)
}
