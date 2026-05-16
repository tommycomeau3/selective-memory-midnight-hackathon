import type { Agent, Memory } from '../types.js';
import { agents, getAgentById } from '../data/seed.js';
import {
  getAccessibleMemories,
  hasValidProof,
} from './permissionService.js';

const CATEGORY_LABELS: Record<string, string> = {
  health: 'Health',
  career: 'Career',
  finance: 'Finance',
  personal: 'Personal',
};

const NO_PROOF_MESSAGE =
  'Generate a Midnight Access Proof for this agent first, then ask your question.';

function buildMockResponse(agent: Agent, accessible: Memory[]): string {
  const blocked = agent.blockedCategories
    .map((c) => CATEGORY_LABELS[c] ?? c)
    .join(', ');

  const bullets = accessible
    .map((m) => {
      const line = m.content.split(/[.!?]/)[0]?.trim() ?? m.content;
      return `• ${m.title}: ${line}`;
    })
    .join('\n');

  return `I'm your ${agent.name}. Based only on memories you've selectively shared with me:\n\n${bullets}\n\nI do not have access to your ${blocked} information.`;
}

async function buildOpenAIResponse(
  agent: Agent,
  accessible: Memory[],
  message: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return buildMockResponse(agent, accessible);

  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const blocked = agent.blockedCategories
    .map((c) => CATEGORY_LABELS[c])
    .join(', ');

  const memoryContext = JSON.stringify(
    accessible.map((m) => ({
      title: m.title,
      category: m.category,
      content: m.content,
    }))
  );

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are the ${agent.name}. Answer ONLY from these approved memories. Never mention ${blocked}. Be concise.\n\nMemories: ${memoryContext}`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 400,
      temperature: 0.5,
    }),
  });

  if (!response.ok) return buildMockResponse(agent, accessible);
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return (
    data.choices?.[0]?.message?.content?.trim() ??
    buildMockResponse(agent, accessible)
  );
}

export async function handleChat(agentId: string, message: string) {
  const agent = getAgentById(agentId);
  if (!agent) return { reply: 'Unknown agent.', usedMemoryIds: [] as string[] };

  if (!hasValidProof(agentId)) {
    return { reply: NO_PROOF_MESSAGE, usedMemoryIds: [] as string[] };
  }

  const accessible = getAccessibleMemories(agentId);
  if (accessible.length === 0) {
    return { reply: NO_PROOF_MESSAGE, usedMemoryIds: [] as string[] };
  }

  const reply = process.env.OPENAI_API_KEY
    ? await buildOpenAIResponse(agent, accessible, message)
    : buildMockResponse(agent, accessible);

  return {
    reply,
    usedMemoryIds: accessible.map((m) => m.id),
  };
}

export function getAgentsList() {
  return agents;
}
