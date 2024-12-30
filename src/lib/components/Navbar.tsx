import { FileImportModal } from '@/lib/components/FileImportModal'
import type { TSupportedBanks } from '@/parser/banks/supported'
import { Feeder } from '@/parser/lib/Feeder'
import clsx from 'clsx'
import { endpointSymbol } from 'vite-plugin-comlink/symbol'
import CarbonChartArea from '~icons/carbon/chart-area'
import CarbonDocumentImport from '~icons/carbon/document-import'
import CarbonHelpFilled from '~icons/carbon/help-filled'
import CarbonReset from '~icons/carbon/reset'
import CarbonSettings from '~icons/carbon/settings'
import { deleteDB } from '../../db/client'
import { useRouter } from '../hooks/useRouter'
import { invalidateQuery } from '../query/useQuery'
import { showAlert } from './Alerts'
import { HelpModal } from './HelpModal'

async function importFile(event: SubmitEvent) {
  const worker = new ComlinkWorker<typeof import('../../workers/xlsx.worker')>(
    new URL('../../workers/xlsx.worker', import.meta.url),
    { type: 'module' }
  )

  const formData = new FormData(event.target as HTMLFormElement)

  const file = formData.get('files')

  if (file === null) return

  const transactions = await worker.getTransactionRows(
    file as File,
    (formData.get('bank') as TSupportedBanks) ?? 'idfc'
  )

  const feeder = new Feeder()

  await feeder.feed(transactions)

  worker[endpointSymbol].terminate()
  document.querySelector<HTMLDialogElement>('#file_import_modal')?.close()
}

async function handleDBReset() {
  await deleteDB()

  showAlert({ type: 'success', message: 'DB Reset successfully.' })

  void invalidateQuery('*')
}

export function Navbar() {
  const router = useRouter()

  return (
    <div class='flex flex-col items-center py-4 bg-base-100 shadow w-14 max-w-14 gap-4'>
      <img src='/pwa-192x192.png' height={32} width={32} alt='logo' />

      <h4 class='text-xs font-semibold'>Byoga</h4>

      <div class='border-b border-base-300 w-full' />

      <div className='tooltip tooltip-accent tooltip-right' data-tip='Home'>
        <a
          href='#home'
          type='button'
          class={clsx(
            'btn btn-sm btn-circle',
            router.page.value === 'home'
              ? 'btn-accent btn-active'
              : 'btn-outline'
          )}
        >
          <CarbonChartArea />
        </a>
      </div>

      <div className='tooltip tooltip-accent tooltip-right' data-tip='Settings'>
        <a
          href='#settings'
          type='button'
          class={clsx(
            'btn btn-sm btn-circle',
            router.page.value === 'settings'
              ? 'btn-accent btn-active'
              : 'btn-outline'
          )}
        >
          <CarbonSettings />
        </a>
      </div>

      <div class='flex flex-col gap-4 items-center mt-auto'>
        <div className='tooltip tooltip-primary tooltip-right' data-tip='Help'>
          <button
            type='button'
            class='btn btn-primary btn-sm btn-circle'
            onClick={() => {
              document
                .querySelector<HTMLDialogElement>('#help_modal')
                ?.showModal()
            }}
          >
            <CarbonHelpFilled />
          </button>
        </div>

        <div
          className='tooltip tooltip-primary tooltip-right'
          data-tip='Import Statement'
        >
          <button
            type='button'
            class='btn btn-primary btn-sm btn-circle'
            onClick={() => {
              document
                .querySelector<HTMLDialogElement>('#file_import_modal')
                ?.showModal()
            }}
          >
            <CarbonDocumentImport />
          </button>
        </div>

        <div
          className='tooltip tooltip-error tooltip-right'
          data-tip='Reset Database'
        >
          <button
            type='button'
            class='btn btn-error btn-outline btn-sm btn-circle'
            onClick={handleDBReset}
          >
            <CarbonReset />
          </button>
        </div>
      </div>

      <HelpModal />
      <FileImportModal onSubmit={importFile} />
    </div>
  )
}
