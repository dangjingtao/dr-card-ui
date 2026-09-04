import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  MapPin,
  Star,
  Clock,
  Droplets,
  WashingMachine,
  GlassWater,
  Wind,
} from 'lucide-react'
import { DEVICE_THEMES } from '../../app/fixtures/device'

const DEVICE_ICONS = {
  shower: Droplets,
  laundry: WashingMachine,
  water: GlassWater,
  hairdryer: Wind,
} as const

/* ---- Types & Fixture ---- */
interface DeviceItem {
  id: string
  name: string
  location: string
  code: string
  type: 'shower' | 'laundry' | 'water' | 'hairdryer'
  isFavorite?: boolean
  isFrequent?: boolean
  lastUsed?: string
}

const MOCK_DEVICES: DeviceItem[] = [
  {
    id: '1',
    name: '4G蓝牙消费机-01438',
    location: '卡博士展厅（骏盈大厦）',
    code: 'B42000059E',
    type: 'shower',
    isFavorite: true,
    isFrequent: true,
    lastUsed: '2026-08-15 14:32',
  },
  {
    id: '2',
    name: '洗衣机-A栋1楼001',
    location: 'A栋1楼洗衣房',
    code: 'W100012345',
    type: 'laundry',
    isFavorite: true,
    isFrequent: true,
    lastUsed: '2026-08-14 20:15',
  },
  {
    id: '3',
    name: '直饮机-B栋大堂',
    location: 'B栋大堂',
    code: 'W200087654',
    type: 'water',
    isFavorite: false,
    isFrequent: true,
    lastUsed: '2026-08-13 09:45',
  },
  {
    id: '4',
    name: '吹风机-C栋3楼',
    location: 'C栋3楼淋浴间',
    code: 'H300054321',
    type: 'hairdryer',
    isFavorite: true,
    isFrequent: false,
    lastUsed: '2026-08-12 22:08',
  },
  {
    id: '5',
    name: '4G蓝牙消费机-01420',
    location: '卡博士展厅（骏盈大厦）',
    code: 'B42000057A',
    type: 'shower',
    isFavorite: false,
    isFrequent: true,
    lastUsed: '2026-08-10 16:20',
  },
]

function DeviceIcon({ type }: { type: DeviceItem['type'] }) {
  const theme = DEVICE_THEMES[type]
  const Icon = DEVICE_ICONS[type]
  return (
    <div
      className="flex h-14 w-14 flex-none items-center justify-center rounded-xl text-white"
      style={{ background: theme.iconBg }}
    >
      <Icon className="h-7 w-7" />
    </div>
  )
}

export default function DeviceListSimplePage() {
  const { type = 'frequent' } = useParams()
  const navigate = useNavigate()

  const isFavorite = type === 'favorite'
  const title = isFavorite ? '收藏设备' : '常用设备'
  const TagIcon = isFavorite ? Star : Clock

  const devices = useMemo(() => {
    if (isFavorite) return MOCK_DEVICES.filter((d) => d.isFavorite)
    return MOCK_DEVICES.filter((d) => d.isFrequent)
  }, [isFavorite])

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-3"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
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
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            {title}
          </div>
        </div>
      </div>

      {/* 设备列表 */}
      {devices.length > 0 ? (
        <div className="flex-1 space-y-3 p-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
            >
              {/* 设备图标 */}
              <DeviceIcon type={device.type} />

              {/* 设备信息 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-text-primary">
                    {device.name}
                  </h3>
                  <span
                    className={`flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isFavorite
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <TagIcon className="h-3 w-3" fill={isFavorite ? 'currentColor' : 'none'} />
                    {isFavorite ? '已收藏' : '常用'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
                  <MapPin className="h-3 w-3 flex-none" />
                  <span className="truncate">{device.location}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-text-tertiary/70">
                  编号：{device.code}
                </div>
                {device.lastUsed && (
                  <div className="mt-1 text-[11px] text-text-tertiary/50">
                    最近使用：{device.lastUsed}
                  </div>
                )}
              </div>

              {/* 右侧星星 */}
              <button
                type="button"
                className="flex h-8 w-8 flex-none items-center justify-center text-amber-400"
              >
                <Star
                  className="h-5 w-5"
                  fill={isFavorite ? 'currentColor' : 'none'}
                  strokeWidth={1.5}
                />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-text-tertiary">
          <TagIcon className="mb-3 h-12 w-12 opacity-30" />
          <div className="text-sm">
            暂无{isFavorite ? '收藏' : '常用'}设备
          </div>
        </div>
      )}
    </div>
  )
}
