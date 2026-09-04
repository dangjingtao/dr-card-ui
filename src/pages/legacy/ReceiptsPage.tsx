import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, Receipt } from 'lucide-react'

/* ---- Types & Fixture ---- */
interface ReceiptItem {
  id: string
  receiptNo: string
  orderNo: string
  deviceName: string
  deviceNo: string
  amount: number
  date: string
  time: string
  shopName: string
  type: 'shower' | 'laundry' | 'water' | 'hairdryer'
}

const MOCK_RECEIPTS: ReceiptItem[] = [
  {
    id: '1',
    receiptNo: 'XP202608150001',
    orderNo: '1782453905791814',
    deviceName: '4G蓝牙消费机-01438',
    deviceNo: 'B42000059E',
    amount: 2.5,
    date: '2026-08-15',
    time: '14:32:18',
    shopName: '卡博士展厅（骏盈大厦）',
    type: 'shower',
  },
  {
    id: '2',
    receiptNo: 'XP202608140023',
    orderNo: '1782429177814329',
    deviceName: '洗衣机-A栋1楼001',
    deviceNo: 'W100012345',
    amount: 4.0,
    date: '2026-08-14',
    time: '20:15:42',
    shopName: 'A栋1楼洗衣房',
    type: 'laundry',
  },
  {
    id: '3',
    receiptNo: 'XP202608130017',
    orderNo: '1782385621093456',
    deviceName: '直饮机-B栋大堂',
    deviceNo: 'W200087654',
    amount: 0.5,
    date: '2026-08-13',
    time: '09:45:30',
    shopName: 'B栋大堂',
    type: 'water',
  },
  {
    id: '4',
    receiptNo: 'XP202608120009',
    orderNo: '1782362189045678',
    deviceName: '吹风机-C栋3楼',
    deviceNo: 'H300054321',
    amount: 1.2,
    date: '2026-08-12',
    time: '22:08:55',
    shopName: 'C栋3楼淋浴间',
    type: 'hairdryer',
  },
  {
    id: '5',
    receiptNo: 'XP202608100005',
    orderNo: '1782301245678901',
    deviceName: '4G蓝牙消费机-01420',
    deviceNo: 'B42000057A',
    amount: 3.8,
    date: '2026-08-10',
    time: '16:20:10',
    shopName: '卡博士展厅（骏盈大厦）',
    type: 'shower',
  },
]

const TYPE_LABEL: Record<ReceiptItem['type'], string> = {
  shower: '淋浴',
  laundry: '洗烘',
  water: '饮水',
  hairdryer: '吹风',
}

export default function ReceiptsPage() {
  const navigate = useNavigate()
  const [activeYear, setActiveYear] = useState('2026')
  const [activeMonth, setActiveMonth] = useState('08')

  const years = ['2026', '2025']
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

  const filteredReceipts = useMemo(() => {
    return MOCK_RECEIPTS.filter((r) => {
      const [y, m] = r.date.split('-')
      return y === activeYear && m === activeMonth
    })
  }, [activeYear, activeMonth])

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
            我的小票
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="shrink-0 border-b border-divider bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          {/* 年份选择 */}
          <div className="relative">
            <select
              value={activeYear}
              onChange={(e) => setActiveYear(e.target.value)}
              className="appearance-none rounded-full bg-[#F5F5F7] py-1.5 pl-4 pr-8 text-sm font-medium text-text-primary focus:outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          </div>

          {/* 月份选择 */}
          <div className="relative">
            <select
              value={activeMonth}
              onChange={(e) => setActiveMonth(e.target.value)}
              className="appearance-none rounded-full bg-[#F5F5F7] py-1.5 pl-4 pr-8 text-sm font-medium text-text-primary focus:outline-none"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          </div>

          <div className="ml-auto text-xs text-text-tertiary">
            共 {filteredReceipts.length} 张小票
          </div>
        </div>
      </div>

      {/* 小票列表 */}
      {filteredReceipts.length > 0 ? (
        <div className="flex-1 space-y-3 p-4">
          {filteredReceipts.map((receipt) => (
            <button
              key={receipt.id}
              type="button"
              onClick={() => navigate(`/legacy-profile/receipts/${receipt.id}`)}
              className="w-full rounded-2xl bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
            >
              {/* 顶部：日期 + 金额 */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-semibold text-text-primary">
                    {receipt.date}
                  </div>
                  <div className="mt-0.5 text-xs text-text-tertiary">
                    {receipt.time}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#B8893D]">
                    ¥{receipt.amount.toFixed(2)}
                  </div>
                  <div className="mt-0.5 text-xs text-text-tertiary">
                    {TYPE_LABEL[receipt.type]}
                  </div>
                </div>
              </div>

              {/* 分割线 */}
              <div className="my-3 border-t border-dashed border-divider" />

              {/* 底部：设备信息 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                    style={{
                      background:
                        receipt.type === 'shower'
                          ? 'linear-gradient(135deg, #818CF8, #A5B4FC)'
                          : receipt.type === 'laundry'
                            ? 'linear-gradient(135deg, #34D399, #6EE7B7)'
                            : receipt.type === 'water'
                              ? 'linear-gradient(135deg, #60A5FA, #93C5FD)'
                              : 'linear-gradient(135deg, #FBBF24, #FCD34D)',
                    }}
                  >
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">
                      {receipt.deviceName}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      编号：{receipt.deviceNo}
                    </div>
                  </div>
                </div>
                <ChevronLeft className="h-4 w-4 rotate-180 text-text-tertiary" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-text-tertiary">
          <Receipt className="mb-3 h-12 w-12 opacity-30" />
          <div className="text-sm">暂无小票记录</div>
        </div>
      )}
    </div>
  )
}
