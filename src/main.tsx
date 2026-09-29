import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { runtimePolicy } from './app/config/runtime'
import UnsupportedHostNotice, { isUnsupportedHost } from './pages/UnsupportedHostNotice'
import './styles/globals.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root was not found')
}

const appRootElement = rootElement

async function prepareRuntime() {
  if (runtimePolicy.dataMode !== 'mock') return

  const { startApiMocking } = await import('./mocks/browser')
  await startApiMocking()
}

async function prepareMobileDebugPanel() {
  // Maintainer 2026-09-29: Eruda is required in dev/preview/test for WebView diagnostics.
  if (runtimePolicy.appEnvironment === 'prod') return

  try {
    const { default: eruda } = await import('eruda')
    eruda.init()
  } catch (error) {
    console.warn('[debug] Eruda initialization failed; continuing without the mobile console.', error)
  }
}

async function bootstrap() {
  await prepareRuntime()
  await prepareMobileDebugPanel()

  /* H036：test/prod 只承载真实 API + Native Bridge，非原生宿主不进入应用。
   * 拦截发生在 React 挂载前，路由不会启动，因此不会发出任何业务请求。 */
  if (isUnsupportedHost()) {
    ReactDOM.createRoot(appRootElement).render(<UnsupportedHostNotice />)
    return
  }

  ReactDOM.createRoot(appRootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void bootstrap()
