#!/usr/bin/env node
/**
 * Fails if wiki-client dist contains runtime external asset loads
 * (script/src/import/font/css url/img). Plain https in prose and
 * ordinary <a href> citation links are allowed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wikiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(wikiRoot, 'dist');

if (!fs.existsSync(distDir)) {
  console.error('check:external-assets FAILED: apps/wiki-client/dist missing. Run npm run build:wiki first.');
  process.exit(1);
}

const BLOCKED_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
];

const RUNTIME_RES = [
  /\bsrc\s*=\s*["']https?:\/\//i,
  /\bhref\s*=\s*["']https?:\/\/[^"']+\.(?:css|js|mjs|woff2?|ttf|otf|eot|png|jpe?g|gif|webp|svg|ico)(?:\?[^"']*)?["']/i,
  /@import\s+(?:url\s*\()?\s*["']https?:\/\//i,
  /url\(\s*["']?https?:\/\//i,
  /\bfrom\s+["']https?:\/\//i,
  /import\s*\(\s*["']https?:\/\//i,
  /<link[^>]+href\s*=\s*["']https?:\/\//i,
  /<script[^>]+src\s*=\s*["']https?:\/\//i,
  /<img[^>]+src\s*=\s*["']https?:\/\//i,
];

const TEXT_EXTS = new Set(['.html', '.css', '.js', '.mjs']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function isCitationAnchorLine(line) {
  return (
    /<a\b[^>]*\bhref\s*=\s*["']https?:\/\//i.test(line) &&
    !/<(script|link|img)\b/i.test(line) &&
    !/@import/i.test(line) &&
    !/url\(/i.test(line)
  );
}

const files = walk(distDir).filter((file) => TEXT_EXTS.has(path.extname(file).toLowerCase()));
const findings = [];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (isCitationAnchorLine(line)) return;

    for (const re of RUNTIME_RES) {
      if (re.test(line)) {
        findings.push({ file, line: index + 1, sample: line.trim().slice(0, 220) });
        return;
      }
    }

    for (const host of BLOCKED_HOSTS) {
      if (line.includes(host)) {
        findings.push({ file, line: index + 1, sample: line.trim().slice(0, 220) });
        return;
      }
    }
  });
}

if (findings.length) {
  console.error(`check:external-assets FAILED (${findings.length})`);
  for (const f of findings) {
    console.error(`- ${path.relative(wikiRoot, f.file)}:${f.line}  ${f.sample}`);
  }
  process.exit(1);
}

console.log(`check:external-assets OK (${files.length} files in apps/wiki-client/dist)`);
