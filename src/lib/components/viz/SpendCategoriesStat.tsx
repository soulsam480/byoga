import * as R from 'remeda'
import { useComputed } from '@preact/signals'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import type { TransactionModel } from '../../../db/schema'
import { useQuery } from '../../query/useQuery'

export function SpendingCatoriesViz() {
  const { value: categories } = useQuery([`spend_category_volume`], async () => {
    await startDatabase()

    const results = await db
      .selectFrom('transactions')
      .where(eb => eb.and([
        eb('credit', 'is', null),
        eb('transaction_category', 'not in', ['deposit', 'salary']),
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
        [R.prop('total_debit'), 'desc'],
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

  const _dataSet = useComputed(() => {
    return {
      labels: categories.value?.map(it => it[0]) ?? [],
      datasets: [
        {
          values: categories.value?.map(it => it[1]) ?? [],
        },
      ],
    }
  })

  return (
    null
    // <Chart
    //   data={dataSet}
    //   type="donut"
    //   height={450}
    // />
  )
}
