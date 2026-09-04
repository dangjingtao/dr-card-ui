import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Camera } from 'lucide-react'
import { useUserInfo, userInfoActions } from './userInfoStore'

/* ---- 9 个预置头像（与 AvatarEditPage 共用） ---- */
const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=weixin',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar6',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar7',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar8',
]

/**
 * T026：编辑资料页
 * -------------------------------------------------------------
 * 一站式修改 头像 / 昵称 / 真实姓名（任务卡「实施要求」第 4 条）。
 * - 头像：点击 4×3 网格切换，外部预览实时更新；
 * - 昵称：必填，1-16 字；
 * - 真实姓名：必填，1-20 字；
 * - 点击「保存」一次性写回 store，再返回个人信息。
 */
export default function EditProfile() {
  const navigate = useNavigate()
  const userInfo = useUserInfo()

  /* 当前选中的预置头像 index；初值由 store.avatar 决定（找不到则回落到 0） */
  const initialAvatarIdx = Math.max(
    0,
    AVATAR_OPTIONS.findIndex((src) => src === userInfo.avatar),
  )
  const [avatarIdx, setAvatarIdx] = useState(initialAvatarIdx)
  const [nickname, setNickname] = useState(userInfo.nickname)
  const [realName, setRealName] = useState(userInfo.realName)
  const [saving, setSaving] = useState(false)
  const [nicknameErr, setNicknameErr] = useState('')
  const [realNameErr, setRealNameErr] = useState('')

  const handleSave = () => {
    if (saving) return

    let valid = true
    const trimmedNick = nickname.trim()
    const trimmedReal = realName.trim()
    if (!trimmedNick) {
      setNicknameErr('请填写昵称')
      valid = false
    } else if (trimmedNick.length > 16) {
      setNicknameErr('昵称长度不能超过 16 个字')
      valid = false
    } else {
      setNicknameErr('')
    }
    if (!trimmedReal) {
      setRealNameErr('请填写真实姓名')
      valid = false
    } else if (trimmedReal.length > 20) {
      setRealNameErr('真实姓名长度不能超过 20 个字')
      valid = false
    } else {
      setRealNameErr('')
    }
    if (!valid) return

    setSaving(true)
    setTimeout(() => {
      userInfoActions.update({
        avatar: AVATAR_OPTIONS[avatarIdx],
        nickname: trimmedNick,
        realName: trimmedReal,
      })
      setSaving(false)
      alert('保存成功')
      navigate('/legacy-profile/info')
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
            编辑资料
          </div>
        </div>
      </div>

      {/* 头像区 */}
      <div className="px-4 pt-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={AVATAR_OPTIONS[avatarIdx]}
                alt="头像预览"
                className="h-20 w-20 rounded-full border-2 border-[#D4A853] object-cover"
              />
              <div className="absolute right-0 bottom-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#D4A853] text-white shadow-md">
                <Camera className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-text-secondary">点击下方网格更换头像</div>
            <div className="mt-3 grid w-full grid-cols-5 gap-2">
              {AVATAR_OPTIONS.slice(0, 9).map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarIdx(idx)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                    avatarIdx === idx ? 'border-[#D4A853]' : 'border-transparent'
                  }`}
                >
                  <img src={src} alt={`头像${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 昵称 + 真实姓名 */}
      <div className="space-y-3 px-4 pt-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs text-text-secondary">昵称</div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value)
              setNicknameErr('')
            }}
            maxLength={20}
            className="mt-1 w-full bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
            placeholder="请输入昵称"
          />
          {nicknameErr && <div className="mt-1 text-xs text-red-500">{nicknameErr}</div>}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs text-text-secondary">真实姓名</div>
          <input
            type="text"
            value={realName}
            onChange={(e) => {
              setRealName(e.target.value)
              setRealNameErr('')
            }}
            maxLength={20}
            className="mt-1 w-full bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
            placeholder="请输入真实姓名"
          />
          {realNameErr && <div className="mt-1 text-xs text-red-500">{realNameErr}</div>}
        </div>
      </div>

      {/* 底部保存 */}
      <div className="flex-1" />
      <div className="px-4 pb-6 pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] py-3.5 text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
    </div>
  )
}
