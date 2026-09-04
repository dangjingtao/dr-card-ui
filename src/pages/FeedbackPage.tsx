import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'

/**
 * 意见反馈页（T034）
 */
export default function FeedbackPage() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = () => {
    if (!content.trim()) return
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      navigate('/legacy-service')
    }, 1500)
  }

  return (
    <PageContainer className="pb-6" inset={false}>
      {/* 紫色顶部栏 */}
      <div
        className="relative shrink-0 px-4 pt-12 pb-4 text-white"
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
            意见反馈
          </div>
        </div>
      </div>

      {/* 反馈内容 */}
      <div className="px-4 py-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="感谢您对我们的产品提出宝贵的建议和意见~"
          rows={10}
          className="w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-4 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-[#6366F1]"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="mt-6 h-12 w-full rounded-full text-base font-medium text-white shadow-md disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #A5B4FC 100%)' }}
        >
          提交
        </button>
      </div>

      {/* 提交成功 toast */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="rounded-2xl bg-black/75 px-6 py-4 text-center text-white">
            <p className="text-sm">提交成功</p>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
