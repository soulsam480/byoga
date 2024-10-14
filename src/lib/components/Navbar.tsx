import clsx from 'clsx'
import { endpointSymbol } from 'vite-plugin-comlink/symbol'
import { db, deleteDB } from '../../db/client'
import { useRouter } from '../hooks/useRouter'
import { invalidateQuery } from '../query/useQuery'
import { logger } from '../utils/logger'
import { showAlert } from './Alerts'
import { HelpModal } from './HelpModal'
import CarbonSettings from '~icons/carbon/settings'
import CarbonReset from '~icons/carbon/reset'
import CarbonHelpFilled from '~icons/carbon/help-filled'
import CarbonDocumentImport from '~icons/carbon/document-import'
import CarbonChartArea from '~icons/carbon/chart-area'

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
    <div class="flex flex-col items-center py-4 bg-base-100 shadow w-14 max-w-14 gap-4">
      <img src="/pwa-192x192.png" height={32} width={32} />

      <h4 class="text-xs font-semibold">Byoga</h4>

      <div class="border-b border-base-300 w-full"></div>

      <div className="tooltip tooltip-accent tooltip-right" data-tip="Home">
        <a href="#home" type="button" class={clsx('btn btn-sm btn-circle', router.page.value === 'home' ? 'btn-accent btn-active' : 'btn-outline')}>
          <CarbonChartArea />
        </a>
      </div>

      <div className="tooltip tooltip-accent tooltip-right" data-tip="Settings">
        <a href="#settings" type="button" class={clsx('btn btn-sm btn-circle', router.page.value === 'settings' ? 'btn-accent btn-active' : 'btn-outline')}>
          <CarbonSettings />
        </a>
      </div>

      <div class="flex flex-col gap-4 items-center mt-auto">
        <div className="tooltip tooltip-primary tooltip-right" data-tip="Help">
          <button
            type="button"
            class="btn btn-primary btn-sm btn-circle"
            onClick={() => {
              document.querySelector<HTMLDialogElement>('#help_modal')?.showModal()
            }}
          >
            <CarbonHelpFilled />
          </button>

        </div>

        <div className="tooltip tooltip-primary tooltip-right" data-tip="Import Statement">
          <button type="button" class="btn btn-primary btn-sm btn-circle" onClick={importFile}>
            <CarbonDocumentImport />
          </button>
        </div>

        <div className="tooltip tooltip-error tooltip-right" data-tip="Reset Database">
          <button type="button" class="btn btn-error btn-outline btn-sm btn-circle" onClick={handleDBReset}>
            <CarbonReset />
          </button>
        </div>
      </div>

      <HelpModal />
    </div>
  )
}
