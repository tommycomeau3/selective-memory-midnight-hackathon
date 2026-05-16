#!/usr/bin/env node
/**
 * Wrapper for docker compose — finds Docker on macOS and prints install help if missing.
 */
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';

const action = process.argv[2] ?? 'up';
const composeFile = join(process.cwd(), 'docker-compose.midnight.yml');

const DOCKER_CANDIDATES = [
  'docker',
  '/usr/local/bin/docker',
  '/opt/homebrew/bin/docker',
  join(homedir(), '.docker/bin/docker'),
  '/Applications/Docker.app/Contents/Resources/bin/docker',
];

function findDocker() {
  for (const bin of DOCKER_CANDIDATES) {
    if (bin === 'docker') {
      const r = spawnSync('which', ['docker'], { encoding: 'utf8' });
      if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
      continue;
    }
    if (existsSync(bin)) return bin;
  }
  return null;
}

const docker = findDocker();
if (!docker) {
  console.error(`
Docker was not found. The Midnight proof server runs in Docker.

On Mac (Apple Silicon or Intel):
  1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
  2. Open Docker Desktop and wait until it says "Docker is running"
  3. Quit and reopen Terminal (or run: source ~/.zshrc)
  4. Verify: docker --version
  5. Retry: npm run midnight:up

Docs: https://docs.midnight.network/guides/run-proof-server
`);
  process.exit(1);
}

const args =
  action === 'down'
    ? ['compose', '-f', composeFile, 'down']
    : action === 'logs'
      ? ['compose', '-f', composeFile, 'logs', '-f', 'proof-server']
      : ['compose', '-f', composeFile, 'up', '-d'];

const result = spawnSync(docker, args, { stdio: 'inherit', cwd: process.cwd() });
process.exit(result.status ?? 1);
