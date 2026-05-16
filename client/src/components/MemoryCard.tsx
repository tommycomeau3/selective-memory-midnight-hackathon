import { Lock } from 'lucide-react';
import type { Memory } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types';
import { Badge } from './Badge';

const sensitivityColors = {
  low: 'text-slate-400',
  medium: 'text-amber-400',
  high: 'text-rose-400',
};

export function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <article className="glass-card group p-5 transition-all duration-200 hover:-translate-y-1 hover:border-slate-700">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[memory.category]}`}
        >
          {CATEGORY_LABELS[memory.category]}
        </span>
        <Badge status={memory.accessStatus} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-100">{memory.title}</h3>
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-950/50 px-3 py-2 font-mono text-xs text-slate-500">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{memory.preview}</span>
      </div>
      <p className={`text-xs font-medium capitalize ${sensitivityColors[memory.sensitivity]}`}>
        Sensitivity: {memory.sensitivity}
      </p>
    </article>
  );
}
