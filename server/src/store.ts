import type { AgentAccessProof, Grant, Memory } from './types.js';
import { agents, getAgent, memories } from './seed.js';

/** In-memory state for the hackathon demo (resets when the server restarts). */
export const store = {
  memories: [...memories] as Memory[],
  grants: [] as Grant[],
  proofs: new Map<string, AgentAccessProof>(),

  approveMemories(agentId: string, memoryIds: string[]) {
    for (const memoryId of memoryIds) {
      if (!this.grants.some((g) => g.agentId === agentId && g.memoryId === memoryId)) {
        this.grants.push({ agentId, memoryId });
      }
    }
  },

  /** Memories this agent can use in chat — only after a proof exists. */
  getAccessibleMemories(agentId: string): Memory[] {
    const agent = getAgent(agentId);
    if (!agent || !this.proofs.has(agentId)) return [];

    const granted = new Set(
      this.grants.filter((g) => g.agentId === agentId).map((g) => g.memoryId)
    );

    return this.memories.filter(
      (m) => agent.allowedCategories.includes(m.category) && granted.has(m.id)
    );
  },

  setProof(proof: AgentAccessProof) {
    this.proofs.set(proof.agentId, proof);
  },

  hasProof(agentId: string) {
    return this.proofs.get(agentId)?.verified === true;
  },

  getProof(agentId: string) {
    return this.proofs.get(agentId);
  },
};

export function listAgents() {
  return agents;
}
