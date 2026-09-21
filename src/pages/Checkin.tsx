import { useState } from 'react'
import { X } from 'lucide-react'
import CheckinBoard from '../components/mobile/CheckinBoard'
import CheckinMakeupSuccessOverlay from '../components/mobile/CheckinMakeupSuccessOverlay'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button } from '../components/ui'
import {
  useFixtureDebug,
  useFixtureQueryControls,
  useFixtureState,
  useOverlay,
} from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import { CHECKIN_REMINDER } from '../app/fixtures'
import checkinRitualHero from '../assets/brand/bubble/checkin-ritual-hero-v2.webp'
import { NativeBridgeError, showRewardAd, type NativeRewardAdStatus } from '../services/nativeBridge'

/**
 * 打卡日历（#21）/ 打卡成功（#8）/ 打卡提示弹窗（#4）/ 补打卡成功弹窗（#22）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/02-membership-and-checkin.md §4 §5 §6 §7
 * 已确认：顶部「今日已签到」+ 当前周期连续签到天数；当月月历（已签到 ✅、漏签显示「补签」）；
 *        活动周期 2026.06.01 - 2026.06.30；连续签到奖励；
 *        底部「为你精选」洗护兑换商品；补签 → 补打卡成功弹窗；推荐商品 → 洗护兑换专区。
 * ⚠️ 未决规则继续隔离在 fixtures 的 CHECKIN_RULE_STATUS（B-019 月份切换 / B-020 补签消耗与
 *    不可补签判定）；H033 已用 Native 激励广告协议替代旧 B-021 演示倒计时。
 * 可复现状态：?state=success；?overlay=reminder / make-up-success
 * 2026-08-28：诗得丽首页改为紧凑 7 日入口；本签到内页继续保留金色 Hero，并恢复完整 30 天月历与补签入口。
 */
export default function Checkin() {
  const route = findRouteByPathname('/checkin')
  const { state } = useFixtureState(route)
  const { patch: patchFixtureState } = useFixtureQueryControls()
  const { overlay, open, close } = useOverlay()

  const isSuccess = state?.key === 'success'
  const debug = useFixtureDebug()

  const [rewardAdPending, setRewardAdPending] = useState(false)
  const [rewardAdMessage, setRewardAdMessage] = useState<string | null>(null)

  const describeRewardAdStatus = (status: Exclude<NativeRewardAdStatus, 'completed'>) => {
    if (status === 'closed') return '广告未完整观看，补签未完成'
    if (status === 'no_fill') return '暂无可用广告，请稍后再试'
    return '广告播放失败，请重试'
  }

  /* H033｜补签资格只接受 Native 激励广告 completed。
   * Native 自己承载广告 UI；H5 不再使用 5 秒 Demo 倒计时作为奖励完成信号。
   */
  const handleMakeupWithAd = async () => {
    if (rewardAdPending) return

    setRewardAdPending(true)
    setRewardAdMessage(null)

    try {
      const result = await showRewardAd({ scene: 'h5CheckinResign' })
      if (result.status === 'completed') {
        open('make-up-success')
        return
      }

      setRewardAdMessage(describeRewardAdStatus(result.status))
    } catch (error) {
      if (
        error instanceof NativeBridgeError &&
        ['bridge-disabled', 'bridge-unsupported', 'capability-unsupported'].includes(error.code)
      ) {
        setRewardAdMessage('当前 App 版本暂不支持激励广告补签')
      } else {
        setRewardAdMessage('广告调用失败，请重试')
      }
    } finally {
      setRewardAdPending(false)
    }
  }

  return (
    <PageContainer className="pb-24 pt-2" inset={false}>
      <CheckinBoard
        mode="full"
        isSuccess={isSuccess}
        onMakeup={() => void handleMakeupWithAd()}
        debug={debug}
      />

      {(rewardAdPending || rewardAdMessage) && (
        <p
          role={rewardAdMessage ? 'alert' : 'status'}
          aria-live="polite"
          className="mx-4 mt-3 rounded-control bg-surface-subtle px-3 py-2 text-center text-xs text-text-secondary"
        >
          {rewardAdPending ? '正在打开激励广告…' : rewardAdMessage}
        </p>
      )}

      <PromptOverlay open={overlay === 'reminder'} label="每日打卡提示" onDismiss={close} className="overflow-hidden rounded-feature bg-surface px-6 pb-6 pt-5 text-center shadow-modal">
        <button type="button" aria-label="关闭打卡提示" onClick={() => close()} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-pressed"><X className="h-5 w-5" aria-hidden /></button>
        <img src={checkinRitualHero} alt="" aria-hidden className="mx-auto h-32 w-32 object-contain" />
        <h2 className="mt-1 text-xl font-bold text-text-primary">{CHECKIN_REMINDER.title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">TIPS：{CHECKIN_REMINDER.tips}</p>
        <Button
          className="mt-5 w-full rounded-pill"
          size="large"
          onClick={() => patchFixtureState({ state: 'success', overlay: null })}
        >
          {CHECKIN_REMINDER.action}
        </Button>
      </PromptOverlay>

      <CheckinMakeupSuccessOverlay open={overlay === 'make-up-success'} onDismiss={() => close()} debug={debug} />

      <DebugPanel route={route} />
    </PageContainer>
  )
}
