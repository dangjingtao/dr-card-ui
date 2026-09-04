import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Droplets } from 'lucide-react'

/* ---- Types & Fixture ---- */
interface Order {
  id: string
  orderNo: string
  status: 'completed' | 'pending' | 'paid' | 'failed' | 'cancelled'
  deviceName: string
  deviceNo: string
  amount: number
  createTime: string
  payMethod: string
}

const ORDER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'completed', label: '已完成' },
  { key: 'paid', label: '已支付' },
  { key: 'failed', label: '支付失败' },
  { key: 'cancelled', label: '已取消' },
] as const

const STATUS_TEXT: Record<Order['status'], string> = {
  completed: '已完成',
  pending: '待支付',
  paid: '已支付',
  failed: '支付失败',
  cancelled: '已取消',
}

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNo: '1782453905791814',
    status: 'completed',
    deviceName: 'B52001EAEF, 消费结算',
    deviceNo: 'B52001EAEF',
    amount: 0.25,
    createTime: '2026-06-26 14:05:05',
    payMethod: '项目小票支付',
  },
  {
    id: '2',
    orderNo: '1782429177814329',
    status: 'completed',
    deviceName: 'B52001EAEF, 消费结算',
    deviceNo: 'B52001EAEF',
    amount: 0.13,
    createTime: '2026-06-26 07:12:57',
    payMethod: '项目小票支付',
  },
  {
    id: '3',
    orderNo: '1782397550941772',
    status: 'completed',
    deviceName: 'B52001EAEF, 消费结算',
    deviceNo: 'B52001EAEF',
    amount: 0.12,
    createTime: '2026-06-25 22:25:50',
    payMethod: '项目小票支付',
  },
  {
    id: '4',
    orderNo: '1782395861322021',
    status: 'completed',
    deviceName: 'B52001EAEF, 消费结算',
    deviceNo: 'B52001EAEF',
    amount: 0.11,
    createTime: '2026-06-25 21:57:41',
    payMethod: '项目小票支付',
  },
  {
    id: '5',
    orderNo: '1782359970455570',
    status: 'completed',
    deviceName: 'B52001EAEF, 消费结算',
    deviceNo: 'B52001EAEF',
    amount: 0.08,
    createTime: '2026-06-25 19:30:12',
    payMethod: '项目小票支付',
  },
]

export default function OrdersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('tab') || 'all',
  )

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setSearchParams({ tab: key })
  }

  // 筛选订单
  const filteredOrders =
    activeTab === 'all'
      ? MOCK_ORDERS
      : MOCK_ORDERS.filter((o) => o.status === activeTab)

  return (
    <div className="flex min-h-full flex-col bg-[#F8F8FA]">
      {/* 顶部栏 */}
      <div className="relative shrink-0 px-4 pt-12 pb-4">
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
            订单
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="shrink-0 overflow-x-auto bg-white">
        <div className="flex min-w-full">
          {ORDER_TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className="relative shrink-0 px-4 py-3 text-sm"
              >
                <span
                  className={isActive ? 'font-semibold text-[#B8893D]' : 'text-text-secondary'}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#D4A853]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 订单列表 */}
      {filteredOrders.length > 0 ? (
        <div className="flex-1 space-y-3 p-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-white p-4 shadow-sm"
            >
              {/* 订单号 + 状态 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-tertiary">
                  订单号：{order.orderNo}
                </span>
                <span
                  className={`text-sm font-medium ${
                    order.status === 'completed'
                      ? 'text-text-secondary'
                      : order.status === 'pending'
                        ? 'text-[#FB923C]'
                        : order.status === 'failed'
                          ? 'text-[#EF4444]'
                          : 'text-[#22C55E]'
                  }`}
                >
                  {STATUS_TEXT[order.status]}
                </span>
              </div>

              {/* 设备信息 */}
              <div className="mt-3 flex items-start gap-3 border-t border-border-light pt-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #93C5FD 100%)' }}
                >
                  <Droplets className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-[#6366F1]">
                      设备:{order.deviceName}
                    </span>
                    <span className="shrink-0 text-base font-semibold text-[#6366F1]">
                      ¥{order.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-text-tertiary">
                    创建时间：{order.createTime}
                  </div>
                  <div className="mt-1 text-xs text-text-tertiary">
                    支付方式：{order.payMethod}
                  </div>
                </div>
              </div>

              {/* 订单详情按钮 */}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="rounded-full border border-text-tertiary/30 px-4 py-1.5 text-xs text-text-secondary"
                >
                  订单详情
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 空状态 */
        <div className="flex flex-1 flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#D4A853]/10 blur-xl" />
            <svg
              viewBox="0 0 100 100"
              className="relative h-28 w-28 text-[#D4A853]/30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {/* 文件图标 */}
              <rect x="25" y="15" width="35" height="50" rx="4" />
              <path d="M45 15 L60 30" />
              <line x1="33" y1="38" x2="52" y2="38" />
              <line x1="33" y1="46" x2="52" y2="46" />
              <line x1="33" y1="54" x2="45" y2="54" />
              {/* 第二个文件（叠在后面） */}
              <rect x="35" y="25" width="35" height="50" rx="4" />
              <path d="M55 25 L70 40" />
              <line x1="43" y1="48" x2="62" y2="48" />
              <line x1="43" y1="56" x2="62" y2="56" />
              <line x1="43" y1="64" x2="55" y2="64" />
            </svg>
          </div>
          <p className="mt-4 text-sm text-text-tertiary">暂无数据</p>
        </div>
      )}
    </div>
  )
}
