import { X } from 'lucide-react'
import { closeWebView, getNativeBridgeDiagnostics } from '../../services/nativeBridge'

export interface HostCloseButtonProps {
  tone?: 'default' | 'inverse'
  className?: string
}

/**
 * App-WebView close intent.
 *
 * H030 has confirmed the Android/iOS `closeWebView()` contract. The button stays disabled when
 * the current App build has not injected that method, and becomes callable automatically when the
 * capability is present. Do not replace this with history.back()/window.close(): those are not
 * equivalent to closing the App's WebView container.
 */
export default function HostCloseButton({ tone = 'default', className = '' }: HostCloseButtonProps) {
  const supported = getNativeBridgeDiagnostics().capabilities.closeWebView

  const handleClose = () => {
    if (!supported) return
    void closeWebView().catch((error) => {
      // The adapter owns protocol/error normalization. Native currently defines no result payload
      // or structured failure schema for this synchronous close intent.
      console.error('[host-close]', error)
    })
  }

  return (
    <button
      type="button"
      aria-label="关闭"
      data-host-close
      data-host-close-supported={supported ? 'true' : 'false'}
      disabled={!supported}
      title={supported ? '关闭' : '当前 App 版本暂不支持关闭 WebView'}
      onClick={handleClose}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition active:bg-[rgba(89,55,15,0.06)] disabled:cursor-default disabled:opacity-100 ${tone === 'inverse' ? 'text-white active:bg-white/10' : 'text-text-primary'} ${className}`}
    >
      <X className="h-[21px] w-[21px] stroke-[2.2]" aria-hidden />
    </button>
  )
}
