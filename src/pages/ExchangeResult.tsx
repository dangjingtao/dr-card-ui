import { useNavigate } from 'react-router-dom'
import { PartyPopper } from 'lucide-react'
import PromptOverlay from '../components/mobile/PromptOverlay'
import { Button } from '../components/ui'
import { EXCHANGE_COPY } from '../app/fixtures'
import { useFixtureDebug, withFixtureQuery } from '../app/fixtures/useFixture'
import Exchange from './Exchange'

/**
 * 存入卡包（#40）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/04-mall-card-order.md §4
 * 已确认：「兑换成功，卡券已经存入你的卡包啦～」、关闭回到洗护兑换专区、「查看我的卡包」进入卡包。
 * ⚠️ B-026 未决：泡泡值扣减与卡包写入属服务端规则，本页只做成功反馈，
 *    不修改余额，卡包列表也不随本次兑换变化。
 * 结构沿用 ClaimSuccess：兑换专区作为背景层 + PromptOverlay 承载成功弹窗。
 * 兑换成功的券名来自接口返回的券（经 `?product=` 定位），不再读取本地夹具。
 */
export default function ExchangeResult() {
  const navigate = useNavigate()
  const debug = useFixtureDebug()

  const back = () => navigate(withFixtureQuery('/exchange', { debug: debug ? '1' : null }), { replace: true })
  const toCardPack = () => navigate(withFixtureQuery('/card', { debug: debug ? '1' : null }), { replace: true })

  return (
    <>
      <Exchange />
      <PromptOverlay
        open
        label={EXCHANGE_COPY.successTitle}
        onDismiss={back}
        className="bg-surface px-6 pb-6 pt-7 text-center"
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: 'var(--gradient-claim)' }}
          aria-hidden
        >
          <PartyPopper className="h-9 w-9 text-claim-text" />
        </div>
        <h2 className="mt-4 text-lg font-bold leading-6 text-text-primary">{EXCHANGE_COPY.successTitle}</h2>
        <Button size="large" className="mt-6 h-11 w-full rounded-full" onClick={toCardPack}>
          {EXCHANGE_COPY.successAction}
        </Button>
        <Button variant="ghost" className="mt-2 w-full rounded-full" onClick={back}>
          {EXCHANGE_COPY.successClose}
        </Button>
      </PromptOverlay>
    </>
  )
}
