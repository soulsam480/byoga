import * as R from 'remeda'
import { snakeCase } from 'scule'
import type { TransactionInsert, TransactionModel } from '../../../db/schema'
import type { IRawTransactionRow } from '../FileReader'
import { FileReader } from '../FileReader'
import { Processor } from '../Parser'
import { Transformer } from '../Transformer'
import { dateFormat } from '../../../lib/utils/date'
import {
  AUTOPAY_RE,
  BIKE_RE,
  CASH_TRANSFER_RE,
  DEPOSIT_RE,
  DOMESTIC_SPEND_RE,
  ENTERTAINMENT_RE,
  FOOD_RE,
  GROCERY_RE,
  MEDICAL_RE,
  MERCHANT_PAYMENT_RE,
  NACH_RE,
  ONLINE_SHOPPING_RE,
  PERSONAL_RE,
  PETROL_RE,
  TRANSPORT_RE,
} from '../regexp'

class IDFCFileReader extends FileReader {
  makeParsableCSV(values: string) {
    // 1. remove head meta
    values = `Transaction${values.split('\nTransaction')[1]}`

    // 2. remove tail meta
    return values.split('\n,Total')[0]
  }

  transformHeader(header: string): keyof IRawTransactionRow {
    return IDFCFileReader.UNKNOWN_TO_KNOWN_HEADER_MAP[header] ?? header
  }

  static UNKNOWN_TO_KNOWN_HEADER_MAP: Record<string, keyof IRawTransactionRow> = {
    'Transaction Date': 'transaction_date',
    'Particulars': 'meta',
    'Debit': 'debit',
    'Credit': 'credit',
    'Balance': 'balance',
  }
}

// ? === PUBLIC API ===

interface IMetaResult {
  transaction_mode: TransactionModel['transaction_mode']
  transaction_ref: string | null
  transaction_category: TransactionModel['transaction_category']
  tags: string[]
  additional_meta: Record<string, string | null>
}

export function parseMeta(transaction: IRawTransactionRow): IMetaResult {
  const result: IMetaResult = R.pipe(
    transaction,
    // 1. create base shape
    createBaseResult,
    // 2. handle non-standard cases first
    R.conditional(
      // 2.1 EMI and interest
      [hasLength(1), parseSingleMeta],
      // 2.2 everything else
      R.conditional.defaultCase(value =>
        R.pipe(
          value,
          // 2.2.1 extract mode
          parseTransactionMode,
          // 2.2.2 extract ref => to be used to dedupe transactions
          parseTransactionRef,
          // 2.2.3 additional meta => catrgory and tags
          parseAdditionalMeta,
        ),
      ),
    ),
    // 3. normalize
    ({ transaction_mode, transaction_ref, additional, categories, tags }) => {
      return {
        transaction_mode,
        transaction_ref,
        additional_meta: additional,
        tags: Array.from(tags),
        transaction_category: Array.from(categories)[0] ?? 'unknown',
      }
    },
  )

  return result
}

// ? === PRIVATE API ===

// TODO: plan for meta analysis
// // 1. based on GPT analysis, form groups and create regexes or string rules
//  // 2. read parts and categorize
//  // 3. also keep additional meta info based on category
// // for example. recipient, recurring transactions, payment platforms,
// // 4. we can put extra info as tags, which will make it easy to query. then we can aggregate and build
// tag intellisense ?

/**
 * @private
 */
export interface IntermediateMetaResult {
  transaction_mode: TransactionModel['transaction_mode']
  transaction_ref: string | null
  transaction: IRawTransactionRow
  parts: string[]
  tags: Set<string>
  categories: Set<TransactionModel['transaction_category']>
  additional: Record<string, string | null>
}

// === GUARDS ===
// guards are checks inside a conditional pipe

function hasLength(length: number) {
  return (result: IntermediateMetaResult) => {
    return Array.isArray(result.parts) && result.parts.length === length
  }
}

function isTransactionMode(mode: TransactionModel['transaction_mode']) {
  return (ctx: IntermediateMetaResult) => {
    return ctx.transaction_mode === mode
  }
}

const FORMATTED_TRANSACTION_RE = /^I\s.*/i

