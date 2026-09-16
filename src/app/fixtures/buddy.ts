export interface BuddyFixture { id: string; name: string }

export const BUDDY_LIST_SINGLE: BuddyFixture[] = [{ id: 'buddy-xiaomei', name: '小美' }]
export const BUDDY_LIST_MULTI: BuddyFixture[] = [
  { id: 'buddy-xiaomei-1', name: '小美' },
  { id: 'buddy-xiaomei-2', name: '小美' },
  { id: 'buddy-xiaomei-3', name: '小美' },
  { id: 'buddy-xiaomei-4', name: '小美' },
]

export const BUDDY_EMPTY_COPY = { title: '还没有洗头搭子噢～', desc: '快邀请你的室友/同学一起开启变香之旅吧！' } as const

export const BUDDY_INVITE_ENTRIES = [
  { key: 'qrcode', label: '二维码邀请', to: '/buddy/invite' },
  { key: 'phone', label: '手机号邀请', to: '/buddy/invite/phone' },
] as const

export const BUDDY_FEATURE_INTRO = {
  title: '搭子功能介绍',
  items: [
    { key: 'checkin', title: '一起打卡', desc: '双人签到得更多泡泡值' },
    { key: 'welfare', title: '互送福利', desc: '优惠券、礼物送给TA' },
    { key: 'mutual', title: '默契升级', desc: '提升搭子等级，解锁奖励' },
  ],
} as const

export const BUDDY_INVITE_COPY = {
  capsule: '快来成为我的洗头搭子吧～', qrHint: '请截图保存', qrScanHint: '请在「卡博士APP」中扫码', moreShare: '更多分享方式',
  saveLocal: '保存到本地', copyLink: '复制链接', phoneTitle: '搜索搭子', phonePlaceholder: '可搜索输入框', phoneResult: '搜索结果', phoneSubmit: '发送邀请',
  phoneSuccessCapsule: '发送邀请成功！', phoneSuccessDesc: '请叫好友在「通知」当中查收～', phoneSuccessAction: '我知道了',
  posterSavedDesc: '已保存到本地，快分享给好友吧！', posterAction: '确认', linkCopiedToast: '链接复制成功，快去分享给好友吧！',
  acceptCapsule: '小美邀请你成为她的洗头搭子', acceptDesc: '成为搭子一起快乐洗头！', acceptAction: '接受邀请', noAppTitle: '应用商店H5',
} as const

export type BuddyHostEnv = 'no-app' | 'has-app'
export type BuddyShareOutcome = 'poster-saved' | 'poster-failed' | 'link-copied' | 'link-failed'
export interface BuddyShareFeedback { outcome: BuddyShareOutcome; ok: boolean; text: string }

export const BUDDY_SHARE_FEEDBACK: Record<BuddyShareOutcome, BuddyShareFeedback> = {
  'poster-saved': { outcome: 'poster-saved', ok: true, text: BUDDY_INVITE_COPY.posterSavedDesc },
  'poster-failed': { outcome: 'poster-failed', ok: false, text: '海报保存失败，请检查相册权限后重试' },
  'link-copied': { outcome: 'link-copied', ok: true, text: BUDDY_INVITE_COPY.linkCopiedToast },
  'link-failed': { outcome: 'link-failed', ok: false, text: '链接复制失败，请稍后重试' },
}

export type BuddySearchOutcome = 'idle' | 'searching' | 'invitable' | 'not-found' | 'invited'
export const BUDDY_SEARCH_OUTCOMES: Record<string, BuddySearchOutcome> = {
  '13800000000': 'not-found',
  '13800000001': 'invited',
}
export const BUDDY_SEARCH_SAMPLE_PHONES: Record<Exclude<BuddySearchOutcome, 'idle' | 'searching'>, string> = {
  invitable: '13900000000', 'not-found': '13800000000', invited: '13800000001',
}
export const BUDDY_SEARCH_FEEDBACK: Record<'not-found' | 'invited', string> = {
  'not-found': '没有找到该用户，请核对手机号后重试',
  invited: '已经向该用户发送过邀请，请等待对方确认',
}

export function resolveBuddySearchOutcome(phone: string): BuddySearchOutcome {
  const trimmed = phone.trim()
  if (trimmed.length === 0) return 'idle'
  return BUDDY_SEARCH_OUTCOMES[trimmed] ?? 'invitable'
}

export const BUDDY_INVITE_LINK = 'https://drcard.example/buddy/accept?from=xiaomei'

export const BUDDY_RULE_STATUS = {
  buddyCount: { confirmed: false, blocker: 'B-004', note: '#28 画了 4 行完全相同的「小美」，未说明搭子数量上限、排序口径与解绑方式；此处只按原型字段（头像 + 昵称）建模，多搭子夹具沿用原型昵称，不编造人物与等级。' },
  mutualValue: { confirmed: false, blocker: 'B-006', note: '#31 默契值明确「先不做」（T014）。#27/#28 说明卡里的「默契升级」只保留原型文案，不提供任何默契值入口、数值或进度视觉；Token 仅预留命名。' },
  shareCapability: { confirmed: false, blocker: 'B-005', note: '原型只画了保存成功（#34）与复制成功（#35），未画失败态；本仓库不接真实相册、剪贴板、短信与系统分享，统一走分享适配层模拟，失败态仅由 `?state=` 复现。' },
  inviteeLanding: { confirmed: false, blocker: 'B-005', note: '#30 只有一行「应用商店H5」占位，备注说明未安装走应用商店 H5、已安装弹窗跳转 APP；此处按 WebView 边界页 + 唤起弹窗两态承载，不伪造应用商店视觉。' },
} as const
