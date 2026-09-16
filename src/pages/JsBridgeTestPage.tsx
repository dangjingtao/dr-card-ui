import { useEffect, useMemo, useState } from 'react'

type OsType = 'iOS' | 'android' | 'web'
type LogLevel = 'call' | 'result' | 'callback' | 'error'

type LogItem = {
  id: number
  time: string
  level: LogLevel
  message: string
}

type AndroidBridge = Record<string, (...args: string[]) => unknown>
type IOSMessageHandler = {
  postMessage: (params: unknown) => void
}

type BridgeWindow = Window & {
  androidBridge?: AndroidBridge
  webkit?: {
    messageHandlers?: Record<string, IOSMessageHandler | undefined>
  }
  onToken?: (token: string) => void
  testFunc?: (params: unknown) => string
}

const formatValue = (value: unknown) => {
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const getOsType = (): OsType => {
  const os = new URLSearchParams(window.location.search).get('osType')
  if (os === 'iOS') return 'iOS'
  if (os === 'android') return 'android'
  return 'web'
}

export default function JsBridgeTestPage() {
  const osType = useMemo(getOsType, [])
  const [logs, setLogs] = useState<LogItem[]>([])
  const [token, setToken] = useState('')

  const appendLog = (level: LogLevel, message: string, value?: unknown) => {
    const suffix = value === undefined ? '' : `\n${formatValue(value)}`

    setLogs((current) => [
      {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        level,
        message: `${message}${suffix}`,
      },
      ...current,
    ].slice(0, 30))
  }

  useEffect(() => {
    const bridgeWindow = window as BridgeWindow

    const onToken = (nextToken: string) => {
      setToken(nextToken)
      appendLog('callback', 'window.onToken(token)', nextToken)
    }

    const testFunc = (params: unknown) => {
      appendLog('callback', 'window.testFunc(params)', params)
      return 'h5 处理完成'
    }

    bridgeWindow.onToken = onToken
    bridgeWindow.testFunc = testFunc

    return () => {
      if (bridgeWindow.onToken === onToken) delete bridgeWindow.onToken
      if (bridgeWindow.testFunc === testFunc) delete bridgeWindow.testFunc
    }
  }, [])

  const callAndroidToast = () => {
    appendLog('call', 'Android: showToast("H5 调用原生 Toast")')

    // 每次点击都从 window 读取当前注入实例，禁止缓存 bridge 引用。
    const bridge = (window as BridgeWindow).androidBridge
    if (!bridge) {
      appendLog('error', 'window.androidBridge 不存在')
      return
    }

    if (typeof bridge.showToast !== 'function') {
      appendLog('error', 'androidBridge.showToast 不存在')
      return
    }

    try {
      bridge.showToast('H5 调用原生 Toast')
      appendLog('result', 'showToast 已调用')
    } catch (error) {
      appendLog('error', 'showToast 调用失败', error instanceof Error ? error.message : error)
    }
  }

  const callAndroidGetToken = () => {
    appendLog('call', 'Android: getLoginToken()')

    // 每次点击都从 window 读取当前注入实例，禁止缓存 bridge 引用。
    const bridge = (window as BridgeWindow).androidBridge
    if (!bridge) {
      appendLog('error', 'window.androidBridge 不存在')
      return
    }

    if (typeof bridge.getLoginToken !== 'function') {
      appendLog('error', 'androidBridge.getLoginToken 不存在')
      return
    }

    try {
      const result = bridge.getLoginToken()
      setToken(typeof result === 'string' ? result : formatValue(result))
      appendLog('result', 'getLoginToken 同步返回', result)
    } catch (error) {
      appendLog('error', 'getLoginToken 调用失败', error instanceof Error ? error.message : error)
    }
  }

  const callAndroidSubmitOrder = () => {
    const payload = { orderId: 1001, money: 99 }
    appendLog('call', 'Android: submitOrder(JSON.stringify(data))', payload)

    // 每次点击都从 window 读取当前注入实例，禁止缓存 bridge 引用。
    const bridge = (window as BridgeWindow).androidBridge
    if (!bridge) {
      appendLog('error', 'window.androidBridge 不存在')
      return
    }

    if (typeof bridge.submitOrder !== 'function') {
      appendLog('error', 'androidBridge.submitOrder 不存在')
      return
    }

    try {
      bridge.submitOrder(JSON.stringify(payload))
      appendLog('result', 'submitOrder 已调用')
    } catch (error) {
      appendLog('error', 'submitOrder 调用失败', error instanceof Error ? error.message : error)
    }
  }

  const callIOSAuthorization = () => {
    appendLog('call', 'iOS: getAuthorizationInfo.postMessage({})')

    const handler = (window as BridgeWindow).webkit?.messageHandlers?.getAuthorizationInfo
    if (!handler) {
      appendLog('error', 'iOS handler getAuthorizationInfo 不存在')
      return
    }

    try {
      handler.postMessage({})
      appendLog('result', '等待原生调用 window.onToken(token)')
    } catch (error) {
      appendLog('error', 'getAuthorizationInfo 调用失败', error instanceof Error ? error.message : error)
    }
  }

  const clearLogs = () => setLogs([])

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 pb-8 pt-5 text-[var(--color-text-primary)]">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">JSBridge 联调</h1>
            <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
              osType: {osType}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">
            H5 ↔ Android / iOS 原生调用测试页
          </p>
        </header>

        <section className="rounded-[var(--radius-container)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
              <button
                type="button"
                onClick={callAndroidToast}
                className="h-10 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium active:bg-[var(--color-surface-pressed)]"
              >
                Android Toast
              </button>
              <button
                type="button"
                onClick={callAndroidGetToken}
                className="h-10 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium active:bg-[var(--color-surface-pressed)]"
              >
                Android 获取 Token
              </button>
              <button
                type="button"
                onClick={callAndroidSubmitOrder}
                className="h-10 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium active:bg-[var(--color-surface-pressed)]"
              >
                Android 提交订单
              </button>
              <button
                type="button"
                onClick={callIOSAuthorization}
                className="h-10 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white active:bg-[var(--color-primary-pressed)]"
              >
                iOS 获取授权信息
              </button>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[var(--radius-container)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">原生回调入口</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                window.onToken(token) · window.testFunc(params)
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--color-success-bg)] px-2.5 py-1 text-xs font-medium text-[var(--color-success-text)]">
              已挂载
            </span>
          </div>

          <div className="mt-3 rounded-[var(--radius-control)] bg-[var(--color-surface-subtle)] px-3 py-2.5">
            <p className="text-xs text-[var(--color-text-tertiary)]">最近 Token</p>
            <p className="mt-1 break-all font-mono text-sm">{token || '—'}</p>
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-[var(--radius-container)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
          <div className="flex h-12 items-center justify-between border-b border-[var(--color-border-subtle)] px-4">
            <div>
              <span className="text-sm font-semibold">调用日志</span>
              <span className="ml-2 text-xs text-[var(--color-text-tertiary)]">最近 30 条</span>
            </div>
            <button
              type="button"
              onClick={clearLogs}
              className="text-xs font-medium text-[var(--color-text-brand)]"
            >
              清空
            </button>
          </div>

          <div className="max-h-[46vh] min-h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-[var(--color-text-tertiary)]">
                点击上方按钮开始联调，原生回调也会显示在这里。
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {logs.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                      <span>{item.time}</span>
                      <span className="font-medium uppercase">{item.level}</span>
                    </div>
                    <pre className="mt-1.5 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-[var(--color-text-secondary)]">
                      {item.message}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
