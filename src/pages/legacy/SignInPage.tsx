import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, PlayCircle, Share2, ShoppingBag, HelpCircle } from 'lucide-react'
import PageContainer from '../../components/mobile/PageContainer'
import { usePoints, dailyCheckIn, watchVideoReward } from './pointsStore'
import polarBear from '../../assets/signin/polar-bear.png'

/**
 * 每日签到 / 薅羊毛 主页（T025）
 * -------------------------------------------------------------
 * 卡博士版"福袋"入口落地页，严格按设计图布局。
 * 积分余额与诗得丽"泡泡值"打通，共用 pointsStore。
 * 广告 SDK 为 mock：倒计时弹窗模拟看完视频后发积分。
 */
export default function SignInPage() {
  const navigate = useNavigate()
  const points = usePoints()
  const [adOpen, setAdOpen] = useState(false)
  const [adSource, setAdSource] = useState<'checkin' | 'video'>('checkin')
  const [successOpen, setSuccessOpen] = useState(false)
  const [successReward, setSuccessReward] = useState(0)
  const [successTitle, setSuccessTitle] = useState('')
  const [ruleOpen, setRuleOpen] = useState(false)

  /** 7 天签到进度：前 4 天已签，今天第 5 天未签，后 2 天未到 */
  const weekDays = [
    { day: '1天', reward: 5, done: true },
    { day: '2天', reward: 5, done: true },
    { day: '3天', reward: 5, done: true },
    { day: '4天', reward: 5, done: true },
    { day: '5天', reward: 5, done: false, isToday: true },
    { day: '6天', reward: 5, done: false },
    { day: '7天', reward: 15, done: false, isBonus: true },
  ]

  /** 累计签到天数（mock） */
  const totalCheckInDays = 5

  const dailyTasks = [
    {
      id: 'video',
      icon: PlayCircle,
      title: '看视频赚积分',
      desc: '每日可完成 3 次',
      reward: '+20',
      progress: `${points.todayVideoCount}/3`,
      actionText: points.todayVideoCount >= 3 ? '已完成' : '去观看',
      disabled: points.todayVideoCount >= 3,
    },
    {
      id: 'mall',
      icon: ShoppingBag,
      title: '逛积分商城',
      desc: '每日首次进入得积分',
      reward: '+5',
      progress: '0/1',
      actionText: '去逛逛',
      disabled: false,
    },
    {
      id: 'share',
      icon: Share2,
      title: '分享给好友',
      desc: '邀请好友一起薅羊毛',
      reward: '+30',
      progress: '0/1',
      actionText: '去分享',
      disabled: false,
    },
  ]

  /** 点击签到：先弹广告，看完再给积分 */
  const handleCheckIn = () => {
    if (points.todayCheckedIn) return
    setAdSource('checkin')
    setAdOpen(true)
  }

  /** 点击看视频任务 */
  const handleWatchVideo = () => {
    if (points.todayVideoCount >= 3) return
    setAdSource('video')
    setAdOpen(true)
  }

  /** 广告播放完毕回调 */
  const handleAdComplete = () => {
    setAdOpen(false)
    if (adSource === 'checkin') {
      dailyCheckIn(5)
      setSuccessTitle('签到成功')
      setSuccessReward(5)
      setSuccessOpen(true)
    } else {
      watchVideoReward(20)
      setSuccessTitle('恭喜获得积分')
      setSuccessReward(20)
      setSuccessOpen(true)
    }
  }

  const handleTaskClick = (id: string) => {
    if (id === 'video') {
      handleWatchVideo()
    } else if (id === 'mall') {
      navigate('/mall')
    } else if (id === 'share') {
      setSuccessTitle('分享功能开发中')
      setSuccessReward(0)
      setSuccessOpen(true)
    }
  }

  return (
    <PageContainer inset={false} className="bg-[#F5F5F5] pb-8">
      {/* 顶部导航：只保留返回按钮 */}
      <div className="relative z-10 flex items-center px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center text-[#333]"
          aria-label="返回"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* 头图区：白色背景 + 大标题 + 数据 + 北极熊 */}
      <div className="relative overflow-hidden bg-white px-5 pb-4 pt-2">
        {/* 北极熊抱红包（右侧大图） */}
        <div className="absolute -right-2 top-0 h-56 w-56">
          <img src={polarBear} alt="北极熊" className="h-full w-full object-contain" />
        </div>

        {/* 大标题 */}
        <h1 className="relative z-10 text-[32px] font-bold leading-tight text-[#1A1A1A]">
          每日签到领福利
        </h1>

        {/* 数据区：积分余额 / 累计签到，右对齐到标题右边 */}
        <div className="relative z-10 mt-6 flex items-center">
          <div className="w-24 text-center">
            <p className="text-3xl font-bold text-[#1A1A1A]">
              {points.balance}
            </p>
            <p className="mt-1 text-sm text-[#666]">积分余额</p>
          </div>
          <div className="h-10 w-px bg-[#E5E5E5]" />
          <div className="w-24 text-center">
            <p className="text-3xl font-bold text-[#1A1A1A]">{totalCheckInDays}</p>
            <p className="mt-1 text-sm text-[#666]">累计签到</p>
          </div>
        </div>

        {/* 规则说明 */}
        <button
          type="button"
          onClick={() => setRuleOpen(true)}
          className="relative z-10 mt-4 flex items-center gap-1 text-xs text-[#999]"
        >
          规则说明
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 签到进度卡片 */}
      <div className="mx-4 mt-3 rounded-2xl bg-white px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1A1A1A]">
            连续签到7天领
            <span className="text-[#FF4D4F]">3倍</span>
            积分
          </h2>
          <button
            type="button"
            onClick={() => navigate('/signin/detail')}
            className="flex items-center text-sm text-[#999]"
          >
            积分明细
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 7 天红包进度 */}
        <div className="mt-4 flex items-center justify-between">
          {weekDays.map((d) => (
            <div key={d.day} className="flex flex-col items-center">
              {/* 红包图标 */}
              <div
                className={`relative flex h-14 w-12 items-center justify-center ${
                  d.done ? '' : d.isToday ? 'animate-pulse' : 'opacity-60'
                }`}
              >
                <svg viewBox="0 0 48 56" className="h-full w-full">
                  {/* 红包主体 */}
                  <rect x="2" y="8" width="44" height="46" rx="6" fill={d.done ? '#FF6B5A' : '#E8E8E8'} />
                  {/* 红包盖子 */}
                  <path
                    d={`M2 16 Q24 2 46 16 L46 24 Q24 12 2 24 Z`}
                    fill={d.done ? '#FF4D4F' : '#D4D4D4'}
                  />
                  {/* 金币 */}
                  <circle cx="24" cy="32" r="8" fill={d.done ? '#FFD666' : '#CCC'} />
                  <circle cx="24" cy="32" r="5" fill={d.done ? '#FFB020' : '#BFBFBF'} />
                  {/* 已签到对勾 */}
                  {d.done && (
                    <path
                      d="M20 32 L23 35 L29 29"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )}
                </svg>
                {/* 今日标记 */}
                {d.isToday && !points.todayCheckedIn && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#FF4D4F] ring-2 ring-white" />
                )}
              </div>
              {/* 奖励积分 */}
              <p
                className={`mt-1 text-sm font-semibold ${
                  d.isBonus ? 'text-[#FF4D4F]' : d.done ? 'text-[#1A1A1A]' : 'text-[#999]'
                }`}
              >
                +{d.reward}
              </p>
              {/* 天数 */}
              <p className="mt-0.5 text-xs text-[#999]">{d.day}</p>
            </div>
          ))}
        </div>

        {/* 签到按钮 */}
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={points.todayCheckedIn}
          className={`mt-5 w-full rounded-full py-3.5 text-base font-semibold text-white transition active:scale-[0.98] ${
            points.todayCheckedIn
              ? 'bg-[#CCC]'
              : 'bg-gradient-to-r from-[#FF6B5A] to-[#FF4D4F] shadow-[0_4px_12px_rgba(255,77,79,0.3)]'
          }`}
        >
          {points.todayCheckedIn ? '今日已签到' : '立即签到'}
        </button>
      </div>

      {/* 成就任务 */}
      <div className="mx-4 mt-4 rounded-2xl bg-white px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <h2 className="text-base font-semibold text-[#1A1A1A]">成就任务</h2>
        <div className="mt-3 space-y-3">
          {dailyTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-xl bg-[#F8F8F8] px-3 py-3"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#FF4D4F] shadow-sm">
                <task.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-[#1A1A1A]">{task.title}</p>
                  <span className="shrink-0 rounded-full bg-[#FFEBEA] px-1.5 py-0.5 text-[10px] font-semibold text-[#FF4D4F]">
                    {task.reward}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#999]">
                  {task.desc} · {task.progress}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTaskClick(task.id)}
                disabled={task.disabled}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  task.disabled
                    ? 'bg-[#E5E5E5] text-[#999]'
                    : 'bg-gradient-to-r from-[#FF6B5A] to-[#FF4D4F] text-white shadow-[0_2px_6px_rgba(255,77,79,0.25)] active:scale-95'
                }`}
              >
                {task.actionText}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 广告位（占位） */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#666]">精选广告</h2>
          <span className="text-xs text-[#CCC]">广告</span>
        </div>
        <div className="mt-2 flex h-24 items-center justify-center rounded-2xl border border-dashed border-[#E5E5E5] bg-white text-xs text-[#CCC]">
          广告位 · 接入 SDK 后展示
        </div>
      </div>

      {/* 为你精选 */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1A1A1A]">为你精选</h2>
          <button
            type="button"
            onClick={() => navigate('/mall')}
            className="flex items-center text-sm text-[#999]"
          >
            查看全部
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { name: '氨基酸洗发水', points: 500, emoji: '🧴' },
            { name: '护发素小样', points: 200, emoji: '🫧' },
            { name: '沐浴露', points: 680, emoji: '🧼' },
          ].map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => navigate('/mall')}
              className="flex flex-col items-center rounded-2xl bg-white py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition active:scale-[0.97]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F8F8F8] text-3xl">
                {item.emoji}
              </div>
              <p className="mt-2 text-xs text-[#333]">{item.name}</p>
              <p className="mt-0.5 text-xs font-semibold text-[#FF4D4F]">{item.points} 分</p>
            </button>
          ))}
        </div>
      </div>

      {/* 规则说明弹窗 */}
      {ruleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setRuleOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1A1A1A]">积分规则说明</h3>
              <button
                type="button"
                onClick={() => setRuleOpen(false)}
                className="flex h-8 w-8 items-center justify-center text-[#999]"
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[#666]">
              <p>1. 每日签到可获得积分，连续签到 7 天可领取 3 倍积分奖励。</p>
              <p>2. 每日观看视频可获得积分，每日最多完成 3 次。</p>
              <p>3. 逛积分商城每日首次进入可获得积分。</p>
              <p>4. 分享给好友可获得积分奖励。</p>
              <p>5. 积分可在积分商城兑换商品和优惠券。</p>
              <p>6. 积分与诗得丽品牌专栏泡泡值通用。</p>
              <p className="text-xs text-[#999]">最终解释权归卡博士所有</p>
            </div>
          </div>
        </div>
      )}

      {/* 广告模拟弹窗 */}
      {adOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="relative w-[85%] max-w-[320px] overflow-hidden rounded-2xl bg-black">
            {/* 模拟视频区域 */}
            <div className="relative flex aspect-[9/16] items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#111]">
              <div className="text-center text-white">
                <PlayCircle className="mx-auto h-12 w-12 opacity-60" />
                <p className="mt-2 text-sm opacity-70">广告播放中...</p>
              </div>
              {/* 倒计时 */}
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                <AdCountdown onComplete={handleAdComplete} />
              </div>
            </div>
            {/* 广告底部信息 */}
            <div className="bg-[#1a1a1a] px-4 py-3 text-xs text-white/70">
              <p>此为广告模拟演示 · 真实环境由 SDK 提供</p>
            </div>
          </div>
        </div>
      )}

      {/* 成功弹窗 */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-8">
          <div className="w-full max-w-[280px] overflow-hidden rounded-3xl bg-white text-center shadow-2xl">
            <div className="pt-8 pb-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB347] to-[#FF6B5A] text-4xl text-white shadow-lg">
                🎁
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1A1A1A]">{successTitle}</h3>
              {successReward > 0 && (
                <p className="mt-2">
                  <span className="text-3xl font-bold text-[#FF4D4F]">+{successReward}</span>
                  <span className="ml-1 text-sm text-[#999]">积分</span>
                </p>
              )}
            </div>
            <div className="border-t border-[#F0F0F0] px-4 py-3">
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="w-full rounded-full bg-gradient-to-r from-[#FF6B5A] to-[#FF4D4F] py-2.5 text-sm font-semibold text-white shadow-md"
              >
                开心收下
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

/** 广告倒计时子组件：5 秒倒计时，到 0 后可关闭 */
function AdCountdown({ onComplete }: { onComplete: () => void }) {
  const [sec, setSec] = useState(5)

  useEffect(() => {
    if (sec <= 0) return
    const timer = setTimeout(() => setSec((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [sec])

  if (sec <= 0) {
    return (
      <button
        type="button"
        onClick={onComplete}
        className="text-xs text-white underline"
      >
        跳过广告
      </button>
    )
  }

  return <span>{sec}s 后可跳过</span>
}
