import { serializeTransaction } from './transaction'

type TSerializer = (row: Record<string, any>) => Record<string, any>

export const SERIALIZER_REGISTRY: Record<string, TSerializer> = {
  transactions: serializeTransaction
}

// export const SCHEMA_REGISTRY: Record<string, TTransform<TAnySchema>> = {
//   // @ts-expect-error don't know
//   transactions: TransactionSchema,
// }
