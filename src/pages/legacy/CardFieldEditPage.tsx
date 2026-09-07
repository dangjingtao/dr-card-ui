import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { findCard, updateCard } from './cardStore'

const FIELD_META: Record<string, { label: string; placeholder: string; maxLength: number }> = {
  realName: { label: '姓名', placeholder: '请输入姓名', maxLength: 20 },
  className: { label: '班级', placeholder: '请输入班级', maxLength: 20 },
  studentId: { label: '学号', placeholder: '请输入学号', maxLength: 20 },
}

/**
 * T031｜卡字段编辑弹窗（姓名 / 班级 / 学号）
 * -------------------------------------------------------------
 * 路径：`/legacy-profile/my-cards/:id/edit/:field`
 * 模态弹窗（不是整页）：黑色蒙层 + 居中白卡 + 输入框 + 取消/保存按钮
 *
 * 打开即聚焦输入框，回车提交，ESC 关闭。
 */
export default function CardFieldEditPage() {
  const navigate = useNavigate()
  const { id = '', field = 'realName' } = useParams()

  const card = findCard(id)
  const meta = FIELD_META[field as keyof typeof FIELD_META]

  const initial = (card as any)?.[field] ?? ''
  const [value, setValue] = useState<string>(initial)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  /* 进入即聚焦 */
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  /* ESC 关闭 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  const close = () => {
    navigate(`/legacy-profile/my-cards/${id}`)
  }

  const handleSave = () => {
    setError('')
    const trimmed = value.trim()
    if (!trimmed) {
      setError(`请输入${meta.label}`)
      return
    }
    updateCard(id, { [field]: trimmed })
    close()
  }

  if (!card || !meta) {
    /* 字段不存在 → 直接返回卡详情 */
    navigate(`/legacy-profile/my-cards/${id}`)
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={close}
    >
      {/* 阻止冒泡，点击弹窗内部不关闭 */}
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-center text-base font-semibold text-text-primary">
          修改{meta.label}
        </h3>

        <div className="mt-4 flex items-center gap-2 border-b border-divider py-2 focus-within:border-[#D4A853]">
          <span className="text-sm text-text-secondary">{meta.label}</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            maxLength={meta.maxLength}
            placeholder={meta.placeholder}
            className="flex-1 bg-transparent text-base font-medium text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
        {error && <div className="mt-2 text-xs text-red-500">{error}</div>}

        <div className="mt-6 flex divide-x divide-divider overflow-hidden rounded-xl border border-divider">
          <button
            type="button"
            onClick={close}
            className="flex-1 py-3 text-sm text-text-secondary active:bg-bg-secondary"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 text-sm text-[#B8893D] active:bg-bg-secondary"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}