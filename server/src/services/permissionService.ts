import { v4 as uuidv4 } from 'uuid';
import type {
  AccessLogEntry,
  Grant,
  Memory,
  MemoryPublic,
  Proof,
} from '../types.js';
import { getAgentById, getMemoryById } from '../data/seed.js';
import { store } from '../store.js';
import { generateProof } from './proofService.js';

const DEMO_QUESTION = 'tell me what you know about me';

function isEffectiveGrant(grant: Grant): boolean {
  if (grant.status !== 'approved') return false;
  if (grant.expiresAt !== null && grant.expiresAt <= Date.now()) return false;
  return true;
}

export function getEffectiveGrants(agentId: string): Grant[] {
  return store.getGrantsForAgent(agentId).filter(isEffectiveGrant);
}

export function getAccessibleMemories(agentId: string): Memory[] {
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

function log(
  agentId: string,
  action: AccessLogEntry['action'],
  memoryIds: string[],
  message: string,
  proofId?: string
) {
  store.addLogEntry({
    id: uuidv4(),
    timestamp: Date.now(),
    agentId,
    action,
    memoryIds,
    proofId,
    message,
  });
}

export function getAccessStatus(
  agentId: string | undefined,
  memoryId: string
): MemoryPublic['accessStatus'] {
  if (!agentId) return 'private';

  const grant = store.getGrant(agentId, memoryId);
  if (store.isRevoked(memoryId) && grant?.status === 'revoked') {
    return 'revoked';
  }
  if (grant && isEffectiveGrant(grant)) {
    const hasProof = store.proofs.some(
      (p) => p.agentId === agentId && p.memoryId === memoryId
    );
    return hasProof ? 'verified' : 'shared';
  }
  if (grant?.status === 'revoked') return 'revoked';
  return 'private';
}

export function toPublicMemory(
  memory: Memory,
  agentId?: string
): MemoryPublic {
  const { content: _, ...rest } = memory;
  return {
    ...rest,
    accessStatus: getAccessStatus(agentId, memory.id),
  };
}

export function requestMemories(
  agentId: string,
  message: string
): {
  pending: MemoryPublic[];
  alreadyGranted: MemoryPublic[];
  blockedByRevocation: boolean;
} {
  const agent = getAgentById(agentId);
  if (!agent) {
    return { pending: [], alreadyGranted: [], blockedByRevocation: false };
  }

  if (hasRevokedAccessInMessage(agentId, message)) {
    return { pending: [], alreadyGranted: [], blockedByRevocation: true };
  }

  const normalized = message.toLowerCase().trim();
  const effective = new Set(getEffectiveGrants(agentId).map((g) => g.memoryId));

  let candidates = store.memories.filter((m) =>
    agent.allowedCategories.includes(m.category)
  );

  if (normalized.includes(DEMO_QUESTION) || normalized.length < 5) {
    // Showcase: request all allowed-category memories
  } else if (
    /\b(salary|raise|promotion|job|work|engineer)\b/.test(normalized)
  ) {
    candidates = candidates.filter((m) => m.category === 'career');
  } else if (
    /\b(therapy|health|medication|anxiety|fitness|doctor)\b/.test(normalized)
  ) {
    candidates = candidates.filter((m) => m.category === 'health');
  } else if (
    /\b(debt|loan|money|budget|invest|savings|401)\b/.test(normalized)
  ) {
    candidates = candidates.filter((m) => m.category === 'finance');
  } else if (
    /\b(date|dating|relationship|hobby|love)\b/.test(normalized)
  ) {
    candidates = candidates.filter((m) =>
      ['dating', 'journal'].includes(m.category)
    );
  } else {
    candidates = candidates.filter(
      (m) =>
        m.sensitivity !== 'high' ||
        /\b(sensitive|private|everything|all)\b/.test(normalized)
    );
  }

  const pending = candidates
    .filter((m) => !effective.has(m.id))
    .map((m) => toPublicMemory(m, agentId));

  const alreadyGranted = candidates
    .filter((m) => effective.has(m.id))
    .map((m) => toPublicMemory(m, agentId));

  log(
    agentId,
    'request',
    pending.map((m) => m.id),
    `Agent requested access to ${pending.length} memor${pending.length === 1 ? 'y' : 'ies'}`
  );

  return { pending, alreadyGranted, blockedByRevocation: false };
}

export function approveMemories(
  agentId: string,
  memoryIds: string[],
  duration: 'session' | '1h' = 'session'
): { grants: Grant[]; proofs: Proof[] } {
  const expiresAt =
    duration === '1h' ? Date.now() + 60 * 60 * 1000 : null;
  const grants: Grant[] = [];
  const proofs: Proof[] = [];

  for (const memoryId of memoryIds) {
    const memory = getMemoryById(memoryId);
    if (!memory) continue;

    const grant: Grant = {
      agentId,
      memoryId,
      status: 'approved',
      expiresAt,
      approvedAt: Date.now(),
    };
    store.upsertGrant(grant);
    grants.push(grant);

    const proof = generateProof(agentId, memory, expiresAt);
    proofs.push(proof);

    log(
      agentId,
      duration === '1h' ? 'approved_1h' : 'approved',
      [memoryId],
      `Approved access to "${memory.title}"`,
      proof.proofId
    );
    log(
      agentId,
      'verified',
      [memoryId],
      'Access verified via Midnight selective disclosure proof.',
      proof.proofId
    );
  }

  return { grants, proofs };
}

export function denyMemories(agentId: string, memoryIds: string[]): void {
  for (const memoryId of memoryIds) {
    store.upsertGrant({
      agentId,
      memoryId,
      status: 'denied',
      expiresAt: null,
      approvedAt: Date.now(),
    });
  }
  log(
    agentId,
    'denied',
    memoryIds,
    `Denied access to ${memoryIds.length} memor${memoryIds.length === 1 ? 'y' : 'ies'}`
  );
}

export function revokeMemories(
  agentId: string,
  memoryIds?: string[]
): void {
  const agent = getAgentById(agentId);
  if (!agent) return;

  const targets =
    memoryIds && memoryIds.length > 0
      ? memoryIds
      : store.memories
          .filter((m) => agent.allowedCategories.includes(m.category))
          .map((m) => m.id);

  for (const memoryId of targets) {
    store.upsertGrant({
      agentId,
      memoryId,
      status: 'revoked',
      expiresAt: null,
      approvedAt: Date.now(),
    });
    store.markRevoked([memoryId]);
  }

  log(
    agentId,
    'revoked',
    targets,
    `Revoked access for ${targets.length} memor${targets.length === 1 ? 'y' : 'ies'}`
  );
}

export function hasRevokedAccessInMessage(
  agentId: string,
  message: string
): boolean {
  const agent = getAgentById(agentId);
  if (!agent) return false;

  const normalized = message.toLowerCase();
  const revokedForAgent = store
    .getGrantsForAgent(agentId)
    .filter((g) => g.status === 'revoked' || store.isRevoked(g.memoryId));

  if (revokedForAgent.length === 0) return false;

  for (const grant of revokedForAgent) {
    const memory = getMemoryById(grant.memoryId);
    if (!memory) continue;
    if (
      normalized.includes(memory.title.toLowerCase()) ||
      normalized.includes(memory.category) ||
      normalized.includes(DEMO_QUESTION) ||
      /\b(promotion|salary|therapy|debt|dating|career|health|finance)\b/.test(
        normalized
      )
    ) {
      return true;
    }
  }

  return revokedForAgent.length > 0 && normalized.includes(DEMO_QUESTION);
}

export function getAccessLog(limit = 30) {
  return store.accessLog.slice(0, limit);
}
