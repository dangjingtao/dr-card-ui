import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import { Button, Dialog, EmptyState, SegmentedControl, Toast } from '../components/ui'
import { useFixtureState, useOverlay } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import { notificationCategoryLabel, notificationGroupLabel } from '../app/fixtures'
import { markAllNotificationsRead, useNotifications, type NotificationItem } from '../app/state/notifications'

type TabKey = 'all' | 'unread' | 'system' | 'activity'

const GROUP_ORDER = ['今天', '昨天', '更早'] as const

/** 分类小圆点：系统=金奖励色，活动=信息色（对齐 reference .nt-dot） */
const DOT_CLASS: Record<NotificationItem['cat'], string> = {
  system: 'bg-reward-strong',
  activity: 'bg-info',
}

/** 分类小标签（对齐 reference .nt-tag 的 18px/10px/radius4 规格） */
const TAG_CLASS: Record<NotificationItem['cat'], string> = {
  system: 'bg-reward-subtle text-reward-text',
  activity: 'bg-info-bg text-info-text',
}

export default function Notifications() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/notifications')
  const { state } = useFixtureState(route)
  const { overlay, close } = useOverlay()
  const { items, unreadCount } = useNotifications()

  /** 节点 #42「通知副本（未读数量）」：夹具直接落在未读 Tab */
  const [tab, setTab] = useState<TabKey>(state?.key === 'unread' ? 'unread' : 'all')
  const [toast, setToast] = useState<string | null>(null)

  const list = useMemo(
    () =>
      items.filter((item) => {
        if (tab === 'all') return true
        if (tab === 'unread') return item.unread
        return item.cat === tab
      }),
    [items, tab],
  )

  /** 按 reference 的 今天 / 昨天 / 更早 三段分组，空组不渲染标题 */
  const groups = useMemo(() => {
    return GROUP_ORDER.map((label) => ({
      label,
      items: list.filter((item) => notificationGroupLabel(item.time) === label),
    })).filter((group) => group.items.length > 0)
  }, [list])

  const tabs = [
    // reference：全部 Tab 有未读时显示未读数，否则显示总数
    { value: 'all', label: <TabLabel text="全部" count={unreadCount > 0 ? unreadCount : items.length} active={tab === 'all'} /> },
    { value: 'unread', label: <TabLabel text="未读" count={unreadCount} active={tab === 'unread'} /> },
    { value: 'system', label: <TabLabel text="系统" active={tab === 'system'} /> },
    { value: 'activity', label: <TabLabel text="活动" active={tab === 'activity'} /> },
  ]

  /** 结果反馈：Toast 为纯展示组件，这里负责 1.6s 后收起 */
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const confirmMarkAll = () => {
    markAllNotificationsRead()
    close()
    setToast('已全部标为已读')
  }

  const openItem = (item: NotificationItem) => {
    navigate(`/notifications/${item.id}`)
  }

  return (
    <PageContainer inset={false} className="pb-6">
      {/* 2026-08-28：一键已读已移入壳层 TitleBar 右侧，页面正文从分类 Tab 直接开始。 */}
      <div className="px-4 pb-3 pt-3">
        <SegmentedControl items={tabs} value={tab} onChange={(value) => setTab(value as TabKey)} />
      </div>

      <div className="px-4" aria-live="polite">
        {groups.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {groups.map((group) => (
              <section key={group.label} className="flex flex-col gap-2.5">
                <h2 className="px-1 pt-1 text-xs font-medium tracking-[0.04em] text-text-tertiary">{group.label}</h2>
                {group.items.map((item) => (
                  <article
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.unread ? '未读，' : ''}${item.title}`}
                    onClick={() => openItem(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openItem(item)
                      }
                    }}
                    className="relative flex cursor-pointer items-start gap-3 rounded-container bg-surface px-3.5 pb-3 pt-3.5 shadow-card transition active:scale-[0.995] active:bg-background"
                  >
                    <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[item.cat]}`} />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <h3
                          className={`min-w-0 flex-1 truncate text-base leading-[22px] text-text-primary ${item.unread ? 'font-semibold' : 'font-medium'}`}
                        >
                          {item.title}
                        </h3>
                        <span
                          className={`inline-flex h-[18px] shrink-0 items-center rounded-[4px] px-1.5 text-[10px] font-medium leading-[14px] tracking-[0.04em] ${TAG_CLASS[item.cat]}`}
                        >
                          {notificationCategoryLabel(item.cat)}
                        </span>
                      </div>
                      <p className="line-clamp-2 break-words text-sm leading-5 text-text-secondary">{item.summary}</p>
                      <span className="text-xs leading-4 text-text-tertiary">{item.time}</span>
                    </div>
                    {item.unread && (
                      <span role="img" aria-label="未读" className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-danger" />
                    )}
                  </article>
                ))}
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            className="pt-12"
            visual={
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-background">
                <BellOff className="h-12 w-12 text-reward" strokeWidth={1.6} />
              </span>
            }
            title={<span className="text-[15px] leading-[22px] text-text-secondary">暂无通知</span>}
            supportingText={<span className="text-xs leading-[18px]">当前分类下还没有消息 · 下拉刷新看看</span>}
          />
        )}
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-6">
          <Toast message={toast} />
        </div>
      )}

      {/* 节点 #43 清除消息确认弹窗；入口由 TitleBar 的「一键已读」触发 `?overlay=clear`。 */}
      <Dialog
        open={overlay === 'clear'}
        title="确认全部标为已读？"
        onClose={close}
        actions={
          <>
            <Button variant="outline" onClick={close}>
              取消
            </Button>
            <Button onClick={confirmMarkAll}>确认</Button>
          </>
        }
      >
        当前有 {unreadCount} 条未读消息，确认后未读标记会被清除，消息本身仍会保留在列表中。
      </Dialog>
    </PageContainer>
  )
}

function TabLabel({ text, count, active }: { text: string; count?: number; active: boolean }) {
  return (
    <span className="inline-flex items-center justify-center gap-1">
      {text}
      {count != null && (
        <span
          className={`inline-flex h-4 min-w-4 items-center justify-center rounded-lg px-[5px] text-[11px] font-semibold leading-[14px] ${
            active ? 'bg-surface-subtle text-text-brand' : 'bg-danger text-text-inverse'
          }`}
        >
          {count}
        </span>
      )}
    </span>
  )
}
