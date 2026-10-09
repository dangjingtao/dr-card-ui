import { describe, expect, it } from 'vitest'
import { getMemberCardTheme, MEMBER_CARD_THEMES, UNASSIGNED_MEMBER_CARD_THEME } from './memberCardTheme'

describe('member card artwork mapping', () => {
  const cases: Array<[number, string]> = [[1, 'rose'], [2, 'lavender'], [3, 'ocean'], [4, 'emerald']]
  for (const [id, artwork] of cases) {
    it(`maps grade ID ${id} to ${artwork} artwork`, () => {
      const theme = getMemberCardTheme(id)
      expect(theme).toBe(MEMBER_CARD_THEMES[id])
      expect(theme?.image).toContain(artwork)
      expect(theme?.badgeBackground).toBeTruthy()
    })
  }

  it('does not claim LV.4 when a grade is unknown or missing', () => {
    for (const id of [undefined, null, 0, 5, 999]) expect(getMemberCardTheme(id)).toBeNull()
    expect(UNASSIGNED_MEMBER_CARD_THEME.image).toBeNull()
  })

  it('keeps foreground contrast appropriate for light and dark cards', () => {
    for (const id of [1, 2, 3]) expect(MEMBER_CARD_THEMES[id].foreground).not.toBe('#FFFFFF')
    expect(MEMBER_CARD_THEMES[4].foreground).toBe('#FFFFFF')
  })
})
