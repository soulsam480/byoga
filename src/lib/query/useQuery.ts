import { $, $$, useEffect, useMemo } from 'voby'

// TODO: refactor to have stuff like react query

const fetcherStore = $<Record<string, () => Promise<unknown>>>({})
const store = $<Record<string, any>>({})

export function useQuery<T>(key: string[], fetcher: () => Promise<T>) {
  const serialized = useMemo(() => JSON.stringify(key))

  async function invalidate() {
    const result = await fetcher()

    store((prev) => {
      return {
        ...prev,
        [serialized()]: result,
      }
    })
  }

  fetcherStore(prev => ({ ...prev, [serialized()]: invalidate }))

  useEffect(() => {
    void invalidate()
  })

  const value = useMemo<T | undefined>(() => store()[serialized()])

  return {
    value,
    invalidate,
  }
}

export async function invalidateQuery(key: '*' | string[]) {
  if (typeof key === 'string') {
    for (const fetcher in $$(fetcherStore)) {
      await $$(fetcherStore)[fetcher]()
    }

    return
  }

  await fetcherStore()[JSON.stringify(key)]?.()
}
