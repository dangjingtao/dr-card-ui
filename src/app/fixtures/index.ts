/**
 * Stable fixture barrel.
 *
 * H005 将历史 86KB 单文件按业务域拆开；现有页面继续从 `app/fixtures` 导入，
 * 避免纯目录治理制造无价值的页面 import churn。
 *
 * 新代码应把 fixture 放进所属域文件，不再向本文件追加业务数据或 resolver。
 */
export * from './dearseed'
export * from './membership'
export * from './cards'
export * from './cardUse'
export * from './notifications'
export * from './support'
export * from './exchange'
export * from './addressOrders'
export * from './buddy'
