const cache = new Map<string, string>()

export function colorFromSeed(seed: string): string {
  let color = cache.get(seed)

  if (color !== undefined) {
    return color
  }

  color = '#'

  let hash = 0

  if (seed.length === 0)
    return hash.toString()

  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }

  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 255
    color += (`00${value.toString(16)}`).substr(-2)
  }

  cache.set(seed, color)

  return color
}
