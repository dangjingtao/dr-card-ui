import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bug, X } from 'lucide-react'
import { Tag } from '../ui'
import type { RouteMeta } from '../../app/router/routes'
import { useFixtureState, useOverlay } from '../../app/fixtures/useFixture'

interface DebugPanelProps {
  route?: RouteMeta
}

/**
 * 状态调试面板（验收用，非业务 UI）
 * -------------------------------------------------------------
 * 只读 routes.ts 已登记的 `states` / `overlays`，把「确定性状态」与「可复现弹层」
 * 摆成可点的胶囊；切换仍然只改 URL（`?state=` / `?overlay=`），页面照旧从 URL 派生状态，
 * 因此面板本身不持有任何业务状态，也不会引入第二套真值来源。
 * - 仅在 URL 带 `?debug=1` 时渲染：正常页面（含验收截图与真实浏览）不会出现任何调试入口，
 *   避免调试胶囊遮挡底部操作区；
 * - 切换状态/弹层时从当前 search 派生新 search，`debug=1` 原样保留，保证连续切换不掉出调试态；
 * - 没有登记任何状态/弹层的路由直接返回 null，不在页面上留痕；
 * - z-[60] 高于弹层与 Toast（z-50）与 Tabbar（z-40），确保弹层打开时仍可继续切换。
 */
export default function DebugPanel({ route }: DebugPanelProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { raw } = useFixtureState(route)
  const { overlay } = useOverlay()
  const [open, setOpen] = useState(true)

  const states = route?.states ?? []
  const overlays = route?.overlays ?? []
  const debugEnabled = new URLSearchParams(location.search).get('debug') === '1'

  if (!debugEnabled) return null
  if (!route || (states.length === 0 && overlays.length === 0)) return null

  /** 从当前 search 派生，`debug=1` 等无关参数原样保留 */
  const apply = (patch: Array<[string, string | null]>) => {
    const search = new URLSearchParams(location.search)
    patch.forEach(([key, value]) => {
      if (value == null) search.delete(key)
      else search.set(key, value)
    })
    const query = search.toString()
    navigate(query ? `${location.pathname}?${query}` : location.pathname, { replace: true })
  }

  return (
    <div
      data-debug-panel
      className="pointer-events-none fixed bottom-0 left-1/2 z-[60] flex w-full max-w-[480px] -translate-x-1/2 flex-col items-end px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      {open && (
        <section
          data-debug-panel-body
          aria-label="状态调试面板"
          className="pointer-events-auto mb-2 w-full rounded-container bg-surface-inverse p-3 text-text-inverse shadow-floating"
        >
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">调试面板 · {route.task}</p>
              <p className="truncate text-[11px] opacity-70">
                {route.path} · 节点 {route.nodes.join('/')}
              </p>
            </div>
            <button
              type="button"
              aria-label="收起调试面板"
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {states.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wide opacity-70">状态 ?state=</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  data-debug-state="default"
                  onClick={() => apply([['state', null], ['overlay', null]])}
                >
                  <Tag variant={raw == null ? 'brand' : 'neutral'}>默认</Tag>
                </button>
                {states.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    data-debug-state={item.key}
                    onClick={() => apply([['state', item.key], ['overlay', null]])}
                  >
                    <Tag variant={raw === item.key ? 'brand' : 'neutral'}>
                      {item.label} · #{item.node}
                    </Tag>
                  </button>
                ))}
              </div>
            </div>
          )}

          {overlays.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wide opacity-70">弹层 ?overlay=</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  data-debug-overlay="default"
                  onClick={() => apply([['overlay', null]])}
                >
                  <Tag variant={overlay == null ? 'brand' : 'neutral'}>关闭</Tag>
                </button>
                {overlays.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    data-debug-overlay={item.key}
                    onClick={() => apply([['overlay', item.key]])}
                  >
                    <Tag variant={overlay === item.key ? 'brand' : 'neutral'}>
                      {item.label} · #{item.node}
                    </Tag>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <button
        type="button"
        aria-label="调试面板"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="pointer-events-auto flex h-9 items-center gap-1.5 rounded-full bg-surface-inverse px-3 text-xs font-medium text-text-inverse shadow-floating"
      >
        <Bug className="h-3.5 w-3.5" aria-hidden />
        调试
      </button>
    </div>
  )
}
