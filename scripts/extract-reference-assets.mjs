import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

const jobs = [
  {
    file: 'reference/每日签到领福利.html',
    outDir: join(root, 'src/assets/brand/bubble'),
    assets: [['__b64_0', 'checkin-bubble-3d.png']],
  },
  {
    file: 'reference/会员中心.html',
    outDir: join(root, 'src/assets/brand/member'),
    assets: [['__b64_0', 'checkin-dearseed-kit.png']],
  },
  {
    file: 'reference/我的.html',
    outDir: join(root, 'src/assets/brand/member'),
    assets: [['__b64_0', 'profile-avatar.png']],
  },
]

for (const job of jobs) {
  const html = readFileSync(join(root, job.file), 'utf8')
  mkdirSync(job.outDir, { recursive: true })
  for (const [id, file] of job.assets) {
    const re = new RegExp(`<script type="text\\/b64" id="${id}">([^<]+)<\\/script>`)
    const m = html.match(re)
    if (!m) {
      console.error(`MISSING ${id} in ${job.file}`)
      continue
    }
    const data = m[1].trim()
    const match = data.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) {
      console.error(`NOT DATA URI ${id} in ${job.file}`)
      continue
    }
    const buf = Buffer.from(match[2], 'base64')
    const outPath = join(job.outDir, file)
    writeFileSync(outPath, buf)
    console.log(`wrote ${join(job.outDir, file)} (${match[1]}, ${buf.length} bytes)`)
  }
}
