import type { AccessStatus } from '../types';

const styles: Record<AccessStatus, string> = {
  private: 'bg-slate-700/60 text-slate-300 border-slate-600',
  shared: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  verified: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  revoked: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
};

const labels: Record<AccessStatus, string> = {
  private: 'Private',
  shared: 'Shared',
  verified: 'Verified',
  revoked: 'Revoked',
};

export function Badge({ status }: { status: AccessStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
