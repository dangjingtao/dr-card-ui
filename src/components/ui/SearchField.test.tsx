import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SearchField } from './ComDesign'

describe('SearchField', () => {
  it('uses the placeholder as an accessible name and exposes a working clear action', () => {
    const onChange = vi.fn()
    const onClear = vi.fn()

    render(
      <SearchField
        value="小美"
        onChange={onChange}
        onClear={onClear}
        placeholder="搜索搭子"
      />,
    )

    expect(screen.getByRole('searchbox', { name: '搜索搭子' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '清除搜索' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('supports App-specific pill/compact presentation without changing input semantics', () => {
    render(
      <SearchField
        value="洗发"
        onChange={() => {}}
        placeholder="搜索洗护体验券"
        variant="pill"
        size="compact"
        inputClassName="placeholder:text-text-tertiary"
      />,
    )

    const field = screen.getByRole('searchbox', { name: '搜索洗护体验券' })
    expect(field.closest('[data-search-field="pill"]')?.getAttribute('data-search-field-size')).toBe('compact')
    expect(field.className).toContain('placeholder:text-text-tertiary')
  })

  it('supports tel input and reports loading state for async searches', () => {
    render(
      <SearchField
        type="tel"
        inputMode="tel"
        aria-label="输入手机号搜索搭子"
        value="13800138000"
        onChange={() => {}}
        loading
        variant="pill"
      />,
    )

    const field = screen.getByLabelText('输入手机号搜索搭子')
    expect(field.getAttribute('type')).toBe('tel')
    expect(field.getAttribute('inputmode')).toBe('tel')
    expect(field.getAttribute('aria-busy')).toBe('true')
  })

  it('keeps the input label separate from the clear action', () => {
    render(
      <SearchField
        value="query"
        onChange={() => {}}
        onClear={() => {}}
        placeholder="搜索"
      />,
    )

    const field = screen.getByRole('searchbox', { name: '搜索' })
    const clear = screen.getByRole('button', { name: '清除搜索' })
    const container = field.closest('[data-search-field]')
    const label = field.closest('label')

    expect(container?.tagName).toBe('DIV')
    expect(label).toBeTruthy()
    expect(label?.contains(clear)).toBe(false)
    expect(clear.closest('label')).toBeNull()
  })

  it('preserves disabled behavior for both the input and clear action', () => {
    render(
      <SearchField
        value="query"
        onChange={() => {}}
        onClear={() => {}}
        placeholder="搜索"
        disabled
      />,
    )

    expect(screen.getByRole('searchbox', { name: '搜索' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: '清除搜索' }).hasAttribute('disabled')).toBe(true)
  })

  it('does not render a dead clear button when no clear handler is supplied', () => {
    render(<SearchField value="query" onChange={() => {}} placeholder="搜索" />)

    expect(screen.queryByRole('button', { name: '清除搜索' })).toBeNull()
  })
})
