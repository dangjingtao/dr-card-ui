import { describe, expect, it } from 'vitest'
import { ChatSseDecoder } from './chatSse'

const bytes = (text: string) => new TextEncoder().encode(text)

describe('#136 SSE incremental parser', () => {
  it('assembles UTF-8 across arbitrary chunk boundaries and CRLF even when CR and LF are separated', () => {
    const parser = new ChatSseDecoder()
    const message = bytes(': ok\r\n\r\ndata: {"type":"text","content":"你🙂好"}\r\n\r\ndata: {"type":"done","message_id":123}\r\n\r\n')
    const frames = []
    for (const byte of message) frames.push(...parser.push(Uint8Array.of(byte)))
    frames.push(...parser.finish())
    expect(frames).toEqual([
      { type: 'text', content: '你🙂好' }, { type: 'done', message_id: 123 },
    ])
  })

  it('parses multiple frames in one network chunk, ignores comments and unknown SSE fields', () => {
    const decoder = new ChatSseDecoder()
    expect(decoder.push(bytes(
      ': ok\n\nevent: ignored\nretry: 1000\nid: 12\ndata: {"type":"human","new_field":"yes"}\n\ndata: {"type":"done"}\n\n',
    ))).toEqual([{ type: 'human', new_field: 'yes' }, { type: 'done' }])
    expect(decoder.finish()).toEqual([])
  })

  it('supports multiline data and partial lines across feeds', () => {
    const decoder = new ChatSseDecoder()
    expect(decoder.push(bytes('data: {"type":"text",\n'))).toEqual([])
    expect(decoder.push(bytes('data: "content":"你好"}\n\n'))).toEqual([{ type: 'text', content: '你好' }])
    expect(decoder.finish()).toEqual([])
  })

  it('recognizes error frames and rejects invalid frame types or truncated JSON', () => {
    const decoder = new ChatSseDecoder()
    expect(decoder.push(bytes('data: {"type":"error","message":"模型未配置"}\n\n'))).toEqual([
      { type: 'error', message: '模型未配置' },
    ])
    expect(() => decoder.push(bytes('data: {"type":"nonexistent"}\n\n'))).toThrow()
    expect(() => new ChatSseDecoder().push(bytes('data: not-json\n\n'))).toThrow('JSON')
    const incomplete = new ChatSseDecoder()
    incomplete.push(bytes('data: {"type":"done"}\n'))
    expect(() => incomplete.finish()).toThrow('帧结束前中断')
  })

  it('never accepts broken UTF-8 or an unbounded frame', () => {
    expect(() => new ChatSseDecoder().push(Uint8Array.of(0xff))).toThrow('UTF-8')
    expect(() => new ChatSseDecoder().push(bytes('data: ' + 'a'.repeat(1024 * 1024 + 10))))
      .toThrow('安全大小')
  })
})
