import type { EventInsert } from '../../db/schema'
import { db } from '../../db/client'
import { invalidateQuery, useQuery } from '../query/useQuery'

export function useEvents() {
  const { value: events } = useQuery(['events'], async () => {
    return await db.selectFrom('events').select(['id', 'name']).execute()
  }, {
    defautlValue: [],
  })

  return {
    events,
  }
}

export async function createEvent(payload: EventInsert) {
  const created = await db.insertInto('events')
    .values(payload)
    .returning(['name', 'id'])
    .executeTakeFirstOrThrow()

  await invalidateQuery(['events'])

  return created
}
