import { runtimePolicy } from '../app/config/runtime'
import {
  createInjectedObjectTransport,
  NativeTransportError,
  parseJsonStringPayload,
  serializeJsonValue,
  type NativeTransportResolution,
  type NativeTransportWindow,
} from './nativeBridgeTransport'

export type NativeHost = 'android' | 'ios' | 'browser'
export type NativeCapabilityPlatform = Exclude<NativeHost, 'browser'>
export type NativeBridgeErrorCode =
  | 'bridge-disabled'
  | 'bridge-unsupported'
  | 'capability-unsupported'
  | 'native-cancelled'
  | 'native-permission-denied'
  | 'native-failed'
  | 'invocation-failed'
  | 'invocation-timeout'

type NativeInvocationOptions = {
  timeoutMs?: number
}

type UnsupportedCapabilityResolution = Extract<
  NativeTransportResolution<never>,
  { supported: false }
>

type SupportedCapabilityResolution<TInput, TResult> = {
  supported: true
  invoke: (input: TInput) => TResult | PromiseLike<TResult>
}

type NativeCapabilityResolution<TInput, TResult> =
  | UnsupportedCapabilityResolution
  | SupportedCapabilityResolution<TInput, TResult>

interface NativeCapabilityDescriptor<TName extends string, TInput, TResult> {
  name: TName
  description: string
  /** Platforms with a confirmed production implementation for this capability. */
  platforms: readonly NativeCapabilityPlatform[]
  sensitiveResult?: boolean
  resolve: (
    hostWindow: NativeTransportWindow | undefined,
  ) => NativeCapabilityResolution<TInput, TResult>
}

function defineCapability<TName extends string, TInput, TResult>(
  descriptor: NativeCapabilityDescriptor<TName, TInput, TResult>,
): NativeCapabilityDescriptor<TName, TInput, TResult> {
  return descriptor
}

function unsupportedCapability(
  code: UnsupportedCapabilityResolution['code'],
  message: string,
): UnsupportedCapabilityResolution {
  return { supported: false, code, message }
}

function supportedCapability<TInput, TResult>(
  invoke: SupportedCapabilityResolution<TInput, TResult>['invoke'],
): SupportedCapabilityResolution<TInput, TResult> {
  return { supported: true, invoke }
}

export interface NativeLoginToken {
  token: string
}

export type NativeScanType = 'qr' | 'bar' | 'all'

export interface NativeScanCodeInput {
  scanType: NativeScanType
}

export interface NativeScanCodeResult {
  code: string
}

export interface NativeTakePhotoInput {
  crop: boolean
  maxWidth: number
  maxHeight: number
  quality: number
}

export interface NativeChooseImageInput extends NativeTakePhotoInput {
  count: number
}

export interface NativeImageResult {
  mimeType: string
  imageBase64: string
}

export type NativeSavedImageType = 'base64' | 'url'

export interface NativeSaveImageToAlbumInput {
  imageType: NativeSavedImageType
  imageData: string
  fileName: string
}

export interface NativeCopyTextInput {
  text: string
}

export interface NativeSuccessResult {
  success: boolean
}

export type NativeRewardAdStatus = 'completed' | 'closed' | 'failed' | 'no_fill'

export interface NativeRewardAdInput {
  scene: 'h5CheckinResign'
}

export interface NativeRewardAdResult {
  status: NativeRewardAdStatus
}

export type NativeOpenAppAction = 'open' | 'store' | 'detect'

export interface NativeOpenAppInput {
  action: NativeOpenAppAction
  inviteCode: string
  fallbackUrl: string
}

export interface NativeOpenAppResult {
  success: boolean
  installed: boolean
}

export type NativeFailurePayloadCode = 'cancel' | 'permission_denied' | 'fail'

const NATIVE_FAILURE_CODE_MAP: Record<NativeFailurePayloadCode, NativeBridgeErrorCode> = {
  cancel: 'native-cancelled',
  permission_denied: 'native-permission-denied',
  fail: 'native-failed',
}

function parseConfirmedNativeResult(payload: unknown): unknown {
  const parsed = parseConfirmedNativeResult(payload)

  if (parsed !== null && typeof parsed === 'object' && 'error' in parsed) {
    const error = (parsed as { error?: unknown }).error
    if (error === 'cancel') {
      throw new NativeTransportError(
        'native-cancelled',
        'Native invocation was cancelled by the user.',
      )
    }
    if (error === 'permission_denied') {
      throw new NativeTransportError(
        'native-permission-denied',
        'Native invocation was denied by system permission.',
      )
    }
    if (error === 'fail') {
      throw new NativeTransportError(
        'native-failed',
        'Native invocation reported a generic failure.',
      )
    }

    throw new NativeTransportError(
      'payload-invalid',
      'Native invocation returned an unknown error code.',
    )
  }

  return parsed
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function validateTakePhotoInput(input: NativeTakePhotoInput): NativeTakePhotoInput {
  if (
    input === null ||
    typeof input !== 'object' ||
    typeof (input as { crop?: unknown }).crop !== 'boolean' ||
    !isFiniteNumber((input as { maxWidth?: unknown }).maxWidth) ||
    !isFiniteNumber((input as { maxHeight?: unknown }).maxHeight) ||
    !isFiniteNumber((input as { quality?: unknown }).quality)
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native takePhoto() input requires crop, maxWidth, maxHeight, and quality fields.',
    )
  }
  return input
}

