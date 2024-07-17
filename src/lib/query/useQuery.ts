import { $, useMemo } from 'voby'

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

  const value = useMemo<T | undefined>(() => store()[serialized()])

  return {
    value,
    invalidate,
  }
}

export async function invalidateQuery(key: string[]) {
  await fetcherStore()[JSON.stringify(key)]?.()
}
