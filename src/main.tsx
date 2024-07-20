import { render } from 'preact'
import { App } from './app'
import './style.css'
import { startDatabase } from './db/lib/migrator'
import { showAlert } from './lib/components/Alerts'
import 'unfonts.css'

void startDatabase().then(() => {
  showAlert({
    type: 'info',
    message: 'DB is up and running !',
  })
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
