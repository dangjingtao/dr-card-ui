import { ExternalLink, Smartphone } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button } from '../components/ui'
import { BUDDY_INVITE_COPY } from '../app/fixtures'
import { findRouteByPathname } from '../app/router/routes'

/**
 * 邀请搭子未安装 / 已安装 APP 承接（摹客 #30）
 * -------------------------------------------------------------
 * 用户定案（D-055）：#30 原型只有一行「应用商店H5」文案，按
 * 「WebView 边界页 + 唤起弹窗」两态承载，不伪造任何应用商店视觉，
 * 也不实现真实唤起（B-005）。
 */
export default function BuddyScanLanding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const route = findRouteByPathname('/buddy/invite/scan')
  const hasApp = searchParams.get('state') === 'has-app'
  const debug = searchParams.get('debug') === '1'
  const close = () => navigate(`/buddy/invite/scan?state=no-app${debug ? '&debug=1' : ''}`, { replace: true })
  const openApp = () => navigate(`/buddy/accept${debug ? '?debug=1' : ''}`)

  return (
    <>
      <PageContainer inset={false} className="flex min-h-full items-center justify-center px-6 pb-16">
        <section className="w-full rounded-container border border-border-subtle bg-surface px-6 py-10 text-center shadow-card" aria-label="应用商店 H5 承接边界">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent">
            <ExternalLink className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-text-primary">{BUDDY_INVITE_COPY.noAppTitle}</h2>
          <p className="mt-2 text-xs leading-5 text-text-tertiary">外部应用商店承接边界，不伪造商店页面</p>
        </section>
      </PageContainer>

      <PromptOverlay
        open={hasApp}
        label="打开卡博士 APP"
        onDismiss={close}
        className="border border-border-subtle bg-surface px-6 pb-6 pt-7 text-center shadow-modal"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent">
          <Smartphone className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-text-primary">已安装卡博士 APP</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">打开 APP 查看并确认搭子邀请</p>
        <Button size="large" className="mt-5 w-full rounded-full" onClick={openApp}>打开 APP</Button>
        <Button variant="ghost" className="mt-2 w-full rounded-full" onClick={close}>取消</Button>
      </PromptOverlay>

      <DebugPanel route={route} />
    </>
  )
}
