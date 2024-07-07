import { ErrorBoundary, render } from 'voby'
import { App } from './app'
import './style.css'
import { logger } from './lib/utils/logger'
import { migrateUp } from './db/lib/migrator'

void migrateUp()

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
