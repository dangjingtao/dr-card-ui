import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Camera, Image as ImageIcon } from 'lucide-react'
import { useUserInfo, userInfoActions } from './userInfoStore'

export default function AvatarEditPage() {
  const navigate = useNavigate()
  const userInfo = useUserInfo()
  const [customAvatar, setCustomAvatar] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const albumInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  /* 头像只能通过相册/拍照上传更换；未上传时沿用 store 当前头像 */
  const currentAvatar = customAvatar ?? userInfo.avatar

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setCustomAvatar(result)
    }
    reader.readAsDataURL(file)
    /* 允许重复选择同一张图 */
    e.target.value = ''
  }

  const handleSave = () => {
    if (saving) return
    setSaving(true)
    /* 模拟异步保存；成功后回写 store */
    setTimeout(() => {
      userInfoActions.update({ avatar: currentAvatar })
      setSaving(false)
      alert('头像保存成功')
      navigate(-1)
    }, 400)
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
            修改头像
          </div>
        </div>
      </div>

      {/* 头像预览区 */}
      <div className="px-4 pt-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={currentAvatar}
                alt="头像预览"
                className="h-28 w-28 rounded-full border-2 border-[#D4A853] object-cover"
              />
              <button
                type="button"
                aria-label="从相册选择"
                onClick={() => albumInputRef.current?.click()}
                className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#D4A853] text-white shadow-md active:opacity-80"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 text-sm text-text-secondary">点击拍照或从相册选择</div>
          </div>
        </div>
      </div>

      {/* 操作按钮（相册/拍照） */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => albumInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm text-text-primary shadow-sm active:bg-[#F8F8FA]"
          >
            <ImageIcon className="h-4 w-4 text-[#D4A853]" />
            从相册选择
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm text-text-primary shadow-sm active:bg-[#F8F8FA]"
          >
            <Camera className="h-4 w-4 text-[#D4A853]" />
            拍照
          </button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        onChange={handleFilePick}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFilePick}
        className="hidden"
      />

      {/* 底部保存按钮 */}
      <div className="flex-1" />
      <div className="px-4 pb-6 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] py-3.5 text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {saving ? '保存中…' : '保存头像'}
        </button>
      </div>
    </div>
  )
}
