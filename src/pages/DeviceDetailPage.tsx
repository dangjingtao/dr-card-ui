import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MapPin, OctagonX, Wallet, Check, Wrench, Shield, Plus } from 'lucide-react'
import {
  DEVICE_LISTS,
  DEVICE_THEMES,
  type DeviceType,
} from '../app/fixtures/device'
import { cardActions } from './legacy/cardStore'

type DevicePhase = 'idle' | 'starting' | 'running'

const AMOUNTS = [1, 3, 5, 10, 20]

/* T040：快速充值档位 */
const QUICK_RECHARGE_AMOUNTS = [5, 10, 20, 50]

// T030：淋浴 / 饮水 扫码后直接启动，跳过金额选择
const AUTO_START_TYPES: DeviceType[] = ['shower', 'water']

// 四步启动状态
const START_STEPS = [
  '设备连接成功',
  '下发启动指令成功',
  '查询启动状态成功',
  '启动成功',
]

/**
 * 设备详情页（扫码后进入）
 * - 淋浴 / 饮水：扫码后直接启动 → 运行中 → 结算（T030 优化，跳过金额选择）
 * - 洗烘 / 吹风：选择金额 → 确定启动 → 四步启动动画 → 运行中 → 结算 → 弹窗
 * - 右上角紧急停止按钮
 * - 右下角保修悬浮球
 */
