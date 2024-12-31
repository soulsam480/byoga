import type { ChartSeriesData } from '@shelacek/plotery'
import type { TransactionModel } from '../../../db/schema'
import type { TStaticRanges } from '../RangePicker'
import { useComputed, useSignal } from '@preact/signals'
import { Chart, LinearAxis, Tooltip } from '@shelacek/plotery'
import * as R from 'remeda'
import { titleCase } from 'scule'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import { useAnimationComp } from '../../hooks/useAnimationComp'
import { useQuery } from '../../query/useQuery'
import { formatCurrency } from '../../utils/currency'
import { ByogaHorizontalBar } from '../plotery/BarLine'
import { ByogaToolTip } from '../plotery/ToolTip'
import { RangePicker, withRangeQuery } from '../RangePicker'

export function SpendingCatoriesViz() {
  const range = useSignal<TStaticRanges | [Date, Date]>('last_month')

  const { value: categories } = useQuery(
    () => ['spend_category_volume', range.value],
    async () => {
      await startDatabase()

      const _range = range.value

      const results = await withRangeQuery(
        db.selectFrom('transactions').where(eb =>
          eb.and([
            eb('credit', 'is', null),
            // @ts-expect-error dunno
            eb('transaction_category', 'not in', ['deposit', 'salary', 'test']),
            eb('transaction_mode', 'not in', ['nach', 'monthly_interest'])
          ])
        ),
        _range
      )
        .select(eb => [
          'transaction_category',
          eb.fn.sum<number>('debit').as('total_debit')
        ])
        .groupBy('transaction_category')
        .execute()

      return R.pipe(
        results,
        R.sortBy([R.prop('total_debit'), 'asc']),
        R.reduce(
          (acc, curr) => {
            acc.push([curr.transaction_category, curr.total_debit])
            return acc
          },
          [] as [TransactionModel['transaction_category'], number][]
        )
      )
    }
  )

  const dataSet = useComputed(() => {
    return {
      labels: categories.value?.map(it => it[0]) ?? [],
      datasets: (categories.value?.map((it, index) => [it[1], index]) ??
        []) as ChartSeriesData
    }
  })

  useAnimationComp('.spend-category-viz', dataSet)

  return (
    <div className='spend-category-viz section spend-categories-viz flex flex-col gap-4'>
      <div className='flex justify-between'>
        <div className='text-sm font-semibold'>Spend Categories</div>

        <RangePicker range={range} />
      </div>

      <Chart data={dataSet.value.datasets} class='h-96'>
        <LinearAxis
          type='y'
          min={0}
          step={1}
          max={dataSet.value.labels.length}
          labels={index => titleCase(dataSet.value.labels[index])}
          major
        />

        <LinearAxis
          type='x'
          min={0}
          max={300000}
          step={50000}
          labels={formatCurrency}
          minor
          major
        />
        <ByogaHorizontalBar base='y' />

        <Tooltip>
          <ByogaToolTip
            renderText={data => {
              if (data[0] === undefined || data[1] === undefined) return ''

              return `${titleCase(dataSet.value.labels[data[1][1]])}: ${formatCurrency(data[1][0])}`
            }}
          />
        </Tooltip>
      </Chart>
    </div>
  )
}
