/**
 * One-time deploy: wallet seed + memory-access contract → .midnight-state.json
 * Run: npm run deploy:midnight -w server
 */
import '../loadEnv.js';
import { randomBytes } from 'crypto';
import { midnightConfig, repoRoot, zkArtifactsExist } from './config.js';
import { resolveNetworkConfig } from './network.js';
import { deployMemoryAccessContract } from './wallet-runtime.js';
import { loadMidnightState, saveMidnightState, type MidnightStateFile } from './state.js';
import { formatWalletError } from './wallet-errors.js';
import type { NetworkId } from './network.js';

async function assertProofServerReachable(): Promise<void> {
  const url = midnightConfig.proofServerUrl;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok && res.status >= 500) {
      throw new Error(`HTTP ${res.status}`);
    }
    console.log(`Proof server OK: ${url}\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Proof server not reachable at ${url} (${msg}).\nRun: npm run midnight:up`
    );
  }
}

async function main() {
  const networkId = midnightConfig.networkId as NetworkId;
  console.log(`\nDeploying memory-access to Midnight (${networkId})...\n`);

  if (!zkArtifactsExist()) {
    throw new Error(
      `ZK artifacts missing or corrupt at ${midnightConfig.zkArtifactsPath}.\n` +
        `Run: npm run compile:contract\n` +
        `(grantAgentAccess.verifier must start with midnight:verifier-key — empty files often mean iCloud placeholders.)`
    );
  }

  await assertProofServerReachable();

  const net = resolveNetworkConfig(networkId);
  console.log(`Indexer: ${net.indexer}`);
  console.log(`RPC: ${net.node}\n`);

  let state: MidnightStateFile = loadMidnightState() ?? {
    version: 1,
    activeNetwork: networkId,
    wallets: {},
    deployments: {},
  };

  if (!state.wallets[networkId]?.seed) {
    const seed = randomBytes(32).toString('hex');
    state.wallets[networkId] = { seed, createdAt: new Date().toISOString() };
    console.log('Generated new wallet seed (saved to .midnight-state.json)');
    console.log('Fund this wallet from the faucet if using preprod/preview.\n');
  }

  // Persist before deploy so getWalletSeed() can read from file or env.
  saveMidnightState(state);
  process.env.MIDNIGHT_WALLET_SEED = state.wallets[networkId]!.seed;

  const address = await deployMemoryAccessContract();
  state.deployments[networkId] = {
    address,
    deployedAt: new Date().toISOString(),
  };
  state.activeNetwork = networkId;
  saveMidnightState(state);
  process.env.MIDNIGHT_CONTRACT_ADDRESS = address;

  console.log('Contract deployed successfully.\n');
  console.log(`  Address: ${address}`);
  console.log(`  State file: ${repoRoot}/.midnight-state.json\n`);
  console.log('Add to .env:');
  console.log(`  MIDNIGHT_ENABLED=true`);
  console.log(`  MIDNIGHT_CONTRACT_ADDRESS=${address}`);
  console.log(`  MIDNIGHT_WALLET_SEED=${state.wallets[networkId]!.seed}`);
  console.log(`  MIDNIGHT_NETWORK_ID=${networkId}\n`);
}

main().catch((err) => {
  console.error(formatWalletError(err));
  process.exit(1);
});
