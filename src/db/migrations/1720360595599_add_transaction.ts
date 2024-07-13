import { type Kysely, type Migration, sql } from 'kysely'

export const Migration1720360595599AddTransaction: Migration = {
  async up(db: Kysely<any>) {
    await db.schema
      .createTable('transactions')

      .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())

      .addColumn('transaction_at', 'text', col => col.notNull())

      .addColumn('meta', 'text', col => col.notNull())

      .addColumn('cheque_no', 'integer')

      .addColumn('debit', 'integer')

      .addColumn('credit', 'integer')

      .addColumn('balance', 'integer')

      .addColumn('transaction_mode', 'text', col => col.notNull())

      .addColumn('transaction_ref', 'text', col => col.unique())

      .addColumn('transaction_category', 'text', col => col.notNull())

      .addColumn('additional_meta', 'text', col => col.defaultTo('{}'))

      .addColumn('tags', 'text', col => col.defaultTo('[]'))

      .addColumn('created_at', 'text', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())

      .addColumn('updated_at', 'text', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())

      .execute()
  },
  async down(db: Kysely<any>) {
    await db.schema.dropTable('transactions').execute()
  },
}
