// TODO: refactor to have stuff like react query

import { signal, useComputed, useSignalEffect } from '@preact/signals'

let fetcherStore: Record<string, () => Promise<unknown>> = {}

const store = signal<Record<string, any>>({})

export function useQueryData<T>(key: string[]) {
  const serialized = useComputed(() => JSON.stringify(key))

  const value = useComputed<T | undefined>(() => store.value[serialized.value])

  return value
}

export function useQuery<T>(key: string[], fetcher: () => Promise<T>) {
  const serialized = useComputed(() => JSON.stringify(key))

  const invalidate = async () => {
    const result = await fetcher()

    store.value = {
      ...store.peek(),
      [serialized.value]: result,
    }
  }

  useSignalEffect(() => {
    fetcherStore = { ...fetcherStore, [serialized.value]: invalidate }

    void invalidate()
  })

  const value = useComputed<T | undefined>(() => store.value[serialized.value])

  return {
    value,
    invalidate,
  }
}

export async function invalidateQuery(key: '*' | string[]) {
  if (typeof key === 'string') {
    for (const fetcher in fetcherStore) {
      await (fetcherStore)[fetcher]()
    }

    return
  }

  await fetcherStore[JSON.stringify(key)]?.()
}
