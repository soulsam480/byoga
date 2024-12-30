import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import { App } from './app'
import { startDatabase } from './db/lib/migrator'
import { logger } from './lib/utils/logger'
import './style.css'
import 'unfonts.css'

void startDatabase().then(() => {
  logger.info('DB online.')
})

render(
  // <ErrorBoundary fallback={({ error }) => {
  //   logger.warn('[UI]: ', error)

  //   return 'ERROR'
  // }}
  // >
  <App />,
  // </ErrorBoundary>
  document.getElementById('app')!
)

registerSW({ immediate: true })
