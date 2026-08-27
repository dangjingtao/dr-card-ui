/**
 * T004 确定性状态夹具（deterministic fixtures）
 * -------------------------------------------------------------
 * 规则：验收状态一律来自这里或 URL 参数，禁止把随机数作为验收状态来源。
 * 所有 fixture 均为静态常量；后续 T005–T013 在此追加各自业务夹具
 * （卡券、商品、消息、地址、订单等），不要在页面里内联随机逻辑。
 */

/** 今日澡运-抽取成功结果（fixture；⚠️ 三档规则待 T006 决策，此处仅确定性呈现，不定稿） */
export interface LuckFixture {
  key: 'great' | 'good' | 'minor'
  name: string
  /** 使用 card-brand.css 已定义的品牌渐变 Token */
  gradient: string
  desc: string
}

export const LUCK_FIXTURES: LuckFixture[] = [
  { key: 'great', name: '大吉', gradient: 'var(--gradient-luck-great)', desc: '好运已签收，愿今天顺利。' },
  { key: 'good', name: '中吉', gradient: 'var(--gradient-luck-good)', desc: '顺心顺意，保持好心情。' },
  { key: 'minor', name: '小吉', gradient: 'var(--gradient-luck-minor)', desc: '平稳度过，积蓄好运。' },
]

/* ────────────────────────── T005 专栏首页与新人流程 ────────────────────────── */

/**
 * 诗得丽专栏「本期活动」夹具（T005；摹客 #2 / #23）
 * - title / progress 文案照抄摹客原型文本，未自行改写
 * - ⚠️ 打卡天数上限、达标判定、卡券有效期等业务规则未确认，此处仅为确定性夹具，不定稿
 */
export interface CampaignFixture {
  title: string
  /** 已打卡天数（摹客原型标注为 5 / 5 天） */
  days: number
  /** 达标所需天数 */
  target: number
  /** 「查看更多」文案 */
  moreLabel: string
  /** 未领取 / 已领取的主按钮文案（摹客 #2 / #23 唯一差异） */
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

/** 领取成功反馈来源（#15 专栏本期活动领取 / #25 完善信息后自动领取） */
export type ClaimSource = 'campaign' | 'onboarding'

/** 领取成功反馈夹具（T005；文案照抄摹客 #15 / #25，不改写） */
export interface ClaimResultFixture {
  source: ClaimSource
  title: string
  desc: string
  closeLabel: string
  /** 关闭后回到的路径（摹客 remark：点击关闭回到主页面） */
  closeTo: string
}

export const CLAIM_RESULT_FIXTURES: ClaimResultFixture[] = [
  {
    source: 'campaign',
    title: '恭喜你！',
    desc: '领取成功，卡券已放入卡包当中继续打卡参与更多活动吧！',
    closeLabel: '关闭',
    closeTo: '/dearseed?state=claimed',
  },
  {
    source: 'onboarding',
    title: '恭喜你！',
    desc: '您的信息已保存今日已自动打卡并领取成功继续打卡参与更多活动吧！',
    closeLabel: '关闭',
    closeTo: '/dearseed?state=claimed',
  },
]

/** 通过 `?from=` 取确定的领取成功文案；非法值回退到活动领取 */
export function resolveClaimResult(source: string | null): ClaimResultFixture {
  const found = CLAIM_RESULT_FIXTURES.find((item) => item.source === source)
  return found ?? CLAIM_RESULT_FIXTURES[0]
}

/** 完善信息-身份选项（摹客 #14：学生 / 教职工） */
export const ONBOARDING_ROLES = ['学生', '教职工'] as const
export type OnboardingRole = (typeof ONBOARDING_ROLES)[number]

/** 完善信息-性别选项（摹客 #14：男 / 女） */
export const ONBOARDING_GENDERS = ['男', '女'] as const
export type OnboardingGender = (typeof ONBOARDING_GENDERS)[number]

/**
 * 完善信息-年级选项（摹客 #24 学生态，2 列 4 行）
 * ⚠️ 年级与身份的联动校验规则未确认，此处仅呈现原型给出的选项集合，不定稿
 */
export const ONBOARDING_GRADES = ['大一', '大二', '大三', '大四', '大五', '研一', '研二', '研三'] as const
export type OnboardingGrade = (typeof ONBOARDING_GRADES)[number]

/**
 * 新人弹窗夹具（摹客 #12「新人弹窗」artboard）
 * 文案与标题均按摹客逐字落地，不做产品化改写（AGENTS.md §7）：
 * - 标题「恭喜你！」20px bold 居中；
 * - 正文左对齐，位于插画右侧；
 * - 主操作「去完善信息」→ 完善信息页；点击卡片本体继续看 APP 下载引导（#13）。
 */
export const NEWCOMER_FIXTURE = {
  title: '恭喜你！',
  desc: '叮！你的见面礼已送达～完善个人信息并打卡就能白嫖洗护小样，体验护发色黑科技',
  cta: '去完善信息',
  ctaTo: '/onboarding',
  /** 摹客 click → hbdNL_2Lm（内容等同「引导弹窗」） */
  bodyToOverlay: 'app-guide',
} as const

/**
 * 引导弹窗夹具（摹客 #13「引导弹窗」artboard）
 * 单按钮「下载链接」+ 右上关闭图标形态，正文按摹客逐字落地。
 * ⚠️ 应用商店下载地址未确认，沿用 T011 #20 既有口径：只提示未开放，不编造 URL。
 */
export const APP_GUIDE_FIXTURE = {
  message: '积分彩蛋存放处已开启！双倍泡泡积分存放在APP里，超多养护福利等你挖掘',
  downloadHint: '下载地址尚未开放，待产品提供后接入。',
} as const

/**
 * 强制 APP 弹窗夹具（摹客「强制APP弹窗」artboard，对应 #20）
 * 与 #13 同为 TIPS 卡片，但为双按钮「我知道了 / 下载链接」形态。
 */
export const APP_FORCE_FIXTURE = {
  message: '该功能请前往APP使用噢！',
  downloadHint: '下载地址尚未开放，待产品提供后接入。',
} as const

/**
 * 首页 Banner 轮播夹具。
 * 保留摹客的自动轮播参数，视觉统一为首页已验收的黑金 3:1 Banner：
 * - 打卡帧进入每日打卡；
 * - 养护帧沿用原轮播的新人流程入口。
 */
export const HOME_BANNER_CAROUSEL = {
  /** carousel.playInterval */
  interval: 3000,
  /** carousel.playSpeed */
  speed: 700,
  slides: [
    {
      key: 'checkin',
      asset: 'checkin',
      alt: '卡博士·诗得丽 每日打卡 洗护好礼',
      to: '/checkin',
    },
    {
      key: 'wash-care',
      asset: 'wash-care',
      alt: '黑金洗护养护新人福利',
      eyebrow: '新人专享',
      title: '洗护焕新季',
      description: '完善信息·解锁养护好礼',
      cta: '立即查看',
      toOverlay: 'newcomer',
    },
  ],
} as const

/**
 * 诗得丽专栏「为你精选」夹具（摹客 #2 标题 @(28,638) + 容器 @(25,670) 326×112 双卡）
 * 商品文案、价格、按钮文案逐字取自原型；两张卡在原型中文案完全相同、仅商品图不同，
 * 此处如实保留，不去重、不自造第二个商品。
 * 跳转按原型 group interaction：卡 1 → 洗护兑换专区，卡 2 与两卡按钮 → 商品兑换弹窗。
 * ⚠️ 价格「200🫧」原型为红色，与项目 exchange-price 语义一致（⚠️ 冲突记录见 card-brand.css §8）。
 */
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
  {
    id: 'pick-1',
    asset: 'pick-a',
    nameStrong: '核心DearSeed温和',
    nameRest: '清洁洗发水',
    desc: '牡丹花水配方，温和清洁多余油脂',
    cost: 200,
    cta: '去兑换',
    to: '/exchange',
    ctaTo: '/exchange?overlay=redeem',
  },
  {
    id: 'pick-2',
    asset: 'pick-b',
    nameStrong: '核心DearSeed温和',
    nameRest: '清洁洗发水',
    desc: '牡丹花水配方，温和清洁多余油脂',
    cost: 200,
    cta: '去兑换',
    to: '/exchange?overlay=redeem',
    ctaTo: '/exchange?overlay=redeem',
  },
]

/* ────────────────────────── T009 卡包、核销、转赠与兑换码 ────────────────────────── */

/** 卡包卡券状态（与 routes.ts `/card` 已登记的三个 `?state=` 一一对应：#62 / #63 / #64） */
export type CardCouponStatus = 'available' | 'used' | 'expired'

/**
 * 卡包卡券夹具（T009；reference/卡包.html 标准页）
 * - name / 金额 / 到期日照抄 reference 标准页，未自行改写
 * - ⚠️ 卡券库存、领取来源、转赠次数上限等业务规则未确认，此处仅确定性呈现，不定稿
 */
export interface CardCouponFixture {
  id: string
  /** 券名；带金额的券把金额单独放在 amountLabel，便于还原「¥20 + 券名」的排版 */
  name: string
  amountLabel?: string
  /** 到期日文案（照抄 reference，含「到期」二字由页面拼接） */
  expireAt: string
  status: CardCouponStatus
  /** 使用限制说明（reference 使用弹窗内的副标题） */
  limitNote: string
}

export const CARD_COUPON_FIXTURES: CardCouponFixture[] = [
  { id: 'c1', name: '核心洗发水体验券', expireAt: '2026-06-25', status: 'available', limitNote: '限到店核销' },
  { id: 'c2', name: '现金减免体验券', amountLabel: '¥20', expireAt: '2026-06-25', status: 'available', limitNote: '限到店核销' },
  { id: 'c3', name: '现金减免体验券', amountLabel: '¥20', expireAt: '2026-05-25', status: 'expired', limitNote: '限到店核销' },
]

/** 卡包 Tab（三态；与 `/card` 的 states 登记保持一致，不额外引入「全部」） */
export const CARD_PACK_TABS: Array<{ key: CardCouponStatus; label: string }> = [
  { key: 'available', label: '可用' },
  { key: 'used', label: '已使用' },
  { key: 'expired', label: '已过期' },
]

/** 卡包底部使用说明（照抄 reference 标准页三条） */
export const CARD_PACK_TIPS = [
  '可用卡片可直接使用或转赠给好友',
  '已使用的兑换码可以在这里查询',
  '已过期的兑换码将无法使用',
]

export function cardCouponsByStatus(status: CardCouponStatus): CardCouponFixture[] {
  return CARD_COUPON_FIXTURES.filter((item) => item.status === status)
}

export function cardCouponCount(status: CardCouponStatus): number {
  return cardCouponsByStatus(status).length
}

