import { ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Proof } from '../types';

export function ProofPanel({ proofs }: { proofs: Proof[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (proofs.length === 0) {
    return (
      <div className="glass-card p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          Midnight Proofs
        </h3>
        <p className="text-xs text-slate-500">No proofs generated yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <ShieldCheck className="h-4 w-4 text-cyan-400" />
        Midnight Proofs
      </h3>
      <ul className="space-y-2">
        {proofs.slice(0, 5).map((p) => (
          <li key={p.proofId} className="rounded-lg border border-slate-800 bg-slate-950/50">
            <button
              type="button"
              onClick={() =>
                setExpanded(expanded === p.proofId ? null : p.proofId)
              }
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs"
            >
              <span className="font-mono text-cyan-400">{p.proofId}</span>
              {expanded === p.proofId ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {expanded === p.proofId && (
              <pre className="overflow-x-auto border-t border-slate-800 p-2 text-[10px] text-slate-400">
                {JSON.stringify(p, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VerifiedBanner() {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 animate-slide-up">
      <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-400" />
      <p className="text-sm text-cyan-100">
        Access verified via Midnight selective disclosure proof.
      </p>
    </div>
  );
}
