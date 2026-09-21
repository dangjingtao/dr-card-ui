import {
  openApp,
  type NativeOpenAppResult,
} from '../../services/nativeBridge'

export interface AppOpenTarget {
  inviteCode?: string
  fallbackUrl?: string
}

function toNativeTarget(target: AppOpenTarget = {}) {
  return {
    inviteCode: target.inviteCode ?? '',
    fallbackUrl: target.fallbackUrl ?? '',
  }
}

/** Native owns installation detection; H5 never probes schemes, timers, or visibility heuristics. */
export function detectInstalledApp(
  target: AppOpenTarget = {},
): Promise<NativeOpenAppResult> {
  return openApp({
    action: 'detect',
    ...toNativeTarget(target),
  })
}

/** Open the installed App through Native. No H5 internal route is used as an App-launch substitute. */
export function openInstalledApp(
  target: AppOpenTarget = {},
): Promise<NativeOpenAppResult> {
  return openApp({
    action: 'open',
    ...toNativeTarget(target),
  })
}

/** Ask Native to route to the platform store. H5 does not invent App Store / market URLs. */
export function openNativeAppStore(
  target: AppOpenTarget = {},
): Promise<NativeOpenAppResult> {
  return openApp({
    action: 'store',
    ...toNativeTarget(target),
  })
}
