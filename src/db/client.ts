import type { Database } from './schema'
import { Kysely, ParseJSONResultsPlugin } from 'kysely'
import { SQLocalKysely } from 'sqlocal/kysely'
import { kyselyLogger } from './lib/logger'
import { TypeBoxModelsPlugin } from './lib/plugins/models'

const databasePath = import.meta.env.PROD ? 'db.sqlite3' : 'development/db.sqlite3'

async function deleteDB() {
  let opfsRoot = await window.navigator.storage.getDirectory()

  const parts = databasePath.split('/')

  for (let index = 0; index < parts.length; index++) {
    const element = parts[index]

    const isLast = index === parts.length - 1

    if (isLast) {
      await opfsRoot.removeEntry(element)
      break
    }

    opfsRoot = await opfsRoot.getDirectoryHandle(element)
  }
}

const { dialect, sql, destroy } = new SQLocalKysely(databasePath)

const db = new Kysely<Database>({
  dialect,
  log: kyselyLogger,
  plugins: [
    new TypeBoxModelsPlugin(),
    new ParseJSONResultsPlugin(),
  ],
})

export { db, deleteDB, destroy, sql }
