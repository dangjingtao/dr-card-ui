import { getLoginTokenCapability } from './capabilities/auth'
import { closeWebViewCapability } from './capabilities/host'
import {
  chooseImageCapability,
  copyTextCapability,
  saveImageToAlbumCapability,
  takePhotoCapability,
} from './capabilities/media'
import { openAppCapability } from './capabilities/openApp'
import { showRewardAdCapability } from './capabilities/rewardAd'
import { scanCodeCapability } from './capabilities/scan'
import type { NativeCapabilityPlatform } from './types'

export const capabilityRegistry = {
  getLoginToken: getLoginTokenCapability,
  closeWebView: closeWebViewCapability,
  scanCode: scanCodeCapability,
  takePhoto: takePhotoCapability,
  chooseImage: chooseImageCapability,
  saveImageToAlbum: saveImageToAlbumCapability,
  copyText: copyTextCapability,
  showRewardAd: showRewardAdCapability,
  openApp: openAppCapability,
} as const

export type NativeCapabilityName = keyof typeof capabilityRegistry

export interface NativeCapabilityCatalogItem {
  name: NativeCapabilityName
  description: string
  platforms: readonly NativeCapabilityPlatform[]
  supported: boolean
  sensitiveResult: boolean
}
