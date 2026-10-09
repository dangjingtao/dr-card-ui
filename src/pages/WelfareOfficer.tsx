import { useCallback, useEffect, useRef, useState } from 'react'

import PageContainer from '../components/mobile/PageContainer'
import { BottomSheet, Skeleton } from '../components/ui'
import { requestWelfareQrDownload } from '../services/welfareQrDownload'
import { useRemoteData } from './profile/useProfileFeed'
import { fetchWelfareOfficerConfig, type WelfareBenefit } from '../services/welfareOfficer'

/** 保持二维码主卡/介绍卡/权益列表的轮廓，避免接口加载时布局大幅跳动。 */
function WelfareOfficerSkeleton() {
  return (
    <PageContainer className="pb-24">
      <div role="status" aria-busy="true" aria-label="正在加载福利官信息">
        <span className="sr-only">正在加载福利官信息…</span>
        <section aria-hidden="true" className="mt-2 flex flex-col items-center rounded-2xl bg-surface px-5 pb-5 pt-6 text-center shadow-sm">
          <Skeleton className="h-4 w-36" />
          <div className="mt-4 rounded-xl bg-white p-3 shadow-sm">
            <Skeleton className="h-[176px] w-[176px] rounded-lg" />
          </div>
          <Skeleton className="mt-3 h-3 w-44" />
        </section>
        <section aria-hidden="true" className="mt-3 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 max-w-full" />
            <Skeleton className="h-3 w-44 max-w-full" />
          </div>
        </section>
        <section aria-hidden="true" className="mt-4">
          <Skeleton className="mb-2 ml-1 h-4 w-28" />
          <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex items-center gap-3 border-b border-border-subtle px-4 py-3.5 last:border-0">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28 max-w-full" />
                  <Skeleton className="h-3 w-40 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}

/**
 * 只有已通过福利官配置服务校验的 HTTPS 图片才会传进此组件。
 * 图片已加载不表示用户能将它保存到设备；H5 下载只请求浏览器/宿主执行下载。
 */
function WelfareQrImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  const [saveSheetOpen, setSaveSheetOpen] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'pending' | 'requested' | 'error'>('idle')
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressOrigin = useRef<{ x: number; y: number } | null>(null)

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current != null) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    pressOrigin.current = null
  }, [])

  useEffect(() => {
    setFailed(false)
    setSaveSheetOpen(false)
    setSaveState('idle')
    return clearLongPress
  }, [src, clearLongPress])

  const openSaveSheet = () => {
    clearLongPress()
    setSaveState('idle')
    setSaveSheetOpen(true)
  }

  const requestDownload = async () => {
    if (saveState === 'pending') return
    setSaveState('pending')
    try {
      await requestWelfareQrDownload(src)
      // The click on an H5 download link does NOT confirm a file was saved.
      setSaveState('requested')
    } catch {
      setSaveState('error')
    }
  }

  if (failed) {
    return <p className="mt-4 text-xs text-text-tertiary" role="status">二维码加载失败，请稍后再试</p>
  }

  return (
    <div className="mt-4 flex flex-col items-center">
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <button
          type="button"
          aria-label="打开二维码保存菜单"
          className="block rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          style={{ WebkitTouchCallout: 'none', touchAction: 'pan-y' }}
          onClick={openSaveSheet}
          onContextMenu={(event) => {
            event.preventDefault()
            openSaveSheet()
          }}
          onPointerDown={(event) => {
            if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
            clearLongPress()
            pressOrigin.current = { x: event.clientX, y: event.clientY }
            longPressTimer.current = setTimeout(openSaveSheet, 550)
          }}
          onPointerMove={(event) => {
            const origin = pressOrigin.current
            if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 12) {
              clearLongPress()
            }
          }}
          onPointerUp={clearLongPress}
          onPointerCancel={clearLongPress}
          onPointerLeave={clearLongPress}
        >
          <img
            src={src}
            alt="福利官企业微信二维码"
            draggable={false}
            className="h-[176px] w-[176px] select-none object-contain"
            onError={() => setFailed(true)}
          />
        </button>
      </div>
      <p className="mt-3 text-xs text-text-tertiary">长按保存二维码，或使用另一台设备扫码联系福利官</p>
      <button
        type="button"
        className="mt-2 min-h-10 rounded-pill px-4 text-xs font-medium text-reward-text"
        onClick={openSaveSheet}
      >
        保存二维码
      </button>
      <BottomSheet open={saveSheetOpen} title="保存福利官二维码" onClose={() => setSaveSheetOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm leading-6 text-text-secondary">
            尝试通过 H5 下载二维码图片。部分 App WebView 不支持下载到相册，操作后请到相册或下载管理核对。
          </p>
          <button
            type="button"
            disabled={saveState === 'pending'}
            className="min-h-11 w-full rounded-pill bg-primary px-4 text-sm font-medium text-text-inverse disabled:opacity-60"
            onClick={() => void requestDownload()}
          >
            {saveState === 'pending' ? '正在准备图片…' : '尝试下载图片'}
          </button>
          {saveState === 'requested' ? (
            <p role="status" className="text-xs leading-5 text-text-secondary">
              已向浏览器请求下载，但无法确认是否存入相册。请检查下载管理或相册。
            </p>
          ) : null}
          {saveState === 'error' ? (
            <p role="alert" className="text-xs leading-5 text-danger-text">
              H5 无法下载该图片（可能受图片跨域或 WebView 限制）。可以打开原图，尝试使用系统长按保存。
            </p>
          ) : null}
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center rounded-pill border border-border text-sm text-text-primary"
          >
            打开二维码原图
          </a>
          <button
            type="button"
            className="min-h-11 w-full rounded-pill text-sm text-text-secondary"
            onClick={() => setSaveSheetOpen(false)}
          >
            取消
          </button>
        </div>
      </BottomSheet>
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

  if (remote.state === 'loading') return <WelfareOfficerSkeleton />

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
