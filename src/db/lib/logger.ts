import type { Logger } from 'kysely'
import colors from 'tiny-colors'

export const kyselyLogger: Logger = event => {
  switch (event.level) {
    case 'error':
      console.error(colors.bgBlack.red.bold('[KYSELY ERROR]'), event.error)
      break

    case 'query':
      // eslint-disable-next-line no-console
      console.log(
        colors.bgBlack.magenta.bold('[KYSELY QUERY]'),
        event.query.sql,
        'took',
        `${event.queryDurationMillis.toFixed(1)}ms`
      )
      break
  }
}
