export type MemoryCategory = 'health' | 'career' | 'finance' | 'personal';

export interface Agent {
  id: string;
  name: string;
  description: string;
  allowedCategories: MemoryCategory[];
  blockedCategories: MemoryCategory[];
  icon: string;
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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  health: 'Health',
  career: 'Career',
  finance: 'Finance',
  personal: 'Personal',
};
