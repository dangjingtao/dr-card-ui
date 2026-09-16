/* 诗得丽 / 极地种子专栏、新人流程与首页 fixture。业务值从原 index.ts 原样迁移。 */

export interface CampaignFixture {
  title: string
  days: number
  target: number
  moreLabel: string
  claimLabel: string
  claimedLabel: string
}

export const CAMPAIGN_FIXTURE: CampaignFixture = {
  title: '累计打卡领 DearSeed洗发水样包',
  days: 5,
  target: 5,
  moreLabel: '查看更多',
  claimLabel: '前往领取',
  claimedLabel: '已领取',
}

export type ClaimSource = 'campaign' | 'onboarding'
export interface ClaimResultFixture {
  source: ClaimSource
  title: string
  desc: string
  closeLabel: string
  closeTo: string
}

export const CLAIM_RESULT_FIXTURES: ClaimResultFixture[] = [
  { source: 'campaign', title: '恭喜你！', desc: '领取成功，卡券已放入卡包当中继续打卡参与更多活动吧！', closeLabel: '关闭', closeTo: '/dearseed?state=claimed' },
  { source: 'onboarding', title: '恭喜你！', desc: '您的信息已保存今日已自动打卡并领取成功继续打卡参与更多活动吧！', closeLabel: '关闭', closeTo: '/dearseed?state=claimed' },
]

export function resolveClaimResult(source: string | null): ClaimResultFixture {
  return CLAIM_RESULT_FIXTURES.find((item) => item.source === source) ?? CLAIM_RESULT_FIXTURES[0]
}

export const ONBOARDING_ROLES = ['学生', '教职工'] as const
export type OnboardingRole = (typeof ONBOARDING_ROLES)[number]
export const ONBOARDING_GENDERS = ['男', '女'] as const
export type OnboardingGender = (typeof ONBOARDING_GENDERS)[number]
export const ONBOARDING_GRADES = ['大一', '大二', '大三', '大四', '大五', '研一', '研二', '研三'] as const
export type OnboardingGrade = (typeof ONBOARDING_GRADES)[number]

export const NEWCOMER_FIXTURE = {
  title: '恭喜你！',
  desc: '叮！你的见面礼已送达～完善个人信息并打卡就能白嫖洗护小样，体验护发色黑科技',
  cta: '去完善信息',
  ctaTo: '/onboarding',
  bodyToOverlay: 'app-guide',
} as const

export const APP_GUIDE_FIXTURE = {
  message: '积分彩蛋存放处已开启！双倍泡泡积分存放在APP里，超多养护福利等你挖掘',
  downloadHint: '下载地址尚未开放，待产品提供后接入。',
} as const

export const APP_FORCE_FIXTURE = {
  message: '该功能请前往APP使用噢！',
  downloadHint: '下载地址尚未开放，待产品提供后接入。',
} as const

export const HOME_BANNER_CAROUSEL = {
  interval: 3000,
  speed: 700,
  slides: [
    { key: 'checkin', asset: 'checkin', alt: '卡博士·诗得丽 每日打卡 洗护好礼', to: '/checkin' },
    { key: 'wash-care', asset: 'wash-care', alt: '黑金洗护养护新人福利', eyebrow: '新人专享', title: '洗护焕新季', description: '完善信息·解锁养护好礼', cta: '立即查看', toOverlay: 'newcomer' },
  ],
} as const

export interface DearseedPick {
  id: string
  asset: 'pick-a' | 'pick-b'
  nameStrong: string
  nameRest: string
  desc: string
  cost: number
  cta: string
  to: string
  ctaTo: string
}

export const DEARSEED_PICKS: DearseedPick[] = [
  { id: 'pick-1', asset: 'pick-a', nameStrong: '核心DearSeed温和', nameRest: '清洁洗发水', desc: '牡丹花水配方，温和清洁多余油脂', cost: 200, cta: '去兑换', to: '/exchange', ctaTo: '/exchange?overlay=redeem' },
  { id: 'pick-2', asset: 'pick-b', nameStrong: '核心DearSeed温和', nameRest: '清洁洗发水', desc: '牡丹花水配方，温和清洁多余油脂', cost: 200, cta: '去兑换', to: '/exchange?overlay=redeem', ctaTo: '/exchange?overlay=redeem' },
]

export interface NewcomerCoupon {
  id: string
  name: string
  desc: string
  quantity: number
  thumb: 'dearseed-kit' | 'shampoo-a' | 'shampoo-b'
}

