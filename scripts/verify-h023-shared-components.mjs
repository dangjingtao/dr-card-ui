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

const emptyIllustrationConsumers = [
  'src/pages/Address.tsx',
  'src/pages/Orders.tsx',
  'src/pages/PointsDetail.tsx',
]

for (const path of emptyIllustrationConsumers) {
  const source = read(path)
  assert.match(
    source,
    /\bEmptyStateIllustration\b/,
    path + ' must consume shared EmptyStateIllustration',
  )
  assert.doesNotMatch(
    source,
    /\bEmptyStateIcon\b/,
    path + ' must not regress to the retired page-local empty-state icon visual',
  )
}

const emptyVisual = read('src/components/mobile/EmptyStateIllustration.tsx')
assert.match(emptyVisual, /data-empty-state-illustration/)

console.log(
  'H023 PASS: SearchField is shared by two formal-H5 pages and EmptyStateIllustration by current data-page empty states.',
)
