import { db } from '../../db/client'
import type { TransactionInsert } from '../../db/schema'
import { showAlert } from '../../lib/components/Alerts'
import { invalidateQuery } from '../../lib/query/useQuery'
import { logger } from '../../lib/utils/logger'

/**
 * - saves processed transactions to database
 * - ignores duplicate transactions based on `transaction_ref`
 */
export class Feeder {
  async feed(transactions: TransactionInsert[]) {
    showAlert({
      type: 'info',
      message: `Started importing ${transactions.length} transactions!`,
    })

    logger.info(`[IMPORT]: started importing ${transactions.length} transactions.`)

    await db.transaction().execute(async (trx) => {
      for (const transaction of transactions) {
        await trx
          .insertInto('transactions')
          .values(transaction)
          .onConflict(qb =>
            qb.column('transaction_ref').doNothing(),
          )
          .returning('id')
          .execute()
      }
    })

    logger.info(`[IMPORT]: Done importing ${transactions.length} transactions.`)

    showAlert({
      type: 'success',
      message: `Imported ${transactions.length} transactions!`,
    })

    void invalidateQuery('*')
  }
}
