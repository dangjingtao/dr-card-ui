import type { ReactNode } from 'react'
import { TopAppBar } from '../ui'

export interface HeaderProps {
  title?: string
  leading?: ReactNode
  actions?: ReactNode[]
  scrolled?: boolean
  className?: string
}

export default function Header({ title = '卡博士', leading, actions = [], scrolled = false, className = '' }: HeaderProps) {
  return <TopAppBar title={title} leading={leading} actions={actions} scrolled={scrolled} className={className} />
}
