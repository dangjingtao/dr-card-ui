import PageContainer from '../components/mobile/PageContainer'
import WecomQrPlaceholder from '../components/mobile/WecomQrPlaceholder'
import { WELFARE_OFFICER, WELFARE_OFFICER_SERVICES } from '../app/fixtures'

export default function WelfareOfficer() {
  return (
    <PageContainer className="pb-24">
      <section className="mt-2 flex flex-col items-center rounded-2xl bg-surface px-5 pb-5 pt-6 text-center shadow-sm">
        <p className="text-sm leading-6 text-text-primary">
          {WELFARE_OFFICER.lead[0]}
          <br />
          {WELFARE_OFFICER.lead[1]}
        </p>
        <WecomQrPlaceholder className="mt-4" />
        <p className="mt-3 text-sm font-medium text-text-primary">
          {WELFARE_OFFICER.brand}
          {WELFARE_OFFICER.role} · {WELFARE_OFFICER.name}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">{WELFARE_OFFICER.qrHint}</p>
      </section>

      <section className="mt-3 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-reward-subtle text-base font-semibold text-reward-text" aria-hidden>
          {WELFARE_OFFICER.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {WELFARE_OFFICER.name} · {WELFARE_OFFICER.role}
          </p>
          <p className="mt-0.5 text-xs text-text-tertiary">
            {WELFARE_OFFICER.brand}企业微信 · 添加后由福利官直接对接
          </p>
        </div>
      </section>

      <section className="mt-4">
        <p className="mb-2 px-1 text-sm font-medium text-text-primary">添加福利官后，可享受</p>
        <ul className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          {WELFARE_OFFICER_SERVICES.map((service, index) => (
            <li
              key={service.key}
              className={`flex items-center gap-3 px-4 py-3.5 ${index > 0 ? 'border-t border-border-subtle' : ''}`}
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-reward-subtle text-sm font-semibold text-reward-text" aria-hidden>
                {service.glyph}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">{service.title}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  )
}
