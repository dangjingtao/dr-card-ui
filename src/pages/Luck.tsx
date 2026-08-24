import { useNavigate } from 'react-router-dom'
import { Waves } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { useFixtureState } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import { LUCK_DRAW, LUCK_RULE_STATUS } from '../app/fixtures'
import luckDrawHero from '../assets/brand/luck/luck-draw-hero.webp'

/**
 * 今日澡运（#7）
 * -------------------------------------------------------------
 * 事实源：docs/prototype/02-membership-and-checkin.md §8
 * 已确认：页面中心为「抽取今日澡运」按钮，并提示点击后即可抽签；抽取后进入 #41 抽取成功。
 * ⚠️ B-003 未决：抽签档位数量与命名、是否允许重抽、结果是否当天持久化均未确认。
 *    因此本页只做「未抽 → 抽取」这一条摹客已确认的动作，不在这里编写抽签概率、
 *    次数限制或冷却规则；「当天已抽过」仅作为可复现夹具态（`?state=drawn`）呈现，
 *    并显式标注为未定稿，不表现成最终业务规则。
 */
export default function Luck() {
  const navigate = useNavigate()
  const route = findRouteByPathname('/luck')
  const { state } = useFixtureState(route)

  /** ?state=drawn：原型 §9 提到「当天已抽过再次进入可直接看到结果」，但持久化规则未确认 */
  const drawn = state?.key === 'drawn'

  return (
    <PageContainer className="flex min-h-full flex-col pb-24">
      <div className="flex flex-1 flex-col items-center justify-center px-2 pb-6 pt-6 text-center">
        <div className="relative h-[286px] w-full max-w-[326px]" aria-hidden>
          <img
            src={luckDrawHero}
            alt=""
            className="absolute inset-x-0 bottom-0 mx-auto h-auto w-full object-contain"
          />
          <span className="absolute left-1/2 top-[50px] flex h-[178px] w-[76px] -translate-x-1/2 rotate-[7deg] flex-col items-center justify-center rounded-[12px] border border-border bg-surface text-info-text shadow-floating">
            <span className="text-base font-semibold leading-6 tracking-[0.18em] [writing-mode:vertical-rl]">
              今日澡运签
            </span>
            <Waves className="mt-2 h-6 w-6" strokeWidth={1.8} />
          </span>
        </div>

        <h1 className="mt-4 text-xl font-semibold text-text-primary">今日澡运</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{LUCK_DRAW.hint}</p>

        {drawn ? (
          <>
            <button
              type="button"
              onClick={() => navigate('/luck/result')}
              className="mt-8 h-12 w-full max-w-[280px] rounded-full bg-primary text-base font-medium text-text-inverse active:bg-primary-pressed"
            >
              查看今日澡运结果
            </button>
            {/* 未定稿提示只在夹具态出现，避免把「当天已抽过」表现成已确认规则 */}
            <p className="mt-3 max-w-[280px] text-xs leading-5 text-text-tertiary">
              夹具态：{LUCK_RULE_STATUS.isolatedNote}
            </p>
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/luck/result')}
            className="mt-8 h-12 w-full max-w-[280px] rounded-full bg-primary text-base font-medium text-text-inverse active:bg-primary-pressed"
          >
            {LUCK_DRAW.action}
          </button>
        )}
      </div>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
