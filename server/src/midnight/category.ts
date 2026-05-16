import type { MemoryCategory } from '../types.js';

/** Bit flags aligned with contracts/memory-access.compact (one bit per category). */
export const CATEGORY_BIT: Record<MemoryCategory, number> = {
  health: 1,
  career: 2,
  finance: 4,
  personal: 8,
};

export function categoryMask(categories: MemoryCategory[]): number {
  return categories.reduce((mask, c) => mask | CATEGORY_BIT[c], 0);
}
