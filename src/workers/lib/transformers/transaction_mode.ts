import type { StaticDecode } from '@sinclair/typebox'
import type { KebabCase } from 'scule'
import { Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { kebabCase, snakeCase } from 'scule'

const TransactionModeT = Type.Transform(
  Type.Union([
    Type.Literal(''),
    Type.Literal('IMPS-RIB'),
    Type.Literal('UPI'),
    Type.Literal('NEFT'),
    Type.Literal('MONTHLY SAVINGS INTEREST CREDIT'),
    Type.Literal('IMPS-OPM'),
    Type.Literal('IMPS-INET'),
    Type.Literal('UPI-REV'),
    Type.Literal('NACH'),
    Type.Literal('IMPS-MOB'),
    Type.Literal('ATM-NFS'),
    Type.Literal('EMI'),
  ]),
).Decode((value) => {
  switch (value) {
    case 'MONTHLY SAVINGS INTEREST CREDIT':
      return 'monthly_interest'

    case 'UPI-REV':
      return 'upi'

    case '':
      return 'unknown'

    case 'IMPS-INET':
    case 'IMPS-MOB':
    case 'IMPS-OPM':
    case 'IMPS-RIB':
      return 'imps'

    case 'ATM-NFS':
      return 'atm'

    default:
      return snakeCase(value)
  }
}).Encode((value) => {
  switch (value) {
    case 'monthly_interest':
      return 'MONTHLY SAVINGS INTEREST CREDIT'

    case 'upi':
      return 'UPI'

    case 'unknown':
      return ''

    case 'imps':
      return 'IMPS-INET'

    case 'atm':
      return 'ATM-NFS'

    default:
      return kebabCase(value).toUpperCase() as Uppercase<
        KebabCase<typeof value>
      >
  }
})

/**
 * @private
 */
export const TransactionModeC = TypeCompiler.Compile(TransactionModeT)

/**
 * @private
 */
export type TTransactionMode = StaticDecode<typeof TransactionModeT>
