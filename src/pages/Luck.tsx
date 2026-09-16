import { Waves } from 'lucide-react'
import DebugPanel from '../components/mobile/DebugPanel'
import PageContainer from '../components/mobile/PageContainer'
import { useFixtureState } from '../app/fixtures/useFixture'
import { findRouteByPathname } from '../app/router/routes'
import { LUCK_PLACEHOLDER, LUCK_RULE_STATUS } from '../app/fixtures'
import luckDrawHero from '../assets/brand/luck/luck-draw-hero.webp'

/**
 * 今日澡运（#7）——不可操作占位页
 * -------------------------------------------------------------
 * 事实源：docs/prototype/02-membership-and-checkin.md §8
 * ⚠️ B-003 未决：抽签档位数量与命名、是否允许重抽、结果是否当天持久化均未确认。
 * 需求确认（docs/requirements/2026-08-27-ui-change-requirements.md §4.3）+ T022 整改结论：
 *    澡运入口与目标页本阶段都是占位，且占位必须是「真占位」——
 *    本页不提供任何可操作的抽取 / 查看结果入口，也不跳转 /luck/result，
 *    避免用户以为玩法已定稿。摹客确认的「抽取今日澡运」主按钮文案暂存在
 *    LUCK_DRAW，等玩法定稿后再恢复为真实 CTA。
 *    /luck/result（#41）本身仍作为独立历史节点保留，只能直达 URL 复现，不从本页进入。
 */
export default function Luck() {
  const route = findRouteByPathname('/luck')
  const { state } = useFixtureState(route)

  /** ?state=drawn：原型 §9 提到「当天已抽过再次进入可直接看到结果」，规则未确认，占位期不给结果入口 */
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
        {/* 需求 §4.3：目标页需要明确占位标识，与泡泡值福利入口的「玩法待定」保持同一口径 */}
        <span className="mt-2 inline-flex items-center rounded-pill bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-text-brand">
          {LUCK_PLACEHOLDER.tag}
        </span>

        {/*
          整改：原「抽取今日澡运」主按钮改为不可操作的占位状态块。
          刻意不使用 button / a，保证页面上不存在任何可点击的抽取或结果入口。
        */}
        <div
          data-luck-placeholder
          aria-disabled="true"
          className="mt-8 flex h-12 w-full max-w-[280px] items-center justify-center rounded-full border border-dashed border-border bg-secondary text-base font-medium text-text-tertiary"
        >
          {LUCK_PLACEHOLDER.headline}
        </div>
        <p className="mt-3 max-w-[280px] text-sm leading-6 text-text-secondary">
          {LUCK_PLACEHOLDER.subline}
        </p>

        {drawn ? (
          /* 未定稿提示只在夹具态出现，避免把「当天已抽过」表现成已确认规则；占位期同样不提供结果入口 */
          <p className="mt-3 max-w-[280px] text-xs leading-5 text-text-tertiary">
            夹具态：{LUCK_RULE_STATUS.isolatedNote}
          </p>
        ) : null}

        {/* 需求 §4.3：占位说明常驻，任何状态下都不把澡运表现成已定稿玩法 */}
        <p className="mt-3 max-w-[280px] text-xs leading-5 text-text-tertiary">{LUCK_PLACEHOLDER.note}</p>
      </div>

      <DebugPanel route={route} />
    </PageContainer>
  )
}
