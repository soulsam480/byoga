import type { TransactionInsert, TransactionModel } from '@/db/schema'
import type { IRawTransactionRow } from './FileReader'

/**
 * @private
 */
export interface IntermediateTransactionRepresentation {
  transaction_mode: TransactionModel['transaction_mode']
  transaction_ref: string | null
  transaction: IRawTransactionRow
  parts: string[]
  tags: Set<string>
  categories: Set<TransactionModel['transaction_category']>
  additional: Record<string, string | null>
}

const STRING_CHUNK_RE = /.{2}/g
const EXPRESSION_RE = /^[iplre]/i

type TExpression = 'i' | 'p' | 'l' | 'r' | 'e'

interface IFormattedMeta {
  category: TransactionModel['transaction_category']
  party?: string
  location?: string
  description?: string
  event?: string
}

const EXPRESSION_TO_PROPERTY_MAP: Record<TExpression, keyof IFormattedMeta> = {
  e: 'event',
  i: 'category',
  l: 'location',
  p: 'party',
  r: 'description'
}

const FORMATTED_TRANSACTION_RE = /^I\s.*/i

export abstract class Transformer {
  abstract transform(rows: IRawTransactionRow[]): TransactionInsert[]

  // 1. create base result for pipeline
  abstract createBaseResult(
    transaction: IRawTransactionRow
  ): IntermediateTransactionRepresentation

  // 2. find and set mode
  abstract parseTransactionMode(
    result: IntermediateTransactionRepresentation
  ): IntermediateTransactionRepresentation

  // 2. find and set ref
  abstract parseTransactionRef(
    result: IntermediateTransactionRepresentation
  ): IntermediateTransactionRepresentation

  // 3. additional meta data about a transaction
  abstract parseTransactionMeta(
    result: IntermediateTransactionRepresentation
  ): IntermediateTransactionRepresentation

  static hasLength(length: number) {
    return (result: IntermediateTransactionRepresentation) => {
      return Array.isArray(result.parts) && result.parts.length === length
    }
  }

  static isTransactionMode(mode: TransactionModel['transaction_mode']) {
    return (ctx: IntermediateTransactionRepresentation) => {
      return ctx.transaction_mode === mode
    }
  }

  static isFormattedUPITransaction() {
    return (ctx: IntermediateTransactionRepresentation) => {
      return (
        ctx.transaction_mode === 'upi' &&
        FORMATTED_TRANSACTION_RE.test(ctx.parts.at(-1) ?? '')
      )
    }
  }

  static parseFormattedTransaction() {
    return (ctx: IntermediateTransactionRepresentation) => {
      const formattedTransaction = ctx.parts.at(-1)

      if (formattedTransaction === undefined) return ctx

      const chunks = Array.from(
        formattedTransaction.match(STRING_CHUNK_RE) ?? []
      )

      const indices: number[][] = []

      for (let i = 0; i < chunks.length; i++) {
        const item = chunks[i]

        const last = indices[indices.length - 1]

        // 1. current is an expression
        // 2. current is only an expression
        // 3. current ends with whitespace
        // 4. next starts with whitespace
        // ? last two rules are significant as they assert we only take expressions as anchors
        const match =
          EXPRESSION_RE.test(item.trim()) &&
          item.trim().length === 1 &&
          (item.endsWith(' ') || chunks[i + 1]?.startsWith(' '))

        if (!match) continue

        const res = i * 2

        if (last !== undefined) {
          indices[indices.length - 1] = [
            ...last,
            item.endsWith(' ') ? res - 1 : res
          ]
        }

        indices.push([item.startsWith(' ') ? res + 1 : res])
      }

      const { category, ...rest }: IFormattedMeta =
        indices.reduce<IFormattedMeta>(
          (acc, curr) => {
            const chunk = formattedTransaction.slice(curr[0], curr[1])

            const [expr, ...value] = chunk.split(' ')

            // @ts-expect-error TODO: fix this
            acc[EXPRESSION_TO_PROPERTY_MAP[expr.toLowerCase() as TExpression]] =
              value.join(' ')

            return acc
          },
          {
            category: 'unknown'
          }
        )

      ctx.categories.add(category)
      for (const it in rest) {
        ctx.tags.add(it)
      }

      ctx.additional = {
        ...ctx.additional,
        ...rest
      }

      return ctx
    }
  }

  static defaultNull(value: string): string | null {
    return value.length === 0 ? null : value.replaceAll(',', '')
  }

  static optionalInteger(value: string | number | null): number | null {
    if (value === null || typeof value === 'number') return value
    return Number(value)
  }
}