function validateChooseImageInput(input: NativeChooseImageInput): NativeChooseImageInput {
  validateTakePhotoInput(input)
  if (!isFiniteNumber((input as { count?: unknown }).count)) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native chooseImage() input requires a numeric count field.',
    )
  }
  return input
}

function validateSaveImageInput(
  input: NativeSaveImageToAlbumInput,
): NativeSaveImageToAlbumInput {
  if (
    input === null ||
    typeof input !== 'object' ||
    !['base64', 'url'].includes((input as { imageType?: unknown }).imageType as string) ||
    typeof (input as { imageData?: unknown }).imageData !== 'string' ||
    typeof (input as { fileName?: unknown }).fileName !== 'string'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native saveImageToAlbum() input requires imageType, imageData, and fileName fields.',
    )
  }
  return input
}

function validateCopyTextInput(input: NativeCopyTextInput): NativeCopyTextInput {
  if (
    input === null ||
    typeof input !== 'object' ||
    typeof (input as { text?: unknown }).text !== 'string'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native copyText() input requires a string text field.',
    )
  }
  return input
}

function parseNativeImagePayload(payload: unknown): NativeImageResult {
  const parsed = parseConfirmedNativeResult(payload)
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    typeof (parsed as { mimeType?: unknown }).mimeType !== 'string' ||
    typeof (parsed as { imageBase64?: unknown }).imageBase64 !== 'string'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native image result must be a JSON string with mimeType and imageBase64 strings.',
    )
  }

  return {
    mimeType: (parsed as { mimeType: string }).mimeType,
    imageBase64: (parsed as { imageBase64: string }).imageBase64,
  }
}

function parseNativeSuccessPayload(payload: unknown): NativeSuccessResult {
  const parsed = parseConfirmedNativeResult(payload)
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    typeof (parsed as { success?: unknown }).success !== 'boolean'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native success result must be a JSON string with a boolean success field.',
    )
  }

  return { success: (parsed as { success: boolean }).success }
}

function validateRewardAdInput(input: NativeRewardAdInput): NativeRewardAdInput {
  if (
    input === null ||
    typeof input !== 'object' ||
    (input as { scene?: unknown }).scene !== 'h5CheckinResign'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native showRewardAd() input requires scene to be h5CheckinResign.',
    )
  }

  return input
}

function parseRewardAdPayload(payload: unknown): NativeRewardAdResult {
  const parsed = parseConfirmedNativeResult(payload)
  const status =
    parsed !== null && typeof parsed === 'object'
      ? (parsed as { status?: unknown }).status
      : undefined

  if (!['completed', 'closed', 'failed', 'no_fill'].includes(status as string)) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native showRewardAd() result requires status to be completed, closed, failed, or no_fill.',
    )
  }

  return { status: status as NativeRewardAdStatus }
}

function validateOpenAppInput(input: NativeOpenAppInput): NativeOpenAppInput {
  if (
    input === null ||
    typeof input !== 'object' ||
    !['open', 'store', 'detect'].includes((input as { action?: unknown }).action as string) ||
    typeof (input as { inviteCode?: unknown }).inviteCode !== 'string' ||
    typeof (input as { fallbackUrl?: unknown }).fallbackUrl !== 'string'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native openApp() input requires action=open|store|detect plus string inviteCode and fallbackUrl fields.',
    )
  }

  return input
}

function parseOpenAppPayload(payload: unknown): NativeOpenAppResult {
  const parsed = parseConfirmedNativeResult(payload)
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    typeof (parsed as { success?: unknown }).success !== 'boolean' ||
    typeof (parsed as { installed?: unknown }).installed !== 'boolean'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native openApp() result must be a JSON string with boolean success and installed fields.',
    )
  }

  return {
    success: (parsed as { success: boolean }).success,
    installed: (parsed as { installed: boolean }).installed,
  }
}

function validateScanCodeInput(input: NativeScanCodeInput): NativeScanCodeInput {
  if (
    input === null ||
    typeof input !== 'object' ||
    !['qr', 'bar', 'all'].includes((input as { scanType?: unknown }).scanType as string)
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native scanCode() input requires scanType to be qr, bar, or all.',
    )
  }

  return input
}