function isFormattedUPITransaction() {
  return (ctx: IntermediateMetaResult) => {
    return (
      ctx.transaction_mode === 'upi'
      && FORMATTED_TRANSACTION_RE.test(ctx.parts.at(-1) ?? '')
    )
  }
}

// === PARSERS ===
// parsers check and transform data inside a condition

function createBaseResult(
  transaction: IRawTransactionRow,
): IntermediateMetaResult {
  return {
    transaction,
    transaction_mode: 'unknown',
    parts: transaction.meta.split('/'),
    transaction_ref: null,
    categories: new Set(),
    tags: new Set(),
    additional: {},
  }
}

const EMI_REF_RE = /^EMI\sDEBIT\s(?<ref>\d{9})$/

function createMonthlyInterestRef(date: string) {
  const parsed = new Date(Date.parse(date))

  return `monthly_interest_${dateFormat(parsed).ddmmyyyy().replace(/\//g, '_')}`
}

function parseSingleMeta(
  result: IntermediateMetaResult,
): IntermediateMetaResult {
  if (result.transaction.meta === 'MONTHLY SAVINGS INTEREST CREDIT') {
    result.categories.add('bank_transfer')
    result.tags.add('MONTHLY SAVINGS INTEREST')

    return {
      ...result,
      transaction_mode: 'monthly_interest',
      transaction_ref: createMonthlyInterestRef(
        result.transaction.transaction_date,
      ),
    }
  }

  result.categories.add('emi')
  result.tags.add('EMI DEBIT')

  return {
    ...result,
    transaction_mode: 'emi',
    transaction_ref: result.parts[0].match(EMI_REF_RE)?.groups?.ref ?? null,
  }
}

function parseTransactionMode(
  result: IntermediateMetaResult,
): IntermediateMetaResult {
  let mode = IDFCTransformer.UNKNOWN_TO_KNOWN_TRANSACTION_MODE_MAP[result.parts[0]] ?? snakeCase(result.parts[0])

  if (mode.length === 0) {
    mode = 'unknown'
  }

  return {
    ...result,
    transaction_mode: mode,
  }
}

function parseTransactionRef(
  result: IntermediateMetaResult,
): IntermediateMetaResult {
  switch (result.transaction_mode) {
    case 'neft':
      return {
        ...result,
        transaction_ref:
          result.parts.slice(1).find(it => /[0-9A-Z]{16}/.test(it)) ?? null,
      }

    case 'unknown':
      return {
        ...result,
        transaction_ref: null,
      }

    case 'monthly_interest':
      return {
        ...result,
        transaction_ref: createMonthlyInterestRef(
          result.transaction.transaction_date,
        ),
      }

    default:
      return {
        ...result,
        transaction_ref:
          result.parts.slice(1).find(it => /[0-9A-Z]{12}/.test(it)) ?? null,
      }
  }
}

function execRegexp(regexp: RegExp, category: TransactionModel['transaction_category']) {
  return (ctx: IntermediateMetaResult) => {
    let match: string | null = null
    // handle regexp match based on mode
    switch (ctx.transaction_mode) {
      case 'atm':
        {
          // attempt to capture location for atm
          const { location = null }
            = ctx.transaction.meta.match(regexp)?.groups ?? {}

          ctx.categories.add(category)
          ctx.tags.add('CASH WITHDRAWAL')
          ctx.additional = { ...ctx.additional, location }
        }

        break

      // skip both as already handled
      case 'emi':
      case 'monthly_interest':
        break

      // neft and nach need the entire string
      case 'neft':
      case 'nach':
        match = ctx.transaction.meta.match(regexp)?.groups?.tag ?? null

        break

      // imps needs to extract recipient
      case 'imps': {
        const { tag = 'transfer', recipient }
          = ctx.transaction.meta.match(regexp)?.groups ?? {}

        ctx.categories.add(category)
        ctx.tags.add(tag)
        ctx.additional = { ...ctx.additional, recipient }

        break
      }

      // everything else
      default:
      {
        const { tag_cat = null, tag = null } = ctx.parts.at(-1)?.match(regexp)?.groups ?? {}

        // 1. if meta starts with category, we can directly take everything after whitespace
        if (tag_cat) {
          match = ctx.transaction.meta.split(' ').slice(1).join(' ').trim()
        }
        // 2. else treat capture as tag
        else {
          match = tag
        }

        break
      }
    }

    // after parsing if match found, take current category and add match as tag
    if (match !== null) {
      ctx.categories.add(category)

      if (ctx.tags.size === 0) {
        ctx.tags.add(match)
      }
    }
    // otherwise put last chunk as tag and move on
    else if (ctx.tags.size === 0 && ctx.parts.at(-1) !== undefined) {
      ctx.tags.add(ctx.parts[ctx.parts.length - 1])
    }

    return ctx
  }
}

