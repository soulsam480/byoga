import { Navbar } from './lib/components/Navbar'
import { Alerts } from './lib/components/Alerts'
import { AllTimeMonthlyViz, LastMonthDigest } from './lib/components/viz/MonthlyStat'
import { SpendingCatoriesViz } from './lib/components/viz/SpendCategoriesStat'

// TODO: next steps for UI ?
// // 1. file input
// // 2. logging processed value from worker
// // 3. putting data on a chart
// // 4. chart re-rendering

export function App() {
  return (
    <>
      <Alerts />
      <Navbar />
      <div class="grid grid-cols-3 gap-6 p-6">

        <div class="col-span-2 flex flex-col gap-6">

          <LastMonthDigest />

          <AllTimeMonthlyViz />
        </div>

        {/* <TransactionsTable /> */}

        <div className="col-span-1">
          <SpendingCatoriesViz />
        </div>
      </div>
    </>
  )
}
