import { ErrorBoundary, render } from 'voby'
import { App } from './app'
import './style.css'
import { logger } from './lib/utils/logger'
import { startDatabase } from './db/lib/migrator'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'
import { showAlert } from './lib/components/Alerts'

void startDatabase().then(() => {
  showAlert({
    type: 'info',
    message: 'DB is up and running !',
  })
})

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