function parseScanCodePayload(payload: unknown): NativeScanCodeResult {
  const parsed = parseConfirmedNativeResult(payload)
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    typeof (parsed as { code?: unknown }).code !== 'string'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native scanCode() result must be a JSON string with a string code field.',
    )
  }

  return { code: (parsed as { code: string }).code }
}

function parseLoginTokenPayload(payload: unknown): NativeLoginToken {
  const parsed = parseConfirmedNativeResult(payload)
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    typeof (parsed as { token?: unknown }).token !== 'string'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native getLoginToken() result must be a JSON string with a string token field.',
    )
  }

  return { token: (parsed as { token: string }).token }
}

const androidGetLoginTokenTransport = createInjectedObjectTransport<void, NativeLoginToken>({
  objectName: 'androidBridge',
  methodName: 'getLoginToken',
  serializeArgs: () => [],
  parseResult: parseLoginTokenPayload,
})

const iosGetLoginTokenTransport = createInjectedObjectTransport<void, NativeLoginToken>({
  objectName: 'iosBridge',
  methodName: 'getLoginToken',
  serializeArgs: () => [],
  parseResult: parseLoginTokenPayload,
})

const androidCloseWebViewTransport = createInjectedObjectTransport<void, void>({
  objectName: 'androidBridge',
  methodName: 'closeWebView',
  serializeArgs: () => [],
  parseResult: () => undefined,
})

const iosCloseWebViewTransport = createInjectedObjectTransport<void, void>({
  objectName: 'iosBridge',
  methodName: 'closeWebView',
  serializeArgs: () => [],
  parseResult: () => undefined,
})

const androidScanCodeTransport = createInjectedObjectTransport<
  NativeScanCodeInput,
  NativeScanCodeResult
>({
  objectName: 'androidBridge',
  methodName: 'scanCode',
  serializeArgs: (input) => [serializeJsonValue(validateScanCodeInput(input))],
  parseResult: parseScanCodePayload,
})

const iosScanCodeTransport = createInjectedObjectTransport<
  NativeScanCodeInput,
  NativeScanCodeResult
>({
  objectName: 'iosBridge',
  methodName: 'scanCode',
  serializeArgs: (input) => [serializeJsonValue(validateScanCodeInput(input))],
  parseResult: parseScanCodePayload,
})

const androidTakePhotoTransport = createInjectedObjectTransport<
  NativeTakePhotoInput,
  NativeImageResult
>({
  objectName: 'androidBridge',
  methodName: 'takePhoto',
  serializeArgs: (input) => [serializeJsonValue(validateTakePhotoInput(input))],
  parseResult: parseNativeImagePayload,
})

const iosTakePhotoTransport = createInjectedObjectTransport<
  NativeTakePhotoInput,
  NativeImageResult
>({
  objectName: 'iosBridge',
  methodName: 'takePhoto',
  serializeArgs: (input) => [serializeJsonValue(validateTakePhotoInput(input))],
  parseResult: parseNativeImagePayload,
})

const androidChooseImageTransport = createInjectedObjectTransport<
  NativeChooseImageInput,
  NativeImageResult
>({
  objectName: 'androidBridge',
  methodName: 'chooseImage',
  serializeArgs: (input) => [serializeJsonValue(validateChooseImageInput(input))],
  parseResult: parseNativeImagePayload,
})

const iosChooseImageTransport = createInjectedObjectTransport<
  NativeChooseImageInput,
  NativeImageResult
>({
  objectName: 'iosBridge',
  methodName: 'chooseImage',
  serializeArgs: (input) => [serializeJsonValue(validateChooseImageInput(input))],
  parseResult: parseNativeImagePayload,
})

const androidSaveImageToAlbumTransport = createInjectedObjectTransport<
  NativeSaveImageToAlbumInput,
  NativeSuccessResult
>({
  objectName: 'androidBridge',
  methodName: 'saveImageToAlbum',
  serializeArgs: (input) => [serializeJsonValue(validateSaveImageInput(input))],
  parseResult: parseNativeSuccessPayload,
})

const iosSaveImageToAlbumTransport = createInjectedObjectTransport<
  NativeSaveImageToAlbumInput,
  NativeSuccessResult
>({
  objectName: 'iosBridge',
  methodName: 'saveImageToAlbum',
  serializeArgs: (input) => [serializeJsonValue(validateSaveImageInput(input))],
  parseResult: parseNativeSuccessPayload,
})

const androidCopyTextTransport = createInjectedObjectTransport<
  NativeCopyTextInput,
  NativeSuccessResult
>({
  objectName: 'androidBridge',
  methodName: 'copyText',
  serializeArgs: (input) => [serializeJsonValue(validateCopyTextInput(input))],
  parseResult: parseNativeSuccessPayload,
})

