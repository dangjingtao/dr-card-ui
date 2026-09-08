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
  /* T013R6：actionWide 槽位改为自适应 —— 最小 96px 容纳"图标 + 4 字文本"
    *（如「企微客服」pill），内容多时可自动增长，避免文本被裁剪；
    * 仍由 action 容器内的 justify-end 控制贴右对齐，标题保持居中。 */
  const gridColumns = actionWide
    ? 'grid-cols-[72px_minmax(0,1fr)_minmax(96px,auto)]'
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
      className={`w-full bg-transparent ${className}`}
      data-title-bar={back ? 'back' : 'action'}
    >
      <div className={`mx-auto grid h-11 w-full max-w-[480px] items-center px-3 ${gridColumns}`}>
        {back ? (
          <button
            type="button"
            aria-label={backLabel}
            onClick={onBack ?? (() => navigate(-1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-primary transition active:bg-[rgba(89,55,15,0.06)]"
          >
            <ChevronLeft className="h-[22px] w-[22px] stroke-[2.2]" />
          </button>
        ) : (
          <span aria-hidden="true" />
        )}

        <h1 className="m-0 truncate text-center text-[17px] font-semibold leading-[22px] tracking-[0.01em] text-text-primary">
          {title}
        </h1>

        <div className={actionWide ? 'flex h-9 w-full items-center justify-end' : 'flex h-9 w-9 items-center justify-center'}>
          {action}
        </div>
      </div>
    </header>
  )
}
