import type { NavigateFunction, NavigateOptions, To } from 'react-router-dom'

function canUseViewTransition(): boolean {
  if (typeof document === 'undefined' || !('startViewTransition' in document)) return false
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Opts a navigation into React Router's native View Transition path when supported.
 * Route-frame fallback suppression and native direction styling are derived from the
 * router's actual transition lifecycle in MobileLayout rather than a guessed timer.
 */
export function navigateWithH5ViewTransition(
  navigate: NavigateFunction,
  to: To,
  options: NavigateOptions = {},
) {
  navigate(to, { ...options, viewTransition: canUseViewTransition() })
}
