import type { Static, StaticDecode } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { parseMeta } from '../parsers/meta'
import type { TTransactionMode } from './transaction_mode'

function deafaultNull(value: string): string | null {
  return value.length === 0 ? null : value
}

const TransactionT = Type.Transform(
  Type.Object({
    'Transaction Date': Type.String(),
    'Value Date': Type.String(),
    'Particulars': Type.String(),
    'Cheque No.': Type.String(),
    'Debit': Type.String(),
    'Credit': Type.String(),
    'Balance': Type.String(),
  }),
)
  .Decode((value) => {
    const {
      transaction_mode,
      transaction_ref,
      additional_meta,
      tags,
      transaction_category,
    } = parseMeta(value)

    return {
      transaction_date: new Date(
        Date.parse(value['Transaction Date']),
      ).toISOString(),
      value_date: new Date(Date.parse(value['Value Date'])).toISOString(),
      meta: value.Particulars,
      cheque_no: deafaultNull(value['Cheque No.']),
      debit: deafaultNull(value.Debit),
      credit: deafaultNull(value.Credit),
      balance: deafaultNull(value.Balance),
      transaction_mode: transaction_mode as TTransactionMode,
      transaction_ref,
      transaction_category,
      additional_meta,
      tags,
    }
  })
  .Encode((value) => {
    return {
      'Transaction Date': value.transaction_date,
      'Value Date': value.value_date,
      'Particulars': value.meta,
      'Cheque No.': value.cheque_no ?? '',
      'Debit': value.debit ?? '',
      'Credit': value.credit ?? '',
      'Balance': value.balance ?? '',
    }
  })

/**
 * @private
 */
export const TransactionC = TypeCompiler.Compile(TransactionT)

/**
 * @private
 */
export type TTransaction = StaticDecode<typeof TransactionT>

/**
 * @private
 */
export type TTransactionInput = Static<typeof TransactionT>