export const NEWCOMER_COUPON_VARIANTS: Record<'coupon-1' | 'coupon-2', NewcomerCoupon[]> = {
  'coupon-1': [{ id: 'nc1', name: 'DearSeed 洗发水体验券', desc: '限到店核销', quantity: 1, thumb: 'dearseed-kit' }],
  'coupon-2': [
    { id: 'nc1', name: 'DearSeed 洗发水体验券', desc: '限到店核销', quantity: 1, thumb: 'dearseed-kit' },
    { id: 'nc2', name: '洗护组合体验券', desc: '洗发 / 护发 / 沐浴体验，限到店核销', quantity: 1, thumb: 'shampoo-a' },
  ],
}

export const NEWCOMER_COUPON_DIALOG = {
  eyebrow: 'DEAR SEED',
  title: '新人见面礼',
  desc: '欢迎来到诗得丽品牌专栏，以下体验券已为你准备好，确认后即可在洗护体验券专区查看。',
  action: '确定',
} as const

export const NEWCOMER_COUPON_SUCCESS = {
  title: '领取成功',
  desc: '体验券已放入你的账户，正在前往洗护体验券专区。',
  action: '查看体验券',
  actionTo: '/exchange',
} as const

export const IDENTITY_PICKER = {
  eyebrow: 'DEAR SEED',
  title: '请选择身份',
  desc: 'Demo 演示用，请选择你希望模拟的用户身份。',
  dismissLabel: '关闭身份选择',
  existing: {
    id: 'existing' as const,
    title: '卡博士存量用户',
    desc: '已有卡博士账户，享受新人礼包',
    accentClass: 'text-reward-strong',
    bgClass: 'bg-reward-subtle',
    cta: '查看新人礼包',
  },
  new: {
    id: 'new' as const,
    title: '诗得丽新增用户',
    desc: '诗得丽关爱机项目用户，享受洗发水体验券',
    accentClass: 'text-member-accent',
    bgClass: 'bg-member-surface',
    cta: '查看洗发水体验券',
  },
} as const

/** 保留历史 fixture 的 /mall 目标；H005 不施工商城本身。 */
export const GIFT_FOR_NEW_USERS = {
  demoTag: '演示位 · 后续接入',
  eyebrow: 'DEAR SEED',
  title: '新人礼包（占位）',
  desc: '卡博士存量用户新人礼包，正式券种由丁总确认后接入。',
  action: '了解卡博士新人礼包',
  actionTo: '/mall',
  dismissLabel: '关闭新人礼包演示',
} as const

export const NEWCOMER_COUPON_RULE_STATUS = {
  newUserDetection: {
    confirmed: true,
    blocker: 'B-031',
    note: '用户 2026-08-27 定案「默认全是新用户」：本阶段不做真实识别与持久化，进入 `/` 即弹出新人体验券；关闭后同一次会话内不再复现，取证脚本用 `?newcomer=off` 抑制、用 `?overlay=newcomer-coupon` 重新唤起。跨会话频次与「已领取后再次进入」的服务端口径仍待接口阶段确认。',
  },
  couponRandomness: {
    confirmed: false,
    blocker: 'B-032',
    note: '用户 2026-08-27 定案 1 张 / 2 张概率 1:1，页面层按 50/50 抽取；券种池、库存与单人发放上限仍未给出，故此处只沉淀两个确定性组合，验收一律用 `?state=` 复现，不做服务端发券。',
  },
  causeSection: {
    confirmed: false,
    blocker: 'B-033',
    note: '需求 §2.2 只给出「公益板块」的名称与排列顺序，摹客原型无对应 artboard（docs/prototype 全库无「公益」命中）。用户 2026-08-27 定案「暂不实现跳转」，故本板块只做标题 + 一句说明的静态承载，不带入口文案与跳转，不自造公益数据、项目列表与捐赠进度。',
  },
} as const

export const COLUMN_HOME_SECTIONS = [
  { key: 'cause', title: '公益板块', desc: '每次打卡助力公益，传递温暖', action: null, to: null },
  { key: 'brand-story', title: '极地种子品牌故事', desc: '了解极地种子品牌起源与匠心洗护', action: '查看品牌故事', to: '/brand-culture' },
] as const

export const DEARSEED_BANNER_TEXT = {
  title: '卡博士.极地种子',
  subtitle: '极地种子品牌故事',
} as const
