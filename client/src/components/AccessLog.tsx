import { ScrollText } from 'lucide-react';
import type { AccessLogEntry } from '../types';

const actionColors: Record<string, string> = {
  approved: 'text-emerald-400',
  approved_1h: 'text-cyan-400',
  denied: 'text-amber-400',
  revoked: 'text-rose-400',
  verified: 'text-violet-400',
  request: 'text-slate-400',
  chat_access: 'text-blue-400',
  chat_denied: 'text-rose-400',
};

export function AccessLog({ entries }: { entries: AccessLogEntry[] }) {
  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <ScrollText className="h-4 w-4 text-violet-400" />
        Access Log
      </h3>
      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {entries.length === 0 ? (
          <li className="text-xs text-slate-500">No activity yet.</li>
        ) : (
          entries.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-xs"
            >
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <span
                  className={`font-medium uppercase ${actionColors[e.action] ?? 'text-slate-400'}`}
                >
                  {e.action.replace('_', ' ')}
                </span>
                <span className="text-slate-600">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-slate-400">{e.message}</p>
              <p className="mt-0.5 text-slate-600">Agent: {e.agentId}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
