#!/usr/bin/env node
import { spawn } from 'child_process';

// Check if --stdio flag is present
const hasStdioFlag = process.argv.includes('--stdio');

// Run tsx with the correct arguments
const args = ['server/index.js'];
if (hasStdioFlag) {
  args.push('--stdio');
}

const tsx = spawn('node', ['--import', 'tsx/esm', ...args], {
  stdio: 'inherit',
  env: process.env
});

tsx.on('exit', (code) => {
  process.exit(code ?? 0);
});

tsx.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});