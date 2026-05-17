import type { Agent, Memory, MemoryCategory } from './types.js';
import { verifyGrantProof } from './midnight/verify.js';
import { CATEGORY_LABELS, getAgent } from './seed.js';
import { store } from './store.js';

const NEED_PROOF =
  'Generate a Midnight Access Proof for this agent first, then ask your question.';

const OVERVIEW_QUESTION =
  /\b(what do you know|tell me about (?:me|yourself)|everything you know|all (?:my|the) memories|about me)\b/i;

const BLOCKED_HINTS: Record<MemoryCategory, RegExp> = {
  health: /\b(health|therapy|medication|meds|doctor|fitness|anxiety|ssri)\b/i,
  career: /\b(career|job|salary|work|promotion|employer|raise|acme)\b/i,
  finance: /\b(finance|money|debt|loan|savings|invest|401k|budget)\b/i,
  personal: /\b(personal|relationship|dating|hobby|hobbies|friends)\b/i,
};

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? [];
}

function memoryRelevance(memory: Memory, message: string): number {
  const haystack = `${memory.title} ${memory.content}`.toLowerCase();
  const title = memory.title.toLowerCase();
  let score = 0;

  for (const word of tokenize(message)) {
    if (haystack.includes(word)) score += 2;
    if (word.length > 4 && haystack.includes(word.slice(0, -1))) score += 2;
    if (title.includes(word) || (word.length > 4 && title.includes(word.slice(0, -1)))) {
      score += 5;
    }
  }

  return score;
}

function isOverviewQuestion(message: string): boolean {
  return OVERVIEW_QUESTION.test(message);
}

function asksBlockedTopic(agent: Agent, message: string): MemoryCategory | null {
  for (const category of agent.blockedCategories) {
    if (BLOCKED_HINTS[category].test(message)) return category;
  }
  return null;
}

function blockedDenial(agent: Agent, category: MemoryCategory): string {
  const blocked = agent.blockedCategories.map((c) => CATEGORY_LABELS[c]).join(', ');
  return `I don't have access to your ${CATEGORY_LABELS[category]} memories — you've only shared ${agent.allowedCategories.map((c) => CATEGORY_LABELS[c]).join(' and ')} data with me. I cannot see ${blocked} information.`;
}

function buildOverviewReply(agent: Agent, memories: Memory[]): string {
  const blocked = agent.blockedCategories.map((c) => CATEGORY_LABELS[c]).join(', ');
  const bullets = memories
    .map((m) => {
      const line = m.content.split(/[.!?]/)[0]?.trim() ?? m.content;
      return `• ${m.title}: ${line}`;
    })
    .join('\n');

  return `I'm your ${agent.name}. Based only on memories you've selectively shared with me:\n\n${bullets}\n\nI do not have access to your ${blocked} information.`;
}

function buildFocusedReply(agent: Agent, memories: Memory[], message: string): string {
  const ranked = [...memories]
    .map((memory) => ({ memory, score: memoryRelevance(memory, message) }))
    .sort((a, b) => b.score - a.score);

  const topScore = ranked[0]?.score ?? 0;
  const relevant =
    topScore > 0 ? ranked.filter((r) => r.score >= Math.max(1, topScore - 1)).map((r) => r.memory) : memories;

  if (relevant.length === 1) {
    return `Based on what you've shared with me: ${relevant[0].content}`;
  }

  const bullets = relevant
    .map((m) => `• ${m.title}: ${m.content.split(/[.!?]/)[0]?.trim() ?? m.content}`)
    .join('\n');

  return `Here's what I can tell you from your approved memories:\n\n${bullets}`;
}

function buildMockReply(agent: Agent, memories: Memory[], message: string): string {
  const blockedTopic = asksBlockedTopic(agent, message);
  if (blockedTopic) return blockedDenial(agent, blockedTopic);

  if (isOverviewQuestion(message)) {
    return buildOverviewReply(agent, memories);
  }

  const focused = buildFocusedReply(agent, memories, message);
  const blocked = agent.blockedCategories.map((c) => CATEGORY_LABELS[c]).join(', ');
  return `${focused}\n\n(I only have access to shared ${agent.allowedCategories.map((c) => CATEGORY_LABELS[c]).join('/')} memories — not ${blocked}.)`;
}

async function buildOpenAIReply(
  agent: Agent,
  memories: Memory[],
  message: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return buildMockReply(agent, memories, message);

  const blocked = agent.blockedCategories.map((c) => CATEGORY_LABELS[c]).join(', ');
  const memoryContext = JSON.stringify(
    memories.map((m) => ({ title: m.title, content: m.content }))
  );

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

  if (!res.ok) return buildMockReply(agent, memories, message);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() ?? buildMockReply(agent, memories, message);
}

/** Chat only uses memories in the agent's approved scope (requires a valid proof). */
export async function handleChat(agentId: string, message: string) {
  const agent = getAgent(agentId);
  if (!agent) return { reply: 'Unknown agent.' };

  const proof = store.getProof(agentId);
  if (!proof?.verified) {
    return { reply: NEED_PROOF };
  }

  // Mock proofs: server-side grants are enough. Midnight: re-check grant commitment.
  if (proof.proofMode === 'midnight' && !verifyGrantProof(proof)) {
    return { reply: NEED_PROOF };
  }

  const accessible = store.getAccessibleMemories(agentId);
  if (accessible.length === 0) {
    return { reply: NEED_PROOF };
  }

  const reply = process.env.OPENAI_API_KEY
    ? await buildOpenAIReply(agent, accessible, message)
    : buildMockReply(agent, accessible, message);

  return { reply };
}
