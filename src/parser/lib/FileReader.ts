import Papa from 'papaparse'
import type { Sheet2CSVOpts } from 'xlsx'
import { read, utils } from 'xlsx'

export interface IRawTransactionRow {
  transaction_date: string
  meta: string
  // TODO: check if we need it
  // 'Cheque No.': string
  debit: string
  credit: string
  balance: string
}

const XLSX_TYPES = new Set([
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

export abstract class FileReader {
  constructor(private readonly sheet_name: string) {}

  /**
   * - usually a bank statement has some meta info about account and others on
   * top of the file.
   * - when parsing CSV rows, these can break the parser and results
   * can be un-intended.
   * - so we have to strip out head and tail data to only return a parsable
   * csv data
   */
  abstract makeParsableCSV(values: string): string

  /**
   * - We ned a known output format for transformer to process
   * - so here we'll serialize unknown headers to known ones
   */
  abstract transformHeader(header: string, index: number): keyof IRawTransactionRow

  /**
   * - returns transaction rows that can be passed to transformer
   * - has access to {@link xlsxToCSV} and {@link parseCSV} to help read file
   */
  async parse(file: File) {
    let csv: string

    if (XLSX_TYPES.has(file.type)) {
      csv = await this.xlsxToCSV(file)
    }
    else {
      csv = await file.text()
    }

    return this.parseCSV(csv)
  }

  /**
   * - convert a XLSX file to CSV
   * - takes the sheet name from constructor
   */
  protected async xlsxToCSV(file: File, opts: Sheet2CSVOpts = {}) {
    const book = read(await file.arrayBuffer())

    const workSheet = book.Sheets[this.sheet_name]

    if (workSheet === undefined) {
      throw new Error(`worksheet ${this.sheet_name} doesn't exist.`)
    }

    return utils.sheet_to_csv(workSheet, {
      ...opts,
      blankrows: false,
      skipHidden: true,
    })
  }

  /**
   * convert csv to array of transaction rows
   * Return type is array of unknown records as csv headers vary for different banks
   */
  protected parseCSV(csv: string, config: Papa.ParseConfig = {}): Array<IRawTransactionRow> {
    const res = Papa.parse(
      this.makeParsableCSV(csv),
      {
        ...config,
        header: true,
        transformHeader: this.transformHeader.bind(this),
      },
    )

    if (res.errors.length === 0) {
      return res.data
    }

    return []
  }
}
