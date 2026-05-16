import { Link } from 'react-router-dom';
import {
  Briefcase,
  Heart,
  HeartPulse,
  Wallet,
  MessageSquare,
  Check,
  X,
} from 'lucide-react';
import type { Agent } from '../types';
import { CATEGORY_LABELS } from '../types';

const icons: Record<string, typeof Briefcase> = {
  briefcase: Briefcase,
  'heart-pulse': HeartPulse,
  wallet: Wallet,
  heart: Heart,
};

export function AgentCard({ agent }: { agent: Agent }) {
  const Icon = icons[agent.icon] ?? Briefcase;

  return (
    <article className="glass-card flex flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/30">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-3">
          <Icon className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{agent.name}</h3>
          <p className="text-sm text-slate-400">{agent.description}</p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Allowed
        </p>
        <div className="flex flex-wrap gap-1.5">
          {agent.allowedCategories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300"
            >
              <Check className="h-3 w-3" />
              {CATEGORY_LABELS[c]}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Blocked
        </p>
        <div className="flex flex-wrap gap-1.5">
          {agent.blockedCategories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/5 px-2 py-0.5 text-xs text-rose-300/80"
            >
              <X className="h-3 w-3" />
              {CATEGORY_LABELS[c]}
            </span>
          ))}
        </div>
      </div>

      <Link
        to={`/chat?agent=${agent.id}`}
        className="btn-secondary mt-auto w-full justify-center"
      >
        <MessageSquare className="h-4 w-4" />
        Chat with {agent.name.split(' ')[0]}
      </Link>
    </article>
  );
}
