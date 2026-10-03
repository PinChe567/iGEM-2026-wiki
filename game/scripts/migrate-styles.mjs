import fs from 'node:fs';

const src = fs.readFileSync('styles.css', 'utf8');
let css = src.replace(/@import url\('https:\/\/fonts\.googleapis\.com[^']+'\);\s*/, '');
css = css.replace(/font-family: "Noto Sans TC", system-ui, sans-serif;/g, 'font-family: var(--font-sans);');
css = css.replace(/"DM Mono", monospace/g, 'var(--font-mono)');
css = css.replace(/"DM Mono"/g, 'var(--font-mono)');
css = css.replace(/url\("assets\/odor-atlas\.png"\)/, 'url("../assets/odor-atlas.png")');
fs.writeFileSync(
  'apps/wiki-client/games/pixel/src/styles.css',
  '/* Migrated from root styles.css — Google Fonts removed; tokens from @suite/ui */\n' + css,
);
console.log('ok', css.length);
