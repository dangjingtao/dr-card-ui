export const H014_SCENARIO_HEADER = 'x-dr-card-mock-scenario'

export const H014_MOCK_SCENARIOS = [
  'success',
  'empty',
  'business-error',
  'http-4xx',
  'http-5xx',
  'slow',
  'network-failure',
] as const

export type H014MockScenario = (typeof H014_MOCK_SCENARIOS)[number]

/** Deliberately visible loading state without making CI slow. */
export const H014_SLOW_DELAY_MS = 900

export function readH014Scenario(request: Request): H014MockScenario | null {
  const raw = request.headers.get(H014_SCENARIO_HEADER)
  return H014_MOCK_SCENARIOS.includes(raw as H014MockScenario)
    ? (raw as H014MockScenario)
    : null
}