export function resolveCardCoupon(id: string | null): CardCouponFixture {
  const found = CARD_COUPON_FIXTURES.find((item) => item.id === id)
  return found ?? CARD_COUPON_FIXTURES[0]
}

/**
 * 分享接收人夹具（T009 #65；人名、头像首字、单选交互取自 reference/分享.html「搭子列表」）
 * B-015 已关闭：按原型做「搭子列表」夹具，单选对象 → 下一步 → 分享成功；
 * 不做对方接受、次数限制、时效限制和持久化，分享后原卡包状态不变。
 */
export interface ShareTargetFixture {
  id: string
  name: string
  /** 头像占位字（reference 原稿即为姓名首字） */
  initial: string
}

export const SHARE_TARGET_FIXTURES: ShareTargetFixture[] = [
  { id: 's1', name: '小美', initial: '小' },
  { id: 's2', name: '阿轩', initial: '轩' },
  { id: 's3', name: '泡泡同学', initial: '泡' },
  { id: 's4', name: '室友小婷', initial: '婷' },
]

/**
 * 分享成功页商品卡夹具（T009 #66；字段照抄 reference/分享成功.html）
 * B-017 已关闭：`洗发试用装 / 已发货 / 单次使用` 仅作为原型展示夹具，
 * 「已发货」不代表分享操作触发真实发货，不实现任何物流规则。
 */
export interface ShareProductFixture {
  name: string
  date: string
  shipping: string
  tag: string
}

export const SHARE_PRODUCT_FIXTURE: ShareProductFixture = {
  name: '洗发试用装',
  date: '2024.01.08',
  shipping: '已发货',
  tag: '单次使用',
}

/**
 * 核销凭证夹具（T009 #67；门店、明细、时间照抄现有已验收实现）
 * ⚠️ 门店归属、核销时效、重复核销的服务端判定规则未确认，此处仅确定性呈现，不定稿
 */
export interface VerifyVoucherFixture {
  store: string
  address: string
  items: string
  validUntil: string
  quantity: string
  verifyTime: string
}

export const VERIFY_VOUCHER_FIXTURE: VerifyVoucherFixture = {
  store: '泡泡洗护 · 朝阳大悦城店',
  address: '北京市朝阳区青年路 5 号大悦城 B1-038',
  items: '洗发水 / 护发素 / 沐浴露 体验装',
  validUntil: '2026-09-30',
  quantity: '1 张',
  verifyTime: '2026-08-13 09:41',
}

/** 消费密码位数（reference 标准页：6 位数字） */
export const VERIFY_PASSWORD_LENGTH = 6

/**
 * 核销反馈文案（T009 #67）
 * ⚠️ 重复核销的服务端判定条件（同券同店、时效窗口等）未确认，这里只给中性拦截提示，
 *    不写入任何判定规则；确认后按新口径替换本处文案。
 */
export const VERIFY_FEEDBACK = {
  done: { title: '核销成功', desc: '权益已扣减，可在卡包「已使用」中查看' },
  repeat: { title: '该券已核销', desc: '这张券已经完成核销，无法重复使用' },
} as const

/**
 * 兑换码规则配置（T009 #68）
 * ⚠️ 未定稿：摹客原型出现 8 位与 11 位，reference 标准页与历史稿为 12 位（阻塞项 B-009）。
 *    这里把「位数 / 字符集 / 提示文案」收成唯一配置源，页面只读不写，决策落地时只改这一处。
 *    当前取值来自 reference/兑换卡券.html（maxlength=12、/^[A-Za-z0-9]{12}$/），仅作为夹具呈现值，不等于定稿规则。
 */
export interface RedeemCodeRule {
  length: number
  pattern: RegExp
  hint: string
  /** 规则是否仍未定稿；为 true 时页面不得表现为最终校验规则 */
  pending: boolean
  /** 关联阻塞项编号，便于反查决策记录 */
  blocker: string
  /** 当前取值来源 */
  source: string
}

export const REDEEM_CODE_RULE: RedeemCodeRule = {
  length: 12,
  pattern: /^[A-Za-z0-9]{12}$/,
  hint: '兑换码为 12 位字母与数字组合，不区分大小写',
  pending: true,
  blocker: 'B-009',
  source: 'reference/兑换卡券.html',
}

/** 兑换结果分支（#68 失败态 / #69 成功态） */
export type RedeemOutcome = 'success' | 'format' | 'invalid' | 'used' | 'network'

export interface RedeemFeedbackFixture {
  outcome: RedeemOutcome
  ok: boolean
  text: string
}

/** 反馈文案：成功/格式错误照抄 reference 标准页；其余分支为服务端失败态的中性提示，不含未确认的业务规则 */
export const REDEEM_FEEDBACK: Record<RedeemOutcome, RedeemFeedbackFixture> = {
  success: { outcome: 'success', ok: true, text: '兑换成功，已存入卡包' },
  format: { outcome: 'format', ok: false, text: '兑换码格式错误' },
  invalid: { outcome: 'invalid', ok: false, text: '兑换码无效，请核对后重试' },
  used: { outcome: 'used', ok: false, text: '该兑换码已被使用' },
  network: { outcome: 'network', ok: false, text: '网络异常，请稍后重试' },
}

/**
 * 确定性兑换码 → 结果映射（禁止随机）
 * 格式正确但需要落在不同服务端分支的验收码在此登记；未登记且格式正确的码统一走成功分支。
 */
export const REDEEM_CODE_OUTCOMES: Record<string, RedeemOutcome> = {
  DRCARD000404: 'invalid',
  DRCARD000USE: 'used',
  DRCARD000NET: 'network',
}

/**
 * 各分支的演示码：仅供 `?state=` 直达截图时回填输入框，不构成任何兑换码规则。
 * format 分支故意给一个位数不足的码，用于呈现格式错误反馈。
 */
export const REDEEM_SAMPLE_CODES: Record<RedeemOutcome, string> = {
  success: 'DRCARD000888',
  format: 'DRCARD08',
  invalid: 'DRCARD000404',
  used: 'DRCARD000USE',
  network: 'DRCARD000NET',
}

/** 判定兑换结果：先按配置规则校验格式，再查确定性映射 */
export function resolveRedeemOutcome(input: string): RedeemOutcome {
  const code = input.replace(/\s/g, '')
  if (!REDEEM_CODE_RULE.pattern.test(code)) return 'format'
  return REDEEM_CODE_OUTCOMES[code.toUpperCase()] ?? 'success'
}

/** 消息分类（T012；reference/通知2.html 的 cat 字段） */
export type NotificationCategory = 'system' | 'activity'

/**
 * 通知消息夹具（T012）
 * - title / summary / time / unread 与 reference/通知2.html 的 NOTIFICATIONS 完全一致，不改文案
 * - paragraphs 首段即列表摘要；note / cta 沿用 reference/通知.html 的正文语言
 */
export interface NotificationFixture {
  id: string
  cat: NotificationCategory
  title: string
  summary: string
  time: string
  unread: boolean
  paragraphs: string[]
  note?: string
  cta?: { label: string; to: string }
}

/** 系统通知的通用提示（reference/通知.html md-callout） */
const SYSTEM_NOTE = '本条为系统通知,不会重复推送。'
/** 活动通知的主操作（reference/通知.html ctaPrimary） */
const ACTIVITY_CTA = { label: '立即参与', to: '/dearseed' }

export const NOTIFICATION_FIXTURES: NotificationFixture[] = [
  {
    id: 'n1',
    cat: 'system',
    title: '订单核销成功',
    summary: '您的到店核销码 8821 已于 14:32 在「上海·徐汇店」完成核销,本次消耗 280 泡泡值。',
    time: '刚刚',
    unread: true,
    paragraphs: [
      '您的到店核销码 8821 已于 14:32 在「上海·徐汇店」完成核销,本次消耗 280 泡泡值。',
      '如有任何问题,可在「我的 · 客服中心」联系我们,工作日 9:00 - 21:00 在线为您服务。',
    ],
    note: SYSTEM_NOTE,
  },
  {
    id: 'n2',
    cat: 'activity',
    title: '双十一宠粉福利 · 限时开启',
    summary: '11.01–11.11 每日 10:00 限量抢兑「诗得丽洗护礼盒」,首单立减 ¥58,数量有限先到先得。',
    time: '10 分钟前',
    unread: true,
    paragraphs: ['11.01–11.11 每日 10:00 限量抢兑「诗得丽洗护礼盒」,首单立减 ¥58,数量有限先到先得。'],
    cta: ACTIVITY_CTA,
  },
  {
    id: 'n3',
    cat: 'system',
    title: '泡泡值到账提醒',
    summary: '您昨日完成的「每日签到」已奖励 20 泡泡值,当前余额 1,260,有效期 90 天。',
    time: '今天 09:12',
    unread: true,
    paragraphs: ['您昨日完成的「每日签到」已奖励 20 泡泡值,当前余额 1,260,有效期 90 天。'],
    note: SYSTEM_NOTE,
  },
  {
    id: 'n4',
    cat: 'activity',
    title: '搭子邀请待你回应',
    summary: '「小宇宙」邀请你参加本周六的「诗得丽洗护课堂」,点击查看详情并确认。',
    time: '昨天 21:40',
    unread: false,
    paragraphs: ['「小宇宙」邀请你参加本周六的「诗得丽洗护课堂」,点击查看详情并确认。'],
    cta: ACTIVITY_CTA,
  },
  {
    id: 'n5',
    cat: 'system',
    title: '资料完善奖励已发放',
    summary: '感谢您完善个人资料,15 泡泡值奖励已到账。',
    time: '昨天 18:05',
    unread: false,
    paragraphs: ['感谢您完善个人资料,15 泡泡值奖励已到账。'],
    note: SYSTEM_NOTE,
  },
  {
    id: 'n6',
    cat: 'activity',
    title: '「品牌福利官」11 月好物上新',
    summary: '本月新增 6 款专属兑换好物,含「丝享柔顺洗发水 500ml」与「暖橙随身杯」,先到先兑。',
    time: '11-13',
    unread: false,
    paragraphs: ['本月新增 6 款专属兑换好物,含「丝享柔顺洗发水 500ml」与「暖橙随身杯」,先到先兑。'],
    cta: ACTIVITY_CTA,
  },
]

/** 分类中文标签（reference catLabel） */
export function notificationCategoryLabel(cat: NotificationCategory | string): string {
  if (cat === 'system') return '系统'
  if (cat === 'activity') return '活动'
  return '通用'
}

/** 时间分组（reference render 内的分组规则，保持一致） */
export function notificationGroupLabel(time: string): '今天' | '昨天' | '更早' {
  if (/刚刚|分钟前|今天/.test(time)) return '今天'
  if (/昨天/.test(time)) return '昨天'
  return '更早'
}

