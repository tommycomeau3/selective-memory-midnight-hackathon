import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import type { Agent, AccessLogEntry, ChatMessage, Memory, Proof } from '../types';
import { PermissionModal } from '../components/PermissionModal';
import { ProofPanel, VerifiedBanner } from '../components/ProofPanel';
import { AccessLog } from '../components/AccessLog';

const DEMO_QUESTION = 'Tell me what you know about me.';

export function Chat() {
  const [searchParams] = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState(searchParams.get('agent') ?? 'career');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingMemories, setPendingMemories] = useState<Memory[]>([]);
  const [pendingMessage, setPendingMessage] = useState('');
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [accessLog, setAccessLog] = useState<AccessLogEntry[]>([]);
  const [showVerified, setShowVerified] = useState(false);
  const [hasGrants, setHasGrants] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshSidebar = useCallback(async () => {
    const [p, l] = await Promise.all([api.getProofs(), api.getAccessLog()]);
    setProofs(p);
    setAccessLog(l);
  }, []);

  useEffect(() => {
    api.getAgents().then(setAgents);
    refreshSidebar();
  }, [refreshSidebar]);

  useEffect(() => {
    const param = searchParams.get('agent');
    if (param) setAgentId(param);
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedAgent = agents.find((a) => a.id === agentId);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const priorHistory = messages;
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { pending, alreadyGranted, blockedByRevocation } =
        await api.requestPermissions(agentId, text.trim());

      if (blockedByRevocation) {
        const { reply } = await api.chat(agentId, text.trim(), priorHistory);
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        await refreshSidebar();
        setLoading(false);
        return;
      }

      if (pending.length > 0) {
        setPendingMemories(pending);
        setPendingMessage(text.trim());
        setHasGrants(alreadyGranted.length > 0);
        setModalOpen(true);
        setLoading(false);
        return;
      }

      const { reply } = await api.chat(agentId, text.trim(), priorHistory);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      await refreshSidebar();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function completeChatAfterPermission() {
    setLoading(true);
    try {
      const history: ChatMessage[] = messages.some(
        (m) => m.role === 'user' && m.content === pendingMessage
      )
        ? messages
        : [
            ...messages,
            { role: 'user' as const, content: pendingMessage },
          ];
      const { reply } = await api.chat(agentId, pendingMessage, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      await refreshSidebar();
    } finally {
      setLoading(false);
      setPendingMessage('');
    }
  }

  async function handleApprove(duration: 'session' | '1h' = 'session') {
    setLoading(true);
    try {
      await api.approve(
        agentId,
        pendingMemories.map((m) => m.id),
        duration
      );
      setShowVerified(true);
      setTimeout(() => setShowVerified(false), 8000);
      setModalOpen(false);
      await refreshSidebar();
      await completeChatAfterPermission();
    } finally {
      setLoading(false);
    }
  }

  async function handleDeny() {
    setLoading(true);
    try {
      await api.deny(
        agentId,
        pendingMemories.map((m) => m.id)
      );
      setModalOpen(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Access denied. I cannot answer questions about memories you have not shared with me.',
        },
      ]);
      await refreshSidebar();
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    setLoading(true);
    try {
      await api.revoke(agentId);
      setModalOpen(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'All access for this agent has been revoked. Ask again to see the authorization message.',
        },
      ]);
      await refreshSidebar();
    } finally {
      setLoading(false);
    }
  }

  function insertDemoQuestion() {
    setInput(DEMO_QUESTION);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <header className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Bot className="h-7 w-7 text-cyan-400" />
            <h1 className="text-3xl font-bold">Agent Chat</h1>
          </div>
          <p className="text-slate-400">
            Select an agent and ask a question. Approve memory access before the
            AI responds.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          {agents.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setAgentId(a.id);
                setMessages([]);
                setShowVerified(false);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                agentId === a.id
                  ? 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-cyan-200 ring-1 ring-cyan-500/50'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>

        {selectedAgent && (
          <p className="mb-4 text-sm text-slate-500">{selectedAgent.description}</p>
        )}

        <button
          type="button"
          onClick={insertDemoQuestion}
          className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-violet-500/40 bg-violet-500/5 px-4 py-2 text-sm text-violet-300 transition hover:bg-violet-500/10"
        >
          <Sparkles className="h-4 w-4" />
          Try: &ldquo;{DEMO_QUESTION}&rdquo;
        </button>

        {showVerified && <VerifiedBanner />}

        <div className="glass-card mb-4 flex h-[420px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-slate-500">
                No messages yet. Ask your agent something.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-cyan-600/80 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {m.content.replace(/\*\*/g, '')}
                </div>
              </div>
            ))}
            {loading && !modalOpen && (
              <p className="text-sm text-slate-500">Thinking...</p>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="flex gap-2 border-t border-slate-800 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your agent..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm outline-none ring-cyan-500/50 focus:ring-2"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-4 py-2.5 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <aside className="space-y-4">
        <ProofPanel proofs={proofs} />
        <AccessLog entries={accessLog} />
      </aside>

      {modalOpen && selectedAgent && (
        <PermissionModal
          agentName={selectedAgent.name}
          memories={pendingMemories}
          loading={loading}
          showRevoke={hasGrants}
          onApprove={() => handleApprove('session')}
          onApprove1h={() => handleApprove('1h')}
          onDeny={handleDeny}
          onRevoke={handleRevoke}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
