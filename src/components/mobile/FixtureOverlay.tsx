import { BottomSheet, Button, Dialog } from '../ui'
import { useOverlay } from '../../app/fixtures/useFixture'
import type { RouteMeta } from '../../app/router/routes'

interface FixtureOverlayProps {
  route: RouteMeta
}

/**
 * 可复现弹层夹具（T004）
 * -------------------------------------------------------------
 * 由 `?overlay=<key>` 打开对应 dialog / bottom-sheet，无需手工改源码即可截图。
 * 内容为明确标记的夹具壳，真实业务内容由对应任务卡施工替换。
 */
export default function FixtureOverlay({ route }: FixtureOverlayProps) {
  const { overlay, close } = useOverlay()
  if (!overlay) return null
  const target = route.overlays?.find((item) => item.key === overlay)
  if (!target) return null

  const actions = (
    <>
      <Button variant="outline" onClick={close}>
        取消
      </Button>
      <Button onClick={close}>确认</Button>
    </>
  )

  const body = (
    <p className="text-sm text-text-secondary">
      可复现弹层夹具 · 节点 #<b className="text-text-primary">{target.node}</b>（
      {target.label}）。确认/取消为夹具行为，真实内容由{' '}
      <b className="text-text-primary">{route.task}</b> 施工。
    </p>
  )

  return target.type === 'dialog' ? (
    <Dialog open title={target.label} onClose={close} actions={actions}>
      {body}
    </Dialog>
  ) : (
    <BottomSheet open title={target.label} onClose={close} actions={actions}>
      {body}
    </BottomSheet>
  )
}
