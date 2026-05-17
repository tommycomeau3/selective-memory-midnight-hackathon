import { firstValueFrom } from 'rxjs';
import type { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { getNetworkConfig } from './config.js';
import { formatWalletError } from './wallet-errors.js';

/** Blocks behind tip allowed for deploy (preprod often never hits gap 0). */
const SYNC_ALLOWED_GAP = 3000n;
/** Looser check used if the strict wait times out. */
const SYNC_FALLBACK_GAP = 10_000n;
const DEFAULT_SYNC_TIMEOUT_MS = 20 * 60 * 1000;
const SKIP_SYNC_WARMUP_MS = 90_000;
const PROGRESS_INTERVAL_MS = 15_000;

function skipSyncWait(): boolean {
  return process.env.MIDNIGHT_SKIP_SYNC_WAIT === 'true';
}

function forceDeployOnSyncTimeout(): boolean {
  return process.env.MIDNIGHT_FORCE_DEPLOY_ON_SYNC_TIMEOUT === 'true';
}

type ProgressLike = {
  isStrictlyComplete?: () => boolean;
  isCompleteWithin?: (gap: bigint) => boolean;
};

function formatProgress(progress: ProgressLike, gap = SYNC_ALLOWED_GAP): string {
  try {
    if (progress.isStrictlyComplete?.()) return 'complete';
    if (progress.isCompleteWithin?.(gap)) return `within ${gap} blocks`;
    return 'syncing';
  } catch {
    return 'syncing';
  }
}

function isCompleteEnough(
  progress: ProgressLike,
  gap: bigint = SYNC_ALLOWED_GAP
): boolean {
  try {
    return (
      progress.isStrictlyComplete?.() === true ||
      progress.isCompleteWithin?.(gap) === true
    );
  } catch {
    return false;
  }
}

async function readWalletState(wallet: WalletFacade) {
  return firstValueFrom(wallet.state());
}

async function isWalletCompleteEnough(
  wallet: WalletFacade,
  gap: bigint
): Promise<boolean> {
  const s = await readWalletState(wallet);
  return (
    isCompleteEnough(s.shielded.state.progress, gap) &&
    isCompleteEnough(s.unshielded.progress, gap) &&
    isCompleteEnough(s.dust.state.progress, gap)
  );
}

/** Preprod sync streams often error after shielded is close enough — still try deploy. */
async function tryContinueAfterSyncError(
  wallet: WalletFacade,
  err: unknown
): Promise<boolean> {
  let s;
  try {
    s = await readWalletState(wallet);
  } catch {
    return false;
  }

  const shieldedOk = isCompleteEnough(s.shielded.state.progress, SYNC_ALLOWED_GAP);
  const unshieldedOk = isCompleteEnough(s.unshielded.progress, SYNC_ALLOWED_GAP);
  const dustOk = isCompleteEnough(s.dust.state.progress, SYNC_ALLOWED_GAP);

  if (shieldedOk && unshieldedOk && dustOk) {
    console.warn(
      '\nSync stream errored but all sub-wallets are within gap — continuing deploy.\n'
    );
    console.warn(formatWalletError(err), '\n');
    return true;
  }

  if (shieldedOk && unshieldedOk) {
    console.warn(
      '\nSync stream errored; shielded + unshielded are ready (dust still catching up).\n' +
        'Continuing — deploy needs DUST for fees; will fail clearly if balance is missing.\n'
    );
    console.warn(formatWalletError(err), '\n');
    return true;
  }

  if (await isWalletCompleteEnough(wallet, SYNC_FALLBACK_GAP)) {
    console.warn(
      `\nSync errored but wallet is within ${SYNC_FALLBACK_GAP} blocks — continuing deploy.\n`
    );
    console.warn(formatWalletError(err), '\n');
    return true;
  }

  return false;
}

async function logSyncProgress(wallet: WalletFacade, startedAt: number): Promise<void> {
  try {
    const s = await firstValueFrom(wallet.state());
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    console.log(
      `[${elapsed}s] isSynced=${s.isSynced} | shielded=${formatProgress(s.shielded.state.progress)} | unshielded=${formatProgress(s.unshielded.progress)} | dust=${formatProgress(s.dust.state.progress)}`
    );
  } catch {
    console.log('[sync] waiting for wallet state...');
  }
}

/**
 * Wait for wallet sync with progress logs and timeout.
 * Uses allowedGap on sub-wallets — strict sync (gap 0) can hang forever on preprod.
 */
export async function waitForWalletSynced(
  wallet: WalletFacade,
  walletAddress: string,
  timeoutMs = DEFAULT_SYNC_TIMEOUT_MS
): Promise<void> {
  const network = getNetworkConfig();
  const faucet = network.faucet;

  console.log(`Wallet address: ${walletAddress}`);
  if (faucet) {
    console.log(`Fund with tDUST: ${faucet}`);
  }

  const startedAt = Date.now();

  if (skipSyncWait()) {
    console.warn(
      `\nMIDNIGHT_SKIP_SYNC_WAIT=true — skipping full sync wait (${SKIP_SYNC_WARMUP_MS / 1000}s warmup, then deploy attempt).\n`
    );
    await logSyncProgress(wallet, startedAt);
    const warmupTimer = setInterval(() => {
      void logSyncProgress(wallet, startedAt);
    }, PROGRESS_INTERVAL_MS);
    await new Promise((r) => setTimeout(r, SKIP_SYNC_WARMUP_MS));
    clearInterval(warmupTimer);
    console.warn('\nWarmup done — attempting deploy with partial sync.\n');
    return;
  }

  console.log(`Syncing (timeout ${Math.round(timeoutMs / 60_000)} min)...\n`);
  await logSyncProgress(wallet, startedAt);
  const progressTimer = setInterval(() => {
    void logSyncProgress(wallet, startedAt);
  }, PROGRESS_INTERVAL_MS);

  const syncWork = Promise.all([
    wallet.shielded.waitForSyncedState(SYNC_ALLOWED_GAP),
    wallet.unshielded.waitForSyncedState(SYNC_ALLOWED_GAP),
    wallet.dust.waitForSyncedState(SYNC_ALLOWED_GAP),
  ]);

  const timeout = new Promise<'timeout'>((resolve) => {
    setTimeout(() => resolve('timeout'), timeoutMs);
  });

  try {
    let result: 'synced' | 'timeout';
    try {
      result = await Promise.race([syncWork.then(() => 'synced' as const), timeout]);
    } catch (syncErr) {
      if (await tryContinueAfterSyncError(wallet, syncErr)) {
        result = 'synced';
      } else {
        throw syncErr;
      }
    }

    if (result === 'timeout') {
      if (await isWalletCompleteEnough(wallet, SYNC_FALLBACK_GAP)) {
        console.log(
          `\nSync wait hit ${Math.round(timeoutMs / 60_000)} min but wallet is within ${SYNC_FALLBACK_GAP} blocks of tip — continuing deploy.\n`
        );
      } else if (await tryContinueAfterSyncError(wallet, new Error('sync timeout'))) {
        // shielded/unshielded ready, dust lagging
      } else if (forceDeployOnSyncTimeout()) {
        console.warn(
          `\nMIDNIGHT_FORCE_DEPLOY_ON_SYNC_TIMEOUT=true — continuing after ${Math.round(timeoutMs / 1000)}s (sync incomplete).\n`
        );
      } else {
        const s = await readWalletState(wallet).catch(() => null);
        const unshieldedOnly =
          s &&
          isCompleteEnough(s.unshielded.progress, SYNC_ALLOWED_GAP) &&
          !isCompleteEnough(s.shielded.state.progress, SYNC_ALLOWED_GAP);

        throw new Error(
          `Wallet sync timed out after ${Math.round(timeoutMs / 1000)}s (shielded/dust still catching up).\n` +
            (unshieldedOnly
              ? `  • Unshielded is ready but shielded/dust are not — preprod sync is stuck.\n`
              : '') +
            `  • Hackathon demo without deploy: set MIDNIGHT_ENABLED=false in .env\n` +
            `  • Last resort: MIDNIGHT_SKIP_SYNC_WAIT=true npm run deploy:midnight -w server\n` +
            `  • Fund wallet: ${faucet ?? 'preprod faucet'} → ${walletAddress}\n` +
            `  • Proof server: npm run midnight:up`
        );
      }
    }

    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    console.log(`\nWallet synced in ${elapsed}s.\n`);
  } finally {
    clearInterval(progressTimer);
  }
}
