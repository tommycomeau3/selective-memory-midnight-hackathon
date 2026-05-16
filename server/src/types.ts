export type MemoryCategory =
  | 'health'
  | 'career'
  | 'finance'
  | 'dating'
  | 'journal';

export type Sensitivity = 'low' | 'medium' | 'high';

export type AccessStatus = 'private' | 'shared' | 'revoked' | 'verified';

export type GrantStatus = 'approved' | 'denied' | 'revoked';

export type AccessAction =
  | 'request'
  | 'approved'
  | 'denied'
  | 'approved_1h'
  | 'revoked'
  | 'verified'
  | 'chat_access'
  | 'chat_denied';

export interface Memory {
  id: string;
  title: string;
  content: string;
  category: MemoryCategory;
  sensitivity: Sensitivity;
  preview: string;
}

export interface MemoryPublic extends Omit<Memory, 'content'> {
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

export interface Grant {
  agentId: string;
  memoryId: string;
  status: GrantStatus;
  expiresAt: number | null;
  approvedAt: number;
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
  action: AccessAction;
  memoryIds: string[];
  proofId?: string;
  message: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
