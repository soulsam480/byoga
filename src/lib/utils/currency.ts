const currencyFormat = new Intl.NumberFormat(
  'en-IN',
  {
    style: 'currency',
    currency: 'INR',
    trailingZeroDisplay: 'stripIfInteger',
    notation: 'compact',
  },
)

export function formatCurrency(value: string | number | bigint | undefined | null) {
  if (value === null || value === undefined) {
    return '-'
  }

  return currencyFormat.format(Number(value))
}
