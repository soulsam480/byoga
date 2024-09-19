import type { ChartAttributes, ChartData } from '@shelacek/plotery'
import CarbonDotMark from '~icons/carbon/dot-mark'
import { Fragment } from 'preact/jsx-runtime'

interface ITooltipProps extends Partial<ChartAttributes> {
  position?: [number, number]
  series?: string
  renderText?: (data: [series: string, point: [number, number]]) => string
}

function getPoints(position: number, data: ChartData) {
  if (Array.isArray(data)) {
    const diffs = data.map(x => Math.abs(position - x[0]))
    const point = data[diffs.findIndex(x => x === Math.min(...diffs))]
    return point
  }

  const series = Object.keys(data)

  return series.reduce<Record<string, [number, number]>>((acc, curr) => {
    const seriesData = data[curr]

    const diffs = seriesData.map(x => Math.abs(position - x[0]))
    const point = seriesData[diffs.findIndex(x => x === Math.min(...diffs))]

    acc[curr] = point

    return acc
  }, {})
}

export function ByogaToolTip({
  axes,
  data,
  position,
  rect,
  series = 'debit',
  renderText = ([_, point]) => point[1].toFixed(2),
  host,
}: ITooltipProps) {
  if (!data || !axes || !position || !rect || !host) {
    return null
  }

  const pos = axes.x.scale(position[0], true)
  const points = getPoints(pos, data)

  const seriesValues: Array<[string, [number, number]]> = Array.isArray(points)
    ? [[series, points]]
    : Object.entries(points)

  const textToRender = seriesValues.map(renderText)

  return (
    <>
      <path d={`M${position[0]},0V${rect.height}`} stroke-width="1px" stroke="grey" stroke-dasharray="4" />
      {
        seriesValues.map(([series, point], index) => {
          return (
            <Fragment key={index}>
              <circle
                cx={axes.x.scale(point[0])}
                cy={axes.y.scale(point[1])}
                r="5"
                stroke-width="2px"
                stroke="white"
                fill={`var(--${series})`}
              />
            </Fragment>
          )
        })
      }

      <foreignObject
        x={position[0]}
        y={position[1]}
        width="100%"
        height="100%"
        class="overflow-visible"
      >
        <ul class="flex flex-col gap-1 items-start bg-white rounded shadow p-2 max-w-max">
          {
            textToRender.map((el, index) => {
              const seriesName = seriesValues[index][0]

              return (
                <li class="text-[10px] inline-flex gap-1">
                  <CarbonDotMark style={{ color: `var(--${seriesName})` }} />
                  {el}
                </li>
              )
            })
          }
        </ul>
      </foreignObject>
    </>
  )
}
