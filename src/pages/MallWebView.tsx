/**
 * 商城 H5 承载页
 * -------------------------------------------------------------
 * 底部 Tab「商城」(/mall) 不再做本地原生还原，改为在当前手机界面框架内
 * 以 iframe 加载商城 H5（www.3-wins.cn），使底栏与手机壳层保持可见，
 * 不跳出 App / H5 外层界面。
 *
 * 2026-09-29 Maintainer 明确定案：当前联调地址固定为 http://www.3-wins.cn/，
 * 不自动替换 scheme。鉴权透传、cleartext/mixed-content 以及目标站 iframe 策略
 * （X-Frame-Options / CSP frame-ancestors）仍需在真实 App WebView 内验证。
 */
const MALL_H5_URL = 'http://www.3-wins.cn/'

export default function MallWebView() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <iframe
        src={MALL_H5_URL}
        title="商城 H5"
        className="w-full flex-1 border-0"
      />
    </div>
  )
}