const iosCopyTextTransport = createInjectedObjectTransport<
  NativeCopyTextInput,
  NativeSuccessResult
>({
  objectName: 'iosBridge',
  methodName: 'copyText',
  serializeArgs: (input) => [serializeJsonValue(validateCopyTextInput(input))],
  parseResult: parseNativeSuccessPayload,
})

const androidRewardAdTransport = createInjectedObjectTransport<
  NativeRewardAdInput,
  NativeRewardAdResult
>({
  objectName: 'androidBridge',
  methodName: 'showRewardAd',
  serializeArgs: (input) => [serializeJsonValue(validateRewardAdInput(input))],
  parseResult: parseRewardAdPayload,
})

const iosRewardAdTransport = createInjectedObjectTransport<
  NativeRewardAdInput,
  NativeRewardAdResult
>({
  objectName: 'iosBridge',
  methodName: 'showRewardAd',
  serializeArgs: (input) => [serializeJsonValue(validateRewardAdInput(input))],
  parseResult: parseRewardAdPayload,
})

const androidOpenAppTransport = createInjectedObjectTransport<
  NativeOpenAppInput,
  NativeOpenAppResult
>({
  objectName: 'androidBridge',
  methodName: 'openApp',
  serializeArgs: (input) => [serializeJsonValue(validateOpenAppInput(input))],
  parseResult: parseOpenAppPayload,
})

const iosOpenAppTransport = createInjectedObjectTransport<
  NativeOpenAppInput,
  NativeOpenAppResult
>({
  objectName: 'iosBridge',
  methodName: 'openApp',
  serializeArgs: (input) => [serializeJsonValue(validateOpenAppInput(input))],
  parseResult: parseOpenAppPayload,
})

function resolveLoginTokenTransport(
  hostWindow: NativeTransportWindow | undefined,
): NativeCapabilityResolution<void, NativeLoginToken> {
  if (hostWindow?.androidBridge) {
    const resolution = androidGetLoginTokenTransport.resolve(hostWindow, undefined)
    if (!resolution.supported) return resolution
    return supportedCapability<void, NativeLoginToken>(() => resolution.invoke())
  }

  if (hostWindow?.iosBridge) {
    const resolution = iosGetLoginTokenTransport.resolve(hostWindow, undefined)
    if (!resolution.supported) return resolution
    return supportedCapability<void, NativeLoginToken>(() => resolution.invoke())
  }

  return unsupportedCapability(
    'bridge-unsupported',
    'Neither window.androidBridge nor window.iosBridge is available in the current host.',
  )
}

function resolveCloseWebViewTransport(
  hostWindow: NativeTransportWindow | undefined,
): NativeCapabilityResolution<void, void> {
  if (hostWindow?.androidBridge) {
    const resolution = androidCloseWebViewTransport.resolve(hostWindow, undefined)
    if (!resolution.supported) return resolution
    return supportedCapability<void, void>(() => resolution.invoke())
  }

  if (hostWindow?.iosBridge) {
    const resolution = iosCloseWebViewTransport.resolve(hostWindow, undefined)
    if (!resolution.supported) return resolution
    return supportedCapability<void, void>(() => resolution.invoke())
  }

  return unsupportedCapability(
    'bridge-unsupported',
    'Neither window.androidBridge nor window.iosBridge is available in the current host.',
  )
}

function resolveScanCodeTransport(
  hostWindow: NativeTransportWindow | undefined,
): NativeCapabilityResolution<NativeScanCodeInput, NativeScanCodeResult> {
  if (hostWindow?.androidBridge) {
    return {
      supported: true,
      invoke: (input) => {
        const resolution = androidScanCodeTransport.resolve(hostWindow, input)
        if (!resolution.supported) {
          throw new NativeBridgeError(
            resolution.code,
            'scanCode',
            resolution.message,
          )
        }
        return resolution.invoke()
      },
    }
  }

  if (hostWindow?.iosBridge) {
    return {
      supported: true,
      invoke: (input) => {
        const resolution = iosScanCodeTransport.resolve(hostWindow, input)
        if (!resolution.supported) {
          throw new NativeBridgeError(
            resolution.code,
            'scanCode',
            resolution.message,
          )
        }
        return resolution.invoke()
      },
    }
  }

  return unsupportedCapability(
    'bridge-unsupported',
    'Neither window.androidBridge nor window.iosBridge is available in the current host.',
  )
}

