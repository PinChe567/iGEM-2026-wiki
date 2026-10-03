#!/usr/bin/env node
/**
 * Check assets-manifest.json verification statuses.
 * - development / default: warn on TODO-VERIFY
 * - production release (RELEASE_MODE=1|true|production or --release): fail on TODO-VERIFY
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'assets-manifest.json');
const release =
  process.argv.includes('--release') ||
  ['1', 'true', 'production'].includes(String(process.env.RELEASE_MODE ?? '').toLowerCase());

if (!fs.existsSync(manifestPath)) {
  console.error('check:assets-manifest FAILED: assets-manifest.json missing');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
const todos = [];

for (const asset of assets) {
  const fields = [
    asset.verificationStatus,
    asset.author,
    asset.source,
    asset.license,
    asset.creditStatus,
  ];
  if (fields.some((v) => v === 'TODO-VERIFY')) {
    todos.push(asset.id ?? asset.filename ?? '(unknown)');
  }
  for (const p of [asset.path, ...(asset.optimizedPaths ?? [])]) {
    if (!p) continue;
    const abs = path.join(root, p);
    if (!fs.existsSync(abs)) {
      console.warn(`check:assets-manifest WARN: file missing ${p}`);
    }
  }
}

if (todos.length === 0) {
  console.log(`check:assets-manifest OK (${assets.length} assets, no TODO-VERIFY)`);
  process.exit(0);
}

const msg = `TODO-VERIFY assets: ${todos.join(', ')}`;
if (release) {
  console.error(`check:assets-manifest FAILED (release mode): ${msg}`);
  process.exit(1);
}

console.warn(`check:assets-manifest WARN (dev): ${msg}`);
process.exit(0);
