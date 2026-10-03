#!/usr/bin/env node
/**
 * Generate WebP sibling for odor-atlas without changing pixel dimensions
 * (required for CSS sprite crop: background-size 500% 400%).
 * Keeps the original PNG. Records outcome in assets/conversion-log.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pngRel = 'apps/wiki-client/games/pixel/assets/odor-atlas.png';
const webpRel = 'apps/wiki-client/games/pixel/assets/odor-atlas.webp';
const pngPath = path.join(root, pngRel);
const webpPath = path.join(root, webpRel);
const logPath = path.join(root, 'assets', 'conversion-log.json');

const log = {
  at: new Date().toISOString(),
  source: pngRel,
  outputs: [],
  notes: [],
};

if (!fs.existsSync(pngPath)) {
  console.error('optimize-images FAILED: source PNG missing', pngRel);
  process.exit(1);
}

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  log.notes.push('sharp not installed — skipped WebP encode; PNG remains canonical.');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.warn('optimize-images WARN: sharp missing; install with npm i -D sharp to emit WebP.');
  process.exit(0);
}

const meta = await sharp(pngPath).metadata();
await sharp(pngPath).webp({ quality: 82, effort: 4 }).toFile(webpPath);
const outMeta = await sharp(webpPath).metadata();

if (outMeta.width !== meta.width || outMeta.height !== meta.height) {
  console.error('optimize-images FAILED: WebP dimensions differ from PNG (sprite crop would break)');
  process.exit(1);
}

log.outputs.push({
  path: webpRel,
  width: outMeta.width,
  height: outMeta.height,
  bytes: fs.statSync(webpPath).size,
});
log.notes.push('WebP encoded at identical WxH to preserve CSS percentage sprite crops.');

// Remove duplicate public copy if present (avoid double shipping).
const publicDup = path.join(root, 'apps/wiki-client/public/assets/odor-atlas.png');
if (fs.existsSync(publicDup)) {
  fs.unlinkSync(publicDup);
  log.notes.push('Removed duplicate apps/wiki-client/public/assets/odor-atlas.png');
}

fs.mkdirSync(path.dirname(logPath), { recursive: true });
fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
console.log(
  `optimize-images OK: ${webpRel} (${outMeta.width}x${outMeta.height}, ${fs.statSync(webpPath).size} bytes)`,
);
