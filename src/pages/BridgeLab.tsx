import { useMemo, useRef, useState } from 'react'
import {
  Bug,
  Eye,
  EyeOff,
  Play,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Terminal,
  Trash2,
} from 'lucide-react'
import { runtimePolicy } from '../app/config/runtime'
import {
  getNativeBridgeCapabilityCatalog,
  getNativeBridgeDiagnostics,
  invokeRegisteredNativeCapabilityForDebug,
  type NativeCapabilityName,
} from '../services/nativeBridge'
import {
  isSensitiveBridgeName,
  redactBridgeValue,
  resetIOSRawProbeChannel,
  runAndroidRawProbe,
  runIOSRawProbe,
  type AndroidArgumentMode,
  type IOSPayloadMode,
  type IOSReceiveMode,
} from '../bridge/bridgeLabProbe'

type LogLevel = 'call' | 'result' | 'callback' | 'error'

type LabLog = {
  id: string
  time: string
  level: LogLevel
  title: string
  displayValue?: unknown
  rawValue?: unknown
  redacted?: boolean
  durationMs?: number
}

function formatValue(value: unknown): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function errorValue(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...('code' in error ? { code: (error as { code?: unknown }).code } : {}),
    }
  }
  return error
}

function inputClassName() {
  return 'h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-text-primary outline-none transition focus:border-reward-strong'
}

function textareaClassName() {
  return 'min-h-24 w-full resize-y rounded-control border border-border bg-surface px-3 py-2.5 font-mono text-xs leading-5 text-text-primary outline-none transition focus:border-reward-strong'
}

