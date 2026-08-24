import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import { Button } from '../components/ui'
import { findRouteByPathname } from '../app/router/routes'
import { useFixtureState } from '../app/fixtures/useFixture'
import {
  ONBOARDING_GENDERS,
  ONBOARDING_GRADES,
  ONBOARDING_ROLES,
  type OnboardingGender,
  type OnboardingGrade,
  type OnboardingRole,
} from '../app/fixtures'

const PIN_LEN = 6

/**
 * 完善信息（#14 默认态 / #24 学生态，路由 /onboarding）
 * -------------------------------------------------------------
 * T005 表单提交闭环：校验 → 提交中 → #25 领取成功 → 首页已领取态。
 * - 身份选项照抄摹客原型「学生 / 教职工」；选中「学生」后展开年级 2 列网格（#24）
 * - `?state=student` 可直达学生态，便于复现截图
 * - 校验沿用原有必填口径（昵称 + 6 位消费密码），未新增未确认的必填规则
 * ⚠️ 年级是否必填、生日/性别是否必填、密码强度与重复提交规则均未确认，不定稿。
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/onboarding')
  const { state } = useFixtureState(route)
  const pinRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState(false)
  const [nickname, setNickname] = useState('')
  const [birthday, setBirthday] = useState('')
  const [role, setRole] = useState<OnboardingRole | null>(state?.key === 'student' ? '学生' : null)
  const [grade, setGrade] = useState<OnboardingGrade | null>(null)
  const [gender, setGender] = useState<OnboardingGender | null>(null)
  const [pin, setPin] = useState('')
  const [pinFocus, setPinFocus] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const nicknameError = submitted && nickname.trim().length === 0 ? '请输入昵称' : ''
  const pinError = submitted && pin.length !== PIN_LEN ? `请输入 ${PIN_LEN} 位消费密码` : ''
  const ready = nickname.trim().length > 0 && pin.length === PIN_LEN

  const submit = () => {
    setSubmitted(true)
    if (!ready) {
      if (nickname.trim().length === 0) document.getElementById('pf-nick')?.focus()
      else pinRef.current?.focus()
      return
    }
    setSubmitting(true)
    // 确定性提交延时，仅用于展示「提交中」态，非随机
    window.setTimeout(() => navigate('/onboarding/success', { replace: true }), 600)
  }

  return (
    <PageContainer className="pb-24">
      <section className="mt-2 rounded-2xl bg-surface p-5 shadow-sm">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setAvatar(true)}
            aria-label="上传头像"
            className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface-subtle text-3xl text-text-tertiary"
          >
            {avatar ? '✓' : '+'}
          </button>
          <p className="mt-2 text-xs text-text-tertiary">点击上传头像</p>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-text-primary" htmlFor="pf-nick">
              昵称<span className="text-danger-text">*</span>
            </label>
            <input
              id="pf-nick"
              type="text"
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称"
              aria-invalid={nicknameError ? true : undefined}
              aria-describedby={nicknameError ? 'pf-nick-error' : undefined}
              className={`block h-11 w-full rounded-xl border bg-surface px-3 text-base outline-none focus:border-primary ${
                nicknameError ? 'border-danger-text' : 'border-border'
              }`}
            />
            {nicknameError && (
              <p id="pf-nick-error" className="mt-1.5 text-xs text-danger-text">
                {nicknameError}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-text-primary" htmlFor="pf-birth">
              生日
            </label>
            <div className="relative">
              <input
                id="pf-birth"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="block h-11 w-full rounded-xl border border-border bg-surface px-3 text-base outline-none focus:border-primary"
              />
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm text-text-primary">身份</span>
            <div className="flex gap-3" role="radiogroup" aria-label="身份">
              {ONBOARDING_ROLES.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={role === item}
                  onClick={() => {
                    setRole(item)
                    if (item !== '学生') setGrade(null)
                  }}
                  className={`flex h-11 flex-1 items-center gap-2 rounded-xl border px-3 text-sm ${
                    role === item ? 'border-primary bg-surface-selected text-text-brand' : 'border-border bg-surface text-text-primary'
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full border-2 ${role === item ? 'border-primary bg-primary' : 'border-border'}`} aria-hidden />
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* #24 完善信息（学生）：身份选「学生」后才出现年级，2 列网格照抄原型 */}
          {role === '学生' && (
            <div>
              <span className="mb-1.5 block text-sm text-text-primary">年级</span>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="年级">
                {ONBOARDING_GRADES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={grade === item}
                    onClick={() => setGrade(item)}
                    className={`flex h-11 items-center gap-2 rounded-xl border px-3 text-sm ${
                      grade === item ? 'border-primary bg-surface-selected text-text-brand' : 'border-border bg-surface text-text-primary'
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full border-2 ${grade === item ? 'border-primary bg-primary' : 'border-border'}`} aria-hidden />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="mb-1.5 block text-sm text-text-primary">性别</span>
            <div className="flex gap-3" role="radiogroup" aria-label="性别">
              {ONBOARDING_GENDERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={gender === item}
                  onClick={() => setGender(item)}
                  className={`flex h-11 flex-1 items-center gap-2 rounded-xl border px-3 text-sm ${
                    gender === item ? 'border-primary bg-surface-selected text-text-brand' : 'border-border bg-surface text-text-primary'
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full border-2 ${gender === item ? 'border-primary bg-primary' : 'border-border'}`} aria-hidden />
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-text-primary">
              消费密码<span className="text-danger-text">*</span>
            </label>
            <button
              type="button"
              className="flex justify-between gap-2"
              onClick={() => pinRef.current?.focus()}
              aria-label="6 位消费密码"
            >
              {Array.from({ length: PIN_LEN }).map((_, i) => {
                const isFilled = i < pin.length
                const isFocus = i === pin.length && pinFocus
                return (
                  <span
                    key={i}
                    className={`flex h-12 w-full max-w-[52px] items-center justify-center rounded-xl border text-xl font-bold ${
                      isFilled ? 'border-primary bg-surface text-text-primary' : isFocus ? 'border-primary bg-surface' : 'border-border bg-surface text-transparent'
                    }`}
                  >
                    {isFilled ? '•' : isFocus ? '|' : ''}
                  </span>
                )
              })}
            </button>
            <input
              ref={pinRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_LEN}
              value={pin}
              onFocus={() => setPinFocus(true)}
              onBlur={() => setPinFocus(false)}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LEN))}
              className="sr-only"
              aria-label="6 位消费密码"
              aria-invalid={pinError ? true : undefined}
              aria-describedby={pinError ? 'pf-pin-error' : undefined}
            />
            {pinError ? (
              <p id="pf-pin-error" className="mt-1.5 text-xs text-danger-text">
                {pinError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-text-tertiary">6 位数字 · 用于门店消费核验</p>
            )}
          </div>
        </div>
      </section>

      <div className="mt-8 flex justify-center">
        <Button
          size="large"
          loading={submitting}
          trailingIcon={ChevronRight}
          onClick={submit}
          className="h-12 w-full max-w-[343px] rounded-2xl"
        >
          {submitting ? '提交中' : '确认信息'}
        </Button>
      </div>
    </PageContainer>
  )
}
