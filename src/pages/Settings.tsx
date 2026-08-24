import { useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { Camera, CheckCircle2, ChevronRight, Eye, EyeOff, Image, X } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button, IconButton } from '../components/ui'
import { useOverlay } from '../app/fixtures/useFixture'
import avatar from '../assets/brand/home/home-avatar.webp'

type SheetKey = 'avatar' | 'nickname' | 'birthday' | 'password' | null

const initialProfile = {
  nickname: '会员小福',
  birthday: '2003-08-15',
  year: '',
  passwordSet: false,
}

const yearGroups: Array<{ group: string; items: string[] }> = [
  { group: '本科', items: ['大一', '大二', '大三', '大四', '大五'] },
  { group: '研究生', items: ['研一', '研二', '研三'] },
]

export default function Settings() {
  const navigate = useNavigate()
  const { overlay, close: closeOverlay } = useOverlay()
  const [sheet, setSheet] = useState<SheetKey>(null)
  const [nickname, setNickname] = useState(initialProfile.nickname)
  const [birthday, setBirthday] = useState(initialProfile.birthday)
  const [year, setYear] = useState(initialProfile.year)
  const [passwordSet, setPasswordSet] = useState(initialProfile.passwordSet)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwStep, setPwStep] = useState(1)
  const [showPw, setShowPw] = useState(false)
  const [toast, setToast] = useState(false)
  const bypassGuard = useRef(false)

  const dirty =
    nickname !== initialProfile.nickname ||
    birthday !== initialProfile.birthday ||
    year !== initialProfile.year ||
    passwordSet !== initialProfile.passwordSet

  const blocker = useBlocker(
    ({ historyAction }) => !bypassGuard.current && dirty && historyAction !== 'REPLACE',
  )

  const discardOpen = blocker.state === 'blocked' || overlay === 'discard'

  const close = () => {
    setSheet(null)
    setPwStep(1)
    setPw1('')
    setPw2('')
  }

  const flashToast = () => {
    setToast(true)
    window.setTimeout(() => setToast(false), 2200)
  }

  const save = () => {
    flashToast()
    close()
  }

  const confirmAll = () => {
    bypassGuard.current = true
    flashToast()
    close()
    window.setTimeout(() => navigate('/profile'), 600)
  }

  const keepEditing = () => {
    if (blocker.state === 'blocked') blocker.reset()
    if (overlay === 'discard') closeOverlay()
  }

  const discardChanges = () => {
    bypassGuard.current = true
    if (blocker.state === 'blocked') {
      blocker.proceed()
      return
    }
    if (overlay === 'discard') closeOverlay()
    navigate('/profile')
  }

  return (
    <PageContainer className="pb-24">
      <section className="relative z-10 mt-2 rounded-2xl bg-surface shadow-sm">
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          <span className="w-12 shrink-0 text-sm text-text-tertiary">头像</span>
          <span className="flex min-w-0 flex-1 justify-end">
            <button type="button" onClick={() => setSheet('avatar')} className="h-11 w-11 overflow-hidden rounded-full" aria-label="修改头像">
              <img src={avatar} alt="会员头像" className="h-full w-full object-cover" />
            </button>
          </span>
          <button type="button" onClick={() => setSheet('avatar')} aria-label="修改头像" className="shrink-0 text-text-tertiary">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          <span className="w-12 shrink-0 text-sm text-text-tertiary">昵称</span>
          <span className="min-w-0 flex-1 truncate text-right text-sm text-text-primary">{nickname}</span>
          <button type="button" onClick={() => setSheet('nickname')} aria-label="修改昵称" className="shrink-0 text-text-tertiary">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          <span className="w-12 shrink-0 text-sm text-text-tertiary">生日</span>
          <span className="min-w-0 flex-1 text-right text-sm text-text-primary">{birthday}</span>
          <button type="button" onClick={() => setSheet('birthday')} aria-label="修改生日" className="shrink-0 text-text-tertiary">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="w-12 shrink-0 text-sm text-text-tertiary">消费密码</span>
          <span className="min-w-0 flex-1 text-right">
            <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs text-text-tertiary">{passwordSet ? '已设置' : '未设置'}</span>
          </span>
          <button type="button" onClick={() => setSheet('password')} aria-label="去设置消费密码" className="shrink-0 text-text-tertiary">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="relative z-10 mt-6 px-4">
        <h2 className="text-base font-semibold text-text-primary">年级</h2>
        <p className="mt-1 text-sm text-text-tertiary">选择您当前的年级，将用于匹配校园活动与权益</p>
        <div className="mt-3 space-y-4">
          {yearGroups.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-xs font-medium text-text-secondary">{group.group}</p>
              <div className="grid grid-cols-5 gap-2">
                {group.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setYear(item)}
                    className={`h-9 rounded-lg border text-sm ${
                      year === item ? 'border-primary bg-surface-selected text-text-brand' : 'border-border bg-surface text-text-primary'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={confirmAll}
        className="relative z-10 mx-auto mt-8 flex h-12 w-full max-w-[343px] items-center justify-center rounded-2xl bg-primary text-sm font-medium text-white active:bg-primary-pressed"
      >
        确认修改
      </button>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={sheet === 'password' ? '消费密码' : `修改${sheet === 'nickname' ? '昵称' : sheet === 'birthday' ? '生日' : '头像'}`}
            className="w-full max-w-[448px] rounded-t-overlay bg-surface px-4 pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border" aria-hidden />
            <div className="flex items-start justify-between px-4 pb-2 pt-1">
              <h2 className="text-lg font-semibold text-text-primary">
                {sheet === 'avatar' && '修改头像'}
                {sheet === 'nickname' && '修改昵称'}
                {sheet === 'birthday' && '修改生日'}
                {sheet === 'password' && (pwStep === 1 ? '设置消费密码' : '确认密码')}
              </h2>
              <button type="button" aria-label="关闭" onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle text-text-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-3">
              {sheet === 'avatar' && (
                <>
                  <p className="text-sm text-text-tertiary">选择一种方式更新您的会员头像</p>
                  <button type="button" onClick={save} className="mt-4 flex w-full items-center gap-3 rounded-xl p-2.5 active:bg-surface-subtle">
                    <Camera className="h-5 w-5 text-text-secondary" />
                    <span className="text-sm text-text-primary">拍照</span>
                  </button>
                  <button type="button" onClick={save} className="flex w-full items-center gap-3 rounded-xl p-2.5 active:bg-surface-subtle">
                    <Image className="h-5 w-5 text-text-secondary" />
                    <span className="text-sm text-text-primary">从相册选择</span>
                  </button>
                  <div className="my-2 h-px bg-border-subtle" />
                  <button type="button" onClick={close} className="flex w-full items-center gap-3 rounded-xl p-2.5 active:bg-surface-subtle">
                    <X className="h-5 w-5 text-text-secondary" />
                    <span className="text-sm text-text-primary">取消</span>
                  </button>
                </>
              )}

              {sheet === 'nickname' && (
                <>
                  <p className="text-sm text-text-tertiary">昵称将展示在您的会员主页与互动记录中</p>
                  <label className="mt-4 block text-sm text-text-primary">
                    昵称
                    <input
                      value={nickname}
                      maxLength={12}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="请输入昵称"
                      className="mt-1.5 block h-11 w-full rounded-control border border-border bg-surface px-3 text-base outline-none focus:border-primary"
                    />
                  </label>
                  <button type="button" onClick={save} className="mt-5 h-11 w-full rounded-control bg-primary text-sm font-medium text-text-inverse active:bg-primary-pressed">
                    保存
                  </button>
                </>
              )}

              {sheet === 'birthday' && (
                <>
                  <p className="text-sm text-text-tertiary">生日将用于会员权益与生日礼遇</p>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="mt-4 block h-11 w-full rounded-control border border-border bg-surface px-3 text-base outline-none focus:border-primary"
                    aria-label="选择生日"
                  />
                  <button type="button" onClick={save} className="mt-5 h-11 w-full rounded-control bg-primary text-sm font-medium text-text-inverse active:bg-primary-pressed">
                    保存
                  </button>
                </>
              )}

              {sheet === 'password' && (
                <>
                  <p className="text-sm text-text-tertiary">消费密码用于扫码支付与余额变动保护，共 6 位数字</p>
                  {pwStep === 1 ? (
                    <>
                      <label className="mt-4 block text-sm text-text-primary">
                        设置密码
                        <input
                          type={showPw ? 'text' : 'password'}
                          inputMode="numeric"
                          maxLength={6}
                          value={pw1}
                          onChange={(e) => setPw1(e.target.value.replace(/\D/g, ''))}
                          placeholder="请输入 6 位数字密码"
                          className="mt-1.5 block h-11 w-full rounded-control border border-border bg-surface px-3 pr-11 text-base outline-none focus:border-primary"
                        />
                      </label>
                      <button type="button" onClick={() => setShowPw(!showPw)} className="mt-2 inline-flex items-center gap-1 text-xs text-text-tertiary">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPw ? '隐藏' : '显示'}密码
                      </button>
                      <button type="button" disabled={pw1.length < 6} onClick={() => setPwStep(2)} className="mt-5 h-11 w-full rounded-control bg-primary text-sm font-medium text-text-inverse active:bg-primary-pressed disabled:bg-disabled disabled:text-text-disabled">
                        下一步
                      </button>
                    </>
                  ) : (
                    <>
                      <label className="mt-4 block text-sm text-text-primary">
                        确认密码
                        <input
                          type={showPw ? 'text' : 'password'}
                          inputMode="numeric"
                          maxLength={6}
                          value={pw2}
                          onChange={(e) => setPw2(e.target.value.replace(/\D/g, ''))}
                          placeholder="再次输入 6 位数字密码"
                          className="mt-1.5 block h-11 w-full rounded-control border border-border bg-surface px-3 pr-11 text-base outline-none focus:border-primary"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={pw2.length < 6 || pw1 !== pw2}
                        onClick={() => {
                          setPasswordSet(true)
                          save()
                        }}
                        className="mt-5 h-11 w-full rounded-control bg-primary text-sm font-medium text-text-inverse active:bg-primary-pressed disabled:bg-disabled disabled:text-text-disabled"
                      >
                        完成
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed inset-x-0 top-16 z-50 mx-auto flex w-fit items-center gap-2 rounded-control bg-surface-inverse px-4 py-2 text-sm text-text-inverse shadow-floating">
          <CheckCircle2 className="h-4 w-4" />
          保存成功
        </div>
      )}

      <PromptOverlay
        open={discardOpen}
        label="放弃修改确认"
        onDismiss={keepEditing}
        className="bg-surface px-5 pb-5 pt-6 text-center"
      >
        <IconButton
          icon={X}
          label="继续编辑"
          onClick={keepEditing}
          className="absolute right-3 top-3 text-text-secondary"
        />

        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-bg text-warning-text">
          <X className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-text-primary">放弃本次修改？</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">确认放弃刚刚的修改吗？未保存的内容将不会保留。</p>

        <div className="mt-5 flex gap-3">
          <Button variant="outline" size="large" className="flex-1 rounded-pill" onClick={keepEditing}>
            继续编辑
          </Button>
          <Button variant="destructive" size="large" className="flex-1 rounded-pill" onClick={discardChanges}>
            放弃修改
          </Button>
        </div>
      </PromptOverlay>
    </PageContainer>
  )
}
