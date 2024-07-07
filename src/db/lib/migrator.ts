import type { MigrationResultSet } from 'kysely'
import { Migrator } from 'kysely'
import { db } from '../client'

export const migrator = new Migrator({
  db,
  provider: {
    async getMigrations() {
      const { migrations } = await import('../migrations')

      return migrations
    },
  },
})

let dbPromise: Promise<MigrationResultSet> | null = null

export async function migrateUp() {
  if (dbPromise === null) {
    dbPromise = migrator.migrateToLatest()
  }

  return await dbPromise
}
