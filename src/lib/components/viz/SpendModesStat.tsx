import * as R from 'remeda'
import { useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { Chart, type ChartSeriesData, LinearAxis } from '@shelacek/plotery'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import { useQuery } from '../../query/useQuery'
import type { TransactionModel } from '../../../db/schema'
import { currencyFormat } from '../../utils/currency'
import { ByogaHorizontalBar } from '../plotery/BarLine'
import type { TStaticRanges } from '../RangePicker'
import { RangePicker } from '../RangePicker'

export function SpendModesViz() {
  const range = useSignal<TStaticRanges | [Date, Date]>('last_week')

  const { value: modes } = useQuery(
    () => ['spend_mode_volume', JSON.stringify(range.value)],
    async () => {
      await startDatabase()

      const _range = range.value

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
            'transaction_mode',
            eb.fn.sum<number>('debit').as('total_debit'),
          ])
        .groupBy('transaction_mode')
        .execute()

      return R.pipe(
        results,
        R.sortBy(
          [R.prop('total_debit'), 'asc'],
        ),
        R.reduce((acc, curr) => {
          acc.push([
            curr.transaction_mode,
            curr.total_debit,
          ])
          return acc
        }, [] as [TransactionModel['transaction_mode'], number][]),
      )
    },
  )

  const dataSet = useComputed(() => {
    return {
      labels: modes.value?.map(it => it[0]) ?? [],
      datasets: (modes.value?.map((it, index) => [it[1], index]) ?? []) as ChartSeriesData,
    }
  })

  useSignalEffect(() => {
    const _d = dataSet.value

    setTimeout(() => {
      document
        .querySelectorAll('.spend-modes-viz .plot.cartesian.bar path')
        .forEach((el) => {
          el.classList.remove('bar-animation')

          window.setTimeout(() => {
            el.classList.add('bar-animation')
          })
        })
    })
  })

  return (
    <div className="spend-modes-viz border border-base-200 rounded-lg p-4 spend-modes-viz flex flex-col gap-4">
      <div className="text-sm font-semibold">
        Spend Transaction mediums
      </div>

      <div className="flex justify-end">
        <RangePicker range={range} />
      </div>

      <Chart data={dataSet.value.datasets} class="h-60">
        <LinearAxis
          type="y"
          min={0}
          step={1}
          max={dataSet.value.labels.length}
          labels={index => (dataSet.value.labels[index])?.toUpperCase()}
          major
        />

        <LinearAxis
          type="x"
          min={0}
          max={1000000}
          step={100000}
          labels={value => currencyFormat.format(value)}
          minor
          major
        />
        <ByogaHorizontalBar base="y" />
      </Chart>
    </div>
  )
}
