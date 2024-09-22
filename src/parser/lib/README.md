## Byoga statement parser library

### Steps

- FileReader API <- runs inside worker
  - file input <- CSV or XLSX
  - we can only consume CSV, convert XLSX to CSV if needed
  - XLSX converter
    - sheet name
    - returns `CSV`
  - CSV parser
    - csv data is always in string format
    - also in a statement, there's always a extra info about bank account
    - we need start and end of CSV data of transactions
    - returns `Array` of `transaction`s
- Transformer API <- runs inside worker
  - transformer does a series of changes to each transaction or row to make it understandable and query-able
  - should return rows in known output format
  - steps
    1. find transaction mode
    2. find transaction ref
    3. find transaction category and tags
- Feeder API <- runs in main thread
  - once we have transformed rows, we can save it to DB
  - this runs in main thread as running it inside worker produces duplicate builds of the query builder
