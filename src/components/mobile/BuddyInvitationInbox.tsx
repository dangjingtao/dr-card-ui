import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, UserRoundPlus } from 'lucide-react'
import { Button, Dialog } from '../ui'
import type { BuddyPhoneInvitation } from '../../services/buddyPhone'
import { buddyPhoneContractReady, getBuddyPhoneInvitations, acceptBuddyPhoneInvitation } from '../../services/buddyPhoneGateway'

/** Invitation processing is not notification read/unread. Production remains fail-closed until #105/#95. */
export default function BuddyInvitationInbox() {
  const [items, setItems] = useState<BuddyPhoneInvitation[]>([])
  const [loading, setLoading] = useState(buddyPhoneContractReady)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<BuddyPhoneInvitation | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const refresh = async () => {
    if (!buddyPhoneContractReady) return
    setLoading(true)
    setError(null)
    try { setItems(await getBuddyPhoneInvitations()) }
    catch { setError('加载搭子邀请失败，请稍后重试') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!buddyPhoneContractReady) return
    let active = true
    void getBuddyPhoneInvitations()
      .then(value => { if (active) setItems(value) })
      .catch(() => { if (active) setError('加载搭子邀请失败，请稍后重试') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const confirm = async () => {
    if (!selected || selected.status !== 'pending' || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await acceptBuddyPhoneInvitation(selected.id)
      setSelected(null)
      await refresh() // server/mock transport is the only invitation status truth
    } catch { setError('确认失败，请稍后重试') }
    finally { setSubmitting(false) }
  }

  return (
    <section aria-label="洗头搭子邀请通知" className="mx-4 mt-4 rounded-container bg-surface px-4 py-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-buddy-text">洗头搭子邀请</h2>
        {buddyPhoneContractReady && <span className="text-xs text-buddy-muted">演示数据</span>}
      </div>
      {!buddyPhoneContractReady ? (
        <p role="status" className="text-sm leading-6 text-text-secondary">
          搭子邀请通知接口待后台接入，当前无法查询或确认真实邀请
        </p>
      ) : loading ? (
        <p role="status" className="flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />正在加载邀请…
        </p>
      ) : (
        <>
          {items.length === 0 && <p className="text-sm text-text-secondary">暂无搭子邀请</p>}
          <div className="space-y-3">
            {items.map(item => (
              <article key={item.id} className="flex items-center gap-3 border-t border-border-subtle pt-3 first:border-0 first:pt-0">
                {item.inviter.avatarUrl ? (
                  <img src={item.inviter.avatarUrl} alt="" aria-hidden className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent">
                    <UserRoundPlus className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-buddy-text">{item.inviter.nickname}</p>
                  <p className="text-xs text-text-secondary">
                    {item.status === 'pending' ? '邀请你成为洗头搭子 · 等待确认' : '已成为搭子 · 邀请已完成'}
                  </p>
                </div>
                {item.status === 'pending' ? (
                  <Button size="regular" onClick={() => setSelected(item)} className="flex-none rounded-pill px-3">查看邀请</Button>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-buddy-accent">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />已完成
                  </span>
                )}
              </article>
            ))}
          </div>
        </>
      )}
      {error && (
        <div role="alert" className="mt-3 space-y-2 text-xs text-danger-text">
          <p>{error}</p><Button variant="outline" onClick={() => void refresh()}>重试</Button>
        </div>
      )}
      <Dialog open={selected !== null} title="确认成为洗头搭子？"
        onClose={() => { if (!submitting) setSelected(null) }}
        actions={<>
          <Button variant="outline" disabled={submitting} onClick={() => setSelected(null)}>取消</Button>
          <Button loading={submitting} disabled={submitting} onClick={() => void confirm()}>确认成为搭子</Button>
        </>}>
        {selected?.inviter.nickname} 邀请你成为洗头搭子。成为搭子后，当前版本暂不支持解除关系。
        关闭通知或取消不会拒绝邀请。
      </Dialog>
    </section>
  )
}
