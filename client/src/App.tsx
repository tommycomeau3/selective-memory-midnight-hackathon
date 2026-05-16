import { useEffect, useState } from 'react';
import {
  Briefcase,
  HeartPulse,
  Wallet,
  User,
  ShieldCheck,
  Send,
  ChevronRight,
} from 'lucide-react';
import { generateProof, getAgents, sendChat } from './api';
import type { Agent, AgentAccessProof, ChatMessage } from './types';
import { CATEGORY_LABELS } from './types';

const ICONS: Record<string, typeof Briefcase> = {
  'heart-pulse': HeartPulse,
  briefcase: Briefcase,
  wallet: Wallet,
  user: User,
};

const DEMO_QUESTION = 'What do you know about me?';

export default function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proof, setProof] = useState<AgentAccessProof | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(DEMO_QUESTION);
  const [chatLoading, setChatLoading] = useState(false);

  const selected = agents.find((a) => a.id === selectedId);

  useEffect(() => {
    getAgents().then(setAgents);
  }, []);

  function selectAgent(id: string) {
    setSelectedId(id);
    setProof(null);
    setMessages([]);
    setInput(DEMO_QUESTION);
  }

  async function handleGenerateProof() {
    if (!selectedId) return;
    setProofLoading(true);
    try {
      const p = await generateProof(selectedId);
      setProof(p);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Proof generation failed');
    } finally {
      setProofLoading(false);
    }
  }

  async function handleSend(text: string) {
    if (!selectedId || !text.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setChatLoading(true);
    try {
      const { reply } = await sendChat(selectedId, text.trim());
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Chat failed',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-200/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            Selective Memory AI
          </span>
          <span className="text-xs text-neutral-500">Midnight hackathon demo</span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16 sm:pt-20">
        <header className="mb-16 text-center">
          <div className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl sm:leading-tight">
            Selective Memory AI
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-neutral-500">
            Give each AI agent only the memories it needs.
          </p>
        </header>

        <section className="mb-14">
          <p className="mb-4 text-center text-sm font-medium text-neutral-500">
            Choose an agent
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {agents.map((agent) => {
              const Icon = ICONS[agent.icon] ?? User;
              const active = selectedId === agent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => selectAgent(agent.id)}
                  className={`surface-card p-5 text-left transition-all duration-200 ${
                    active
                      ? 'border-neutral-900 ring-1 ring-neutral-900'
                      : 'hover:border-neutral-300 hover:bg-neutral-50/50'
                  }`}
                >
                  <Icon
                    className={`mb-3 h-5 w-5 ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
                  />
                  <p className="text-sm font-medium text-neutral-900">{agent.name}</p>
                </button>
              );
            })}
          </div>
        </section>

        {selected ? (
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <section className="surface-card space-y-6 p-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Selected agent
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                  {selected.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {selected.description}
                </p>
              </div>

              <div>
                <p className="mb-2.5 text-xs font-medium text-neutral-500">
                  Allowed memories
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.allowedCategories.map((c) => (
                    <span key={c} className="tag-allowed">
                      {CATEGORY_LABELS[c]}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-xs font-medium text-neutral-500">
                  Blocked memories
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.blockedCategories.map((c) => (
                    <span key={c} className="tag-blocked">
                      {CATEGORY_LABELS[c]}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateProof}
                disabled={proofLoading}
                className="btn-primary w-full"
              >
                {proofLoading ? 'Generating…' : 'Generate Midnight Access Proof'}
                {!proofLoading && <ChevronRight className="h-4 w-4" />}
              </button>

              {proof && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-sm font-medium text-neutral-900">
                      Verified via Midnight selective disclosure
                    </p>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                      <dt className="text-neutral-500">Proof hash</dt>
                      <dd className="font-mono text-xs text-neutral-700 break-all sm:max-w-[60%] sm:text-right">
                        {proof.proofHash.slice(0, 32)}…
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-neutral-200/80 pt-3">
                      <dt className="text-neutral-500">Scope</dt>
                      <dd className="font-medium text-neutral-800">
                        {proof.scope.join(', ')}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-500">Timestamp</dt>
                      <dd className="text-neutral-800">
                        {new Date(proof.timestamp).toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-500">Status</dt>
                      <dd className="font-medium text-emerald-700">
                        {proof.verified ? 'Verified' : 'Pending'}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </section>

            <section className="surface-card flex flex-col p-8">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Chat
              </h2>
              {!proof && (
                <p className="mt-2 text-sm text-neutral-500">
                  Generate a proof first to unlock scoped memory access.
                </p>
              )}

              <div className="mt-5 mb-5 min-h-[220px] max-h-[300px] flex-1 space-y-4 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-neutral-400">
                    Try asking: &ldquo;{DEMO_QUESTION}&rdquo;
                  </p>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'ml-auto bg-neutral-900 text-white'
                          : 'mr-auto border border-neutral-200 bg-white text-neutral-800'
                      }`}
                    >
                      {m.content}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <p className="text-sm text-neutral-400">Thinking…</p>
                )}
              </div>

              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={DEMO_QUESTION}
                  disabled={chatLoading}
                  className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !proof}
                  className="btn-primary !px-4 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </section>
          </div>
        ) : (
          <p className="text-center text-sm text-neutral-400">
            Select an agent above to begin the demo.
          </p>
        )}
      </main>
    </div>
  );
}
