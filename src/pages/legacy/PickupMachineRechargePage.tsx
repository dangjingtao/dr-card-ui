import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, FlaskConical, CreditCard, Wallet } from 'lucide-react'
import { useCards } from './cardStore'
import { useUserInfo } from './userInfoStore'

/**
 * T041｜领款机反扫码充值
 * -------------------------------------------------------------
 * 需求来源：卡博士APP缺失及新增功能.xlsx 第 16–17 行
 *   16｜反扫码｜即将账户余额充值到实体卡
 *   17｜领款机｜APP 有余额，通过领款机充值到实体卡上
 *
 * 页面结构：
 *  - 顶部淡金渐变栏：左侧返回 + 居中「领款机充值」
 *  - 中央白卡：mock 二维码（30×30 SVG 模块矩阵 + 三角定位符）+ 文字提示
 *  - 二维码下方：当前卡名 + 卡号 + 余额（无卡时显示空态 + 去绑定按钮）
 *  - 三步操作说明：编号 1–3，静态展示
 *  - 右下角保留原型状态切换器（开发用）
 *
 * 二维码内容：B-050 待业务侧确认，先 mock 一个稳定字符串：
 *   pickup://card-{cardId}/user-{account}
 * 真实接入后由服务端签名串替换。
 */
const DEMO_STATE_KEY = 'KBS_CARD_DEMO_STATE'

function readDemoState(): 'unbound' | 'bound' {
  try {
    return sessionStorage.getItem(DEMO_STATE_KEY) === 'unbound' ? 'unbound' : 'bound'
  } catch {
    return 'bound'
  }
}

function writeDemoState(v: 'unbound' | 'bound') {
  try {
    sessionStorage.setItem(DEMO_STATE_KEY, v)
  } catch {
    /* ignore */
  }
}

/* ---- Mock 二维码（30×30 SVG 模块矩阵 + 三角定位符 + 中央 logo） ----
 * 仅视觉占位：固定布局的黑色模块 + 三处白色定位框 + 中心 logo，
 * 并不真实编码 payload；按 T041 B-050 替换为真实签名串后由后端生成。 */
const QR_GRID = [
  '111111111010111111111111111111',
  '100000101011001000001010100001',
  '101110100110101011101100101011',
  '101110101011001011101010101111',
  '101110100110101110101010100001',
  '100000101010001010001010101011',
  '111111111101010111111010101111',
  '000000001011001001001010001000',
  '110110110010110011010100110110',
  '001011001100100110011010010110',
  '110011010010011010110110110011',
  '001101001101001001100110011001',
  '110110100110011001011010110110',
  '001001100110011001101001001011',
  '110110110010011010110110110011',
  '001011001101001100110011001100',
  '110011001001011001101001101010',
  '000000001011001001001011001001',
  '111111111101011011010110011010',
  '101010101010110100110010011011',
  '110011001101010011010110101100',
  '001011001001011001101100110010',
  '110011010010110110011010011011',
  '001011001101011001101001101001',
  '110011001001010010011001101100',
  '000000001010100110011010011001',
  '111111111101100101011010101100',
  '100000101011001101101100101011',
  '101110101011010010010011101100',
  '101110100110011010101101101011',
  '101110101011010011010010101111',
  '100000101010001100101100110010',
  '111111111010111111101011011010',
]

function QrMock({ size = 192 }: { size?: number }) {
  const cell = size / QR_GRID.length
  return (
    <div
      className="rounded-2xl bg-white p-3 shadow-sm"
      style={{ width: size + 24, height: size + 24 }}
      aria-label="领款机反扫码二维码"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        {/* 背景白 */}
        <rect x="0" y="0" width={size} height={size} fill="#FFFFFF" />
        {/* 模块矩阵 */}
        {QR_GRID.map((row, y) =>
          row.split('').map((bit, x) =>
            bit === '1' ? (
              <rect
                key={`${x}-${y}`}
                x={x * cell}
                y={y * cell}
                width={cell}
                height={cell}
                fill="#1A1A1A"
              />
            ) : null
          )
        )}
        {/* 中心 logo 占位（卡博士品牌色） */}
        <rect
          x={size / 2 - cell * 3.5}
          y={size / 2 - cell * 3.5}
          width={cell * 7}
          height={cell * 7}
          rx={cell * 1.2}
          fill="#D4A853"
        />
        <text
          x={size / 2}
          y={size / 2 + cell * 1.4}
          textAnchor="middle"
          fontSize={cell * 3.6}
          fontWeight={700}
          fill="#FFFFFF"
          fontFamily="-apple-system, system-ui, sans-serif"
        >
          卡
        </text>
      </svg>
    </div>
  )
}

