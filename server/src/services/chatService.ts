import type { Agent, ChatMessage, Memory, MemoryCategory } from '../types.js';
import { agents, getAgentById } from '../data/seed.js';
import {
  getAccessibleMemories,
  hasRevokedAccessInMessage,
} from './permissionService.js';
import { store } from '../store.js';
import { v4 as uuidv4 } from 'uuid';

const REVOCATION_MESSAGE =
  'I no longer have authorization to access that memory.';

const PERMISSION_NEEDED_MESSAGE =
  'I need your permission to access relevant memories before I can answer. Please approve the requested memories in the dialog.';

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  health: 'Health',
  career: 'Career',
  finance: 'Finance',
  dating: 'Dating',
  journal: 'Personal Journal',
};

const CATEGORY_KEYWORDS: Record<MemoryCategory, RegExp> = {
  health:
    /\b(health|therapy|medications?|medicine|meds|doctor|anxiety|fitness|ssri|mental|illness|symptom|tired|fatigue|wellness|hospital)\b/i,
  career:
    /\b(career|job|work|promotion|salary|raise|negotiat|engineer|acme|manager|workplace|staff|review|role|network|feedback|mentor)\b/i,
  finance:
    /\b(debt|loan|money|budget|invest|savings|401k|finance|portfolio|emergency fund|student)\b/i,
  dating:
    /\b(dating|date|relationship|hobby|love|partner|match|romantic)\b/i,
  journal:
    /\b(journal|diary|personality|introvert|feelings|reflection)\b/i,
};

function getBlockedCategoryReferenced(
  message: string,
  blockedCategories: MemoryCategory[]
): MemoryCategory | null {
  for (const cat of blockedCategories) {
    if (CATEGORY_KEYWORDS[cat].test(message)) return cat;
  }
  return null;
}

function isFollowUpMessage(message: string): boolean {
  return /\b(concise|shorter|brief|elaborate|expand|clarify|more detail|less detail|you said|you mentioned|earlier|previous|last point|that point|aspect|follow[- ]?up|about that|the networking|network and)\b/i.test(
    message
  );
}

function buildCategoryDenial(agent: Agent, category: MemoryCategory): string {
  const label = CATEGORY_LABELS[category];
  const allowed = agent.allowedCategories
    .map((c) => CATEGORY_LABELS[c])
    .join(', ');
  return `I don't have authorization to access your ${label} memories. As your ${agent.name}, I can only use ${allowed} information you've approved for me. Try the ${label} Agent if you want to share those memories.`;
}

function buildMockResponse(agent: Agent, accessible: Memory[]): string {
  const blocked = agent.blockedCategories
    .map((c) => CATEGORY_LABELS[c] ?? c)
    .join(', ');

  if (accessible.length === 0) {
    return `I'm your ${agent.name}. I don't have any approved memories about you yet. I cannot access your ${blocked} information until you grant permission.`;
  }

  const bullets = accessible
    .map((m) => `• **${m.title}**: ${summarize(m.content)}`)
    .join('\n');

  return `I'm your ${agent.name}. Based only on memories you've selectively shared with me:\n\n${bullets}\n\nI do not have access to your ${blocked} information. Each version of you stays private until you choose to disclose it.`;
}

function buildMockFollowUp(
  agent: Agent,
  accessible: Memory[],
  message: string,
  history: ChatMessage[] = []
): string {
  const normalized = message.toLowerCase();

  if (
    isFollowUpMessage(message) &&
    /\b(network|feedback|mentor)\b/i.test(message + ' ' + history.map((m) => m.content).join(' '))
  ) {
    return `On networking (concise): ask 2–3 senior engineers or your manager for Staff-track feedback, one specific question per chat, and a 10-minute calendar slot. Skip broad networking events — focus on promotion-relevant input before Q3.`;
  }

  if (/\b(raise|salary|negotiat|promotion)\b/.test(normalized)) {
    const salary = accessible.find((m) => m.id === 'mem-career-3');
    const promo = accessible.find((m) => m.id === 'mem-career-2');
    if (salary || promo) {
      return `Based on what you've shared with me: ${salary?.content ?? ''} ${promo ? promo.content.split('.')[0] + '.' : ''}

Here are a few tips for your raise conversation:
• Anchor on your strong performance reviews and the Staff Engineer track
• Research market rates for Staff-level engineers before the meeting
• Frame the 15% ask around expanded scope (architecture doc, platform migration leadership)
• You prefer staying at Acme — use that as commitment, not weakness

I can only advise on career memories you've approved. I cannot access health, finance, dating, or journal data.`;
    }
  }

  return buildMockResponse(agent, accessible);
}

