import type {
  AccessLogEntry,
  Grant,
  Memory,
  Proof,
} from './types.js';
import { agents, memories } from './data/seed.js';

class Store {
  memories: Memory[] = [...memories];
  grants: Grant[] = [];
  proofs: Proof[] = [];
  accessLog: AccessLogEntry[] = [];
  revokedMemoryIds = new Set<string>();

  getAgents() {
    return agents;
  }

  getMemories() {
    return this.memories;
  }

  getGrantsForAgent(agentId: string): Grant[] {
    return this.grants.filter((g) => g.agentId === agentId);
  }

  getGrant(agentId: string, memoryId: string): Grant | undefined {
    return this.grants.find(
      (g) => g.agentId === agentId && g.memoryId === memoryId
    );
  }

  upsertGrant(grant: Grant) {
    const idx = this.grants.findIndex(
      (g) => g.agentId === grant.agentId && g.memoryId === grant.memoryId
    );
    if (idx >= 0) {
      this.grants[idx] = grant;
    } else {
      this.grants.push(grant);
    }
  }

  addProof(proof: Proof) {
    this.proofs.unshift(proof);
    if (this.proofs.length > 50) this.proofs.pop();
  }

  addLogEntry(entry: AccessLogEntry) {
    this.accessLog.unshift(entry);
    if (this.accessLog.length > 100) this.accessLog.pop();
  }

  markRevoked(memoryIds: string[]) {
    for (const id of memoryIds) {
      this.revokedMemoryIds.add(id);
    }
  }

  isRevoked(memoryId: string): boolean {
    return this.revokedMemoryIds.has(memoryId);
  }
}

export const store = new Store();
