import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RichTextPlaceholder from './RichTextPlaceholder'

const mocks = vi.hoisted(() => ({
  fetchRichTextSetting: vi.fn(),
}))

vi.mock('../services/settings', () => ({
  fetchRichTextSetting: mocks.fetchRichTextSetting,
}))

describe('RichTextPlaceholder', () => {
  it('requests and renders the selected route rich text', async () => {
    mocks.fetchRichTextSetting.mockResolvedValue('<p>服务端富文本</p>')
    const { container } = render(
      <MemoryRouter initialEntries={['/cause']}>
        <RichTextPlaceholder routePath="/cause" settingKey="welfare" />
      </MemoryRouter>,
    )

    const host = container.querySelector('[data-rich-text-placeholder="/cause"]')
    expect(host).toBeTruthy()
    expect(await screen.findByText('服务端富文本')).toBeTruthy()
    expect(mocks.fetchRichTextSetting).toHaveBeenCalledWith('welfare')
    expect(host?.innerHTML).toContain('<p>服务端富文本</p>')
    expect(screen.getByRole('main')).toBeTruthy()
  })

  it('sanitizes server rich text before rendering', async () => {
    mocks.fetchRichTextSetting.mockResolvedValue(
      '<script>window.__xss = true</script><img src="x" onerror="window.__xss = true"><a href="javascript:alert(1)">危险链接</a><p>安全内容</p>',
    )

    const { container } = render(
      <MemoryRouter initialEntries={['/cause']}>
        <RichTextPlaceholder routePath="/cause" settingKey="welfare" />
      </MemoryRouter>,
    )

    expect(await screen.findByText('安全内容')).toBeTruthy()

    const content = container.querySelector('[data-rich-text-content]')
    expect(content?.querySelector('script')).toBeNull()
    expect(content?.querySelector('img')?.getAttribute('onerror')).toBeNull()
    expect(content?.querySelector('a')?.getAttribute('href')).toBeNull()
  })

})
