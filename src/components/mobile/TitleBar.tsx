import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import HostCloseButton from './HostCloseButton'

export type TitleBarLeadingAction = 'none' | 'back' | 'close'

export interface TitleBarProps {
  title: ReactNode
  leadingAction?: TitleBarLeadingAction
  backLabel?: string
  onBack?: () => void
  action?: ReactNode
  /** 文本型右侧动作需要更宽的对称槽位，保证标题仍然严格居中。 */
  actionWide?: boolean
  /** active formal H5 在 App WebView 内随视口铺满；Native reference/deferred 继续保留预览兼容宽度。 */
  fullWidth?: boolean
  className?: string
}

/**
 * App 标准业务标题栏。
 * - 不模拟系统状态栏；标题栏属于 H5 自身业务 UI。
 * - 44px 高；一级 Tab 左侧为关闭，二级页左侧为返回，标题始终严格居中。
 * - 左/右图标动作触控目标 40px；文本型右侧动作使用对称宽槽位，避免标题偏移。
 * - active formal H5 随 WebView 宽度铺满；Native reference/deferred 保留历史预览兼容宽度。
 * - 沉浸式页面（如扫码）由页面自行提供关闭入口。
 */
export default function TitleBar({
  title,
  leadingAction = 'none',
  backLabel = '返回',
  onBack,
  action,
  actionWide = false,
  fullWidth = false,
  className = '',
}: TitleBarProps) {
  const navigate = useNavigate()
  /* T013R7：actionWide 左右槽位统一 96px ——
    * 96px 刚好容纳"图标 + 4 字文本"（如「企微客服」pill），
    * 文字可自然横向、不被换行或裁剪；左右对称保证标题严格居中；
    * 固定宽度彻底避免第三列内容撑破 grid 导致 pill 溢出页面右侧。 */
  const gridColumns = actionWide
    ? 'grid-cols-[96px_minmax(0,1fr)_96px]'
    : 'grid-cols-[40px_minmax(0,1fr)_40px]'
  const widthClass = fullWidth ? '' : 'mx-auto max-w-legacy-shell'

  if (leadingAction === 'none' && !action) {
    return (
      <header className={`w-full bg-transparent ${className}`} data-title-bar="plain">
        <div className={`flex h-11 w-full items-center justify-center px-3 text-center ${widthClass}`}>
          <h1 className="m-0 text-[18px] font-semibold leading-6 text-text-primary">{title}</h1>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`w-full min-w-0 overflow-hidden bg-transparent ${className}`}
      data-title-bar={leadingAction === 'back' ? 'back' : leadingAction === 'close' ? 'close' : 'action'}
    >
      <div className={`grid h-11 w-full min-w-0 items-center px-3 ${gridColumns} ${widthClass}`}>
        {leadingAction === 'back' ? (
          <div className="flex h-10 items-center justify-start">
            <button
              type="button"
              aria-label={backLabel}
              onClick={onBack ?? (() => navigate(-1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-primary transition active:bg-[rgba(89,55,15,0.06)]"
            >
              <ChevronLeft className="h-[22px] w-[22px] stroke-[2.2]" aria-hidden />
            </button>
          </div>
        ) : leadingAction === 'close' ? (
          <div className="flex h-10 items-center justify-start">
            <HostCloseButton />
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
              : 'flex h-10 w-10 items-center justify-center'
          }
        >
          {action}
        </div>
      </div>
    </header>
  )
}
