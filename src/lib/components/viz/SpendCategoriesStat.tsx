import * as R from 'remeda'
import { useComputed } from '@preact/signals'
import type { ChartSeriesData } from '@shelacek/plotery'
import { Chart, LinearAxis } from '@shelacek/plotery'
import { titleCase } from 'scule'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import type { TransactionModel } from '../../../db/schema'
import { useQuery } from '../../query/useQuery'
import { currencyFormat } from '../../utils/currency'
import { ByogaHorizontalBar } from '../plotery/BarLine'

export function SpendingCatoriesViz() {
  const { value: categories } = useQuery([`spend_category_volume`], async () => {
    await startDatabase()

    const results = await db
      .selectFrom('transactions')
      .where(eb => eb.and([
        eb('credit', 'is', null),
        // @ts-expect-error dunno
        eb('transaction_category', 'not in', ['deposit', 'salary', 'test']),
        eb('transaction_mode', 'not in', ['nach', 'monthly_interest']),
      ]))
      .select(eb =>
        [
          'transaction_category',
          eb.fn.sum<number>('debit').as('total_debit'),
        ])
      .groupBy('transaction_category')
      .execute()

    return R.pipe(
      results,
      R.sortBy(
        [R.prop('total_debit'), 'asc'],
      ),
      R.reduce((acc, curr) => {
        acc.push([
          curr.transaction_category,
          curr.total_debit,
        ])
        return acc
      }, [] as [TransactionModel['transaction_category'], number][]),
    )
  })

  const dataSet = useComputed(() => {
    return {
      labels: categories.value?.map(it => it[0]) ?? [],
      datasets: (categories.value?.map((it, index) => [it[1], index]) ?? []) as ChartSeriesData,
    }
  })

  return (
    <div className="border border-base-200 rounded-lg p-4 spend-categories-viz flex flex-col gap-4">
      <div className="text-sm font-semibold">
        Spend Categories
      </div>

      <Chart data={dataSet.value.datasets} class="h-96">
        <LinearAxis
          type="y"
          min={0}
          step={1}
          max={dataSet.value.labels.length}
          labels={index => titleCase(dataSet.value.labels[index])}
          major
        />

        <LinearAxis
          type="x"
          min={0}
          max={200000}
          step={50000}
          labels={value => currencyFormat.format(value)}
          minor
          major
        />
        <ByogaHorizontalBar base="y" />
      </Chart>
    </div>
  )
}
