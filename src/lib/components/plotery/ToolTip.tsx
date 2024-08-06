import type { ChartAttributes, ChartData } from '@shelacek/plotery'
import { Fragment } from 'preact'

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

const SPACING_X_OUT = 20
const SPACING_Y_OUT = 25
const SPACING_BETWEEN = 20

function getDataLabelDimensions(position: [number, number], dataPoints: string[]) {
  const dataPointPositions: Array<[number, number]> = []

  const maxWidth = dataPoints.map(it => it.toString().length * 5).sort()[0]

  for (let i = 0; i <= dataPoints.length; i++) {
    dataPointPositions.push([
      position[0] + SPACING_X_OUT,
      (i !== 0 ? dataPointPositions[i - 1][1] + SPACING_BETWEEN : position[1] + SPACING_Y_OUT),
    ])
  }

  const height = dataPointPositions[dataPointPositions.length - 1][1] - dataPointPositions[0][1] + SPACING_Y_OUT

  const boxDimensions: [number, number] = [maxWidth + (SPACING_X_OUT * 2.5), height]

  return {
    dataPointPositions,
    boxDimensions,
  }
}

export function ByogaToolTip({
  axes,
  data,
  position,
  rect,
  series = 'debit',
  renderText = ([_, point]) => point[1].toFixed(2),
}: ITooltipProps) {
  if (!data || !axes || !position || !rect) {
    return null
  }

  const pos = axes.x.scale(position[0], true)
  const points = getPoints(pos, data)

  const seriesValues: Array<[string, [number, number]]> = Array.isArray(points)
    ? [[series, points]]
    : Object.entries(points)

  const textToRender = seriesValues.map(renderText)

  const labelDimensions = getDataLabelDimensions(position, textToRender)

  return (
    <g>
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

      <rect
        x={position[0]}
        y={position[1]}
        width={labelDimensions.boxDimensions[0]}
        height={labelDimensions.boxDimensions[1]}
        fill="white"
        stroke-width="1.5"
        class="stroke-base-300"
        rx="8"
      />
      {
        textToRender.map((it, index) => {
          const seriesName = seriesValues[index][0]
          const textPos = labelDimensions.dataPointPositions[index]

          return (
            <text x={textPos[0]} y={textPos[1]} fill={`var(--${seriesName})`}>{it}</text>
          )
        })
      }
    </g>
  )
}