function summarize(content: string): string {
  const sentence = content.split(/[.!?]/)[0]?.trim() ?? content;
  return sentence.length > 120 ? sentence.slice(0, 117) + '...' : sentence;
}

async function buildOpenAIResponse(
  agent: Agent,
  accessible: Memory[],
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  if (!apiKey) {
    return buildMockFollowUp(agent, accessible, message, history);
  }

  const memoryContext = JSON.stringify(
    accessible.map((m) => ({
      title: m.title,
      category: m.category,
      content: m.content,
    }))
  );

  const blocked = agent.blockedCategories
    .map((c) => CATEGORY_LABELS[c])
    .join(', ');
  const allowed = agent.allowedCategories
    .map((c) => CATEGORY_LABELS[c])
    .join(', ');

  const systemPrompt = `You are the ${agent.name}. The user has approved sharing specific memories with you (JSON below).

Rules:
1. Answer questions that relate to ${allowed} using ONLY the approved memories. Be helpful and conversational on follow-ups.
2. If the user asks about ${blocked}, say clearly you do not have authorization to access that category — do NOT say "I have no approved access yet" when memories are provided.
3. If approved memories are empty, say the user must grant permission first.
4. Never invent facts beyond the provided memories. Never leak blocked categories.
5. Use the conversation history for follow-ups (e.g. "be more concise on X you mentioned"). Stay within approved memories.

Approved memories: ${memoryContext}`;

  const recentHistory = history.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // MIDNIGHT_INTEGRATION: Verify proofHash on-chain before attaching memories to LLM context
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    console.warn('OpenAI request failed, falling back to mock');
    return buildMockFollowUp(agent, accessible, message, history);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return (
    data.choices?.[0]?.message?.content?.trim() ??
    buildMockFollowUp(agent, accessible, message, history)
  );
}

export async function handleChat(
  agentId: string,
  message: string,
  history: ChatMessage[] = []
): Promise<{ reply: string; usedMemoryIds: string[]; denied?: boolean }> {
  const agent = getAgentById(agentId);
  if (!agent) {
    return { reply: 'Unknown agent.', usedMemoryIds: [] };
  }

  if (hasRevokedAccessInMessage(agentId, message)) {
    store.addLogEntry({
      id: uuidv4(),
      timestamp: Date.now(),
      agentId,
      action: 'chat_denied',
      memoryIds: [],
      message: 'Chat blocked — revoked memory access',
    });
    return {
      reply: REVOCATION_MESSAGE,
      usedMemoryIds: [],
      denied: true,
    };
  }

  const accessible = getAccessibleMemories(agentId);

  if (accessible.length === 0) {
    store.addLogEntry({
      id: uuidv4(),
      timestamp: Date.now(),
      agentId,
      action: 'chat_denied',
      memoryIds: [],
      message: 'Chat attempted without approved memories',
    });
    return {
      reply: PERMISSION_NEEDED_MESSAGE,
      usedMemoryIds: [],
    };
  }

  const blockedRef = getBlockedCategoryReferenced(
    message,
    agent.blockedCategories
  );
  if (blockedRef) {
    const reply = buildCategoryDenial(agent, blockedRef);
    store.addLogEntry({
      id: uuidv4(),
      timestamp: Date.now(),
      agentId,
      action: 'chat_denied',
      memoryIds: [],
      message: `Question referenced blocked category: ${blockedRef}`,
    });
    return { reply, usedMemoryIds: [], denied: true };
  }

  const reply = process.env.OPENAI_API_KEY
    ? await buildOpenAIResponse(agent, accessible, message, history)
    : buildMockFollowUp(agent, accessible, message, history);

  store.addLogEntry({
    id: uuidv4(),
    timestamp: Date.now(),
    agentId,
    action: 'chat_access',
    memoryIds: accessible.map((m) => m.id),
    message: `Responded using ${accessible.length} approved memor${accessible.length === 1 ? 'y' : 'ies'}`,
  });

  return {
    reply,
    usedMemoryIds: accessible.map((m) => m.id),
  };
}

export function getAgentsList() {
  return agents;
}
