#!/usr/bin/env node
import { spawn } from 'child_process';

// Default to stdio mode unless explicitly overridden
const args = ['server/index.js', '--stdio'];

// Run tsx with the correct arguments
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