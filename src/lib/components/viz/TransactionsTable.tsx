import type { SelectQueryBuilder } from 'kysely'
import { sql } from 'kysely'
import { titleCase } from 'scule'
import type { Signal } from '@preact/signals'
import { useComputed, useSignal, useSignalEffect } from '@preact/signals'
import clsx from 'clsx'
import type { FC } from 'preact/compat'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import { useQuery } from '../../query/useQuery'
import { dateFormat } from '../../utils/date'
import { currencyFormat } from '../../utils/currency'
import { colorFromSeed } from '../../utils/color'
import type { TStaticRanges } from '../RangePicker'
import { RangePicker, getRangeDisplayValue, withRangeQuery } from '../RangePicker'
import type { Database, TransactionModel } from '../../../db/schema'
import { TRANSACTION_CATEGORIES } from '../../../db/lib/constants/categories'
import CarbonDotMark from '~icons/carbon/dot-mark'
import CarbonArrowUpRight from '~icons/carbon/arrow-up-right'
import CarbonArrowDownLeft from '~icons/carbon/arrow-down-left'
import CarbonTriangleRightSolid from '~icons/carbon/triangle-right-solid'
import CarbonTriangleLeftSolid from '~icons/carbon/triangle-left-solid'
import CarbonCheckmarkFilled from '~icons/carbon/checkmark-filled'
import CarbonSortAscending from '~icons/carbon/sort-ascending'
import CarbonSortDescending from '~icons/carbon/sort-descending'
import CarbonCloseFilled from '~icons/carbon/close-filled'

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

interface ITransactionCategoryProps {
  category: TransactionModel['transaction_category']
  checked?: boolean
}

