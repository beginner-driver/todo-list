import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { seedIfEmpty } from './mocks/db'

async function seedInitialData() {
  const res = await fetch(`${import.meta.env.BASE_URL}mock-data/todos.json`)
  const initial = await res.json()
  seedIfEmpty(initial)
}

async function enableMocking() {
  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}

async function bootstrap() {
  await seedInitialData()
  await enableMocking()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
