import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { runtimePolicy } from './app/config/runtime'
import { isFixtureDebugRequested } from './app/fixtures/useFixture'
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
  if (!isFixtureDebugRequested()) return

  const { default: eruda } = await import('eruda')
  eruda.init()
}

async function bootstrap() {
  await prepareRuntime()
  await prepareMobileDebugPanel()

  ReactDOM.createRoot(appRootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void bootstrap()
