#!/usr/bin/env node
/**
 * Fails if any git-tracked file contains something that looks like an
 * OpenRouter key, or if a real .env file is tracked. Prints file names only.
 */
const { execSync } = require('child_process');
const fs = require('fs');

const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const problems = [];

for (const file of tracked) {
  if (/(^|\/)\.env(\.|$)/.test(file) && file !== '.env.example') problems.push(`${file}: env file is tracked`);
  if (/\.(png|jpe?g|webp|gif|ttf|otf)$/i.test(file) || !fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (/sk-or-v1-[A-Za-z0-9]{20,}/.test(text)) problems.push(`${file}: contains an OpenRouter key`);
}

if (problems.length) {
  console.error('[secrets] FAILED:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`[secrets] OK — ${tracked.length} tracked files, no keys or env files.`);
