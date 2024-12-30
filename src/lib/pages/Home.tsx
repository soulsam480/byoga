import { AllTimeMonthlyViz } from '../components/viz/MonthlyStat'
import { SpendingCatoriesViz } from '../components/viz/SpendCategoriesStat'
import { SpendModesViz } from '../components/viz/SpendModesStat'
import { TransactionsTable } from '../components/viz/TransactionsTable'

export function Home() {
  return (
    <div class='flex flex-col gap-6 p-6 w-full'>
      <div class='grid grid-cols-3 gap-6'>
        <div class='col-span-2 flex flex-col gap-6'>
          <AllTimeMonthlyViz />
          <TransactionsTable />
        </div>

        <div className='col-span-1 flex flex-col gap-6'>
          <SpendingCatoriesViz />
          <SpendModesViz />
        </div>
      </div>
    </div>
  )
}
