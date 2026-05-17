import type { MemoryCategory } from '../types.js';

const CATEGORY_BITS: Record<MemoryCategory, number> = {
  health: 1,
  career: 2,
  finance: 4,
  personal: 8,
};

/** Bit mask for Compact Uint<8> categoryMask argument. */
export function categoryMask(categories: MemoryCategory[]): bigint {
  return categories.reduce((mask, cat) => mask | BigInt(CATEGORY_BITS[cat]), 0n);
}
