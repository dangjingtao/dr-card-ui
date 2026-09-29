import emptyIllustration from '../../assets/brand/empty/empty-illustration.webp'

export interface EmptyStateIllustrationProps {
  label?: string
  className?: string
}

/**
 * 品牌插画版区块空态视觉件。
 * -------------------------------------------------------------
 * 与 `mobile/EmptyStateIcon`（96px 柔和圆形 + Lucide 图标）同为 ui/EmptyState 的
 * visual 插槽素材，两者只是视觉档位不同，都只负责「画什么」，不携带任何业务空态
 * 判定、文案或主操作 —— 那些留在消费页与 ui/EmptyState 里。
 *
 * - 尺寸走 h-28 w-28（112px）：比 EmptyStateIcon 的 96px 略重，在纯页面背景上
 *   不至于喧宾夺主；插画自带大量留白，有效图形比 112px 视觉更小，比 160px 更贴合
 *   单行文案的空态节奏。需要更强纵深时由调用方用 className 覆盖尺寸。
 * - 插画为纯装饰：调用方不传 label 时 alt 置空并 aria-hidden，不占用无障碍名称。
 */
export default function EmptyStateIllustration({
  label,
  className = '',
}: EmptyStateIllustrationProps) {
  return (
    <span data-empty-state-illustration className={`flex items-center justify-center ${className}`}>
      <img
        src={emptyIllustration}
        alt={label ?? ''}
        aria-hidden={label ? undefined : true}
        role={label ? 'img' : undefined}
        draggable={false}
        className="h-28 w-28 select-none object-contain"
      />
    </span>
  )
}