function resolveDualInjectedCapability<TInput, TResult>(
  hostWindow: NativeTransportWindow | undefined,
  capability: string,
  sampleInput: TInput,
  resolveAndroid: (input: TInput) => NativeTransportResolution<TResult>,
  resolveIOS: (input: TInput) => NativeTransportResolution<TResult>,
): NativeCapabilityResolution<TInput, TResult> {
  if (hostWindow?.androidBridge) {
    const probe = resolveAndroid(sampleInput)
    if (!probe.supported) return probe
    return supportedCapability((input) => {
      const resolution = resolveAndroid(input)
      if (!resolution.supported) {
        throw new NativeBridgeError(resolution.code, capability, resolution.message)
      }
      return resolution.invoke()
    })
  }

  if (hostWindow?.iosBridge) {
    const probe = resolveIOS(sampleInput)
    if (!probe.supported) return probe
    return supportedCapability((input) => {
      const resolution = resolveIOS(input)
      if (!resolution.supported) {
        throw new NativeBridgeError(resolution.code, capability, resolution.message)
      }
      return resolution.invoke()
    })
  }

  return unsupportedCapability(
    'bridge-unsupported',
    'Neither window.androidBridge nor window.iosBridge is available in the current host.',
  )
}

const DEFAULT_IMAGE_INPUT: NativeTakePhotoInput = {
  crop: true,
  maxWidth: 1080,
  maxHeight: 1080,
  quality: 0.8,
}

const DEFAULT_CHOOSE_IMAGE_INPUT: NativeChooseImageInput = {
  ...DEFAULT_IMAGE_INPUT,
  count: 1,
}

function resolveTakePhotoTransport(
  hostWindow: NativeTransportWindow | undefined,
): NativeCapabilityResolution<NativeTakePhotoInput, NativeImageResult> {
  return resolveDualInjectedCapability(
    hostWindow,
    'takePhoto',
    DEFAULT_IMAGE_INPUT,
    (input) => androidTakePhotoTransport.resolve(hostWindow!, input),
    (input) => iosTakePhotoTransport.resolve(hostWindow!, input),
  )
}

function resolveChooseImageTransport(
  hostWindow: NativeTransportWindow | undefined,
): NativeCapabilityResolution<NativeChooseImageInput, NativeImageResult> {
  return resolveDualInjectedCapability(
    hostWindow,
    'chooseImage',
    DEFAULT_CHOOSE_IMAGE_INPUT,
    (input) => androidChooseImageTransport.resolve(hostWindow!, input),
    (input) => iosChooseImageTransport.resolve(hostWindow!, input),
  )
}

function resolveSaveImageToAlbumTransport(
  hostWindow: NativeTransportWindow | undefined,
): NativeCapabilityResolution<NativeSaveImageToAlbumInput, NativeSuccessResult> {
  const sample: NativeSaveImageToAlbumInput = {
    imageType: 'base64',
    imageData: '',
    fileName: 'kaboshi-invite.png',
  }
  return resolveDualInjectedCapability(
    hostWindow,
    'saveImageToAlbum',
    sample,
    (input) => androidSaveImageToAlbumTransport.resolve(hostWindow!, input),
    (input) => iosSaveImageToAlbumTransport.resolve(hostWindow!, input),
  )
}

function resolveCopyTextTransport(
  hostWindow: NativeTransportWindow | undefined,
): NativeCapabilityResolution<NativeCopyTextInput, NativeSuccessResult> {
  return resolveDualInjectedCapability(
    hostWindow,
    'copyText',
    { text: '' },
    (input) => androidCopyTextTransport.resolve(hostWindow!, input),
    (input) => iosCopyTextTransport.resolve(hostWindow!, input),
  )
}

function resolveRewardAdTransport(
  hostWindow: NativeTransportWindow | undefined,
): NativeCapabilityResolution<NativeRewardAdInput, NativeRewardAdResult> {
  const sample: NativeRewardAdInput = { scene: 'h5CheckinResign' }
  return resolveDualInjectedCapability(
    hostWindow,
    'showRewardAd',
    sample,
    (input) => androidRewardAdTransport.resolve(hostWindow!, input),
    (input) => iosRewardAdTransport.resolve(hostWindow!, input),
  )
}

function resolveOpenAppTransport(
  hostWindow: NativeTransportWindow | undefined,
): NativeCapabilityResolution<NativeOpenAppInput, NativeOpenAppResult> {
  const sample: NativeOpenAppInput = {
    action: 'detect',
    inviteCode: '',
    fallbackUrl: '',
  }
  return resolveDualInjectedCapability(
    hostWindow,
    'openApp',
    sample,
    (input) => androidOpenAppTransport.resolve(hostWindow!, input),
    (input) => iosOpenAppTransport.resolve(hostWindow!, input),
  )
}