const LUCK_ORDER = LUCK_FIXTURES.map((item) => item.key)

/** 通过 `?result=` 取确定结果；非法值回退到默认「大吉」 */
export function resolveLuck(key: string | null): LuckFixture {
  const found = LUCK_FIXTURES.find((item) => item.key === key)
  return found ?? LUCK_FIXTURES[0]
}

/** 确定性推进：great → good → minor → great（用于「再抽一次」，非随机） */
export function nextLuck(current: LuckFixture['key']): LuckFixture {
  const index = LUCK_ORDER.indexOf(current)
  return LUCK_FIXTURES[(index + 1) % LUCK_ORDER.length]
}

/* =============================================================
 * T006 会员与打卡
 * 节点：#5 泡泡值明细 / #6 会员中心 / #7 今日澡运 / #8 打卡成功
 *      / #21 打卡日历 / #22 补打卡成功 / #26 会员等级 / #41 抽取成功
 * 事实源：docs/prototype/02-membership-and-checkin.md
 * ============================================================= */

/* -------------------------------------------------------------
 * 澡运规则隔离区（B-003 未决）
 * -------------------------------------------------------------
 * 摹客已确认：#7 页面中心「抽取今日澡运」按钮点击即抽签；#41 出现「恭喜你获得 50🫧」；
 * 关闭返回会员中心。
 * 尚未确认：签运档位数量与命名（大吉/中吉/小吉来自历史稿）、是否可重抽、
 * 结果是否当天持久化（「当天已抽过可直接进入结果」的落地方式）。
 * 因此上方 LUCK_FIXTURES / nextLuck 一律视为隔离演示数据：
 * 页面默认只呈现摹客已确认的结果表达，三档与重抽只在显式 `?result=` 夹具参数下出现，
 * 并且必须带隔离标识。规则定稿前不要把它们当作最终视觉与业务规则。
 * ------------------------------------------------------------- */
export const LUCK_RULE_STATUS = {
  /** 定稿后置为 true，再开放重抽与当天持久化 */
  confirmed: false,
  blocker: 'B-003',
  isolatedNote: '签运档位、重抽与结果持久化规则未确认，此处仅为隔离演示，不作定稿。',
} as const

/**
 * #7 抽签页文案（摹客已确认部分）
 * ⚠️ T022 整改后 /luck 为不可操作占位页，本组文案暂不上屏，
 *    仅作为「玩法定稿后要还原的摹客原文」留档，定稿前不要据此渲染可点击 CTA。
 */
export const LUCK_DRAW = {
  action: '抽取今日澡运',
  hint: '点击即可抽取今日澡运',
} as const

/** #41 抽取成功中摹客已确认的奖励表达 */
export const LUCK_REWARD_BUBBLE = 50

/**
 * T022 §4.3：澡运入口与目标页本阶段均为占位。
 * 这里只承载「占位」这件事本身的文案，不补任何未确认的抽签规则。
 * 泡泡值福利入口与 /luck 页共用同一份文案，保证两处口径一致。
 * T022 整改：/luck 不再提供任何可操作的抽取入口，占位态需自带「敬请期待」表达。
 */
export const LUCK_PLACEHOLDER = {
  tag: '玩法待定',
  entrySubtitle: '玩法待定',
  note: '澡运玩法与签运档位仍在确认中，当前入口与结果页为占位演示。',
  /** 目标页占位主状态文案，替代原「抽取今日澡运」主按钮 */
  headline: '敬请期待',
  subline: '澡运玩法筹备中，抽签规则确认后再开放。',
} as const

/* -------------------------------------------------------------
 * #5 泡泡值明细
 * ------------------------------------------------------------- */

/** 原型 §3：「1280 泡泡值余额」 */
export const BUBBLE_BALANCE = 1280

export type BubbleFlowKind = 'income' | 'expense'

export interface BubbleRecord {
  id: string
  title: string
  time: string
  /** 绝对值；正负由 kind 决定，避免页面再解析字符串 */
  amount: number
  kind: BubbleFlowKind
}

/**
 * 流水夹具。
 * ⚠️ B-002 未决：历史稿的 15 条 mock 与暖橙/暖金改造是否沿用尚未确认，
 *    这里沿用页面已有条目，不新增未确认内容，也不删除已验收内容。
 * 时间锚点对齐 CHECKIN_CYCLE_LABEL 的 2026-06 周期（最新一条落在夹具「今天」2026-06-12），
 * 原型未画流水日期，此处只统一展示口径，不改条目、金额与增减类型。
 */
export const BUBBLE_RECORDS: BubbleRecord[] = [
  { id: 'b1', title: '每日打卡', time: '2026-06-12 09:00', amount: 100, kind: 'income' },
  { id: 'b2', title: '连续签到 7 天奖励', time: '2026-06-12 09:00', amount: 50, kind: 'income' },
  { id: 'b3', title: '观看视频任务', time: '2026-06-11 21:12', amount: 5, kind: 'income' },
  { id: 'b4', title: '邀请好友成为搭子', time: '2026-06-11 12:30', amount: 50, kind: 'income' },
  { id: 'b5', title: '每日打卡', time: '2026-06-11 09:00', amount: 100, kind: 'income' },
  { id: 'b6', title: '完成成就任务', time: '2026-06-10 20:05', amount: 20, kind: 'income' },
  { id: 'b7', title: '兑换样包', time: '2026-06-10 14:22', amount: 200, kind: 'expense' },
  { id: 'b8', title: '每日打卡', time: '2026-06-10 09:00', amount: 100, kind: 'income' },
  { id: 'b9', title: '看视频获取泡泡值', time: '2026-06-09 19:44', amount: 5, kind: 'income' },
  { id: 'b10', title: '每日打卡', time: '2026-06-09 09:00', amount: 100, kind: 'income' },
  { id: 'b11', title: '兑换现金减免券', time: '2026-06-08 16:08', amount: 80, kind: 'expense' },
  { id: 'b12', title: '挑战任务完成', time: '2026-06-08 10:33', amount: 20, kind: 'income' },
  { id: 'b13', title: '每日打卡', time: '2026-06-08 09:00', amount: 100, kind: 'income' },
  { id: 'b14', title: '每日打卡', time: '2026-06-07 09:00', amount: 100, kind: 'income' },
  { id: 'b15', title: '新人注册奖励', time: '2026-06-07 08:20', amount: 100, kind: 'income' },
]

/** 原型 §3 的筛选 Tab：全部 / 收入 / 消耗 */
export const BUBBLE_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'income', label: '收入' },
  { value: 'expense', label: '消耗' },
] as const

export type BubbleFilter = (typeof BUBBLE_FILTERS)[number]['value']

export function isBubbleFilter(value: string | null): value is BubbleFilter {
  return BUBBLE_FILTERS.some((item) => item.value === value)
}

/** 确定性筛选：不做排序扰动，保持夹具顺序 */
export function filterBubbleRecords(filter: BubbleFilter): BubbleRecord[] {
  if (filter === 'all') return BUBBLE_RECORDS
  return BUBBLE_RECORDS.filter((record) => record.kind === filter)
}

export function sumBubbleRecords(kind: BubbleFlowKind): number {
  return BUBBLE_RECORDS.filter((record) => record.kind === kind).reduce((total, record) => total + record.amount, 0)
}

/** 原型 §3：无更多数据时的兜底文案 */
export const BUBBLE_LIST_END = '暂时没有更多记录啦'

/* -------------------------------------------------------------
 * #5 泡泡任务占位（T022 §4.2）
 * 需求原文：任务内容先使用视觉完整、符合现有金橙体系的任务占位卡片；
 *          可参考现有任务语义展示每日打卡、连续签到、观看视频、邀请好友等占位内容，
 *          但不新增真实任务业务逻辑。
 * 因此下列条目的标题与泡泡值口径全部对齐 BUBBLE_RECORDS 中已验收的同名流水，
 * 不发明新的任务名、奖励数值或完成规则；进度只为呈现卡片状态层级。
 * ------------------------------------------------------------- */
export const POINTS_TASK_PLACEHOLDER_NOTE = '任务体系未定稿，以下为占位任务卡，进度与奖励不参与真实结算。'

export type PointsTaskPlaceholderState = 'done' | 'active' | 'todo'

export interface PointsTaskPlaceholder {
  id: string
  title: string
  description: string
  /** 沿用流水夹具中同名条目的泡泡值口径 */
  rewardBubble: number
  current: number
  target: number
  state: PointsTaskPlaceholderState
  stateLabel: string
}

export const POINTS_TASK_PLACEHOLDERS: PointsTaskPlaceholder[] = [
  {
    id: 'daily-checkin',
    title: '每日打卡',
    description: '每天签到一次即可领取泡泡值',
    rewardBubble: 100,
    current: 1,
    target: 1,
    state: 'done',
    stateLabel: '已完成',
  },
  {
    id: 'streak-checkin',
    title: '连续签到',
    description: '连续签到 7 天再领一次额外奖励',
    rewardBubble: 50,
    current: 5,
    target: 7,
    state: 'active',
    stateLabel: '进行中',
  },
  {
    id: 'watch-video',
    title: '观看视频',
    description: '看完品牌短视频获取泡泡值',
    rewardBubble: 5,
    current: 0,
    target: 1,
    state: 'todo',
    stateLabel: '未开始',
  },
  {
    id: 'invite-buddy',
    title: '邀请好友',
    description: '邀请好友成为洗头搭子',
    rewardBubble: 50,
    current: 0,
    target: 1,
    state: 'todo',
    stateLabel: '未开始',
  },
]

export function pointsTaskPercent(task: PointsTaskPlaceholder): number {
  if (task.target <= 0) return 0
  return Math.min(100, Math.round((task.current / task.target) * 100))
}

/* -------------------------------------------------------------
 * #21 打卡日历 / #8 打卡成功 / #4 打卡提示 / #22 补打卡成功
 * ------------------------------------------------------------- */

/** 原型 §6 的活动周期文案，逐字保留 */
export const CHECKIN_CYCLE_LABEL = '2026.06.01 - 2026.06.30'

/** 夹具「今天」：2026-06-12（周五），保证月历状态可复现 */
export const CHECKIN_TODAY = 12

/** 周期天数与首日星期（2026-06-01 为周一） */
export const CHECKIN_MONTH_DAYS = 30
export const CHECKIN_FIRST_WEEKDAY = 1
export const CHECKIN_WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

/**
 * done 已签到 / today 今日已签到 / makeup 漏签可补签 / upcoming 未到
 */
export type CheckinDayState = 'done' | 'today' | 'makeup' | 'upcoming'

