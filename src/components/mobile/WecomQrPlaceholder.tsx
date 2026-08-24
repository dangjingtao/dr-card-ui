const qrGrid = [
  [1, 0, 1, 0, 1, 0, 1, 1],
  [0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 0, 1],
  [0, 1, 0, 1, 0, 0, 1, 0],
  [1, 0, 1, 1, 0, 1, 0, 1],
  [0, 1, 0, 0, 1, 1, 1, 0],
  [1, 0, 1, 0, 0, 0, 1, 1],
  [0, 1, 1, 0, 1, 0, 0, 1],
]

export interface WecomQrPlaceholderProps {
  className?: string
  /** 无障碍名称；默认企业微信活码场景（#57 / #71） */
  label?: string
  /** 占位说明文案；传 null 隐藏 */
  caption?: string | null
  /** 单格边长（px）。#29/#34 的邀请二维码为 153×153，用 16 撑满 */
  cell?: number
}

/**
 * 二维码占位。
 * 真实活码/邀请码素材未入库（WELFARE_OFFICER_RULE_STATUS.qrAsset、BUDDY_RULE_STATUS.shareCapability），
 * 这里用可辨识的占位表达，**不伪造可扫码图形**。
 * 复用场景：#57 / #71 企业微信活码、#29 / #34 搭子邀请二维码。
 */
export default function WecomQrPlaceholder({
  className = '',
  label = '企业微信二维码占位',
  caption = 'QR Placeholder',
  cell = 9,
}: WecomQrPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex flex-col items-center rounded-xl bg-white p-3 shadow-sm ${className}`}
    >
      <div className="grid grid-cols-8 gap-[3px]">
        {qrGrid.map((row, r) =>
          row.map((cellOn, c) => (
            <span
              key={`${r}-${c}`}
              style={{ height: cell, width: cell }}
              className={`rounded-[1px] ${cellOn ? 'bg-[#1F2937]' : 'bg-transparent'}`}
              aria-hidden
            />
          )),
        )}
      </div>
      {caption && <span className="mt-2 text-[10px] tracking-wide text-text-tertiary">{caption}</span>}
    </div>
  )
}
