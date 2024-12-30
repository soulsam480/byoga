import type { TransactionModel } from '../../db/schema'
import { useComputed } from '@preact/signals'
import * as R from 'remeda'
import { db } from '../../db/client'
import { startDatabase } from '../../db/lib/migrator'
import { useQuery } from '../query/useQuery'

interface ITransactionModeProps {
  type: 'credit' | 'debit'
}

export function TransactionModeVolume({ type }: ITransactionModeProps) {
  const { value: categories } = useQuery([`${type}_mode_volume`], async () => {
    await startDatabase()

    const results = await db
      .selectFrom('transactions')
      .where(type === 'credit' ? 'debit' : 'credit', 'is', null)
      .select(eb => [
        'transaction_mode',
        eb.fn.sum<number>('credit').as('total_credit'),
        eb.fn.sum<number>('debit').as('total_debit')
      ])
      .groupBy('transaction_mode')
      .execute()

    return R.pipe(
      results,
      R.sortBy([
        type === 'credit' ? R.prop('total_credit') : R.prop('total_debit'),
        'desc'
      ]),
      R.reduce(
        (acc, curr) => {
          acc.push([
            curr.transaction_mode,
            type === 'credit' ? curr.total_credit : curr.total_debit
          ])
          return acc
        },
        [] as [TransactionModel['transaction_mode'], number][]
      )
    )
  })

  const _dataSet = useComputed(() => {
    return {
      labels: categories.value?.map(it => it[0]) ?? [],
      datasets: [
        {
          name: 'Total amount in rupees.',
          chartType: 'bar',
          values: categories.value?.map(it => it[1]) ?? []
        }
      ]
    }
  })

  return null
}
