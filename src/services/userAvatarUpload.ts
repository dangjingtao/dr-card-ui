import { z } from 'zod'
import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

export const USER_AVATAR_UPLOAD_PATH = '/api/upload/image'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp'])
const uploadSchema = z.object({ url: z.string() }).passthrough()

export function requirePublicImageUrl(value: string): string {
  let url: URL
  try { url = new URL(value) } catch { throw new Error('图片上传返回了无效地址') }
  const host = url.hostname.toLowerCase()
  if (url.protocol !== 'https:' || host === 'localhost' || host === '[::1]' ||
    /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^169\.254\./.test(host) ||
    /^0\./.test(host) || host.endsWith('.local') || value.length > 255) {
    throw new Error('上传地址不是手机可访问的 HTTPS 图片地址，请联系后台处理')
  }
  return url.toString()
}

export async function uploadUserAvatar(image: { mimeType: string; imageBase64: string }): Promise<string> {
  const mime = image.mimeType.toLowerCase()
  if (!allowedMime.has(mime)) throw new Error('请选择 JPG、PNG 或 WebP 格式的头像')
  const raw = image.imageBase64.replace(/^data:[^,]+,/, '')
  if (raw.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 8) throw new Error('头像不能超过 5MB')
  let binary: string
  try { binary = atob(raw) } catch { throw new Error('头像图片数据无效') }
  if (!binary.length || binary.length > MAX_IMAGE_BYTES) throw new Error('头像不能为空且不能超过 5MB')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  const body = new FormData()
  body.append('file', new File([bytes], `avatar.${ext}`, { type: mime }))
  const response = await httpClient.request<unknown>({
    method: 'POST',
    url: USER_AVATAR_UPLOAD_PATH,
    data: body,
    timeout: 30000,
  })
  const result = parseApiEnvelope(response, uploadSchema, {
    contract: 'user.avatar-upload',
    fallbackMessage: '头像上传失败',
  })
  return requirePublicImageUrl(result.url)
}
