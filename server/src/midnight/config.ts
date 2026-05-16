import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const midnightDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(midnightDir, '../../..');

/** Midnight Tier A configuration (Phase 0+). */
export const midnightConfig = {
  enabled: process.env.MIDNIGHT_ENABLED === 'true',
  proofServerUrl: (process.env.MIDNIGHT_PROOF_SERVER_URL ?? 'http://127.0.0.1:6300').replace(
    /\/$/,
    ''
  ),
  networkId: process.env.MIDNIGHT_NETWORK_ID ?? 'preprod',
  zkArtifactsPath: resolve(
    repoRoot,
    process.env.MIDNIGHT_ZK_ARTIFACTS_PATH ?? 'contracts/managed/memory-access'
  ),
  contractAddress: process.env.MIDNIGHT_CONTRACT_ADDRESS ?? '',
  walletSeed: process.env.MIDNIGHT_WALLET_SEED ?? '',
  privateStatePassword: process.env.MIDNIGHT_PRIVATE_STATE_PASSWORD ?? '',
  indexerQueryUrl: process.env.MIDNIGHT_INDEXER_QUERY_URL ?? '',
  indexerWsUrl: process.env.MIDNIGHT_INDEXER_WS_URL ?? '',
};

export function isMidnightConfigured(): boolean {
  return midnightConfig.enabled;
}

export function zkArtifactsExist(): boolean {
  return existsSync(resolve(midnightConfig.zkArtifactsPath, 'keys'));
}
