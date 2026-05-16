import type { Agent, AgentAccessProof } from '../types';

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
  generateProof: (agentId: string) =>
    fetchJson<AgentAccessProof>('/proof/generate', {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    }),
  chat: (agentId: string, message: string) =>
    fetchJson<{ reply: string; usedMemoryIds: string[] }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ agentId, message }),
    }),
};
