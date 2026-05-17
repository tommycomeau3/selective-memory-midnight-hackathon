import type { AgentAccessProof } from '../types.js';
import { computeGrantRoot } from './commitments.js';

/** Verify stored proof still matches the approved memory grant. */
export function verifyGrantProof(proof: AgentAccessProof | undefined): boolean {
  if (!proof?.verified) return false;

  if (proof.proofMode === 'mock' || !proof.proofMode) {
    return true;
  }

  if (!proof.grantRoot) {
    return false;
  }

  const recomputed = Buffer.from(
    computeGrantRoot(proof.memoryIds, proof.timestamp)
  ).toString('hex');

  return proof.grantRoot === recomputed;
}
