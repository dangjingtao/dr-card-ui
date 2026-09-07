import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  ScanLine,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { getCardTopupRecords, topupCard, useCards } from './cardStore'

/* T038｜刮刮充值卡补全（卡博士淡金色风格）
 * -------------------------------------------------------------
 * - 顶部：金色渐变标题栏（与卡博士 APP 主色一致）
 * - 输入：10 位数字充值码 + 扫码按钮
 * - 主操作：金渐变「充值」按钮
 * - 充值记录入口：横条卡片，点击跳既有 /topup-records 列表
 * - 温馨提示：浅金背景卡，含安全提醒
 * - 空态：底部"没有更多数据了"
 *
 * Mock 校验规则（2026-09-07 用户决定）：
 * - 必须 10 位数字
 * - 充值码后 4 位需匹配演示卡 cardNo 后 4 位（"9EC"），不匹配时弹错误
 * - 无卡时禁用主操作并提示「请先绑定校园卡」
 */

const DEMO_CARD_ID = 'card-001'
const DEMO_CARD_TAIL = '9EC'

export default function ScratchCardRechargePage() {
  const navigate = useNavigate()
  const cards = useCards()
  const card = cards.find((c) => c.id === DEMO_CARD_ID) ?? cards[0]
  const hasCard = Boolean(card)

  /* 实时计算"最近 N 笔" — 充值成功后回到本页能看到数量变化 */
  const recordCount = useMemo(
    () => (card ? getCardTopupRecords(card.id).length : 0),
    // 依赖 card.id；store 内部 useState 触发重渲染时也会带动本页刷新
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card?.id]
  )

  const [code, setCode] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleScan = () => {
    /* 扫码按钮仅做占位演示，不进入主流程 */
    alert('扫一扫施工中（T038 仅展示入口）')
  }

  const handleRecharge = async () => {
    setErrorMsg('')
    if (!hasCard) {
      setErrorMsg('请先在「我的卡」中绑定校园卡')
      return
    }
    if (!agreed) {
      setErrorMsg('请先勾选并同意《用户协议》与《隐私政策》')
      return
    }
    if (code.length !== 10 || !/^\d{10}$/.test(code)) {
      setErrorMsg('请输入 10 位数字充值码')
      return
    }
    if (code.slice(-3).toUpperCase() !== DEMO_CARD_TAIL) {
      setErrorMsg('充值码无效，请检查后重新输入')
      return
    }

    setSubmitting(true)
    /* 模拟请求：800ms 后落 mock 流水 */
    await new Promise((resolve) => setTimeout(resolve, 800))
    /* 演示金额 100 元 */
    topupCard(card!.id, 100, 'wechat')
    setSubmitting(false)
    navigate(
      `/legacy-profile/my-cards/${card!.id}/topup/success?amount=100&channel=wechat&cardId=${card!.id}&from=scratch-card`
    )
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部栏：淡金渐变 + 返回 + 居中标题 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-4"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            刮刮充值卡
          </div>
        </div>
      </div>

      {/* 输入区：10 位充值码 + 扫码按钮 */}
      <div className="mx-4 mt-5 flex items-center gap-2">
        <div
          className={`flex h-12 flex-1 items-center gap-2 rounded-full border bg-white px-5 shadow-sm ${
            errorMsg && code.length > 0 ? 'border-danger' : 'border-[#E8D9B8]'
          }`}
        >
          <input
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 10)
              setCode(next)
              setErrorMsg('')
            }}
            inputMode="numeric"
            placeholder="请输入10位刮刮充值卡充值码"
            className="h-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-[#B8893D]"
          />
        </div>
        <button
          type="button"
          onClick={handleScan}
          aria-label="扫码"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E8D9B8] bg-white text-[#B8893D] shadow-sm active:opacity-70"
        >
          <ScanLine className="h-5 w-5" />
        </button>
      </div>
      {errorMsg && <div className="mx-4 mt-2 text-xs text-danger-text">{errorMsg}</div>}

      {/* 主操作：充值按钮（金渐变） */}
      <div className="mx-4 mt-5">
        <button
          type="button"
          onClick={handleRecharge}
          disabled={submitting || !hasCard}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-base font-semibold text-white shadow-md active:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? '充值中' : '充值'}
        </button>
      </div>

      {/* 充值记录入口：横条卡片 */}
      {hasCard && (
        <button
          type="button"
          onClick={() =>
            navigate(
              `/legacy-profile/my-cards/${card!.id}/topup-records?from=scratch-card`
            )
          }
          className="mx-4 mt-6 flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm active:bg-[#F8F8FA]"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">充值记录</span>
            <span className="text-xs text-text-tertiary">最近 {recordCount} 笔</span>
          </div>
          <ChevronRight className="h-4 w-4 text-text-tertiary" />
        </button>
      )}

      {/* 温馨提示：浅金背景卡 */}
      <div className="mx-4 mt-4 rounded-xl bg-[#FFF8E8] px-4 py-3 text-xs leading-relaxed text-[#8B6F2F]">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#B8893D]" />
          <div className="space-y-1">
            <div>· 充值码仅用于本次充值，请妥善保管，平台不会再次索取。</div>
            <div>· 请勿将充值码截图、转发或告知他人，避免账户余额被盗用。</div>
            <div>· 充值成功后金额实时到账，可在「我的卡」对应卡查看最新余额。</div>
          </div>
        </div>
      </div>

      {/* 无卡提示 */}
      {!hasCard && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl bg-[#FFF8E8] px-4 py-3 text-xs leading-relaxed text-[#8B6F2F]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B8893D]" />
          <div>
            暂未绑定校园卡，请先到「我的卡」绑定后再充值。
            <button
              type="button"
              onClick={() => navigate('/legacy-profile/my-cards')}
              className="ml-1 underline"
            >
              去绑定
            </button>
          </div>
        </div>
      )}

      {/* 空态：底部居中灰字 */}
      <div className="mt-auto flex flex-col items-center pb-8 pt-12 text-xs text-text-tertiary">
        没有更多数据了
      </div>

      {/* 协议勾选（与登录页同款金色） */}
      <div className="px-4 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <label className="flex items-start gap-2 text-xs text-text-secondary">
          <button
            type="button"
            aria-label={agreed ? '取消同意' : '同意协议'}
            onClick={() => setAgreed(!agreed)}
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
              agreed
                ? 'border-[#D4A853] bg-gradient-to-br from-[#D4A853] to-[#E8C97A]'
                : 'border-text-tertiary bg-white'
            }`}
          >
            {agreed && (
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="4">
                <polyline points="5 12 10 17 19 7" />
              </svg>
            )}
          </button>
          <span className="leading-relaxed">
            我已阅读并同意
            <span className="text-[#B8893D]">《用户协议》</span>
            和
            <span className="text-[#B8893D]">《隐私政策》</span>
          </span>
        </label>
      </div>
    </div>
  )
}