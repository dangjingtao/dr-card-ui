import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface TitleBarProps {
  title: ReactNode
  back?: boolean
  backLabel?: string
  onBack?: () => void
  action?: ReactNode
  className?: string
}

/**
 * 业务标题栏，样式以 reference 内已确认页面为准。
 * - 无返回：首页式居中标题，18/24。
 * - 有返回：44px 三列标题栏，左右 36px，17/22 居中标题。
 * - 沉浸式页面（如扫码）由页面不渲染本组件。
 */
export default function TitleBar({
  title,
  back = false,
  backLabel = '返回',
  onBack,
  action,
  className = '',
}: TitleBarProps) {
  const navigate = useNavigate()

  if (!back && !action) {
    return (
      <header className={`w-full bg-background ${className}`} data-title-bar="plain">
        <div className="mx-auto w-full max-w-[480px] text-center">
          <h1 className="m-0 text-[18px] font-semibold leading-6 text-text-primary">{title}</h1>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`w-full bg-background ${className}`}
      data-title-bar={back ? 'back' : 'action'}
    >
      <div className="mx-auto grid h-11 w-full max-w-[480px] grid-cols-[36px_minmax(0,1fr)_36px] items-center px-3">
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

        <div className="flex h-9 w-9 items-center justify-center">{action}</div>
      </div>
    </header>
  )
}
