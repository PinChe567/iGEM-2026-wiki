import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = fs.readFileSync(fileURLToPath(new URL('../apps/wiki-client/src/i18n/messages.ts', import.meta.url)), 'utf8');
const title = source.match(/brandTitle:\s*['"]([^'"]+)['"]/)?.[1];
if (!title) throw new Error('English game brand title is missing.');
console.log('English game brand:', title);
