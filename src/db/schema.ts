import type { Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface EventTable {
  id: Generated<number>
  name: string | null
  start_at: string | null
  end_at: string | null
}

export type EventModel = Selectable<EventTable>
export type EventInsert = Insertable<EventTable>
export type EventUpdate = Updateable<EventTable>

export interface TransactionsTable {
  id: Generated<number>
  meta: string
  transaction_at: Date
  transaction_ref: string | null
  cheque_no: number | null
  debit: number | null
  credit: number | null
  balance: number | null
  transaction_mode:
    | 'monthly_interest'
    | 'upi'
    | 'unknown'
    | 'imps'
    | 'atm'
    | 'neft'
    | 'nach'
    | 'emi'
  transaction_category:
    | 'food'
    | 'bike'
    | 'domestic'
    | 'deposit'
    | 'shopping'
    | 'petrol'
    | 'grocery'
    | 'transport'
    | 'medical'
    | 'entertainment'
    | 'online_payment'
    | 'bank_mandate'
    | 'personal'
    | 'cash_transfer'
    | 'emi'
    | 'atm_cash'
    | 'salary'
    | 'bank_transfer'
    | 'unknown'
  // ! json needs to be parsed
  additional_meta: Record<string, string | null>
  // ! json needs to be parsed
  tags: string[]
  created_at: Date
  updated_at: Date
  /**
   * transaction is a part of event or group
   */
  event_id: number | null
}

export type TransactionModel = Selectable<TransactionsTable>
export type TransactionInsert = Insertable<TransactionsTable>
export type TransactionUpdate = Updateable<TransactionsTable>

export interface Database {
  transactions: TransactionsTable
  events: EventTable
}

/**
 * is an object if looks like a model. has an id
 */
export interface IModelLike {
  id: number
}
