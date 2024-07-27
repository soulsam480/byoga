import { registerSW } from 'virtual:pwa-register'
import { render } from 'preact'
import { App } from './app'
import './style.css'
import { startDatabase } from './db/lib/migrator'
import 'unfonts.css'
import { logger } from './lib/utils/logger'

void startDatabase().then(() => {
  logger.info('DB online.')
})

render(
  // <ErrorBoundary fallback={({ error }) => {
  //   logger.warn('[UI]: ', error)

  //   return 'ERROR'
  // }}
  // >
  <App />
  // </ErrorBoundary>
  ,
  document.getElementById('app')!,
)

registerSW({ immediate: true })
