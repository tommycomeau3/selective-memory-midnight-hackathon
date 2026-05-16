import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const serverSrcDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(serverSrcDir, '../..');
const serverDir = resolve(serverSrcDir, '..');

const envPaths = [
  resolve(repoRoot, '.env'),
  resolve(serverDir, '.env'),
];

for (const path of envPaths) {
  if (existsSync(path)) {
    config({ path });
  }
}
