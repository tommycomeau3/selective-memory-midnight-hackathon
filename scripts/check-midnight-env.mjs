#!/usr/bin/env node
/**
 * Midnight Tier A — verify environment (Phase 0) and contract artifacts (Phase 1).
 * Usage: npm run check:midnight
 */
import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROOF_SERVER_URL = (process.env.MIDNIGHT_PROOF_SERVER_URL ?? 'http://127.0.0.1:6300').replace(
  /\/$/,
  ''
);
const ZK_ARTIFACTS = join(
  root,
  process.env.MIDNIGHT_ZK_ARTIFACTS_PATH ?? 'contracts/managed/memory-access'
);
const MIN_NODE = 22;

function resolveCompactBin() {
  const candidates = [
    join(homedir(), '.local', 'bin', 'compact'),
    join(homedir(), '.compact', 'bin', 'compact'),
    'compact',
  ];
  for (const bin of candidates) {
    if (bin === 'compact') return bin;
    if (existsSync(bin)) return bin;
  }
  return 'compact';
}

async function checkNode() {
  const major = Number(/^v(\d+)/.exec(process.version)?.[1] ?? 0);
  const ok = major >= MIN_NODE;
  return { ok, detail: `${process.version}${ok ? '' : ` (need >= v${MIN_NODE})`}` };
}

async function checkDocker() {
  try {
    const { stdout } = await execFileAsync('docker', ['info', '--format', '{{.ServerVersion}}']);
    return { ok: true, detail: stdout.trim() };
  } catch {
    return { ok: false, detail: 'not available' };
  }
}

async function checkProofServer() {
  try {
    const res = await fetch(PROOF_SERVER_URL, { signal: AbortSignal.timeout(5000) });
    return { ok: res.ok || res.status < 500, detail: `HTTP ${res.status} at ${PROOF_SERVER_URL}` };
  } catch (e) {
    return {
      ok: false,
      detail: `${PROOF_SERVER_URL} — ${e instanceof Error ? e.message : 'down'}`,
    };
  }
}

async function checkCompact() {
  const bin = resolveCompactBin();
  try {
    const { stdout } = await execFileAsync(bin, ['--version']);
    const compileVer = await execFileAsync(bin, ['compile', '--version']);
    return {
      ok: true,
      detail: `${stdout.trim().split('\n')[0]} (compiler ${compileVer.stdout.trim()})`,
    };
  } catch {
    return {
      ok: false,
      detail: 'not installed — see README Midnight Phase 1',
    };
  }
}

function checkZkArtifacts() {
  const keys = join(ZK_ARTIFACTS, 'keys', 'grantAgentAccess.prover');
  const zkir = join(ZK_ARTIFACTS, 'zkir', 'grantAgentAccess.zkir');
  const ok = existsSync(keys) && existsSync(zkir);
  return {
    ok,
    detail: ok ? ZK_ARTIFACTS : `missing — run npm run compile:contract`,
  };
}

const rows = [
  ['Node.js', checkNode],
  ['Docker', checkDocker],
  ['Proof server', checkProofServer],
  ['Compact compiler', checkCompact],
  ['ZK artifacts (Phase 1)', async () => checkZkArtifacts()],
];

console.log('Midnight Tier A — environment check\n');

let phase0Ok = true;
let phase1Ok = true;

for (const [label, fn] of rows) {
  const { ok, detail } = await fn();
  const mark = ok ? '✓' : '✗';
  console.log(`  ${mark} ${label}: ${detail}`);
  if (!ok && (label === 'Node.js' || label === 'Docker' || label === 'Proof server')) {
    phase0Ok = false;
  }
  if (!ok && label.startsWith('ZK artifacts')) {
    phase1Ok = false;
  }
}

console.log('');
if (phase0Ok && phase1Ok) {
  console.log('Phase 0 + Phase 1 ready. Next: deploy contract and wire proof.ts (Phase 2).');
  process.exit(0);
}
if (phase0Ok) {
  console.log('Phase 0 OK. Phase 1: npm run compile:contract');
  process.exit(0);
}
console.log('Phase 0 incomplete. Install Docker, then: npm run midnight:up');
process.exit(1);
