import type { TTransactionInput } from '../transformers/transaction'
import type { TTransactionMode } from '../transformers/transaction_mode'
import type { TTransactionCategory } from './types'
import * as R from 'remeda'
import { dateFormat } from '../../../lib/utils/date'
import { logger } from '../../../lib/utils/logger'
import { TransactionModeC } from '../transformers/transaction_mode'

// ? === PUBLIC API ===

export interface IMetaResult {
  transaction_mode: TTransactionMode
  transaction_ref: string | null
  transaction_category: TTransactionCategory
  tags: string[]
  additional_meta: Record<string, string | null>
}

export function parseMeta(transaction: TTransactionInput): IMetaResult {
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
  transaction_mode: TTransactionMode
  transaction_ref: string | null
  transaction: TTransactionInput
  parts: string[]
  tags: Set<string>
  categories: Set<TTransactionCategory>
  additional: Record<string, string | null>
}

// === GUARDS ===
// guards are checks inside a conditional pipe

function hasLength(length: number) {
  return (result: IntermediateMetaResult) => {
    return Array.isArray(result.parts) && result.parts.length === length
  }
}

function isTransactionMode(mode: TTransactionMode) {
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
  transaction: TTransactionInput,
): IntermediateMetaResult {
  return {
    transaction,
    transaction_mode: 'unknown',
    parts: transaction.Particulars.split('/'),
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
  if (result.transaction.Particulars === 'MONTHLY SAVINGS INTEREST CREDIT') {
    result.categories.add('bank_transfer')
    result.tags.add('MONTHLY SAVINGS INTEREST')

    return {
      ...result,
      transaction_mode: 'monthly_interest',
      transaction_ref: createMonthlyInterestRef(
        result.transaction['Transaction Date'],
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
  try {
    return {
      ...result,
      transaction_mode: TransactionModeC.Decode(result.parts[0]),
    }
  }
  catch (error) {
    logger.warn('Error while parsing transaction mode for', result, error)

    return {
      ...result,
      transaction_mode: 'unknown',
    }
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
          result.transaction['Transaction Date'],
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

function execRegexp(regexp: RegExp, category: TTransactionCategory) {
  return (ctx: IntermediateMetaResult) => {
    let match: string | null = null
    // handle regexp match based on mode
    switch (ctx.transaction_mode) {
      case 'atm':
        {
          // attempt to capture location for atm
          const { location = null }
            = ctx.transaction.Particulars.match(regexp)?.groups ?? {}

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
        match = ctx.transaction.Particulars.match(regexp)?.groups?.tag ?? null

        break

      // imps needs to extract recipient
      case 'imps': {
        const { tag = 'transfer', recipient }
          = ctx.transaction.Particulars.match(regexp)?.groups ?? {}

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
          match = ctx.transaction.Particulars.split(' ').slice(1).join(' ').trim()
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

// ? === UPI spend ===
const FOOD_RE = /^food\s(?<tag_cat>\w+)|(?<tag>food|fod|fpod|foos|dood|fruit|coffe|lunch|dinner|juice|sweets|curd|chicken|mutton|milk|egg|coke|coconut|choco[a-z]+|iron\shill|swiggy|zomato)/i

const BIKE_RE = /^bike\s(?<tag_cat>\w+)|(?<tag>bike|motorcycle|suzuki|parking|balaklava)/i

const DOMESTIC_SPEND_RE
  = /^house\s(?<tag_cat>\w+)|(?<tag>house|rent|water|warer|service|fiber|cutlery|DTH|airtel|jio|recharge|station[ae]ry|filter|puja|murthy)/i

const DEPOSIT_RE = /(?<tag>RD|SBI|[Dd]eposit|Zerodha|SIP|LIC|Lic|lic)/

const ONLINE_SHOPPING_RE = /(?<tag>amazon|flipkart|online|order)/i

const PETROL_RE = /(?<tag>petrol|fuel|pretol)/i

const GROCERY_RE = /^grocery\s(?<tag_cat>\w+)|(?<tag>grocery|vegetable|bag|polythene)/i

const TRANSPORT_RE
  = /(?<tag>transport|taxi|bus|fare|cab|uber|rapido|cleartrip)/i

const MEDICAL_RE = /^medical\s(?<tag_cat>\w+)|(?<tag>medicine|medical|health|check up)/i

const ENTERTAINMENT_RE = /(?<tag>film|haikyuu)/i

const MERCHANT_PAYMENT_RE
  = /(?<tag>merchant|UPIIntent|PhonePe|Razorpay|BharatPe|FEDERAL\sEASYPAYMENTS|[Oo]nline|[Pp]ayment|[Tt]ransaction|UPI|[Cc]collect|request|[Pp]ay\s[Tt]o|DYNAMICQR|YESB)/

const AUTOPAY_RE = /(?<tag>autopay|mandate)/i

const PERSONAL_RE = /(?:(?:personal|shopping)\s(?<tag_cat>\w+))?(?<tag>clothes|decathlon|slipper|clothing|shopping|allowance|stuff)/i

const CASH_TRANSFER_RE = /^transfer\s(?<tag_cat>\w+)|(?<tag>atm\scash|cash|transfer|refund|lend)/i

// ? === Auto payment ===

const NACH_RE = /(?<tag>indian\sclearing\scorp)/i

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
 * // TODO: Next plans for parsing
 * // - impl a formatted string setup
 * // - i.e. when meta is entered in certain format, it'll be easier to parse
 * // - something like f:category-tag-place-recipient etc.
 */

const STRING_CHUNK_RE = /.{2}/g
const EXPRESSION_RE = /^[iplre]/i

type TExpression = 'i' | 'p' | 'l' | 'r' | 'e'

interface IFormattedMeta {
  category: TTransactionCategory
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

function parseFormattedTransaction() {
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
