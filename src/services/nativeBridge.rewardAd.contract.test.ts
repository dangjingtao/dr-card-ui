import { afterEach, describe, expect, it, vi } from 'vitest'

import { showRewardAd } from './nativeBridge'
import type { NativeTransportWindow } from './nativeBridgeTransport'

/**
 * H037 verifies the current Android envelope while retaining migration compatibility with the
 * earlier status-based H5 target contract. Native owns the completed-view judgment; H5 maps the
 * final Native code to a stable business status and does not recalculate SDK timing.
 */
const hostWindow = window as NativeTransportWindow

interface CapturedRequest {
  scene?: unknown
  callbackId?: unknown
}

afterEach(() => {
  vi.useRealTimers()
  delete hostWindow.androidBridge
  delete hostWindow.androidBridgeCallback
})

describe('showRewardAd Android documented contract', () => {
  it('sends scene + callbackId and keeps current Native code authoritative', async () => {
    let captured: CapturedRequest | undefined

    hostWindow.androidBridge = {
      showRewardAd(payload: unknown) {
        captured = JSON.parse(payload as string) as CapturedRequest
        // 复刻文档中的 Android 回调：code 0 + message ok + data.status
        hostWindow.androidBridgeCallback?.(captured.callbackId as string, {
          code: 0,
          message: 'ok',
          data: { scene: 'h5CheckinResign', status: 'completed' },
        })
      },
    }

    await expect(showRewardAd({ scene: 'h5CheckinResign' })).resolves.toEqual({ status: 'completed' })

    expect(captured?.scene).toBe('h5CheckinResign')
    expect(typeof captured?.callbackId).toBe('string')
    // 文档示例为 "showRewardAd-xxx"，实现按 methodName 前缀生成。
    expect(String(captured?.callbackId)).toMatch(/^showRewardAd-/)
  })

  it.each([
    [0, 1, 1, 'completed'],
    [1, 1, 2, 'closed'],
    [5, 2, 2, 'failed'],
    [6, 2, 2, 'failed'],
    [7, 2, 2, 'no_fill'],
  ] as const)(
    'maps current Native code %s (load=%s, finish=%s) to %s',
    async (code, adLoadState, finishPlayState, status) => {
      hostWindow.androidBridge = {
        showRewardAd(payload: unknown) {
          const { callbackId } = JSON.parse(payload as string) as CapturedRequest
          hostWindow.androidBridgeCallback?.(callbackId as string, {
            code,
            message: code === 0 ? 'ok' : code === 1 ? 'cancel' : code === 7 ? 'no_fill' : 'fail',
            data: {
              scene: 'h5CheckinResign',
              adLoadState,
              finishPlayState,
            },
          })
        },
      }

      await expect(showRewardAd({ scene: 'h5CheckinResign' })).resolves.toEqual({ status })
    },
  )

  it.each(['closed', 'failed', 'no_fill'] as const)(
    'keeps legacy status %s compatible when numeric code is absent',
    async (status) => {
      hostWindow.androidBridge = {
        showRewardAd(payload: unknown) {
          const { callbackId } = JSON.parse(payload as string) as CapturedRequest
          hostWindow.androidBridgeCallback?.(callbackId as string, {
            status,
          })
        },
      }

      await expect(showRewardAd({ scene: 'h5CheckinResign' })).resolves.toEqual({ status })
    },
  )

  it('does not let legacy status override the current Native result code', async () => {
    hostWindow.androidBridge = {
      showRewardAd(payload: unknown) {
        const { callbackId } = JSON.parse(payload as string) as CapturedRequest
        hostWindow.androidBridgeCallback?.(callbackId as string, {
          code: 1,
          message: 'cancel',
          data: {
            scene: 'h5CheckinResign',
            status: 'completed',
          },
        })
      },
    }

    await expect(showRewardAd({ scene: 'h5CheckinResign' })).resolves.toEqual({
      status: 'closed',
    })
  })

  it('rejects an unknown status instead of inventing an ad result', async () => {
    hostWindow.androidBridge = {
      showRewardAd(payload: unknown) {
        const { callbackId } = JSON.parse(payload as string) as CapturedRequest
        hostWindow.androidBridgeCallback?.(callbackId as string, {
          status: 'unknown-status',
        })
      },
    }

    await expect(showRewardAd({ scene: 'h5CheckinResign' })).rejects.toMatchObject({
      name: 'NativeBridgeError',
    })
  })

  /**
   * 用户确认：`showRewardAd` **会**返回 Native 通用失败 envelope `{"error":"..."}`。
   * 因此 Checkin 的失败分级必须建立在「真实边界产出的 code」上，而不是推理出来的。
   * 这两条用例证明边界确实把 `cancel / permission_denied` 映射成了对应 code。
   */
  it.each([
    ['cancel', 'native-cancelled'],
    ['permission_denied', 'native-permission-denied'],
  ] as const)('maps Native error envelope %s to %s across the real boundary', async (error, code) => {
    hostWindow.androidBridge = {
      showRewardAd(payload: unknown) {
        const { callbackId } = JSON.parse(payload as string) as CapturedRequest
        hostWindow.androidBridgeCallback?.(callbackId as string, JSON.stringify({ error }))
      },
    }

    await expect(showRewardAd({ scene: 'h5CheckinResign' })).rejects.toMatchObject({
      name: 'NativeBridgeError',
      code,
      capability: 'showRewardAd',
    })
  })

  /**
   * 回归防护：激励广告是用户交互型长任务，Native 通常要十几秒才回调 completed。
   * 历史 bug：showRewardAd 未显式传 timeoutMs，吃到了 runtime 层 5 秒默认超时，
   * 用户还在看广告就已被判 invocation-timeout，真正回调到达时 pending 已被清理而丢弃。
   *
   * 上面的用例假 Native 都是「同步立刻回调」，5 秒超时永远不会触发，所以拦不住这个 bug。
   * 这里用 fake timers 模拟「明显晚于 5 秒」的迟到回调，断言 Promise 仍以 completed 落地。
   */
  it('resolves completed when Native callbacks well after the old 5s default timeout', async () => {
    vi.useFakeTimers()

    let callbackId: string | undefined
    hostWindow.androidBridge = {
      showRewardAd(payload: unknown) {
        // 只记住 callbackId，故意不同步回调，模拟用户在看广告。
        callbackId = (JSON.parse(payload as string) as CapturedRequest)
          .callbackId as string
      },
    }

    const promise = showRewardAd({ scene: 'h5CheckinResign' })
    // 先挂一个 rejection 兜底，避免断言前出现 unhandled rejection。
    promise.catch(() => undefined)

    // 推进到旧默认超时值：绝不应该 reject。
    await vi.advanceTimersByTimeAsync(5_000)

    // 再推进到 10 秒（超过旧的 5 秒默认值），Promise 仍应保持 pending。
    await vi.advanceTimersByTimeAsync(5_000)
    let settled = false
    promise.then(
      () => {
        settled = true
      },
      () => {
        settled = true
      },
    )
    await Promise.resolve()
    expect(settled).toBe(false)

    // 在延长后的超时值以内，Native 迟到回调 completed。
    await vi.advanceTimersByTimeAsync(5_000)
    expect(callbackId).toMatch(/^showRewardAd-/)
    hostWindow.androidBridgeCallback?.(callbackId as string, {
      code: 0,
      message: 'ok',
      data: {
        scene: 'h5CheckinResign',
        adLoadState: 1,
        finishPlayState: 1,
      },
    })

    await expect(promise).resolves.toEqual({ status: 'completed' })
  })
})
