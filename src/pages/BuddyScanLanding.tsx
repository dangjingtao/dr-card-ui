import { QrCode, Smartphone } from 'lucide-react'

/**
 * #102 洗头搭子唯一二维码的外部扫码落地页。
 *
 * 只提供「请在卡博士 App 内使用诗得丽扫一扫」引导，不展示邀请方资料，
 * 不检测安装态、不调用 Native openApp、不携带二维码重新进入绑定页面。
 * 未确认官方应用商店地址前不渲染虚假的下载按钮。
 */
export default function BuddyScanLanding() {
  return (
    <main
      className="app-background flex min-h-dvh flex-col items-center justify-center px-6 pb-[env(safe-area-inset-bottom)] text-text-primary"
      aria-label="洗头搭子扫码使用提示"
    >
      <div className="w-full max-w-[420px] rounded-container bg-surface px-6 py-10 text-center shadow-card">
        <span
          aria-hidden
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-buddy-surface text-buddy-accent"
        >
          <QrCode className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-xl font-semibold leading-7">请在卡博士 App 内扫码</h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          洗头搭子二维码需要使用卡博士 App 中的「诗得丽扫一扫」识别，微信或系统相机无法直接绑定搭子。
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 rounded-container bg-buddy-surface px-4 py-3 text-sm text-buddy-accent">
          <Smartphone className="h-5 w-5 flex-none" aria-hidden />
          打开卡博士 App，使用底部「扫码」
        </div>
        <p className="mt-5 text-xs leading-5 text-text-tertiary">
          尚未安装？请通过官方渠道获取卡博士 App。
        </p>
      </div>
    </main>
  )
}
