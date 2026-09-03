import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import {
  DEVICE_LISTS,
  DEVICE_THEMES,
  type DeviceType,
} from '../app/fixtures/device'

/**
 * 设备列表页
 * - 淋浴 / 洗烘 / 饮水 / 吹风 共用此组件
 * - 通过路由参数 :type 切换设备类型和主题色
 * - 卡片结构：设备图标 + 名称/位置/编号 + 状态 + 扫码按钮
 */
export default function DeviceListPage() {
  const navigate = useNavigate()
  const { type } = useParams<{ type: string }>()
  const deviceType = type as DeviceType

  const theme = DEVICE_THEMES[deviceType]
  const devices = DEVICE_LISTS[deviceType] ?? []

  const handleScan = () => {
    navigate(`/legacy-home/scan?device=${deviceType}`)
  }

  const handleUse = (deviceId: string) => {
    navigate(`/device/connecting?type=${deviceType}&id=${deviceId}`)
  }

  if (!theme) {
    return <div className="p-4 text-center text-gray-500">设备类型不存在</div>
  }

  return (
    <div data-device-theme={deviceType} className="cd-app mx-auto flex h-full max-w-[480px] flex-col">
      {/* 顶部栏 */}
      <div
        className="relative shrink-0 px-4 pt-12 pb-4 text-white"
        style={{ background: `linear-gradient(180deg, var(--device-400) 0%, var(--device-500) 100%)` }}
      >
        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white active:bg-white/10"
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
            {theme.pageTitle}
          </h1>
          <button
            type="button"
            className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur active:bg-white/30"
            onClick={() => navigate('/points')}
          >
            账户余额
          </button>
        </div>
      </div>

      {/* 设备列表 */}
      <div className="flex-1 overflow-y-auto bg-[#F5F6FA]">
        <PageContainer inset={false} className="py-4">
          <div className="space-y-3 px-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                {/* 设备图标 */}
                <div
                  className="flex h-14 w-14 flex-none items-center justify-center rounded-xl"
                  style={{ background: theme.iconBg }}
                >
                  <DeviceIcon type={deviceType} />
                </div>

                {/* 设备信息 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-gray-800">{device.name}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        device.status === 'idle'
                          ? 'bg-green-100 text-green-700'
                          : device.status === 'in-use'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {device.status === 'idle' ? '空闲' : device.status === 'in-use' ? '使用中' : '离线'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 flex-none" />
                    <span className="truncate">{device.location}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-400">
                    编号：{device.code}
                  </div>
                </div>

                {/* 右侧按钮/状态 */}
                {device.status === 'idle' ? (
                  <button
                    type="button"
                    onClick={() => handleUse(device.id)}
                    className="flex-none rounded-full px-4 py-2 text-xs font-medium text-white shadow-sm active:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)`,
                    }}
                  >
                    {theme.buttonText}
                  </button>
                ) : (
                  <span className="flex-none rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-500">
                    使用中
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 底部留白 */}
          <div className="h-24" />
        </PageContainer>
      </div>

      {/* 底部固定扫码按钮 */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#F5F6FA] via-[#F5F6FA]/95 to-transparent">
        <button
          type="button"
          onClick={handleScan}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-white font-medium shadow-md active:opacity-90"
          style={{
            background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <path d="M7 12h10" />
          </svg>
          <span className="text-sm font-semibold">{theme.scanButtonText}</span>
        </button>
      </div>
    </div>
  )
}

function DeviceIcon({ type }: { type: DeviceType }) {
  const iconClass = 'h-7 w-7 text-white'

  switch (type) {
    case 'shower':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M12 2v6" />
          <path d="M8 6l4 4 4-4" />
          <path d="M5 12s2 3 7 3 7-3 7-3" />
          <path d="M5 16s2 3 7 3 7-3 7-3" />
        </svg>
      )
    case 'laundry':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="12" cy="12" r="5" />
          <path d="M12 7v1" />
          <path d="M12 16v1" />
          <path d="M7 12h-1" />
          <path d="M18 12h-1" />
        </svg>
      )
    case 'water':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z" />
        </svg>
      )
    case 'hairdryer':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M3 12h4a4 4 0 0 0 4-4V6" />
          <path d="M14 6h7v4h-7" />
          <path d="M18 10v10a2 2 0 0 1-2 2h-2" />
        </svg>
      )
  }
}
