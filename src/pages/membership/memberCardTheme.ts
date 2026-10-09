import roseCard from '../../assets/brand/member/member-card-rose.webp'
import lavenderCard from '../../assets/brand/member/member-card-lavender.webp'
import oceanCard from '../../assets/brand/member/member-card-ocean.webp'
import emeraldCard from '../../assets/brand/member/member-card-emerald.webp'

export interface MemberCardTheme {
  image: string | null
  surface: string
  foreground: string
  muted: string
  accent: string
  badgeBackground: string
  badgeForeground: string
  divider: string
  wash: string
}

/**
 * Current backend grade IDs (verified 2026-10-08) to confirmed card artwork.
 * Visual mapping only: never infer grade names, benefits or progress from these IDs.
 * A missing or unknown grade must not silently receive the former LV.4 artwork.
 */
export const MEMBER_CARD_THEMES: Readonly<Record<number, MemberCardTheme>> = {
  1: {
    image: roseCard, surface: '#FBE4EC', foreground: '#303044', muted: '#665B6A',
    accent: '#8A4960', badgeBackground: '#8A4960', badgeForeground: '#FFFFFF',
    divider: 'rgba(66,40,55,0.28)',
    wash: 'linear-gradient(90deg,rgba(255,255,255,0.34),rgba(255,255,255,0.08) 58%,transparent)',
  },
  2: {
    image: lavenderCard, surface: '#E8DDF9', foreground: '#303044', muted: '#635B77',
    accent: '#695484', badgeBackground: '#695484', badgeForeground: '#FFFFFF',
    divider: 'rgba(67,55,89,0.25)',
    wash: 'linear-gradient(90deg,rgba(255,255,255,0.30),rgba(255,255,255,0.06) 58%,transparent)',
  },
  3: {
    image: oceanCard, surface: '#E1F4FC', foreground: '#253D4B', muted: '#486B7A',
    accent: '#356B7B', badgeBackground: '#356B7B', badgeForeground: '#FFFFFF',
    divider: 'rgba(44,89,105,0.25)',
    wash: 'linear-gradient(90deg,rgba(255,255,255,0.32),rgba(255,255,255,0.05) 58%,transparent)',
  },
  4: {
    image: emeraldCard, surface: '#103E2F', foreground: '#FFFFFF', muted: '#E4EFE8',
    accent: '#F6CF77', badgeBackground: '#E9C46A', badgeForeground: '#173D2C',
    divider: 'rgba(255,255,255,0.38)',
    wash: 'linear-gradient(90deg,rgba(0,0,0,0.17),rgba(0,0,0,0.04) 58%,transparent)',
  },
}

export const UNASSIGNED_MEMBER_CARD_THEME: MemberCardTheme = {
  image: null, surface: '#F3F1EC', foreground: '#303846', muted: '#66717B',
  accent: '#566777', badgeBackground: '#E3E5E8', badgeForeground: '#364454',
  divider: 'rgba(61,76,88,0.2)', wash: 'none',
}

export function getMemberCardTheme(gradeId?: number | null): MemberCardTheme | null {
  if (gradeId == null || !Object.prototype.hasOwnProperty.call(MEMBER_CARD_THEMES, gradeId)) return null
  return MEMBER_CARD_THEMES[gradeId]
}
