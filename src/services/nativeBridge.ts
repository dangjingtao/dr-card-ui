import {
  DEFAULT_CHOOSE_IMAGE_INPUT,
  DEFAULT_IMAGE_INPUT,
} from './nativeBridge/capabilities/media'
import { capabilityRegistry } from './nativeBridge/registry'
import { invokeNativeCapability } from './nativeBridge/runtime'
import type {
  NativeChooseImageInput,
  NativeCopyTextInput,
  NativeImageResult,
  NativeInvocationOptions,
  NativeLoginToken,
  NativeOpenAppInput,
  NativeOpenAppResult,
  NativeRewardAdInput,
  NativeRewardAdResult,
  NativeSaveImageToAlbumInput,
  NativeScanCodeInput,
  NativeScanCodeResult,
  NativeSuccessResult,
  NativeTakePhotoInput,
} from './nativeBridge/types'

export { NativeBridgeError } from './nativeBridge/errors'
export {
  getNativeBridgeCapabilityCatalog,
  getNativeBridgeDiagnostics,
  invokeRegisteredNativeCapabilityForDebug,
} from './nativeBridge/runtime'
export type { NativeBridgeDiagnostics } from './nativeBridge/runtime'
export type {
  NativeCapabilityCatalogItem,
  NativeCapabilityName,
} from './nativeBridge/registry'
export type {
  NativeBridgeErrorCode,
  NativeCapabilityPlatform,
  NativeChooseImageInput,
  NativeCopyTextInput,
  NativeFailurePayloadCode,
  NativeHost,
  NativeImageResult,
  NativeLoginToken,
  NativeOpenAppAction,
  NativeOpenAppInput,
  NativeOpenAppResult,
  NativeRewardAdInput,
  NativeRewardAdResult,
  NativeRewardAdStatus,
  NativeSavedImageType,
  NativeSaveImageToAlbumInput,
  NativeScanCodeInput,
  NativeScanCodeResult,
  NativeScanType,
  NativeSuccessResult,
  NativeTakePhotoInput,
} from './nativeBridge/types'

/**
 * H029 confirmed production login boundary, executed through the shared capability runtime.
 *
 * Android uses window.androidBridge.getLoginToken(); iOS uses
 * window.iosBridge.getLoginToken(). Both take no arguments and synchronously return a JSON
 * string with a token field. H5 normalizes the synchronous host return to a Promise and validates
 * the returned payload before exposing it to callers.
 */
export function getLoginToken(
  options: NativeInvocationOptions = {},
): Promise<NativeLoginToken> {
  return invokeNativeCapability(
    capabilityRegistry.getLoginToken,
    undefined,
    options,
  )
}

/**
 * H030 confirmed App-WebView close boundary.
 *
 * Android uses window.androidBridge.closeWebView(); iOS uses
 * window.iosBridge.closeWebView(). The method takes no arguments and has no result payload.
 * Hosts that have not implemented the method remain capability-unsupported.
 */
export function closeWebView(
  options: NativeInvocationOptions = {},
): Promise<void> {
  return invokeNativeCapability(
    capabilityRegistry.closeWebView,
    undefined,
    options,
  )
}

/**
 * H031 confirmed Native scanner boundary.
 *
 * Android uses window.androidBridge.scanCode(json); iOS uses
 * window.iosBridge.scanCode(json). The input is serialized as a JSON string with
 * scanType: qr | bar | all; Native synchronously returns a JSON string with code.
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
  return invokeNativeCapability(
    capabilityRegistry.saveImageToAlbum,
    input,
    options,
  )
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
 * Only the confirmed scene h5CheckinResign is exposed. Native owns the ad UI and returns one
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
