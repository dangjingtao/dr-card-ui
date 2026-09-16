import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { runtimePolicy } from './app/config/runtime'
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

async function bootstrap() {
  await prepareRuntime()

  ReactDOM.createRoot(appRootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void bootstrap()
