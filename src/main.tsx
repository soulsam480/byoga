import { Component, render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import { App } from './app'
import { startDatabase } from './db/lib/migrator'
import { logger } from './lib/utils/logger'
import './style.css'
import 'unfonts.css'

void startDatabase().then(() => {
  logger.info('DB online.')
})

class ErrorBoundary extends Component {
  constructor() {
    super()
    this.state = { errored: false }
  }

  componentDidCatch(error: any, errorInfo: any) {
    logger.error('[UI]: ', error, errorInfo)
  }

  render(props: any) {
    return props.children
  }
}

render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  // biome-ignore lint/style/noNonNullAssertion: this is fine
  document.getElementById('app')!
)

registerSW({ immediate: true })
