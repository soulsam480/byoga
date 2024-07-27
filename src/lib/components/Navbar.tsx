import { endpointSymbol } from 'vite-plugin-comlink/symbol'
import { db, deleteDB } from '../../db/client'
import { logger } from '../utils/logger'
import { invalidateQuery } from '../query/useQuery'
import { showAlert } from './Alerts'

export function Navbar() {
  async function importFile() {
    const worker = new ComlinkWorker<
          typeof import('../../workers/xlsx.worker')
    >(new URL('../../workers/xlsx.worker', import.meta.url), { type: 'module' })

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

      const transactions = await worker.process(file)

      if (transactions !== undefined) {
        showAlert({
          type: 'info',
          message: `Started importing ${transactions.length} transactions!`,
        })

        logger.info(`[IMPORT]: started importing ${transactions.length} transactions.`)

        await db.transaction().execute(async (trx) => {
          for (const transaction of transactions) {
            await trx
              .insertInto('transactions')
              .values(transaction)
              .onConflict(qb =>
                qb.column('transaction_ref').doNothing(),
              )
              .returning('id')
              .execute()
          }
        })

        logger.info(`[IMPORT]: Done importing ${transactions.length} transactions.`)

        showAlert({
          type: 'success',
          message: `Imported ${transactions.length} transactions!`,
        })

        void invalidateQuery('*')
      }

      worker[endpointSymbol].terminate()
    })

    document.body.appendChild(inputEl)

    inputEl.click()
  }

  async function handleDBReset() {
    await deleteDB()

    showAlert({ type: 'success', message: 'DB Reset successfully.' })

    void invalidateQuery('*')
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
