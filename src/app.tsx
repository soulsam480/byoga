import { $, If, useResource } from 'voby'
import type { CommonData } from 'frappe-charts'
import { Chart } from './lib/components/Chart'
// TODO: use the DB shape when we have it
import type { TTransactionMode } from './workers/lib/transformers/transaction_mode'

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
      {} as Record<TTransactionMode, number>,
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

  return (
    <>
      <label for="file">Choose file</label>
      <input name="file" type="file" onChange={handleFile} />

      <If when={data}>
        {(value) => {
          return <Chart data={value} />
        }}

      </If>

    </>
  )
}
