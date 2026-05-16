export type MemoryCategory =
  | 'health'
  | 'career'
  | 'finance'
  | 'dating'
  | 'journal';

export type Sensitivity = 'low' | 'medium' | 'high';
export type AccessStatus = 'private' | 'shared' | 'revoked' | 'verified';

export interface Memory {
  id: string;
  title: string;
  category: MemoryCategory;
  sensitivity: Sensitivity;
  preview: string;
  accessStatus: AccessStatus;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  allowedCategories: MemoryCategory[];
  blockedCategories: MemoryCategory[];
  icon: string;
}

export interface Proof {
  proofId: string;
  agentId: string;
  memoryCategory: MemoryCategory;
  memoryId: string;
  timestamp: number;
  expiration: number | null;
  proofHash: string;
}

export interface AccessLogEntry {
  id: string;
  timestamp: number;
  agentId: string;
  action: string;
  memoryIds: string[];
  proofId?: string;
  message: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  health: 'Health',
  career: 'Career',
  finance: 'Finance',
  dating: 'Dating',
  journal: 'Personal Journal',
};

export const CATEGORY_COLORS: Record<MemoryCategory, string> = {
  health: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  career: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  finance: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  dating: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  journal: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
};
