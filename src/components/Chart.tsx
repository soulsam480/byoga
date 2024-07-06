import type { CommonData } from 'frappe-charts'
import { Chart as FChart } from 'frappe-charts'
import type { ObservableLike } from 'voby'
import { $, useEffect } from 'voby'

interface ChartProps {
  data: ObservableLike<CommonData>
}

export function Chart({ data }: ChartProps) {
  const chartContainer = $<HTMLDivElement | null>(null)

  const chart = $<FChart | null>(null)

  useEffect(() => {
    const _chart = chart()
    const _chartContainer = chartContainer()

    if (_chart === null && _chartContainer !== null) {
      const instance = new FChart(_chartContainer, {
        data: data(),
        type: 'donut',
        truncateLegends: false,
      })

      chart(instance)
    }
    else if (_chart !== null) {
      _chart?.update(data())
    }
  })

  return <div class="chart__parent" ref={chartContainer} />
}
