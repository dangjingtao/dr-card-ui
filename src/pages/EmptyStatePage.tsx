import type { ReactElement } from 'react'
import emptyIllustration from '../assets/brand/empty/empty-illustration.webp'

export interface EmptyStatePageProps {
  /** 标题栏文案；参考稿为「卡博士」 */
  title?: string
  /** 主标题，默认「这里还空空如也」 */
  heading?: string
  /** 说明文案 */
  description?: string
  /** 主操作按钮文案；不传则不渲染按钮 */
  primaryActionLabel?: string
  /** 主操作回调 */
  onPrimaryAction?: () => void
  /** 自定义内容，渲染在主操作之后 */
  children?: ReactElement
}

/**
 * 页面级空状态页（参考稿：卡博士 App WebView 空态）
 * -------------------------------------------------------------
 * 与页面级错误边界 ErrorPage 同构：独立整页、不依赖 MobileLayout 壳层、
 * 沿用同一套标题栏 / 安全区 / 插画 / 主按钮排版，仅语义与文案不同。
 * 因此空态可挂独立预览路由，也可被后续业务页作为整页空态直接渲染。
 *
 * - 顶部仅保留 H5 标准业务标题「卡博士」；系统状态栏按仓库约定不模拟。
 * - 插画为纯装饰，alt 置空并 aria-hidden，不参与无障碍树。
 * - 主操作由调用方注入，本组件不假设任何原生能力或业务跳转。
 */
export default function EmptyStatePage({
  title = '卡博士',
  heading = '这里还空空如也',
  description = '暂时没有可展示的内容，去别处逛逛吧。',
  primaryActionLabel,
  onPrimaryAction,
  children,
}: EmptyStatePageProps) {
  return (
    <div
      className="app-background flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)] text-text-primary"
      data-empty-state-page
    >
      <header className="w-full shrink-0" data-title-bar="plain">
        <div className="flex h-11 w-full items-center justify-center px-3">
          <h1 className="m-0 truncate text-center text-[17px] font-semibold leading-[22px] tracking-[0.01em] text-text-primary">
            {title}
          </h1>
        </div>
      </header>

      <main
        className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-[calc(32px+env(safe-area-inset-bottom))]"
        aria-live="polite"
      >
        <img
          src={emptyIllustration}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="h-auto w-[232px] max-w-[70vw] select-none"
        />
        <h2 className="mt-9 text-[22px] font-semibold leading-[30px] text-text-primary">
          {heading}
        </h2>
        {description && (
          <p className="mt-2.5 max-w-[280px] text-center text-sm leading-[22px] text-text-secondary">
            {description}
          </p>
        )}
        {primaryActionLabel && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="mt-9 inline-flex min-h-12 w-full max-w-[320px] items-center justify-center rounded-pill bg-gradient-to-b from-reward to-reward-strong px-6 text-[16px] font-semibold tracking-[0.02em] text-text-inverse shadow-primary-button transition active:scale-[0.98]"
          >
            {primaryActionLabel}
          </button>
        )}
        {children}
      </main>
    </div>
  )
}
