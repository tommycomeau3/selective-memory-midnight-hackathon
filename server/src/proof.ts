import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { AgentAccessProof, MemoryCategory } from './types.js';
import { CATEGORY_LABELS, getAgent } from './seed.js';
import { store } from './store.js';
import { canUseMidnightZk } from './midnight/config.js';

function computeMockProofHash(payload: Record<string, unknown>): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

function buildMockProof(
  agentId: string,
  scope: string[],
  memoryIds: string[],
  timestamp: number
): AgentAccessProof {
  const proofId = `proof-${uuidv4().slice(0, 8)}`;
  return {
    proofId,
    agentId,
    scope,
    memoryIds,
    timestamp,
    proofHash: computeMockProofHash({ proofId, agentId, scope, memoryIds, timestamp }),
    verified: true,
    proofMode: 'mock',
  };
}

async function buildMidnightProof(
  agentId: string,
  scope: string[],
  memoryIds: string[],
  allowedCategories: MemoryCategory[],
  timestamp: number
): Promise<AgentAccessProof> {
  const { submitMidnightGrant } = await import('./midnight/grant.js');
  const grant = await submitMidnightGrant(agentId, allowedCategories, memoryIds, timestamp);

  const proofId = `proof-${uuidv4().slice(0, 8)}`;
  return {
    proofId,
    agentId,
    scope,
    memoryIds,
    timestamp,
    proofHash: grant.grantRootHex,
    grantRoot: grant.grantRootHex,
    txId: grant.txId,
    blockHeight: grant.blockHeight,
    verified: true,
    proofMode: 'midnight',
    circuitId: 'grantAgentAccess',
  };
}

/**
 * Generates selective-disclosure proof: mock SHA-256 or real Midnight grantAgentAccess tx.
 */
export async function generateAgentAccessProof(agentId: string): Promise<AgentAccessProof> {
  const agent = getAgent(agentId);
  if (!agent) throw new Error('Unknown agent');

  const scopedMemories = store.memories.filter((m) =>
    agent.allowedCategories.includes(m.category)
  );
  const memoryIds = scopedMemories.map((m) => m.id);
  const timestamp = Date.now();
  const scope = agent.allowedCategories.map((c) => CATEGORY_LABELS[c]);

  // Grant memory access first so chat works even if proof metadata step fails later.
  store.approveMemories(agentId, memoryIds);

  const proof = canUseMidnightZk()
    ? await buildMidnightProof(agentId, scope, memoryIds, agent.allowedCategories, timestamp)
    : buildMockProof(agentId, scope, memoryIds, timestamp);

  store.setProof(proof);
  return proof;
}
