import { sql } from 'kysely'
import { db } from '../../../db/client'
import { startDatabase } from '../../../db/lib/migrator'
import { useQuery } from '../../query/useQuery'
import { dateFormat } from '../../utils/date'

export function TransactionsTable() {
  const { value: transactions } = useQuery(['transaction_month'], async () => {
    await startDatabase()

    return await db
      .selectFrom('transactions')
      .select(['id', 'transaction_at', 'balance'])
      .orderBy(sql`unixepoch(transaction_at)`, 'asc')
      .execute()
  })

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra table-xs">
        {/* head */}
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {
            transactions.value?.map((it) => {
              return (
                <tr>
                  <td>{it.id}</td>
                  <td>{dateFormat(it.transaction_at).mmmddyyyy()}</td>
                  {it.balance !== null && (
                    // <td>{currencyFormat.format(it.balance)}</td>
                    <td>{it.balance}</td>
                  )}
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </div>
  )
}
