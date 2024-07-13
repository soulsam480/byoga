import { ErrorBoundary, render } from 'voby'
import { App } from './app'
import './style.css'
import { logger } from './lib/utils/logger'
import { startDatabase } from './db/lib/migrator'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'

void startDatabase()

render(
  <ErrorBoundary fallback={({ error }) => {
    logger.warn('[UI]: ', error)

    return 'ERROR'
  }}
  >
    <App />
  </ErrorBoundary>,
  document.getElementById('app'),
)