export default function BridgeLab() {
  const [catalog, setCatalog] = useState(() => getNativeBridgeCapabilityCatalog())
  const [diagnostics, setDiagnostics] = useState(() => getNativeBridgeDiagnostics())
  const [selectedCapability, setSelectedCapability] = useState<NativeCapabilityName>(
    catalog[0]?.name ?? 'getLoginToken',
  )
  const [capabilityInput, setCapabilityInput] = useState('')

  const [androidObject, setAndroidObject] = useState('androidBridge')
  const [androidMethod, setAndroidMethod] = useState('')
  const [androidMode, setAndroidMode] = useState<AndroidArgumentMode>('none')
  const [androidArgs, setAndroidArgs] = useState('')

  const [iosHandler, setIosHandler] = useState('')
  const [iosPayloadMode, setIosPayloadMode] = useState<IOSPayloadMode>('json')
  const [iosPayload, setIosPayload] = useState('{}')
  const [iosReceiveMode, setIosReceiveMode] = useState<IOSReceiveMode>('global-callback')
  const [iosCallback, setIosCallback] = useState('')
  const [iosTimeout, setIosTimeout] = useState('5000')

  const [logs, setLogs] = useState<LabLog[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set())
  const sequence = useRef(0)

  const currentCapability = useMemo(
    () => catalog.find((item) => item.name === selectedCapability),
    [catalog, selectedCapability],
  )

  const refreshBridgeState = () => {
    const nextCatalog = getNativeBridgeCapabilityCatalog()
    setCatalog(nextCatalog)
    setDiagnostics(getNativeBridgeDiagnostics())
    if (!nextCatalog.some((item) => item.name === selectedCapability) && nextCatalog[0]) {
      setSelectedCapability(nextCatalog[0].name)
    }
  }

  const appendLog = (
    level: LogLevel,
    title: string,
    options: {
      value?: unknown
      forceSensitive?: boolean
      durationMs?: number
    } = {},
  ) => {
    sequence.current += 1
    const id = `${Date.now()}-${sequence.current}`
    const redaction =
      options.value === undefined
        ? { value: undefined, redacted: false }
        : redactBridgeValue(options.value, options.forceSensitive)

    setLogs((current) =>
      [
        {
          id,
          time: new Date().toLocaleTimeString(),
          level,
          title,
          displayValue: redaction.value,
          rawValue: options.value,
          redacted: redaction.redacted,
          durationMs: options.durationMs,
        },
        ...current,
      ].slice(0, 50),
    )
  }

  const runRegisteredCapability = async () => {
    if (!currentCapability) return

    let input: unknown = undefined
    if (capabilityInput.trim()) {
      try {
        input = JSON.parse(capabilityInput)
      } catch (error) {
        appendLog('error', `${currentCapability.name} input JSON 无效`, {
          value: errorValue(error),
        })
        return
      }
    }

    appendLog('call', `capability · ${currentCapability.name}`)
    const startedAt = performance.now()
    try {
      const result = await invokeRegisteredNativeCapabilityForDebug(
        currentCapability.name,
        input,
      )
      appendLog('result', `capability · ${currentCapability.name}`, {
        value: result,
        forceSensitive: currentCapability.sensitiveResult,
        durationMs: Math.round(performance.now() - startedAt),
      })
    } catch (error) {
      appendLog('error', `capability · ${currentCapability.name}`, {
        value: errorValue(error),
        durationMs: Math.round(performance.now() - startedAt),
      })
    } finally {
      refreshBridgeState()
    }
  }

  const runAndroid = async () => {
    appendLog('call', `Android Raw · ${androidObject || '?'}.${androidMethod || '?'}`)
    const startedAt = performance.now()
    try {
      const result = await runAndroidRawProbe({
        objectName: androidObject,
        methodName: androidMethod,
        argumentMode: androidMode,
        argumentText: androidArgs,
      })
      appendLog('result', `Android Raw · ${androidObject}.${androidMethod}`, {
        value: result,
        forceSensitive:
          isSensitiveBridgeName(androidMethod) || isSensitiveBridgeName(androidObject),
        durationMs: Math.round(performance.now() - startedAt),
      })
    } catch (error) {
      appendLog('error', 'Android Raw Probe', {
        value: errorValue(error),
        durationMs: Math.round(performance.now() - startedAt),
      })
    }
  }

  const resetIOSChannel = () => {
    try {
      const reset = resetIOSRawProbeChannel(iosHandler, iosCallback)
      appendLog('result', 'iOS callback channel reset', {
        value: {
          reset,
          note: reset
            ? 'Only reset after host recovery or after confirming the stale callback can no longer arrive.'
            : 'No persisted callback channel existed for this handler/callback pair.',
        },
      })
    } catch (error) {
      appendLog('error', 'iOS callback channel reset', { value: errorValue(error) })
    }
  }

  const runIOS = async () => {
    const timeoutMs = Number(iosTimeout)
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      appendLog('error', 'iOS Raw Probe', {
        value: { message: 'timeout 必须是正数毫秒值。' },
      })
      return
    }

    appendLog('call', `iOS Raw · ${iosHandler || '?'}`)
    const startedAt = performance.now()
    try {
      const result = await runIOSRawProbe({
        handlerName: iosHandler,
        payloadMode: iosPayloadMode,
        payloadText: iosPayload,
        receiveMode: iosReceiveMode,
        callbackName: iosReceiveMode === 'global-callback' ? iosCallback : undefined,
        timeoutMs,
      })
      appendLog(
        iosReceiveMode === 'global-callback' ? 'callback' : 'result',
        `iOS Raw · ${iosHandler}`,
        {
          value: result,
          forceSensitive:
            isSensitiveBridgeName(iosHandler) || isSensitiveBridgeName(iosCallback),
          durationMs: Math.round(performance.now() - startedAt),
        },
      )
    } catch (error) {
      appendLog('error', 'iOS Raw Probe', {
        value: errorValue(error),
        durationMs: Math.round(performance.now() - startedAt),
      })
    }
  }

  const toggleRaw = (id: string) => {
    setRevealed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!runtimePolicy.bridgeLabEnabled) {
    return (
      <main className="min-h-dvh bg-background px-4 py-8 text-text-primary">
        <div className="mx-auto max-w-xl rounded-container border border-border bg-surface p-5">
          <ShieldAlert className="h-5 w-5 text-text-secondary" />
          <h1 className="mt-3 text-lg font-semibold">Bridge Lab 不可用</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            当前运行环境禁止 Raw Probe。Bridge Lab 不在 production runtime 注册。
          </p>
        </div>
      </main>
    )
  }

  return (
    <main
      data-bridge-lab
      className="min-h-dvh bg-background px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] text-text-primary"
    >
      <div className="mx-auto w-full max-w-4xl">
        <header className="rounded-container border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-selected text-text-brand">
              <Bug className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">Bridge Lab</h1>
                <span className="rounded-pill bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                  {runtimePolicy.appEnvironment}/{runtimePolicy.bridgeMode}
                </span>
                <span className="rounded-pill bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                  host: {diagnostics.host}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-text-secondary">
                正式 capability 走生产 Bridge Runtime；Raw Probe 只用于真机联调未知宿主协议，不会自动注册生产能力。
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                {runtimePolicy.build.sourceBranch}@{runtimePolicy.build.sha === 'local' ? 'local' : runtimePolicy.build.sha.slice(0, 8)}
              </p>
            </div>
            <button
              type="button"
              aria-label="刷新 Bridge 状态"
              onClick={refreshBridgeState}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary active:bg-surface-selected"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="mt-4 rounded-container border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-text-secondary" aria-hidden />
            <h2 className="text-sm font-semibold">Registered capabilities</h2>
          </div>
          <div data-capability-list className="mt-3 grid gap-2 sm:grid-cols-2">
            {catalog.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setSelectedCapability(item.name)}
                data-capability-name={item.name}
                className={[
                  'rounded-control border p-3 text-left transition',
                  selectedCapability === item.name
                    ? 'border-reward-strong bg-surface-selected'
                    : 'border-border bg-surface',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-semibold text-text-primary">{item.name}</code>
                  <span
                    className={[
                      'rounded-pill px-2 py-0.5 text-[10px] font-medium',
                      item.supported
                        ? 'bg-success-bg text-success-text'
                        : 'bg-surface-subtle text-text-tertiary',
                    ].join(' ')}
                  >
                    {item.supported ? 'supported' : 'unsupported'}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-text-secondary">{item.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-control bg-surface-subtle p-3">
            <label className="text-xs font-medium text-text-secondary" htmlFor="capability-input">
              可选 input JSON
            </label>
            <textarea
              id="capability-input"
              value={capabilityInput}
              onChange={(event) => setCapabilityInput(event.target.value)}
              placeholder={'留空 = undefined；字符串请输入 JSON 字符串，例如 "hello"'}
              className={textareaClassName()}
            />
            <button
              type="button"
              onClick={runRegisteredCapability}
              disabled={!currentCapability?.supported}
              className="mt-2 inline-flex h-10 items-center gap-2 rounded-button bg-reward-strong px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="h-4 w-4" aria-hidden />
              调用 {currentCapability?.name ?? 'capability'}
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-container border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-text-secondary" aria-hidden />
            <h2 className="text-sm font-semibold">Android Raw Probe</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-text-tertiary">
            每次调用重新读取 injected object，并保留 receiver。这里只验证宿主现状，不代表 production capability。
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-text-secondary">
              object
              <input
                aria-label="Android object"
                value={androidObject}
                onChange={(event) => setAndroidObject(event.target.value)}
                className={inputClassName()}
              />
            </label>
            <label className="text-xs font-medium text-text-secondary">
              method
              <input
                aria-label="Android method"
                value={androidMethod}
                onChange={(event) => setAndroidMethod(event.target.value)}
                placeholder="methodName"
                className={inputClassName()}
              />
            </label>
            <label className="text-xs font-medium text-text-secondary">
              参数模式
              <select
                aria-label="Android 参数模式"
                value={androidMode}
                onChange={(event) => setAndroidMode(event.target.value as AndroidArgumentMode)}
                className={inputClassName()}
              >
                <option value="none">无参数</option>
                <option value="string">单个 string</option>
                <option value="json-value">单个 JSON value</option>
                <option value="json-args">JSON array → 多参数</option>
              </select>
            </label>
          </div>
          {androidMode !== 'none' && (
            <textarea
              aria-label="Android 参数"
              value={androidArgs}
              onChange={(event) => setAndroidArgs(event.target.value)}
              placeholder={androidMode === 'json-args' ? '["foo", 1]' : '{"key":"value"}'}
              className={`mt-3 ${textareaClassName()}`}
            />
          )}
          <button
            type="button"
            onClick={runAndroid}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-button border border-border bg-surface px-4 text-sm font-semibold active:bg-surface-selected"
          >
            <Play className="h-4 w-4" aria-hidden />
            Run Android Probe
          </button>
        </section>

        <section className="mt-4 rounded-container border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-text-secondary" aria-hidden />
            <h2 className="text-sm font-semibold">iOS Raw Probe</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-text-tertiary">
            支持 messageHandler.postMessage 与临时 H5 global callback。不会把任何 handler/callback 名提升为 production 协议。
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-text-secondary">
              message handler
              <input
                aria-label="iOS message handler"
                value={iosHandler}
                onChange={(event) => setIosHandler(event.target.value)}
                placeholder="handlerName"
                className={inputClassName()}
              />
            </label>
            <label className="text-xs font-medium text-text-secondary">
              payload
              <select
                aria-label="iOS payload 模式"
                value={iosPayloadMode}
                onChange={(event) => setIosPayloadMode(event.target.value as IOSPayloadMode)}
                className={inputClassName()}
              >
                <option value="empty-object">{'{}'}</option>
                <option value="string">string</option>
                <option value="json">JSON</option>
              </select>
            </label>
            <label className="text-xs font-medium text-text-secondary">
              返回方式
              <select
                aria-label="iOS 返回方式"
                value={iosReceiveMode}
                onChange={(event) => setIosReceiveMode(event.target.value as IOSReceiveMode)}
                className={inputClassName()}
              >
                <option value="global-callback">H5 global callback</option>
                <option value="none">仅 postMessage</option>
              </select>
            </label>
            {iosReceiveMode === 'global-callback' && (
              <label className="text-xs font-medium text-text-secondary">
                callback
                <input
                  aria-label="iOS callback"
                  value={iosCallback}
                  onChange={(event) => setIosCallback(event.target.value)}
                  placeholder="callbackName"
                  className={inputClassName()}
                />
              </label>
            )}
            <label className="text-xs font-medium text-text-secondary">
              timeout ms
              <input
                aria-label="iOS timeout"
                inputMode="numeric"
                value={iosTimeout}
                onChange={(event) => setIosTimeout(event.target.value)}
                className={inputClassName()}
              />
            </label>
          </div>
          {iosPayloadMode !== 'empty-object' && (
            <textarea
              aria-label="iOS payload"
              value={iosPayload}
              onChange={(event) => setIosPayload(event.target.value)}
              className={`mt-3 ${textareaClassName()}`}
            />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runIOS}
              className="inline-flex h-10 items-center gap-2 rounded-button border border-border bg-surface px-4 text-sm font-semibold active:bg-surface-selected"
            >
              <Play className="h-4 w-4" aria-hidden />
              Run iOS Probe
            </button>
            {iosReceiveMode === 'global-callback' && (
              <button
                type="button"
                onClick={resetIOSChannel}
                title="仅在宿主恢复或确认旧 callback 不会再到达后使用"
                className="inline-flex h-10 items-center gap-2 rounded-button border border-border bg-surface-subtle px-4 text-sm font-medium text-text-secondary active:bg-surface-selected"
              >
                Reset callback channel
              </button>
            )}
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-container border border-border bg-surface">
          <div className="flex h-12 items-center justify-between border-b border-border px-4">
            <div>
              <span className="text-sm font-semibold">Lab logs</span>
              <span className="ml-2 text-xs text-text-tertiary">最多 50 条 · 默认脱敏</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setLogs([])
                setRevealed(new Set())
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              清空
            </button>
          </div>

          <div data-bridge-lab-logs className="max-h-[52vh] min-h-44 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="flex min-h-44 items-center justify-center px-6 text-center text-sm text-text-tertiary">
                从 capability runner 或 Raw Probe 发起一次调用。
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map((item) => {
                  const showingRaw = revealed.has(item.id)
                  const value = showingRaw ? item.rawValue : item.displayValue
                  return (
                    <article key={item.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-tertiary">
                        <span>{item.time}</span>
                        <span className="font-semibold uppercase">{item.level}</span>
                        {item.durationMs != null && <span>{item.durationMs} ms</span>}
                      </div>
                      <p className="mt-1 text-sm font-medium">{item.title}</p>
                      {value !== undefined && (
                        <pre className="mt-1.5 whitespace-pre-wrap break-words rounded-control bg-surface-subtle p-2 font-mono text-xs leading-5 text-text-secondary">
                          {formatValue(value)}
                        </pre>
                      )}
                      {item.redacted && item.rawValue !== undefined && (
                        <button
                          type="button"
                          onClick={() => toggleRaw(item.id)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-text-brand"
                        >
                          {showingRaw ? (
                            <EyeOff className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                          )}
                          {showingRaw ? '恢复脱敏' : '显式显示原始结果'}
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <div className="mt-4 flex items-start gap-2 rounded-control border border-border bg-surface-subtle p-3 text-xs leading-5 text-text-secondary">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Raw Probe 是联调工具，不是协议登记器。真机探测成功只能证明当前宿主上该调用存在；要进入正式 H5，仍需把协议确认后接入 Capability Runtime。
          </p>
        </div>
      </div>
    </main>
  )
}
