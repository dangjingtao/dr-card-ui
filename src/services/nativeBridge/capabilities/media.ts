import {
  createInjectedObjectTransport,
  NativeTransportError,
  serializeJsonValue,
  type NativeTransportWindow,
} from '../../nativeBridgeTransport'
import { defineCapability, resolveDualInjectedCapability } from '../core'
import { isFiniteNumber, parseConfirmedNativeResult } from '../protocol'
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

function parseSuccessResult(payload: unknown): NativeSuccessResult {
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

const androidTakePhotoTransport = createInjectedObjectTransport<
  NativeTakePhotoInput,
  NativeImageResult
>({
  objectName: 'androidBridge',
  methodName: 'takePhoto',
  serializeArgs: (input) => [serializeJsonValue(validateTakePhotoInput(input))],
  parseResult: parseImageResult,
})

const iosTakePhotoTransport = createInjectedObjectTransport<
  NativeTakePhotoInput,
  NativeImageResult
>({
  objectName: 'iosBridge',
  methodName: 'takePhoto',
  serializeArgs: (input) => [serializeJsonValue(validateTakePhotoInput(input))],
  parseResult: parseImageResult,
})

const androidChooseImageTransport = createInjectedObjectTransport<
  NativeChooseImageInput,
  NativeImageResult
>({
  objectName: 'androidBridge',
  methodName: 'chooseImage',
  serializeArgs: (input) => [serializeJsonValue(validateChooseImageInput(input))],
  parseResult: parseImageResult,
})

const iosChooseImageTransport = createInjectedObjectTransport<
  NativeChooseImageInput,
  NativeImageResult
>({
  objectName: 'iosBridge',
  methodName: 'chooseImage',
  serializeArgs: (input) => [serializeJsonValue(validateChooseImageInput(input))],
  parseResult: parseImageResult,
})

const androidSaveImageToAlbumTransport = createInjectedObjectTransport<
  NativeSaveImageToAlbumInput,
  NativeSuccessResult
>({
  objectName: 'androidBridge',
  methodName: 'saveImageToAlbum',
  serializeArgs: (input) => [serializeJsonValue(validateSaveImageInput(input))],
  parseResult: parseSuccessResult,
})

const iosSaveImageToAlbumTransport = createInjectedObjectTransport<
  NativeSaveImageToAlbumInput,
  NativeSuccessResult
>({
  objectName: 'iosBridge',
  methodName: 'saveImageToAlbum',
  serializeArgs: (input) => [serializeJsonValue(validateSaveImageInput(input))],
  parseResult: parseSuccessResult,
})

const androidCopyTextTransport = createInjectedObjectTransport<
  NativeCopyTextInput,
  NativeSuccessResult
>({
  objectName: 'androidBridge',
  methodName: 'copyText',
  serializeArgs: (input) => [serializeJsonValue(validateCopyTextInput(input))],
  parseResult: parseSuccessResult,
})

const iosCopyTextTransport = createInjectedObjectTransport<
  NativeCopyTextInput,
  NativeSuccessResult
>({
  objectName: 'iosBridge',
  methodName: 'copyText',
  serializeArgs: (input) => [serializeJsonValue(validateCopyTextInput(input))],
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
