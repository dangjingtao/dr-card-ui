import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, UserRound } from 'lucide-react'
import { findSchool } from './schoolAccountStore'

/**
 * T028｜学校账户概览（图1）
 * -------------------------------------------------------------
 * 顶部：账号 + 总余额 + 右上「小票记录」入口
 * 学校信息卡：学校名 + 小票余额 / 可退款金额 / 赠送金额
 * 两个大按钮：购买（蓝）/ 退款（绿）
 */
export default function SchoolAccountDetailPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const account = findSchool(id)

  if (!account) {
    return (
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col items-center justify-center bg-[#F8F8FA]">
        <div className="text-sm text-text-tertiary">学校账户不存在</div>
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

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部蓝色背景区：账号 + 总余额 + 右上小票记录 */}
      <div
        className="relative shrink-0 px-5 pt-12 pb-10"
        style={{ background: 'linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%)' }}
      >
        <button
          type="button"
          aria-label="返回"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-12 flex h-10 w-10 items-center justify-center text-white active:opacity-80"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="mt-12 text-white">
          <div className="text-sm">账号：{account.accountNo}</div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-xs opacity-90">总余额</div>
              <div className="mt-1 text-3xl font-bold">
                ¥{account.ticketBalance.toFixed(2)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/legacy-profile/school-receipts/${account.id}`)}
              className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs text-white backdrop-blur active:bg-white/30"
            >
              小票记录
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 学校信息卡（白色浮在背景上） */}
      <div className="px-4 pb-8 pt-1">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-semibold text-text-primary">
                {account.schoolName}
              </div>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #D4A853 0%, #B8893D 100%)' }}
            >
              <UserRound className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Row label="小票余额" value={account.ticketBalance} />
            <Row label="可退款金额" value={account.refundableBalance} highlight />
            <Row label="赠送金额" value={account.giftBalance} />
          </div>

          {/* 双按钮 */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate(`/legacy-profile/recharge/${account.id}`)}
              className="rounded-full py-3.5 text-base font-semibold text-white shadow-md active:opacity-90"
              style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' }}
            >
              购买
            </button>
            <button
              type="button"
              onClick={() => navigate(`/legacy-profile/school-refund/${account.id}`)}
              className="rounded-full py-3.5 text-base font-semibold text-white shadow-md active:opacity-90"
              style={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' }}
            >
              退款
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={highlight ? 'text-base font-bold text-[#B8893D]' : 'text-sm text-text-primary'}>
        ¥{value.toFixed(2)}
      </span>
    </div>
  )
}