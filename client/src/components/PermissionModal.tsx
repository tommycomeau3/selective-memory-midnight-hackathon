import { Shield, Clock, X, Check, Ban, ShieldOff } from 'lucide-react';
import type { Memory } from '../types';
import { CATEGORY_LABELS } from '../types';

interface PermissionModalProps {
  agentName: string;
  memories: Memory[];
  onApprove: () => void;
  onDeny: () => void;
  onApprove1h: () => void;
  onRevoke: () => void;
  onClose: () => void;
  showRevoke: boolean;
  loading?: boolean;
}

export function PermissionModal({
  agentName,
  memories,
  onApprove,
  onDeny,
  onApprove1h,
  onRevoke,
  onClose,
  showRevoke,
  loading,
}: PermissionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative z-10 w-full max-w-lg animate-slide-up glass-card border-cyan-500/30 p-6 shadow-2xl shadow-cyan-500/10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/20 p-2">
            <Shield className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Memory Access Request</h2>
            <p className="text-sm text-slate-400">
              {agentName} is requesting access to {memories.length} memor
              {memories.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>

        <ul className="mb-6 max-h-48 space-y-2 overflow-y-auto">
          {memories.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
            >
              <span className="font-medium">{m.title}</span>
              <span className="text-xs text-slate-500">
                {CATEGORY_LABELS[m.category]} · {m.sensitivity}
              </span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            disabled={loading}
            onClick={onApprove}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onApprove1h}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
          >
            <Clock className="h-4 w-4" />
            1 hour
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onDeny}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm font-medium transition hover:bg-slate-700 disabled:opacity-50"
          >
            <Ban className="h-4 w-4" />
            Deny
          </button>
          {showRevoke ? (
            <button
              type="button"
              disabled={loading}
              onClick={onRevoke}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600/90 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-50"
            >
              <ShieldOff className="h-4 w-4" />
              Revoke
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-600 px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
