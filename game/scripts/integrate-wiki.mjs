import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wikiRoot = path.dirname(gameRoot);
const distRoot = path.join(gameRoot, 'apps/wiki-client/dist');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});

const gamePrefix = 'game/apps/wiki-client/dist/';
let linkCount = 0;
for (const name of ['index.html', 'education.html']) {
  const file = path.join(wikiRoot, name);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/href="https:\/\/pinche567\.github\.io\/iGEM-game\/([^"\s]*)"/g, (_, route) => {
    const [pathname, suffix = ''] = route.split(/(?=[?#])/s);
    const entry = pathname === '' || pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    if (!fs.existsSync(path.join(distRoot, entry))) throw new Error(`Missing local game route: ${entry}`);
    linkCount++;
    return `href="${gamePrefix}${entry}${suffix}"`;
  });
  if (name === 'education.html') {
    html = html.replace('pinche567.github.io/iGEM-game <span', 'Odor Pixel Suite <span')
      .replace('current public deployment <a href="game/', 'included in this wiki <a href="game/')
      .replace('(opens in a new tab; current development deployment)', '(opens in a new tab)');
  }
  fs.writeFileSync(file, html);
}
console.log(JSON.stringify({ localGameLinks: linkCount, entry: `${gamePrefix}index.html` }));
