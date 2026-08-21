import { useState } from 'react'
import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'

const states = [
  { name: '大吉', gradient: 'from-[var(--com-premium-300)] to-[var(--com-premium-500)]' },
  { name: '中吉', gradient: 'from-[var(--com-brand-400)] to-[var(--com-brand-500)]' },
  { name: '小吉', gradient: 'from-[var(--com-neutral-300)] to-[var(--com-neutral-500)]' },
]

export default function DrawSuccess() {
  const [index, setIndex] = useState(0)
  const current = states[index]

  return (
    <PageContainer>
      <Header title="今日澡运" />
      <div className="flex flex-1 flex-col items-center px-4 pt-6 text-center">
        <div className="mb-6 h-[200px] w-[200px] rounded-full bg-[var(--com-premium-100)] flex items-center justify-center">
          <div className={`h-[160px] w-[160px] rounded-full bg-gradient-to-b ${current.gradient} flex items-center justify-center text-3xl font-bold text-white`}>
            {current.name}
          </div>
        </div>

        <h1 className="text-xl font-bold">恭喜抽取成功</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">好运已签收，愿今天顺利。</p>

        <button
          className="mt-8 h-12 w-full rounded-full bg-[var(--com-premium-500)] text-white"
          onClick={() => setIndex((index + 1) % states.length)}
        >
          再抽一次
        </button>

        <button className="mt-3 h-12 w-full rounded-full border border-[var(--com-premium-500)] text-sm">
          收下好运
        </button>
      </div>
    </PageContainer>
  )
}
