import { useEffect, useState } from 'react'

/**
 * Formal H5 member-profile state used only for deterministic UI behaviour that currently has
 * no confirmed backend contract.
 *
 * This is deliberately NOT an authentication source and does not model the Native App session.
 * Real profile persistence must replace this fixture state once the backend/API contract exists.
 * H010 may later migrate this lightweight store to Zustand together with other shared client state.
 */
export interface MemberProfileState {
  birthday: string
  birthdayLastModifiedAt: number
}

const INITIAL_MEMBER_PROFILE: MemberProfileState = {
  birthday: '2003-08-15',
  // Keep the existing prototype behaviour: historical users may edit immediately.
  birthdayLastModifiedAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
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
