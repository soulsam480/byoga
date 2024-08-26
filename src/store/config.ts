import { useStorage } from '../lib/hooks/useStorage'

interface IAppConfig {
  monthly_budget: number | null
}

export const appConfig = useStorage<IAppConfig>('app_config', { monthly_budget: null })
