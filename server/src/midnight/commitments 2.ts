import { createHash } from 'crypto';
import type { Memory } from '../types.js';

/** Stable commitment root for a set of memory ids (matches witness builder for Phase 2). */
export function computeGrantRoot(memoryIds: string[], timestamp: number): Uint8Array {
  const canonical = JSON.stringify({ memoryIds: [...memoryIds].sort(), timestamp });
  return createHash('sha256').update(canonical).digest();
}

export function agentIdToBytes32(agentId: string): Uint8Array {
  return createHash('sha256').update(agentId, 'utf8').digest();
}

export function memoriesToGrantRoot(memories: Memory[], timestamp: number): Uint8Array {
  return computeGrantRoot(
    memories.map((m) => m.id),
    timestamp
  );
}
