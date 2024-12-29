import type { Signal } from '@preact/signals'
import type { SelectQueryBuilder } from 'kysely'
import type { FC } from 'preact/compat'
import type { UnknownRecord } from 'type-fest'
import type { TransactionModel } from '../../../db/schema'
import type { TStaticRanges } from '../RangePicker'
import { useComputed, useSignal, useSignalEffect } from '@preact/signals'
import clsx from 'clsx'
import { sql } from 'kysely'
import { jsonObjectFrom } from 'kysely/helpers/sqlite'
import { titleCase } from 'scule'
import CarbonArrowDownLeft from '~icons/carbon/arrow-down-left'
import CarbonArrowUpRight from '~icons/carbon/arrow-up-right'
import CarbonCheckmarkFilled from '~icons/carbon/checkmark-filled'
import CarbonCloseFilled from '~icons/carbon/close-filled'
import CarbonDotMark from '~icons/carbon/dot-mark'
import CarbonSearchLocateMirror from '~icons/carbon/search-locate-mirror'
import CarbonSortAscending from '~icons/carbon/sort-ascending'
import CarbonSortDescending from '~icons/carbon/sort-descending'
import CarbonTriangleLeftSolid from '~icons/carbon/triangle-left-solid'
import CarbonTriangleRightSolid from '~icons/carbon/triangle-right-solid'
import { db } from '../../../db/client'
import { TRANSACTION_CATEGORIES } from '../../../db/lib/constants/categories'
import { startDatabase } from '../../../db/lib/migrator'
import { useTableSelection } from '../../hooks/useTableSelection'
import { createEvent, useEvents } from '../../query/events'
import { addEventToTransactions } from '../../query/transactions'
import { invalidateRelatedQuery, useQuery } from '../../query/useQuery'
import { colorFromSeed } from '../../utils/color'
import { formatCurrency } from '../../utils/currency'
import { dateFormat } from '../../utils/date'
import { getRangeDisplayValue, RangePicker, withRangeQuery } from '../RangePicker'

