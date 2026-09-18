import { X } from 'lucide-react'
import { closeWebView, getNativeBridgeDiagnostics } from '../../services/nativeBridge'

export interface HostCloseButtonProps {
  tone?: 'default' | 'inverse'
  className?: string
}

/**
 * App-WebView close intent.
 *
 * H015 has not confirmed the actual Native close protocol yet, so the button is rendered in the
 * product-correct place but stays disabled until the bridge adapter reports the capability.
 * Do not replace this with history.back()/window.close(): those are not equivalent to closing the
 * App's WebView container.
 */
export default function HostCloseButton({ tone = 'default', className = '' }: HostCloseButtonProps) {
  const supported = getNativeBridgeDiagnostics().capabilities.closeWebView

  const handleClose = () => {
    if (!supported) return
    void closeWebView().catch((error) => {
      // The adapter owns protocol/error normalization. A future host integration can promote this
      // to product feedback if Native close can legitimately fail after capability detection.
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
      title={supported ? '关闭' : '等待 App 宿主提供关闭 WebView 的 JSBridge 协议'}
      onClick={handleClose}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition active:bg-[rgba(89,55,15,0.06)] disabled:cursor-default disabled:opacity-100 ${tone === 'inverse' ? 'text-white active:bg-white/10' : 'text-text-primary'} ${className}`}
    >
      <X className="h-[21px] w-[21px] stroke-[2.2]" aria-hidden />
    </button>
  )
}
