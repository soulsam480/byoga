import type { Static, StaticDecode } from '@sinclair/typebox/type'
import { Type } from '@sinclair/typebox/type'
import type { KebabCase } from 'scule'
import { kebabCase, snakeCase } from 'scule'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { dateFormat } from '../../utils/date'

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
    const { mode, ref } = parseMeta(value)

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
      mode,
      ref,
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

export const TransactionC = TypeCompiler.Compile(TransactionT)

export type TTransaction = StaticDecode<typeof TransactionT>
export type TTransactionInput = Static<typeof TransactionT>

export const TransactionModeT = Type.Transform(
  Type.Union([
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
    Type.Literal(''),
    Type.Literal('EMI'),
  ]),
)
  .Decode((value) => {
    switch (value) {
      case 'MONTHLY SAVINGS INTEREST CREDIT':
        return 'monthly_interest'

      case 'UPI-REV':
        return 'upi'

      case '':
        return 'unknown'

      default:
        return snakeCase(value)
    }
  })
  .Encode((value) => {
    switch (value) {
      case 'monthly_interest':
        return 'MONTHLY SAVINGS INTEREST CREDIT'

      case 'upi':
        return 'UPI'

      case 'unknown':
        return ''

      default:
        return kebabCase(value).toUpperCase() as Uppercase<
          KebabCase<typeof value>
        >
    }
  })

const TransactionModeC = TypeCompiler.Compile(TransactionModeT)

export type TTransactionMode = StaticDecode<typeof TransactionModeT>

function parseMeta(transaction: TTransactionInput): { mode: TTransactionMode, ref: string | null } {
  let mode: TTransactionMode = 'unknown'
  let ref: null | string = null

  const parts = transaction.Particulars.split('/')

  if (parts.length === 0 && (ref = parseEmiRef(transaction.Particulars)) !== null) {
    return {
      mode,
      ref,
    }
  }

  mode = TransactionModeC.Decode(parts[0])

  ref = extractRef(transaction, mode, parts.slice(1))

  return {
    mode,
    ref,
  }
}

function extractRef(transaction: TTransactionInput, mode: TTransactionMode, parts: string[]) {
  switch (mode) {
    case 'neft':
      return parts.slice(1).find(it => /[0-9A-Z]{16}/.test(it)) ?? null

    case 'unknown':
      return null

    case 'monthly_interest':
      return getMonthlyInterestRef(transaction['Transaction Date'])

    default:
      return parts.slice(1).find(it => /[0-9A-Z]{12}/.test(it)) ?? null
  }
}

function getMonthlyInterestRef(date: string) {
  const parsed = new Date(Date.parse(date))

  return `monthly_interest_${dateFormat(parsed).ddmmyyyy()}`
}

// function TRANSACTION_ID_RE
//   // eslint-disable-next-line regexp/optimal-quantifier-concatenation
//   = /^(?:[a-zA-Z\s-]+\/)+(?<ref>[0-9A-Z]{12,16}).*/gm

const EMI_RE = /^EMI\sDEBIT\s(?<ref>\d{9})$/gm

function parseEmiRef(value: string): string | null {
  return value.match(EMI_RE)?.groups?.ref ?? null
}
