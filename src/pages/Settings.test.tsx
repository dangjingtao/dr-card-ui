import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  takePhoto: vi.fn(),
  chooseImage: vi.fn(),
  updateProfile: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useBlocker: () => ({
      state: 'unblocked',
      reset: vi.fn(),
      proceed: vi.fn(),
    }),
  }
})

vi.mock('../app/fixtures/useFixture', () => ({
  useOverlay: () => ({
    overlay: null,
    close: vi.fn(),
  }),
}))

vi.mock('../app/state/memberProfile', () => ({
  useMemberProfile: () => ({
    birthday: '',
    birthdayLastModifiedAt: null,
  }),
  memberProfileActions: {
    update: mocks.updateProfile,
  },
}))

vi.mock('../services/nativeBridge', () => {
  class NativeBridgeError extends Error {
    constructor(readonly code: string) {
      super(code)
    }
  }

  return {
    NativeBridgeError,
    takePhoto: mocks.takePhoto,
    chooseImage: mocks.chooseImage,
  }
})

import Settings from './Settings'

afterEach(() => {
  mocks.navigate.mockReset()
  mocks.takePhoto.mockReset()
  mocks.chooseImage.mockReset()
  mocks.updateProfile.mockReset()
})

function openAvatarSheet() {
  fireEvent.click(screen.getAllByRole('button', { name: '修改头像' })[0])
}

describe('Settings Native avatar integration', () => {
  it('renders a Native takePhoto result as the local avatar preview', async () => {
    mocks.takePhoto.mockResolvedValue({
      mimeType: 'image/jpeg',
      imageBase64: 'avatar-photo-base64',
    })

    render(<Settings />)
    openAvatarSheet()
    fireEvent.click(screen.getByRole('button', { name: '拍照' }))

    await waitFor(() => {
      expect(mocks.takePhoto).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect((screen.getByAltText('会员头像') as HTMLImageElement).src).toContain(
        'data:image/jpeg;base64,avatar-photo-base64',
      )
    })
    expect(screen.getByText('已选择头像')).toBeTruthy()
  })

  it('uses chooseImage for the album entry', async () => {
    mocks.chooseImage.mockResolvedValue({
      mimeType: 'image/png',
      imageBase64: 'avatar-album-base64',
    })

    render(<Settings />)
    openAvatarSheet()
    fireEvent.click(screen.getByRole('button', { name: '从相册选择' }))

    await waitFor(() => {
      expect(mocks.chooseImage).toHaveBeenCalledTimes(1)
    })
    expect((screen.getByAltText('会员头像') as HTMLImageElement).src).toContain(
      'data:image/png;base64,avatar-album-base64',
    )
  })
})