/** 已签到日（含今天）；6、7 日漏签用于演示「补签」 */
const CHECKIN_DONE_DAYS = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12]

export interface CheckinDay {
  day: number
  state: CheckinDayState
}

export const CHECKIN_CALENDAR: CheckinDay[] = Array.from({ length: CHECKIN_MONTH_DAYS }, (_, index) => {
  const day = index + 1
  if (day === CHECKIN_TODAY) return { day, state: 'today' }
  if (CHECKIN_DONE_DAYS.includes(day)) return { day, state: 'done' }
  if (day < CHECKIN_TODAY) return { day, state: 'makeup' }
  return { day, state: 'upcoming' }
})

/** 当前周期连续签到天数（自今天向前连续计数，由夹具推导而非硬编码） */
export const CHECKIN_STREAK = (() => {
  let streak = 0
  for (let day = CHECKIN_TODAY; day >= 1; day -= 1) {
    if (!CHECKIN_DONE_DAYS.includes(day)) break
    streak += 1
  }
  return streak
})()

export interface CheckinReward {
  days: number
  /** 仅摹客已确认的奖励值才给数字；未确认留空并由页面显示待确认标记 */
  bubble?: number
}

/**
 * 原型 §5 确认「连续 3 天获得 10 泡泡值」；§6 出现「连续 3 天、连续 10 天等」。
 * ⚠️ 连续 10 天的奖励数值未确认，此处不自行补值。
 */
export const CHECKIN_REWARDS: CheckinReward[] = [
  { days: 3, bubble: 10 },
  { days: 10 },
]

/** 原型 §5 / §6 顶部状态文案 */
export const CHECKIN_STATUS_TEXT = '今日已签到'

/**
 * 用户 2026-08-24 确认打卡页需要体现「任务」。
 * 当前只登记已存在且可由页面状态验证的每日打卡任务；奖励值与泡泡流水中的「每日打卡 +100」保持一致。
 * 其他任务类型、刷新周期与领取规则尚未确认，不在此扩展。
 */
export const CHECKIN_DAILY_TASK = {
  title: '每日打卡',
  description: '完成今日签到',
  rewardBubble: 100,
  progress: '1 / 1',
} as const

/** #4 打卡提示弹窗（原型 §4） */
export const CHECKIN_REMINDER = {
  title: '每日打卡',
  tips: '坚持每日打卡可获得泡泡值，并领取洗护体验样包。',
  action: '打卡',
} as const

/** #22 补打卡成功弹窗（原型 §7） */
export const CHECKIN_MAKEUP_SUCCESS = {
  title: '补打卡成功',
  action: '确认',
} as const

/**
 * 原型 §6 底部「为你精选」。
 * ⚠️ B-018 未决：该模块在 reference 中没有对应视觉稿，商品清单与价格未定。
 *    这里只复用项目内已存在的商品文案与 §3 已确认的样包消耗值，不自造新商品。
 */
export interface CheckinPick {
  id: string
  name: string
  desc: string
  cost?: number
}

export const CHECKIN_PICKS: CheckinPick[] = [
  { id: 'p1', name: '洗护组合体验券', desc: '洗发 / 护发 / 沐浴体验，限到店核销', cost: 200 },
  { id: 'p2', name: '核心洗发水体验券', desc: '限到店核销' },
]

/**
 * 打卡链路中「原型未给出规则」的部分，统一在此登记并隔离。
 * 页面只读这里的开关与说明，不自行补写判定逻辑。
 */
export const CHECKIN_RULE_STATUS = {
  /** 月份切换 */
  monthSwitch: {
    confirmed: false,
    blocker: 'B-019',
    note: '原型 §6 只画出当前活动周期的单月月历，未给出可切换范围与越界表现，故本页不提供月份切换。',
  },
  /** 补签消耗、次数上限与「不可补签」判定 */
  makeup: {
    confirmed: false,
    blocker: 'B-020',
    note: '原型 §6/§7 仅确认「漏签显示补签」与「补打卡成功」，补签消耗、次数上限与不可补签判定未确认，此处仅作隔离演示。',
  },
  /** #22 弹窗中的广告位与关闭倒计时 */
  makeupAd: {
    confirmed: false,
    blocker: 'B-021',
    note: '原型 §7 另画有广告 30s 与关闭倒计时，广告来源与倒计时规则未确认，此处不实现广告位。',
  },
} as const

/**
 * #6 会员中心持卡人信息。
 * ⚠️ 昵称、卡号沿用已实现页面（历史稿口径），原型 §1 只确认「等级与相关状态」+「泡泡值余额」。
 * ⚠️ LV.4 命名此前在同一页出现「深鲨传说 / 溱蜜传说」两种写法（会员等级页用后者），
 *    此处统一为「溱蜜传说」，整体等级命名仍挂 B-022 待确认。
 */
export const MEMBER_PROFILE = {
  nickname: '小鹿同学',
  brandLine: 'DEARSEED · 溱蜜传说',
  levelLabel: 'LV.4',
  levelName: '溱蜜传说',
  cardNo: 'DS·2026·008888',
  levelEntryLabel: '查看等级',
  bubbleUnit: 'Bubble Point',
} as const

/**
 * #6 四个主要功能入口（原型 §1 文案与去向，逐字照抄，不改写为「今日幸运 / 每日任务」）
 * ⚠️ subtitle 为本次视觉参考图新增的入口说明，仅描述入口本身在做什么，不引入新的规则数值；
 *    参考图写作「领漾运积分」，按用户确认的命名口径落为「领澡运积分」。
 */
export interface MemberEntry {
  id: string
  name: string
  subtitle: string
  to: string
}

export const MEMBER_ENTRIES: MemberEntry[] = [
  { id: 'luck', name: '今日澡运', subtitle: '抽专属好礼', to: '/luck' },
  { id: 'task', name: '是日任务', subtitle: '领澡运积分', to: '/checkin' },
  { id: 'coupon', name: '优惠卡包', subtitle: '专享优惠', to: '/card' },
  { id: 'buddy', name: '洗头搭子', subtitle: '好友同行礼', to: '/buddy' },
]

/** #6 会员中心区块标题（参考图口径：入口区块标题为「尊享服务」） */
export const MEMBER_SECTION_LABELS = {
  entriesTitle: '尊享服务',
} as const

/**
 * #26 会员等级分级。
 * ⚠️ 原型 §2 只注明「本页为会员等级分级，仅开会时作展示」，等级数量、命名、门槛均未确认；
 *    以下沿用已实现页面的四级，属历史稿口径（B-022），不在此扩级也不补权益。
 */
export interface MemberLevel {
  label: string
  name: string
  /** 当前持卡等级 */
  current?: boolean
}

export const MEMBER_LEVELS: MemberLevel[] = [
  { label: 'LV.1', name: '海泡泡新生' },
  { label: 'LV.2', name: '春氧达人' },
  { label: 'LV.3', name: '头皮管理员' },
  { label: 'LV.4', name: '溱蜜传说', current: true },
]

/**
 * #26 本季限定卡面。
 * ⚠️ 卡面名称与配色来自历史稿品牌素材，原型未给出清单（B-022 同批待确认）；
 *    按 AGENTS §3 保留品牌艺术表现，不改为通用渐变。
 */
export interface MemberCardFace {
  scene: string
  name: string
  desc: string
}

export const MEMBER_CARD_FACES: MemberCardFace[] = [
  { scene: '场景 1', name: '玫瑰粉霸卡', desc: '黑曜玫瑰 × 珠光白' },
  { scene: '场景 2', name: '露紫薰衣草卡', desc: '法国薰衣草 × 樱花白' },
  { scene: '场景 3', name: '雾蓝海蕴卡', desc: '雾蓝蓝 × 珍珠白' },
  { scene: '场景 4', name: '墨绿松石卡', desc: '墨绿 × 香槟金' },
]

/** #26 原型页面备注，需在页面上明示，避免被当成已定稿业务页 */
export const MEMBER_LEVELS_REMARK = '本页为会员等级分级，仅开会时作展示。'

/**
 * 会员链路中「原型未给出规则」的部分，统一在此登记并隔离。
 */
export const MEMBER_RULE_STATUS = {
  /** 等级数量、命名与卡面清单 */
  levelNaming: {
    confirmed: false,
    blocker: 'B-022',
    note: '原型 §2 未给出等级数量、命名与限定卡面清单，现有 LV.1–LV.4 与四款卡面沿用历史稿，待产品确认。',
  },
  /** 等级权益、升级门槛与「未解锁 / 最高级」判定 */
  levelProgress: {
    confirmed: false,
    blocker: 'B-023',
    note: '各等级权益、升级门槛与未解锁判定原型均未画出，故等级页不展示权益矩阵、升级进度与解锁状态。',
  },
} as const

/* ────────────────────────── T013 福利官与客服 ────────────────────────── */

/**
 * #57 品牌福利官基础信息。文案取自原型 §8「诗得丽品牌福利官-吴哥」。
 */
export const WELFARE_OFFICER = {
  brand: '诗得丽',
  role: '品牌福利官',
  name: '吴哥',
  /** 原型 §8 引导话术 */
  lead: ['请添加我们的企业微信福利官', '获取更多福利咨询'],
  qrHint: '长按或扫描识别二维码，添加企业微信',
} as const

/**
 * #57 添加福利官后可获得的服务。
 * 原型 §8 明确为「人工客服 / 活动咨询 / 福利抽奖」三类，
 * 历史稿 T08 的四条（每日签到提醒 / 会员专享福利 / 新品体验优先购 / 节日活动预告）已废弃。
 */
export interface WelfareOfficerService {
  key: string
  /** 圆形徽标字形，沿用本项目既有服务项视觉语言（原型未给出图标） */
  glyph: string
  title: string
}

export const WELFARE_OFFICER_SERVICES: WelfareOfficerService[] = [
  { key: 'human-service', glyph: '客', title: '人工客服' },
  { key: 'activity-consult', glyph: '咨', title: '活动咨询' },
  { key: 'welfare-lottery', glyph: '奖', title: '福利抽奖' },
]

/**
 * 福利官与客服链路中「原型未给出规则」的部分，统一在此登记并隔离。
 */
export const WELFARE_OFFICER_RULE_STATUS = {
  /** 三类服务的说明文案 */
  serviceCopy: {
    confirmed: false,
    blocker: 'B-012',
    note: '原型 §8 只给出「人工客服 / 活动咨询 / 福利抽奖」三个名称，未给出副标题说明，故本页只列名称，不补写历史稿式描述。',
  },
  /** 三类服务是否可点击跳转 */
  serviceEntry: {
    confirmed: false,
    blocker: 'B-012',
    note: '原型 §8 主要交互只有「返回 → 我的」，未给出服务项跳转目标，故三类服务渲染为说明列表而非可点按钮。',
  },
  /** 企业微信二维码素材 */
  qrAsset: {
    confirmed: false,
    blocker: 'B-012',
    note: '真实企业微信活码尚未入库，页面沿用可辨识的二维码占位表达，不伪造可扫码图形。',
  },
} as const

