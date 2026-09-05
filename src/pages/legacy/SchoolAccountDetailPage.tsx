import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, AlertCircle, Circle, UserRound } from 'lucide-react'
import { findSchool } from './schoolAccountStore'

/**
 * T028｜学校账户概览（按图1 严格重建）
 * -------------------------------------------------------------
 * 顶部蓝色背景：
 *   - 左：返回箭头
 *   - 右上：系统提示按钮（感叹号）+ 菜单按钮（圆点圆圈）
 *   - 第一行：账号：xxx
 *   - 第二行：左侧总余额 ¥xx.xx + 右侧"小票记录"玻璃拟态按钮
 * 下方白色卡：
 *   - 左侧学校名 + 右侧蓝色圆形头像
 *   - 三行金额（小票余额 / 可退款金额 / 赠送金额），可退款金额金色加粗
 *   - 底部双按钮：购买（蓝） + 退款（绿）
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
      {/* 顶部蓝色背景区 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-10"
        style={{ background: 'linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%)' }}
      >
        {/* 第一行：左返回 + 右两个圆形按钮 */}
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <button
              type="button"
              aria-label="提示"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25"
            >
              <AlertCircle className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="更多"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25"
            >
              <Circle className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 第二行：账号 */}
        <div className="mt-3 text-sm text-white/90">账号：{account.accountNo}</div>

        {/* 第三行：总余额 + 小票记录 */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-xs text-white/80">总余额</div>
            <div className="mt-1 text-3xl font-bold text-white">
              ¥{account.ticketBalance.toFixed(2)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/legacy-profile/school-receipts/${account.id}`)}
            className="flex items-center gap-1 rounded-full bg-white/20 px-3.5 py-1.5 text-xs text-white backdrop-blur active:bg-white/30"
          >
            小票记录
            <span className="text-base leading-none">›</span>
          </button>
        </div>
      </div>

      {/* 学校信息白卡（向上"刺入"蓝色区域） */}
      <div className="-mt-6 px-4 pb-8">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          {/* 学校名 + 头像 */}
          <div className="flex items-start justify-between">
            <div className="text-base font-semibold text-text-primary">
              {account.schoolName}
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}
            >
              <UserRound className="h-4 w-4" />
            </div>
          </div>

          {/* 三行金额 */}
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
              className="rounded-full py-3 text-base font-semibold text-white shadow-sm active:opacity-90"
              style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' }}
            >
              购买
            </button>
            <button
              type="button"
              onClick={() => navigate(`/legacy-profile/school-refund/${account.id}`)}
              className="rounded-full py-3 text-base font-semibold text-white shadow-sm active:opacity-90"
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
      <span
        className={
          highlight
            ? 'text-base font-bold text-[#B8893D]'
            : 'text-sm text-text-primary'
        }
      >
        ¥{value.toFixed(2)}
      </span>
    </div>
  )
}