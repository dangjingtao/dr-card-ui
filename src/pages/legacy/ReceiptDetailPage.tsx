import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Store, Printer, Clock, User, Tag, FileText } from 'lucide-react'

/* ---- Fixture ---- */
const RECEIPT_DETAIL_MAP: Record<string, any> = {
  '1': {
    id: '1',
    shopName: '卡博士展厅（骏盈大厦）',
    deviceName: '4G蓝牙消费机-01438',
    receiptNo: 'XP202608150001',
    orderNo: '1782453905791814',
    cashier: '系统自动',
    payTime: '2026-08-15 14:32:18',
    orderType: '淋浴消费',
    deviceNo: 'B42000059E',
    items: [
      { name: '淋浴使用', spec: '热水', qty: '17分钟', price: '0.14/分钟', amount: 2.38 },
      { name: '服务费', spec: '', qty: '1', price: '0.12', amount: 0.12 },
    ],
    totalAmount: 2.5,
    discountAmount: 0,
    balancePay: 2.5,
    actualPay: 2.5,
    status: 'paid',
  },
  '2': {
    id: '2',
    shopName: 'A栋1楼洗衣房',
    deviceName: '洗衣机-A栋1楼001',
    receiptNo: 'XP202608140023',
    orderNo: '1782429177814329',
    cashier: '系统自动',
    payTime: '2026-08-14 20:15:42',
    orderType: '洗烘消费',
    deviceNo: 'W100012345',
    items: [
      { name: '标准洗', spec: '45分钟', qty: '1', price: '4.00', amount: 4.0 },
    ],
    totalAmount: 4.0,
    discountAmount: 0,
    balancePay: 4.0,
    actualPay: 4.0,
    status: 'paid',
  },
  '3': {
    id: '3',
    shopName: 'B栋大堂',
    deviceName: '直饮机-B栋大堂',
    receiptNo: 'XP202608130017',
    orderNo: '1782385621093456',
    cashier: '系统自动',
    payTime: '2026-08-13 09:45:30',
    orderType: '饮水消费',
    deviceNo: 'W200087654',
    items: [
      { name: '温水', spec: '45°C', qty: '500ml', price: '0.50', amount: 0.5 },
    ],
    totalAmount: 0.5,
    discountAmount: 0,
    balancePay: 0.5,
    actualPay: 0.5,
    status: 'paid',
  },
  '4': {
    id: '4',
    shopName: 'C栋3楼淋浴间',
    deviceName: '吹风机-C栋3楼',
    receiptNo: 'XP202608120009',
    orderNo: '1782362189045678',
    cashier: '系统自动',
    payTime: '2026-08-12 22:08:55',
    orderType: '吹风消费',
    deviceNo: 'H300054321',
    items: [
      { name: '吹风使用', spec: '中档', qty: '6分钟', price: '0.20/分钟', amount: 1.2 },
    ],
    totalAmount: 1.2,
    discountAmount: 0,
    balancePay: 1.2,
    actualPay: 1.2,
    status: 'paid',
  },
  '5': {
    id: '5',
    shopName: '卡博士展厅（骏盈大厦）',
    deviceName: '4G蓝牙消费机-01420',
    receiptNo: 'XP202608100005',
    orderNo: '1782301245678901',
    cashier: '系统自动',
    payTime: '2026-08-10 16:20:10',
    orderType: '淋浴消费',
    deviceNo: 'B42000057A',
    items: [
      { name: '淋浴使用', spec: '温水', qty: '25分钟', price: '0.14/分钟', amount: 3.5 },
      { name: '服务费', spec: '', qty: '1', price: '0.30', amount: 0.3 },
    ],
    totalAmount: 3.8,
    discountAmount: 0,
    balancePay: 3.8,
    actualPay: 3.8,
    status: 'paid',
  },
}

