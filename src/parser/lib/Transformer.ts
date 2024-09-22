import type { TransactionInsert, TransactionModel } from '../../db/schema'
import type { IntermediateMetaResult } from './banks/idfc'
import type { IRawTransactionRow } from './FileReader'

export abstract class Transformer {
  abstract transform(rows: IRawTransactionRow[]): TransactionInsert[]

  static optionalInteger(value: string | number | null | undefined) {
    return !value ? null : Number(value)
  }
}

/**
 * // TODO: Next plans for parsing
 * // - impl a formatted string setup
 * // - i.e. when meta is entered in certain format, it'll be easier to parse
 * // - something like f:category-tag-place-recipient etc.
 */

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
  r: 'description',
}

export function parseFormattedTransaction() {
  return (ctx: IntermediateMetaResult) => {
    const formattedTransaction = ctx.parts.at(-1)

    if (formattedTransaction === undefined)
      return ctx

    const chunks = Array.from(
      formattedTransaction.match(STRING_CHUNK_RE) ?? [],
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
      const match
        = EXPRESSION_RE.test(item.trim())
        && item.trim().length === 1
        && (item.endsWith(' ') || chunks[i + 1]?.startsWith(' '))

      if (!match)
        continue

      const res = i * 2

      if (last !== undefined) {
        indices[indices.length - 1] = [
          ...last,
          item.endsWith(' ') ? res - 1 : res,
        ]
      }

      indices.push([item.startsWith(' ') ? res + 1 : res])
    }

    const { category, ...rest }: IFormattedMeta
      = indices.reduce<IFormattedMeta>(
        (acc, curr) => {
          const chunk = formattedTransaction.slice(curr[0], curr[1])

          const [expr, ...value] = chunk.split(' ')

          return {
            ...acc,
            [EXPRESSION_TO_PROPERTY_MAP[expr.toLowerCase() as TExpression]]:
              value.join(' '),
          }
        },
        {
          category: 'unknown',
        },
      )

    ctx.categories.add(category)
    Object.keys(rest).forEach(it => ctx.tags.add(it))

    ctx.additional = {
      ...ctx.additional,
      ...rest,
    }

    return ctx
  }
}
