import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchRichTextSetting,
  parseRichTextSetting,
} from './settings'

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('./http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./http')>()
  return { ...actual, httpClient: { request: mocks.request } }
})

describe('settings rich-text contract', () => {
  beforeEach(() => {
    mocks.request.mockReset()
  })

  it('reads rich text from the documented setting response', () => {
    expect(
      parseRichTextSetting({ code: 0, msg: 'success', data: { key: 'welfare', value: '<p>公益内容</p>' } }),
    ).toBe('<p>公益内容</p>')
  })

  it('requests the welfare rich text with its documented key', async () => {
    mocks.request.mockResolvedValue({ code: 0, msg: 'success', data: { value: '<p>公益内容</p>' } })

    await expect(fetchRichTextSetting('welfare')).resolves.toBe('<p>公益内容</p>')
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/settings/detail',
      params: { key: 'welfare' },
    })
  })
})
