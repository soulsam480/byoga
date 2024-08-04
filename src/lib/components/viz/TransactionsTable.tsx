import { sql } from 'kysely'
import { titleCase } from 'scule'
import { useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import { useQuery } from '../../query/useQuery'
import { dateFormat } from '../../utils/date'
import { currencyFormat } from '../../utils/currency'
import { colorFromSeed } from '../../utils/color'
import type { TStaticRanges } from '../RangePicker'
import { RangePicker, getRangeDisplayValue, withRangeQuery } from '../RangePicker'
import type { TransactionModel } from '../../../db/schema'
import CarbonDotMark from '~icons/carbon/dot-mark'
import CarbonArrowUpRight from '~icons/carbon/arrow-up-right'
import CarbonArrowDownLeft from '~icons/carbon/arrow-down-left'
import CarbonTriangleRightSolid from '~icons/carbon/triangle-right-solid'
import CarbonTriangleLeftSolid from '~icons/carbon/triangle-left-solid'

interface ITransactionRowProps {
  transaction: Pick<TransactionModel, 'id'
  | 'transaction_at'
  | 'credit'
  | 'debit'
  | 'balance'
  | 'transaction_category'
  | 'transaction_mode'
  | 'tags' >
}

function TransactionRow({ transaction }: ITransactionRowProps) {
  return (
    <tr class="row">
      <td class="inline-flex gap-1">
        {transaction.credit === null
          ? <CarbonArrowUpRight class="stroke-2 text-secondary" />
          : <CarbonArrowDownLeft class="stroke-2 text-primary" />}
        {transaction.id}
      </td>

      <td>{dateFormat(transaction.transaction_at).mmmddyyyy()}</td>

      <td>
        {transaction.credit !== null ? currencyFormat.format(transaction.credit) : '-'}
      </td>

      <td>
        {transaction.debit !== null ? currencyFormat.format(transaction.debit) : '-'}
      </td>

      <td>
        <span
          className="tooltip"
          data-tip={transaction.tags.join(', ')}
        >
          <span class="inline-flex gap-1">
            <CarbonDotMark style={`color: ${colorFromSeed(transaction.transaction_category)};`} />
            {titleCase(transaction.transaction_category)}
          </span>
        </span>
      </td>

      <td>
        {titleCase(transaction.transaction_mode).toUpperCase()}
      </td>

      {transaction.balance !== null && (
        <td>{currencyFormat.format(transaction.balance)}</td>
      )}
    </tr>
  )
}

export function TransactionsTable() {
  const page = useSignal(0)

  const range = useSignal<TStaticRanges | [Date, Date]>('last_week')

  useSignalEffect(() => {
    // to subscribe
    const _r = range.value

    page.value = 0
  })

  const { value: transactions } = useQuery(
    () => ['transactions_list', JSON.stringify(range.value), page.value.toString()],
    async () => {
      await startDatabase()

      const _range = range.value
      const _page = page.value

      return await withRangeQuery(db
        .selectFrom('transactions'), _range)
        .select(
          eb => [
            'id',
            'transaction_at',
            'credit',
            'debit',
            'balance',
            'transaction_category',
            'transaction_mode',
            'tags',
            withRangeQuery(eb
              .selectFrom('transactions'), _range)
              .select(_eb => [_eb.fn.count('id').as('transactions_count')])
              .as('transactions_count'),
          ],
        )
        .orderBy(sql`unixepoch(transaction_at)`, 'asc')
        .limit(15)
        .offset(_page * 15)
        .execute()
    },
  )

  const total = useComputed(() => transactions.value?.[0]?.transactions_count ?? 0)

  function handlePagination(dir: 'next' | 'prev' | 'reset') {
    return () => {
      if (dir === 'reset') {
        page.value = 0
      }
      else if (dir === 'next') {
        page.value = page.value + 1
      }
      else if (page.value !== 0) {
        page.value = page.value - 1
      }
    }
  }

  return (
    <div className="border border-base-200 rounded-lg flex flex-col gap-4">
      <div className="font-semibold text-sm px-4 pt-4">
        Transactions
      </div>
      <div className="flex items-center justify-between px-4 relative">
        <div class="text-xs">
          Showing
          {' '}
          {Math.min(Number(total.value), 15)}
          {' '}
          of
          {' '}
          {total}
          {' '}
          transactions
        </div>

        <RangePicker range={range} />

      </div>
      <div class="overflow-x-auto max-h-96">
        <table className="table table-zebra table-xs table-pin-rows">
          {/* head */}
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>
                <span class="inline-flex gap-1">
                  <CarbonArrowDownLeft class="stroke-2 text-primary" />
                  Credit
                </span>
              </th>
              <th>
                <span class="inline-flex gap-1">
                  <CarbonArrowUpRight class="stroke-2 text-secondary" />
                  Debit
                </span>
              </th>
              <th>Category</th>
              <th>Method</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {
              transactions.value?.map((it) => {
                return <TransactionRow transaction={it} key={it.id} />
              })
            }
          </tbody>
        </table>

        {
          !transactions.value?.length && (
            <div class="text-center text-sm py-8">
              No transactions for
              {' '}
              {getRangeDisplayValue(range.value, true)}
            </div>
          )
        }
      </div>

      <div class="flex justify-end py-2 px-4">
        <div className="join">
          <button className="join-item btn btn-outline btn-xs" onClick={handlePagination('prev')}><CarbonTriangleLeftSolid /></button>
          <button
            className="join-item btn btn-primary btn-outline btn-xs"
            onClick={handlePagination('reset')}
          >
            Page
            {page.value + 1}
          </button>
          <button className="join-item btn btn-outline btn-xs" onClick={handlePagination('next')}><CarbonTriangleRightSolid /></button>
        </div>
      </div>
    </div>
  )
}
