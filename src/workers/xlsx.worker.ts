import { read, utils } from 'xlsx'
import Papa from 'papaparse'
import * as R from 'remeda'
import { logger } from '../lib/utils/logger'
import type { TransactionInsert } from '../db/schema'
import { TransactionC } from './lib/transformers/transaction'

const SHEET_NAME = 'Account Statement'

export async function process(file: File): Promise<TransactionInsert[]> {
  const csv = await parseXLSX(file)

  if (csv === null)
    return []

  // // TODO: next steps
  // // 1. create db
  // // 2. put schema and migrations
  // // 3. feed data to DB
  //  // 4. extract UID from meta and try using it to dedupe
  // // 5. feed via transactions ?

  const results = R.pipe(csv, parseCSV, normalize)

  return results
}

// === LOGIC ===

async function parseXLSX(file: File) {
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

function parseCSV(csv: string) {
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

function normalize(values: unknown[]): TransactionInsert[] {
  const result: TransactionInsert[] = []

  for (let index = 0; index < values.length; index++) {
    const element = values[index]

    try {
      const { transaction_date, value_date: _, ...rest } = TransactionC.Decode(element)

      const payload: TransactionInsert = {
        ...rest,
        transaction_at: new Date(transaction_date),
        created_at: new Date(),
        updated_at: new Date(),
      }

      result.push(payload)
    }
    catch (error) {
      logger.warn('Error normalizing', element, 'with', error)
      continue
    }
  }

  return result
}
