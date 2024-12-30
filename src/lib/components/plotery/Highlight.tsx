import type { ChartAttributes } from '@shelacek/plotery'
import type { ComponentChild } from 'preact'
import clsx from 'clsx'

interface IHighlightProps extends Partial<ChartAttributes> {
  limits:
    | {
        x1: number
        x2: number
      }
    | {
        y1: number
        y2: number
      }
  class?: string
  children?: ComponentChild
}

export function Highlight({
  rect,
  axes,
  limits,
  class: className,
  children
}: IHighlightProps) {
  if (!axes?.x || !axes?.y || rect === undefined) {
    return null
  }

  const c = [
    !('x1' in limits) ? 0 : axes.x.scale(limits.x1),
    !('x2' in limits) ? rect.width : axes.x.scale(limits.x2),
    !('y2' in limits) ? 0 : axes.y.scale(limits.y2),
    !('y1' in limits) ? rect.height : axes.y.scale(limits.y1)
  ]

  const x = c[0]
  const y = c[2]

  const width = c[1] - c[0]
  const height = c[3] - c[2]

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        class={clsx('highlight', className)}
      />
      {children && (
        <foreignObject x={x} y={y} width={width} height={height}>
          {/* @ts-expect-error bad types */}
          <body xmlns='http://www.w3.org/1999/xhtml'>{children}</body>
        </foreignObject>
      )}
    </g>
  )
}
