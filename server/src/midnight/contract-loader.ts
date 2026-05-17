import { existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { midnightConfig } from './config.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let compiledContractPromise: Promise<any> | null = null;

export function getZkConfigPath(): string {
  return midnightConfig.zkArtifactsPath;
}

export async function getCompiledContract() {
  if (!compiledContractPromise) {
    compiledContractPromise = loadCompiledContract();
  }
  return compiledContractPromise;
}

async function loadCompiledContract() {
  const zkPath = getZkConfigPath();
  const contractPath = join(zkPath, 'contract', 'index.js');
  if (!existsSync(contractPath)) {
    throw new Error(`Contract not compiled. Run: npm run compile:contract`);
  }

  const module = await import(pathToFileURL(contractPath).href);
  return CompiledContract.make('memory-access', module.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(zkPath)
  );
}
