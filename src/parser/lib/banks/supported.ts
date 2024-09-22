import type { IterableElement } from 'type-fest'

export const SUPPORTED_BANKS = ['idfc'] as const

export type TSupportedBanks = IterableElement<typeof SUPPORTED_BANKS>
