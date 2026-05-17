import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { NetworkId } from './network.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

export interface DeploymentRecord {
  address: string;
  deployedAt: string;
}

export interface MidnightStateFile {
  version: 1;
  activeNetwork: NetworkId;
  wallets: Partial<Record<NetworkId, { seed: string; createdAt: string }>>;
  deployments: Partial<Record<NetworkId, DeploymentRecord>>;
}

const STATE_FILE = join(repoRoot, '.midnight-state.json');

export function loadMidnightState(): MidnightStateFile | null {
  if (!existsSync(STATE_FILE)) return null;
  const parsed = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as MidnightStateFile;
  if (parsed?.version !== 1) return null;
  return parsed;
}

export function saveMidnightState(state: MidnightStateFile): void {
  writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

export function getDeploymentAddress(networkId: NetworkId): string | null {
  return loadMidnightState()?.deployments?.[networkId]?.address ?? null;
}
