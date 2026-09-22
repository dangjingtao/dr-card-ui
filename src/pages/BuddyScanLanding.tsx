import { useEffect, useState } from 'react'
import { ExternalLink, Smartphone } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button } from '../components/ui'
import { BUDDY_INVITE_COPY } from '../app/fixtures'
import { useFixtureDebug } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import {
  detectInstalledApp,
  openInstalledApp,
  openNativeAppStore,
} from '../app/adapters/appOpen'
import { getNativeBridgeDiagnostics } from '../services/nativeBridge'

/**
 * 邀请搭子未安装 / 已安装 APP 承接（摹客 #30）
 * -------------------------------------------------------------
 * H034 起，installed 状态只来自 Native openApp({ action: 'detect' })；
 * 不再使用 ?state=has-app/no-app 夹具冒充安装状态，也不以内跳 /buddy/accept 冒充唤起 APP。
 */
export default function BuddyScanLanding() {
  const debug = useFixtureDebug()
  const route = findRouteByPathname('/buddy/invite/scan')
  const [capabilityReady, setCapabilityReady] = useState(
    () => getNativeBridgeDiagnostics().capabilities.openApp,
  )
  const [installed, setInstalled] = useState<boolean | null>(null)
  const [openPrompt, setOpenPrompt] = useState(false)
  const [pending, setPending] = useState<'detect' | 'open' | 'store' | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (capabilityReady) return

    const refresh = () => {
      setCapabilityReady(getNativeBridgeDiagnostics().capabilities.openApp)
    }

    const intervalId = window.setInterval(refresh, 500)
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
    }
  }, [capabilityReady])

  useEffect(() => {
    if (!capabilityReady) return

    let disposed = false
    let running = false

    const detect = async (allowStore: boolean) => {
      if (running) return
      running = true

      if (!disposed) {
        setPending('detect')
        setMessage(null)
      }

      try {
        const result = await detectInstalledApp()
        if (disposed) return

        if (!result.success) {
          setInstalled(null)
          setOpenPrompt(false)
          setMessage('无法确认 APP 安装状态，请稍后重试')
          return
        }

        setInstalled(result.installed)
        setOpenPrompt(result.installed)

        if (!result.installed && allowStore) {
          setPending('store')
          const storeResult = await openNativeAppStore()
          if (disposed) return
          if (!storeResult.success) {
            setMessage('应用商店打开失败，请稍后重试')
          }
        }
      } catch {
        if (disposed) return
        setInstalled(null)
        setOpenPrompt(false)
        setMessage('当前环境暂不支持 APP 唤起能力')
      } finally {
        running = false
        if (!disposed) setPending(null)
      }
    }

    const refreshAfterReturn = () => {
      void detect(false)
    }

    void detect(true)
    window.addEventListener('focus', refreshAfterReturn)
    window.addEventListener('pageshow', refreshAfterReturn)

    return () => {
      disposed = true
      window.removeEventListener('focus', refreshAfterReturn)
      window.removeEventListener('pageshow', refreshAfterReturn)
    }
  }, [capabilityReady])

  const handleOpenApp = async () => {
    if (pending) return

    setPending('open')
    setMessage(null)
    try {
      const result = await openInstalledApp()
      if (!result.success) {
        setMessage('APP 打开失败，请稍后重试')
      }
    } catch {
      setMessage('当前环境暂不支持打开 APP')
    } finally {
      setPending(null)
    }
  }

  const close = () => {
    setOpenPrompt(false)
    setMessage(null)
  }

  const boundaryNote = !capabilityReady
    ? '当前环境暂不支持 APP 唤起能力'
    : pending === 'detect'
      ? '正在检测 APP 安装状态…'
      : pending === 'store'
        ? '正在交由系统打开应用商店…'
        : message ?? '未检测到已安装 APP，将由 Native 承接应用商店跳转'

  return (
    <>
      <PageContainer inset={false} className="flex min-h-full items-center justify-center px-6 pb-16">
        <section
          className="w-full rounded-container border border-border-subtle bg-surface px-6 py-10 text-center shadow-card"
          aria-label="应用商店 H5 承接边界"
          data-native-installed={
            installed === null ? 'unknown' : installed ? 'true' : 'false'
          }
        >
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent">
            <ExternalLink className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-text-primary">
            {BUDDY_INVITE_COPY.noAppTitle}
          </h2>
          <p role="status" aria-live="polite" className="mt-2 text-xs leading-5 text-text-tertiary">
            {boundaryNote}
          </p>
        </section>
      </PageContainer>

      <PromptOverlay
        open={openPrompt}
        label="打开卡博士 APP"
        onDismiss={close}
        className="border border-border-subtle bg-surface px-6 pb-6 pt-7 text-center shadow-modal"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent">
          <Smartphone className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-text-primary">已安装卡博士 APP</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">打开 APP 查看并确认搭子邀请</p>
        {message && (
          <p role="alert" className="mt-3 text-xs leading-5 text-danger-text">
            {message}
          </p>
        )}
        <Button
          size="large"
          className="mt-5 w-full rounded-full"
          loading={pending === 'open'}
          onClick={() => void handleOpenApp()}
        >
          打开 APP
        </Button>
        <Button variant="ghost" className="mt-2 w-full rounded-full" onClick={close}>
          取消
        </Button>
      </PromptOverlay>

      {debug && route && <DebugPanel route={route} />}
    </>
  )
}
