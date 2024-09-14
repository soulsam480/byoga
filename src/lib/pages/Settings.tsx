import type { ComponentType } from 'preact'
import { useSignal } from '@preact/signals'
import CarbonBox from '~icons/carbon/box'
import CarbonRocket from '~icons/carbon/rocket'
import clsx from 'clsx'
import { titleCase } from 'scule'
import { useStorage } from '../hooks/useStorage'

export const monthlyBudget = useStorage('monthly_budget', 0)
export const monthlyInvestment = useStorage('monthly_investment', 0)

type TSections = 'goals' | 'budget'

const SETTING_SECTIONS: TSections[] = ['budget', 'goals']

const SECTION_TO_ICON: Record<TSections, ComponentType> = {
  goals: CarbonRocket,
  budget: CarbonBox,
}

function GoalSettings() {
  return (
    <div class="flex flex-col gap-4">
      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">Monthly Investment amount?</span>
        </div>
        <input
          value={monthlyInvestment.value}
          onChange={(event) => {
            monthlyInvestment.value = Number(event.currentTarget.value ?? 0)
          }}
          type="number"
          placeholder="Type here"
          className="input input-bordered input-sm w-full"
        />
        <div className="label">
          <span className="label-text-alt">Byoga will recognise investments based on category.</span>
        </div>
      </label>
    </div>
  )
}

function BudgetSettings() {
  return (
    <div class="flex flex-col gap-4">
      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">Monthly budget?</span>
        </div>
        <input
          value={monthlyBudget.value}
          onChange={(event) => {
            monthlyBudget.value = Number(event.currentTarget.value ?? 0)
          }}
          type="number"
          placeholder="e.g. 50000"
          autoComplete="off"
          className="input input-bordered input-sm w-full"
        />
        <div className="label">
          <span className="label-text-alt">This will show up in all charts.</span>
        </div>
      </label>
    </div>
  )
}

export function Settings() {
  const activeSection = useSignal<TSections>('budget')

  return (
    <div class="p-6 w-full">
      <div className="w-full grid grid-cols-7 border-base-200 border lg:w-2/3 mx-auto h-full rounded-lg">
        <div class="col-span-2 border-r border-base-200 p-4 flex flex-col gap-4">
          <div className="text-base font-semibold">
            Settings
          </div>

          <div class="border border-base-200"></div>

          <ul className="menu p-0">
            {
              SETTING_SECTIONS.map((it) => {
                const Icon = SECTION_TO_ICON[it]

                return (
                  <li
                    key={it}
                    onClick={() => {
                      activeSection.value = it
                    }}
                  >
                    <span class={clsx(activeSection.value === it && 'active')}>
                      <Icon />
                      {' '}
                      {titleCase(it)}
                    </span>
                  </li>
                )
              })
            }
          </ul>
        </div>

        <div class="col-span-5 p-4">
          {activeSection.value === 'goals' && <GoalSettings />}
          {activeSection.value === 'budget' && <BudgetSettings />}
        </div>
      </div>

    </div>
  )
}
