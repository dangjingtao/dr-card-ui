import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import { useSchoolAccounts } from './schoolAccountStore'

/**
 * T028｜学校账户列表
 * -------------------------------------------------------------
 * 显示所有已绑定的学校账户，点击进入学校账户概览。
 * 原「我的小票」宫格入口已改指此处。
 */
export default function SchoolAccountListPage() {
  const navigate = useNavigate()
  const accounts = useSchoolAccounts()

  const totalBalance = accounts.reduce((sum, a) => sum + a.ticketBalance, 0)

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏：淡金渐变背景 */}
      <div className="relative shrink-0 bg-gradient-to-br from-[#D4A853] to-[#E8C97A] px-4 pt-3 pb-3">
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            我的小票
          </div>
        </div>
      </div>

      {/* 顶部统计 */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm text-text-secondary">账户总余额</div>
          <div className="mt-1 text-2xl font-bold text-[#B8893D]">
            ¥{totalBalance.toFixed(2)}
          </div>
          <div className="mt-1 text-xs text-text-tertiary">
            共 {accounts.length} 个学校账户
          </div>
        </div>
      </div>

      {/* 学校账户列表 */}
      <div className="flex-1 space-y-3 px-4 pb-8 pt-3">
        <div className="text-xs text-text-tertiary">学校账户</div>
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => navigate(`/legacy-profile/school-account/${account.id}`)}
            className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm active:bg-bg-secondary"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #D4A853 0%, #B8893D 100%)' }}
              >
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {account.schoolName}
                </div>
                <div className="mt-0.5 text-xs text-text-tertiary">
                  账号：{account.accountNo}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-base font-bold text-[#B8893D]">
                  ¥{account.ticketBalance.toFixed(2)}
                </div>
                <div className="text-xs text-text-tertiary">小票余额</div>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}