const capabilityRegistry = {
  getLoginToken: defineCapability<'getLoginToken', void, NativeLoginToken>({
    name: 'getLoginToken',
    description:
      'Read the current login token from the confirmed Android/iOS injected-object bridge.',
    platforms: ['android', 'ios'],
    sensitiveResult: true,
    resolve(hostWindow) {
      return resolveLoginTokenTransport(hostWindow)
    },
  }),
  closeWebView: defineCapability<'closeWebView', void, void>({
    name: 'closeWebView',
    platforms: ['android', 'ios'],
    description:
      'Close the current App WebView through the confirmed Android/iOS injected-object contract.',
    sensitiveResult: false,
    resolve(hostWindow) {
      return resolveCloseWebViewTransport(hostWindow)
    },
  }),
  scanCode: defineCapability<'scanCode', NativeScanCodeInput, NativeScanCodeResult>({
    name: 'scanCode',
    platforms: ['android', 'ios'],
    description:
      'Scan a QR code, barcode, or either through the confirmed Android/iOS injected-object contract.',
    sensitiveResult: true,
    resolve(hostWindow) {
      if (hostWindow?.androidBridge) {
        const probe = androidScanCodeTransport.resolve(hostWindow, { scanType: 'all' })
        if (!probe.supported) return probe
      } else if (hostWindow?.iosBridge) {
        const probe = iosScanCodeTransport.resolve(hostWindow, { scanType: 'all' })
        if (!probe.supported) return probe
      }
      return resolveScanCodeTransport(hostWindow)
    },
  }),
  takePhoto: defineCapability<'takePhoto', NativeTakePhotoInput, NativeImageResult>({
    name: 'takePhoto',
    platforms: ['android', 'ios'],
    description:
      'Capture one image through the confirmed Android/iOS injected-object contract.',
    sensitiveResult: true,
    resolve(hostWindow) {
      return resolveTakePhotoTransport(hostWindow)
    },
  }),
  chooseImage: defineCapability<'chooseImage', NativeChooseImageInput, NativeImageResult>({
    name: 'chooseImage',
    platforms: ['android', 'ios'],
    description:
      'Choose one image through the confirmed Android/iOS injected-object contract.',
    sensitiveResult: true,
    resolve(hostWindow) {
      return resolveChooseImageTransport(hostWindow)
    },
  }),
  saveImageToAlbum: defineCapability<
    'saveImageToAlbum',
    NativeSaveImageToAlbumInput,
    NativeSuccessResult
  >({
    name: 'saveImageToAlbum',
    platforms: ['android', 'ios'],
    description:
      'Save an existing base64 image or HTTPS image URL to the system album.',
    sensitiveResult: false,
    resolve(hostWindow) {
      return resolveSaveImageToAlbumTransport(hostWindow)
    },
  }),
  copyText: defineCapability<'copyText', NativeCopyTextInput, NativeSuccessResult>({
    name: 'copyText',
    platforms: ['android', 'ios'],
    description:
      'Copy text through the confirmed Android/iOS injected-object contract.',
    sensitiveResult: false,
    resolve(hostWindow) {
      return resolveCopyTextTransport(hostWindow)
    },
  }),
  showRewardAd: defineCapability<'showRewardAd', NativeRewardAdInput, NativeRewardAdResult>({
    name: 'showRewardAd',
    platforms: ['android', 'ios'],
    description:
      'Show the check-in resign rewarded ad through the confirmed Android/iOS injected-object contract.',
    sensitiveResult: false,
    resolve(hostWindow) {
      return resolveRewardAdTransport(hostWindow)
    },
  }),
  openApp: defineCapability<'openApp', NativeOpenAppInput, NativeOpenAppResult>({
    name: 'openApp',
    platforms: ['android', 'ios'],
    description:
      'Detect, open, or route to the App store through the confirmed Android/iOS injected-object contract.',
    sensitiveResult: false,
    resolve(hostWindow) {
      return resolveOpenAppTransport(hostWindow)
    },
  }),
} as const

export type NativeCapabilityName = keyof typeof capabilityRegistry

export interface NativeCapabilityCatalogItem {
  name: NativeCapabilityName
  description: string
  platforms: readonly NativeCapabilityPlatform[]
  supported: boolean
  sensitiveResult: boolean
}

export interface NativeBridgeDiagnostics {
  mode: typeof runtimePolicy.bridgeMode
  host: NativeHost
  hostVersion: null
  capabilities: Record<NativeCapabilityName, boolean>
}

export class NativeBridgeError extends Error {
  readonly name = 'NativeBridgeError'

  constructor(
    readonly code: NativeBridgeErrorCode,
    readonly capability: string,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
  }
}

const DEFAULT_TIMEOUT_MS = 5_000

function mapNativeTransportErrorCode(
  code: NativeTransportError['code'],
): NativeBridgeErrorCode | null {
  if (code === 'native-cancelled') return NATIVE_FAILURE_CODE_MAP.cancel
  if (code === 'native-permission-denied') return NATIVE_FAILURE_CODE_MAP.permission_denied
  if (code === 'native-failed') return NATIVE_FAILURE_CODE_MAP.fail
  return null
}

