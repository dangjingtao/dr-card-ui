import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, Loader2 } from 'lucide-react'
import { useUserInfo, userInfoActions } from './userInfoStore'

/* T037：登录后引导绑定学校/专业/学号 */
const SCHOOL_OPTIONS = ['广州大学', '华南理工大学', '中山大学', '暨南大学']

export default function BindSchoolPage() {
  const navigate = useNavigate()
  const current = useUserInfo()

  const [school, setSchool] = useState(current.school || SCHOOL_OPTIONS[0])
  const [academy, setAcademy] = useState(current.academy || '')
  const [studentId, setStudentId] = useState(current.studentId || '')

  const [schoolErr, setSchoolErr] = useState('')
  const [academyErr, setAcademyErr] = useState('')
  const [studentIdErr, setStudentIdErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [schoolPickerOpen, setSchoolPickerOpen] = useState(false)

  const handleSubmit = async () => {
    setSchoolErr('')
    setAcademyErr('')
    setStudentIdErr('')
    let ok = true
    if (!school) {
      setSchoolErr('请选择学校')
      ok = false
    }
    if (!academy.trim()) {
      setAcademyErr('请输入学院')
      ok = false
    }
    if (!/^\d{8,20}$/.test(studentId.trim())) {
      setStudentIdErr('请输入 8-20 位数字学号')
      ok = false
    }
    if (!ok) return

    setSubmitting(true)
    /* 模拟保存请求：800ms 异步以展示 loading */
    await new Promise((resolve) => setTimeout(resolve, 800))
    userInfoActions.update({ school, academy: academy.trim(), studentId: studentId.trim(), isRegistered: true })
    setSubmitting(false)
    navigate('/legacy-profile')
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏 */}
      <div className="relative shrink-0 bg-white px-4 pt-3 pb-3 shadow-sm">
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-text-primary"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-text-primary">
            绑定学校信息
          </div>
        </div>
      </div>

      {/* 提示区 */}
      <div className="px-6 pt-6 pb-2">
        <div className="rounded-xl bg-[#EFEEFF] px-4 py-3 text-sm text-[#5A5ABF]">
          完善学校、专业和学号信息，便于享受校园卡权益与专属服务。
        </div>
      </div>

      {/* 表单 */}
      <div className="space-y-4 px-6 pt-2">
        {/* 学校 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">学校</label>
          <button
            type="button"
            onClick={() => setSchoolPickerOpen(true)}
            className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-base transition ${
              schoolErr ? 'border-danger' : 'border-[#D9D8FF]'
            }`}
          >
            <span className="text-text-primary">{school || '请选择学校'}</span>
            <ChevronDown className="h-5 w-5 text-text-tertiary" />
          </button>
          {schoolErr && <span className="text-xs text-danger-text">{schoolErr}</span>}
        </div>

        {/* 学院 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">学院</label>
          <input
            value={academy}
            onChange={(e) => setAcademy(e.target.value)}
            placeholder="请输入学院，如：计算机科学与网络工程学院"
            className={`h-12 w-full rounded-xl border bg-white px-4 text-base outline-none transition placeholder:text-text-placeholder focus:border-[#6B6BE0] ${
              academyErr ? 'border-danger' : 'border-[#D9D8FF]'
            }`}
          />
          {academyErr && <span className="text-xs text-danger-text">{academyErr}</span>}
        </div>

        {/* 学号 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">学号</label>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 20))}
            placeholder="请输入学号"
            inputMode="numeric"
            className={`h-12 w-full rounded-xl border bg-white px-4 text-base outline-none transition placeholder:text-text-placeholder focus:border-[#6B6BE0] ${
              studentIdErr ? 'border-danger' : 'border-[#D9D8FF]'
            }`}
          />
          {studentIdErr && <span className="text-xs text-danger-text">{studentIdErr}</span>}
        </div>
      </div>

      {/* 主操作 */}
      <div className="mt-8 px-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6B6BE0] to-[#8585F5] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? '绑定中' : '确认绑定'}
        </button>
      </div>

      {/* 学校选择面板 */}
      {schoolPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-scrim" onClick={() => setSchoolPickerOpen(false)}>
          <div
            className="w-full max-w-[480px] mx-auto overflow-hidden rounded-t-overlay bg-surface pb-[calc(16px+env(safe-area-inset-bottom))] shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-3 pb-2">
              <div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-border-strong" />
              <h3 className="text-lg font-semibold text-text-primary">选择学校</h3>
            </div>
            <ul className="max-h-[60vh] overflow-auto">
              {SCHOOL_OPTIONS.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      setSchool(opt)
                      setSchoolPickerOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-5 py-3.5 text-left text-base active:bg-surface-pressed ${
                      opt === school ? 'text-[#6B6BE0] font-semibold' : 'text-text-primary'
                    }`}
                  >
                    <span>{opt}</span>
                    {opt === school && <span className="text-xs text-[#6B6BE0]">✓</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}