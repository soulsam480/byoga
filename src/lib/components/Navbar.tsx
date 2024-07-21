import { useRef } from 'preact/hooks'
import type { Remote } from 'comlink'
import { deleteDB } from '../../db/client'
import type { ExcelWorker } from '../../workers/xlsx.worker'
import { showAlert } from './Alerts'

const RemoteExcel = new ComlinkWorker<
  typeof import('../../workers/xlsx.worker')
>(new URL('../../workers/xlsx.worker', import.meta.url), { type: 'module' })

export function Navbar() {
  const worker = useRef<Remote<ExcelWorker> | null>(null)

  async function importFile() {
    worker.current = await new RemoteExcel.ExcelWorker()

    const inputEl = document.createElement('input')

    inputEl.type = 'file'
    inputEl.accept = '.xlsx'

    inputEl.style.opacity = '0'

    inputEl.addEventListener('change', async (event) => {
      const target = event.target as HTMLInputElement

      const file = target.files?.[0]

      if (file === undefined)
        return

      document.body.removeChild(inputEl)

      const res = await worker.current?.process(file)

      if (res !== undefined) {
        showAlert({
          type: 'success',
          message: `Imported ${res.length} transactions!`,
        })
      }
    })

    document.body.appendChild(inputEl)

    inputEl.click()
  }

  async function handleDBReset() {
    await deleteDB()

    showAlert({ type: 'success', message: 'DB Reset successfully.' })
  }

  return (
    <div class="navbar bg-base-100 shadow min-h-12">
      <h4 class="text-base flex-1">Byoga</h4>

      <div class="flex-none flex gap-0.5 items-center">
        <button class="btn btn-primary btn-sm" onClick={importFile}>
          Import
        </button>

        <button class="btn btn-ghost btn-sm hover:bg-error" onClick={handleDBReset}>
          Reset DB
        </button>
      </div>
    </div>
  )
}