function toInvocationBridgeError(
  error: unknown,
  capability: string,
  phase: 'threw' | 'rejected',
): NativeBridgeError {
  if (error instanceof NativeBridgeError) return error

  if (error instanceof NativeTransportError) {
    const mappedCode = mapNativeTransportErrorCode(error.code)
    if (mappedCode) {
      return new NativeBridgeError(mappedCode, capability, error.message, error)
    }
  }

  return new NativeBridgeError(
    'invocation-failed',
    capability,
    `Native capability "${capability}" ${phase} during invocation.`,
    error,
  )
}

function getHostWindow(): NativeTransportWindow | undefined {
  if (typeof window === 'undefined') return undefined
  return window as NativeTransportWindow
}

function detectHost(hostWindow = getHostWindow()): NativeHost {
  if (hostWindow?.androidBridge) return 'android'
  if (hostWindow?.iosBridge || hostWindow?.webkit?.messageHandlers) return 'ios'
  return 'browser'
}

function ensureNativeMode(capability: string): void {
  if (runtimePolicy.bridgeMode === 'native') return

  throw new NativeBridgeError(
    'bridge-disabled',
    capability,
    `Native capability "${capability}" requires VITE_BRIDGE_MODE=native; current mode is ${runtimePolicy.bridgeMode}.`,
  )
}

function withTimeout<T>(promise: Promise<T>, capability: string, timeoutMs: number): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return Promise.reject(
      new NativeBridgeError(
        'invocation-failed',
        capability,
        `Native capability "${capability}" requires a positive finite timeout.`,
      ),
    )
  }

  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new NativeBridgeError(
          'invocation-timeout',
          capability,
          `Native capability "${capability}" timed out after ${timeoutMs}ms.`,
        ),
      )
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

async function invokeNativeCapability<TName extends string, TInput, TResult>(
  descriptor: NativeCapabilityDescriptor<TName, TInput, TResult>,
  input: TInput,
  options: NativeInvocationOptions = {},
  allowDisabledBridgeMode = false,
): Promise<TResult> {
  if (!allowDisabledBridgeMode) ensureNativeMode(descriptor.name)

  let resolution: NativeCapabilityResolution<TInput, TResult>
  try {
    resolution = descriptor.resolve(getHostWindow())
  } catch (error) {
    throw new NativeBridgeError(
      'invocation-failed',
      descriptor.name,
      `Native capability "${descriptor.name}" failed during capability resolution.`,
      error,
    )
  }

  if (!resolution.supported) {
    throw new NativeBridgeError(
      resolution.code,
      descriptor.name,
      resolution.message,
    )
  }

  let invocation: Promise<TResult>
  try {
    invocation = Promise.resolve(resolution.invoke(input))
  } catch (error) {
    throw toInvocationBridgeError(error, descriptor.name, 'threw')
  }

  try {
    return await withTimeout(
      invocation,
      descriptor.name,
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    )
  } catch (error) {
    throw toInvocationBridgeError(error, descriptor.name, 'rejected')
  }
}

function isCapabilitySupported(
  descriptor: NativeCapabilityDescriptor<string, never, unknown>,
  hostWindow: NativeTransportWindow | undefined,
  allowDisabledBridgeMode = false,
): boolean {
  if (!allowDisabledBridgeMode && runtimePolicy.bridgeMode !== 'native') return false

  try {
    return descriptor.resolve(hostWindow).supported
  } catch {
    return false
  }
}

/** Registry-backed metadata for Bridge Lab; this does not promote unsupported host protocols. */
export function getNativeBridgeCapabilityCatalog(): NativeCapabilityCatalogItem[] {
  const hostWindow = getHostWindow()

  return Object.values(capabilityRegistry).map((descriptor) => ({
    name: descriptor.name,
    description: descriptor.description,
    platforms: descriptor.platforms,
    supported: isCapabilitySupported(
      descriptor as NativeCapabilityDescriptor<string, never, unknown>,
      hostWindow,
      runtimePolicy.bridgeLabEnabled,
    ),
    sensitiveResult: descriptor.sensitiveResult === true,
  })) as NativeCapabilityCatalogItem[]
}

/**
 * Bridge Lab-only generic invocation seam.
 *
 * Business pages should continue using typed capability facades such as getLoginToken(). This
 * function exists so the debug Lab can enumerate and invoke the registry without hard-coding one
 * top-level button per capability.
 */
export function invokeRegisteredNativeCapabilityForDebug(
  name: NativeCapabilityName,
  input: unknown = undefined,
  options: NativeInvocationOptions = {},
): Promise<unknown> {
  if (!runtimePolicy.bridgeLabEnabled) {
    return Promise.reject(
      new NativeBridgeError(
        'bridge-disabled',
        name,
        `Native capability debug invocation is disabled in ${runtimePolicy.appEnvironment} runtime.`,
      ),
    )
  }

  const descriptor = capabilityRegistry[name] as NativeCapabilityDescriptor<
    NativeCapabilityName,
    unknown,
    unknown
  >
  return invokeNativeCapability(descriptor, input, options, true)
}

