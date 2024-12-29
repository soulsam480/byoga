import { titleCase } from 'scule'
import CarbonCloseOutline from '~icons/carbon/close-outline'
import CarbonDotMark from '~icons/carbon/dot-mark'
import { TRANSACTION_CATEGORIES } from '../../db/lib/constants/categories'
import { colorFromSeed } from '../utils/color'

export function HelpModal() {
  return (
    <dialog id="help_modal" className="modal">
      <div className="modal-box overflow-hidden flex flex-col gap-2 items-start">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            <CarbonCloseOutline />
          </button>
        </form>

        <h3 className="font-bold text-base">Legend</h3>
        <div className="text-xs text-neutral">
          Everything in Byoga follows a color code. Data points including categories, settings, etc. correspond to a unique color. This is done to make reading
          and analysing data easier.
        </div>

        <div class="max-h-[500px] flex flex-col gap-2 overflow-y-scroll w-full">

          <div class="text-sm">
            Base
          </div>

          <span class="inline-flex items-center gap-1 text-xs">
            <CarbonDotMark style="color: var(--credit);" />
            Credit
          </span>

          <span class="inline-flex items-center gap-1 text-xs">
            <CarbonDotMark style="color: var(--debit);" />
            Debit
          </span>

          <span class="inline-flex items-center gap-1 text-xs">
            <CarbonDotMark style="color: var(--balance);" />
            Balance
          </span>

          <span class="inline-flex items-center gap-1 text-xs">
            <CarbonDotMark style={`color: ${colorFromSeed('expense')};`} />
            Expense
          </span>

          <span class="inline-flex items-center gap-1 text-xs">
            <CarbonDotMark style={`color: ${colorFromSeed('investment')};`} />
            Investment
          </span>

          <div class="text-sm">
            Categories
          </div>
          {
            TRANSACTION_CATEGORIES.map((category) => {
              return (
                <span class="inline-flex items-center gap-1 text-xs" key={category}>
                  <CarbonDotMark style={`color: ${colorFromSeed(category)};`} />
                  {titleCase(category)}
                </span>
              )
            })
          }
        </div>
      </div>
    </dialog>
  )
}
