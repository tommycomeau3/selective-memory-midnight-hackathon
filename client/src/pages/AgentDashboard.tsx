import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { api } from '../lib/api';
import type { Agent } from '../types';
import { AgentCard } from '../components/AgentCard';

export function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAgents()
      .then(setAgents)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Bot className="h-7 w-7 text-violet-400" />
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
        </div>
        <p className="text-slate-400">
          Four AI agents with strict category boundaries. Each sees a different
          slice of you — never the full picture.
        </p>
      </header>

      {loading ? (
        <p className="text-slate-500">Loading agents...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {agents.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      )}
    </div>
  );
}