/**
 * #58 智能客服会话。
 * 原型 §9 给出 AI 客服「小诗」的欢迎语、对话记录、底部输入框、右上角「企微客服」与页内「人工客服」入口。
 */
export const CHAT_BOT = {
  name: '小诗',
  role: 'AI 客服',
  glyph: '诗',
  /** 原型 §9 欢迎语 */
  welcome: '你好，我是诗得丽 AI 客服小诗，有什么可以帮你？',
  /** 页内转人工入口文案，原型 §9 明示 */
  humanEntry: '人工客服',
  /** 右上角企微客服入口文案，原型 §9 明示 */
  wecomEntry: '企微客服',
  inputPlaceholder: '请输入你的问题',
} as const

export type ChatRole = 'bot' | 'user'
export type ChatSendStatus = 'sent' | 'sending' | 'failed'

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  /** 仅用户消息需要发送态；机器人消息恒为 sent */
  status: ChatSendStatus
  /** 机器人一侧头像字形；缺省时按智能客服小诗渲染，人工坐席消息需显式指定 */
  glyph?: string
}

/** 首屏欢迎态：只有小诗的欢迎语，不预置历史对话 */
export const CHAT_WELCOME_MESSAGES: ChatMessage[] = [
  { id: 'bot-welcome', role: 'bot', text: CHAT_BOT.welcome, status: 'sent' },
]

/**
 * 有对话态（`?state=conversation`）：用于截图与验收，内容为一问一答。
 */
export const CHAT_CONVERSATION_MESSAGES: ChatMessage[] = [
  ...CHAT_WELCOME_MESSAGES,
  { id: 'user-1', role: 'user', text: '我的洗发水体验券怎么用？', status: 'sent' },
  {
    id: 'bot-1',
    role: 'bot',
    text: '你可以在「卡包」中找到该券，到店出示二维码由门店扫码核销即可。',
    status: 'sent',
  },
]

/**
 * 发送失败态（`?state=failed`）：欢迎语后接一条发送失败的用户消息。
 * 这条消息文案不含 CHAT_FAIL_KEYWORDS，因此点「重试」会按同一判定函数转为成功，
 * 用于演示「失败 → 重试 → 成功」；而用户手动输入含关键词的消息重试仍会失败。
 */
export const CHAT_FAILED_MESSAGES: ChatMessage[] = [
  ...CHAT_WELCOME_MESSAGES,
  { id: 'user-failed', role: 'user', text: '门店周末营业到几点？', status: 'failed' },
]

/**
 * 发送结果为确定性映射，禁止随机。
 * 命中 CHAT_FAIL_KEYWORDS 的输入判为发送失败（用于演示失败/重试），其余判为发送成功。
 */
export const CHAT_FAIL_KEYWORDS = ['断网', '发送失败'] as const

/** 触发转人工的关键词，原型 §9「输入/点击『人工客服』→ 请求人工客服流程」 */
export const CHAT_HUMAN_KEYWORDS = ['人工客服', '转人工', '人工'] as const

/** 判定一条用户输入的发送结果（确定性） */
export function resolveChatSendStatus(input: string): Extract<ChatSendStatus, 'sent' | 'failed'> {
  const text = input.trim()
  return CHAT_FAIL_KEYWORDS.some((keyword) => text.includes(keyword)) ? 'failed' : 'sent'
}

/** 判定一条用户输入是否请求人工客服（确定性） */
export function isChatHumanRequest(input: string): boolean {
  const text = input.trim()
  return CHAT_HUMAN_KEYWORDS.some((keyword) => text.includes(keyword))
}

/** 发送成功后小诗的兜底回答；原型未给出问答库，故统一为可核查的固定回复 */
export const CHAT_BOT_FALLBACK_REPLY =
  '已收到你的问题，我先为你查询。如需更详细的处理，可以点击「人工客服」联系福利官。'

/** 发送失败提示与重试文案 */
export const CHAT_SEND_FAILED_HINT = '发送失败，请检查网络后重试'
export const CHAT_RETRY_LABEL = '重试'

/** 模拟一次往返的固定时长（毫秒），固定值以保证可复现 */
export const CHAT_SEND_LATENCY_MS = 700

/**
 * #71 请求人工客服弹层。文案取自原型 §10。
 */
export const CHAT_HUMAN_PROMPT = {
  title: '请添加我们的企业微信福利官获取人工客服服务',
  cancelLabel: '取消',
} as const

/**
 * #70 人工客服排队两态。
 * 原型 §11 只给出「排队中」与「已接入」两个确定状态，
 * 历史稿 T10 的 6 秒队列递减、取消排队 Toast 与 IP 占位插画均非摹客需求，已废弃。
 */
export const CHAT_QUEUE = {
  /** 排队中：原型给出的固定前置人数，静态展示，不做递减 */
  queuing: {
    title: '正在为您接入人工客服...',
    aheadCount: 2,
    aheadText: '前面还有 2 位',
  },
  /** 已接入：原型示例「诗得丽-吴哥 为您服务」 */
  connected: {
    agentName: '诗得丽-吴哥',
    title: '诗得丽-吴哥 为您服务',
  },
} as const

/**
 * #70 已接入后的人工对话。
 * 原型 §11 明确「智能客服历史消息保留在当前页面中」，故排队页复用 CHAT_CONVERSATION_MESSAGES 作为历史，
 * 接入后仅追加一条人工客服开场语，不另起完整客服系统。
 */
export const CHAT_AGENT_GREETING: ChatMessage = {
  id: 'agent-greeting',
  role: 'bot',
  text: '你好，我是人工客服吴哥，已经看到你的问题，请稍等我为你处理。',
  status: 'sent',
  glyph: '哥',
}

/**
 * 客服链路中「原型未给出规则」的部分，统一在此登记并隔离。
 */
export const CHAT_RULE_STATUS = {
  /** 热门问题快捷入口 */
  quickQuestions: {
    confirmed: false,
    blocker: 'B-013',
    note: '原型 §9 提到「热门问题快捷入口」但未给出条目，历史稿 T09 自创的 4 个问题已按任务卡验收标准废弃；本页在问题清单确认前不展示快捷入口。',
  },
  /** 智能问答内容 */
  botAnswers: {
    confirmed: false,
    blocker: 'B-013',
    note: '原型未给出问答库，故所有非转人工输入统一返回 CHAT_BOT_FALLBACK_REPLY，不编造分场景回答。',
  },
  /** 排队时长与人数变化 */
  queueDynamics: {
    confirmed: false,
    blocker: 'B-014',
    note: '原型 §11 只给出「排队中 / 已接入」两个静态状态，未给出人数递减、等待倒计时与取消排队反馈，故本页不实现任何队列动态。',
  },
  /** 企微客服跳转 */
  wecomJump: {
    confirmed: false,
    blocker: 'B-013',
    note: '企业微信外跳能力与真实活码均未接入，「企微客服」与转人工统一落到二维码引导弹层（原型 §10）。',
  },
  /** #71 → #70 的前进入口 */
  humanQueueEntry: {
    confirmed: false,
    blocker: 'B-014',
    note: '原型 §10 弹层内容只列出「取消」，未给出进入 #70 的前进动作。该入口未确认，因此不实现：#71 只保留「取消」，#70 暂通过直达路由 /service/chat/human?state=queuing|connected 与 ?debug=1 验收。',
  },
  /** 已接入后的人工回复 */
  agentReplies: {
    confirmed: false,
    blocker: 'B-014',
    note: '原型 §11 只给出人工客服开场语，未给出后续问答。已接入态允许发送并显示自己的消息，但不编造坐席回复。',
  },
} as const

/* ────────────────────────── T008 洗护兑换与商城链路 ────────────────────────── */

/**
 * 洗护兑换专区排序维度（原型 §1 / §2：综合、兑换量、泡泡值）。
 * 与 routes.ts `/exchange` 已登记的 `?state=` 对齐：
 *   综合 = 默认（无 state）、兑换量 = `sort-exchange`(#37)、泡泡值 = `sort-points`(#38)。
 * ⚠️ 原型把排行画成两张独立 artboard，但 §2 明确「只是排序状态，不是独立业务模块」，
 *    故此处只作为同一列表的排序键，不拆页面。
 */
export type ExchangeSort = 'default' | 'sort-exchange' | 'sort-points'

export const EXCHANGE_SORTS: Array<{ key: ExchangeSort; label: string }> = [
  { key: 'default', label: '综合' },
  { key: 'sort-exchange', label: '兑换量' },
  { key: 'sort-points', label: '泡泡值' },
]

/** 2026-08-24 用户参考图确认的前台体验券分类 Tab。 */
export type ExchangeCategory = 'all' | 'shampoo' | 'conditioner' | 'scalp-care'

export const EXCHANGE_CATEGORIES: Array<{ key: ExchangeCategory; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'shampoo', label: '洗发体验' },
  { key: 'conditioner', label: '护发体验' },
  { key: 'scalp-care', label: '头皮护理' },
]

/** 体验券库存态；原型只画了可兑换体验券，兑完态由 T008 显式登记以便验收（B-025） */
export type ExchangeStock = 'in-stock' | 'sold-out'

/**
 * 洗护兑换专区体验券夹具（T008；摹客 #18 / #37 / #38）
 * - 原型 §1 的样包卡在当前业务口径下统一表述为体验券
 * - 其余商品名沿用项目内已存在的确定性文案（CHECKIN_PICKS / SHARE_PRODUCT_FIXTURE / CARD_COUPON_FIXTURES），
 *   不自造新 SKU 名称
 * - ⚠️ B-025：完整 SKU 清单、真实所需泡泡值、兑换量与库存原型均未给出，以下数值仅为确定性夹具，不定稿
 */
export interface ExchangeProductFixture {
  id: string
  name: string
  /** 体验券说明（原型 §3 弹窗说明行） */
  desc: string
  /** 所需泡泡值 */
  cost: number
  /** 兑换量（排序用的数值） */
  redeemed: number
  /** 兑换量展示文案；原型 §1 写作「2000+」，故与数值分开存放 */
  redeemedLabel: string
  stock: ExchangeStock
  /** 用于用户确认的四分类前台 Tab；未归类体验券只在「全部」中展示。 */
  category?: Exclude<ExchangeCategory, 'all'>
  /** 缩略图素材键；仅 src/assets/brand 内已有素材可用，其余走 Token 占位（不新增二进制素材） */
  thumb?: 'dearseed-kit' | 'honey' | 'seasalt' | 'berry' | 'herbal'
}

