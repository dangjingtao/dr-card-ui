import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, FlaskConical } from 'lucide-react'
import { findCard, updateCard, type CardStatus } from './cardStore'

/**
 * T031｜卡详情页
 * -------------------------------------------------------------
 * 顶部淡金渐变（极简：仅返回按钮，不再与 StatusBar 重叠）
 * 卡信息列表 8 行
 * 底部三操作：挂失 ↔ 解挂（互斥）/ 设置消费卡
 * 右下角：原型状态切换器
 */
export default function CardDetailPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const card = findCard(id)

  const [showConfirm, setShowConfirm] = useState<null | 'report' | 'unreport'>(null)
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
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-[#B8893D]"
        >
          返回
        </button>
      </div>
    )
  }

  const STATUS_TEXT: Record<CardStatus, string> = {
    normal: '正常',
    reported: '已挂失',
    unreported: '已解挂',
  }

  const editField = (field: 'realName' | 'className' | 'studentId') => {
    navigate(`/legacy-profile/my-cards/${id}/edit/${field}`)
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
      {/* 顶部淡金渐变背景：仅承载返回按钮（标题交给 TitleBar 在壳层渲染） */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-4"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <div className="flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="relative z-10 flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* 卡信息列表（白卡不再 -mt，完全独立显示在金色区下方） */}
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
              onClick={() => editField('realName')}
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
              onClick={() => editField('className')}
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
              onClick={() => editField('studentId')}
              className="text-xs text-[#B8893D] active:opacity-70"
            >
              修改
            </button>
          }
        />
        <Row label="卡状态" value={STATUS_TEXT[card.status]} last />
      </div>

      {/* 底部三操作：始终显示 挂失 / 解挂 / 设置消费卡，按状态切颜色；grid-cols-3 三等分 + 中间分隔线 */}
      <div className="mx-4 mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
        {/* 挂失：正常态可点（淡金），挂失态置灰不可点 */}
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

        {/* 分隔线 */}
        <span className="mx-2 h-4 w-px shrink-0 bg-divider" />

        {/* 解挂：正常态置灰不可点，挂失态可点（淡金） */}
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

        {/* 分隔线 */}
        <span className="mx-2 h-4 w-px shrink-0 bg-divider" />

        {/* 设置消费卡：始终可点（淡金） */}
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

      {/* 弹窗：挂失 / 解挂 确认 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
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

      {/* 右下角：原型状态切换器（开发用） */}
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