/**
 * T050｜会员中心生日字段 3 个月修改限制
 * -------------------------------------------------------------
 * 当前仅保留前端 UI 限制算法；真实场景下应由后端校验 + 持久化，前端只展示限制状态。
 * H003 后该工具不再假定任何 legacy userInfoStore 初始值，调用方必须提供真实或明确的
 * 客户端状态，不能把 Native reference mock 当成正式资料来源。
 *
 * 锚点规则（B-050）：
 * - 以"上次成功保存时间"为锚点，currentTime - lastModifiedAt ≥ 90 天 才允许再次编辑。
 * - 若 lastModifiedAt 为 0 / null / undefined，视为从未修改过 → 直接允许编辑。
 */

export const BIRTHDAY_LOCK_DAYS = 90

export interface BirthdayGateResult {
  /** 是否允许编辑生日 */
  allowed: boolean
  /** 锁定期内，下一次可编辑时间戳（ms）。allowed=true 时 = lastModifiedAt */
  nextEditableAt: number
  /** 距下一次可编辑还剩多少天（向上取整；负数表示已可编辑）。allowed=true 时 = 0 */
  remainingDays: number
}

/**
 * 判断生日字段当前是否可编辑。
 * @param lastModifiedAt 上次成功保存时间戳（ms）；0 / null / undefined 视为从未修改过
 * @param now 当前时间戳（ms），默认 `Date.now()`；注入以便单测
 */
export function canEditBirthday(
  lastModifiedAt: number | null | undefined,
  now: number = Date.now(),
): BirthdayGateResult {
  if (lastModifiedAt == null || lastModifiedAt <= 0) {
    return { allowed: true, nextEditableAt: now, remainingDays: 0 }
  }
  const elapsedDays = Math.floor((now - lastModifiedAt) / (24 * 60 * 60 * 1000))
  if (elapsedDays >= BIRTHDAY_LOCK_DAYS) {
    return { allowed: true, nextEditableAt: lastModifiedAt, remainingDays: 0 }
  }
  const nextEditableAt = lastModifiedAt + BIRTHDAY_LOCK_DAYS * 24 * 60 * 60 * 1000
  return {
    allowed: false,
    nextEditableAt,
    remainingDays: Math.max(1, BIRTHDAY_LOCK_DAYS - elapsedDays),
  }
}

/**
 * 把 nextEditableAt 渲染成中文短文案：
 * - 2026-09-10 → 「9 月 10 日后可再次修改」
 * - 跨年 → 「2027 年 1 月 3 日后可再次修改」
 */
export function formatNextEditableDate(ts: number): string {
  const d = new Date(ts)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const year = d.getFullYear()
  const currentYear = new Date().getFullYear()
  if (year === currentYear) {
    return `${month} 月 ${day} 日后可再次修改`
  }
  return `${year} 年 ${month} 月 ${day} 日后可再次修改`
}
