import { runtimePolicy } from '../app/config/runtime'
import { getNativeHost } from '../services/nativeBridge'
import errorIllustration from '../assets/brand/error/error-illustration.webp'

/**
 * H036 宿主受限提示页
 * -------------------------------------------------------------
 * test / prod 只承载真实 API + Native Bridge 集成，合法运行容器是 App WebView。
 * 非原生宿主（浏览器等）不进入应用，改为展示本提示，不启动路由、不发业务请求。
 *
 * 与页面级错误边界（/error）职责不同：这里不是渲染失败，而是环境本身不被支持，
 * 因此不复用「返回 APP」（closeWebView 在非原生宿主下必然不可用，属无效操作）。
 * 视觉沿用错误页同一张品牌插画，保持宿主受限与页面异常两类兜底的观感一致。
 */
export default function UnsupportedHostNotice() {
  return (
    <div
      className="app-background flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)] text-text-primary"
      data-unsupported-host
    >
      <header className="w-full shrink-0" data-title-bar="plain">
        <div className="flex h-11 w-full items-center justify-center px-3">
          <h1 className="m-0 truncate text-center text-[17px] font-semibold leading-[22px] tracking-[0.01em] text-text-primary">
            卡博士
          </h1>
        </div>
      </header>

      <main
        className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-[calc(32px+env(safe-area-inset-bottom))]"
        aria-live="polite"
      >
        <img
          src={errorIllustration}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="h-auto w-[232px] max-w-[70vw] select-none"
        />
        <h2 className="mt-9 text-[22px] font-semibold leading-[30px] text-text-primary">
          请在卡博士 App 内打开
        </h2>
        <p className="mt-2.5 max-w-[280px] text-center text-sm leading-[22px] text-text-secondary">
          当前环境暂不支持该页面，请在 App 内继续使用。
        </p>
      </main>
    </div>
  )
}

/**
 * 宿主门禁判定。
 *
 * 只依赖既有开关：runtimePolicy.requiresNativeHost 说明当前构建是否要求原生宿主，
 * getNativeHost() 说明当前实际宿主。二者叠加决定是否拦截；不读取 import.meta.env，
 * 也不自行检测 window 上的宿主对象。
 */
export function isUnsupportedHost(): boolean {
  return runtimePolicy.requiresNativeHost && getNativeHost() === 'browser'
}