interface ITransactionRowProps {
  transaction: Pick<TransactionModel, 'id'
  | 'transaction_at'
  | 'credit'
  | 'debit'
  | 'balance'
  | 'transaction_category'
  | 'transaction_mode'
  | 'tags'> & { event_name: string | null }
  onSelect: () => void
  isSelected: boolean
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

function TransactionRow({ transaction, isSelected, onSelect }: ITransactionRowProps) {
  return (
    <tr class="row">
      <td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="checkbox checkbox-xs"
        />
      </td>

      <td class="inline-flex gap-1">
        {transaction.credit === null
          ? <CarbonArrowUpRight class="stroke-2 text-secondary" />
          : <CarbonArrowDownLeft class="stroke-2 text-primary" />}
        {transaction.id}
      </td>

      <td>{dateFormat(transaction.transaction_at).mmmddyyyy()}</td>

      <td>
        {formatCurrency(transaction.credit)}
      </td>

      <td>
        {formatCurrency(transaction.debit)}
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
        {transaction.event_name ?? '-'}
      </td>

      <td>
        {titleCase(transaction.transaction_mode).toUpperCase()}
      </td>

      {transaction.balance !== null && (
        <td>{formatCurrency(transaction.balance)}</td>
      )}
    </tr>
  )
}

interface IAggregateRowProps {
  total_debit: number | undefined
  total_credit: number | undefined
}

function AggregateRow({ total_credit, total_debit }: IAggregateRowProps) {
  return (
    <tr class="row">
      <td colSpan={3} class="text-end">
        Total
      </td>

      {
        total_credit !== undefined && (
          <td>
            =
            {' '}
            {formatCurrency(total_credit)}
          </td>
        )
      }

      {
        total_debit !== undefined && (
          <td>
            =
            {' '}
            {formatCurrency(total_debit)}
          </td>
        )
      }

      <td colSpan={4}></td>

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
      <ul tabIndex={0} className="dropdown-content menu menu-xs bg-base-100 rounded-box z-10 w-40 overflow-y-scroll p-2 shadow">
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

interface ISelectionActionsRowProps {
  selectionState: Signal<Set<number>>
  resetSelection: () => void
}

function SelectionActionsRow({ selectionState, resetSelection }: ISelectionActionsRowProps) {
  const { events } = useEvents()

  async function handleAddEventToTransactions(eventId: number) {
    await addEventToTransactions(Array.from(selectionState.value), eventId)

    await invalidateRelatedQuery('transactions')

    resetSelection()
  }

  async function handleEventCreationAndLink(event: SubmitEvent) {
    event.preventDefault()
    event.stopImmediatePropagation()

    const formData = Object
      .fromEntries(new FormData(event.target as HTMLFormElement)
        .entries()) as Record<'name', string>

    const newEvent = await createEvent(formData)

    await handleAddEventToTransactions(newEvent.id)
  }

  return (
    <div className="flex items-center px-4 gap-2 relative">
      <span class="text-xs">
        <span class="font-semibold">{selectionState.value.size}</span>
        {' '}
        Selected
      </span>

      <div className="dropdown dropdown-bottom">
        <button tabIndex={0} role="button" className="btn btn-xs">Add to event</button>
        <ul tabIndex={0} className="dropdown-content menu menu-xs bg-base-100 rounded-box z-10 w-52 p-2 shadow h-52 overflow-y-scroll">
          {
            events.value?.map((event) => {
              return (
                <li key={event.id} onClick={() => { handleAddEventToTransactions(event.id) }}><span>{event.name}</span></li>
              )
            })
          }
        </ul>
      </div>

      <div className="dropdown dropdown-bottom">
        <button className="btn btn-xs">Create new</button>
        <div tabIndex={0} className="dropdown-content bg-base-100 rounded-box z-10 w-52 p-2 shadow">
          <form onSubmit={handleEventCreationAndLink} class="flex flex-col gap-2">
            <input
              type="text"
              name="name"
              placeholder="Event name"
              className="input input-bordered input-sm w-full max-w-xs"
            />

            <div className="flex justify-end">
              <button type="submit" className="btn btn-xs">Add Event</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export function withCategoryQuery<Q extends SelectQueryBuilder<UnknownRecord, any, object>>(
  qb: Q,
  categories: TransactionModel['transaction_category'][],
): Q {
  if (categories.length === 0) {
    return qb
  }

  return qb.where(sql`transaction_category`, 'in', categories) as Q
}

export function TransactionsTable() {
  const page = useSignal(0)

  const range = useSignal<TStaticRanges | [Date, Date]>('this_month')
  const categories = useSignal<TransactionModel['transaction_category'][]>([])
  const order = useSignal<TOrderDirection>('desc')
  const search = useSignal('')

  useSignalEffect(() => {
    // to subscribe
    const _r = range.value

    page.value = 0
  })

  const { value: transactions } = useQuery(
    () => [
      'transactions_list',
      range.value,
      categories.value,
      order.value,
      search.value,
      page.value.toString(),
    ],
    async () => {
      await startDatabase()

      const _range = range.value
      const _page = page.value
      const _categories = categories.value
      const _order = order.value
      const _search = search.value

      const query = withCategoryQuery(
        withRangeQuery(db.selectFrom('transactions'), _range),
        _categories,
      )
        .leftJoin('events as e', 'e.id', 'transactions.event_id')
        .select(
          eb => [
            'transactions.id',
            'transactions.transaction_at',
            'transactions.credit',
            'transactions.debit',
            'transactions.balance',
            'transactions.transaction_category',
            'transactions.transaction_mode',
            'transactions.tags',
            'transactions.event_id',
            'e.name as event_name',
            jsonObjectFrom(withCategoryQuery(
              withRangeQuery(eb
                .selectFrom('transactions'), _range),
              _categories,
            )
              .select(_eb => [
                _eb.fn.count<number>('transactions.id').as('transactions_count'),
                _eb.fn.sum<number>('transactions.debit').as('total_debit'),
                _eb.fn.sum<number>('transactions.credit').as('total_credit'),
              ]),
            ).as('aggr'),
          ],
        )
        .where(eb => sql`exists (
              select 1 
              from json_each(${eb.ref('transactions.tags')}) 
              where json_each.value like ${`%${_search}%`}
            )`)
        .orderBy(sql`unixepoch(transactions.transaction_at)`, _order)
        .limit(15)
        .offset(_page * 15)

      return await query.execute()
    },
    {
      defautlValue: [],
    },
  )

  const total = useComputed(() => transactions.value?.[0]?.aggr?.transactions_count ?? 0)

  const aggregateResults = useComputed(() => transactions.value?.[0]?.aggr)

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

  const {
    selectionState,
    toggleFullSelection,
    toggleSelection,
    allSelected,
    hasSelection,
    resetSelection,
  } = useTableSelection(
    () => transactions.value?.map(it => it.id) ?? [],
  )

  return (
    <div className="border border-base-200 rounded-lg flex flex-col gap-4 relative">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="font-semibold text-sm">
          Transactions
        </div>
        <label
          className="input input-bordered input-xs w-full max-w-48 flex items-center gap-1"
        >
          <CarbonSearchLocateMirror />
          <input
            type="text"
            placeholder="Search & press enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                search.value = e.currentTarget.value ?? ''
              }
            }}
            onChange={(e) => {
              if (e.currentTarget.value !== '')
                return

              search.value = e.currentTarget.value ?? ''
            }}
            value={search}
          />
        </label>
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

      {
        hasSelection.value && (
          <SelectionActionsRow
            resetSelection={resetSelection}
            selectionState={selectionState}
          />
        )
      }

      <div class="overflow-x-auto max-h-80">
        <table class="table table-zebra table-xs table-pin-rows">
          {/* head */}
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleFullSelection}
                  className="checkbox checkbox-xs"
                />
              </th>
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
              <th>Event</th>
              <th>Method</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {
              transactions.value?.map((it) => {
                return (
                  <TransactionRow
                    transaction={it}
                    key={it.id}
                    isSelected={selectionState.value.has(it.id)}
                    onSelect={() => toggleSelection(it)}
                  />
                )
              })
            }
            {
              (aggregateResults.value?.total_credit || aggregateResults.value?.total_debit) && (
                <AggregateRow
                  total_credit={aggregateResults.value.total_credit}
                  total_debit={aggregateResults.value.total_debit}
                />
              )
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
