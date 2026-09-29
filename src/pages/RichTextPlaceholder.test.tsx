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
})
