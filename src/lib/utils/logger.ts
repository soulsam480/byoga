/* eslint-disable no-console */
import colors from 'tiny-colors'

export const logger = {
  info(...args: any[]) {
    console.info(colors.bgBlack.bold.white('[BYOGA INFO]:'), ...args)
  },
  warn(...args: any[]) {
    console.warn(colors.bgBlack.bold.yellow('[BYOGA WARN]:'), ...args)
  },
  error(...args: any[]) {
    console.error(colors.bgBlack.bold.red('[BYOGA ERROR]:'), ...args)
  }
}
