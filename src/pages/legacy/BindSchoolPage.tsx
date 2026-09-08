import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Search, X } from 'lucide-react'
import { useUserInfo, userInfoActions } from './userInfoStore'

/* T037：登录后引导绑定学校/专业/学号（卡博士淡金色风格）
 * -------------------------------------------------------------
 * 关键改动（2026-09-08）：
 *   - 学校改为「关键字弹出相应选择项」形式：用户输入关键字（如"广州"），
 *     下方实时出现匹配的子集，用户点选即填入，不再下拉找一大轮。
 *   - 学院、学号输入框保留常规输入。
 *   - 三项（学校/学院/学号）均为必填，全部填写完成才能点击「确认绑定」。
 */

const SCHOOL_OPTIONS = [
  '广州大学',
  '广州工业大学',
  '广州中医药大学',
  '广州医科大学',
  '广州美术学院',
  '广州体育学院',
  '广州航海学院',
  '广州理工学院',
  '广州应用科技学院',
  '华南理工大学',
  '华南师范大学',
  '华南农业大学',
  '中山大学',
  '暨南大学',
  '广东工业大学',
  '广东外语外贸大学',
  '广东财经大学',
  '广东药科大学',
  '广东金融学院',
  '深圳大学',
  '南方医科大学',
  '南方科技大学',
  '汕头大学',
  '福建师范大学',
  '湖南师范大学',
  '武汉大学',
]

