import type { ComponentType, JSX } from 'preact'
import { useStorage } from '../hooks/useStorage'
import CarbonBox from '~icons/carbon/box'
import CarbonRocket from '~icons/carbon/rocket'

export const monthlyBudget = useStorage('monthly_budget', 0)
export const monthlyInvestment = useStorage('monthly_investment', 0)

type TSections = 'investment' | 'expense'

const SECTION_TO_ICON: Record<TSections, ComponentType<JSX.SVGAttributes<SVGSVGElement>>> = {
  investment: CarbonRocket,
  expense: CarbonBox,
}

export function Settings() {
  return (
    <div class="p-6 w-full">
      <div className="w-full border-base-200 border lg:w-2/3 mx-auto h-full rounded-lg">
        <div className="text-base font-semibold p-4">
          Settings
        </div>

        <div class="border border-base-200"></div>

        <div class="flex flex-col p-4">
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text inline-flex gap-2">
                <SECTION_TO_ICON.expense className="text-expense" />
                {' '}
                Monthly expense?
              </span>
            </div>
            <input
              value={monthlyBudget.value}
              onChange={(event) => {
                monthlyBudget.value = Number(event.currentTarget.value ?? 0)
              }}
              type="number"
              placeholder="e.g. 50000"
              autoComplete="off"
              className="input input-bordered input-sm w-full max-w-sm"
            />
            <div className="label">
              <span className="label-text-alt">This will show up in all charts.</span>
            </div>
          </label>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text inline-flex gap-2">
                <SECTION_TO_ICON.investment className="text-investment" />
                {' '}
                Monthly Investment amount?
              </span>
            </div>
            <input
              value={monthlyInvestment.value}
              onChange={(event) => {
                monthlyInvestment.value = Number(event.currentTarget.value ?? 0)
              }}
              type="number"
              placeholder="Type here"
              className="input input-bordered input-sm w-full max-w-sm"
            />
            <div className="label">
              <span className="label-text-alt">Byoga will recognise investments based on category.</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
