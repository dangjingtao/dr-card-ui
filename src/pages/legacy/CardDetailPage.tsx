import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, FlaskConical } from 'lucide-react'
import { findCard, updateCard, type CardStatus } from './cardStore'

type EditField = 'realName' | 'className' | 'studentId'

const FIELD_META: Record<EditField, { label: string; placeholder: string; maxLength: number }> = {
  realName: { label: '姓名', placeholder: '请输入姓名', maxLength: 20 },
  className: { label: '班级', placeholder: '请输入班级', maxLength: 20 },
  studentId: { label: '学号', placeholder: '请输入学号', maxLength: 20 },
}

/**
 * T031｜卡详情页（含内嵌的字段编辑弹窗）
 * -------------------------------------------------------------
 * 卡信息列表 8 行（姓名 / 班级 / 学号 三项点击"修改" → 内联模态弹窗）
 * 挂失 / 解挂 互斥 / 设置消费卡
 * 右下角：原型状态切换器
 *
 * 关键：所有弹窗（字段编辑 / 挂失确认）都是内联模态，**不走独立路由**，
 * 避免浏览器后退/手势返回时路由栈混乱。
 */
export default function CardDetailPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const card = findCard(id)

  const [showConfirm, setShowConfirm] = useState<null | 'report' | 'unreport'>(null)
  const [editingField, setEditingField] = useState<EditField | null>(null)
  const [demoState, setDemoState] = useState<'unbound' | 'bound'>(() => {
    try {
      return sessionStorage.getItem('KBS_CARD_DEMO_STATE') === 'unbound' ? 'unbound' : 'bound'
    } catch {
      return 'bound'
    }
  })

  if (!card) {
    return (
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col items-center justify-center bg-[#F8F8FA]">
        <div className="text-sm text-text-tertiary">卡片不存在</div>
        <button
          type="button"
          onClick={() => navigate('/legacy-profile/my-cards')}
          className="mt-4 text-sm text-[#B8893D]"
        >
          返回我的卡
        </button>
      </div>
    )
  }

  const STATUS_TEXT: Record<CardStatus, string> = {
    normal: '正常',
    reported: '已挂失',
    unreported: '已解挂',
  }

  /* 直接 navigate 到列表，不依赖 -1（避免栈错位） */
  const handleBack = () => {
    navigate('/legacy-profile/my-cards')
  }

  const handleConfirm = () => {
    if (showConfirm === 'report') {
      updateCard(id, { status: 'reported' })
    } else if (showConfirm === 'unreport') {
      updateCard(id, { status: 'unreported' })
    }
    setShowConfirm(null)
  }

  const isReported = card.status === 'reported'

  const toggleDemoState = () => {
    const next = demoState === 'bound' ? 'unbound' : 'bound'
    try {
      sessionStorage.setItem('KBS_CARD_DEMO_STATE', next)
    } catch {
      /* ignore */
    }
    setDemoState(next)
    if (next === 'unbound') {
      navigate('/legacy-profile/my-cards')
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部淡金渐变背景：左侧返回 + 居中"我的卡"标题 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-4"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <div className="relative flex items-center">
          {/* 返回按钮：跳"我的"页面 */}
          <button
            type="button"
            aria-label="返回"
            onClick={handleBack}
            className="relative z-10 flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          {/* 居中标题"我的卡" */}
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            我的卡
          </div>
        </div>
      </div>

      {/* 卡信息列表 */}
      <div className="mx-4 mt-4 rounded-2xl bg-white px-4 py-2 shadow-sm">
        <Row label="卡序号" value={card.cardNo} mono />
        <Row label="卡所属项目" value={`${card.projectName}（${card.projectId}）`} />
        <Row label="用户卡号" value={card.userCardNo} mono />
        <Row label="卡MAC" value={card.mac || '—'} mono placeholder />
        <Row
          label="姓名"
          value={card.realName || '未命名'}
          placeholder={!card.realName}
          action={
            <button
              type="button"
              onClick={() => setEditingField('realName')}
              className="text-xs text-[#B8893D] active:opacity-70"
            >
              修改
            </button>
          }
        />
        <Row
          label="班级"
          value={card.className}
          action={
            <button
              type="button"
              onClick={() => setEditingField('className')}
              className="text-xs text-[#B8893D] active:opacity-70"
            >
              修改
            </button>
          }
        />
        <Row
          label="学号"
          value={card.studentId}
          action={
            <button
              type="button"
              onClick={() => setEditingField('studentId')}
              className="text-xs text-[#B8893D] active:opacity-70"
            >
              修改
            </button>
          }
        />
        <Row label="卡状态" value={STATUS_TEXT[card.status]} last />
      </div>

      {/* 底部三操作 */}
      <div className="mx-4 mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
        <div className="flex justify-center">
          {!isReported ? (
            <button
              type="button"
              onClick={() => setShowConfirm('report')}
              className="text-sm text-[#B8893D] active:opacity-70"
            >
              挂失
            </button>
          ) : (
            <span className="cursor-not-allowed text-sm text-text-tertiary">挂失</span>
          )}
        </div>
        <span className="mx-2 h-4 w-px shrink-0 bg-divider" />
        <div className="flex justify-center">
          {isReported ? (
            <button
              type="button"
              onClick={() => setShowConfirm('unreport')}
              className="text-sm text-[#B8893D] active:opacity-70"
            >
              解挂
            </button>
          ) : (
            <span className="cursor-not-allowed text-sm text-text-tertiary">解挂</span>
          )}
        </div>
        <span className="mx-2 h-4 w-px shrink-0 bg-divider" />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate(`/legacy-profile/my-cards/${id}/topup`)}
            className="text-sm text-[#B8893D] active:opacity-70"
          >
            设置消费卡
          </button>
        </div>
      </div>

      {/* 卡余额与去购买链接（按截图） */}
      <div className="mx-4 mt-4 flex items-center text-sm">
        <span className="text-text-primary">
          {card.projectName} 余额:
          <span className="text-[#DC2626]">{card.balance.toFixed(2)}</span>
          元
        </span>
        <button
          type="button"
          onClick={() => navigate(`/legacy-profile/my-cards/${id}/topup`)}
          className="ml-2 text-[#3B82F6] active:opacity-70"
        >
          {'>'} 去购买
        </button>
      </div>

      {/* === 字段编辑模态弹窗（不走路由，纯组件 state） === */}
      {editingField && (
        <EditFieldModal
          card={card}
          field={editingField}
          onClose={() => setEditingField(null)}
          onSave={(value) => {
            updateCard(id, { [editingField]: value })
            setEditingField(null)
          }}
        />
      )}

      {/* === 挂失/解挂确认弹窗 === */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
          onClick={() => setShowConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-center text-base font-semibold text-text-primary">
              温馨提示
            </h3>
            <p className="mt-2 text-center text-sm text-text-secondary">
              {showConfirm === 'report'
                ? '您确定要挂失这张卡吗？'
                : '您确定要解挂这张卡吗？'}
            </p>
            <div className="mt-6 flex divide-x divide-divider overflow-hidden rounded-xl border border-divider">
              <button
                type="button"
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-3 text-sm text-text-secondary active:bg-bg-secondary"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 text-sm text-[#B8893D] active:bg-bg-secondary"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右下角：原型状态切换器 */}
      <button
        type="button"
        onClick={toggleDemoState}
        title="切换卡的绑定状态（开发用）"
        className="fixed bottom-6 right-4 z-40 flex items-center gap-1.5 rounded-full bg-text-primary px-3 py-2 text-xs font-medium text-white shadow-lg active:opacity-80"
      >
        <FlaskConical className="h-3.5 w-3.5" />
        {demoState === 'bound' ? '已绑卡' : '未绑卡'}
      </button>
    </div>
  )
}

function Row({
  label,
  value,
  action,
  last,
  mono,
  placeholder,
}: {
  label: string
  value: string
  action?: React.ReactNode
  last?: boolean
  mono?: boolean
  placeholder?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${last ? '' : 'border-b border-divider'}`}>
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <span
          className={`max-w-[180px] text-right text-sm ${mono ? 'font-mono' : ''} ${
            placeholder ? 'text-text-tertiary' : 'text-text-primary'
          }`}
        >
          {value}
        </span>
        {action}
      </div>
    </div>
  )
}

/* === 字段编辑模态（不走路由的纯组件） === */
function EditFieldModal({
  card,
  field,
  onClose,
  onSave,
}: {
  card: { realName: string; className: string; studentId: string }
  field: EditField
  onClose: () => void
  onSave: (value: string) => void
}) {
  const meta = FIELD_META[field]
  const initial = card[field] ?? ''
  const [value, setValue] = useState(initial)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSave = () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setError(`请输入${meta.label}`)
      return
    }
    onSave(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={onClose}
    >
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
              if (e.key === 'Escape') onClose()
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
            onClick={onClose}
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