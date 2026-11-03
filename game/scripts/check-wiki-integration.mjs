import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wikiRoot = path.dirname(gameRoot);
const dist = path.join(gameRoot, 'apps/wiki-client/dist');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const files = walk(dist);
let checkedAssets = 0;
function checkReference(fromFile, href) {
  if (/^(?:#|data:|https?:|mailto:|tel:|blob:)/.test(href)) return;
  const pathname = decodeURIComponent(href.split(/[?#]/)[0]);
  if (!pathname || pathname.startsWith('#')) return;
  assert(!pathname.startsWith('/'), `Root-relative path would break under the wiki prefix: ${href}`);
  const target = path.resolve(path.dirname(fromFile), pathname);
  assert(fs.existsSync(target), `Missing ${href} from ${path.relative(dist, fromFile)}`);
  checkedAssets++;
}
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.html')) {
    assert(source.includes('<html lang="en">'), `Initial HTML language is not English: ${file}`);
    for (const match of source.matchAll(/\b(?:src|href)="([^"]+)"/g)) checkReference(file, match[1]);
  } else if (file.endsWith('.js')) {
    for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'](\.[^"']+)["']/g)) checkReference(file, match[1]);
    for (const match of source.matchAll(/new URL\(["'](\.[^"']+)["'],import\.meta\.url\)/g)) checkReference(file, match[1]);
  } else if (file.endsWith('.css')) {
    for (const match of source.matchAll(/url\(["']?([^"')]+)["']?\)/g)) checkReference(file, match[1]);
  }
}

for (const file of files.filter(file => file.endsWith('.js'))) {
  const source = fs.readFileSync(file, 'utf8');
  assert(!source.includes('data-shell-lang'), 'Language switch must not return in the game shell');
  assert(!source.includes('aerosense-language'), 'Wiki language preference must not affect game rendering');
}

let wikiLinks = 0;
for (const name of ['index.html', 'education.html']) {
  const file = path.join(wikiRoot, name);
  const source = fs.readFileSync(file, 'utf8');
  assert(!source.includes('https://pinche567.github.io/iGEM-game/'), `Old external game link remains in ${name}`);
  for (const match of source.matchAll(/href="(game\/apps\/wiki-client\/dist\/[^"\s]+)"/g)) {
    checkReference(file, match[1]);
    wikiLinks++;
  }
}
assert(wikiLinks >= 1);
console.log(`PASS: ${checkedAssets} static references, ${wikiLinks} local wiki links, English-only shell.`);
