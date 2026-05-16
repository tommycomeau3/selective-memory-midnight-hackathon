import type { Grant } from '../types.js';
import { getAgentById, getMemoryById } from '../data/seed.js';
import { store } from '../store.js';

function isEffectiveGrant(grant: Grant): boolean {
  if (grant.status !== 'approved') return false;
  if (grant.expiresAt !== null && grant.expiresAt <= Date.now()) return false;
  return true;
}

export function getEffectiveGrants(agentId: string): Grant[] {
  return store.getGrantsForAgent(agentId).filter(isEffectiveGrant);
}

export function getAccessibleMemories(agentId: string) {
  const agent = getAgentById(agentId);
  if (!agent) return [];

  const grantedIds = new Set(
    getEffectiveGrants(agentId).map((g) => g.memoryId)
  );

  return store.memories.filter(
    (m) =>
      agent.allowedCategories.includes(m.category) && grantedIds.has(m.id)
  );
}

export function approveMemories(agentId: string, memoryIds: string[]) {
  for (const memoryId of memoryIds) {
    const memory = getMemoryById(memoryId);
    if (!memory) continue;
    store.upsertGrant({
      agentId,
      memoryId,
      status: 'approved',
      expiresAt: null,
      approvedAt: Date.now(),
    });
  }
}

export function hasValidProof(agentId: string): boolean {
  const proof = store.getAgentProof(agentId);
  return Boolean(proof?.verified);
}
