import { useEffect, useState } from 'react'

/**
 * 极简 store：提供一个 useXxx hook + 全局 actions。
 * 适用于纯前端 mock 场景（无后端、无持久化），便于跨页面共享同一份状态。
 */
export function create<T>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()

  const setState = (next: T | ((prev: T) => T)) => {
    state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next
    listeners.forEach((l) => l())
  }

  const actions = {
    get: () => state,
    set: setState,
    update: (patch: Partial<T>) => setState({ ...state, ...patch }),
    reset: () => setState(initial),
    subscribe: (l: () => void) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
  }

  function useStore(): T {
    const [, force] = useState(0)
    useEffect(() => actions.subscribe(() => force((n) => n + 1)), [])
    return state
  }

  return [useStore, actions] as const
}
