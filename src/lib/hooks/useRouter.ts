import { effect, signal, useComputed, useSignalEffect } from '@preact/signals'
import { useStorage } from './useStorage'

const urlState = signal(window.location.hash)

effect(() => {
  const value = urlState.value

  if (window.location.hash === value)
    return

  window.location.hash = value
})

window.addEventListener('popstate', () => {
  urlState.value = window.location.hash
})

window.addEventListener('hashchange', () => {
  urlState.value = window.location.hash
})

export type TPage = 'home' | 'settings'

export const ALLOWED_HASH: TPage[] = ['home', 'settings']

export function useRouter() {
  const cachedPage = useStorage<TPage>('__s_page', 'home')

  // 1. compute the current page
  /**
   * Current page
   */
  const page = useComputed<TPage>(() => {
    const hash = urlState.value ?? ''

    if (hash.length === 0)
      return cachedPage.value

    const value = hash.replace('#', '') as TPage

    if (!ALLOWED_HASH.includes(value))
      return cachedPage.value

    return value
  })

  // 2. keep the hash in sync with the page. when hash is invalid set it to home
  useSignalEffect(() => {
    const pageToSet = cachedPage.value.length > 0
      ? `#${cachedPage.value}`
      : (urlState.value ?? '').length === 0
          ? '#home'
          : ''

    if (pageToSet.length === 0)
      return

    urlState.value = pageToSet
  })

  // 3. keep the cached page in sync with the current page
  useSignalEffect(() => {
    const value = page.value

    cachedPage.value = value
  })

  return {
    page,
    /**
     * Go to a page
     */
    goto(page: TPage) {
      urlState.value = `#${page}`
    },
  }
}
