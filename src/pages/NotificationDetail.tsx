import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Info, MailQuestion } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import { Button, EmptyState } from '../components/ui'
import { notificationCategoryLabel } from '../app/fixtures'
import { markNotificationRead, useNotification } from '../app/state/notifications'

/** 分类小标签（与列表页 .nt-tag 同规格，保证前后一致） */
const TAG_CLASS = {
  system: 'bg-reward-subtle text-reward-text',
  activity: 'bg-info-bg text-info-text',
} as const

export default function NotificationDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const item = useNotification(id)

  /** 进入即已读：列表未读数与红点随之变化（对应 reference 通知.html 的“进入即标记已读”） */
  useEffect(() => {
    if (id) markNotificationRead(id)
  }, [id])

  if (!item) {
    return (
      <PageContainer className="flex flex-col pb-8">
        <EmptyState
          className="flex-1"
          visual={
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-background">
              <MailQuestion className="h-12 w-12 text-reward" strokeWidth={1.6} />
            </span>
          }
          title={<span className="text-[15px] leading-[22px] text-text-secondary">消息不存在或已过期</span>}
          supportingText={<span className="text-xs leading-[18px]">该消息可能已被清理，返回列表查看其他通知</span>}
          primaryAction={
            <Button variant="outline" onClick={() => navigate('/notifications')}>
              返回通知列表
            </Button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="flex flex-col pb-6">
      <article aria-label={item.title} className="flex-1 py-4">
        <header className="flex items-start gap-2">
          <h1 className="min-w-0 flex-1 break-words text-lg font-semibold leading-7 text-text-primary">{item.title}</h1>
          <span
            className={`mt-1 inline-flex h-[18px] shrink-0 items-center rounded-[4px] px-1.5 text-[10px] font-medium leading-[14px] tracking-[0.04em] ${TAG_CLASS[item.cat]}`}
          >
            {notificationCategoryLabel(item.cat)}
          </span>
        </header>
        <p className="mt-1.5 text-xs leading-4 text-text-tertiary">{item.time}</p>

        <div className="mt-4 space-y-3 text-sm leading-6 text-text-primary">
          {item.paragraphs.map((paragraph, index) => (
            <p key={index} className="break-words">
              {paragraph}
            </p>
          ))}
        </div>

        {item.note && (
          <>
            <hr className="my-4 border-border-subtle" />
            <div className="flex items-start gap-2 rounded-lg bg-surface-subtle p-3 text-xs leading-5 text-text-secondary">
              <Info aria-hidden className="mt-px h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{item.note}</span>
            </div>
          </>
        )}
      </article>

      {item.cta && (
        <div className="sticky bottom-0 bg-background pb-[env(safe-area-inset-bottom)] pt-3">
          <Button
            size="large"
            trailingIcon={ArrowRight}
            className="w-full rounded-pill"
            onClick={() => navigate(item.cta!.to)}
          >
            {item.cta.label}
          </Button>
        </div>
      )}
    </PageContainer>
  )
}
