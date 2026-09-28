import { useEffect, type ReactElement } from 'react'
import { useNavigate, useRouteError } from 'react-router-dom'
import { closeWebView } from '../services/nativeBridge'
import errorIllustration from '../assets/brand/error/error-illustration.webp'

export interface ErrorPageProps {
  /** 标题栏文案；参考稿为「卡博士」 */
  title?: string
}

/**
 * 页面级错误边界页（参考稿：卡博士 App WebView「页面开小差了」）
 * -------------------------------------------------------------
 * - 独立整页，不依赖 MobileLayout 壳层：路由渲染抛错时由 React Router errorElement
 *   整体替换壳层展示本页，避免壳层自身出错时无兜底。
 * - 顶部仅保留 H5 标准业务标题「卡博士」；系统状态栏按仓库约定不模拟。
 * - 「返回 APP」调用已确认的 closeWebView() 契约（H030）。浏览器等无宿主环境调用
 *   必然失败，此时降级为回到首页 —— 这是明确标注的 Web fallback，不推断原生能力存在。
 * - 本组件不直接使用 useRouteError，避免在非 data-router 的预览路由上抛错；
 *   错误记录由 PageErrorBoundary 包装负责。
 */
export default function ErrorPage({ title = '卡博士' }: ErrorPageProps) {
  const navigate = useNavigate()

  const handleReturnApp = async () => {
    try {
      await closeWebView()
    } catch (error) {
      // capability-unsupported：浏览器预览等无宿主环境的 Web 降级路径，非原生协议模拟
      console.error('[error-boundary] closeWebView unavailable, fallback to home:', error)
      navigate('/', { replace: true })
    }
  }

  return (
    <div
      className="app-background flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)] text-text-primary"
      data-error-boundary
    >
      <header className="w-full shrink-0" data-title-bar="plain">
        <div className="flex h-11 w-full items-center justify-center px-3">
          <h1 className="m-0 truncate text-center text-[17px] font-semibold leading-[22px] tracking-[0.01em] text-text-primary">
            {title}
          </h1>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-[calc(32px+env(safe-area-inset-bottom))]">
        <img
          src={errorIllustration}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="h-auto w-[232px] max-w-[70vw] select-none"
        />
        <h2 className="mt-9 text-[22px] font-semibold leading-[30px] text-text-primary">
          页面开小差了
        </h2>
        <p className="mt-2.5 max-w-[280px] text-center text-sm leading-[22px] text-text-secondary">
          当前页面暂时无法加载，请返回 APP 后继续使用。
        </p>
        <button
          type="button"
          onClick={handleReturnApp}
          className="mt-9 inline-flex min-h-12 w-full max-w-[320px] items-center justify-center rounded-pill bg-gradient-to-b from-reward to-reward-strong px-6 text-[16px] font-semibold tracking-[0.02em] text-text-inverse shadow-primary-button transition active:scale-[0.98]"
        >
          返回 APP
        </button>
      </main>
    </div>
  )
}

/**
 * React Router data-router 错误边界包装。
 * 仅作为路由 errorElement 使用：捕获路由渲染错误并记录到控制台，然后渲染 ErrorPage。
 * 独立预览路由直接渲染 ErrorPage 本体即可，无需本包装。
 */
export function PageErrorBoundary(): ReactElement {
  const routeError = useRouteError()

  useEffect(() => {
    if (routeError) {
      console.error('[error-boundary] page render failed:', routeError)
    }
  }, [routeError])

  return <ErrorPage />
}
