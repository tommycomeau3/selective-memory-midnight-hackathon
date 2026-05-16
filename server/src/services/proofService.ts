import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { AgentAccessProof } from '../types.js';
import { getAgentById } from '../data/seed.js';
import { store } from '../store.js';
import { approveMemories } from './permissionService.js';

const CATEGORY_LABELS: Record<string, string> = {
  health: 'Health',
  career: 'Career',
  finance: 'Finance',
  personal: 'Personal',
};

/**
 * MIDNIGHT_INTEGRATION: Replace with Compact contract selective-disclosure proof.
 */
function computeProofHash(payload: Record<string, unknown>): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

export function generateAgentAccessProof(agentId: string): AgentAccessProof {
  const agent = getAgentById(agentId);
  if (!agent) throw new Error('Unknown agent');

  const memories = store.memories.filter((m) =>
    agent.allowedCategories.includes(m.category)
  );
  const memoryIds = memories.map((m) => m.id);

  approveMemories(agentId, memoryIds);

  const timestamp = Date.now();
  const proofId = `proof-${uuidv4().slice(0, 8)}`;
  const scope = agent.allowedCategories.map((c) => CATEGORY_LABELS[c] ?? c);

  const proofHash = computeProofHash({
    proofId,
    agentId,
    scope,
    memoryIds,
    timestamp,
  });

  const proof: AgentAccessProof = {
    proofId,
    agentId,
    scope,
    memoryIds,
    timestamp,
    proofHash,
    verified: true,
  };

  store.setAgentProof(proof);
  return proof;
}

export function getAgentProof(agentId: string): AgentAccessProof | undefined {
  return store.getAgentProof(agentId);
}
