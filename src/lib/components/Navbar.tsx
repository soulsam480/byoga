import CarbonChartArea from '~icons/carbon/chart-area'
import CarbonDocumentImport from '~icons/carbon/document-import'
import CarbonReset from '~icons/carbon/reset'
import CarbonSettings from '~icons/carbon/settings'
import clsx from 'clsx'
import { endpointSymbol } from 'vite-plugin-comlink/symbol'
import { db, deleteDB } from '../../db/client'
import { useRouter } from '../hooks/useRouter'
import { invalidateQuery } from '../query/useQuery'
import { logger } from '../utils/logger'
import { showAlert } from './Alerts'

async function importFile() {
  const worker = new ComlinkWorker<
          typeof import('../../workers/xlsx.worker')
  >(new URL('../../workers/xlsx.worker', import.meta.url), { type: 'module' })

  const inputEl = document.createElement('input')

  inputEl.type = 'file'
  inputEl.accept = '.xlsx'

  inputEl.style.opacity = '0'

  inputEl.addEventListener('cancel', async () => {
    document.body.removeChild(inputEl)
  })

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

export function Navbar() {
  const router = useRouter()

  return (
    <div class="flex flex-col items-center py-4 bg-base-100 shadow w-14 max-w-14 overflow-x-hidden gap-4">
      <img src="/pwa-192x192.png" height={32} width={32} />

      <h4 class="text-sm -mt-2">Byoga</h4>

      <button type="button" class={clsx('btn btn-sm btn-circle', router.page.value === 'home' ? 'btn-outline btn-accent' : 'btn-ghost')}>
        <a href="#home">
          <CarbonChartArea />
        </a>
      </button>

      <button type="button" class={clsx('btn btn-sm btn-circle', router.page.value === 'settings' ? 'btn-outline btn-accent' : 'btn-ghost')}>
        <a href="#settings">
          <CarbonSettings />
        </a>
      </button>

      <div class="flex flex-col gap-4 items-center mt-auto">
        <button type="button" class="btn btn-primary btn-sm btn-circle" onClick={importFile}>
          <CarbonDocumentImport />
        </button>

        <button type="button" class="btn btn-error btn-sm btn-circle" onClick={handleDBReset}>
          <CarbonReset />
        </button>
      </div>
    </div>
  )
}
