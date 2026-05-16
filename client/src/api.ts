import type { Agent, AgentAccessProof } from './types';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export function getAgents() {
  return fetchJson<Agent[]>('/agents');
}

export function generateProof(agentId: string) {
  return fetchJson<AgentAccessProof>('/proof/generate', {
    method: 'POST',
    body: JSON.stringify({ agentId }),
  });
}

export function sendChat(agentId: string, message: string) {
  return fetchJson<{ reply: string }>('/chat', {
    method: 'POST',
    body: JSON.stringify({ agentId, message }),
  });
}
