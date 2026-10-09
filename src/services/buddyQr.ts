import { runtimePolicy } from '../app/config/runtime'
import { fetchUserProfile } from './userProfile'

/**
 * #105 尚未由后台签署 method/path/DTO。这里只定义 H5 消费的最小服务合同；
 * 不要将提案中的 API 路径误当生产接口，也不要从用户 ID 或手机号本地生成二维码。
 */
export interface OwnBuddyQr {
  url: string
  demo: boolean
}

export interface BuddyQrBackendContract {
  /** 后台确认后，由 service/http adapter 注入这个真实登录态查询函数。 */
  readMyQr: () => Promise<unknown>
  /** 部署负责人确认的公开二维码域名；防止服务端错误/恶意返回任意网页链接。 */
  trustedOrigin: string
}

export class BuddyQrError extends Error {
  constructor(readonly reason: 'not-configured' | 'invalid-qr' | 'fetch-failed' | 'missing-code' | 'missing-origin') {
    super(reason === 'missing-code'
      ? '当前账号暂未生成邀请识别码，请稍后重试'
      : reason === 'missing-origin'
        ? '邀请二维码域名未配置，请联系开发同学'
        : reason === 'not-configured'
          ? '二维码接口尚未接通，请稍后再试'
      : reason === 'invalid-qr'
        ? '邀请二维码数据无效，请稍后再试'
        : '获取邀请二维码失败，请稍后重试')
    this.name = 'BuddyQrError'
  }
}

// 仅在 preview/dev Mock 渲染的示例，绝不指向真实用户，也不能被后台当成合法邀请。
const MOCK_QR_URL =
  'https://test.dr-card-ui.pages.dev/buddy/invite/scan?demo=qr-preview-only-no-binding'

function validOrigin(raw: string): string {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.pathname !== '/' || url.port) throw new Error('invalid origin')
    return url.origin
  } catch {
    throw new BuddyQrError('invalid-qr')
  }
}

/** 验证后端返回的地址可被外部相机安全打开，并且确属指定官方域名。 */
export function validateBuddyQrUrl(raw: unknown, trustedOrigin: string): string {
  if (typeof raw !== 'string' || !raw || raw.length > 2048 || raw.trim() !== raw ||
    /[\u0000-\u001f\u007f]/.test(raw)) throw new BuddyQrError('invalid-qr')
  try {
    const url = new URL(raw)
    const origin = validOrigin(trustedOrigin)
    // 外部只引导、不绑定；不能接受任意来源、userinfo、fragment 或跳转地址。
    if (url.protocol !== 'https:' || url.origin !== origin || url.username ||
      url.password || url.hash || url.port || url.pathname !== '/buddy/invite/scan' ||
      !url.search || url.searchParams.has('redirect') || url.searchParams.has('tokenUrl')) {
      throw new Error('not a trusted QR landing URL')
    }
    // 至少一个不可空的标识字段；参数命名由后台 Owner 最终确定。
    if (![...url.searchParams.values()].some(v => v.length >= 16)) {
      throw new Error('no opaque identifier')
    }
    return url.href
  } catch {
    throw new BuddyQrError('invalid-qr')
  }
}

/** 仅使用部署配置的官方 HTTPS Origin 和当前登录账号识别码。 */
export function buildBuddyInviteUrl(code: string, configuredOrigin: string | undefined): string {
  if (!configuredOrigin?.trim()) throw new BuddyQrError('missing-origin')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code)) {
    throw new BuddyQrError('invalid-qr')
  }
  let origin: string
  try { origin = validOrigin(configuredOrigin) }
  catch { throw new BuddyQrError('missing-origin') }
  const url = new URL('/buddy/invite/scan', origin)
  url.searchParams.set('code', code)
  return validateBuddyQrUrl(url.href, origin)
}

/** mock 保持独立；API 使用当前登录账号的 profile。 */
export async function loadOwnBuddyQr(backend?: BuddyQrBackendContract): Promise<OwnBuddyQr> {
  if (!backend && runtimePolicy.dataMode === 'mock') {
    return {
      url: validateBuddyQrUrl(MOCK_QR_URL, 'https://test.dr-card-ui.pages.dev'),
      demo: true,
    }
  }
  if (!backend) {
    let profile: Awaited<ReturnType<typeof fetchUserProfile>>
    try { profile = await fetchUserProfile() }
    catch { throw new BuddyQrError('fetch-failed') }
    if (!profile.identifyCode) throw new BuddyQrError('missing-code')
    return { url: buildBuddyInviteUrl(profile.identifyCode, import.meta.env.VITE_BUDDY_PUBLIC_ORIGIN), demo: false }
  }
  let response: unknown
  try {
    response = await backend.readMyQr()
  } catch {
    throw new BuddyQrError('fetch-failed')
  }
  // DTO 候选；真实后台合同确认后在此对接 Zod/HTTP，页面无须知道 endpoint。
  if (response === null || typeof response !== 'object') throw new BuddyQrError('invalid-qr')
  const url = (response as { qrUrl?: unknown }).qrUrl
  return { url: validateBuddyQrUrl(url, backend.trustedOrigin), demo: false }
}
