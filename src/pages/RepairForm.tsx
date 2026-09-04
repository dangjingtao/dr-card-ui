import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, QrCode, Check } from 'lucide-react'
import PageContainer from '../components/mobile/PageContainer'
import { FAULT_OPTIONS, REPAIR_STAFF } from '../app/fixtures/service'

/**
 * 报修表单页（T034）
 */
export default function RepairForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId')

  const [deviceId, setDeviceId] = useState('')
  const [location, setLocation] = useState('')
  const [selectedFaults, setSelectedFaults] = useState<string[]>([])
  const [detail, setDetail] = useState('')
  const [phone, setPhone] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const toggleFault = (fault: string) => {
    setSelectedFaults((prev) =>
      prev.includes(fault) ? prev.filter((f) => f !== fault) : [...prev, fault],
    )
  }

  const handleSubmit = () => {
    if (!deviceId || selectedFaults.length === 0 || !phone) return
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      navigate(-1)
    }, 1500)
  }

  return (
    <PageContainer className="pb-0" inset={false}>
      {/* 紫色顶部栏 */}
      <div
        className="relative shrink-0 px-4 pt-12 pb-4 text-white"
        style={{ background: 'linear-gradient(180deg, #6366F1 0%, #818CF8 100%)' }}
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
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-medium">
            报修
          </div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="space-y-5 px-4 py-5">
        {/* 设备编号 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#6366F1]">
            <span className="text-red-500">*</span> 设备编号：
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="请输入10位数设备编号"
              maxLength={10}
              className="h-11 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-[#6366F1]"
            />
            <button
              type="button"
              aria-label="扫码获取设备编号"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[#6366F1] active:bg-surface-secondary"
            >
              <QrCode className="h-7 w-7" />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-[#6366F1]">
            手机扫描设备二维码，页面显示的10位符号即设备编号
          </p>
        </div>

        {/* 设备所在位置 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#6366F1]">
            设备所在位置：
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="请输入设备所在位置"
            className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-[#6366F1]"
          />
        </div>

        {/* 故障现象 */}
        <div>
          <label className="mb-3 block text-sm font-medium text-[#6366F1]">
            <span className="text-red-500">*</span> 选择设备故障现象：
          </label>
          <div className="space-y-3">
            {FAULT_OPTIONS.map((fault) => {
              const checked = selectedFaults.includes(fault)
              return (
                <button
                  key={fault}
                  type="button"
                  onClick={() => toggleFault(fault)}
                  className="flex w-full items-center gap-3 text-left active:bg-surface-secondary"
                >
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded border transition-colors ${
                      checked
                        ? 'border-[#6366F1] bg-[#6366F1] text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="text-sm text-text-primary">{fault}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 详情说明 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#6366F1]">
            详情说明：
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="请详细描述设备故障现象"
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-[#6366F1]"
          />
        </div>

        {/* 报修人电话 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#6366F1]">
            <span className="text-red-500">*</span> 报修人电话：
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入您的电话号码"
            maxLength={11}
            className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-[#6366F1]"
          />
        </div>

        {/* 提交按钮 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!deviceId || selectedFaults.length === 0 || !phone}
          className="mt-2 h-12 w-full rounded-full text-base font-medium text-white shadow-md disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #A5B4FC 100%)' }}
        >
          提交
        </button>
      </div>

      {/* 底部维修员信息 */}
      <div className="mt-4 bg-[#F2F2F7] px-4 py-5 text-sm text-text-secondary">
        <p>维修员姓名：{REPAIR_STAFF.name}</p>
        <p className="mt-2">维修员电话：{REPAIR_STAFF.phone}</p>
      </div>

      {/* 提交成功 toast */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="rounded-2xl bg-black/75 px-6 py-4 text-center text-white">
            <p className="text-sm">提交成功</p>
          </div>
        </div>
      )}

      {/* 隐藏 projectId 引用避免 tree-shake 警告 */}
      <span className="hidden">{projectId}</span>
    </PageContainer>
  )
}
