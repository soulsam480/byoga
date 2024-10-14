import { type Signal, effect, signal } from '@preact/signals'

function createKey(key: string) {
  return `byoga_${key}`
}

export function useStorage<K>(_key: string, defaultValue: K): Signal<K> {
  const key = createKey(_key)

  const fromStore = localStorage.getItem(key)

  if (fromStore === null) {
    localStorage.setItem(key, JSON.stringify(defaultValue))
  }

  const state = signal(fromStore === null ? defaultValue : JSON.parse(fromStore))

  effect(() => {
    const stateVal = state.value

    localStorage.setItem(key, JSON.stringify(stateVal))
  })

  return state
}
