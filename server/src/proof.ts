import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { AgentAccessProof } from './types.js';
import { CATEGORY_LABELS, getAgent } from './seed.js';
import { store } from './store.js';

/**
 * MIDNIGHT_INTEGRATION: Replace computeProofHash with a real Compact contract
 * selective-disclosure proof from the Midnight network.
 */
function computeProofHash(payload: Record<string, unknown>): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Simulates Midnight selective disclosure: approves memories for this agent's
 * scope, then returns a verifiable proof object for the UI.
 */
export function generateAgentAccessProof(agentId: string): AgentAccessProof {
  const agent = getAgent(agentId);
  if (!agent) throw new Error('Unknown agent');

  const scopedMemories = store.memories.filter((m) =>
    agent.allowedCategories.includes(m.category)
  );
  const memoryIds = scopedMemories.map((m) => m.id);

  // Grant access to scoped memories (in production, this step is on-chain).
  store.approveMemories(agentId, memoryIds);

  const timestamp = Date.now();
  const proofId = `proof-${uuidv4().slice(0, 8)}`;
  const scope = agent.allowedCategories.map((c) => CATEGORY_LABELS[c]);

  const proof: AgentAccessProof = {
    proofId,
    agentId,
    scope,
    memoryIds,
    timestamp,
    proofHash: computeProofHash({ proofId, agentId, scope, memoryIds, timestamp }),
    verified: true,
  };

  store.setProof(proof);
  return proof;
}
