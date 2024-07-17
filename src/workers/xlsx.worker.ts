import { read, utils } from 'xlsx'
import Papa from 'papaparse'
import * as R from 'remeda'
import { logger } from '../lib/utils/logger'
import { startDatabase } from '../db/lib/migrator'
import { db } from '../db/client'
import type { TransactionInsert } from '../db/table'
import { TransactionC } from './lib/transformers/transaction'
import type { TTransaction } from './lib/transformers/transaction'

const SHEET_NAME = 'Account Statement'

export class ExcelWorker {
  async process(file: File): Promise<TTransaction[]> {
    const csv = await this.parseXLSX(file)

    if (csv === null)
      return []

    // // TODO: next steps
    // // 1. create db
    // // 2. put schema and migrations
    // // 3. feed data to DB
    //  // 4. extract UID from meta and try using it to dedupe
    // // 5. feed via transactions ?

    const results = R.pipe(csv, this.parseCSV, this.normalize)

    await this.import(results)

    return results
  }

  // === LOGIC ===

  private async import(transactions: TTransaction[]) {
    await startDatabase()

    logger.info(`[IMPORT]: started importing ${transactions.length} transactions.`)

    await db.transaction().execute(async (trx) => {
      for (const transaction of transactions) {
        const { transaction_date, value_date: _, ...rest } = transaction

        const payload: TransactionInsert = {
          ...rest,
          transaction_at: new Date(transaction_date),
          created_at: new Date(),
          updated_at: new Date(),
        }

        await trx
          .insertInto('transactions')
          .values(payload)
          .onConflict(qb =>
            qb.column('transaction_ref').doNothing(),
          )
          .returning('id')
          .execute()
      }
    })

    logger.info(`[IMPORT]: Done importing ${transactions.length} transactions.`)
  }

  private async parseXLSX(file: File) {
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
      logger.warn('Error parsing file', error)

      return null
    }
  }

  private parseCSV(csv: string) {
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

  private normalize(values: unknown[]) {
    const result: TTransaction[] = []

    for (let index = 0; index < values.length; index++) {
      const element = values[index]

      try {
        const value = TransactionC.Decode(element)
        result.push(value)
      }
      catch (error) {
        logger.warn('Error normalizing', element, 'with', error)
        continue
      }
    }

    return result
  }
}
