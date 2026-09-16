import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface TitleBarProps {
  title: ReactNode
  back?: boolean
  backLabel?: string
  onBack?: () => void
  action?: ReactNode
  /** 文本型右侧动作需要更宽的对称槽位，保证标题仍然严格居中。 */
  actionWide?: boolean
  className?: string
}

/**
 * 业务标题栏，样式以 reference 内已确认页面为准。
 * - 无返回：首页式居中标题，18/24。
 * - 有返回：44px 三列标题栏；图标动作左右 36px，文本动作左右 72px，标题始终居中。
 * - 沉浸式页面（如扫码）由页面不渲染本组件。
 */
export default function TitleBar({
  title,
  back = false,
  backLabel = '返回',
  onBack,
  action,
  actionWide = false,
  className = '',
}: TitleBarProps) {
  const navigate = useNavigate()
  /* T013R7：actionWide 左右槽位统一 96px ——
    * 96px 刚好容纳"图标 + 4 字文本"（如「企微客服」pill），
    * 文字可自然横向、不被换行或裁剪；左右对称保证标题严格居中；
    * 固定宽度彻底避免第三列内容撑破 grid 导致 pill 溢出页面右侧。 */
  const gridColumns = actionWide
    ? 'grid-cols-[96px_minmax(0,1fr)_96px]'
    : 'grid-cols-[36px_minmax(0,1fr)_36px]'

  if (!back && !action) {
    return (
      <header className={`w-full bg-transparent ${className}`} data-title-bar="plain">
        <div className="mx-auto w-full max-w-[480px] text-center">
          <h1 className="m-0 text-[18px] font-semibold leading-6 text-text-primary">{title}</h1>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`w-full min-w-0 overflow-hidden bg-transparent ${className}`}
      data-title-bar={back ? 'back' : 'action'}
    >
      <div className={`mx-auto grid h-11 w-full min-w-0 max-w-[480px] items-center px-3 ${gridColumns}`}>
        {back ? (
          <div className="flex h-9 items-center justify-start">
            <button
              type="button"
              aria-label={backLabel}
              onClick={onBack ?? (() => navigate(-1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-primary transition active:bg-[rgba(89,55,15,0.06)]"
            >
              <ChevronLeft className="h-[22px] w-[22px] stroke-[2.2]" />
            </button>
          </div>
        ) : (
          <span aria-hidden="true" />
        )}

        <h1 className="m-0 truncate text-center text-[17px] font-semibold leading-[22px] tracking-[0.01em] text-text-primary">
          {title}
        </h1>

        {/* T013R7：actionWide 容器加 min-w-0 max-w-full + justify-end，
            让 action 内容（如 pill）自然贴右但不撑出容器；超出由 header overflow-hidden 截断。 */}
        <div
          className={
            actionWide
              ? 'flex h-9 min-w-0 max-w-full items-center justify-end overflow-hidden'
              : 'flex h-9 w-9 items-center justify-center'
          }
        >
          {action}
        </div>
      </div>
    </header>
  )
}
