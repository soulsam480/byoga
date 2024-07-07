import { $, If, useResource } from 'voby'
import type { CommonData } from 'frappe-charts'
import { Chart } from './lib/components/Chart'
import { db, deleteDB } from './db/client'
import { logger } from './lib/utils/logger'
import type { TransactionModel } from './db/table'

// TODO: next steps for UI ?
// // 1. file input
// // 2. logging processed value from worker
// // 3. putting data on a chart
// // 4. chart re-rendering

const RemoteExcel = new ComlinkWorker<
  typeof import('./workers/xlsx.worker')
>(new URL('./workers/xlsx.worker', import.meta.url))

export function App(): JSX.Element {
  const worker = useResource(async () => await new RemoteExcel.ExcelWorker())

  const data = $<CommonData | null>(null)

  async function handleFile(event: Event) {
    const target = event.target as HTMLInputElement

    const file = target.files?.[0]

    if (file === undefined)
      return

    const result = (await worker().value?.process(file)) ?? []

    const grouped = result.reduce(
      (acc, curr) => {
        acc[curr.transaction_mode]
            = acc[curr.transaction_mode] === undefined ? 1 : acc[curr.transaction_mode] + 1

        return acc
      },
      {} as Record<TransactionModel['transaction_mode'], number>,
    )

    data({
      labels: Object.keys(grouped),
      datasets: [
        {
          values: Object.values(grouped),
        },
      ],
    })
  }

  async function handleCount() {
    const res = await db.selectFrom('transactions').select(['transaction_ref']).execute()

    logger.info('Query results.', res)
  }

  return (
    <>

      <label for="file">Choose file</label>
      <input name="file" type="file" onChange={handleFile} />

      <If when={data}>
        {(value) => {
          return <Chart data={value} />
        }}

      </If>

      <button onClick={deleteDB}>
        Drop
      </button>

      <button onClick={handleCount}>
        Query. Check console
      </button>
    </>
  )
}
