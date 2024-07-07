import type { TransactionModel } from '../table'

function safeParseJSON<T>(json: string, defaultValue: T) {
  try {
    return JSON.parse(json) as T
  }
  catch (error) {
    return defaultValue
  }
}

const DATE_KEYS = new Set(['transaction_at', 'created_at', 'updated_at'])

export function serializeTransaction(
  value: Record<string, any>,
): TransactionModel {
  DATE_KEYS.forEach((key) => {
    if (key in value) {
      value[key] = new Date(value[key])
    }
  })

  if ('tags' in value) {
    value.tags = safeParseJSON(value.tags, [])
  }

  if ('additional_meta' in value) {
    value.additional_meta = safeParseJSON(value.additional_meta, {})
  }

  return value as TransactionModel
}
