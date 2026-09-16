import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const positions = new Map<string, number>()

/** Keeps the shell's internal scroll container in sync with browser navigation. */
export default function H5ScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previousPathname = useRef(location.pathname)

  useLayoutEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>('[data-page-scroll]')
    if (!scrollContainer) return

    const currentTop = scrollContainer.scrollTop
    const pathnameChanged = previousPathname.current !== location.pathname

    let top = currentTop
    if (navigationType === 'POP') {
      top = positions.get(location.key) ?? (pathnameChanged ? 0 : currentTop)
    } else if (pathnameChanged) {
      // PUSH and cross-pathname REPLACE both enter a new page and should start at the top.
      // Same-page REPLACE/search/hash updates keep the current scroll position.
      top = 0
    }

    if (top !== currentTop) {
      scrollContainer.scrollTo({ top, left: 0, behavior: 'auto' })
    }

    previousPathname.current = location.pathname

    // Persist the active history entry while the user scrolls. Recording continuously means the
    // outgoing position already exists before React swaps the outlet; a shorter destination cannot
    // clamp the source page's saved scrollTop during the next layout effect.
    const savePosition = () => {
      positions.set(location.key, scrollContainer.scrollTop)
    }

    savePosition()
    scrollContainer.addEventListener('scroll', savePosition, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', savePosition)
    }
  }, [location.key, location.pathname, navigationType])

  return null
}
