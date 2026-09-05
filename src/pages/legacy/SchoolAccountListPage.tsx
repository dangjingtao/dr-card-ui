import { useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertCircle, Circle, UserRound } from 'lucide-react'
import { useSchoolAccounts } from './schoolAccountStore'

/**
 * T028｜我的小票（项目维度列表页）
 * -------------------------------------------------------------
 * 每个项目（学校/展厅等地点）独立卡片，按图1样式：
 *   - 卡片顶部蓝色区：账号 + 总余额 + 右上"小票记录"按钮
 *   - 学校信息区：学校名 + 蓝色头像
 *   - 三行金额（小票余额 / 可退款金额 / 赠送金额），可退款金额金色加粗
 *   - 双按钮：购买（蓝） + 退款（绿）—— 点进来直接可用
 *
 * 历史二级页 SchoolAccountDetailPage 已废弃，本页合并其能力。
 */
export default function SchoolAccountListPage() {
  const navigate = useNavigate()
  const accounts = useSchoolAccounts()

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部蓝灰色总标题栏 */}
      <div className="relative shrink-0 px-4 pt-3 pb-2">
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
            我的小票
          </div>
        </div>
      </div>

      {/* 项目卡片列表 */}
      <div className="flex-1 space-y-3 px-4 pb-8 pt-2">
        {accounts.map((account) => (
          <div key={account.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {/* 卡片顶部蓝色区 */}
            <div
              className="relative px-4 pt-3 pb-5"
              style={{ background: 'linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%)' }}
            >
              {/* 右上两枚圆形按钮（占位） */}
              <div className="absolute right-3 top-3 flex items-center gap-2">
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

              {/* 账号 */}
              <div className="mt-1 text-sm text-white/90">账号：{account.accountNo}</div>

              {/* 总余额 + 小票记录 */}
              <div className="mt-3 flex items-end justify-between">
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

            {/* 学校信息白卡内容 */}
            <div className="p-5">
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
        ))}
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