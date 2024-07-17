import { Navbar } from './lib/components/Navbar'
import { Alerts } from './lib/components/Alerts'

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
    </>
  )
}
