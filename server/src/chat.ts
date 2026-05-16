import type { Agent, Memory } from './types.js';
import { CATEGORY_LABELS, getAgent } from './seed.js';
import { store } from './store.js';

const NEED_PROOF =
  'Generate a Midnight Access Proof for this agent first, then ask your question.';

function buildMockReply(agent: Agent, memories: Memory[]): string {
  const blocked = agent.blockedCategories
    .map((c) => CATEGORY_LABELS[c])
    .join(', ');

  const bullets = memories
    .map((m) => {
      const line = m.content.split(/[.!?]/)[0]?.trim() ?? m.content;
      return `• ${m.title}: ${line}`;
    })
    .join('\n');

  return `I'm your ${agent.name}. Based only on memories you've selectively shared with me:\n\n${bullets}\n\nI do not have access to your ${blocked} information.`;
}

async function buildOpenAIReply(
  agent: Agent,
  memories: Memory[],
  message: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return buildMockReply(agent, memories);

  const blocked = agent.blockedCategories.map((c) => CATEGORY_LABELS[c]).join(', ');
  const memoryContext = JSON.stringify(
    memories.map((m) => ({ title: m.title, content: m.content }))
  );

  // MIDNIGHT_INTEGRATION: Verify proof on-chain before sending memories to the LLM.
  const res = await fetch(
    `${process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
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
    }
  );

  if (!res.ok) return buildMockReply(agent, memories);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() ?? buildMockReply(agent, memories);
}

/** Chat only uses memories in the agent's approved scope (requires a valid proof). */
export async function handleChat(agentId: string, message: string) {
  const agent = getAgent(agentId);
  if (!agent) return { reply: 'Unknown agent.' };

  if (!store.hasProof(agentId)) {
    return { reply: NEED_PROOF };
  }

  const accessible = store.getAccessibleMemories(agentId);
  if (accessible.length === 0) {
    return { reply: NEED_PROOF };
  }

  const reply = process.env.OPENAI_API_KEY
    ? await buildOpenAIReply(agent, accessible, message)
    : buildMockReply(agent, accessible);

  return { reply };
}
