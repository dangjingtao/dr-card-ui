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
 * 风格与卡博士首页一致：浅色背景 + 白色卡片 + 淡金色点缀
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
    <PageContainer className="space-y-4 pb-6 pt-4">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-lg font-semibold text-text-primary">服务中心</h1>
      </div>

      {/* 客服欢迎语 */}
      <div className="flex items-start gap-2">
        <div
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #D4A853 0%, #B8893D 100%)' }}
        >
          <HeadphonesIcon className="h-6 w-6" />
        </div>
        <div className="max-w-[70%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-text-primary shadow-sm border border-border-subtle">
          Hi~欢迎来到卡博士
        </div>
      </div>

      {/* 两大入口 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => navigate('/legacy-service/repair/projects')}
          className="flex flex-col items-center gap-2 rounded-2xl bg-white py-6 shadow-sm border border-border-subtle active:bg-surface-secondary"
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
          className="flex flex-col items-center gap-2 rounded-2xl bg-white py-6 shadow-sm border border-border-subtle active:bg-surface-secondary"
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
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-border-subtle">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-semibold text-text-primary">热门问题</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1 rounded-full bg-[#FDF6E8] px-3 py-1 text-xs text-[#B8893D] active:bg-[#F7ECD0]"
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