export const EXCHANGE_PRODUCT_FIXTURES: ExchangeProductFixture[] = [
  {
    id: 'e1',
    name: 'DearSeed 洗发水体验券',
    desc: '单次洗发体验，限到店核销',
    cost: 200,
    redeemed: 2000,
    redeemedLabel: '2000+',
    stock: 'in-stock',
    category: 'shampoo',
    thumb: 'dearseed-kit',
  },
  {
    id: 'e2',
    name: '洗护组合体验券',
    desc: '洗发 / 护发组合体验，限到店核销',
    cost: 200,
    redeemed: 1860,
    redeemedLabel: '1860',
    stock: 'in-stock',
    category: 'conditioner',
    thumb: 'honey',
  },
  {
    id: 'e3',
    name: '核心洗发水体验券',
    desc: '限到店核销',
    cost: 480,
    redeemed: 1240,
    redeemedLabel: '1240',
    stock: 'in-stock',
    category: 'scalp-care',
    thumb: 'seasalt',
  },
  {
    id: 'e4',
    name: '洗发体验券',
    desc: '单次洗发体验，限到店核销',
    cost: 320,
    redeemed: 720,
    redeemedLabel: '720',
    stock: 'sold-out',
    category: 'shampoo',
    thumb: 'berry',
  },
  {
    id: 'e5',
    name: '现金减免体验券',
    desc: '¥20 到店减免，限到店核销',
    cost: 1500,
    redeemed: 960,
    redeemedLabel: '960',
    stock: 'in-stock',
    thumb: 'herbal',
  },
]

/**
 * 排序：综合 = 夹具声明顺序；兑换量 = 兑换量由高到低；泡泡值 = 所需泡泡值由低到高。
 * 全部使用稳定排序，同值时保持声明顺序，保证截图可复现。
 */
export function exchangeProductsBySort(sort: ExchangeSort): ExchangeProductFixture[] {
  const list = [...EXCHANGE_PRODUCT_FIXTURES]
  if (sort === 'sort-exchange') return list.sort((a, b) => b.redeemed - a.redeemed)
  if (sort === 'sort-points') return list.sort((a, b) => a.cost - b.cost)
  return list
}

export function resolveExchangeCategory(raw: string | null): ExchangeCategory {
  return EXCHANGE_CATEGORIES.some((item) => item.key === raw) ? raw as ExchangeCategory : 'all'
}

export function exchangeProductsByCategory(list: ExchangeProductFixture[], category: ExchangeCategory): ExchangeProductFixture[] {
  return category === 'all' ? list : list.filter((item) => item.category === category)
}

/** 搜索：对体验券名称与说明做大小写无关的包含匹配；空串等价于不过滤 */
export function exchangeSearch(list: ExchangeProductFixture[], keyword: string): ExchangeProductFixture[] {
  const q = keyword.trim().toLowerCase()
  if (!q) return list
  return list.filter((item) => `${item.name}${item.desc}`.toLowerCase().includes(q))
}

export function resolveExchangeSort(raw: string | null): ExchangeSort {
  const found = EXCHANGE_SORTS.find((item) => item.key === raw)
  return found?.key ?? 'default'
}

export function resolveExchangeProduct(id: string | null): ExchangeProductFixture {
  const found = EXCHANGE_PRODUCT_FIXTURES.find((item) => item.id === id)
  return found ?? EXCHANGE_PRODUCT_FIXTURES[0]
}

/** 体验券可兑换性判定（纯函数；余额来自 BUBBLE_BALANCE，不做持久化扣减，见 B-026） */
export type ExchangeAvailability = 'redeemable' | 'insufficient' | 'sold-out'

export function exchangeAvailability(
  product: ExchangeProductFixture,
  balance: number = BUBBLE_BALANCE,
): ExchangeAvailability {
  if (product.stock === 'sold-out') return 'sold-out'
  if (product.cost > balance) return 'insufficient'
  return 'redeemable'
}

/** 兑换专区文案（原型 §1 / §3 / §4 逐字照抄，不改写） */
export const EXCHANGE_COPY = {
  searchPlaceholder: '搜索体验券',
  balanceLabel: '泡泡值余额',
  costUnit: '泡泡值',
  redeemedPrefix: '兑换量',
  quantity: 'x1',
  action: '立即兑换',
  soldOut: '已兑完',
  insufficient: '泡泡值不足',
  submitting: '兑换中',
  emptyTitle: '没有找到相关体验券',
  emptyDesc: '换个关键词试试，或浏览全部洗护体验券。',
  emptyAction: '清空搜索',
  /** #40 存入卡包（原型 §4） */
  successTitle: '兑换成功，卡券已经存入你的卡包啦～',
  successAction: '查看我的卡包',
  successClose: '关闭',
} as const

/**
 * 洗护兑换与商城链路中「原型未给出规则」的部分，统一在此登记并隔离。
 * 页面只读这里的开关与说明，不自行补写判定逻辑。
 */
export const EXCHANGE_RULE_STATUS = {
  /** 泡泡值排序方向 */
  pointsSortDirection: {
    confirmed: false,
    blocker: 'B-024',
    note: '原型 §1/§2 只写「泡泡值」这一维度，未标注升序或降序；此处取「由低到高」以便低门槛体验券优先曝光，待产品确认。',
  },
  /** SKU 清单、兑换量与库存 */
  catalog: {
    confirmed: false,
    blocker: 'B-025',
    note: '原型 §1 仅逐字给出一张兑换卡，完整体验券清单、所需泡泡值、兑换量与兑完判定未确认；此处只用项目内已有文案构成确定性夹具。',
  },
  /** 兑换扣减与卡包写入 */
  settlement: {
    confirmed: false,
    blocker: 'B-026',
    note: '原型 §3/§4 只画到「立即兑换 → 存入卡包」，泡泡值扣减时机、失败回滚与卡包写入均为服务端规则；本页不做持久化扣减，卡包列表不随兑换变化。',
  },
} as const

/* ────────────────────────── T010 地址与订单 ────────────────────────── */

/**
 * 收货地址夹具（T010；原型 04 §12 #55 / §13 #60）
 * - phone 存完整号码，列表展示统一走 maskPhone()，保证「脱敏手机号」只有一处实现
 * - a3 故意保留超长详细地址，用于 375px 下的换行与截断验收
 */
export interface AddressFixture {
  id: string
  name: string
  /** 完整手机号；展示时用 maskPhone() 脱敏 */
  phone: string
  /** 省市区县-乡镇 */
  region: string
  /** 街道、楼牌号等详细地址 */
  detail: string
  isDefault: boolean
}

export const ADDRESS_FIXTURES: AddressFixture[] = [
  {
    id: 'a1',
    name: '张小鹿',
    phone: '13800008899',
    region: '北京市 北京市 朝阳区 青年路街道',
    detail: '青年路 5 号大悦城 B1-038 泡泡洗护柜台',
    isDefault: true,
  },
  {
    id: 'a2',
    name: '李思棠',
    phone: '15600003021',
    region: '上海市 上海市 徐汇区 天平路街道',
    detail: '衡山路 88 号 3 号楼 502 室',
    isDefault: false,
  },
  {
    id: 'a3',
    name: '王一诺',
    phone: '18900004477',
    region: '广东省 深圳市 南山区 粤海街道',
    detail: '科技园南区高新南七道数字技术园 A2 栋 12 层 1203 号工位（靠窗，到楼下请先电话联系）',
    isDefault: false,
  },
]

