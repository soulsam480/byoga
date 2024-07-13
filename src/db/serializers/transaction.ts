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

// export const TransactionSchema = Type.Transform(
//   Type.Object({
//     id: Type.Number({ default: undefined }),
//     meta: Type.String({ default: undefined }),
//     transaction_at: Type.String({ default: undefined }),
//     transaction_ref: Type.Union([Type.Null(), Type.String()], {
//       default: undefined,
//     }),
//     cheque_no: Type.Union([Type.Null(), Type.Number()], { default: undefined }),
//     debit: Type.Union([Type.Null(), Type.Number()], { default: undefined }),
//     credit: Type.Union([Type.Null(), Type.Number()], { default: undefined }),
//     balance: Type.Union([Type.Null(), Type.Number()], { default: undefined }),
//     transaction_mode: Type.Union(
//       [
//         Type.Literal('monthly_interest'),
//         Type.Literal('upi'),
//         Type.Literal('unknown'),
//         Type.Literal('imps'),
//         Type.Literal('atm'),
//         Type.Literal('neft'),
//         Type.Literal('nach'),
//         Type.Literal('emi'),
//       ],
//       { default: undefined },
//     ),
//     transaction_category: Type.Union(
//       [
//         Type.Literal('food'),
//         Type.Literal('bike'),
//         Type.Literal('domestic'),
//         Type.Literal('deposit'),
//         Type.Literal('shopping'),
//         Type.Literal('petrol'),
//         Type.Literal('grocery'),
//         Type.Literal('transport'),
//         Type.Literal('medical'),
//         Type.Literal('entertainment'),
//         Type.Literal('online_payment'),
//         Type.Literal('bank_mandate'),
//         Type.Literal('personal'),
//         Type.Literal('cash_transfer'),
//         Type.Literal('emi'),
//         Type.Literal('atm_cash'),
//         Type.Literal('salary'),
//         Type.Literal('bank_transfer'),
//         Type.Literal('unknown'),
//       ],
//       { default: undefined },
//     ),
//     // ! json needs to be parsed
//     additional_meta: Type.String({ default: undefined }),
//     // ! json needs to be parsed
//     tags: Type.String({ default: undefined }),
//     created_at: Type.String({ default: undefined }),
//     updated_at: Type.String({ default: undefined }),
//   }),
// ).Decode((value) => {
//   return {
//     ...value,
//     transaction_at: new Date(value.transaction_at),
//     created_at: new Date(value.created_at),
//     updated_at: new Date(value.updated_at),
//     additional_meta: safeParseJSON(value.additional_meta, {}),
//     tags: safeParseJSON(value.tags, []),
//   }
// }).Encode((value) => {
//   return {
//     ...value,
//     transaction_at: value.transaction_at.toISOString(),
//     created_at: value.created_at.toISOString(),
//     updated_at: value.updated_at.toISOString(),
//     tags: JSON.stringify(value.tags),
//     additional_meta: JSON.stringify(value.additional_meta),
//   }
// })
