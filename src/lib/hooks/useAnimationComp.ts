import { type Signal, useSignalEffect } from '@preact/signals'
import { tick } from '../utils/tick'

/**
 * - handle animation computation for graphs.
 * - this takes the root selector and dataset
 * - adds/removes based on state change
 */
export function useAnimationComp(root: string, dep: Signal<unknown>) {
  useSignalEffect(() => {
    const _d = dep.value

    tick().then(() => {
      document
        .querySelectorAll<SVGPathElement>(`${root} .plot.cartesian .bars`)
        .forEach(el => {
          el.style.setProperty('--path-length', el.getTotalLength().toString())

          el.classList.remove('bar-animation')

          tick().then(() => {
            el.classList.add('bar-animation')
          })
        })

      document
        .querySelectorAll<SVGPathElement>(`${root} .plot.cartesian .line`)
        .forEach(el => {
          el.style.setProperty('--path-length', el.getTotalLength().toString())

          el.classList.remove('line-animation')

          tick().then(() => {
            el.classList.add('line-animation')
          })
        })
    })
  })
}
