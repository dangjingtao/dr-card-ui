import { useEffect, useState } from 'react'

/**
 * Temporary formal-H5 client state for profile fields whose real API contract is still pending.
 *
 * Important:
 * - No fixture user data is seeded here. A new runtime starts with an empty profile value.
 * - This is deliberately NOT an authentication source and does not model the Native App session.
 * - Updates are ephemeral client state only; they are not durable profile persistence.
 * - Real profile reads/writes must replace this state once the backend/API contract exists.
 * - H010 may later migrate genuinely shared client state to Zustand; it must not turn this into a
 *   production Mock fallback.
 */
export interface MemberProfileState {
  birthday: string
  birthdayLastModifiedAt: number
}

const INITIAL_MEMBER_PROFILE: MemberProfileState = {
  birthday: '',
  birthdayLastModifiedAt: 0,
}

let state = INITIAL_MEMBER_PROFILE
const listeners = new Set<() => void>()

const setState = (
  next: MemberProfileState | ((previous: MemberProfileState) => MemberProfileState),
) => {
  state = typeof next === 'function' ? next(state) : next
  listeners.forEach((listener) => listener())
}

export const memberProfileActions = {
  get: () => state,
  update: (patch: Partial<MemberProfileState>) => setState({ ...state, ...patch }),
  reset: () => setState(INITIAL_MEMBER_PROFILE),
}

export function useMemberProfile(): MemberProfileState {
  const [, forceRender] = useState(0)

  useEffect(() => {
    const listener = () => forceRender((value) => value + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return state
}
