import { signal } from '@preact/signals'
import clsx from 'clsx'
import type { JSX } from 'preact/compat'
import { createPortal } from 'preact/compat'
import { tick } from '../utils/tick'

interface IAlert {
  type: 'success' | 'warning' | 'info' | 'error'
  message: string
}

const alerts = signal<IAlert[]>([])

export function showAlert(alert: IAlert) {
  alerts.value.push(alert)

  tick().then(() => {
    const result = alerts.value.slice()

    result.shift()

    alerts.value = result

    return result
  })
}

const ALERT_TO_CLASS_MAP: Record<IAlert['type'], string> = {
  error: 'alert-error',
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
}

export function Alerts(): JSX.Element {
  return (
    createPortal(
      <div class="fixed top-8 z-50 inset-x-0 flex flex-col gap-2 items-center justify-center">
        {alerts.value.map((value) => {
          return (
            <div
              role="alert"
              className={clsx([
                'alert max-w-96',
                ALERT_TO_CLASS_MAP[value.type],
              ])}
            >
              {value.message}
            </div>
          )
        })}
      </div>,
      document.body,
    )
  )
}
