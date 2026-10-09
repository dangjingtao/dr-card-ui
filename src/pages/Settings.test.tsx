import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  takePhoto: vi.fn(),
  chooseImage: vi.fn(),
  updateProfile: vi.fn(),
  fetchUserProfileDetail: vi.fn(),
  updateUserProfile: vi.fn(),
  uploadUserAvatar: vi.fn(),
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

/* 资料读取按用例显式驱动；默认挂起，避免回填影响头像相关用例。 */
vi.mock('../services/userProfile', () => ({
  fetchUserProfileDetail: mocks.fetchUserProfileDetail,
  updateUserProfile: mocks.updateUserProfile,
}))
vi.mock('../services/userAvatarUpload', () => ({ uploadUserAvatar: mocks.uploadUserAvatar }))

import Settings from './Settings'
import { clearUserIdentity } from './profile/useUserIdentity'

beforeEach(() => {
  clearUserIdentity()
  /* 默认挂起：只有显式驱动的用例才产生回填结果。 */
  mocks.fetchUserProfileDetail.mockImplementation(() => new Promise(() => {}))
})

afterEach(() => {
  mocks.navigate.mockReset()
  mocks.takePhoto.mockReset()
  mocks.chooseImage.mockReset()
  mocks.updateProfile.mockReset()
  mocks.fetchUserProfileDetail.mockReset()
  mocks.updateUserProfile.mockReset()
  mocks.uploadUserAvatar.mockReset()
  clearUserIdentity()
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
    // Selection only stages the picture. No backend save has happened yet.
    expect(screen.queryByText('保存成功')).toBeNull()
  })

  it('shows confirmed Native cancellation without treating it as an unknown failure', async () => {
    const { NativeBridgeError } = await import('../services/nativeBridge')
    mocks.takePhoto.mockRejectedValue(
      new NativeBridgeError(
        'native-cancelled',
        'takePhoto',
        'confirmed Native cancellation',
      ),
    )

    render(<Settings />)
    openAvatarSheet()
    fireEvent.click(screen.getByRole('button', { name: '拍照' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('已取消图片选择')
    })
  })

  it('shows source-specific permission guidance for Native media denial', async () => {
    const { NativeBridgeError } = await import('../services/nativeBridge')
    mocks.chooseImage.mockRejectedValue(
      new NativeBridgeError(
        'native-permission-denied',
        'chooseImage',
        'confirmed Native permission denial',
      ),
    )

    render(<Settings />)
    openAvatarSheet()
    fireEvent.click(screen.getByRole('button', { name: '从相册选择' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        '请允许相册权限后重试',
      )
    })
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

describe('Settings profile backfill', () => {
  it('backfills nickname and grade from /api/user/detail', async () => {
    mocks.fetchUserProfileDetail.mockResolvedValue({ nickname: '接口昵称', grade: '大三' })

    render(<Settings />)

    await waitFor(() => {
      expect(screen.getByText('接口昵称')).toBeTruthy()
    })
    expect(screen.getByRole('button', { name: '大三' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('selects the saved academic year again after returning to Settings', async () => {
    // These are normalized values from GET /api/user/detail. The service tests
    // separately lock student_grade precedence over membership grade.
    mocks.fetchUserProfileDetail
      .mockResolvedValueOnce({ nickname: '真实昵称', grade: '大二' })
      .mockResolvedValueOnce({ nickname: '真实昵称', grade: '研二' })

    const first = render(<Settings />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '大二' }).getAttribute('aria-pressed')).toBe('true')
    })
    first.unmount()
    render(<Settings />)
    await waitFor(() => expect(mocks.fetchUserProfileDetail).toHaveBeenCalledTimes(2))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '研二' }).getAttribute('aria-pressed')).toBe('true')
    })
    expect(screen.getByRole('button', { name: '大二' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('does not show fake user defaults and retries when the profile request fails', async () => {
    mocks.fetchUserProfileDetail
      .mockRejectedValueOnce(new Error('profile failed'))
      .mockResolvedValueOnce({ nickname: '接口昵称', grade: '' })

    render(<Settings />)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('会员资料加载失败')
    expect(screen.queryByText('会员小福')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '重试' }))

    await waitFor(() => {
      expect(screen.getByText('接口昵称')).toBeTruthy()
    })
    expect(mocks.fetchUserProfileDetail).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('H044 slow profile hydration and UX-A layout', () => {
  it('keeps an early grade selection while filling the untouched nickname on late /detail', async () => {
    let resolveDetail!: (value: { nickname: string; grade: string; avatar?: string }) => void
    mocks.fetchUserProfileDetail.mockImplementation(() => new Promise((resolve) => { resolveDetail = resolve }))
    mocks.updateUserProfile.mockResolvedValue({
      id: 5, nick_name: '服务端昵称', avatar_img: null, student_grade: '大三',
    })
    render(<Settings />)
    fireEvent.click(screen.getByRole('button', { name: '大三' }))
    await act(async () => resolveDetail({ nickname: '服务端昵称', grade: '大二' }))
    expect(await screen.findByText('服务端昵称')).toBeTruthy()
    expect(screen.getByRole('button', { name: '大三' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '确认修改' }))
    await waitFor(() => expect(mocks.updateUserProfile).toHaveBeenCalledWith({ student_grade: '大三' }))
    expect(screen.queryByText('昵称不能为空，且不能超过 50 个字符')).toBeNull()
  })

  it('keeps a staged Native avatar while hydrating an untouched nickname and grade', async () => {
    let resolveDetail!: (value: { nickname: string; grade: string; avatar?: string }) => void
    mocks.fetchUserProfileDetail.mockImplementation(() => new Promise((resolve) => { resolveDetail = resolve }))
    mocks.takePhoto.mockResolvedValue({ mimeType: 'image/png', imageBase64: 'aGVsbG8=' })
    mocks.uploadUserAvatar.mockResolvedValue('https://cdn.example.com/new-avatar.png')
    mocks.updateUserProfile.mockResolvedValue({
      id: 5, nick_name: '服务端昵称', avatar_img: 'https://cdn.example.com/new-avatar.png', student_grade: '大二',
    })
    render(<Settings />)
    openAvatarSheet()
    fireEvent.click(screen.getByRole('button', { name: '拍照' }))
    await waitFor(() => expect((screen.getByAltText('会员头像') as HTMLImageElement).src).toContain('data:image/png;base64,aGVsbG8='))
    await act(async () => resolveDetail({
      nickname: '服务端昵称', grade: '大二', avatar: 'https://cdn.example.com/old-avatar.png',
    }))
    expect(await screen.findByText('服务端昵称')).toBeTruthy()
    expect((screen.getByAltText('会员头像') as HTMLImageElement).src).toContain('data:image/png;base64,aGVsbG8=')
    fireEvent.click(screen.getByRole('button', { name: '确认修改' }))
    await waitFor(() => expect(mocks.updateUserProfile).toHaveBeenCalledWith({
      avatar_img: 'https://cdn.example.com/new-avatar.png',
    }))
  })

  it('uses one non-wrapping label width for every identity row', () => {
    render(<Settings />)
    for (const name of ['头像', '昵称', '生日', '消费密码']) {
      const label = screen.getByText(name, { selector: 'span' })
      expect(label.className).toContain('w-20')
      expect(label.className).toContain('whitespace-nowrap')
    }
  })
})

describe('Settings real persistence', () => {
  it('stages nickname changes and only reports success after user/update resolves', async () => {
    mocks.fetchUserProfileDetail.mockResolvedValue({ nickname: '原昵称', grade: '大二' })
    mocks.updateUserProfile.mockResolvedValue({
      id: 5, nick_name: '新昵称', avatar_img: null, student_grade: '大二',
    })
    render(<Settings />)
    await screen.findByText('原昵称')
    fireEvent.click(screen.getByRole('button', { name: '修改昵称' }))
    fireEvent.change(screen.getByPlaceholderText('请输入昵称'), { target: { value: '新昵称' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.queryByText('保存成功')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '确认修改' }))
    await waitFor(() => expect(mocks.updateUserProfile).toHaveBeenCalledWith({ nick_name: '新昵称' }))
    await screen.findByText('保存成功')
  })

  it('retains staged edits and displays error when backend rejects update', async () => {
    mocks.fetchUserProfileDetail.mockResolvedValue({ nickname: '原昵称', grade: '大二' })
    mocks.updateUserProfile.mockRejectedValue(new Error('服务器保存失败'))
    render(<Settings />)
    await screen.findByText('原昵称')
    fireEvent.click(screen.getByRole('button', { name: '修改昵称' }))
    fireEvent.change(screen.getByPlaceholderText('请输入昵称'), { target: { value: '待保存' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    fireEvent.click(screen.getByRole('button', { name: '确认修改' }))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('服务器保存失败')
    expect(screen.getByText('待保存')).toBeTruthy()
    expect(screen.queryByText('保存成功')).toBeNull()
    expect(mocks.navigate).not.toHaveBeenCalled()
  })

  it('uploads staged Native photo before updating avatar URL', async () => {
    mocks.fetchUserProfileDetail.mockResolvedValue({ nickname: '原昵称', grade: '大二' })
    mocks.takePhoto.mockResolvedValue({ mimeType: 'image/png', imageBase64: 'aGVsbG8=' })
    mocks.uploadUserAvatar.mockResolvedValue('https://cdn.example.com/avatar.png')
    mocks.updateUserProfile.mockResolvedValue({
      id: 5, nick_name: '原昵称', avatar_img: 'https://cdn.example.com/avatar.png', student_grade: '大二',
    })
    render(<Settings />)
    await screen.findByText('原昵称')
    openAvatarSheet()
    fireEvent.click(screen.getByRole('button', { name: '拍照' }))
    await waitFor(() => expect(mocks.takePhoto).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: '确认修改' }))
    await waitFor(() => expect(mocks.uploadUserAvatar).toHaveBeenCalledTimes(1))
    expect(mocks.updateUserProfile).toHaveBeenCalledWith({ avatar_img: 'https://cdn.example.com/avatar.png' })
  })
})
