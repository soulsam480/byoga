import type { Kysely, Migration } from 'kysely'

export const Migration1728833999032AddEventToTransaction: Migration = {
  async up(db: Kysely<any>) {
    await db.schema
      .alterTable('transactions')
      .addColumn('event_id', 'integer', col => col.references('events.id'))
      .execute()
  },
  async down(db: Kysely<any>) {
    await db.schema.alterTable('transactions').dropColumn('event_id').execute()
  }
}
