export type MemoryCategory = 'health' | 'career' | 'finance' | 'personal';

export type Sensitivity = 'low' | 'medium' | 'high';

export interface Memory {
  id: string;
  title: string;
  content: string;
  category: MemoryCategory;
  sensitivity: Sensitivity;
  preview: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  allowedCategories: MemoryCategory[];
  blockedCategories: MemoryCategory[];
  icon: string;
}

export interface Grant {
  agentId: string;
  memoryId: string;
  status: 'approved' | 'denied' | 'revoked';
  expiresAt: number | null;
  approvedAt: number;
}

export interface AgentAccessProof {
  proofId: string;
  agentId: string;
  scope: string[];
  memoryIds: string[];
  timestamp: number;
  proofHash: string;
  verified: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
