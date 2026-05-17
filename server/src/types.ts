export type MemoryCategory = 'health' | 'career' | 'finance' | 'personal';

export interface Memory {
  id: string;
  title: string;
  content: string;
  category: MemoryCategory;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  allowedCategories: MemoryCategory[];
  blockedCategories: MemoryCategory[];
  icon: string;
}

/** Tracks which memories an agent may read after proof approval. */
export interface Grant {
  agentId: string;
  memoryId: string;
}

export type ProofMode = 'mock' | 'midnight';

export interface AgentAccessProof {
  proofId: string;
  agentId: string;
  scope: string[];
  memoryIds: string[];
  timestamp: number;
  proofHash: string;
  verified: boolean;
  proofMode: ProofMode;
  grantRoot?: string;
  txId?: string;
  blockHeight?: number;
  circuitId?: string;
}
