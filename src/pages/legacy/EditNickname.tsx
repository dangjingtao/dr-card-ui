import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function EditNickname() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('微信用户')

  const handleSave = () => {
    // 保存逻辑（原型只做视觉）
    navigate(-1)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏 */}
      <div className="relative shrink-0 px-4 pt-3 pb-3">
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-text-primary"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-text-primary">
            修改昵称
          </div>
        </div>
      </div>

      {/* 输入框 */}
      <div className="px-4 pt-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full rounded-xl bg-bg-secondary px-4 py-3.5 text-base text-text-primary outline-none focus:ring-2 focus:ring-[#D4A853]/30"
          placeholder="请输入昵称"
        />
      </div>

      {/* 保存按钮 */}
      <div className="px-4 pt-6">
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-full py-3.5 text-base font-medium text-white shadow-lg shadow-[#D4A853]/25 active:opacity-90"
          style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)' }}
        >
          保存
        </button>
      </div>
    </div>
  )
}
