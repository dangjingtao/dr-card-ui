export type AppEnvironment = 'preview' | 'dev' | 'test' | 'prod'
export type DataMode = 'mock' | 'api'

const APP_ENVIRONMENTS: AppEnvironment[] = ['preview', 'dev', 'test', 'prod']
const DATA_MODES: DataMode[] = ['mock', 'api']

function asAppEnvironment(value: string | undefined): AppEnvironment | undefined {
  return APP_ENVIRONMENTS.includes(value as AppEnvironment) ? (value as AppEnvironment) : undefined
}

function asDataMode(value: string | undefined): DataMode | undefined {
  return DATA_MODES.includes(value as DataMode) ? (value as DataMode) : undefined
}

function inferAppEnvironment(mode: string): AppEnvironment {
  if (mode === 'development') return 'dev'
  if (mode === 'preview') return 'preview'
  if (mode === 'test') return 'test'
  return 'prod'
}

const appEnvironment = asAppEnvironment(import.meta.env.VITE_APP_ENV) ?? inferAppEnvironment(import.meta.env.MODE)
const dataMode =
  asDataMode(import.meta.env.VITE_DATA_MODE) ??
  (appEnvironment === 'dev' || appEnvironment === 'preview' ? 'mock' : 'api')

const fixtureEnvironment =
  dataMode === 'mock' && (appEnvironment === 'dev' || appEnvironment === 'preview')

/**
 * H004 runtime policy.
 *
 * - development / preview + mock: deterministic fixture query controls are available.
 * - test / prod, or any API-mode build: fixture query controls and DebugPanel are disabled.
 * - invalid or missing production-like configuration fails closed through the Vite-mode fallback.
 *
 * H006 will extend this module with API base URL, Bridge mode, build identity and explicit
 * invalid-combination validation. H004 only owns fixture/debug isolation.
 */
export const runtimePolicy = Object.freeze({
  appEnvironment,
  dataMode,
  fixtureQueriesEnabled: fixtureEnvironment,
  debugPanelEnabled: fixtureEnvironment,
})
