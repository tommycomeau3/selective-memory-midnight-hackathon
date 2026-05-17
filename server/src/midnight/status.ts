import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import {
  canUseMidnightZk,
  getContractAddress,
  getWalletSeed,
  midnightConfig,
  zkArtifactsExist,
} from './config.js';

const execFileAsync = promisify(execFile);

const MIN_NODE_MAJOR = 22;

export interface MidnightPrerequisiteCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface MidnightStatus {
  enabled: boolean;
  ready: boolean;
  zkReady: boolean;
  proofServerUrl: string;
  networkId: string;
  checks: MidnightPrerequisiteCheck[];
}

function nodeMajor(): number {
  const match = /^v(\d+)/.exec(process.version);
  return match ? Number(match[1]) : 0;
}

async function checkDocker(): Promise<MidnightPrerequisiteCheck> {
  try {
    const { stdout } = await execFileAsync('docker', ['info', '--format', '{{.ServerVersion}}'], {
      timeout: 10_000,
    });
    return {
      id: 'docker',
      label: 'Docker',
      ok: true,
      detail: `Server ${stdout.trim()}`,
    };
  } catch {
    return {
      id: 'docker',
      label: 'Docker',
      ok: false,
      detail: 'Docker not running or not installed (required for proof server)',
    };
  }
}

async function checkProofServerReachable(): Promise<MidnightPrerequisiteCheck> {
  const url = midnightConfig.proofServerUrl;
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5_000),
    });
    return {
      id: 'proofServer',
      label: 'Proof server',
      ok: res.ok || res.status < 500,
      detail: res.ok
        ? `Reachable at ${url}`
        : `Reachable at ${url} (HTTP ${res.status})`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unreachable';
    return {
      id: 'proofServer',
      label: 'Proof server',
      ok: false,
      detail: `Not reachable at ${url} — run npm run midnight:up (${msg})`,
    };
  }
}

function compactBin(): string {
  const candidates = [
    join(homedir(), '.local', 'bin', 'compact'),
    join(homedir(), '.compact', 'bin', 'compact'),
    'compact',
  ];
  for (const bin of candidates) {
    if (bin !== 'compact' && existsSync(bin)) return bin;
  }
  return 'compact';
}

async function checkCompactCompiler(): Promise<MidnightPrerequisiteCheck> {
  const bin = compactBin();
  try {
    const { stdout } = await execFileAsync(bin, ['--version'], { timeout: 10_000 });
    return {
      id: 'compact',
      label: 'Compact compiler',
      ok: true,
      detail: stdout.trim().split('\n')[0] ?? 'installed',
    };
  } catch {
    return {
      id: 'compact',
      label: 'Compact compiler',
      ok: false,
      detail: 'Not installed — https://docs.midnight.network/getting-started/installation',
    };
  }
}

/** Phase 0 prerequisite and readiness checks for Tier A Midnight. */
export async function getMidnightStatus(): Promise<MidnightStatus> {
  const nodeOk = nodeMajor() >= MIN_NODE_MAJOR;
  const checks: MidnightPrerequisiteCheck[] = [
    {
      id: 'node',
      label: 'Node.js',
      ok: nodeOk,
      detail: nodeOk
        ? `${process.version} (>= v${MIN_NODE_MAJOR})`
        : `${process.version} — upgrade to Node ${MIN_NODE_MAJOR}+`,
    },
    await checkDocker(),
    await checkProofServerReachable(),
    await checkCompactCompiler(),
    {
      id: 'zkArtifacts',
      label: 'ZK artifacts',
      ok: zkArtifactsExist(),
      detail: zkArtifactsExist()
        ? midnightConfig.zkArtifactsPath
        : `Missing compiled contract at ${midnightConfig.zkArtifactsPath} (Phase 1+)`,
    },
  ];

  if (midnightConfig.enabled) {
    checks.push(
      {
        id: 'contractAddress',
        label: 'Contract address',
        ok: Boolean(getContractAddress()),
        detail: getContractAddress() || 'Run npm run deploy:midnight -w server',
      },
      {
        id: 'walletSeed',
        label: 'Wallet seed',
        ok: Boolean(getWalletSeed()),
        detail: getWalletSeed() ? 'Configured' : 'Run npm run deploy:midnight -w server',
      }
    );
  }

  const dockerOk = checks.find((c) => c.id === 'docker')?.ok === true;
  const proofServerOk = checks.find((c) => c.id === 'proofServer')?.ok === true;
  const compactOk = checks.find((c) => c.id === 'compact')?.ok === true;
  const zkOk = checks.find((c) => c.id === 'zkArtifacts')?.ok === true;
  const contractOk = checks.find((c) => c.id === 'contractAddress')?.ok === true;
  const walletOk = checks.find((c) => c.id === 'walletSeed')?.ok === true;

  const phase0Ready = nodeOk && dockerOk && proofServerOk;

  const tierAReady =
    phase0Ready &&
    compactOk &&
    zkOk &&
    (!midnightConfig.enabled || (contractOk && walletOk));

  return {
    enabled: midnightConfig.enabled,
    ready: midnightConfig.enabled ? tierAReady : phase0Ready,
    zkReady: canUseMidnightZk(),
    proofServerUrl: midnightConfig.proofServerUrl,
    networkId: midnightConfig.networkId,
    checks,
  };
}
