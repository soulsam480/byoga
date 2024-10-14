import { signal, useComputed, useSignalEffect } from '@preact/signals'

let fetcherStore: Record<string, () => Promise<unknown>> = {}

const store = signal<Record<string, any>>({})

/**
 * read data of a query without a fetcher
 */
export function useQueryData<T>(key: string[], defaultValue?: T) {
  const serialized = useComputed(() => JSON.stringify(key))

  const value = useComputed<T | undefined>(() => store.value[serialized.value] ?? defaultValue)

  return value
}

interface IQueryConfig<T> {
  defautlValue?: T
}

export function useQuery<T>(
  key: any[] | (() => any[]),
  fetcher: () => Promise<T>,
  { defautlValue }: IQueryConfig<T> = {},
) {
  const serialized = useComputed(() => {
    if (typeof key === 'function') {
      return JSON.stringify(key())
    }

    return JSON.stringify(key)
  })

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

  const value = useComputed<T | undefined>(() => store.value[serialized.value] ?? defautlValue)

  return {
    value,
    invalidate,
  }
}

export async function invalidateQuery(queryKey: '*' | string[]) {
  if (typeof queryKey === 'string') {
    for (const fetcher in fetcherStore) {
      await (fetcherStore)[fetcher]()
    }

    return
  }

  await fetcherStore[JSON.stringify(queryKey)]?.()
}

export async function invalidateRelatedQuery(queryKey: string) {
  for (const key in fetcherStore) {
    if (key.startsWith(queryKey)) {
      await fetcherStore[key]?.()
    }
  }
}
