import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, ScanLine, X } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import DeviceListWithAd from '../components/mobile/DeviceListWithAd'
import {
  DEVICE_LISTS,
  DEVICE_THEMES,
  type DeviceInfo,
  type DeviceType,
} from '../app/fixtures/device'

/**
 * 设备列表页（T040：扫码启动版 + T041：广告位插入策略）
 * - 淋浴 / 洗烘 / 饮水 / 吹风 共用此组件
 * - 通过路由参数 :type 切换设备类型和主题色
 * - 卡片结构：设备图标 + 名称/位置/编号 + 状态 + 「扫码启动/扫码取水」按钮
 * - 卡片右侧按钮点击 → 弹本地扫码 BottomSheet（含模拟扫码完成）
 * - T041：设备列表中按数量插入广告位（≥3 中间 / <3 末尾）
 * - 顶部固定扫码按钮保持不变
 */
export default function DeviceListPage() {
  const navigate = useNavigate()
  const { type } = useParams<{ type: string }>()
  const deviceType = type as DeviceType

  const theme = DEVICE_THEMES[deviceType]
  const devices = DEVICE_LISTS[deviceType] ?? []

  const [scanTarget, setScanTarget] = useState<DeviceInfo | null>(null)

  const handleTopScan = () => {
    navigate(`/legacy-home/scan?device=${deviceType}`)
  }

  const handleScanStart = (device: DeviceInfo) => {
    setScanTarget(device)
  }

  const closeSheet = () => setScanTarget(null)

  const confirmScan = () => {
    if (!scanTarget) return
    const target = scanTarget
    setScanTarget(null)
    navigate(`/device/connecting?type=${deviceType}&id=${target.id}`)
  }

  if (!theme) {
    return <div className="p-4 text-center text-gray-500">设备类型不存在</div>
  }

  return (
    <div data-device-theme={deviceType} className="cd-app relative mx-auto flex h-full max-w-[480px] flex-col">
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

      {/* 设备列表（T041：按数量插入广告位） */}
      <div className="flex-1 overflow-y-auto bg-[#F5F6FA]">
        <PageContainer inset={false} className="py-4">
          <div className="px-4">
            <DeviceListWithAd
              items={devices}
              getKey={(device) => device.id}
              className="space-y-3"
              adProps={{
                title: `${theme.label}设备 · 限时充值福利`,
                subtitle: '满 50 减 8，新生专享 7 天',
                ctaText: '去看看',
                slotId: `device-list-${deviceType}`,
              }}
              renderItem={(device) => (
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
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

                  {/* 右侧按钮/状态（T040：扫码启动/扫码取水） */}
                  {device.status === 'idle' ? (
                    <button
                      type="button"
                      onClick={() => handleScanStart(device)}
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
              )}
            />
          </div>

          {/* 底部留白 */}
          <div className="h-24" />
        </PageContainer>
      </div>

      {/* 底部固定扫码按钮（保持不变） */}
      <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-[480px] px-4 pb-4 pt-2 bg-gradient-to-t from-[#F5F6FA] via-[#F5F6FA]/95 to-transparent">
        <button
          type="button"
          onClick={handleTopScan}
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

      {/* T040：扫码启动底部面板（卡片按钮触发） */}
      {scanTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-[env(safe-area-inset-bottom)]"
          role="presentation"
          onClick={closeSheet}
        >
          <div
            data-device-theme={deviceType}
            className="w-full max-w-[480px] overflow-hidden rounded-t-2xl bg-white shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部条 + 标题 */}
            <div className="relative px-5 pt-3 pb-3">
              <div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-gray-200" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <ScanLine className="h-4 w-4" style={{ color: 'var(--device-500)' }} />
                    <h3 className="text-base font-semibold text-text-primary">
                      {theme.buttonText} · {scanTarget.name}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">
                    将二维码 / 条形码对准下方扫描框，自动识别设备
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="关闭"
                  onClick={closeSheet}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-tertiary active:bg-surface-pressed"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 模拟扫描框（参考 LegacyScan 视觉） */}
            <div className="mx-5 rounded-2xl bg-black p-6">
              <div className="relative mx-auto aspect-square w-[220px] max-w-full">
                  <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-2xl border-l-4 border-t-4 border-white/90" aria-hidden />
                  <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-2xl border-r-4 border-t-4 border-white/90" aria-hidden />
                  <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-2xl border-b-4 border-l-4 border-white/90" aria-hidden />
                  <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-2xl border-b-4 border-r-4 border-white/90" aria-hidden />
                  <span
                    className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 rounded bg-white/80 shadow-[0_0_12px_2px_rgba(255,255,255,0.6)]"
                    aria-hidden
                  />
                </div>
              <p className="mt-4 text-center text-xs text-white/60">
                编号 {scanTarget.code}
              </p>
            </div>

            {/* 模拟扫码完成按钮 */}
            <div className="space-y-2 px-5 pt-4 pb-5">
              <button
                type="button"
                onClick={confirmScan}
                className="flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-white shadow-md active:opacity-90"
                style={{
                  background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)`,
                }}
              >
                模拟扫码完成
              </button>
              <p className="text-center text-[11px] text-text-tertiary">
                仅供设计演示：点击立即进入设备详情
              </p>
            </div>
          </div>
        </div>
      )}
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