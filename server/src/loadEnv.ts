import { existsSync } from 'fs';
import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

/** Repo root: server/src -> server -> midnight-hackathon */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const envCandidates = [
  resolve(repoRoot, '.env'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '.env'),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    config({ path: envPath, override: true });
    break;
  }
}
