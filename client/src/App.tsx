import { useEffect, useState } from 'react';
import {
  Briefcase,
  HeartPulse,
  Wallet,
  User,
  ShieldCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { api } from './lib/api';
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
    api.getAgents().then(setAgents);
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
      const p = await api.generateProof(selectedId);
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
      const { reply } = await api.chat(selectedId, text.trim());
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
    <div className="min-h-screen mesh-gradient text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Midnight selective disclosure
          </div>
          <h1 className="gradient-text text-4xl font-bold tracking-tight sm:text-5xl">
            Selective Memory AI
          </h1>
          <p className="mt-3 text-lg text-slate-400">
            Give each AI agent only the memories it needs.
          </p>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {agents.map((agent) => {
            const Icon = ICONS[agent.icon] ?? User;
            const active = selectedId === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => selectAgent(agent.id)}
                className={`glass-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  active
                    ? 'ring-2 ring-cyan-500/60 border-cyan-500/40'
                    : 'hover:border-slate-600'
                }`}
              >
                <Icon
                  className={`mb-2 h-6 w-6 ${active ? 'text-cyan-400' : 'text-slate-400'}`}
                />
                <p className="font-semibold">{agent.name}</p>
              </button>
            );
          })}
        </div>

        {selected ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass-card space-y-5 p-6">
              <div>
                <h2 className="text-xl font-semibold">{selected.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{selected.description}</p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-400/90">
                  Allowed memories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.allowedCategories.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300"
                    >
                      {CATEGORY_LABELS[c]}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-rose-400/90">
                  Blocked memories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.blockedCategories.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-rose-500/20 bg-rose-500/5 px-2.5 py-0.5 text-xs text-rose-300/80"
                    >
                      {CATEGORY_LABELS[c]}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateProof}
                disabled={proofLoading}
                className="btn-primary w-full disabled:opacity-50"
              >
                <ShieldCheck className="h-5 w-5" />
                {proofLoading ? 'Generating…' : 'Generate Midnight Access Proof'}
              </button>

              {proof && (
                <div className="animate-slide-up rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-sm">
                  <div className="mb-2 flex items-center gap-2 font-medium text-cyan-300">
                    <ShieldCheck className="h-4 w-4" />
                    Verified via Midnight selective disclosure
                  </div>
                  <dl className="space-y-1.5 font-mono text-xs text-slate-400">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Proof hash</dt>
                      <dd className="truncate text-cyan-400/90">
                        {proof.proofHash.slice(0, 24)}…
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Scope</dt>
                      <dd>{proof.scope.join(', ')}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Timestamp</dt>
                      <dd>{new Date(proof.timestamp).toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Status</dt>
                      <dd className="text-emerald-400">
                        {proof.verified ? 'Verified' : 'Pending'}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </section>

            <section className="glass-card flex flex-col p-6">
              <h2 className="mb-4 text-lg font-semibold">Chat</h2>
              {!proof && (
                <p className="mb-3 text-sm text-amber-400/90">
                  Generate a proof first to unlock scoped memory access.
                </p>
              )}
              <div className="mb-4 flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-950/50 p-3 min-h-[200px] max-h-[280px]">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">
                    Ask: &ldquo;{DEMO_QUESTION}&rdquo;
                  </p>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'ml-8 bg-cyan-600/80 text-white'
                          : 'mr-4 bg-slate-800 text-slate-200'
                      }`}
                    >
                      {m.content}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <p className="text-sm text-slate-500">Thinking…</p>
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
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !proof}
                  className="btn-primary px-4 py-2.5 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </section>
          </div>
        ) : (
          <p className="text-center text-slate-500">
            Select an agent to begin the demo.
          </p>
        )}
      </div>
    </div>
  );
}
