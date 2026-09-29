export type ExchangeCategory = 'all' | 'shampoo' | 'conditioner' | 'scalp-care'

/**
 * 兑换专区历史分类 UI。
 *
 * 2026-09-29 边界修正：
 * - 这些 key/label 只描述 H5 已保留的页面结构；
 * - 后端是否提供 category_id / 服务端分类过滤仍待确认；
 * - 不在前端预设 2/3/4 等后端主键，也不把 UI 分类反推成接口契约。
 */
export const EXCHANGE_CATEGORIES: Array<{
  key: ExchangeCategory
  label: string
}> = [
  { key: 'all', label: '全部' },
  { key: 'shampoo', label: '洗发体验' },
  { key: 'conditioner', label: '护发体验' },
  { key: 'scalp-care', label: '头皮护理' },
]

export function resolveExchangeCategory(raw: string | null): ExchangeCategory {
  return EXCHANGE_CATEGORIES.some((item) => item.key === raw) ? raw as ExchangeCategory : 'all'
}

export const EXCHANGE_COPY = {
  balanceLabel: '泡泡值余额',
  costUnit: '泡泡值',
  redeemedPrefix: '兑换量',
  quantity: 'x1',
  action: '立即兑换',
  soldOut: '已兑完',
  insufficient: '泡泡值不足',
  submitting: '兑换中',
  emptyTitle: '没有找到相关体验券',
  emptyDesc: '当前暂无可展示的体验装。',
  emptyAction: '查看全部',
  errorTitle: '体验券加载失败',
  retryAction: '重新加载',
  successTitle: '兑换成功，卡券已经存入你的卡包啦～',
  successAction: '查看我的卡包',
  successClose: '关闭',
} as const

export const EXCHANGE_RULE_STATUS = {
  pointsSortDirection: {
    confirmed: false,
    blocker: 'B-024',
    note: '原型 §1/§2 只写「泡泡值」这一维度，未标注升序或降序；当前真实页面未启用排序能力。',
  },
  catalog: {
    confirmed: false,
    blocker: 'B-025',
    note: '当前真实业务只有“通用体验包”；历史多体验装页面结构保留，但不据此预设后端 SKU 或分类体系。',
  },
  settlement: {
    confirmed: false,
    blocker: 'B-026',
    note: '原型 §3/§4 只画到「立即兑换 → 存入卡包」，泡泡值扣减时机、失败回滚与卡包写入均为服务端规则；本页不做持久化扣减，卡包列表不随兑换变化。',
  },
} as const
