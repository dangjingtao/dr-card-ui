import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Search, X } from 'lucide-react'
import { useUserInfo, userInfoActions } from './userInfoStore'

/* T037R10：绑定学校信息（卡博士淡金色风格）
 * -------------------------------------------------------------
 * 背景：与运营负责人沟通后确认，绑定学校的初衷是统计数据，
 *   只需收集「学校 + 身份（老师/学生） + 年级（仅学生）」，
 *   去掉学院、学号。
 *
 * 表单字段：
 *   1. 学校（必填）：关键字搜索 + 候选弹出，点选即填入
 *   2. 身份（必填）：老师 / 学生，二选一单选
 *   3. 年级（学生必填，老师不显示）：大一 ~ 大五 / 研一 ~ 研三 / 博士
 *
 * 「确认绑定」：三项填完才可点击；提交后写入 userInfoStore，回「我的」。
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

const GRADE_OPTIONS = [
  '大一',
  '大二',
  '大三',
  '大四',
  '大五',
  '研一',
  '研二',
  '研三',
  '博士',
]

export default function BindSchoolPage() {
  const navigate = useNavigate()
  const current = useUserInfo()

  /* 1. 学校：关键字搜索 + 候选弹出 */
  const [school, setSchool] = useState(current.school || '')
  const [schoolQuery, setSchoolQuery] = useState(current.school || '')
  const [showSchoolOptions, setShowSchoolOptions] = useState(false)
  const schoolWrapRef = useRef<HTMLDivElement>(null)

  /* 2. 身份：老师 / 学生 */
  const [role, setRole] = useState<'teacher' | 'student'>(current.role || 'student')

  /* 3. 年级：仅学生显示 */
  const [grade, setGrade] = useState(current.grade || '')

  const [schoolErr, setSchoolErr] = useState('')
  const [gradeErr, setGradeErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* 关键字过滤：空关键字时显示前 8 项作为热门候选，
   * 有关键字时按"包含命中"实时过滤；命中数 0 时给出空态。 */
  const filteredSchools = useMemo(() => {
    const q = schoolQuery.trim()
    if (!q) return SCHOOL_OPTIONS.slice(0, 8)
    return SCHOOL_OPTIONS.filter((s) => s.includes(q))
  }, [schoolQuery])

  /* 提交门槛：学校必选；学生还需选年级 */
  const canSubmit = useMemo(() => {
    if (!school.trim()) return false
    if (role === 'student' && !grade) return false
    return true
  }, [school, role, grade])

  const handleSchoolPick = (opt: string) => {
    setSchool(opt)
    setSchoolQuery(opt)
    setShowSchoolOptions(false)
    setSchoolErr('')
  }

  const handleSubmit = async () => {
    setSchoolErr('')
    setGradeErr('')
    let ok = true
    if (!school.trim()) {
      setSchoolErr('请输入并选择学校')
      ok = false
    } else if (!SCHOOL_OPTIONS.includes(school.trim())) {
      setSchoolErr('请从候选列表中选择一所学校')
      ok = false
    }
    if (role === 'student' && !grade) {
      setGradeErr('请选择年级')
      ok = false
    }
    if (!ok) return

    setSubmitting(true)
    /* 模拟保存请求：800ms 异步以展示 loading */
    await new Promise((resolve) => setTimeout(resolve, 800))
    userInfoActions.update({
      school: school.trim(),
      role,
      grade: role === 'student' ? grade : '',
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
          完善学校与身份信息，便于享受校园卡权益与专属服务。
        </div>
      </div>

      {/* 表单 */}
      <div className="space-y-5 px-6 pt-2">
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

        {/* 身份：老师 / 学生 二选一 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            身份<span className="ml-0.5 text-danger-text">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['teacher', 'student'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex h-12 items-center justify-center rounded-xl border text-base font-medium transition ${
                  role === r
                    ? 'border-[#D4A853] bg-[#FFF3D9] text-[#A3691F] shadow-sm'
                    : 'border-[#E8D9B8] bg-white text-text-primary active:bg-[#FFF3D9]'
                }`}
              >
                {r === 'teacher' ? '老师' : '学生'}
              </button>
            ))}
          </div>
        </div>

        {/* 年级：仅学生身份显示 */}
        {role === 'student' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              年级<span className="ml-0.5 text-danger-text">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGrade(g)
                    setGradeErr('')
                  }}
                  className={`flex h-10 items-center justify-center rounded-xl border text-sm font-medium transition ${
                    grade === g
                      ? 'border-[#D4A853] bg-[#FFF3D9] text-[#A3691F] shadow-sm'
                      : 'border-[#E8D9B8] bg-white text-text-primary active:bg-[#FFF3D9]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {gradeErr && <span className="text-xs text-danger-text">{gradeErr}</span>}
          </div>
        )}
      </div>

      {/* 主操作：全部填完才可点击 */}
      <div className="mt-8 px-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !canSubmit}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md transition active:opacity-90 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? '绑定中' : '确认绑定'}
        </button>
      </div>
    </div>
  )
}
