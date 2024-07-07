import type { Migration } from 'kysely'
import { Migration1720360595599AddTransaction } from './1720360595599_add_transaction'
// IMPORT

export const migrations: Record<string, Migration> = {
  1720360595599: Migration1720360595599AddTransaction,
  // REGISTER
}
