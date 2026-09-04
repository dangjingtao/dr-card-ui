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
      {/* 紫色顶部栏 */}
      <div
        className="relative shrink-0 px-4 pt-12 pb-8 text-white"
        style={{ background: 'linear-gradient(180deg, #6366F1 0%, #818CF8 100%)' }}
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
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-medium">
            设备报修项目
          </div>
        </div>
        {/* 账号信息 */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-white/80">账号：</span>
            <span className="font-medium">{ACCOUNT_INFO.account}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-white/80" />
            <span className="text-white/80">总余额：</span>
            <span className="font-semibold">¥{ACCOUNT_INFO.totalBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="-mt-4 space-y-3 px-4">
        {REPAIR_PROJECTS.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6366F1] font-medium">项目名称：</span>
              <span className="text-text-primary text-right flex-1 ml-2">
                {project.name}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-[#6366F1] font-medium">赠送金额：</span>
              <span className="font-semibold text-text-primary">
                ¥{project.giftAmount.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(`/legacy-service/repair/form?projectId=${project.id}`)
              }
              className="mt-5 mx-auto block min-w-[120px] rounded-full border border-[#6366F1] px-8 py-2 text-sm font-medium text-[#6366F1] active:bg-[#EEF2FF]"
            >
              报修
            </button>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
