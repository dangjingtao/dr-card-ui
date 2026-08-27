import { useNavigate, useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import CheckinBoard from '../components/mobile/CheckinBoard'
import CheckinMakeupSuccessOverlay from '../components/mobile/CheckinMakeupSuccessOverlay'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button } from '../components/ui'
import { useFixtureState, useOverlay } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import { CHECKIN_REMINDER } from '../app/fixtures'
import checkinRitualHero from '../assets/brand/bubble/checkin-ritual-hero-v2.webp'

/**
 * 打卡日历（#21）/ 打卡成功（#8）/ 打卡提示弹窗（#4）/ 补打卡成功弹窗（#22）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/02-membership-and-checkin.md §4 §5 §6 §7
 * 已确认：顶部「今日已签到」+ 当前周期连续签到天数；当月月历（已签到 ✅、漏签显示「补签」）；
 *        活动周期 2026.06.01 - 2026.06.30；连续签到奖励（连续 3 天获得 10 泡泡值）；
 *        底部「为你精选」洗护兑换商品；补签 → 补打卡成功弹窗；推荐商品 → 洗护兑换专区。
 * ⚠️ 与 reference 的差异：历史稿 D-007 为「每日签到领福利」7 天签到条式 + 任务列表，
 *    与原型的月历式打卡日历不一致，故按原型口径重做，不照搬历史稿的任务模块与配色。
 * ⚠️ 未决规则一律隔离在 fixtures 的 CHECKIN_RULE_STATUS（B-019 月份切换 / B-020 补签消耗与
 *    不可补签判定 / B-021 弹窗广告位与倒计时），页面不自持规则常量。
 * 可复现状态：?state=success；?overlay=reminder / make-up-success
 * T021 起打卡业务内容抽取为 CheckinBoard，与诗得丽品牌专栏首页 `/` 共用同一实现；
 * 本页只保留自己的页面外壳与两个自持弹窗，视觉口径不变（hero 顶距由 PageContainer 的 pt-2 提供）。
 */
export default function Checkin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const route = findRouteByPathname('/checkin')
  const { state } = useFixtureState(route)
  const { overlay, open, close } = useOverlay()

  const isSuccess = state?.key === 'success'
  const debug = searchParams.get('debug') === '1'

  return (
    <PageContainer className="pb-24 pt-2" inset={false}>
      <CheckinBoard isSuccess={isSuccess} onMakeup={() => open('make-up-success')} debug={debug} />

      <PromptOverlay open={overlay === 'reminder'} label="每日打卡提示" onDismiss={close} className="overflow-hidden rounded-feature bg-surface px-6 pb-6 pt-5 text-center shadow-modal">
        <button type="button" aria-label="关闭打卡提示" onClick={close} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-pressed"><X className="h-5 w-5" aria-hidden /></button>
        <img src={checkinRitualHero} alt="" aria-hidden className="mx-auto h-32 w-32 object-contain" />
        <h2 className="mt-1 text-xl font-bold text-text-primary">{CHECKIN_REMINDER.title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">TIPS：{CHECKIN_REMINDER.tips}</p>
        <Button className="mt-5 w-full rounded-pill" size="large" onClick={() => { close(); navigate('/checkin?state=success') }}>{CHECKIN_REMINDER.action}</Button>
      </PromptOverlay>

      <CheckinMakeupSuccessOverlay open={overlay === 'make-up-success'} onDismiss={close} debug={debug} />

      <DebugPanel route={route} />
    </PageContainer>
  )
}
