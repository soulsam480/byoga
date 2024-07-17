import { $, For, Portal } from 'voby'

interface IAlert {
  type: 'success' | 'warning' | 'info' | 'error'
  message: string
}

const alerts = $<IAlert[]>([])

export function showAlert(alert: IAlert) {
  alerts(prev => [...prev, alert])

  window.setTimeout(() => {
    alerts((prev) => {
      const result = prev.slice()

      result.shift()

      return result
    })
  }, 1500)
}

const ALERT_TO_CLASS_MAP: Record<IAlert['type'], string> = {
  error: 'alert-error',
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
}

export function Alerts(): JSX.Element {
  return (
    <Portal mount={document.body}>
      <div class="fixed top-0 z-50 inset-x-0 flex flex-col gap-2 items-center justify-center pt-8">
        <For values={alerts}>
          {(value) => {
            return (
              <div role="alert" class={['alert max-w-96', ALERT_TO_CLASS_MAP[value.type]]}>
                {value.message}
              </div>
            )
          }}
        </For>
      </div>
    </Portal>
  )
}
