import type { AgentAccessProof, Grant, Memory } from './types.js';
import { agents, memories } from './data/seed.js';

class Store {
  memories: Memory[] = [...memories];
  grants: Grant[] = [];
  agentProofs = new Map<string, AgentAccessProof>();

  getAgents() {
    return agents;
  }

  getMemories() {
    return this.memories;
  }

  getGrantsForAgent(agentId: string): Grant[] {
    return this.grants.filter((g) => g.agentId === agentId);
  }

  upsertGrant(grant: Grant) {
    const idx = this.grants.findIndex(
      (g) => g.agentId === grant.agentId && g.memoryId === grant.memoryId
    );
    if (idx >= 0) this.grants[idx] = grant;
    else this.grants.push(grant);
  }

  setAgentProof(proof: AgentAccessProof) {
    this.agentProofs.set(proof.agentId, proof);
  }

  getAgentProof(agentId: string) {
    return this.agentProofs.get(agentId);
  }
}

export const store = new Store();
