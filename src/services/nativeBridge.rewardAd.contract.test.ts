import { afterEach, describe, expect, it } from 'vitest'

import { showRewardAd } from './nativeBridge'
import type { NativeTransportWindow } from './nativeBridgeTransport'

/**
 * 按 Native 团队给出的 Android 契约回放真实 payload（逐字对照）：
 *
 * 调用：window.androidBridge.showRewardAd(JSON.stringify({
 *   scene: "h5CheckinResign", callbackId: "showRewardAd-xxx"
 * }))
 * 回调：window.androidBridgeCallback("showRewardAd-xxx", {
 *   code: 0, message: "ok",
 *   data: { scene: "h5CheckinResign", status: "completed" }
 * })
 *
 * 本文件验证 H5 侧发送的入参形状与回调解析（含 code:0 + 嵌套 data.status），
 * 确保文档里的契约在 H5 这一端没有被误读。
 */
const hostWindow = window as NativeTransportWindow

interface CapturedRequest {
  scene?: unknown
  callbackId?: unknown
}

afterEach(() => {
  delete hostWindow.androidBridge
  delete hostWindow.androidBridgeCallback
})

describe('showRewardAd Android documented contract', () => {
  it('sends scene + callbackId and resolves completed from code/data.status', async () => {
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

  it.each(['closed', 'failed', 'no_fill'] as const)(
    'surfaces %s as an ad business status (not an invocation error)',
    async (status) => {
      hostWindow.androidBridge = {
        showRewardAd(payload: unknown) {
          const { callbackId } = JSON.parse(payload as string) as CapturedRequest
          hostWindow.androidBridgeCallback?.(callbackId as string, {
            code: 0,
            message: 'ok',
            data: { scene: 'h5CheckinResign', status },
          })
        },
      }

      await expect(showRewardAd({ scene: 'h5CheckinResign' })).resolves.toEqual({ status })
    },
  )

  it('rejects an unknown status instead of inventing an ad result', async () => {
    hostWindow.androidBridge = {
      showRewardAd(payload: unknown) {
        const { callbackId } = JSON.parse(payload as string) as CapturedRequest
        hostWindow.androidBridgeCallback?.(callbackId as string, {
          code: 0,
          message: 'ok',
          data: { scene: 'h5CheckinResign', status: 'unknown-status' },
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
})
