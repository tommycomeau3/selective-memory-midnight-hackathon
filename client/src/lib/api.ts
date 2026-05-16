import type { AccessLogEntry, Agent, ChatMessage, Memory, Proof } from '../types';

const BASE = '/api';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getAgents: () => fetchJson<Agent[]>('/agents'),
  getMemories: (agentId?: string) =>
    fetchJson<Memory[]>(
      agentId ? `/memories?agentId=${agentId}` : '/memories'
    ),
  requestPermissions: (agentId: string, message: string) =>
    fetchJson<{
      pending: Memory[];
      alreadyGranted: Memory[];
      blockedByRevocation?: boolean;
    }>('/permissions/request', {
      method: 'POST',
      body: JSON.stringify({ agentId, message }),
    }),
  approve: (
    agentId: string,
    memoryIds: string[],
    duration: 'session' | '1h' = 'session'
  ) =>
    fetchJson<{ grants: unknown[]; proofs: Proof[] }>('/permissions/approve', {
      method: 'POST',
      body: JSON.stringify({ agentId, memoryIds, duration }),
    }),
  deny: (agentId: string, memoryIds: string[]) =>
    fetchJson<{ ok: boolean }>('/permissions/deny', {
      method: 'POST',
      body: JSON.stringify({ agentId, memoryIds }),
    }),
  revoke: (agentId: string, memoryIds?: string[]) =>
    fetchJson<{ ok: boolean }>('/permissions/revoke', {
      method: 'POST',
      body: JSON.stringify({ agentId, memoryIds }),
    }),
  chat: (agentId: string, message: string, history: ChatMessage[] = []) =>
    fetchJson<{ reply: string; usedMemoryIds: string[]; denied?: boolean }>(
      '/chat',
      {
        method: 'POST',
        body: JSON.stringify({ agentId, message, history }),
      }
    ),
  getProofs: () => fetchJson<Proof[]>('/proofs'),
  getAccessLog: () => fetchJson<AccessLogEntry[]>('/access-log'),
};