/** 手机号脱敏：保留前 3 后 4，中间固定四位星号；非 11 位号码原样返回 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 11) return phone
  return `${digits.slice(0, 3)}****${digits.slice(7)}`
}

/** 地址排序：默认地址置顶（原型 §12），其余保持夹具声明顺序，保证截图可复现 */
export function sortAddresses(list: AddressFixture[]): AddressFixture[] {
  return [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
}

/** 省市区县-乡镇候选项（夹具；原型未给出行政区划数据源，见 B-027） */
export const ADDRESS_REGION_OPTIONS = ADDRESS_FIXTURES.map((item) => ({
  value: item.region,
  label: item.region,
}))

/** 地址管理文案（原型 §12 逐字照抄，不改写） */
export const ADDRESS_COPY = {
  defaultTag: '默认',
  addAction: '添加新地址',
  editAction: '编辑',
  setDefaultHint: '设为默认地址',
  emptyTitle: '还没有收货地址',
  emptyDesc: '添加一个收货地址，兑换的洗护好物就能寄到你手上。',
  defaultToast: '已设为默认地址',
} as const

/** 添加/编辑地址文案（原型 §13 逐字照抄，不改写） */
export const ADDRESS_FORM_COPY = {
  titleCreate: '添加新地址',
  titleEdit: '编辑地址',
  nameLabel: '收货人姓名',
  namePlaceholder: '请填写收货人姓名',
  phoneLabel: '手机号码',
  phonePlaceholder: '请填写手机号码',
  regionLabel: '省市区县-乡镇',
  regionPlaceholder: '请选择省市区县-乡镇',
  detailLabel: '街道、楼牌号等详细地址',
  detailPlaceholder: '请填写街道、楼牌号等详细地址',
  pasteAction: '粘贴识别收件信息',
  /** ⚠️ 原型只画出入口，未定义解析规则，见 B-028 */
  pasteUnavailable: '粘贴识别能力待接入',
  defaultSwitch: '设为默认地址',
  submit: '保存',
  savedToast: '地址已保存',
  updatedToast: '地址已更新',
  nameError: '请填写收货人姓名',
  phoneError: '请填写 11 位手机号码',
  regionError: '请选择省市区县-乡镇',
  detailError: '请填写街道、楼牌号等详细地址',
} as const

/** 地址表单校验（纯函数；只校验原型已画出的四个必填项） */
export interface AddressFormValue {
  name: string
  phone: string
  region: string
  detail: string
}

export type AddressFormErrors = Partial<Record<keyof AddressFormValue, string>>

export function validateAddressForm(value: AddressFormValue): AddressFormErrors {
  const errors: AddressFormErrors = {}
  if (!value.name.trim()) errors.name = ADDRESS_FORM_COPY.nameError
  if (!/^1\d{10}$/.test(value.phone.trim())) errors.phone = ADDRESS_FORM_COPY.phoneError
  if (!value.region.trim()) errors.region = ADDRESS_FORM_COPY.regionError
  if (!value.detail.trim()) errors.detail = ADDRESS_FORM_COPY.detailError
  return errors
}

/**
 * 订单夹具（T010；原型 04 §14 #56 / §15 #72）
 * - status 对应订单管理的 Tab 归属，delivery 对应卡片上的配送状态文案
 * - o3 为多商品订单，o2 带运费，用于金额明细与 375px 下的多行验收
 */
export type OrderTabKey = 'all' | 'completed' | 'ongoing' | 'aftersale'
export type OrderStatusKey = Exclude<OrderTabKey, 'all'>
export type OrderDelivery = 'received' | 'shipped' | 'pending' | 'aftersale'

export interface OrderItemFixture {
  name: string
  /** 商品规格 */
  spec: string
  /** 单价（元） */
  price: number
  qty: number
}

export interface OrderFixture {
  id: string
  /** 订单编号 */
  code: string
  /** 下单时间 */
  createdAt: string
  status: OrderStatusKey
  delivery: OrderDelivery
  items: OrderItemFixture[]
  /** 运费（元）；按订单声明，不做计算规则推断，见 B-030 */
  freight: number
  /** 该笔订单成交时的收货信息快照 */
  receiver: Omit<AddressFixture, 'id' | 'isDefault'>
}

export const ORDER_FIXTURES: OrderFixture[] = [
  {
    id: 'o1',
    code: '2024010814320001',
    createdAt: '2024-01-08 14:32',
    status: 'completed',
    delivery: 'received',
    items: [{ name: 'DearSeed 洗发水样包', spec: '单次使用', price: 29, qty: 1 }],
    freight: 0,
    receiver: {
      name: '张小鹿',
      phone: '13800008899',
      region: '北京市 北京市 朝阳区 青年路街道',
      detail: '青年路 5 号大悦城 B1-038 泡泡洗护柜台',
    },
  },
  {
    id: 'o2',
    code: '2024010609150002',
    createdAt: '2024-01-06 09:15',
    status: 'ongoing',
    delivery: 'shipped',
    items: [{ name: '洗发试用装', spec: '30ml 旅行装', price: 39, qty: 2 }],
    freight: 6,
    receiver: {
      name: '李思棠',
      phone: '15600003021',
      region: '上海市 上海市 徐汇区 天平路街道',
      detail: '衡山路 88 号 3 号楼 502 室',
    },
  },
  {
    id: 'o3',
    code: '2024010420480003',
    createdAt: '2024-01-04 20:48',
    status: 'ongoing',
    delivery: 'pending',
    items: [
      { name: '核心洗发水体验券', spec: '线下门店核销', price: 68, qty: 1 },
      { name: '洗护体验样包', spec: '洗发 + 护发两件套', price: 19, qty: 3 },
    ],
    freight: 0,
    receiver: {
      name: '王一诺',
      phone: '18900004477',
      region: '广东省 深圳市 南山区 粤海街道',
      detail: '科技园南区高新南七道数字技术园 A2 栋 12 层 1203 号工位（靠窗，到楼下请先电话联系）',
    },
  },
  {
    id: 'o4',
    code: '2023122811060004',
    createdAt: '2023-12-28 11:06',
    status: 'aftersale',
    delivery: 'aftersale',
    items: [{ name: '现金减免体验券', spec: '满 199 减 30', price: 99, qty: 1 }],
    freight: 0,
    receiver: {
      name: '张小鹿',
      phone: '13800008899',
      region: '北京市 北京市 朝阳区 青年路街道',
      detail: '青年路 5 号大悦城 B1-038 泡泡洗护柜台',
    },
  },
  {
    id: 'o5',
    code: '2023121916240005',
    createdAt: '2023-12-19 16:24',
    status: 'completed',
    delivery: 'received',
    items: [{ name: '洗护体验样包', spec: '洗发 + 护发两件套', price: 19, qty: 2 }],
    freight: 0,
    receiver: {
      name: '李思棠',
      phone: '15600003021',
      region: '上海市 上海市 徐汇区 天平路街道',
      detail: '衡山路 88 号 3 号楼 502 室',
    },
  },
]

export const ORDER_TABS: { key: OrderTabKey; label: string }[] = [
  { key: 'all', label: '全部订单' },
  { key: 'completed', label: '已完成' },
  { key: 'ongoing', label: '进行中' },
  { key: 'aftersale', label: '售后中' },
]

/** 配送状态文案（原型 §14/§15 出现过的状态；未出现的状态不自行补全，见 B-029） */
export const ORDER_DELIVERY_LABEL: Record<OrderDelivery, string> = {
  received: '已收货',
  shipped: '已发货',
  pending: '待发货',
  aftersale: '售后处理中',
}

export function ordersByTab(tab: OrderTabKey): OrderFixture[] {
  if (tab === 'all') return ORDER_FIXTURES
  return ORDER_FIXTURES.filter((order) => order.status === tab)
}

export function resolveOrderTab(raw: string | null): OrderTabKey {
  const found = ORDER_TABS.find((item) => item.key === raw)
  return found?.key ?? 'all'
}

export function findOrder(id: string | undefined): OrderFixture | undefined {
  return ORDER_FIXTURES.find((order) => order.id === id)
}

/** 商品总价 = Σ 单价 × 数量（算术求和，不涉及未确认的优惠规则） */
export function orderGoodsTotal(order: OrderFixture): number {
  return order.items.reduce((sum, item) => sum + item.price * item.qty, 0)
}

/** 实付款 = 商品总价 + 运费（原型 §15 只给出这三个字段） */
export function orderPayable(order: OrderFixture): number {
  return orderGoodsTotal(order) + order.freight
}

/** 商品件数 = Σ 数量（原型 §14「商品件数与实付款」） */
export function orderQuantity(order: OrderFixture): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0)
}

