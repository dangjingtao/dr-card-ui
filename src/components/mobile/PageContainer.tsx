import type { ReactNode } from 'react'

export interface PageContainerProps {
  children: ReactNode
  className?: string
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return <main className={`min-h-screen bg-background px-4 pb-20 ${className}`}>{children}</main>
}
