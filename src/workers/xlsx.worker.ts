import type { TSupportedBanks } from '@/parser/banks/supported'
import { Processor as IDFCProcessor } from '@/parser/banks/idfc'
import type { Processor } from '@/parser/lib/Parser'
import type { Constructor } from 'type-fest'

const BANK_TO_PROCESSOR: Record<TSupportedBanks, Constructor<Processor>> = {
  idfc: IDFCProcessor
}

export async function getTransactionRows(file: File, bank: TSupportedBanks) {
  const Processor = BANK_TO_PROCESSOR[bank]

  const processor = new Processor()

  return processor.process(file)
}