export default function DeviceDetailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceType = (searchParams.get('type') as DeviceType) ?? 'shower'
  const deviceId = searchParams.get('id') ?? ''

  const theme = DEVICE_THEMES[deviceType]
  const device = DEVICE_LISTS[deviceType]?.find((d) => d.id === deviceId)
    ?? DEVICE_LISTS[deviceType]?.[0]
    ?? null

  const isAutoStart = AUTO_START_TYPES.includes(deviceType)

  const [selectedAmount, setSelectedAmount] = useState(5)
  const [phase, setPhase] = useState<DevicePhase>('idle')
  const [currentStep, setCurrentStep] = useState(-1) // -1 = 未开始
  const [balance, setBalance] = useState(5.0)
  const [usedAmount, setUsedAmount] = useState(0)
  const [showSettleDialog, setShowSettleDialog] = useState(false)
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)

  /* T040：快速充值弹窗状态 */
  const [showRechargeDialog, setShowRechargeDialog] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState<number>(QUICK_RECHARGE_AMOUNTS[1])
  const [recharging, setRecharging] = useState(false)
  const [rechargedAmount, setRechargedAmount] = useState<number | null>(null)

  // T030：淋浴 / 饮水 进入页面后自动启动
  useEffect(() => {
    if (!isAutoStart) return
    if (phase !== 'idle') return
    if (selectedAmount > balance) return
    setCurrentStep(-1)
    setPhase('starting')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoStart])

  // 启动流程动画
  useEffect(() => {
    if (phase !== 'starting') return
    const timers = START_STEPS.map((_, i) =>
      setTimeout(() => setCurrentStep(i), i * 700),
    )
    const finishTimer = setTimeout(() => {
      setPhase('running')
    }, START_STEPS.length * 700)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(finishTimer)
    }
  }, [phase])

  const handleStart = () => {
    if (selectedAmount > balance) return
    setCurrentStep(-1)
    setPhase('starting')
  }

  const handleSettle = () => {
    const cost = +(selectedAmount * 0.4).toFixed(2)
    setUsedAmount(cost)
    setShowSettleDialog(true)
  }

  const confirmSettle = () => {
    setBalance((b) => +(b - usedAmount).toFixed(2))
    setShowSettleDialog(false)
    setPhase('idle')
    setCurrentStep(-1)
  }

  const handleEmergencyStop = () => {
    if (phase === 'idle') return
    const cost = +(selectedAmount * 0.2).toFixed(2)
    setUsedAmount(cost)
    setShowEmergencyDialog(true)
  }

  const confirmEmergency = () => {
    setBalance((b) => +(b - usedAmount).toFixed(2))
    setShowEmergencyDialog(false)
    setPhase('idle')
    setCurrentStep(-1)
  }

  /* T040：快速充值 — 打开弹窗（默认选中 10 元档） */
  const handleOpenRecharge = () => {
    setRechargeAmount(QUICK_RECHARGE_AMOUNTS[1])
    setShowRechargeDialog(true)
  }

  const handleCloseRecharge = () => {
    if (recharging) return
    setShowRechargeDialog(false)
    setRechargedAmount(null)
  }

  /* T040：快速充值 — 确认充值
   * - mock 600ms 请求
   * - 入账到 cardStore（全局账户余额），并同步本设备详情 balance 状态
   * - 充值成功二级弹窗展示「¥amount 已到账」 */
  const handleConfirmRecharge = async () => {
    if (recharging) return
    setRecharging(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    /* 累加 cardStore.balance（按 card-001 累加；其它卡时取首张） */
    const list = cardActions.get()
    const target = list[0]
    if (target) {
      cardActions.set(
        list.map((c) =>
          c.id === target.id ? { ...c, balance: +(c.balance + rechargeAmount).toFixed(2) } : c
        )
      )
    }
    setBalance((b) => +(b + rechargeAmount).toFixed(2))
    setRechargedAmount(rechargeAmount)
    setRecharging(false)
  }

  const handleRechargeSuccessDone = () => {
    setRechargedAmount(null)
    setShowRechargeDialog(false)
  }

  if (!theme || !device) {
    return <div className="p-4 text-center text-gray-500">设备不存在</div>
  }

  const getStepStatus = (index: number): 'done' | 'active' | 'pending' => {
    if (phase === 'running') return 'done'
    if (currentStep > index) return 'done'
    if (currentStep === index) return 'active'
    return 'pending'
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
            onClick={handleEmergencyStop}
            disabled={phase === 'idle'}
            className="flex h-8 items-center gap-1 rounded-full bg-red-500 px-3 text-xs font-medium text-white shadow-sm active:bg-red-600 disabled:opacity-40"
          >
            <OctagonX className="h-3.5 w-3.5" />
            <span>紧急停止</span>
          </button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="relative flex-1 overflow-y-auto bg-[#F5F6FA]">
        {/* 设备信息卡片 */}
        <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            {/* 设备大图标 */}
            <div
              className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl shadow-sm"
              style={{ background: theme.iconBg }}
            >
              <DeviceIcon type={deviceType} />
            </div>
            {/* 设备信息 */}
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-gray-800">{device.name}</h2>
                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  空闲
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3 flex-none" />
                <span className="truncate">{device.location}</span>
              </div>
              <div className="mt-1 text-[11px] text-gray-400">
                编号：{device.code}
              </div>
            </div>
          </div>
        </div>

        {/* 账户余额（T040：右侧加「+ 充值」胶囊按钮；余额不足时按钮变红描边） */}
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">账户余额</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold" style={{ color: 'var(--device-500)' }}>
              ¥{balance.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={handleOpenRecharge}
              /* T040（2026-09-07 用户决定）：扫码进入设备详情后，任何阶段（idle / starting / running）
               * 都可以点「充值」快速充值，不限制 phase。避免用户机器上余额不足时
               * 还要先结束流程才能充值的链路。 */
              className={`flex h-7 items-center gap-1 rounded-full px-3 text-xs font-medium shadow-sm active:opacity-70 ${
                selectedAmount > balance
                  ? 'border border-danger bg-danger-bg text-danger-text'
                  : 'border border-transparent'
              }`}
              style={
                selectedAmount > balance
                  ? undefined
                  : { backgroundColor: 'var(--device-100)', color: 'var(--device-600)' }
              }
            >
              <Plus className="h-3 w-3" />
              充值
            </button>
          </div>
        </div>

        {/* 选择金额（洗烘/吹风展示；淋浴/饮水直接启动，不展示） */}
        {!isAutoStart && (
          <div className="mx-4 mt-3 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-700">选择金额</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => phase === 'idle' && setSelectedAmount(amount)}
                  disabled={phase !== 'idle'}
                  className={`h-9 min-w-[60px] rounded-full px-4 text-sm font-medium transition ${
                    selectedAmount === amount
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  } disabled:opacity-60`}
                  style={
                    selectedAmount === amount
                      ? { background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)` }
                      : undefined
                  }
                >
                  {amount}元
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 启动状态（四步，始终展示） */}
        <div className="mx-4 mt-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="space-y-3.5">
            {START_STEPS.map((step, index) => {
              const status = getStepStatus(index)
              return (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor:
                        status === 'done'
                          ? 'var(--device-500)'
                          : status === 'active'
                            ? 'var(--device-100)'
                            : '#E5E7EB',
                      color:
                        status === 'done'
                          ? 'white'
                          : status === 'active'
                            ? 'var(--device-600)'
                            : '#9CA3AF',
                    }}
                  >
                    {status === 'done' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Wrench className="h-3 w-3" />
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors ${
                      status === 'done' || status === 'active'
                        ? 'font-medium text-gray-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 底部留白 */}
        <div className="h-24" />

        {/* 保修悬浮球 */}
        <button
          type="button"
          className="absolute bottom-20 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg active:scale-95 transition-transform"
          aria-label="保修"
        >
          <Shield className="h-5 w-5" style={{ color: 'var(--device-500)' }} />
        </button>
      </div>

      {/* 底部操作按钮 */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#F5F6FA] via-[#F5F6FA]/95 to-transparent">
        {phase === 'idle' && (
          <button
            type="button"
            onClick={handleStart}
            disabled={selectedAmount > balance}
            className="flex h-12 w-full items-center justify-center rounded-full text-white font-medium shadow-md active:opacity-90 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)`,
            }}
          >
            <span className="text-sm font-semibold">确定启动</span>
          </button>
        )}
        {phase === 'starting' && (
          <button
            type="button"
            disabled
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-white/80 font-medium shadow-md"
            style={{
              background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)`,
            }}
          >
            <span className="text-sm font-semibold">启动中...</span>
          </button>
        )}
        {phase === 'running' && (
          <button
            type="button"
            onClick={handleSettle}
            className="flex h-12 w-full items-center justify-center rounded-full text-white font-medium shadow-md active:opacity-90"
            style={{
              background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)`,
            }}
          >
            <span className="text-sm font-semibold">结算</span>
          </button>
        )}
      </div>

      {/* 结算弹窗 */}
      {showSettleDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--device-100)' }}
            >
              <Check className="h-7 w-7" style={{ color: 'var(--device-600)' }} />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-800">设备已停止</h3>
            <p className="mt-1 text-sm text-gray-500">余额已结算</p>
            <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">本次消费</span>
                <span className="font-semibold" style={{ color: 'var(--device-500)' }}>
                  ¥{usedAmount.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">剩余余额</span>
                <span className="font-semibold text-gray-700">
                  ¥{(balance - usedAmount).toFixed(2)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={confirmSettle}
              className="mt-5 h-10 w-full rounded-full text-sm font-medium text-white shadow-sm active:opacity-90"
              style={{
                background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)`,
              }}
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* 紧急停止弹窗 */}
      {showEmergencyDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <OctagonX className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-800">设备已强制停止</h3>
            <p className="mt-1 text-sm text-gray-500">余额已结算</p>
            <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">本次消费</span>
                <span className="font-semibold text-red-500">
                  ¥{usedAmount.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">剩余余额</span>
                <span className="font-semibold text-gray-700">
                  ¥{(balance - usedAmount).toFixed(2)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={confirmEmergency}
              className="mt-5 h-10 w-full rounded-full bg-red-500 text-sm font-medium text-white shadow-sm active:bg-red-600"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* T040：快速充值弹窗（金额选择 + 微信支付 + 确认） */}
      {showRechargeDialog && rechargedAmount === null && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          role="presentation"
          onClick={handleCloseRecharge}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">快速充值</h3>
                <p className="mt-1 text-xs text-gray-500">
                  当前余额{' '}
                  <span className="font-semibold" style={{ color: 'var(--device-500)' }}>
                    ¥{balance.toFixed(2)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                aria-label="关闭"
                onClick={handleCloseRecharge}
                disabled={recharging}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 active:bg-gray-100 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            {/* 金额档位 */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">充值金额</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {QUICK_RECHARGE_AMOUNTS.map((amt) => {
                  const active = rechargeAmount === amt
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRechargeAmount(amt)}
                      disabled={recharging}
                      className={`h-10 rounded-xl text-sm font-medium transition active:opacity-80 disabled:opacity-40 ${
                        active ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-700'
                      }`}
                      style={
                        active
                          ? {
                              background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)`,
                            }
                          : undefined
                      }
                    >
                      ¥{amt}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 支付方式 */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">支付方式</p>
              <button
                type="button"
                disabled
                className="mt-2 flex w-full items-center justify-between rounded-xl border border-[var(--device-200,#E5E7EB)] bg-[var(--device-100,#F3F0FF)] px-3 py-3"
                style={{ borderColor: 'var(--device-500)' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                    style={{ background: 'linear-gradient(135deg, #07C160 0%, #10B981 100%)' }}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.81 1 3.44 2.59 4.53L4 17l2.71-1.41c.88.21 1.81.34 2.79.36-.07-.34-.1-.7-.1-1.06 0-3.31 3.13-6 7-6 .36 0 .72.02 1.06.07C16.95 6.06 13.55 4 9.5 4zm-2.4 4.5a.9.9 0 110 1.8.9.9 0 010-1.8zm4.8 0a.9.9 0 110 1.8.9.9 0 010-1.8zM16.4 10c-3.31 0-6 2.13-6 4.75 0 1.5.85 2.85 2.18 3.74L12 20l1.99-1.04c.71.16 1.46.27 2.24.29.21 0 .42-.01.62-.02L19 20l-.43-1.85C20.32 17.18 22 15.45 22 13.5c0-2.62-2.69-4.75-6-4.75zm-2 3.2a.7.7 0 110 1.4.7.7 0 010-1.4zm4 0a.7.7 0 110 1.4.7.7 0 010-1.4z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-gray-700">微信支付</span>
                </div>
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                  style={{ background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)` }}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>

            {/* 确认按钮 */}
            <button
              type="button"
              onClick={handleConfirmRecharge}
              disabled={recharging}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)`,
              }}
            >
              {recharging && <span className="text-sm">充值中…</span>}
              {!recharging && `确认充值 ¥${rechargeAmount}`}
            </button>
          </div>
        </div>
      )}

      {/* T040：充值成功二级弹窗 */}
      {rechargedAmount !== null && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--device-100)' }}
            >
              <Check className="h-7 w-7" style={{ color: 'var(--device-600)' }} />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-800">充值成功</h3>
            <p className="mt-1 text-sm text-gray-500">
              ¥{rechargedAmount.toFixed(2)} 已到账，可继续使用设备
            </p>
            <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">当前余额</span>
                <span className="font-semibold" style={{ color: 'var(--device-500)' }}>
                  ¥{balance.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRechargeSuccessDone}
              className="mt-5 h-10 w-full rounded-full text-sm font-medium text-white shadow-sm active:opacity-90"
              style={{
                background: `linear-gradient(135deg, var(--device-400) 0%, var(--device-600) 100%)`,
              }}
            >
              继续使用
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DeviceIcon({ type }: { type: DeviceType }) {
  const iconClass = 'h-8 w-8 text-white'

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
