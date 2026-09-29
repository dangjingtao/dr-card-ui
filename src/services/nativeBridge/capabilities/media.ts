import {
  createCallbackInjectedObjectTransport,
  NativeTransportError,
  parseJsonPayload,
  serializeJsonValue,
  type NativeTransportWindow,
} from '../../nativeBridgeTransport'
import { defineCapability, resolveDualInjectedCapability } from '../core'
import { isFiniteNumber, parseConfirmedNativeAsyncResult } from '../protocol'
import type {
  NativeChooseImageInput,
  NativeCopyTextInput,
  NativeImageResult,
  NativeSaveImageToAlbumInput,
  NativeSuccessResult,
  NativeTakePhotoInput,
} from '../types'

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

function parseImageResult(payload: unknown): NativeImageResult {
  const parsed = parseConfirmedNativeAsyncResult(payload)
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

function parseSuccessResult(payload: unknown): NativeSuccessResult {
  const raw = parseJsonPayload<unknown>(payload)
  if (raw !== null && typeof raw === 'object' && typeof (raw as { code?: unknown }).code === 'number') {
    const code = (raw as { code: number }).code
    if (code === 0) return { success: true }
  }

  const parsed = parseConfirmedNativeAsyncResult(payload)
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    typeof (parsed as { success?: unknown }).success !== 'boolean'
  ) {
    throw new NativeTransportError(
      'payload-invalid',
      'Native success result requires code=0 callback envelope or a legacy boolean success field.',
    )
  }

  return { success: (parsed as { success: boolean }).success }
}

const androidTakePhotoTransport = createCallbackInjectedObjectTransport<
  NativeTakePhotoInput,
  NativeImageResult
>({
  objectName: 'androidBridge',
  callbackName: 'nativeBridgeCallback',
  callbackAliases: ['androidBridgeCallback'],
  methodName: 'takePhoto',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateTakePhotoInput(input), callbackId })],
  parseResult: parseImageResult,
})

const iosTakePhotoTransport = createCallbackInjectedObjectTransport<
  NativeTakePhotoInput,
  NativeImageResult
>({
  objectName: 'iosBridge',
  callbackName: 'nativeBridgeCallback',
  methodName: 'takePhoto',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateTakePhotoInput(input), callbackId })],
  parseResult: parseImageResult,
})

const androidChooseImageTransport = createCallbackInjectedObjectTransport<
  NativeChooseImageInput,
  NativeImageResult
>({
  objectName: 'androidBridge',
  callbackName: 'nativeBridgeCallback',
  callbackAliases: ['androidBridgeCallback'],
  methodName: 'chooseImage',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateChooseImageInput(input), callbackId })],
  parseResult: parseImageResult,
})

const iosChooseImageTransport = createCallbackInjectedObjectTransport<
  NativeChooseImageInput,
  NativeImageResult
>({
  objectName: 'iosBridge',
  callbackName: 'nativeBridgeCallback',
  methodName: 'chooseImage',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateChooseImageInput(input), callbackId })],
  parseResult: parseImageResult,
})

const androidSaveImageToAlbumTransport = createCallbackInjectedObjectTransport<
  NativeSaveImageToAlbumInput,
  NativeSuccessResult
>({
  objectName: 'androidBridge',
  callbackName: 'nativeBridgeCallback',
  callbackAliases: ['androidBridgeCallback'],
  methodName: 'saveImageToAlbum',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateSaveImageInput(input), callbackId })],
  parseResult: parseSuccessResult,
})

const iosSaveImageToAlbumTransport = createCallbackInjectedObjectTransport<
  NativeSaveImageToAlbumInput,
  NativeSuccessResult
>({
  objectName: 'iosBridge',
  callbackName: 'nativeBridgeCallback',
  methodName: 'saveImageToAlbum',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateSaveImageInput(input), callbackId })],
  parseResult: parseSuccessResult,
})

const androidCopyTextTransport = createCallbackInjectedObjectTransport<
  NativeCopyTextInput,
  NativeSuccessResult
>({
  objectName: 'androidBridge',
  callbackName: 'nativeBridgeCallback',
  callbackAliases: ['androidBridgeCallback'],
  methodName: 'copyText',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateCopyTextInput(input), callbackId })],
  parseResult: parseSuccessResult,
})

const iosCopyTextTransport = createCallbackInjectedObjectTransport<
  NativeCopyTextInput,
  NativeSuccessResult
>({
  objectName: 'iosBridge',
  callbackName: 'nativeBridgeCallback',
  methodName: 'copyText',
  serializeArgs: (input, callbackId) => [serializeJsonValue({ ...validateCopyTextInput(input), callbackId })],
  parseResult: parseSuccessResult,
})

export const DEFAULT_IMAGE_INPUT: NativeTakePhotoInput = {
  crop: true,
  maxWidth: 1080,
  maxHeight: 1080,
  quality: 0.8,
}

export const DEFAULT_CHOOSE_IMAGE_INPUT: NativeChooseImageInput = {
  ...DEFAULT_IMAGE_INPUT,
  count: 1,
}

export const takePhotoCapability = defineCapability<
  'takePhoto',
  NativeTakePhotoInput,
  NativeImageResult
>({
  name: 'takePhoto',
  platforms: ['android', 'ios'],
  description:
    'Capture one image through the confirmed Android/iOS injected-object contract.',
  sensitiveResult: true,
  resolve(hostWindow: NativeTransportWindow | undefined) {
    return resolveDualInjectedCapability(
      hostWindow,
      'takePhoto',
      DEFAULT_IMAGE_INPUT,
      (input) => androidTakePhotoTransport.resolve(hostWindow!, input),
      (input) => iosTakePhotoTransport.resolve(hostWindow!, input),
    )
  },
})

export const chooseImageCapability = defineCapability<
  'chooseImage',
  NativeChooseImageInput,
  NativeImageResult
>({
  name: 'chooseImage',
  platforms: ['android', 'ios'],
  description:
    'Choose one image through the confirmed Android/iOS injected-object contract.',
  sensitiveResult: true,
  resolve(hostWindow: NativeTransportWindow | undefined) {
    return resolveDualInjectedCapability(
      hostWindow,
      'chooseImage',
      DEFAULT_CHOOSE_IMAGE_INPUT,
      (input) => androidChooseImageTransport.resolve(hostWindow!, input),
      (input) => iosChooseImageTransport.resolve(hostWindow!, input),
    )
  },
})

export const saveImageToAlbumCapability = defineCapability<
  'saveImageToAlbum',
  NativeSaveImageToAlbumInput,
  NativeSuccessResult
>({
  name: 'saveImageToAlbum',
  platforms: ['android', 'ios'],
  description:
    'Save an existing base64 image or HTTPS image URL to the system album.',
  sensitiveResult: false,
  resolve(hostWindow: NativeTransportWindow | undefined) {
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
  },
})

export const copyTextCapability = defineCapability<
  'copyText',
  NativeCopyTextInput,
  NativeSuccessResult
>({
  name: 'copyText',
  platforms: ['android', 'ios'],
  description:
    'Copy text through the confirmed Android/iOS injected-object contract.',
  sensitiveResult: false,
  resolve(hostWindow: NativeTransportWindow | undefined) {
    return resolveDualInjectedCapability(
      hostWindow,
      'copyText',
      { text: '' },
      (input) => androidCopyTextTransport.resolve(hostWindow!, input),
      (input) => iosCopyTextTransport.resolve(hostWindow!, input),
    )
  },
})
