import { z } from 'zod'
import { createContractError } from './http'
import { parseContract } from './contracts/parseContract'

const frameSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), content: z.string() }).passthrough(),
  z.object({ type: z.literal('human') }).passthrough(),
  z.object({ type: z.literal('done'), message_id: z.number().int().positive().optional() }).passthrough(),
  z.object({ type: z.literal('error'), message: z.string() }).passthrough(),
])

export type ChatSseFrame = z.infer<typeof frameSchema>
const MAX_FRAME_CHARS = 1024 * 1024

/** Incremental SSE reader: network chunks are NOT UTF-8 characters, lines, or SSE frames. */
export class ChatSseDecoder {
  private readonly decoder = new TextDecoder('utf-8', { fatal: true })
  private pending = ''
  private dataLines: string[] = []
  private dataLength = 0

  push(chunk: Uint8Array): ChatSseFrame[] {
    try {
      this.pending += this.decoder.decode(chunk, { stream: true })
    } catch {
      throw createContractError('客服消息流包含无效 UTF-8')
    }
    return this.drain()
  }

  finish(): ChatSseFrame[] {
    try { this.pending += this.decoder.decode() } catch {
      throw createContractError('客服消息流包含不完整的 UTF-8')
    }
    const frames = this.drain()
    // Only a blank line terminates a frame; the server must send a complete terminal event.
    if (this.pending.length !== 0 || this.dataLines.length !== 0) {
      throw createContractError('客服消息流在帧结束前中断')
    }
    return frames
  }

  private drain(): ChatSseFrame[] {
    const frames: ChatSseFrame[] = []
    while (true) {
      const newline = this.pending.indexOf('\n')
      if (newline < 0) break
      const line = this.pending.slice(0, newline).replace(/\r$/, '')
      this.pending = this.pending.slice(newline + 1)
      if (line === '') {
        if (this.dataLines.length) frames.push(this.parseFrame())
        this.dataLines = []
        this.dataLength = 0
      } else if (line.startsWith('data:')) {
        const data = line.slice(5).replace(/^ /, '')
        this.dataLines.push(data)
        this.dataLength += data.length
      }
      // ":" comments (e.g. ": ok"), event/id/retry and other unrecognized fields are ignored.
      if (this.pending.length > MAX_FRAME_CHARS || this.dataLength > MAX_FRAME_CHARS) {
        throw createContractError('客服消息流单帧超过安全大小')
      }
    }
    if (this.pending.length > MAX_FRAME_CHARS) {
      throw createContractError('客服消息流单帧超过安全大小')
    }
    return frames
  }

  private parseFrame(): ChatSseFrame {
    let raw: unknown
    try { raw = JSON.parse(this.dataLines.join('\n')) } catch {
      throw createContractError('客服消息流帧不是有效 JSON')
    }
    return parseContract(frameSchema, raw, { source: 'api', contract: 'chatmessages.add.sse.frame' })
  }
}
