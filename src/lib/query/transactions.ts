import { db } from '../../db/client'

export async function addEventToTransactions(
  rowIds: number[],
  eventId: number
) {
  await db.transaction().execute(async trx => {
    for (const rowId of rowIds) {
      await trx
        .updateTable('transactions')
        .set({ event_id: eventId })
        .where('transactions.id', '=', rowId)
        .executeTakeFirst()
    }
  })
}
