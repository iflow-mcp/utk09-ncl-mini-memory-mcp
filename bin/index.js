#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');

// Run tsx with the server file and --stdio flag
const npx = spawn('npx', ['-y', 'tsx', join(packageRoot, 'server/index.ts'), '--stdio'], {
  stdio: 'inherit',
  env: process.env,
  cwd: packageRoot
});

npx.on('exit', (code) => {
  process.exit(code ?? 0);
});

npx.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
