import type { NavigateFunction, NavigateOptions, To } from 'react-router-dom'

export type H5NavigationKind = 'tab' | 'forward' | 'back'

const TRANSITION_CLEANUP_MS = 260
let cleanupTimer: number | undefined

function canUseViewTransition(): boolean {
  if (typeof document === 'undefined' || !('startViewTransition' in document)) return false
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function markNativeTransition(kind: H5NavigationKind) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.h5NativeTransition = kind

  if (typeof window === 'undefined') return
  if (cleanupTimer != null) window.clearTimeout(cleanupTimer)
  cleanupTimer = window.setTimeout(() => {
    if (root.dataset.h5NativeTransition === kind) {
      delete root.dataset.h5NativeTransition
    }
    cleanupTimer = undefined
  }, TRANSITION_CLEANUP_MS)
}

/**
 * Enables React Router's native View Transition path when the browser supports it.
 * Unsupported browsers and reduced-motion users keep the normal router navigation;
 * the shell-level CSS fallback still supplies the route-enter motion where allowed.
 */
export function navigateWithH5ViewTransition(
  navigate: NavigateFunction,
  to: To,
  kind: H5NavigationKind,
  options: NavigateOptions = {},
) {
  const viewTransition = canUseViewTransition()
  if (viewTransition) markNativeTransition(kind)
  navigate(to, { ...options, viewTransition })
}
