import { useNavigate, useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { findRouteByPathname } from '../app/router/routes'
import { LUCK_REWARD_BUBBLE, LUCK_RULE_STATUS, resolveLuck } from '../app/fixtures'

/**
 * 抽取成功（#41）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/02-membership-and-checkin.md §9
 * 已确认：结果为「恭喜你获得 50🫧」；关闭后回到会员中心。
 * ⚠️ B-003 未决（隔离处理）：
 *    - 大吉/中吉/小吉三档、「再抽一次」重抽、结果当天持久化，全部来自历史稿倾向，未确认；
 *    - 默认视图只呈现摹客确认的泡泡值奖励，不出现档位名称，也不提供重抽按钮；
 *    - 三档仅在显式 `?state=great|good|minor` 夹具参数下作为隔离演示出现，并强制带未定稿标识；
 *    - 隔离期内页面不写入任何抽签概率、次数或冷却规则。
 */
export default function DrawSuccess() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/luck/result')
  const [searchParams] = useSearchParams()

  /** 只有显式给出 `?state=` 才进入隔离演示；默认走摹客已确认的结果表达 */
  const requested = searchParams.get('state')
  const isolated = requested != null && ['great', 'good', 'minor'].includes(requested)
  const luck = isolated ? resolveLuck(requested) : null

  const backToMembership = () => navigate('/membership')

  return (
    <PageContainer className="flex min-h-full flex-col pb-24">
      <div className="flex justify-end pt-2">
        <button
          type="button"
          aria-label="关闭"
          onClick={backToMembership}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle text-text-secondary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-2 pb-6 text-center">
        <span
          className="flex h-[168px] w-[168px] items-center justify-center rounded-full bg-luck-surface"
          aria-hidden
        >
          <span
            className="flex h-[128px] w-[128px] flex-col items-center justify-center rounded-full text-luck-text-on"
            style={{ background: isolated ? luck!.gradient : 'var(--gradient-bubble)' }}
          >
            {isolated ? (
              <span className="text-2xl font-semibold">{luck!.name}</span>
            ) : (
              <span className="text-3xl font-semibold">🫧</span>
            )}
          </span>
        </span>

        {/* 摹客 §9 唯一确认的结果文案 */}
        <h1 className="mt-7 text-xl font-semibold text-text-primary">
          恭喜你获得 {LUCK_REWARD_BUBBLE}🫧
        </h1>

        {isolated && (
          <div className="mt-4 w-full max-w-[300px] rounded-container bg-surface-subtle px-4 py-3 text-left">
            <p className="text-xs font-medium text-text-secondary">隔离演示 · 未定稿（{LUCK_RULE_STATUS.blocker}）</p>
            <p className="mt-1 text-xs leading-5 text-text-tertiary">{LUCK_RULE_STATUS.isolatedNote}</p>
          </div>
        )}

        <button
          type="button"
          onClick={backToMembership}
          className="mt-8 h-12 w-full max-w-[280px] rounded-full bg-primary text-base font-medium text-text-inverse active:bg-primary-pressed"
        >
          返回会员中心
        </button>
      </div>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
