import { useState } from 'react'
import Header from '../components/mobile/Header'
import PageContainer from '../components/mobile/PageContainer'
import { Button } from '../components/ui'

const states = [
  { name: '大吉', gradient: 'from-[var(--com-premium-300)] to-[var(--com-premium-500)]' },
  { name: '中吉', gradient: 'from-[var(--com-brand-400)] to-[var(--com-brand-500)]' },
  { name: '小吉', gradient: 'from-[var(--com-neutral-300)] to-[var(--com-neutral-500)]' },
]

export default function DrawSuccess() {
  const [index, setIndex] = useState(0)
  const [message, setMessage] = useState('')
  const current = states[index]

  const redraw = () => {
    const next = Math.floor(Math.random() * states.length)
    setIndex(next)
  }

  const acceptLuck = () => {
    setMessage('今日好运已收入')
    window.setTimeout(() => setMessage(''), 1800)
  }

  return (
    <PageContainer>
      <Header title="今日澡运" />
      <div className="flex flex-1 flex-col items-center px-4 pt-6 text-center">
        <div className="mb-6 flex h-[200px] w-[200px] items-center justify-center rounded-full bg-[var(--com-premium-100)] shadow-lg">
          <div className={`flex h-[160px] w-[160px] items-center justify-center rounded-full bg-gradient-to-b ${current.gradient} text-3xl font-bold text-white shadow-inner`}>
            {current.name}
          </div>
        </div>

        <h1 className="text-xl font-bold">恭喜抽取成功</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">好运已签收，愿今天顺利。</p>

        <Button
          size="large"
          className="mt-8 h-12 w-full rounded-full bg-[var(--com-premium-500)] text-white"
          onClick={redraw}
        >
          再抽一次
        </Button>

        <Button
          variant="outline"
          size="large"
          className="mt-3 h-12 w-full rounded-full border-[var(--com-premium-500)] text-sm"
          onClick={acceptLuck}
        >
          收下好运
        </Button>

        {message && (
          <div className="mt-4 rounded-full bg-[var(--com-success-500)] px-4 py-2 text-sm text-white">
            {message}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
