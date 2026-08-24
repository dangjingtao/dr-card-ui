import type { ReactNode } from 'react'
import { Dialog } from '../ui'

export interface PromptOverlayProps {
  open: boolean
  label: string
  children: ReactNode
  onDismiss?: () => void
  className?: string
}

export default function PromptOverlay({ open, label, children, onDismiss, className = '' }: PromptOverlayProps) {
  return (
    <Dialog
      open={open}
      title={label}
      onClose={onDismiss}
      presentation="custom"
      size="compact"
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </Dialog>
  )
}
