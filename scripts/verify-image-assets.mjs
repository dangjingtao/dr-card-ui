import { readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const assetsRoot = fileURLToPath(new URL('../src/assets/', import.meta.url))
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const rasterExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.avif', '.webp'])
const maxBytes = 500 * 1024
const files = []

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (rasterExtensions.has(extname(entry.name).toLowerCase())) files.push(path)
  }
}

walk(assetsRoot)

const nonWebp = files.filter((path) => extname(path).toLowerCase() !== '.webp')
const oversized = files.filter((path) => statSync(path).size > maxBytes)
const totalBytes = files.reduce((sum, path) => sum + statSync(path).size, 0)
const display = (path) => relative(projectRoot, path)

for (const path of nonWebp) console.error(`NON_WEBP ${display(path)}`)
for (const path of oversized) console.error(`OVERSIZED ${(statSync(path).size / 1024).toFixed(1)} KiB ${display(path)}`)

console.log(`image assets: ${files.length} WebP files, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB`)
process.exit(nonWebp.length === 0 && oversized.length === 0 ? 0 : 1)