/**
 * Returns runtime-observable Bridge state without claiming a Native version contract that the host
 * has not provided. `hostVersion` therefore remains null until a real version API is confirmed.
 */
export function getNativeBridgeDiagnostics(): NativeBridgeDiagnostics {
  const hostWindow = getHostWindow()
  const capabilities = Object.fromEntries(
    Object.entries(capabilityRegistry).map(([name, descriptor]) => [
      name,
      isCapabilitySupported(
        descriptor as NativeCapabilityDescriptor<string, never, unknown>,
        hostWindow,
      ),
    ]),
  ) as Record<NativeCapabilityName, boolean>

  return {
    mode: runtimePolicy.bridgeMode,
    host: detectHost(hostWindow),
    hostVersion: null,
    capabilities,
  }
}

/**
 * H029 confirmed production login boundary, executed through the shared capability runtime.
 *
 * Android uses `window.androidBridge.getLoginToken()`; iOS uses
 * `window.iosBridge.getLoginToken()`. Both take no arguments and synchronously return a JSON
 * string with a `token` field. H5 normalizes the synchronous host return to a Promise and validates
 * the returned payload before exposing it to callers.
 */
export function getLoginToken(
  options: NativeInvocationOptions = {},
): Promise<NativeLoginToken> {
  return invokeNativeCapability(capabilityRegistry.getLoginToken, undefined, options)
}

/**
 * H030 confirmed App-WebView close boundary.
 *
 * Android uses `window.androidBridge.closeWebView()`; iOS uses
 * `window.iosBridge.closeWebView()`. The method takes no arguments and has no result payload.
 * Hosts that have not implemented the method remain capability-unsupported.
 */
export function closeWebView(options: NativeInvocationOptions = {}): Promise<void> {
  return invokeNativeCapability(capabilityRegistry.closeWebView, undefined, options)
}

/**
 * H031 confirmed Native scanner boundary.
 *
 * Android uses `window.androidBridge.scanCode(json)`; iOS uses
 * `window.iosBridge.scanCode(json)`. The input is serialized as a JSON string with
 * `scanType: qr | bar | all`; Native synchronously returns a JSON string with `code`.
 */
export function scanCode(
  input: NativeScanCodeInput,
  options: NativeInvocationOptions = {},
): Promise<NativeScanCodeResult> {
  return invokeNativeCapability(capabilityRegistry.scanCode, input, options)
}

export function takePhoto(
  input: NativeTakePhotoInput = DEFAULT_IMAGE_INPUT,
  options: NativeInvocationOptions = {},
): Promise<NativeImageResult> {
  return invokeNativeCapability(capabilityRegistry.takePhoto, input, options)
}

export function chooseImage(
  input: NativeChooseImageInput = DEFAULT_CHOOSE_IMAGE_INPUT,
  options: NativeInvocationOptions = {},
): Promise<NativeImageResult> {
  return invokeNativeCapability(capabilityRegistry.chooseImage, input, options)
}

export function saveImageToAlbum(
  input: NativeSaveImageToAlbumInput,
  options: NativeInvocationOptions = {},
): Promise<NativeSuccessResult> {
  return invokeNativeCapability(capabilityRegistry.saveImageToAlbum, input, options)
}

export function copyText(
  input: NativeCopyTextInput,
  options: NativeInvocationOptions = {},
): Promise<NativeSuccessResult> {
  return invokeNativeCapability(capabilityRegistry.copyText, input, options)
}

/**
 * H033 rewarded-ad boundary for check-in resign.
 *
 * Only the confirmed scene `h5CheckinResign` is exposed. Native owns the ad UI and returns one
 * of completed / closed / failed / no_fill; H5 must only reward on completed.
 */
export function showRewardAd(
  input: NativeRewardAdInput = { scene: 'h5CheckinResign' },
  options: NativeInvocationOptions = {},
): Promise<NativeRewardAdResult> {
  return invokeNativeCapability(capabilityRegistry.showRewardAd, input, options)
}

/**
 * H034 App launch / store boundary.
 *
 * Native owns installed-state detection, App launch mechanics, and store routing. H5 supplies only
 * the confirmed action plus inviteCode/fallbackUrl strings and never invents schemes or store URLs.
 */
export function openApp(
  input: NativeOpenAppInput,
  options: NativeInvocationOptions = {},
): Promise<NativeOpenAppResult> {
  return invokeNativeCapability(capabilityRegistry.openApp, input, options)
}
