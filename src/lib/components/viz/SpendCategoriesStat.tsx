import * as R from 'remeda'
import { useComputed, useSignal, useSignalEffect } from '@preact/signals'
import type { ChartSeriesData } from '@shelacek/plotery'
import { Chart, LinearAxis } from '@shelacek/plotery'
import { titleCase } from 'scule'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import type { TransactionModel } from '../../../db/schema'
import { useQuery } from '../../query/useQuery'
import { currencyFormat } from '../../utils/currency'
import { ByogaHorizontalBar } from '../plotery/BarLine'
import type { TStaticRanges } from '../RangePicker'
import { RangePicker, withRangeQuery } from '../RangePicker'

export function SpendingCatoriesViz() {
  const range = useSignal<TStaticRanges | [Date, Date]>('last_month')

  const { value: categories } = useQuery(
    () => ['spend_category_volume', JSON.stringify(range.value)],
    async () => {
      await startDatabase()

      const _range = range.value

      const results = await withRangeQuery(db
        .selectFrom('transactions')
        .where(eb => eb.and([
          eb('credit', 'is', null),
          // @ts-expect-error dunno
          eb('transaction_category', 'not in', ['deposit', 'salary', 'test']),
          eb('transaction_mode', 'not in', ['nach', 'monthly_interest']),
        ])), _range)
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
    },
  )

  const dataSet = useComputed(() => {
    return {
      labels: categories.value?.map(it => it[0]) ?? [],
      datasets: (categories.value?.map((it, index) => [it[1], index]) ?? []) as ChartSeriesData,
    }
  })

  useSignalEffect(() => {
    const _d = dataSet.value

    setTimeout(() => {
      document
        .querySelectorAll('.spend-category-viz .plot.cartesian.bar path')
        .forEach((el) => {
          el.classList.remove('bar-animation')

          window.setTimeout(() => {
            el.classList.add('bar-animation')
          })
        })
    })
  })

  return (
    <div className="spend-category-viz border border-base-200 rounded-lg p-4 spend-categories-viz flex flex-col gap-4">
      <div className="text-sm font-semibold">
        Spend Categories
      </div>

      <div className="flex justify-end">
        <RangePicker range={range} />
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
          max={300000}
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
