import { ErrorBoundary, render } from 'voby'
import { App } from './app'
import './style.css'

render(
  <ErrorBoundary fallback="Oh no">
    <App />
  </ErrorBoundary>,
  document.getElementById('app'),
)
