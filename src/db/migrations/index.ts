import type { Migration } from 'kysely'
import { Migration1720360595599AddTransaction } from './1720360595599_add_transaction'
import { Migration1728796142436AddEvent } from './1728796142436_add_event'
import { Migration1728833999032AddEventToTransaction } from './1728833999032_add_event_to_transaction'
// IMPORT

export const migrations: Record<string, Migration> = {
  1720360595599: Migration1720360595599AddTransaction,
  1728796142436: Migration1728796142436AddEvent,
  1728833999032: Migration1728833999032AddEventToTransaction
  // REGISTER
}
