const cache = new Map<string, [number, number, number]>()

/**
 * For a provided seed, returns same OKLCH color always
 * written and improved by chatgpt
 * @see https://chatgpt.com/share/66e5b362-8480-8009-90ff-140dc01e48c2
 */
export function oklchFromSeed(seed: string): [number, number, number] {
  let color = cache.get(seed)

  if (color !== undefined) {
    return color
  }

  // Simple PRNG based on seed
  const randomFromSeed = (seed: string) => {
    let h = 0
    for (let i = 0; i < seed.length; i++) {
      h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
    }
    return () => {
      h = Math.imul(h ^ (h >>> 15), h | 1)
      h ^= h + Math.imul(h ^ (h >>> 7), h | 61)
      return ((h ^ (h >>> 14)) >>> 0) / 4294967296
    }
  }

  const rng = randomFromSeed(seed)

  // Generate OKLCH color components with added randomness
  let L = rng() * 0.5 + 0.5 // Lightness: randomized in the range [0.5, 1.0]
  let C = rng() * 0.4 // Chroma: randomized in the range [0.0, 0.4]
  let H = rng() * 360 // Hue: randomized in the range [0, 360]

  // Add some controlled perturbations based on seed length
  L = Math.min(1, L + (seed.length % 3) * 0.05) // Lightness shifts slightly based on seed length
  C = Math.min(0.4, C + (seed.length % 5) * 0.05) // Chroma shifts slightly
  H = (H + seed.length * 15) % 360 // Hue is adjusted by a factor of seed length

  color = [L, C, H]

  cache.set(seed, color)

  return color
}

/**
 * for a provided seed, returns same hex color always
 */
export function colorFromSeed(seed: string): string {
  const [L, C, H] = oklchFromSeed(seed)
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`
}

export function tailwindColorFromSeed(seed: string): string {
  const [L, C, H] = oklchFromSeed(seed)
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)} / <alpha-value>)`
}
