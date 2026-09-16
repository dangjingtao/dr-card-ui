import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const positions = new Map<string, number>()

/** Keeps the shell's internal scroll container in sync with browser navigation. */
export default function H5ScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previousKey = useRef<string | null>(null)

  useLayoutEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>('[data-page-scroll]')
    if (!scrollContainer) return

    if (previousKey.current && previousKey.current !== location.key) {
      positions.set(previousKey.current, scrollContainer.scrollTop)
    }

    const top = navigationType === 'POP' ? positions.get(location.key) ?? 0 : 0
    scrollContainer.scrollTo({ top, left: 0, behavior: 'auto' })
    previousKey.current = location.key

    return () => {
      positions.set(location.key, scrollContainer.scrollTop)
    }
  }, [location.key, navigationType])

  return null
}
