import { z } from 'zod'
import { parseApiEnvelope } from './contracts/apiEnvelope'
import { httpClient } from './http'

/** H5 ↔ 后台的兑换码核兑协议；见 docs/engineering/card-code-redeem-contract.md。 */
export const REDEEM_CARD_CODE_PATH = '/api/cardredemptioncodes/redeem'

/**
 * 只提交用户输入的原码。服务端业务成功 code=0 才算兑换成功；
 * 不强加尚未由后台确认的发券回执字段。
 */
export async function redeemCardCode(code: string): Promise<void> {
  const payload = await httpClient.request<unknown>({
    method: 'POST',
    url: REDEEM_CARD_CODE_PATH,
    data: { code },
  })
  parseApiEnvelope(payload, z.unknown(), {
    contract: 'cardredemptioncodes.redeem',
    fallbackMessage: '兑换失败，请稍后重试',
  })
}