export default function ReceiptDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const receipt = RECEIPT_DETAIL_MAP[id] || RECEIPT_DETAIL_MAP['1']

  if (!receipt) return null

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
            小票详情
          </div>
          <button
            type="button"
            className="ml-auto flex h-10 w-10 items-center justify-center text-text-secondary"
          >
            <Printer className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 pb-8 pt-1">
        {/* 小票头部卡片 */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* 店名 + 已支付标签 */}
          <div
            className="relative px-5 pt-5 pb-4"
            style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-white" />
                <div className="text-base font-semibold text-white">{receipt.shopName}</div>
              </div>
              <div className="rounded-full bg-white/25 px-3 py-0.5 text-xs font-medium text-white backdrop-blur">
                已支付
              </div>
            </div>
            <div className="mt-1 text-sm text-white/80">{receipt.deviceName}</div>

            {/* 锯齿分割 */}
            <div className="absolute bottom-0 left-0 right-0 flex">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 flex-1"
                  style={{
                    background:
                      i % 2 === 0
                        ? 'radial-gradient(circle at 0 0, transparent 50%, #F8F8FA 50%)'
                        : 'radial-gradient(circle at 100% 0, transparent 50%, #F8F8FA 50%)',
                    backgroundSize: '100% 100%',
                  }}
                />
              ))}
            </div>
          </div>

          {/* 小票信息 */}
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-tertiary">
                <Tag className="h-4 w-4" />
                <span>小票编号</span>
              </div>
              <div className="font-medium text-text-primary">{receipt.receiptNo}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-tertiary">
                <FileText className="h-4 w-4" />
                <span>订单编号</span>
              </div>
              <div className="font-medium text-text-primary">{receipt.orderNo}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-tertiary">
                <User className="h-4 w-4" />
                <span>收银员</span>
              </div>
              <div className="font-medium text-text-primary">{receipt.cashier}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-tertiary">
                <Clock className="h-4 w-4" />
                <span>支付时间</span>
              </div>
              <div className="font-medium text-text-primary">{receipt.payTime}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-tertiary">
                <Store className="h-4 w-4" />
                <span>订单类型</span>
              </div>
              <div className="font-medium text-text-primary">{receipt.orderType}</div>
            </div>
          </div>
        </div>

        {/* 消费明细 */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-divider px-5 py-3">
            <div className="text-sm font-semibold text-text-primary">消费明细</div>
          </div>
          <div className="px-5 py-3">
            {/* 表头 */}
            <div className="mb-2 flex items-center text-xs text-text-tertiary">
              <div className="flex-1">项目</div>
              <div className="w-16 text-right">数量</div>
              <div className="w-20 text-right">金额</div>
            </div>
            {/* 明细行 */}
            {receipt.items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-start py-2 text-sm">
                <div className="flex-1">
                  <div className="font-medium text-text-primary">{item.name}</div>
                  {item.spec && (
                    <div className="mt-0.5 text-xs text-text-tertiary">{item.spec}</div>
                  )}
                </div>
                <div className="w-16 text-right text-text-secondary">{item.qty}</div>
                <div className="w-20 text-right font-medium text-text-primary">
                  ¥{item.amount.toFixed(2)}
                </div>
              </div>
            ))}
            {/* 合计 */}
            <div className="mt-2 flex items-center justify-between border-t border-dashed border-divider pt-3">
              <div className="text-sm text-text-tertiary">合计</div>
              <div className="text-lg font-bold text-[#B8893D]">
                ¥{receipt.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 支付详情 */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-divider px-5 py-3">
            <div className="text-sm font-semibold text-text-primary">支付详情</div>
          </div>
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary">余额支付</span>
              <span className="font-medium text-text-primary">
                ¥{receipt.balancePay.toFixed(2)}
              </span>
            </div>
            {receipt.discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">优惠减免</span>
                <span className="font-medium text-[#34D399]">
                  -¥{receipt.discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-dashed border-divider pt-3 text-sm">
              <span className="font-medium text-text-primary">实付金额</span>
              <span className="text-lg font-bold text-[#B8893D]">
                ¥{receipt.actualPay.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
