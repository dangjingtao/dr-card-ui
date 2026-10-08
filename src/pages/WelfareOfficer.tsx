import { useEffect, useState } from 'react'

import PageContainer from '../components/mobile/PageContainer'
import { useRemoteData } from './profile/useProfileFeed'
import { fetchWelfareOfficerConfig, type WelfareBenefit } from '../services/welfareOfficer'

/** 图像加载失败后只能显示非扫码说明，不能回落到假的二维码占位。 */
function WelfareQrImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])

  return failed ? (
    <p className="mt-4 text-xs text-text-tertiary" role="status">二维码加载失败，请稍后再试</p>
  ) : (
    <div className="mt-4 rounded-xl bg-white p-3 shadow-sm">
      <img
        src={src}
        alt="福利官企业微信二维码"
        className="h-[176px] w-[176px] object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function BenefitImage({ benefit }: { benefit: WelfareBenefit }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [benefit.imageUrl])

  return (
    <span className="relative flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-reward-subtle text-sm font-semibold text-reward-text" aria-hidden>
      {benefit.title.charAt(0) || '福'}
      {benefit.imageUrl && !failed ? (
        <img
          src={benefit.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  )
}

/**
 * 品牌福利官 #57 / H041
 * GET /api/settings/detail?key=brand_welfare_setting，和旧福利富文本不同 key。
 * 正式 API 模式不使用 WELFARE_OFFICER、静态三项服务或假的 QR 占位。
 */
export default function WelfareOfficer() {
  const { remote, reload } = useRemoteData(fetchWelfareOfficerConfig)

  if (remote.state === 'loading') {
    return (
      <PageContainer className="pb-24">
        <section className="mt-2 rounded-2xl bg-surface px-5 py-6 text-center shadow-sm" role="status">
          <p className="text-sm text-text-secondary">正在加载福利官信息…</p>
        </section>
      </PageContainer>
    )
  }

  if (remote.state === 'error') {
    return (
      <PageContainer className="pb-24">
        <section className="mt-2 rounded-2xl bg-surface px-5 py-6 text-center shadow-sm" role="alert">
          <p className="text-sm text-text-primary">福利官信息暂不可用</p>
          <p className="mt-2 text-xs text-text-tertiary">{remote.message}</p>
          <button
            type="button"
            className="mt-4 rounded-pill bg-reward-subtle px-5 py-2 text-sm font-medium text-reward-text"
            onClick={reload}
          >重试</button>
        </section>
      </PageContainer>
    )
  }

  const config = remote.data

  if (!config.configured) {
    return (
      <PageContainer className="pb-24">
        <section className="mt-2 rounded-2xl bg-surface px-5 py-6 text-center shadow-sm" role="status">
          <p className="text-sm text-text-secondary">福利官信息尚未配置</p>
        </section>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="pb-24">
      <section className="mt-2 flex flex-col items-center rounded-2xl bg-surface px-5 pb-5 pt-6 text-center shadow-sm">
        {config.title ? (
          <p className="text-sm leading-6 text-text-primary">{config.title}</p>
        ) : null}
        {config.qrcodeUrl ? <WelfareQrImage src={config.qrcodeUrl} /> : null}
        {config.qrcodeUnavailable ? (
          <p className="mt-4 text-xs text-text-tertiary" role="status">二维码暂不可用，请稍后查看</p>
        ) : null}
        {config.qrcodeUrl ? (
          <p className="mt-3 text-xs text-text-tertiary">长按或扫描二维码，联系福利官</p>
        ) : null}
      </section>

      {config.subtitle ? (
        <section className="mt-3 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-reward-subtle text-base font-semibold text-reward-text" aria-hidden>福</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">{config.subtitle}</p>
            <p className="mt-0.5 text-xs text-text-tertiary">品牌福利官 · 企业微信咨询</p>
          </div>
        </section>
      ) : null}

      {config.benefits.length > 0 ? (
        <section className="mt-4">
          <p className="mb-2 px-1 text-sm font-medium text-text-primary">福利官服务与权益</p>
          <ul className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            {config.benefits.map((benefit, index) => (
              <li
                key={index}
                className={`flex items-center gap-3 px-4 py-3.5 ${index > 0 ? 'border-t border-border-subtle' : ''}`}
              >
                <BenefitImage benefit={benefit} />
                <div className="min-w-0 flex-1">
                  {benefit.title ? <p className="text-sm font-medium text-text-primary">{benefit.title}</p> : null}
                  {benefit.description ? <p className="mt-0.5 text-xs text-text-tertiary">{benefit.description}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageContainer>
  )
}
