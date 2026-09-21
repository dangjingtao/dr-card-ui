import {
  createInjectedObjectTransport,
  type NativeTransportWindow,
} from '../../nativeBridgeTransport'
import { defineCapability, resolveDualInjectedCapability } from '../core'

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
  return resolveDualInjectedCapability<void, void>(
    hostWindow,
    'closeWebView',
    undefined,
    (input) => androidTransport.resolve(hostWindow!, input),
    (input) => iosTransport.resolve(hostWindow!, input),
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
