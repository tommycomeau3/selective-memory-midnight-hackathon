import { createHash } from 'crypto';

/** Commitment over approved memory IDs + timestamp (matches off-chain verification). */
export function computeGrantRoot(memoryIds: string[], timestamp: number): Uint8Array {
  const payload = JSON.stringify({
    memoryIds: [...memoryIds].sort(),
    timestamp,
  });
  return createHash('sha256').update(payload).digest();
}

export function agentIdToBytes32(agentId: string): Uint8Array {
  return createHash('sha256').update(agentId).digest();
}
