import fs from 'node:fs';
const t = fs.readFileSync('apps/wiki-client/src/i18n/messages.ts', 'utf8');
const m = t.match(/brandTitle: "([^"]+)"/);
console.log('brand', m && m[1]);
console.log('codes', m ? [...m[1]].map((c) => c.codePointAt(0).toString(16)) : null);
console.log('expected 嗅', (0x55c5).toString(16), String.fromCharCode(0x55c5));
console.log('used 0x55c7', String.fromCharCode(0x55c7));
