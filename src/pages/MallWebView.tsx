/**
 * 商城 H5 承载页
 * -------------------------------------------------------------
 * 底部 Tab「商城」(/mall) 不再做本地原生还原，改为在当前手机界面框架内
 * 以 iframe 加载商城 H5（www.3-wins.cn），使底栏与手机壳层保持可见，
 * 不跳出 App / H5 外层界面。
 *
 * 真实域名与鉴权透传方式未定（见 T008 决策 §8），目标站是否允许被嵌套
 * （X-Frame-Options / CSP frame-ancestors）由对方决定，需在 App 内验证。
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
