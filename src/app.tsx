import { Navbar } from './lib/components/Navbar'
import { Alerts } from './lib/components/Alerts'
import { AllTimeMonthlyViz } from './lib/components/viz/MonthlyStat'
import { SpendingCatoriesViz } from './lib/components/viz/SpendCategoriesStat'
import { TransactionsTable } from './lib/components/viz/TransactionsTable'
import { SpendModesViz } from './lib/components/viz/SpendModesStat'

// TODO: next steps for UI ?
// // 1. file input
// // 2. logging processed value from worker
// // 3. putting data on a chart
// // 4. chart re-rendering

export function App() {
  return (
    <main>
      <Alerts />
      <Navbar />

      <div class="flex flex-col gap-6 p-6">
        <div class="grid grid-cols-3 gap-6">

          <div class="col-span-2 flex flex-col gap-6">
            {/* <LastMonthDigest /> */}
            <AllTimeMonthlyViz />
            <TransactionsTable />
          </div>

          <div className="col-span-1 flex flex-col gap-6">
            <SpendingCatoriesViz />
            <SpendModesViz />
          </div>
        </div>

      </div>
    </main>
  )
}