export function formatYuan(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

/** 订单文案（原型 §14 / §15 逐字照抄，不改写） */
export const ORDER_COPY = {
  countPrefix: '共',
  countSuffix: '件商品',
  payableLabel: '实付款',
  goodsTotalLabel: '商品总价',
  freightLabel: '运费',
  codeLabel: '订单编号',
  createdLabel: '下单时间',
  receiverLabel: '收货地址',
  priceSectionTitle: '价格信息',
  orderSectionTitle: '订单信息',
  goodsSectionTitle: '商品信息',
  serviceAction: '联系客服',
  emptyTitle: '暂无订单',
  emptyDesc: '去兑换专区挑一件洗护好物，订单会出现在这里。',
  emptyAction: '去兑换专区',
  missingTitle: '订单不存在',
  missingDesc: '该订单可能已被删除，或链接已经失效。',
  missingAction: '返回订单管理',
} as const

/**
 * 地址与订单链路中「原型未给出规则」的部分，统一在此登记并隔离。
 * 页面只读这里的开关与说明，不自行补写判定逻辑。
 */
export const ADDRESS_ORDER_RULE_STATUS = {
  /** 地址编辑页与行政区划数据 */
  addressEdit: {
    confirmed: false,
    blocker: 'B-027',
    note: '原型 §12 有「编辑」入口但未单独画编辑页，§13 的省市区县-乡镇也未给出行政区划数据源；此处复用 #60 表单结构做回填编辑，候选项取自地址夹具，待产品确认。',
  },
  /** 粘贴识别收件信息 */
  addressPaste: {
    confirmed: false,
    blocker: 'B-028',
    note: '原型 §13 只画出「粘贴识别收件信息」按钮，未定义解析规则、失败提示与剪贴板权限降级；此处保留入口但不实现解析，点按仅提示能力待接入。',
  },
  /** 订单状态全集与流转 */
  orderStatus: {
    confirmed: false,
    blocker: 'B-029',
    note: '原型 §14 只给出四个 Tab 与「已收货」等少量配送状态，待付款、已取消、退款完成等状态及其流转未确认；夹具只覆盖原型出现过的状态，不自行补全。',
  },
  /** 金额与运费规则 */
  orderAmount: {
    confirmed: false,
    blocker: 'B-030',
    note: '原型 §15 只列出商品总价、运费、实付款三个字段，未给运费计算、优惠抵扣与泡泡值抵扣规则；运费按订单夹具声明，实付款只做「总价 + 运费」的算术求和。',
  },
} as const

/* ────────────────────────── T007 搭子与邀请闭环 ────────────────────────── */

/**
 * 搭子成员夹具（摹客 #28）
 * - #28 的四行在原型里是同一个头像 + 同一个「小美」，属于占位重复，不是四个真实搭子；
 *   历史 T07 稿的 4 人 mock（含默契值、等级、最近一起打卡时间）不得进入默认态（B-006）。
 * - 因此这里只保留原型明确出现过的字段：头像 + 昵称。
 */
export interface BuddyFixture {
  id: string
  name: string
}

/** 单搭子（默认有态） */
export const BUDDY_LIST_SINGLE: BuddyFixture[] = [{ id: 'buddy-xiaomei', name: '小美' }]

/**
 * 多搭子：#28 原型画了 4 行，但四行内容完全相同。
 * 为满足任务卡「无搭子 / 单搭子 / 多搭子」三档而保留此夹具，昵称按原型逐字沿用「小美」，
 * 不自行编造第 2–4 个人物、默契值或等级。
 */
export const BUDDY_LIST_MULTI: BuddyFixture[] = [
  { id: 'buddy-xiaomei-1', name: '小美' },
  { id: 'buddy-xiaomei-2', name: '小美' },
  { id: 'buddy-xiaomei-3', name: '小美' },
  { id: 'buddy-xiaomei-4', name: '小美' },
]

/** 搭子空态文案（摹客 #27 逐字照抄，含原型的波浪号与斜杠） */
export const BUDDY_EMPTY_COPY = {
  title: '还没有洗头搭子噢～',
  desc: '快邀请你的室友/同学一起开启变香之旅吧！',
} as const

/** 邀请入口（#27 / #28 共用的两个底部按钮，文案照抄原型） */
export const BUDDY_INVITE_ENTRIES = [
  { key: 'qrcode', label: '二维码邀请', to: '/buddy/invite' },
  { key: 'phone', label: '手机号邀请', to: '/buddy/invite/phone' },
] as const

/** 「搭子功能介绍」说明卡（#27 / #28 同一张卡，三行逐字照抄） */
export const BUDDY_FEATURE_INTRO = {
  title: '搭子功能介绍',
  items: [
    { key: 'checkin', title: '一起打卡', desc: '双人签到得更多泡泡值' },
    { key: 'welfare', title: '互送福利', desc: '优惠券、礼物送给TA' },
    /* ⚠️ 「默契升级」是 #27/#28 说明卡里的原型文案，保留文案本身；
     *    但不因此提供任何 #31 默契值入口或数值（B-006）。 */
    { key: 'mutual', title: '默契升级', desc: '提升搭子等级，解锁奖励' },
  ],
} as const

/** 邀请页文案（#29 / #33 / #34 / #35 / #36 逐字照抄，含原型的「请叫」笔误，不做产品优化） */
export const BUDDY_INVITE_COPY = {
  capsule: '快来成为我的洗头搭子吧～',
  qrHint: '请截图保存',
  qrScanHint: '请在「卡博士APP」中扫码',
  moreShare: '更多分享方式',
  saveLocal: '保存到本地',
  copyLink: '复制链接',
  phoneTitle: '搜索搭子',
  phonePlaceholder: '可搜索输入框',
  phoneResult: '搜索结果',
  phoneSubmit: '发送邀请',
  phoneSuccessCapsule: '发送邀请成功！',
  phoneSuccessDesc: '请叫好友在「通知」当中查收～',
  phoneSuccessAction: '我知道了',
  posterSavedDesc: '已保存到本地，快分享给好友吧！',
  posterAction: '确认',
  linkCopiedToast: '链接复制成功，快去分享给好友吧！',
  acceptCapsule: '小美邀请你成为她的洗头搭子',
  acceptDesc: '成为搭子一起快乐洗头！',
  acceptAction: '接受邀请',
  noAppTitle: '应用商店H5',
} as const

/** 被邀请人落地时的宿主环境：原型 #30 备注区分「未安装 APP」与「已有 APP」两条承接路径 */
export type BuddyHostEnv = 'no-app' | 'has-app'

/** 分享结果分支（成功 + 可复现失败态） */
export type BuddyShareOutcome = 'poster-saved' | 'poster-failed' | 'link-copied' | 'link-failed'

export interface BuddyShareFeedback {
  outcome: BuddyShareOutcome
  ok: boolean
  text: string
}

/**
 * 分享适配层反馈文案
 * - 成功态文案照抄摹客 #34 / #35；
 * - ⚠️ 原型没有画分享失败态（B-005），失败文案为中性系统提示，不含未确认业务规则。
 */
export const BUDDY_SHARE_FEEDBACK: Record<BuddyShareOutcome, BuddyShareFeedback> = {
  'poster-saved': { outcome: 'poster-saved', ok: true, text: BUDDY_INVITE_COPY.posterSavedDesc },
  'poster-failed': { outcome: 'poster-failed', ok: false, text: '海报保存失败，请检查相册权限后重试' },
  'link-copied': { outcome: 'link-copied', ok: true, text: BUDDY_INVITE_COPY.linkCopiedToast },
  'link-failed': { outcome: 'link-failed', ok: false, text: '链接复制失败，请稍后重试' },
}

/** 手机号搜索分支（原型只画了「可邀请」与「成功」，其余为任务卡要求的确定性分支） */
export type BuddySearchOutcome = 'idle' | 'searching' | 'invitable' | 'not-found' | 'invited'

/**
 * 确定性手机号 → 搜索结果映射（禁止随机）
 * 仅用于让「未找到 / 已邀请」两个分支可复现，不构成任何号码校验规则。
 */
export const BUDDY_SEARCH_OUTCOMES: Record<string, BuddySearchOutcome> = {
  '13800000000': 'not-found',
  '13800000001': 'invited',
}

/** 各分支演示号码：供 `?state=` 直达截图时回填输入框，不构成号码规则 */
export const BUDDY_SEARCH_SAMPLE_PHONES: Record<Exclude<BuddySearchOutcome, 'idle' | 'searching'>, string> = {
  invitable: '13900000000',
  'not-found': '13800000000',
  invited: '13800000001',
}

/** 搜索反馈文案：⚠️ 原型未画未找到/已邀请，文案为中性提示 */
export const BUDDY_SEARCH_FEEDBACK: Record<'not-found' | 'invited', string> = {
  'not-found': '没有找到该用户，请核对手机号后重试',
  invited: '已经向该用户发送过邀请，请等待对方确认',
}

/** 判定搜索结果：查确定性映射，未登记的号码统一走「可邀请」 */
export function resolveBuddySearchOutcome(phone: string): BuddySearchOutcome {
  const trimmed = phone.trim()
  if (trimmed.length === 0) return 'idle'
  return BUDDY_SEARCH_OUTCOMES[trimmed] ?? 'invitable'
}

/** 邀请链接：固定值，保证复制结果与截图可复现 */
export const BUDDY_INVITE_LINK = 'https://drcard.example/buddy/accept?from=xiaomei'

/**
 * 搭子与邀请链路中「原型未给出规则」的部分，统一在此登记并隔离。
 * 页面只读这里的开关与说明，不自行补写判定逻辑。
 */
export const BUDDY_RULE_STATUS = {
  /** 搭子数量口径 */
  buddyCount: {
    confirmed: false,
    blocker: 'B-004',
    note: '#28 画了 4 行完全相同的「小美」，未说明搭子数量上限、排序口径与解绑方式；此处只按原型字段（头像 + 昵称）建模，多搭子夹具沿用原型昵称，不编造人物与等级。',
  },
  /** 默契值 */
  mutualValue: {
    confirmed: false,
    blocker: 'B-006',
    note: '#31 默契值明确「先不做」（T014）。#27/#28 说明卡里的「默契升级」只保留原型文案，不提供任何默契值入口、数值或进度视觉；Token 仅预留命名。',
  },
  /** 分享能力 */
  shareCapability: {
    confirmed: false,
    blocker: 'B-005',
    note: '原型只画了保存成功（#34）与复制成功（#35），未画失败态；本仓库不接真实相册、剪贴板、短信与系统分享，统一走分享适配层模拟，失败态仅由 `?state=` 复现。',
  },
  /** 被邀请人承接 */
  inviteeLanding: {
    confirmed: false,
    blocker: 'B-005',
    note: '#30 只有一行「应用商店H5」占位，备注说明未安装走应用商店 H5、已安装弹窗跳转 APP；此处按 WebView 边界页 + 唤起弹窗两态承载，不伪造应用商店视觉。',
  },
} as const

/* ------------------------------------------------------------------ *
 * T021 诗得丽品牌专栏首页：新人体验券
 * ------------------------------------------------------------------ */

export interface NewcomerCoupon {
  id: string
  /** 券名：沿用 EXCHANGE_PRODUCT_FIXTURES 的既有券名口径，不新造券种 */
  name: string
  desc: string
  /** 本次赠送数量：需求 §3.1 要求弹窗直接展示商品内容与数量 */
  quantity: number
  /** 缩略图：仅可取 src/assets/brand 内已有素材，不新增二进制素材 */
  thumb: 'dearseed-kit' | 'shampoo-a' | 'shampoo-b'
}

/**
 * 新人体验券的两种确定性组合。
 * 需求 §3.1 要求「随机呈现 1 张或 2 张」，用户 2026-08-27 定案两者概率 1:1；
 * 但本仓库禁止把随机数作为验收状态来源，因此这里只沉淀两个静态组合，
 * 随机只发生在页面层，且始终可被 `?state=` 覆盖复现。
 */
export const NEWCOMER_COUPON_VARIANTS: Record<'coupon-1' | 'coupon-2', NewcomerCoupon[]> = {
  'coupon-1': [{ id: 'nc1', name: 'DearSeed 洗发水体验券', desc: '限到店核销', quantity: 1, thumb: 'dearseed-kit' }],
  'coupon-2': [
    { id: 'nc1', name: 'DearSeed 洗发水体验券', desc: '限到店核销', quantity: 1, thumb: 'dearseed-kit' },
    { id: 'nc2', name: '洗护组合体验券', desc: '洗发 / 护发 / 沐浴体验，限到店核销', quantity: 1, thumb: 'shampoo-a' },
  ],
}

/** 新人体验券弹窗文案：视觉与交互形式参照已验收的 /dearseed?overlay=reminder */
export const NEWCOMER_COUPON_DIALOG = {
  eyebrow: 'DEAR SEED',
  title: '新人见面礼',
  desc: '欢迎来到诗得丽品牌专栏，以下体验券已为你准备好，确认后即可在洗护体验券专区查看。',
  action: '确定',
} as const

/** 领取成功反馈：确定 → 先出成功态，再进入体验券页面（用户已确认跳转 /exchange） */
export const NEWCOMER_COUPON_SUCCESS = {
  title: '领取成功',
  desc: '体验券已放入你的账户，正在前往洗护体验券专区。',
  action: '查看体验券',
  actionTo: '/exchange',
} as const

/**
 * 新人体验券链路中「原型未给出规则」的部分，统一在此登记并隔离。
 * 页面只读这里的说明，不自行补写判定逻辑。
 */
export const NEWCOMER_COUPON_RULE_STATUS = {
  /** 新用户识别 */
  newUserDetection: {
    confirmed: true,
    blocker: 'B-031',
    note: '用户 2026-08-27 定案「默认全是新用户」：本阶段不做真实识别与持久化，进入 `/` 即弹出新人体验券；关闭后同一次会话内不再复现，取证脚本用 `?newcomer=off` 抑制、用 `?overlay=newcomer-coupon` 重新唤起。跨会话频次与「已领取后再次进入」的服务端口径仍待接口阶段确认。',
  },
  /** 随机发券口径 */
  couponRandomness: {
    confirmed: false,
    blocker: 'B-032',
    note: '用户 2026-08-27 定案 1 张 / 2 张概率 1:1，页面层按 50/50 抽取；券种池、库存与单人发放上限仍未给出，故此处只沉淀两个确定性组合，验收一律用 `?state=` 复现，不做服务端发券。',
  },
  /** 公益板块内容 */
  causeSection: {
    confirmed: false,
    blocker: 'B-033',
    note: '需求 §2.2 只给出「公益板块」的名称与排列顺序，摹客原型无对应 artboard（docs/prototype 全库无「公益」命中）。用户 2026-08-27 定案「暂不实现跳转」，故本板块只做标题 + 一句说明的静态承载，不带入口文案与跳转，不自造公益数据、项目列表与捐赠进度。',
  },
} as const

/**
 * 专栏首页打卡内容之后的两个板块（需求 §2.2 第 6 条、§2.3）。
 * 顺序固定为「公益板块 → 卡博士品牌故事」，随页面正常滚动，不吸底不悬浮。
 * ⚠️ 公益板块无原型视觉（B-033）：用户 2026-08-27 定案暂不实现跳转，
 *    故 `to` 与 `action` 均为 null，页面渲染为不可点击的静态板块；
 *    品牌故事已有目标页 /brand-culture，保留跳转。
 */
export const COLUMN_HOME_SECTIONS = [
  {
    key: 'cause',
    title: '公益板块',
    desc: '每次打卡助力公益，传递温暖',
    action: null,
    to: null,
  },
  {
    key: 'brand-story',
    title: '卡博士品牌故事',
    desc: '了解品牌起源与匠心洗护',
    action: '查看品牌故事',
    to: '/brand-culture',
  },
] as const
