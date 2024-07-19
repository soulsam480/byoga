import type { ChartOptions, CommonData } from 'frappe-charts'
import { Chart as FChart } from 'frappe-charts'
import type { ObservableLike } from 'voby'
import { $, useEffect } from 'voby'
import './chart.css'

interface ChartProps extends Omit<ChartOptions, 'data'> {
  data: ObservableLike<CommonData>
}

export function Chart({ data, ...options }: ChartProps) {
  const chartContainer = $<HTMLDivElement | null>(null)

  const chart = $<FChart | null>(null)

  useEffect(() => {
    const _chart = chart()
    const _chartContainer = chartContainer()

    if (_chart === null && _chartContainer !== null) {
      const instance = new FChart(_chartContainer, {
        ...options,
        data: data(),
      })

      chart(instance)
    }
    else if (_chart !== null) {
      _chart?.update(data())
    }
  })

  return <div class="chart__parent" ref={chartContainer} />
}
