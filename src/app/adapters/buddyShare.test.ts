import { afterEach, describe, expect, it, vi } from 'vitest'

const bridgeMocks = vi.hoisted(() => ({
  saveImageToAlbum: vi.fn(),
  copyText: vi.fn(),
}))

vi.mock('../../services/nativeBridge', () => ({
  saveImageToAlbum: bridgeMocks.saveImageToAlbum,
  copyText: bridgeMocks.copyText,
}))

import {
  copyInviteLink,
  getInviteLink,
  saveInvitePoster,
} from './buddyShare'

afterEach(() => {
  bridgeMocks.saveImageToAlbum.mockReset()
  bridgeMocks.copyText.mockReset()
})

describe('buddyShare Native adapter', () => {
  it('does not fake poster success when no real poster payload exists', async () => {
    await expect(saveInvitePoster()).resolves.toMatchObject({
      outcome: 'poster-failed',
      ok: false,
    })
    expect(bridgeMocks.saveImageToAlbum).not.toHaveBeenCalled()
  })

  it('maps Native album save success and failure to existing feedback states', async () => {
    const poster = {
      imageType: 'base64' as const,
      imageData: 'poster-base64',
      fileName: 'kaboshi-invite.png',
    }

    bridgeMocks.saveImageToAlbum.mockResolvedValueOnce({ success: true })
    await expect(saveInvitePoster(poster)).resolves.toMatchObject({
      outcome: 'poster-saved',
      ok: true,
    })
    expect(bridgeMocks.saveImageToAlbum).toHaveBeenCalledWith(poster)

    bridgeMocks.saveImageToAlbum.mockResolvedValueOnce({ success: false })
    await expect(saveInvitePoster(poster)).resolves.toMatchObject({
      outcome: 'poster-failed',
      ok: false,
    })

    bridgeMocks.saveImageToAlbum.mockRejectedValueOnce(new Error('native failed'))
    await expect(saveInvitePoster(poster)).resolves.toMatchObject({
      outcome: 'poster-failed',
      ok: false,
    })
  })

  it('does not copy the fixture invite URL unless a real link is supplied by the caller', async () => {
    expect(getInviteLink()).toContain('drcard.example')

    await expect(copyInviteLink()).resolves.toMatchObject({
      outcome: 'link-failed',
      ok: false,
    })
    expect(bridgeMocks.copyText).not.toHaveBeenCalled()
  })

  it('maps Native clipboard success and failure to existing feedback states', async () => {
    const inviteLink = 'https://example.com/real-invite'

    bridgeMocks.copyText.mockResolvedValueOnce({ success: true })
    await expect(copyInviteLink(inviteLink)).resolves.toMatchObject({
      outcome: 'link-copied',
      ok: true,
    })
    expect(bridgeMocks.copyText).toHaveBeenCalledWith({ text: inviteLink })

    bridgeMocks.copyText.mockResolvedValueOnce({ success: false })
    await expect(copyInviteLink(inviteLink)).resolves.toMatchObject({
      outcome: 'link-failed',
      ok: false,
    })

    bridgeMocks.copyText.mockRejectedValueOnce(new Error('native failed'))
    await expect(copyInviteLink(inviteLink)).resolves.toMatchObject({
      outcome: 'link-failed',
      ok: false,
    })
  })
})
