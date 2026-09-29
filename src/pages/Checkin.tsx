import { useCallback, useState } from 'react'
import { X } from 'lucide-react'
import CheckinBoard from './checkin/components/CheckinBoard'
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
import { useCheckinActions, useSignRecords, useSignStatus } from './checkin/useCheckinFeed'
import { NativeBridgeError, showRewardAd, type NativeRewardAdStatus } from '../services/nativeBridge'
import checkinRitualHero from '../assets/brand/bubble/checkin-ritual-hero-v2.webp'

/**
 * 打卡日历（#21）/ 打卡成功（#8）/ 打卡提示弹窗（#4）/ 补打卡成功弹窗（#22）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/02-membership-and-checkin.md §4 §5 §6 §7
 *
 * 2026-09-28 真实接口接入（feat/0928，7002 实测）：
 * - 今日状态：`GET /api/signrecords/status`
 * - 打卡日历：`GET /api/signrecords/index`（只有正常签到按记录 local 日期归属；补签目标日期由会话内请求值暂存）
 * - 签到：`POST /api/signrecords/add`
 * - 补签：**先看完 Native 激励广告（`showRewardAd` → status=completed），再发起
 *   `POST /api/signrecords/makeup { day: 'YYYY-MM-DD' }`**（2026-09-28 用户确认）。
 * 月份与「今天」按本地系统时间渲染。
 *
 * ⚠️ 仍未决（不自行定稿，保留隔离）：B-019 月份切换范围；B-020 补签消耗、次数上限与
 * 不可补签判定；且接口未回显补签对应的具体日期，补签格为会话内乐观点亮。
 * 可复现状态：?state=success；?overlay=reminder / make-up-success
 */
export default function Checkin() {
  const route = findRouteByPathname('/checkin')
  const { state } = useFixtureState(route)
  const { patch: patchFixtureState } = useFixtureQueryControls()
  const { overlay, open, close } = useOverlay()

  const isSuccess = state?.key === 'success'
  const debug = useFixtureDebug()

  // 接口数据：今日状态 + 签到记录（打卡日历依据）。mock 与 api 走同一 service。
  const signStatus = useSignStatus()
  const signRecords = useSignRecords()

  const [optimisticMakeupDays, setOptimisticMakeupDays] = useState<string[]>([])
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [rewardAdPending, setRewardAdPending] = useState(false)

  const reloadRecords = signRecords.reload
  const reloadStatus = signStatus.reload

  const handleActionSuccess = useCallback(
    (kind: 'sign-in' | 'makeup', day?: string) => {
      if (kind === 'makeup' && day) {
        // 接口不回显被补日期，先做会话内乐观点亮，再刷新真实记录。
        setOptimisticMakeupDays((prev) => (prev.includes(day) ? prev : [...prev, day]))
        open('make-up-success')
      }
      reloadStatus()
      reloadRecords()
    },
    [open, reloadRecords, reloadStatus],
  )

  const actions = useCheckinActions(handleActionSuccess)

  const handleSignIn = async () => {
    setActionMessage(null)
    await actions.signIn()
  }

  const describeRewardAdStatus = (status: Exclude<NativeRewardAdStatus, 'completed'>) => {
    if (status === 'closed') return '广告未完整观看，补签未完成'
    if (status === 'no_fill') return '下次再来吧'
    return '广告播放失败，请重试'
  }

  /**
   * Native 失败分级文案（契约来源：native-bridge-v2-contract.md §1.1）。
   *
   * 通用失败 envelope `cancel / permission_denied / fail` 会映射为
   * `native-cancelled / native-permission-denied / native-failed`，与「能力不支持」不是一回事：
   * 用户主动取消不该被报成系统故障，权限拒绝也应给出可操作提示。
   */
  const describeRewardAdError = (error: unknown) => {
    if (error instanceof NativeBridgeError) {
      if (['bridge-disabled', 'bridge-unsupported', 'capability-unsupported'].includes(error.code)) {
        return '当前 App 版本暂不支持激励广告补签'
      }
      if (error.code === 'native-cancelled') return '广告未完整观看，补签未完成'
      if (error.code === 'native-permission-denied') return '需要广告权限，请检查系统设置后重试'
    }
    return '广告调用失败，请重试'
  }

  /**
   * 补签：**先看完 Native 激励广告，再发起补签请求**（2026-09-28 用户确认）。
   * 只有 `status === 'completed'` 才调用 `POST /api/signrecords/makeup`；
   * closed / failed / no_fill 不落库、不亮格。Native 自己承载广告 UI。
   */
  const handleMakeupDay = async (dateKey: string) => {
    if (rewardAdPending || actions.pending !== null) return

    setActionMessage(null)
    setRewardAdPending(true)

    try {
      const result = await showRewardAd({ scene: 'h5CheckinResign' })
      if (result.status !== 'completed') {
        setActionMessage(describeRewardAdStatus(result.status))
        return
      }
    } catch (error) {
      setActionMessage(describeRewardAdError(error))
      return
    } finally {
      setRewardAdPending(false)
    }

    // 广告完整看完后才真正发起补签。
    await actions.makeup(dateKey)
  }

  const signStatusView =
    signStatus.remote.state === 'success'
      ? {
          signed: signStatus.remote.data.signed,
          consecutiveDays: signStatus.remote.data.consecutive_days,
          points: signStatus.remote.data.points,
          rewardDesc: signStatus.remote.data.reward_desc ?? '',
        }
      : null

  const records = signRecords.remote.state === 'success' ? signRecords.remote.data : null

  const feedback = actions.error ?? actionMessage

  return (
    <PageContainer className="pb-24 pt-2" inset={false}>
      <CheckinBoard
        mode="full"
        isSuccess={isSuccess}
        signStatus={signStatusView}
        records={records}
        optimisticMakeupDays={optimisticMakeupDays}
        onMakeupDay={(dateKey) => void handleMakeupDay(dateKey)}
        onSignIn={() => void handleSignIn()}
        actionPending={actions.pending !== null || rewardAdPending}
        debug={debug}
      />

      {(actions.pending !== null || rewardAdPending) && (
        <p role="status" aria-live="polite" className="mx-4 mt-3 rounded-control bg-surface-subtle px-3 py-2 text-center text-xs text-text-secondary">
          {rewardAdPending ? '正在打开激励广告…' : actions.pending === 'sign-in' ? '正在签到…' : '正在补签…'}
        </p>
      )}

      {feedback && (
        <p role="alert" aria-live="polite" className="mx-4 mt-3 rounded-control bg-surface-subtle px-3 py-2 text-center text-xs text-danger-text">
          {feedback}
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
