import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { findCard, updateCard, type CardStatus } from './cardStore'

/**
 * T031｜卡详情页（图1）
 * -------------------------------------------------------------
 * 顶部蓝色背景
 * 卡信息列表（卡序号 / 卡所属项目 / 用户卡号 / 卡MAC / 姓名 / 班级 / 学号 / 卡状态）
 * 底部三个蓝色文字操作：挂失 / 解挂 / 设置消费卡
 * 姓名 / 班级 / 学号 后挂"修改"链接 → CardFieldEditPage
 * 点击"挂失"弹"您确定要挂失这张卡吗？"确认框
 */
export default function CardDetailPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const card = findCard(id)

  const [showConfirm, setShowConfirm] = useState<null | 'report' | 'unreport'>(null)

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

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部蓝色背景 */}
      <div
        className="relative shrink-0 px-4 pt-12 pb-4"
        style={{ background: '#1E40AF' }}
      >
        <button
          type="button"
          aria-label="返回"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-12 flex h-10 w-10 items-center justify-center text-white active:opacity-80"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      {/* 卡信息列表 */}
      <div className="mx-4 -mt-2 rounded-2xl bg-white px-4 py-2 shadow-sm">
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

      {/* 底部三个蓝色文字操作 */}
      <div className="mx-4 mt-3 grid grid-cols-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
        {card.status === 'normal' ? (
          <button
            type="button"
            onClick={() => setShowConfirm('report')}
            className="text-sm text-[#1E40AF] active:opacity-70"
          >
            挂失
          </button>
        ) : card.status === 'reported' ? (
          <button
            type="button"
            onClick={() => setShowConfirm('unreport')}
            className="text-sm text-[#1E40AF] active:opacity-70"
          >
            解挂
          </button>
        ) : (
          <span className="text-sm text-text-tertiary">解挂</span>
        )}
        <span className="border-x border-divider" />
        <button
          type="button"
          onClick={() => navigate(`/legacy-profile/my-cards/${id}/topup`)}
          className="text-sm text-[#1E40AF] active:opacity-70"
        >
          设置消费卡
        </button>
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