/* Reuse the existing reachable-source audit without writing global reports. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.resolve(__dirname, '../..');
const source = path.join(site, 'scripts/qa-compliance.cjs');
let code = fs.readFileSync(source, 'utf8');
const old = "const out = path.join(site, 'audit', 'compliance-review.json');";
if (!code.includes(old)) throw new Error('Unexpected audit version');
code = code.replace(old, "const out = path.join(site, 'audit', 'notion-model-20261021', 'existing-runtime-audit.json');");
vm.runInNewContext(code, {require, __dirname:path.dirname(source), console, process, URL}, {filename:source});
