import { Cause } from 'effect';

/** Unwrap Effect/Midnight wallet errors for readable CLI output. */
export function formatWalletError(err: unknown): string {
  const root = unwrapFiberFailure(err);
  if (Cause.isCause(root)) {
    return Cause.pretty(root);
  }

  if (root && typeof root === 'object' && '_tag' in root) {
    const tag = String((root as { _tag: unknown })._tag);
    const detail = formatCause('cause' in root ? (root as { cause: unknown }).cause : root);

    if (tag === 'Wallet.Sync') {
      return (
        `Wallet sync failed (indexer / ledger event stream).\n` +
        `  Detail: ${detail}\n` +
        `  Fixes:\n` +
        `    • npm install from repo root (ledger-v8 must be 8.1.0)\n` +
        `    • node -v → v22.x\n` +
        `    • Retry: npm run deploy:midnight -w server`
      );
    }

    return `${tag}: ${detail}`;
  }

  return formatCause(root);
}

function unwrapFiberFailure(err: unknown): unknown {
  if (!err || typeof err !== 'object') return err;
  const tag = '_tag' in err ? String((err as { _tag: unknown })._tag) : '';
  if ((tag === 'FiberFailure' || tag === 'Failure') && 'cause' in err) {
    return (err as { cause: unknown }).cause;
  }
  return err;
}

function formatCause(cause: unknown, depth = 0): string {
  if (depth > 6) return '…';
  if (cause instanceof Error && cause.message) return cause.message;
  if (Cause.isCause(cause)) return Cause.pretty(cause);
  if (cause && typeof cause === 'object') {
    if ('message' in cause && typeof (cause as { message: unknown }).message === 'string') {
      const msg = (cause as { message: string }).message;
      if (msg) return msg;
    }
    if ('cause' in cause) return formatCause((cause as { cause: unknown }).cause, depth + 1);
    if ('_tag' in cause) {
      const tag = String((cause as { _tag: unknown })._tag);
      const inner =
        'cause' in cause ? formatCause((cause as { cause: unknown }).cause, depth + 1) : '';
      return inner ? `${tag} (${inner})` : tag;
    }
    try {
      return JSON.stringify(cause);
    } catch {
      return String(cause);
    }
  }
  return String(cause ?? 'unknown');
}
