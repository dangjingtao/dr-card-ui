import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')

const searchConsumers = [
  'src/pages/CardShare.tsx',
  'src/pages/BuddyPhoneInvite.tsx',
]

for (const path of searchConsumers) {
  const source = read(path)
  assert.match(source, /\bSearchField\b/, path + ' must consume shared SearchField')
  assert.doesNotMatch(source, /<Search\b/, path + ' must not keep a page-local Search icon implementation')
}

const buddyPhoneInvite = read('src/pages/BuddyPhoneInvite.tsx')
assert.match(buddyPhoneInvite, /variant="pill"/, 'BuddyPhoneInvite must keep pill SearchField presentation')
assert.match(
  buddyPhoneInvite,
  /loading=\{outcome === 'searching'\}/,
  'BuddyPhoneInvite must wire searching state into SearchField loading',
)

const searchField = read('src/components/ui/ComDesign.tsx')
assert.match(searchField, /export interface SearchFieldProps/)
assert.match(searchField, /data-search-field/)
assert.match(searchField, /aria-busy/)

for (const path of ['src/pages/Address.tsx', 'src/pages/Orders.tsx']) {
  const source = read(path)
  assert.match(source, /\bEmptyStateIcon\b/, path + ' must consume shared EmptyStateIcon')
  assert.doesNotMatch(
    source,
    /flex h-24 w-24 items-center justify-center rounded-full bg-background/,
    path + ' must not duplicate the extracted empty-state visual',
  )
}

const emptyVisual = read('src/components/mobile/EmptyStateIcon.tsx')
assert.match(emptyVisual, /data-empty-state-icon/)

console.log(
  'H023 PASS: SearchField is shared by two formal-H5 pages and EmptyStateIcon by two data pages without reintroducing page-local duplicate JSX.',
)
