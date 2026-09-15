import { Fragment, type ReactNode } from 'react'
import AdBannerSlot, { type AdBannerSlotProps } from './AdBannerSlot'

export interface DeviceListWithAdProps<T> {
  /** 设备列表（任意类型） */
  items: T[]
  /** 渲染单个设备卡片 */
  renderItem: (item: T, index: number) => ReactNode
  /** 列表项 key */
  getKey: (item: T, index: number) => string | number
  /** 设备数量阈值（默认 3） */
  threshold?: number
  /** 广告位配置 */
  adProps?: AdBannerSlotProps
  /** 列表容器 className */
  className?: string
}

/**
 * T041：按设备数量动态插入广告位的列表渲染器
 * - 设备数量 ≥ threshold：广告位插入到第 threshold-1 与第 threshold 个之间（即"第 2、3 个之间"）。
 * - 设备数量 < threshold：广告位放在列表末尾。
 * - threshold 默认 3。
 */
export default function DeviceListWithAd<T>({
  items,
  renderItem,
  getKey,
  threshold = 3,
  adProps,
  className = 'space-y-3',
}: DeviceListWithAdProps<T>) {
  const adElement = <AdBannerSlot {...adProps} />
  const shouldInsertMiddle = items.length >= threshold

  return (
    <div className={className}>
      {items.map((item, index) => (
        <Fragment key={getKey(item, index)}>
          {renderItem(item, index)}
          {shouldInsertMiddle && index === threshold - 2 ? adElement : null}
        </Fragment>
      ))}
      {!shouldInsertMiddle && items.length > 0 ? adElement : null}
    </div>
  )
}
