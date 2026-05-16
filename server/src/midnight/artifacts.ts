import { readFileSync } from 'fs';
import { join } from 'path';
import { midnightConfig, zkArtifactsExist } from './config.js';

export const GRANT_CIRCUIT_ID = 'grantAgentAccess' as const;

export function getZkArtifactsPath(): string {
  return midnightConfig.zkArtifactsPath;
}

export function getContractModulePath(): string {
  return join(midnightConfig.zkArtifactsPath, 'contract', 'index.js');
}

export function getZkirPath(circuitId: string = GRANT_CIRCUIT_ID): string {
  return join(midnightConfig.zkArtifactsPath, 'zkir', `${circuitId}.zkir`);
}

export function getContractInfo(): {
  'compiler-version': string;
  circuits: { name: string }[];
} {
  const raw = readFileSync(
    join(midnightConfig.zkArtifactsPath, 'compiler', 'contract-info.json'),
    'utf8'
  );
  return JSON.parse(raw) as ReturnType<typeof getContractInfo>;
}

export function artifactsReady(): boolean {
  return zkArtifactsExist();
}
