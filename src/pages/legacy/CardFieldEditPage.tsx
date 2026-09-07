import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { findCard, updateCard } from './cardStore'

const FIELD_META: Record<string, { label: string; placeholder: string; maxLength: number }> = {
  realName: { label: '姓名', placeholder: '请输入姓名', maxLength: 20 },
  className: { label: '班级', placeholder: '请输入班级', maxLength: 20 },
  studentId: { label: '学号', placeholder: '请输入学号', maxLength: 20 },
}

/**
 * T031｜卡字段编辑页（姓名 / 班级 / 学号）
 * -------------------------------------------------------------
 * 路径：`/legacy-profile/my-cards/:id/edit/:field`
 * 顶部白色标题栏 + 输入框 + 底部"保存"按钮（淡金渐变）
 */
export default function CardFieldEditPage() {
  const navigate = useNavigate()
  const { id = '', field = 'realName' } = useParams()

  const card = findCard(id)
  const meta = FIELD_META[field as keyof typeof FIELD_META]

  const initial = (card as any)?.[field] ?? ''
  const [value, setValue] = useState<string>(initial)
  const [error, setError] = useState('')

  if (!card || !meta) {
    return (
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col items-center justify-center bg-[#F8F8FA]">
        <div className="text-sm text-text-tertiary">字段不存在</div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-[#B8893D]"
        >
          返回
        </button>
      </div>
    )
  }

  const handleSave = () => {
    setError('')
    const trimmed = value.trim()
    if (!trimmed) {
      setError(`请输入${meta.label}`)
      return
    }
    updateCard(id, { [field]: trimmed })
    navigate(`/legacy-profile/my-cards/${id}`)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部白色标题栏 */}
      <div className="relative shrink-0 bg-white px-4 pt-3 pb-3 shadow-sm">
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-text-primary active:opacity-70"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-text-primary">
            修改{meta.label}
          </div>
        </div>
      </div>

      {/* 输入区 */}
      <div className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-text-primary">{meta.label}</div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError('')
          }}
          maxLength={meta.maxLength}
          placeholder={meta.placeholder}
          className="mt-3 w-full border-b border-divider bg-transparent py-2 text-base text-text-primary outline-none focus:border-[#D4A853]"
        />
        {error && <div className="mt-2 text-xs text-red-500">{error}</div>}
      </div>

      {/* 底部保存 */}
      <div className="mt-auto px-4 pb-6 pt-4">
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-full py-3.5 text-base font-semibold text-white shadow-md active:opacity-90"
          style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)' }}
        >
          保存
        </button>
      </div>
    </div>
  )
}