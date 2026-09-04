import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  HeadphonesIcon,
  MessageSquarePlus,
  RefreshCw,
  WrenchIcon,
} from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import { HOT_QUESTION_BATCHES, type HotQuestion } from '../app/fixtures/service'

/**
 * 卡博士服务中心（T034）
 * 客服欢迎 + 设备报修/意见反馈入口 + 热门问题 + 换一换
 */
export default function LegacyService() {
  const navigate = useNavigate()
  const [batchIndex, setBatchIndex] = useState(0)
  const [activeQuestion, setActiveQuestion] = useState<HotQuestion | null>(null)

  const questions = useMemo(
    () => HOT_QUESTION_BATCHES[batchIndex % HOT_QUESTION_BATCHES.length],
    [batchIndex],
  )

  const handleRefresh = () => {
    setBatchIndex((i) => (i + 1) % HOT_QUESTION_BATCHES.length)
  }

  return (
    <PageContainer className="space-y-4 pb-6" inset={false}>
      {/* 顶部渐变区 */}
      <div
        className="relative px-4 pt-12 pb-20"
        style={{ background: 'linear-gradient(180deg, #D4E8F5 0%, #E8F4FB 100%)' }}
      >
        <div className="text-center text-lg font-medium text-[#2C3E50]">服务中心</div>
      </div>

      {/* 内容区（向上负margin覆盖渐变） */}
      <div className="-mt-16 space-y-4 px-4">
        {/* 客服欢迎语 */}
        <div className="flex items-start gap-2">
          <div
            className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
          >
            <HeadphonesIcon className="h-6 w-6" />
          </div>
          <div className="max-w-[70%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-text-primary shadow-sm">
            Hi~欢迎来到卡博士
          </div>
        </div>

        {/* 两大入口 */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => navigate('/legacy-service/repair/projects')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white py-6 shadow-sm active:bg-surface-secondary"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' }}
            >
              <WrenchIcon className="h-7 w-7" />
            </div>
            <span className="text-sm font-medium text-text-primary">设备报修</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/legacy-service/feedback')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white py-6 shadow-sm active:bg-surface-secondary"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)' }}
            >
              <MessageSquarePlus className="h-7 w-7" />
            </div>
            <span className="text-sm font-medium text-text-primary">意见反馈</span>
          </button>
        </div>

        {/* 热门问题 */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-semibold text-[#6366F1]">热门问题</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1 rounded-full bg-[#F0F4FF] px-3 py-1 text-xs text-[#6366F1] active:bg-[#E0E7FF]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              换一换
            </button>
          </div>
          <div className="divide-y divide-border-subtle">
            {questions.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setActiveQuestion(q)}
                className="flex w-full items-center justify-between py-3.5 text-left active:bg-surface-secondary"
              >
                <span className="text-sm text-text-primary">{q.title}</span>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 热门问题详情弹窗 */}
      {activeQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setActiveQuestion(null)}
        >
          <div
            className="mx-auto w-full max-w-[480px] rounded-t-3xl bg-white p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-subtle" />
            <h3 className="mb-4 text-base font-semibold text-text-primary">
              {activeQuestion.title}
            </h3>
            <div className="space-y-2 text-sm text-text-secondary">
              <p className="font-medium text-text-primary">常见原因：</p>
              {activeQuestion.reasons.map((reason, idx) => (
                <p key={idx}>{reason}</p>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-text-tertiary">
              以上内容仅供参考
            </p>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
