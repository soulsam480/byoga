import { sql } from 'kysely'
import { useComputed } from '@preact/signals'
import type { ChartData, ChartSeriesData } from '@shelacek/plotery'
import { BarLine, CardinalLine, Chart, LinearAxis } from '@shelacek/plotery'
import * as R from 'remeda'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import { useQuery } from '../../query/useQuery'
import { currencyFormat } from '../../utils/currency'
import { dateFormat } from '../../utils/date'
import CarbonDotMark from '~icons/carbon/dot-mark'

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
    <div className="border flex flex-col gap-4 border-base-200 rounded-lg p-4">
      <div className="flex justify-between">
        <div className="text-sm font-semibold">
          Monthly Statistics
        </div>

        <div className="inline-flex gap-2">
          <div className="badge badge-primary badge-outline">
            <CarbonDotMark />
            Credit
          </div>
          <div className="badge badge-secondary badge-outline">
            <CarbonDotMark />
            Debit
          </div>
          <div className="badge badge-accent badge-outline">
            <CarbonDotMark />
            Balance
          </div>
        </div>
      </div>

      <Chart data={pois.value} class="h-72 monthly-stat-viz">
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