export default function BindSchoolPage() {
  const navigate = useNavigate()
  const current = useUserInfo()

  /* 学校：使用 input 受控 + 关键字过滤的下拉候选 */
  const [school, setSchool] = useState(current.school || '')
  const [schoolQuery, setSchoolQuery] = useState(current.school || '')
  const [showSchoolOptions, setShowSchoolOptions] = useState(false)
  const schoolWrapRef = useRef<HTMLDivElement>(null)

  const [academy, setAcademy] = useState(current.academy || '')
  const [studentId, setStudentId] = useState(current.studentId || '')

  const [schoolErr, setSchoolErr] = useState('')
  const [academyErr, setAcademyErr] = useState('')
  const [studentIdErr, setStudentIdErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* 关键字过滤：空关键字时显示前 8 项作为热门候选，
   * 有关键字时按"包含命中"实时过滤；命中数 0 时给出空态。 */
  const filteredSchools = useMemo(() => {
    const q = schoolQuery.trim()
    if (!q) return SCHOOL_OPTIONS.slice(0, 8)
    return SCHOOL_OPTIONS.filter((s) => s.includes(q))
  }, [schoolQuery])

  const canSubmit =
    school.trim().length > 0 && academy.trim().length > 0 && /^\d{8,20}$/.test(studentId.trim())

  const handleSchoolPick = (opt: string) => {
    setSchool(opt)
    setSchoolQuery(opt)
    setShowSchoolOptions(false)
    setSchoolErr('')
  }

  const handleSubmit = async () => {
    setSchoolErr('')
    setAcademyErr('')
    setStudentIdErr('')
    let ok = true
    if (!school.trim()) {
      setSchoolErr('请输入并选择学校')
      ok = false
    } else if (!SCHOOL_OPTIONS.includes(school.trim())) {
      setSchoolErr('请从候选列表中选择一所学校')
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
    userInfoActions.update({
      school: school.trim(),
      academy: academy.trim(),
      studentId: studentId.trim(),
      isRegistered: true,
    })
    setSubmitting(false)
    navigate('/legacy-profile')
  }

  return (
    <div
      className="mx-auto flex min-h-full max-w-[480px] flex-col"
      style={{
        background:
          'radial-gradient(ellipse 90% 30% at 68% 0%, rgba(248, 203, 111, .28) 0%, rgba(255, 230, 180, .14) 42%, transparent 72%), linear-gradient(180deg, #FFF9EE 0%, #FFFCF7 50%, #FFF8EF 100%)',
      }}
    >
      {/* 顶部栏 */}
      <div className="relative shrink-0 px-4 pt-3 pb-3">
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
      <div className="px-6 pt-4 pb-2">
        <div className="rounded-xl bg-[#FFF3D9] px-4 py-3 text-sm text-[#A3691F]">
          完善学校、专业和学号信息，便于享受校园卡权益与专属服务。
        </div>
      </div>

      {/* 表单 */}
      <div className="space-y-4 px-6 pt-2">
        {/* 学校：关键字搜索 + 候选列表 */}
        <div className="space-y-1.5" ref={schoolWrapRef}>
          <label className="text-sm font-medium text-text-primary">
            学校<span className="ml-0.5 text-danger-text">*</span>
          </label>
          <div
            className={`flex h-12 items-center gap-2 rounded-xl border bg-white px-4 shadow-sm transition ${
              schoolErr ? 'border-danger' : 'border-[#E8D9B8]'
            }`}
          >
            <Search className="h-4 w-4 shrink-0 text-[#B8893D]" />
            <input
              value={schoolQuery}
              onChange={(e) => {
                setSchoolQuery(e.target.value)
                setSchool('') /* 用户改了关键字，意味着撤销已选项 */
                setSchoolErr('')
                setShowSchoolOptions(true)
              }}
              onFocus={() => setShowSchoolOptions(true)}
              onBlur={() => {
                /* 延迟关闭，允许点击候选项时 onClick 先触发 */
                setTimeout(() => setShowSchoolOptions(false), 120)
              }}
              placeholder="输入关键字搜索学校，如：广州"
              autoComplete="off"
              className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#B8893D]"
            />
            {schoolQuery && (
              <button
                type="button"
                aria-label="清空"
                onClick={() => {
                  setSchoolQuery('')
                  setSchool('')
                  setSchoolErr('')
                  setShowSchoolOptions(true)
                }}
                className="flex h-8 w-8 items-center justify-center text-[#B8893D] active:opacity-70"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 候选列表（关键字弹出） */}
          {showSchoolOptions && (
            <div className="overflow-hidden rounded-xl border border-[#E8D9B8] bg-white shadow-md">
              {filteredSchools.length > 0 ? (
                <ul className="max-h-[260px] overflow-auto">
                  {filteredSchools.map((opt) => (
                    <li key={opt}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault() /* 避免 input blur 抢先关闭 */}
                        onClick={() => handleSchoolPick(opt)}
                        className="flex w-full items-center px-4 py-3 text-left text-base text-text-primary active:bg-[#FFF3D9]"
                      >
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-text-secondary">
                  没有找到匹配的学校，换个关键字试试
                </div>
              )}
            </div>
          )}

          {schoolErr && <span className="text-xs text-danger-text">{schoolErr}</span>}
          {!schoolErr && school && (
            <span className="text-xs text-[#A3691F]">已选择：{school}</span>
          )}
        </div>

        {/* 学院 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">
            学院<span className="ml-0.5 text-danger-text">*</span>
          </label>
          <input
            value={academy}
            onChange={(e) => setAcademy(e.target.value)}
            placeholder="请输入学院，如：计算机科学与网络工程学院"
            className={`h-12 w-full rounded-xl border bg-white px-4 text-base outline-none transition placeholder:text-[#B8893D] focus:border-[#D4A853] ${
              academyErr ? 'border-danger' : 'border-[#E8D9B8]'
            }`}
          />
          {academyErr && <span className="text-xs text-danger-text">{academyErr}</span>}
        </div>

        {/* 学号 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">
            学号<span className="ml-0.5 text-danger-text">*</span>
          </label>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 20))}
            placeholder="请输入学号"
            inputMode="numeric"
            className={`h-12 w-full rounded-xl border bg-white px-4 text-base outline-none transition placeholder:text-[#B8893D] focus:border-[#D4A853] ${
              studentIdErr ? 'border-danger' : 'border-[#E8D9B8]'
            }`}
          />
          {studentIdErr && <span className="text-xs text-danger-text">{studentIdErr}</span>}
        </div>
      </div>

      {/* 主操作：三项全部填完才可点击 */}
      <div className="mt-8 px-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !canSubmit}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-semibold text-white shadow-md transition active:opacity-90 disabled:opacity-50 ${
            canSubmit
              ? 'bg-gradient-to-r from-[#D4A853] to-[#E8C97A]'
              : 'bg-gradient-to-r from-[#D4A853] to-[#E8C97A]'
          }`}
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? '绑定中' : '确认绑定'}
        </button>
      </div>
    </div>
  )
}