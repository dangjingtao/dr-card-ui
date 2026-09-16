/** 消息分类（T012；reference/通知2.html 的 cat 字段） */
export type NotificationCategory = 'system' | 'activity' | 'balance' | 'event' | 'service'

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
      '如有任何问题,可在「会员中心 · 客服中心」联系我们,工作日 9:00 - 21:00 在线为您服务。',
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
  {
    id: 'n7',
    cat: 'balance',
    title: '余额不足提醒',
    summary: '您的账户余额已低于 5.00 元,为避免影响设备扫码使用,请及时充值。',
    time: '今天 16:42',
    unread: true,
    paragraphs: [
      '您的账户余额已低于 5.00 元,为避免影响设备扫码使用,请及时充值。',
      '点击下方按钮即可跳转充值页面,最低 1 元即可使用。',
    ],
    note: '本条由系统自动推送,每次低于阈值只推送一次。',
  },
  {
    id: 'n8',
    cat: 'event',
    title: '校内活动报名提醒',
    summary: '「校园·诗得丽洗护节」本周六 14:00 开幕,前 100 名报名可领取体验装。',
    time: '今天 11:20',
    unread: true,
    paragraphs: ['「校园·诗得丽洗护节」本周六 14:00 开幕,前 100 名报名可领取体验装。'],
    note: '本通知为校内外活动通知占位,待后台活动模块就绪后启用。',
    cta: { label: '查看活动', to: '/dearseed' },
  },
  {
    id: 'n9',
    cat: 'event',
    title: '校外体验门店上新',
    summary: '「诗得丽·上海·徐汇店」已上线设备扫码 8 折优惠活动,本周内有效。',
    time: '昨天 20:15',
    unread: false,
    paragraphs: ['「诗得丽·上海·徐汇店」已上线设备扫码 8 折优惠活动,本周内有效。'],
    note: '本通知为校内外活动通知占位,待后台活动模块就绪后启用。',
    cta: { label: '查看门店', to: '/dearseed' },
  },
  {
    id: 'n10',
    cat: 'service',
    title: '报修进度更新',
    summary: '您的报修单「淋浴设备-A栋1楼」已派单给维修员,预计 30 分钟内上门。',
    time: '昨天 15:30',
    unread: false,
    paragraphs: ['您的报修单「淋浴设备-A栋1楼」已派单给维修员,预计 30 分钟内上门。'],
    note: '本通知为服务进度通知,可在「会员中心 · 客服中心」查看详情。',
  },
]

export function notificationCategoryLabel(cat: NotificationCategory | string): string {
  if (cat === 'system') return '系统'
  if (cat === 'activity') return '活动'
  if (cat === 'balance') return '余额'
  if (cat === 'event') return '活动'
  if (cat === 'service') return '服务'
  return '通用'
}

export function notificationGroupLabel(time: string): '今天' | '昨天' | '更早' {
  if (/刚刚|分钟前|今天/.test(time)) return '今天'
  if (/昨天/.test(time)) return '昨天'
  return '更早'
}
