/**
 * Best-effort H5 download request; browsers / App WebViews do not acknowledge
 * whether the user actually saved the file to Photos or Downloads.
 *
 * Cross-origin images require CORS permission from their actual HTTPS host.
 * Do not report "saved to album" after this function resolves.
 */
export async function requestWelfareQrDownload(src: string): Promise<void> {
  const response = await fetch(src, { mode: 'cors', credentials: 'omit' })
  if (!response.ok) throw new Error('二维码图片下载请求失败')

  const image = await response.blob()
  if (!image.type.startsWith('image/') || !image.size || image.size > 12 * 1024 * 1024) {
    throw new Error('二维码图片格式或大小不符合下载要求')
  }

  const extension = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  }[image.type]
  if (!extension) throw new Error('暂不支持此二维码图片格式')

  const blobUrl = URL.createObjectURL(image)
  try {
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = `brand-welfare-qr.${extension}`
    anchor.hidden = true
    document.body.appendChild(anchor)
    try {
      anchor.click()
    } finally {
      anchor.remove()
    }
  } finally {
    // Delay revocation so mobile download managers can claim the Blob URL.
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  }
}