const STEPS = [
  {
    title: '在领款机上选择「APP 充值」',
    desc: '点击领款机首页的「APP 充值 / 反扫码」入口',
  },
  {
    title: '用领款机摄像头扫描本二维码',
    desc: '保持二维码在取景框内，等待领款机识别成功',
  },
  {
    title: '在领款机上选择充值金额并确认',
    desc: '金额由领款机选择，确认后 APP 余额将充值到对应实体卡',
  },
]

export default function PickupMachineRechargePage() {
  const navigate = useNavigate()
  const allCards = useCards()
  const userInfo = useUserInfo()
  const [demoState, setDemoState] = useState<'unbound' | 'bound'>(() => readDemoState())
  const cards = demoState === 'unbound' ? [] : allCards
  const card = cards.find((c) => c.status === 'normal') ?? cards[0]

  const switchDemoState = () => {
    const next = demoState === 'bound' ? 'unbound' : 'bound'
    setDemoState(next)
    writeDemoState(next)
  }

  /* mock 二维码 payload：B-050 等业务接口到位后由服务端签名串替换 */
  const qrPayload = card
    ? `pickup://card-${card.id}/user-${userInfo.account || 'unknown'}`
    : ''

  return (
    <div className="relative mx-auto flex min-h-full max-w-[480px] flex-col bg-[#F8F8FA]">
      {/* 顶部淡金渐变栏：左侧返回 + 居中「领款机充值」 */}
      <div
        className="relative shrink-0 px-4 pt-3 pb-4"
        style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #F0D68E 100%)' }}
      >
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="返回"
            onClick={() => navigate('/legacy-profile')}
            className="relative z-10 flex h-10 w-10 items-center justify-center text-white active:opacity-80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            领款机充值
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 px-4 py-4 pb-6">
        {!card ? (
          /* 空态：无卡时引导去绑定 */
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FB923C]/15">
              <CreditCard className="h-8 w-8 text-[#FB923C]" />
            </div>
            <div className="mt-4 text-base font-medium text-text-primary">
              暂无可充值的实体卡
            </div>
            <div className="mt-1 text-sm text-text-tertiary">
              请先在「我的卡」中绑定一张实体卡，再使用领款机反扫码充值
            </div>
            <button
              type="button"
              onClick={() => navigate('/legacy-profile/my-cards')}
              className="mt-6 rounded-full bg-[#D4A853] px-6 py-2.5 text-sm font-medium text-white shadow-sm active:opacity-80"
            >
              去绑定卡
            </button>
          </div>
        ) : (
          <>
            {/* 中央二维码卡片 */}
            <div className="flex flex-col items-center rounded-2xl bg-white px-4 py-6 shadow-sm">
              <div className="text-sm text-text-tertiary">请用领款机扫描下方二维码</div>
              <div className="mt-4">
                <QrMock size={192} />
              </div>
              <div className="mt-3 break-all text-center font-mono text-[10px] text-text-tertiary">
                {qrPayload}
              </div>
            </div>

            {/* 当前卡信息 */}
            <div className="mt-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7B61FF]">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-text-primary">
                    {card.realName || '未命名'} · {card.cardNo}
                  </div>
                  <div className="mt-0.5 text-xs text-text-tertiary">
                    卡余额：
                    <span className="text-[#DC2626]">¥{card.balance.toFixed(2)}</span>
                    （实际充值金额由领款机选择）
                  </div>
                </div>
              </div>
            </div>

            {/* 三步操作说明 */}
            <div className="mt-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
              <div className="mb-3 text-sm font-medium text-text-primary">操作步骤</div>
              <ol className="space-y-3">
                {STEPS.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #D4A853 0%, #E8C97A 100%)',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-text-primary">{step.title}</div>
                      <div className="mt-0.5 text-xs text-text-tertiary">{step.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* 底部提示条 */}
            <div className="mt-3 rounded-2xl bg-[#FFF7E6] px-4 py-3 text-xs leading-relaxed text-[#B8893D]">
              提示：本页面二维码为前端演示占位，真实场景下扫码后会进入领款机的金额选择页；APP 端不在此发起充值，确认与扣款均在领款机侧完成。
            </div>
          </>
        )}
      </div>

      {/* 右下角：原型状态切换器（开发用） */}
      <button
        type="button"
        onClick={switchDemoState}
        title="切换卡的绑定状态（开发用）"
        className="absolute bottom-6 right-4 z-40 flex items-center gap-1.5 rounded-full bg-text-primary px-3 py-2 text-xs font-medium text-white shadow-lg active:opacity-80"
      >
        <FlaskConical className="h-3.5 w-3.5" />
        {demoState === 'bound' ? '已绑卡' : '未绑卡'}
      </button>
    </div>
  )
}