import type { BarLineProps, ChartSeriesData } from '@shelacek/plotery'
import clsx from 'clsx'
import { Component } from 'preact'

interface ByogaHorizontalBarProps extends BarLineProps {
  base?: 'x' | 'y'
}

export class ByogaHorizontalBar extends Component<ByogaHorizontalBarProps> {
  _scale(points: ChartSeriesData) {
    return points.map(x => [
      this.props.axes?.x.scale(x[0]),
      this.props.axes?.y.scale(x[1])
    ]) as ChartSeriesData
  }

  _calcPath(points: ChartSeriesData) {
    if (this.props.base === 'y') {
      const zero = this.props.axes?.x.scale(this.props.axes?.x.reference ?? 0)

      return points.reduce((acc, x) => `${acc}M${x[0]},${x[1]}H${zero}`, '')
    }

    const zero = this.props.axes?.y.scale(this.props.axes?.y.reference ?? 0)

    return points.reduce((acc, x) => `${acc}M${x[0]},${x[1]}V${zero}`, '')
  }

  render({
    className,
    data,
    rect,
    axes,
    series,
    base: _,
    host: __,
    ...attrs
  }: ByogaHorizontalBarProps) {
    const points =
      data && (Array.isArray(data) ? data : series ? data[series] : undefined)

    if (!points || !points.length || !axes?.x || !axes?.y) {
      return null
    }

    const scaled = this._scale(points)
    const path = this._calcPath(scaled)

    return (
      <svg
        className={clsx(
          'plot cartesian bar',
          series,
          this.props.class || className
        )}
        width={rect?.width}
        height={rect?.height}
        {...attrs}
      >
        <path className='bars' d={path} />
      </svg>
    )
  }
}
