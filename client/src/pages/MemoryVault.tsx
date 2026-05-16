import { useEffect, useState } from 'react';
import { Vault } from 'lucide-react';
import { api } from '../lib/api';
import type { Memory, MemoryCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import { MemoryCard } from '../components/MemoryCard';

const categories: (MemoryCategory | 'all')[] = [
  'all',
  'health',
  'career',
  'finance',
  'dating',
  'journal',
];

export function MemoryVault() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filter, setFilter] = useState<MemoryCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMemories()
      .then(setMemories)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === 'all' ? memories : memories.filter((m) => m.category === filter);

  return (
    <div>
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Vault className="h-7 w-7 text-cyan-400" />
          <h1 className="text-3xl font-bold">Memory Vault</h1>
        </div>
        <p className="text-slate-400">
          Your private memories across five categories. Content stays hidden
          until you approve agent access.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              filter === c
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading vault...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}
    </div>
  );
}
