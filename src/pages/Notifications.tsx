import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BellOff,
  Wallet,
  PartyPopper,
  Wrench,
  BadgeCheck,
  Sparkles,
} from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import { Button, Dialog, EmptyState, SegmentedControl, Toast } from '../components/ui'
import { useFixtureState, useOverlay } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import { notificationCategoryLabel, notificationGroupLabel } from '../app/fixtures'
import { markAllNotificationsRead, useNotifications, type NotificationItem } from '../app/state/notifications'

type TabKey = 'all' | 'unread' | 'system' | 'activity' | 'event'

const GROUP_ORDER = ['今天', '昨天', '更早'] as const

/**
 * 每个分类的图标与配色（T027）
 * balance=余额不足（红）/event=校内外活动（紫）/service=服务进度（橙）
 * /system=系统通知（金）/activity=营销活动（蓝）
 */
const CAT_VISUAL: Record<
  NotificationItem['cat'],
  { Icon: typeof BellOff; bg: string; tag: string }
> = {
  balance: {
    Icon: Wallet,
    bg: 'linear-gradient(135deg, #F87171 0%, #FCA5A5 100%)',
    tag: 'bg-red-50 text-red-700',
  },
  system: {
    Icon: BadgeCheck,
    bg: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
    tag: 'bg-amber-50 text-amber-700',
  },
  activity: {
    Icon: Sparkles,
    bg: 'linear-gradient(135deg, #818CF8 0%, #A5B4FC 100%)',
    tag: 'bg-indigo-50 text-indigo-700',
  },
  event: {
    Icon: PartyPopper,
    bg: 'linear-gradient(135deg, #C084FC 0%, #DDD6FE 100%)',
    tag: 'bg-violet-50 text-violet-700',
  },
  service: {
    Icon: Wrench,
    bg: 'linear-gradient(135deg, #FB923C 0%, #FDBA74 100%)',
    tag: 'bg-orange-50 text-orange-700',
  },
}

/** 兼容老的 system/activity 通知 */
function getCatVisual(item: NotificationItem) {
  if (CAT_VISUAL[item.cat]) return CAT_VISUAL[item.cat]
  if (item.cat === 'system')
    return CAT_VISUAL.system
  return CAT_VISUAL.activity
}

export default function Notifications() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/notifications')
  const { state } = useFixtureState(route)
  const { overlay, close } = useOverlay()
  const { items, unreadCount } = useNotifications()

  const [tab, setTab] = useState<TabKey>(state?.key === 'unread' ? 'unread' : 'all')
  const [toast, setToast] = useState<string | null>(null)

  const list = useMemo(
    () =>
      items.filter((item) => {
        if (tab === 'all') return true
        if (tab === 'unread') return item.unread
        if (tab === 'event') return item.cat === 'event' || item.cat === 'activity'
        if (tab === 'system') return item.cat === 'system' || item.cat === 'balance' || item.cat === 'service'
        return true
      }),
    [items, tab],
  )

  const groups = useMemo(() => {
    return GROUP_ORDER.map((label) => ({
      label,
      items: list.filter((item) => notificationGroupLabel(item.time) === label),
    })).filter((group) => group.items.length > 0)
  }, [list])

  const tabs = [
    { value: 'all', label: <TabLabel text="全部" count={unreadCount > 0 ? unreadCount : items.length} active={tab === 'all'} /> },
    { value: 'unread', label: <TabLabel text="未读" count={unreadCount} active={tab === 'unread'} /> },
    { value: 'system', label: <TabLabel text="推送" active={tab === 'system'} /> },
    { value: 'event', label: <TabLabel text="活动" active={tab === 'event'} /> },
  ]

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
      {/* Tab 切换（壳层 TitleBar 已展示标题，页面内不再重复金色标题块） */}
      <div className="shrink-0 overflow-x-auto bg-white border-b border-divider px-4 pt-3 pb-1">
        <SegmentedControl items={tabs} value={tab} onChange={(value) => setTab(value as TabKey)} />
      </div>

      <div className="px-4 pt-3" aria-live="polite">
        {groups.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {groups.map((group) => (
              <section key={group.label} className="flex flex-col gap-2.5">
                <h2 className="px-1 pt-1 text-xs font-medium tracking-[0.04em] text-text-tertiary">
                  {group.label}
                </h2>
                {group.items.map((item) => {
                  const visual = getCatVisual(item)
                  const Icon = visual.Icon
                  return (
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
                      className="relative flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-3.5 shadow-sm transition active:scale-[0.995]"
                    >
                      {/* 左侧大图标块 */}
                      <div
                        className="flex h-12 w-12 flex-none items-center justify-center rounded-xl text-white"
                        style={{ background: visual.bg }}
                      >
                        <Icon className="h-6 w-6" strokeWidth={1.8} />
                      </div>

                      {/* 中部内容 */}
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-start gap-2">
                          <h3
                            className={`min-w-0 flex-1 truncate text-sm leading-[20px] text-text-primary ${
                              item.unread ? 'font-semibold' : 'font-medium'
                            }`}
                          >
                            {item.title}
                          </h3>
                          <span
                            className={`inline-flex h-[18px] items-center rounded px-1.5 text-[10px] font-medium leading-[14px] tracking-[0.04em] ${visual.tag}`}
                          >
                            {notificationCategoryLabel(item.cat)}
                          </span>
                        </div>
                        <p className="line-clamp-2 break-words text-xs leading-[18px] text-text-secondary">
                          {item.summary}
                        </p>
                        <span className="text-[11px] leading-4 text-text-tertiary">{item.time}</span>
                      </div>

                      {/* 右侧未读红点 */}
                      {item.unread && (
                        <span
                          role="img"
                          aria-label="未读"
                          className="absolute right-3.5 top-3.5 h-2 w-2 shrink-0 rounded-full bg-[#EF4444]"
                        />
                      )}
                    </article>
                  )
                })}
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            className="pt-12"
            visual={
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FFF8E5]">
                <BellOff className="h-12 w-12 text-[#D4A853]" strokeWidth={1.6} />
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
          className={`inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[11px] font-semibold leading-[14px] ${
            active ? 'bg-amber-100 text-amber-700' : 'bg-[#EF4444] text-white'
          }`}
        >
          {count}
        </span>
      )}
    </span>
  )
}