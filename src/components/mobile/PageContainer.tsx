import type { ReactNode } from 'react'

export interface PageContainerProps {
  children: ReactNode
  className?: string
  /** false 用于页面内部自行控制 16px 贴边节奏的全宽内容 */
  inset?: boolean
}

/** 页面内容唯一根容器；状态栏、标题栏和 TabBar 均不放在这里。 */
export default function PageContainer({ children, className = '', inset = true }: PageContainerProps) {
  return (
    <main
      className={`mx-auto min-h-full w-full max-w-[480px] bg-background ${inset ? 'px-4' : ''} ${className}`}
      data-page-container
    >
      {children}
    </main>
  )
}
