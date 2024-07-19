import { Navbar } from './lib/components/Navbar'
import { Alerts } from './lib/components/Alerts'
import { CategoryTransactionVolume } from './lib/components/Categories'
import { TransactionModeVolume } from './lib/components/Modes'

// TODO: next steps for UI ?
// // 1. file input
// // 2. logging processed value from worker
// // 3. putting data on a chart
// // 4. chart re-rendering

export function App(): JSX.Element {
  return (
    <>
      <Alerts />
      <Navbar />

      <div class="grid grid-cols-1 lg:grid-cols-2">
        <CategoryTransactionVolume type="debit" />
        <CategoryTransactionVolume type="credit" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2">
        <TransactionModeVolume type="debit" />
        <TransactionModeVolume type="credit" />
      </div>
    </>
  )
}
