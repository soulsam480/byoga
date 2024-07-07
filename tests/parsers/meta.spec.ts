import * as R from 'remeda'
import { type IntermediateMetaResult, parseAdditionalMeta } from '../../src/workers/lib/parsers/meta'
// import { upi } from './parserCases.json'
// TODO: add more tests

function createUPIData(meta: string): IntermediateMetaResult {
  meta = `UPI/MOB/400230892772/${meta}`

  return {
    categories: new Set(),
    parts: meta.split('/'),
    tags: new Set(),
    transaction: {
      'Transaction Date': '2024-01-01T18:30:00.000Z',
      'Value Date': '2024-01-01T18:30:00.000Z',
      'Particulars': meta,
      'Cheque No.': '',
      'Debit': '15,000.00',
      'Credit': '',
      'Balance': '214,800.00',
    },
    transaction_mode: 'upi',
    transaction_ref: '400230892772',
    additional: {},
  }
}

function createATMData(): IntermediateMetaResult {
  return {
    categories: new Set(),
    parts: 'ATM-NFS/CASH WITHDRAWAL/R K FILLI/418212018475/SEL'.split('/'),
    tags: new Set(),
    transaction: {
      'Transaction Date': '2024-01-01T18:30:00.000Z',
      'Value Date': '2024-01-01T18:30:00.000Z',
      'Particulars': 'ATM-NFS/CASH WITHDRAWAL/R K FILLI/418212018475/SEL',
      'Cheque No.': '',
      'Debit': '15,000.00',
      'Credit': '',
      'Balance': '214,800.00',
    },
    transaction_mode: 'atm',
    transaction_ref: '418212018475',
    additional: {},
  }
}

describe('parsers/parseAdditionalMeta', () => {
  describe('given upi transactions', () => {
    describe('for food cases', () => {
      const cases = ['food', 'lunch', 'chicken', 'milk', 'curd', 'fruit', 'juice', 'coffe', 'lunch', 'dinner', 'egg', 'coke', 'coconut', 'mutton']

      it('extracts categories', () => {
        R.pipe(
          cases,
          R.map(it => R.pipe(it, createUPIData, parseAdditionalMeta)),
          R.forEach((ctx) => {
            expect(Array.from(ctx.categories)).toEqual(['food'])
            expect(Array.from(ctx.tags).length).greaterThanOrEqual(1)
          }),
        )
      })
    })

    describe('for deposit cases', () => {
      const cases = ['RD', 'SBI RD', 'SBI rd', 'deposit', 'mother deposit', 'mother sbi deposit', 'monthly deposit']

      it('extracts categories', () => {
        R.pipe(
          cases,
          R.map(it => R.pipe(it, createUPIData, parseAdditionalMeta)),
          R.forEach((ctx) => {
            expect(Array.from(ctx.categories)).toEqual(['deposit'])
            expect(Array.from(ctx.tags).length).greaterThanOrEqual(1)
          }),
        )
      })
    })
  })

  describe('given atm transactions', () => {
    const result = parseAdditionalMeta(createATMData())

    it('extracts category', () => {
      expect(Array.from(result.categories)).toEqual(['atm_cash'])
    })
  })
})
