import type { TransactionInsert } from '@/db/schema'
import type { FileReader } from '@/parser/lib/FileReader'
import type { Transformer } from '@/parser/lib/Transformer'

export abstract class Processor {
  abstract get reader(): FileReader
  abstract get transformer(): Transformer

  abstract process(file: File): Promise<TransactionInsert[]>
}
