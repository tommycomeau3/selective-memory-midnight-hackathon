#!/usr/bin/env node
/**
 * Compile contracts/memory-access.compact → contracts/managed/memory-access
 */
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contractFile = join(root, 'contracts', 'memory-access.compact');
const outDir = join(root, 'contracts', 'managed', 'memory-access');

function findCompact() {
  const candidates = [
    join(homedir(), '.local', 'bin', 'compact'),
    join(homedir(), '.compact', 'bin', 'compact'),
    'compact',
  ];
  for (const bin of candidates) {
    if (bin !== 'compact' && existsSync(bin)) return bin;
  }
  const which = spawnSync('which', ['compact'], { encoding: 'utf8' });
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
  return null;
}

const compact = findCompact();
if (!compact) {
  console.error(`
Compact compiler not found.

  curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
  source ~/.local/bin/env
  compact update

Then: npm run compile:contract
`);
  process.exit(1);
}

if (!existsSync(contractFile)) {
  console.error(`Missing ${contractFile}`);
  process.exit(1);
}

const versionFile = join(root, '.compact-version');
if (existsSync(versionFile)) {
  const want = readFileSync(versionFile, 'utf8').trim();
  const ver = spawnSync(compact, ['compile', '--version'], { encoding: 'utf8' });
  if (ver.status === 0 && ver.stdout.trim() && ver.stdout.trim() !== want) {
    console.warn(`Warning: .compact-version wants ${want}, compiler is ${ver.stdout.trim()}`);
  }
}

console.log(`Compiling ${contractFile}`);
console.log(`  → ${outDir}\n`);

const result = spawnSync(compact, ['compile', contractFile, outDir], {
  stdio: 'inherit',
  cwd: join(root, 'contracts'),
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const proverKey = join(outDir, 'keys', 'grantAgentAccess.prover');
if (!existsSync(proverKey)) {
  console.error('Compile finished but prover key missing');
  process.exit(1);
}

console.log('\nContract compiled successfully.');
