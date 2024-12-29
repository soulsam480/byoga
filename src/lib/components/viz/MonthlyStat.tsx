import type { ChartData, ChartSeriesData } from '@shelacek/plotery'
import { useComputed } from '@preact/signals'
import { BarLine, CardinalLine, Chart, LinearAxis, Tooltip } from '@shelacek/plotery'
import { sql } from 'kysely'
import * as R from 'remeda'
import { titleCase } from 'scule'
import CarbonDotMark from '~icons/carbon/dot-mark'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import { useAnimationComp } from '../../hooks/useAnimationComp'
import { monthlyBudget, monthlyInvestment } from '../../pages/Settings'
import { useQuery } from '../../query/useQuery'
import { formatCurrency } from '../../utils/currency'
import { dateFormat } from '../../utils/date'
import { Highlight } from '../plotery/Highlight'
import { ByogaToolTip } from '../plotery/ToolTip'

function formatMonthYear(monthStr: string | undefined | null) {
  if (typeof monthStr !== 'string')
    return ''

  const date = new Date()
  const [month, year] = monthStr.split('-').map(Number)

  date.setMonth(month === 0 ? 11 : month - 1)
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
          eb.fn.sum<number>('debit').filterWhere(eb => eb.and([
            eb('credit', 'is', null),
            // @ts-expect-error dunno
            eb('transaction_category', 'not in', ['deposit', 'salary', 'test']),
            eb('transaction_mode', 'not in', ['nach', 'monthly_interest']),
          ])).as('debit_spend'),
          eb.fn.sum<number>('debit').filterWhere(eb => eb.and([
            eb('credit', 'is', null),
            eb('transaction_mode', 'in', ['nach'])
              .or('transaction_category', 'in', ['deposit'])
              .or(sql`UPPER(meta)`, 'like', 'ZERODHA'),
          ])).as('investment_spend'),
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

        // ? debit category
        acc.expense.push([index + offset + 0.2, (curr.debit_spend ?? 0)])
        acc.investment.push([index + offset + 0.3, (curr.investment_spend ?? 0)])

        return acc
      }, {
        credit: [],
        debit: [],
        balance: [],
        expense: [],
        investment: [],
      } as Record<string, ChartSeriesData>),
    )
  })

  useAnimationComp('.monthly-stat', pois)

  return (
    <div className="monthly-stat border flex flex-col gap-4 border-base-200 rounded-lg p-4">
      <div className="flex justify-between">
        <div className="text-sm font-semibold">
          Monthly Statistics
        </div>

        <div className="inline-flex gap-2">
          <div className="inline-flex items-center gap-1 text-xs text-primary">
            <CarbonDotMark />
            Credit
          </div>

          <div className="inline-flex items-center gap-1 text-xs text-secondary">
            <CarbonDotMark />
            Debit
          </div>

          <div className="inline-flex items-center gap-1 text-xs text-accent">
            <CarbonDotMark />
            Balance
          </div>

          <div className="inline-flex items-center gap-1 text-xs text-expense">
            <CarbonDotMark />
            Expense
          </div>

          <div className="inline-flex items-center gap-1 text-xs text-investment">
            <CarbonDotMark />
            Investment
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

        <LinearAxis type="y" min={0} max={400000} major labels={value => formatCurrency(value)} />

        <Highlight class="budget-highlight-section" limits={{ y1: 0, y2: monthlyBudget.value }} />

        <Highlight class="investment-highlight-section" limits={{ y1: 0, y2: monthlyInvestment.value }} />

        <BarLine series="credit" />
        <BarLine series="debit" />

        <BarLine series="expense" />
        <BarLine series="investment" />

        <CardinalLine series="balance" tension={1} />

        <Tooltip>
          <ByogaToolTip
            renderText={(data) => {
              return `${titleCase(data[0])}: ${formatCurrency(data[1][1])}`
            }}
          />
        </Tooltip>
      </Chart>

      <div class="flex flex-col gap-1">
        <div class="text-sm">
          Preferences
        </div>

        <div className="inline-flex gap-4">
          <span class="text-xs inline-flex items-center gap-1">
            <CarbonDotMark class="text-expense" />
            {' '}
            Monthly Budget:
            {' '}
            {formatCurrency(monthlyBudget.value)}
          </span>

          <span class="text-xs inline-flex items-center gap-1">
            <CarbonDotMark class="text-investment" />
            {' '}
            Monthly Investment Goal:
            {' '}
            {formatCurrency(monthlyInvestment.value)}
          </span>
        </div>
      </div>
    </div>
  )
}
