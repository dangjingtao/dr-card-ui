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
  const parsed = parseJsonStringPayload<unknown>(payload)
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
  const parsed = parseJsonStringPayload<unknown>(payload)
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
  const parsed = parseJsonStringPayload<unknown>(payload)
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
  const parsed = parseJsonStringPayload<unknown>(payload)
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
    throw new NativeBridgeError(
      'invocation-failed',
      descriptor.name,
      `Native capability "${descriptor.name}" threw during invocation.`,
      error,
    )
  }

  try {
    return await withTimeout(
      invocation,
      descriptor.name,
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    )
  } catch (error) {
    if (error instanceof NativeBridgeError) throw error

    throw new NativeBridgeError(
      'invocation-failed',
      descriptor.name,
      `Native capability "${descriptor.name}" rejected during invocation.`,
      error,
    )
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
