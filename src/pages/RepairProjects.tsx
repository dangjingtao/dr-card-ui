import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Wallet } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import { ACCOUNT_INFO, REPAIR_PROJECTS } from '../app/fixtures/service'

/**
 * 设备报修项目页（T034）
 */
export default function RepairProjects() {
  const navigate = useNavigate()

  return (
    <PageContainer className="pb-6" inset={false}>
      {/* 顶部栏 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-4"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            设备报修项目
          </div>
        </div>
        {/* 账号信息 */}
        <div className="mt-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-white/70">账号：</span>
            <span className="font-medium text-white">{ACCOUNT_INFO.account}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-white" />
            <span className="text-white/70">总余额：</span>
            <span className="font-semibold text-white">
              ¥{ACCOUNT_INFO.totalBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="space-y-3 px-4 pt-2">
        {REPAIR_PROJECTS.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary font-medium">项目名称：</span>
              <span className="text-text-primary text-right flex-1 ml-2">
                {project.name}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-text-tertiary font-medium">赠送金额：</span>
              <span className="font-semibold text-[#B8893D]">
                ¥{project.giftAmount.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(`/legacy-service/repair/form?projectId=${project.id}`)
              }
              className="mt-5 mx-auto block min-w-[120px] rounded-full border border-[#D4A853] px-8 py-2 text-sm font-medium text-[#B8893D] active:bg-[#FDF6E8]"
            >
              报修
            </button>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
