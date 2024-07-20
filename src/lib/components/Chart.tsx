import type { ChartOptions, CommonData } from 'frappe-charts'
import { Chart as FChart } from 'frappe-charts'
import './chart.css'
import type { Signal } from '@preact/signals'
import { useSignalEffect } from '@preact/signals'
import { useRef } from 'preact/hooks'
import clsx from 'clsx'

export const THEME_COLORS = ['#66cc8a', '#377cfb', '#f68067']

interface ChartProps extends Omit<ChartOptions, 'data'> {
  data: Signal<CommonData>
  className?: string
}

export function Chart({ data, className, ...options }: ChartProps) {
  const chartContainer = useRef<HTMLDivElement | null>(null)
  const chart = useRef<FChart | null>(null)

  useSignalEffect(() => {
    const _chart = chart.current
    const _chartContainer = chartContainer.current

    if (_chart === null && _chartContainer !== null) {
      const instance = new FChart(_chartContainer, {
        colors: THEME_COLORS,
        truncateLegends: false,
        ...options,
        data: data.value,
      })

      chart.current = (instance)
    }
    else if (_chart !== null) {
      _chart?.update(data.value)
    }
  })

  return <div class={clsx('chart__parent', className)} ref={chartContainer} />
}
