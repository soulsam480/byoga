import type { TransactionInsert } from '../../db/schema'
import type { FileReader } from './FileReader'
import type { Transformer } from './Transformer'

export abstract class Processor {
  abstract get reader(): FileReader
  abstract get transformer(): Transformer

  abstract process(file: File): Promise<TransactionInsert[]>
}
