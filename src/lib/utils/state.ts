import type { Observable } from 'voby'
import { $ } from 'voby'

interface Setter<T> {
  (fn: (value: T) => T): T
  (value: T): T
}

export function useState<T>(initialState: T): [Observable<T>, Setter<T>] {
  const state = $<T>(initialState)

  return [state, state]
}
