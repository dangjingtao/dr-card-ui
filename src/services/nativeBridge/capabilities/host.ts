import {
  createInjectedObjectTransport,
  type NativeTransportWindow,
} from '../../nativeBridgeTransport'
import {
  defineCapability,
  supportedCapability,
  unsupportedCapability,
} from '../core'

const androidTransport = createInjectedObjectTransport<void, void>({
  objectName: 'androidBridge',
  methodName: 'closeWebView',
  serializeArgs: () => [],
  parseResult: () => undefined,
})

const iosTransport = createInjectedObjectTransport<void, void>({
  objectName: 'iosBridge',
  methodName: 'closeWebView',
  serializeArgs: () => [],
  parseResult: () => undefined,
})

function resolveTransport(hostWindow: NativeTransportWindow | undefined) {
  if (hostWindow?.androidBridge) {
    const resolution = androidTransport.resolve(hostWindow, undefined)
    if (!resolution.supported) return resolution
    return supportedCapability<void, void>(() => resolution.invoke())
  }

  if (hostWindow?.iosBridge) {
    const resolution = iosTransport.resolve(hostWindow, undefined)
    if (!resolution.supported) return resolution
    return supportedCapability<void, void>(() => resolution.invoke())
  }

  return unsupportedCapability(
    'bridge-unsupported',
    'Neither window.androidBridge nor window.iosBridge is available in the current host.',
  )
}

export const closeWebViewCapability = defineCapability<
  'closeWebView',
  void,
  void
>({
  name: 'closeWebView',
  platforms: ['android', 'ios'],
  description:
    'Close the current App WebView through the confirmed Android/iOS injected-object contract.',
  sensitiveResult: false,
  resolve: resolveTransport,
})
