import type { Signal } from '@preact/signals'
import { useComputed, useSignalEffect } from '@preact/signals'
import clsx from 'clsx'
import { titleCase } from 'scule'
import type { IterableElement } from 'type-fest'
import { useCallback, useEffect, useRef } from 'preact/hooks'
import { RangePlugin, easepick } from '@easepick/bundle'
import type { SelectQueryBuilder } from 'kysely'
import { sql } from 'kysely'
import easepickStyle from '@easepick/bundle/dist/index.css?url'
import { dateFormat } from '../utils/date'
import type { Database } from '../../db/schema'
import './rangepicker.css'

function getCurrentMonthStart() {
  const current = new Date()

  current.setDate(1)
  current.setHours(0, 0, 0, 0)

  return current
}

const CURRENT_MONTH_START = getCurrentMonthStart()

export type TRange = TStaticRanges | [Date, Date]

export const STATIC_RANGES = ['this_month', 'last_month', 'last_6_months', 'last_year', 'all_time'] as const

export type TStaticRanges = IterableElement<typeof STATIC_RANGES>

function getStaticRangeQuery<Q extends SelectQueryBuilder<Database, 'transactions', object>>(qb: Q) {
  return {
    all_time: qb.where(sql`transaction_at`, '<', sql`date('now')`),
    last_year: qb.where(sql`transaction_at`, '>', sql`date('now','-365 days')`),
    last_6_months: qb.where(eb => eb.and(
      [
        // ideally this should be last month start but SQLite engine is behaving weirdly
        eb(sql`transaction_at`, '<=', sql`date(${CURRENT_MONTH_START.toISOString()})`),
        eb(sql`transaction_at`, '>', sql`date(${CURRENT_MONTH_START.toISOString()},'-6 months')`),
      ],
    )),
    last_month: qb.where(eb => eb.and(
      [
        // ideally this should be last month start but SQLite engine is behaving weirdly
        eb(sql`transaction_at`, '<=', sql`date(${CURRENT_MONTH_START.toISOString()})`),
        eb(sql`transaction_at`, '>', sql`date(${CURRENT_MONTH_START.toISOString()},'-30 days')`),
      ],
    )),
    this_month: qb.where(eb => eb.and(
      [
        eb(sql`transaction_at`, '>=', sql`date('now', 'start of month')`),
        eb(sql`transaction_at`, '<', sql`date('now', 'start of month', '+1 month')`),
      ],
    )),
  }
}

export function withRangeQuery<Q extends SelectQueryBuilder<Database, 'transactions', object>>(qb: Q, range: TRange) {
  if (typeof range === 'string') {
    return getStaticRangeQuery(qb)[range]
  }

  return qb.where(eb => eb.and([
    eb(sql`transaction_at`, '>', sql`date(${range[0].toISOString()})`),
    eb(sql`transaction_at`, '<', sql`date(${range[1].toISOString()})`),
  ]))
}

export function getRangeDisplayValue(range: TRange, showStatic = false) {
  if (!Array.isArray(range)) {
    if (showStatic) {
      return titleCase(range)
    }

    return 'Custom'
  }

  return `${dateFormat(range[0]).ddmmyyyy()} To ${dateFormat(range[1]).ddmmyyyy()}`
}

interface IRangePickerProps {
  range: Signal<TRange>
}

export function RangePicker({ range }: IRangePickerProps) {
  const datePicker = useRef<HTMLInputElement>(null)
  const picker = useRef<easepick.Core>(null)

  const rangeDisplayValue = useComputed(() => getRangeDisplayValue(range.value))

  useSignalEffect(() => {
    if (!Array.isArray(range.value)) {
      picker.current?.clear()
    }
  })

  useEffect(() => {
    if (datePicker.current === null)
      return

    // eslint-disable-next-line new-cap
    picker.current = new easepick.create({
      element: datePicker.current,
      css: [
        easepickStyle,
      ],
      plugins: [RangePlugin],
      RangePlugin: {
        tooltip: true,
      },
      setup(picker) {
        picker.on('select', (e) => {
          range.value = [e.detail.start, e.detail.end]

          picker.hide()
        })

        picker.on('render', () => {
          if (Array.isArray(range.value) && !picker.getStartDate()) {
            const [start, end] = range.value
            picker.setDateRange(start, end)
          }
        })
      },
    })
  }, [])

  const handleCustomClick = useCallback(() => {
    if (Array.isArray(range.value)) {
      return
    }

    picker.current?.show()
  }, [range])

  return (
    <div class="max-w-max relative">
      <div role="tablist" class="tabs tabs-xs tabs-bordered">
        {
          STATIC_RANGES.map((value) => {
            return (
              <span
                key={value}
                role="tab"
                className={clsx(['tab', range.value === value && 'tab-active font-semibold'])}
                style="--tab-padding: 8px;"
                onClick={() => {
                  range.value = value
                }}
              >
                {titleCase(value)}
              </span>
            )
          })
        }

        <span
          role="tab"
          className={clsx(['tab relative', Array.isArray(range.value) && 'tab-active font-semibold'])}
          style="--tab-padding: 8px;"
          onClick={handleCustomClick}
        >
          <input
            className="opacity-0 absolute z-10 inset-0 cursor-pointer"
            ref={datePicker}
            readonly
          />
          {rangeDisplayValue}
        </span>
      </div>

    </div>
  )
}
