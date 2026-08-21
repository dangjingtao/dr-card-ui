import type { ComponentProps } from 'react'
import { EmptyState as ComEmptyState } from '../ui'

export type EmptyStateProps = ComponentProps<typeof ComEmptyState>

export default function EmptyState(props: EmptyStateProps) {
  return <ComEmptyState {...props} />
}
