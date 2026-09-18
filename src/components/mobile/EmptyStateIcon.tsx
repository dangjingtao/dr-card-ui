import type { LucideIcon } from 'lucide-react'

export interface EmptyStateIconProps {
  icon: LucideIcon
  label?: string
}

/**
 * Formal H5 empty-state illustration used by data-management pages.
 * Keeps the 96px soft circle + 48px reward-tone icon consistent without
 * coupling EmptyState to any business copy or empty-state decision.
 */
export default function EmptyStateIcon({ icon: Icon, label }: EmptyStateIconProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="flex h-24 w-24 items-center justify-center rounded-full bg-background"
    >
      <Icon className="h-12 w-12 text-reward" strokeWidth={1.6} aria-hidden />
    </span>
  )
}