function TransactionCategory({ category, checked }: ITransactionCategoryProps) {
  return (
    <span class="inline-flex gap-1">
      <CarbonDotMark style={`color: ${colorFromSeed(category)};`} />
      {titleCase(category)}
      {
        checked && (
          <CarbonCheckmarkFilled class="ml-auto text-[10px]" />
        )
      }
    </span>
  )
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
          <TransactionCategory category={transaction.transaction_category} />
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

interface IChooseCategoriesDropdownProps {
  categories: Signal<TransactionModel['transaction_category'][]>
}

function ChooseCategoriesDropdown({ categories }: IChooseCategoriesDropdownProps) {
  function handleCategorySelection(cat: TransactionModel['transaction_category']) {
    if (categories.value.includes(cat)) {
      categories.value = categories.value.filter(it => it !== cat)
    }
    else {
      categories.value = [...categories.value, cat]
    }
  }

  return (
    <div className="dropdown dropdown-bottom">
      <div
        tabIndex={0}
        role="button"
        className={clsx(
          'text-xs cursor-pointer flex gap-1 items-center',
        )}
      >
        {
          categories.value.length === 0
            ? 'Choose category'
            : (
                <>
                  <TransactionCategory category={categories.value[0]} />
                  {
                    categories.value.length > 1 && (
                      <span>
                        +
                        {categories.value.length - 1}
                        {' '}
                        more
                      </span>
                    )
                  }
                </>
              )
        }
      </div>
      <ul tabIndex={0} className="dropdown-content menu menu-xs bg-base-100 rounded-box z-10 w-96 h-52 overflow-y-scroll p-2 shadow">
        {
          TRANSACTION_CATEGORIES.map((cat) => {
            return (
              <li key={cat} onClick={() => handleCategorySelection(cat)}>
                <TransactionCategory
                  category={cat}
                  checked={categories.value.includes(cat)}
                />
              </li>
            )
          })
        }

        <li
          class="mt-auto"
          onClick={() => {
            categories.value = []
          }}
        >
          <span>
            <CarbonCloseFilled />
            Clear
          </span>
        </li>
      </ul>
    </div>
  )
}

type TOrderDirection = 'asc' | 'desc'

interface IOrderDropdownProps {
  order: Signal<TOrderDirection>
}

const ORDER_TO_ICON_MAP: Record<TOrderDirection, FC> = {
  asc: CarbonSortAscending,
  desc: CarbonSortDescending,
}

const ORDER_TO_LABEL: Record<TOrderDirection, string> = {
  asc: 'Ascending',
  desc: 'Descending',
}

function OrderDropdown({ order }: IOrderDropdownProps) {
  const CurrentIcon = useComputed(() => ORDER_TO_ICON_MAP[order.value])

  return (
    <div className="dropdown dropdown-bottom">
      <div
        tabIndex={0}
        role="button"
        className={clsx(
          'text-xs cursor-pointer flex gap-2',
        )}
      >
        <CurrentIcon.value />
        <span>
          {ORDER_TO_LABEL[order.value]}
        </span>
      </div>
      <ul tabIndex={0} className="dropdown-content menu menu-xs bg-base-100 rounded-box z-10 w-32 overflow-y-scroll p-2 shadow">
        <li
          onClick={() => { order.value = 'asc' }}
        >
          <span class={clsx({ active: order.value === 'asc' })}>
            <ORDER_TO_ICON_MAP.asc />
            {ORDER_TO_LABEL.asc}
          </span>
        </li>
        <li onClick={() => { order.value = 'desc' }}>
          <span class={clsx({ active: order.value === 'desc' })}>
            <ORDER_TO_ICON_MAP.desc />
            {ORDER_TO_LABEL.desc}
          </span>
        </li>
      </ul>
    </div>
  )
}

export function withCategoryQuery<Q extends SelectQueryBuilder<Database, 'transactions', object>>(qb: Q, categories: TransactionModel['transaction_category'][]) {
  if (categories.length === 0) {
    return qb
  }

  return qb.where('transaction_category', 'in', categories)
}

export function TransactionsTable() {
  const page = useSignal(0)

  const range = useSignal<TStaticRanges | [Date, Date]>('last_week')
  const categories = useSignal<TransactionModel['transaction_category'][]>([])
  const order = useSignal<TOrderDirection>('desc')

  useSignalEffect(() => {
    // to subscribe
    const _r = range.value

    page.value = 0
  })

  const { value: transactions } = useQuery(
    () => ['transactions_list', JSON.stringify(range.value), JSON.stringify(categories.value), order.value, page.value.toString()],
    async () => {
      await startDatabase()

      const _range = range.value
      const _page = page.value
      const _categories = categories.value
      const _order = order.value

      const query = withCategoryQuery(
        withRangeQuery(db.selectFrom('transactions'), _range),
        _categories,
      )
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
            withCategoryQuery(
              withRangeQuery(eb
                .selectFrom('transactions'), _range),
              _categories,
            )
              .select(_eb => [_eb.fn.count('id').as('transactions_count')])
              .as('transactions_count'),
          ],
        )
        .orderBy(sql`unixepoch(transaction_at)`, _order)
        .limit(15)
        .offset(_page * 15)

      return await query.execute()
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
        <div class="flex items-center gap-2 group">
          <div class="text-xs">
            <span class="hover-emphasis">
              Showing
            </span>
            {' '}
            {Math.min(Math.min(Number(total.value), transactions.value?.length ?? 0), 15)}
            {' '}
            <span class="hover-emphasis">
              from
            </span>
            {' '}
            {total}
            {' '}
            transactions
            {' '}
            <span class="hover-emphasis">
              of
            </span>
          </div>
          <ChooseCategoriesDropdown categories={categories} />
          <div class="text-xs">
            {' '}
            <span class="hover-emphasis">
              in
            </span>
            {' '}
          </div>
          <OrderDropdown order={order} />
          <div class="text-xs hover-emphasis">
            order
          </div>
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
            {' '}
            {page.value + 1}
          </button>
          <button className="join-item btn btn-outline btn-xs" onClick={handlePagination('next')}><CarbonTriangleRightSolid /></button>
        </div>
      </div>
    </div>
  )
}
