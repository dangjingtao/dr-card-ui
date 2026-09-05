import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Building2 } from 'lucide-react'
import { useSchools, useProjects, recomputeSchoolTotals } from './schoolAccountStore'

/**
 * T028｜我的小票（账户 + 项目两层，卡博士 APP 风格）
 * -------------------------------------------------------------
 * 顶部淡金渐变头部（来自账户维度，仅一份）：
 *   - 账号 + 总余额（聚合所有项目）+ 右上"小票记录"
 * 下方项目列表（每个项目独立卡）：
 *   - 项目名 + Building2 金色头像
 *   - 三行金额（小票余额 / 可退款金额 / 赠送金额）
 *   - 双按钮：购买（淡金渐变）/ 退款（淡金渐变）
 */
export default function SchoolAccountListPage() {
  const navigate = useNavigate()
  const schools = useSchools()
  const projects = useProjects()

  const school = schools[0]
  const schoolProjects = projects.filter((p) => p.schoolId === school?.id)

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部淡金渐变头部：账号 + 总余额 + 小票记录 */}
      <div
        className="relative shrink-0 px-5 pt-12 pb-8"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
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
          <div className="text-sm">账号：{school?.accountNo}</div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-xs opacity-90">总余额</div>
              <div className="mt-1 text-3xl font-bold">
                ¥{school?.totalBalance.toFixed(2)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/legacy-profile/school-receipts/${school?.id}`)}
              className="flex items-center gap-1 rounded-full bg-white/20 px-3.5 py-1.5 text-xs text-white backdrop-blur active:bg-white/30"
            >
              小票记录
              <span className="text-base leading-none">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* 项目卡片列表 */}
      <div className="space-y-3 px-4 pb-8 pt-1">
        {schoolProjects.map((project) => (
          <div key={project.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="text-base font-semibold text-text-primary">
                  {project.projectName}
                </div>
                {/* 卡博士风格：金色圆角方块 + 项目建筑图标 */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #D4A853 0%, #B8893D 100%)' }}
                >
                  <Building2 className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <Row label="小票余额" value={project.ticketBalance} />
                <Row label="可退款金额" value={project.refundableBalance} highlight />
                <Row label="赠送金额" value={project.giftBalance} />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/legacy-profile/recharge/${project.id}`)}
                  className="rounded-full py-3 text-base font-semibold text-white shadow-md active:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)' }}
                >
                  购买
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/legacy-profile/school-refund/${project.id}`)}
                  className="rounded-full py-3 text-base font-semibold text-white shadow-md active:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)' }}
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