import { read, utils } from 'xlsx'
import Papa from 'papaparse'
import type { StaticDecode } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { logger } from '../utils/logger'

const SHEET_NAME = 'Account Statement'

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
    return {
      transaction_date: new Date(Date.parse(value['Transaction Date'])).toISOString(),
      value_date: new Date(Date.parse(value['Value Date'])).toISOString(),
      meta: value.Particulars,
      cheque_no: value['Cheque No.'],
      debit: value.Debit,
      credit: value.Credit,
      balance: value.Balance,
    }
  })
  .Encode((value) => {
    return {
      'Transaction Date': value.transaction_date,
      'Value Date': value.value_date,
      'Particulars': value.meta,
      'Cheque No.': value.cheque_no,
      'Debit': value.debit,
      'Credit': value.credit,
      'Balance': value.balance,
    }
  })

export type TransactionR = StaticDecode<typeof TransactionT>

export class ExcelWorker {
  async process(file: File) {
    const csv = await this.parse(file)

    if (csv === null)
      return null

    // TODO: next steps
    // 1. create db
    // 2. put schema and migrations
    // 3. feed data to DB
    // 4. extract UID from meta and try using it to dedupe
    // 5. feed via transactions ?
    // eslint-disable-next-line no-console
    console.log(this.transform(this.extractTransactions(csv)))
  }

  private async parse(file: File) {
    const book = read(await file.arrayBuffer())

    const workSheet = book.Sheets[SHEET_NAME]

    if (workSheet === undefined) {
      return null
    }

    try {
      return utils.sheet_to_csv(workSheet, {
        blankrows: false,
        skipHidden: true,
      })
    }
    catch (error) {
      logger.error('Error parsing', error)

      return null
    }
  }

  private extractTransactions(csv: string) {
    // TODO: plan how do we use meta

    // 1. remove head meta
    let toProcess = `Transaction${csv.split('\nTransaction')[1]}`

    // 2. remove tail meta
    toProcess = toProcess.split('\n,Total')[0]

    const res = Papa.parse(toProcess, { header: true })

    if (res.errors.length === 0) {
      return res.data
    }

    return []
  }

  private transform(values: unknown[]) {
    const result: TransactionR[] = []

    for (let index = 0; index < values.length; index++) {
      const element = values[index]

      try {
        const value = Value.Decode(TransactionT, element)
        result.push(value)
      }
      catch (error) {
        logger.error('Error transforming', error)
        continue
      }
    }

    return result
  }
}
