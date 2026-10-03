#!/usr/bin/env node
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wikiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(wikiRoot, '../..');
const src = path.join(repoRoot, 'docs', 'education-games');
const protocol = path.join(repoRoot, 'docs', 'education-study-protocol.md');
const dest = path.join(wikiRoot, 'dist', 'education-games');

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const inPath = path.join(from, name);
    const outPath = path.join(to, name);
    const st = statSync(inPath);
    if (st.isDirectory()) copyTree(inPath, outPath);
    else writeFileSync(outPath, readFileSync(inPath));
  }
}

if (!existsSync(src)) {
  console.warn('copy-education-docs: source missing', src);
  process.exit(0);
}

copyTree(src, dest);
if (existsSync(protocol)) {
  writeFileSync(path.join(dest, 'education-study-protocol.md'), readFileSync(protocol));
}
console.log('copy-education-docs OK:', dest);
