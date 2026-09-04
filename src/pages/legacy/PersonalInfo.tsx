import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUserInfo } from './userInfoStore'

const INFO_ITEMS = [
  { key: 'avatar', label: '头像', type: 'avatar' },
  { key: 'username', label: '用户名', type: 'text' },
  { key: 'nickname', label: '昵称', type: 'link', to: '/legacy-profile/nickname' },
  { key: 'realName', label: '真实姓名', type: 'link', to: '' },
  { key: 'studentId', label: '学号', type: 'text' },
  { key: 'school', label: '学校', type: 'text' },
  { key: 'academy', label: '学院', type: 'text' },
  { key: 'phone', label: '手机', type: 'link', to: '/legacy-profile/phone-change' },
  { key: 'email', label: '邮箱', type: 'link', to: '/legacy-profile/email' },
] as const

type InfoKey = (typeof INFO_ITEMS)[number]['key']

export default function PersonalInfo() {
  const navigate = useNavigate()
  const userInfo = useUserInfo()

  const getValue = (key: InfoKey): string => {
    switch (key) {
      case 'avatar':
        return userInfo.avatar
      case 'username':
        return userInfo.username
      case 'nickname':
        return userInfo.nickname
      case 'realName':
        return userInfo.realName
      case 'studentId':
        return userInfo.studentId
      case 'school':
        return userInfo.school
      case 'academy':
        return userInfo.academy
      case 'phone':
        return userInfo.phone
      case 'email':
        return userInfo.email
      default:
        return ''
    }
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
            个人信息
          </div>
        </div>
      </div>

      {/* 二维码区 */}
      <div className="flex shrink-0 flex-col items-center py-6">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          {/* 模拟二维码 */}
          <div className="h-36 w-36 grid grid-cols-8 grid-rows-8 gap-px">
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8)
              const col = i % 8
              const filled = (row * 7 + col * 13 + row * col) % 3 !== 0
              const isCorner =
                (row < 2 && col < 2) || (row < 2 && col > 5) || (row > 5 && col < 2)
              return (
                <div
                  key={i}
                  className={`${
                    isCorner || filled ? 'bg-gray-900' : 'bg-white'
                  }`}
                />
              )
            })}
          </div>
        </div>
        <div className="mt-3 text-sm text-text-secondary">
          账号：{userInfo.account}
        </div>
      </div>

      {/* 信息列表 */}
      <div className="mt-2 bg-white">
        {INFO_ITEMS.map((item, idx) => {
          const value = getValue(item.key)
          const isLast = idx === INFO_ITEMS.length - 1

          if (item.type === 'avatar') {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate('/legacy-profile/edit')}
                className={`flex w-full items-center justify-between px-5 py-3.5 active:bg-[#F8F8FA] ${
                  isLast ? '' : 'border-b border-border-light'
                }`}
              >
                <span className="text-sm text-[#B8893D]">{item.label}</span>
                <div className="flex items-center gap-2">
                  <img
                    src={value}
                    alt="头像"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                </div>
              </button>
            )
          }

          if (item.type === 'text') {
            return (
              <div
                key={item.key}
                className={`flex items-center justify-between px-5 py-3.5 ${
                  isLast ? '' : 'border-b border-border-light'
                }`}
              >
                <span className="text-sm text-[#B8893D]">{item.label}</span>
                <span className="max-w-[60%] truncate text-sm text-text-primary">
                  {value || '未完善'}
                </span>
              </div>
            )
          }

          // link type
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => item.to && navigate(item.to)}
              className={`flex w-full items-center justify-between px-5 py-3.5 active:bg-[#F8F8FA] ${
                isLast ? '' : 'border-b border-border-light'
              }`}
            >
              <span className="text-sm text-[#B8893D]">{item.label}</span>
              <div className="flex items-center gap-1">
                <span className="max-w-[150px] truncate text-sm text-text-primary">
                  {value || '未绑定'}
                </span>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
