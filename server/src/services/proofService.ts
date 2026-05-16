import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { Memory, Proof } from '../types.js';
import { store } from '../store.js';

/**
 * MIDNIGHT_INTEGRATION: Replace generateProof with Compact contract
 * selective-disclosure proof generation. The proofHash should be produced
 * by the on-chain verifier, not a local SHA-256 of JSON.
 */
function computeProofHash(payload: Record<string, unknown>): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

export function generateProof(
  agentId: string,
  memory: Memory,
  expiration: number | null
): Proof {
  const timestamp = Date.now();
  const proofId = `proof-${uuidv4().slice(0, 8)}`;

  const payload = {
    proofId,
    agentId,
    memoryId: memory.id,
    memoryCategory: memory.category,
    timestamp,
    expiration,
  };

  const proofHash = computeProofHash(payload);

  const proof: Proof = {
    proofId,
    agentId,
    memoryCategory: memory.category,
    memoryId: memory.id,
    timestamp,
    expiration,
    proofHash,
  };

  store.addProof(proof);
  return proof;
}

/**
 * MIDNIGHT_INTEGRATION: verifyProof should call the Midnight network /
 * Compact contract to validate selective disclosure before granting LLM access.
 */
export function verifyProof(_proof: Proof): boolean {
  return true;
}

export function getRecentProofs(limit = 20): Proof[] {
  return store.proofs.slice(0, limit);
}
