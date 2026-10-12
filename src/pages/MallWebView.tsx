/**
 * 商城 H5 承载页
 * -------------------------------------------------------------
 * 底部 Tab「商城」(/mall) 不再做本地原生还原，改为在当前手机界面框架内
 * 以 iframe 加载商城 H5，使底栏与手机壳层保持可见，
 * 不跳出 App / H5 外层界面。
 *
 * 2026-10-12：当前地址仅用于效果预览，不代表正式商城接入方案。
 * 保留用户提供的 http scheme，不自动改写为 https；鉴权透传、cleartext/mixed-content
 * 及目标站 iframe 策略仍需在真实 App WebView 内单独验证。
 */
const MALL_H5_URL = 'http://scmzhds07.m.demo.webportal.top/?_sc=1'

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
