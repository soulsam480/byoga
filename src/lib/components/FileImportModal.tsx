import { SUPPORTED_BANKS } from '@/parser/banks/supported'
import { titleCase } from 'scule'
import CarbonCloseOutline from '~icons/carbon/close-outline'

interface IFileImportModalProps {
  onSubmit: (e: SubmitEvent) => void
}

export function FileImportModal({ onSubmit }: IFileImportModalProps) {
  return (
    <dialog id='file_import_modal' className='modal'>
      <div className='modal-box overflow-hidden flex flex-col gap-2 items-start'>
        <form method='dialog'>
          <button
            type='button'
            className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'
          >
            <CarbonCloseOutline />
          </button>
        </form>

        <h3 className='font-bold text-base'>Import Bank Statement</h3>
        <div className='text-xs text-neutral'>
          Choose a bank and import a statement, different bank statements can be
          mixed, as all of them emit single type of transaction data after
          processing
        </div>

        <form
          onSubmit={e => {
            e.preventDefault()
            e.stopPropagation()

            onSubmit(e)
          }}
          class='max-h-[500px] flex flex-col overflow-y-scroll w-full overflow-x-visible p-1'
        >
          <label className='form-control w-full'>
            <div className='label'>
              <span className='label-text'>Pick a bank</span>
            </div>
            <select
              required
              name='bank'
              className='select select-bordered select-sm'
            >
              {SUPPORTED_BANKS.map(it => {
                return (
                  <option key={it} value={it}>
                    {titleCase(it)}
                  </option>
                )
              })}
            </select>
          </label>

          <label className='form-control w-full'>
            <div className='label'>
              <span className='label-text'>Pick bank statement</span>
            </div>
            <input
              required
              accept='.xlsx'
              multiple={false}
              type='file'
              className='file-input file-input-sm file-input-bordered w-full'
              name='files'
            />
          </label>

          <button class='mt-4 btn btn-neutral btn-block btn-sm' type='submit'>
            Add
          </button>
        </form>
      </div>
    </dialog>
  )
}
