import { sql } from 'kysely'
import { useComputed } from '@preact/signals'
import type { ChartData, ChartSeriesData } from '@shelacek/plotery'
import { BarLine, CardinalLine, Chart, LinearAxis } from '@shelacek/plotery'
import * as R from 'remeda'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import { useQuery, useQueryData } from '../../query/useQuery'
import { currencyFormat } from '../../utils/currency'
import { dateFormat } from '../../utils/date'

interface IMonthlyStatData {
  total_credit: number
  total_debit: number
  transaction_month: string
  monthly_balance: number | null
}

function formatMonthYear(monthStr: string | undefined | null) {
  if (typeof monthStr !== 'string')
    return ''

  const date = new Date()
  const [month, year] = monthStr.split('-').map(Number)

  date.setMonth(month)
  date.setFullYear(year)

  return dateFormat(date).mmmyy()
}

export function AllTimeMonthlyViz() {
  const { value } = useQuery(['all_time_monthly_stat'], async () => {
    await startDatabase()

    const results = await db
      .selectFrom('transactions')
      .select(eb =>
        [
          eb.fn.sum<number>('credit').as('total_credit'),
          eb.fn.sum<number>('debit').as('total_debit'),
          sql<string>`strftime('%m-%Y', ${eb.ref('transaction_at')})`.as('transaction_month'),
          // monthly balance as of 30th of the month
          eb.selectFrom('transactions as t2')
            .select('balance')
            .where(in_eb =>
              sql`strftime('%m-%Y', ${in_eb.ref('t2.transaction_at')})`, '=', sql`strftime('%m-%Y', ${eb.ref('transactions.transaction_at')})`)
            .where(in_eb => sql`strftime('%e', ${in_eb.ref('t2.transaction_at')})`, '<', '30')
            .orderBy(in_eb => sql`strftime('%e', ${in_eb.ref('t2.transaction_at')})`, 'desc')
            .limit(1)
            .as('monthly_balance'),
        ])
      .orderBy(sql`unixepoch(${sql.ref('transaction_at')})`, 'asc')
      .groupBy('transaction_month')
      .execute()

    return results
  })

  const months = useComputed(() => value.value?.map(it => it.transaction_month) ?? [])

  const pois = useComputed<ChartData>(() => {
    return R.pipe(
      value.value ?? [],
      R.reduce((acc, curr, index) => {
        const offset = 0.03

        acc.credit.push([index + offset, curr.total_credit ?? 0])
        acc.debit.push([index + offset + 0.1, (curr.total_debit ?? 0)])
        acc.balance.push([index, (curr.monthly_balance ?? 0)])

        return acc
      }, {
        credit: [],
        debit: [],
        balance: [],
      } as Record<string, ChartSeriesData>),
    )
  })

  return (
    <div className="border flex flex-col gap-4 border-base-200 rounded-lg p-4" style="--plotery-margin: 0px 16px 16px 60px;">
      <div className="text-lg">
        Total Cash In and Cash Out
      </div>

      <Chart data={pois.value}>
        <LinearAxis
          type="x"
          min={0}
          max={months.value.length}
          labels={index => formatMonthYear(months.value[index])}
          major
          minor
        />
        <LinearAxis type="y" min={0} max={400000} major labels={value => currencyFormat.format(value)} />
        <BarLine series="credit" />
        <BarLine series="debit" />
        <CardinalLine series="balance" tension={1} />
      </Chart>
    </div>
  )
}

export function LastMonthDigest() {
  const queryData = useQueryData<IMonthlyStatData[]>(['all_time_monthly_stat'])

  const { value: allTimeMonthlyDeposit } = useQuery(['all_time_monthly_deposit'], async () => {
    await startDatabase()

    const results = await db
      .selectFrom('transactions')
      .select(eb =>
        [
          eb.fn.sum<number>('debit').as('total_debit'),
          sql<string>`strftime('%m-%Y', ${eb.ref('transaction_at')})`.as('transaction_month'),
        ])
      .where(eb => eb.and([
        eb('transaction_category', 'in', ['deposit']),
        eb('credit', 'is', null),
      ]))
      .orderBy('transaction_month', 'asc')
      .groupBy('transaction_month')
      .execute()

    return results
  })

  const lastMonthData = useComputed(() => {
    const date = new Date()

    const lastMonth = date.getMonth() === 1 ? 12 : `${date.getMonth()}-${date.getFullYear()}`

    const data = queryData.value?.find(it => it.transaction_month.replace(/^0(.*)/, '$1') === lastMonth.toString())

    const depositData = allTimeMonthlyDeposit.value?.find(it => it.transaction_month.replace(/^0(.*)/, '$1') === lastMonth.toString())

    if (data === undefined || depositData === undefined)
      return null

    return {
      ...data,
      total_deposit: depositData.total_debit,
    }
  })

  return (
    <div className="stats border rounded-lg border-base-200">
      <div className="stat px-4">
        {/* <div className="stat-figure text-primary">
         icon
        </div> */}
        <div className="stat-title">Cash in</div>
        <div className="stat-value text-primary">
          {lastMonthData.value?.total_credit
            ? currencyFormat.format(lastMonthData.value.total_credit)
            : '-'}
        </div>
        {/* <div className="stat-desc">21% more than last month</div> */}
      </div>

      <div className="stat px-4">
        {/* <div className="stat-figure text-secondary">
        icon
        </div> */}
        <div className="stat-title">Cash out</div>
        <div className="stat-value text-secondary">
          {lastMonthData.value?.total_debit
            ? currencyFormat.format(lastMonthData.value.total_debit)
            : '-'}
        </div>
        {/* <div className="stat-desc">21% more than last month</div> */}
      </div>

      <div className="stat px-4">
        {/* <div className="stat-figure text-secondary">
         icon
        </div> */}
        <div className="stat-title">Investments</div>
        <div className="stat-value text-accent">
          {lastMonthData.value?.total_deposit
            ? currencyFormat.format(lastMonthData.value.total_deposit)
            : '-'}
        </div>
        {/* <div className="stat-desc text-secondary">31 tasks remaining</div> */}
      </div>
    </div>
  )
}
