#!/usr/bin/env node
/**
 * After production build: print bundle size summary + largest assets.
 * Does not invent Lighthouse or device metrics.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wikiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(wikiRoot, 'dist');

if (!fs.existsSync(distDir)) {
  console.error('report:bundle-size FAILED: dist missing');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(distDir).map((file) => {
  const st = fs.statSync(file);
  return { file, bytes: st.size };
});
files.sort((a, b) => b.bytes - a.bytes);

const total = files.reduce((s, f) => s + f.bytes, 0);
const top = files.slice(0, 15);

console.log(`bundle-size: total ${total} bytes (${(total / 1024 / 1024).toFixed(2)} MiB) across ${files.length} files`);
console.log('largest assets:');
for (const f of top) {
  console.log(
    `  ${(f.bytes / 1024).toFixed(1).padStart(8)} KiB  ${path.relative(distDir, f.file)}`,
  );
}

const outPath = path.join(wikiRoot, 'dist', 'bundle-size-report.json');
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      totalBytes: total,
      fileCount: files.length,
      largest: top.map((f) => ({
        path: path.relative(distDir, f.file).replace(/\\/g, '/'),
        bytes: f.bytes,
      })),
    },
    null,
    2,
  ),
);
console.log(`wrote ${path.relative(wikiRoot, outPath)}`);
