import type { Kysely, Migration } from 'kysely'

export const Migration1728796142436AddEvent: Migration = {
  async up(db: Kysely<any>) {
    await db.schema
      .createTable('events')
      .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
      .addColumn('name', 'text')
      .addColumn('start_at', 'text')
      .addColumn('end_at', 'text')
      .execute()
  },
  async down(db: Kysely<any>) {
    await db.schema.dropTable('events').execute()
  },
}
