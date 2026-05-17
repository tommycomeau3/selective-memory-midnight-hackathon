import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getDeploymentAddress, loadMidnightState } from './state.js';
import { resolveNetworkConfig, type NetworkConfig, type NetworkId } from './network.js';

const midnightDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(midnightDir, '../../..');

function networkIdFromEnv(): NetworkId {
  const id = (process.env.MIDNIGHT_NETWORK_ID ?? 'preprod') as NetworkId;
  return id === 'undeployed' || id === 'preview' || id === 'preprod' ? id : 'preprod';
}

function resolveContractAddress(networkId: NetworkId): string {
  if (process.env.MIDNIGHT_CONTRACT_ADDRESS?.trim()) {
    return process.env.MIDNIGHT_CONTRACT_ADDRESS.trim();
  }
  return getDeploymentAddress(networkId) ?? '';
}

function resolveWalletSeed(networkId: NetworkId): string {
  if (process.env.MIDNIGHT_WALLET_SEED?.trim()) {
    return process.env.MIDNIGHT_WALLET_SEED.trim();
  }
  return loadMidnightState()?.wallets?.[networkId]?.seed ?? '';
}

export function getActiveNetworkId(): NetworkId {
  return networkIdFromEnv();
}

/** Read at call time (deploy script sets env / state after module load). */
const activeNetworkId = networkIdFromEnv();
const networkDefaults = resolveNetworkConfig(activeNetworkId);

/** Midnight Tier A configuration. */
export const midnightConfig = {
  enabled: process.env.MIDNIGHT_ENABLED === 'true',
  repoRoot,
  networkId: activeNetworkId,
  proofServerUrl: (process.env.MIDNIGHT_PROOF_SERVER_URL ?? networkDefaults.proofServer).replace(
    /\/$/,
    ''
  ),
  zkArtifactsPath: resolve(
    repoRoot,
    process.env.MIDNIGHT_ZK_ARTIFACTS_PATH ?? 'contracts/managed/memory-access'
  ),
  privateStatePassword:
    process.env.MIDNIGHT_PRIVATE_STATE_PASSWORD?.trim() ||
    'Local-Devnet-Development-Placeholder-1',
  indexerQueryUrl:
    process.env.MIDNIGHT_INDEXER_QUERY_URL?.trim() || networkDefaults.indexer,
  indexerWsUrl: process.env.MIDNIGHT_INDEXER_WS_URL?.trim() || networkDefaults.indexerWS,
  nodeUrl: process.env.MIDNIGHT_NODE_URL?.trim() || networkDefaults.node,
};

export function getNetworkConfig(): NetworkConfig {
  return {
    ...networkDefaults,
    networkId: midnightConfig.networkId,
    proofServer: midnightConfig.proofServerUrl,
    indexer: midnightConfig.indexerQueryUrl,
    indexerWS: midnightConfig.indexerWsUrl,
    node: midnightConfig.nodeUrl,
  };
}

export function zkArtifactsExist(): boolean {
  const base = midnightConfig.zkArtifactsPath;
  const verifier = resolve(base, 'keys', 'grantAgentAccess.verifier');
  const prover = resolve(base, 'keys', 'grantAgentAccess.prover');
  try {
    const v = readFileSync(verifier, 'utf8');
    return (
      v.startsWith('midnight:verifier-key') &&
      readFileSync(prover).length > 0
    );
  } catch {
    return false;
  }
}

/** True when real ZK grant transactions can run. */
export function canUseMidnightZk(): boolean {
  return (
    midnightConfig.enabled &&
    zkArtifactsExist() &&
    Boolean(getContractAddress()) &&
    Boolean(getWalletSeed())
  );
}

export function getWalletSeed(): string {
  return resolveWalletSeed(getActiveNetworkId());
}

/** Read at call time. */
export function getContractAddress(): string {
  return resolveContractAddress(getActiveNetworkId());
}
