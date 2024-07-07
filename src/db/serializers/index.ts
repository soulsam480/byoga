import { serializeTransaction } from './transaction'

type TTransformer = (row: Record<string, any>) => Record<string, any>

export const SERIALIZER_REGISTRY: Record<string, TTransformer> = {
  transactions: serializeTransaction,
}