type RegexpGenerator = (ctx: IntermediateMetaResult) => RegExp

// ? === ATM ===
const ATM_RE: RegexpGenerator = ctx =>
  new RegExp(
    `^atm[\\w-]+\/[\\w\\s-]+\/(?<location>[\\w\\s-]+)\/${ctx.transaction_ref ?? ''}\/.*$`,
    'i',
  )

// ? === transfer ===
const SALARY_RE = /(?<tag>rzpx\sprivate)/i

const NEFT_RE: RegexpGenerator = ctx =>
  new RegExp(`NEFT\/${ctx.transaction_ref ?? ''}\/(?<tag>[\\w\\s-]+)`)

const IMPS_RE: RegexpGenerator = ctx =>
  new RegExp(
    `${ctx.transaction_ref ?? ''}\/(?<recipient>[\\w\\s-]+)\/.*\/(?<tag>[\\w\\s-]+)$`,
    'i',
  )

/**
 * @private
 */
export function parseAdditionalMeta(ctx: IntermediateMetaResult) {
  const result = R.pipe(
    ctx,
    R.conditional(
      [isTransactionMode('nach'), execRegexp(NACH_RE, 'bank_mandate')],
      [isTransactionMode('atm'), execRegexp(ATM_RE(ctx), 'atm_cash')],
      [
        isTransactionMode('neft'),
        (value: IntermediateMetaResult) =>
          R.pipe(
            value,
            execRegexp(SALARY_RE, 'salary'),
            execRegexp(NEFT_RE(ctx), 'bank_transfer'),
          ),
      ],
      [isTransactionMode('imps'), execRegexp(IMPS_RE(ctx), 'bank_transfer')],
      [isFormattedUPITransaction(), parseFormattedTransaction()],
      R.conditional.defaultCase(value =>
        R.pipe(
          value,
          execRegexp(FOOD_RE, 'food'),
          execRegexp(BIKE_RE, 'bike'),
          execRegexp(DOMESTIC_SPEND_RE, 'domestic'),
          execRegexp(DEPOSIT_RE, 'deposit'),
          execRegexp(ONLINE_SHOPPING_RE, 'shopping'),
          execRegexp(PETROL_RE, 'petrol'),
          execRegexp(GROCERY_RE, 'grocery'),
          execRegexp(TRANSPORT_RE, 'transport'),
          execRegexp(MEDICAL_RE, 'medical'),
          execRegexp(ENTERTAINMENT_RE, 'entertainment'),
          execRegexp(MERCHANT_PAYMENT_RE, 'online_payment'),
          execRegexp(AUTOPAY_RE, 'bank_mandate'),
          execRegexp(PERSONAL_RE, 'personal'),
          execRegexp(CASH_TRANSFER_RE, 'cash_transfer'),
        ),
      ),
    ),
  )

  if (result.categories.size === 0) {
    result.categories.add('unknown')
  }

  return result
}

class IDFCTransformer extends Transformer {
  static UNKNOWN_TO_KNOWN_TRANSACTION_MODE_MAP: Record<string, TransactionModel['transaction_mode']> = {
    'MONTHLY SAVINGS INTEREST CREDIT': 'monthly_interest',
    'UPI-REV': 'upi',
    'IMPS-INET': 'imps',
    'IMPS-MOB': 'imps',
    'IMPS-OPM': 'imps',
    'IMPS-RIB': 'imps',
    'ATM-NFS': 'atm',
  }
}

export class IDFCParser extends Processor {
  get reader() {
    return new IDFCFileReader('Account Statement')
  }

  get transformer() {
    return new IDFCTransformer()
  }

  async process(file: File): Promise<TransactionInsert[]> {
    const csvRows = await this.reader.parse(file)

    return this.transformer.transform(
      csvRows,
    )
  }
}
