import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const positions = new Map<string, number>()

/** Keeps the shell's internal scroll container in sync with browser navigation. */
export default function H5ScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previousKey = useRef<string | null>(null)
  const previousPathname = useRef(location.pathname)

  useLayoutEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>('[data-page-scroll]')
    if (!scrollContainer) return

    const currentTop = scrollContainer.scrollTop
    const pathnameChanged = previousPathname.current !== location.pathname

    if (previousKey.current && previousKey.current !== location.key) {
      positions.set(previousKey.current, currentTop)
    }

    let top = currentTop
    if (navigationType === 'POP') {
      top = positions.get(location.key) ?? (pathnameChanged ? 0 : currentTop)
    } else if (navigationType === 'PUSH' && pathnameChanged) {
      top = 0
    }

    if (top !== currentTop) {
      scrollContainer.scrollTo({ top, left: 0, behavior: 'auto' })
    }

    previousKey.current = location.key
    previousPathname.current = location.pathname

    return () => {
      positions.set(location.key, scrollContainer.scrollTop)
    }
  }, [location.key, location.pathname, navigationType])

  return null
}
