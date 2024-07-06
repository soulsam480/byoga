import * as R from 'remeda'
import { dateFormat } from '../../../utils/date'
import { logger } from '../../../utils/logger'
import type { TTransactionInput } from '../transformers/transaction'
import type { TTransactionMode } from '../transformers/transaction_mode'
import { TransactionModeC } from '../transformers/transaction_mode'

export interface IMetaResult {
  transaction_mode: TTransactionMode
  transaction_ref: string | null
}

interface IntermediateMetaResult extends IMetaResult {
  transaction: TTransactionInput
  parts: string[]
}

// === GUARDS ===
// guards are checks inside a conditional pipe

function hasLength(length: number) {
  return (result: IntermediateMetaResult) => {
    return Array.isArray(result.parts) && result.parts.length === length
  }
}

// === PARSERS ===
// parsers check and transform data inside a condition

function createBaseResult(
  transaction: TTransactionInput,
): IntermediateMetaResult {
  return {
    transaction,
    transaction_mode: 'unknown',
    parts: transaction.Particulars.split('/'),
    transaction_ref: null,
  }
}

const EMI_RE = /^EMI\sDEBIT\s(?<ref>\d{9})$/

function parseEMI(result: IntermediateMetaResult): IntermediateMetaResult {
  return {
    ...result,
    transaction_mode: 'emi',
    transaction_ref: result.parts[0].match(EMI_RE)?.groups?.ref ?? null,
  }
}

function parseTransactionMode(
  result: IntermediateMetaResult,
): IntermediateMetaResult {
  try {
    return {
      ...result,
      transaction_mode: TransactionModeC.Decode(result.parts[0]),
    }
  }
  catch (error) {
    logger.warn('Error while parsing transaction mode for', result)

    return {
      ...result,
      transaction_mode: 'unknown',
    }
  }
}

function parseTransactionRef(result: IntermediateMetaResult): IntermediateMetaResult {
  switch (result.transaction_mode) {
    case 'neft':
      return {
        ...result,
        transaction_ref: result.parts.slice(1).find(it => /[0-9A-Z]{16}/.test(it)) ?? null,
      }

    case 'unknown':
      return {
        ...result,
        transaction_ref: null,
      }

    case 'monthly_interest':
      return {
        ...result,
        transaction_ref: createMonthlyInterestRef(result.transaction['Transaction Date']),
      }

    default:
      return {
        ...result,
        transaction_ref: result.parts.slice(1).find(it => /[0-9A-Z]{12}/.test(it)) ?? null,
      }
  }
}

function createMonthlyInterestRef(date: string) {
  const parsed = new Date(Date.parse(date))

  return `monthly_interest_${dateFormat(parsed).ddmmyyyy()}`
}

// TODO: plan for meta analysis
// 1. based on GPT analysis, form groups and create regexes or string rules
// 2. read parts and categorize
// 3. also keep additional meta info based on category
// for example. recipient, recurring transactions, payment platforms,
// 4. we can put extra info as tags, which will make it easy to query. then we can aggregate and build
// tag intellisense
// function parse(params: type) {

// }

export function parseMeta(transaction: TTransactionInput): IMetaResult {
  const result: IMetaResult = R.pipe(
    transaction,
    // 1. create base shape
    createBaseResult,
    // 2. handle non-standard cases first
    R.conditional(
      // 2.1 EMI
      [hasLength(1), parseEMI],
      // 2.2 everything else
      R.conditional.defaultCase(value =>
        R.pipe(value, parseTransactionMode, parseTransactionRef),
      ),
    ),
    // 3. normalize
    ({ transaction_mode, transaction_ref }) => {
      return {
        transaction_mode,
        transaction_ref,
      }
    },
  )

  return result
}
