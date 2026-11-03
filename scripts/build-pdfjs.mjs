// Reproduce the reviewed PDF.js browser modules from the exact npm lockfile.
// These reviewed third-party bundles are generated output, never Git inputs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = path.join(site, 'tooling/pdfjs/node_modules/pdfjs-dist');
const destination = path.join(site, 'js/vendor/pdfjs-6.4.299');
const version = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')).version;
if (version !== '6.4.299') throw new Error('The PDF reader requires the reviewed PDF.js 6.4.299 distribution.');
const expected = {
  'pdf.mjs': '3ab3d2fee1200547309d5f5e4116066a1ccb6277451b9533aebe618530eb62ca',
  'pdf.worker.mjs': '07ceb740d746e5d9012fcf9f27d5c7dea09f7d2f5e74f5c8109e5787551a2333',
};
const outputs = Object.entries(expected).map(([name, sha256]) => {
  let data = fs.readFileSync(path.join(packageRoot, 'build', name));
  if (name === 'pdf.mjs') {
    // npm and the reviewed release build differ only in this internal event ID.
    // Guard the exact input and replacement; retain the reviewed output bytes.
    const npmSha = 'dd13af821c9c3e1778653340d6539a1ba07bc56cba40073a4c727864cf0c232a';
    if (createHash('sha256').update(data).digest('hex') !== npmSha) throw new Error('Unreviewed npm PDF.js module.');
    const before = 'const INTERNAL_EVT = "2837668c-d334-48d1-ba74-aa7deba483da";';
    const after = 'const INTERNAL_EVT = "fed9040f-f139-41a7-bcf0-3bcfcca89c08";';
    const text = data.toString('utf8');
    if (text.split(before).length !== 2) throw new Error('The reviewed PDF.js event ID must occur once.');
    data = Buffer.from(text.replace(before, after));
  }
  if (createHash('sha256').update(data).digest('hex') !== sha256) throw new Error('Unreviewed PDF.js bytes: ' + name);
  return {name, data, sha256};
});
const license = fs.readFileSync(path.join(packageRoot, 'LICENSE'));
const retainedLicense = fs.readFileSync(path.join(destination, 'LICENSE'));
if (!license.equals(retainedLicense)) throw new Error('Retained PDF.js Apache license differs from the pinned distribution.');
fs.mkdirSync(destination, {recursive: true});
for (const {name, data} of outputs) fs.writeFileSync(path.join(destination, name), data);
console.log(JSON.stringify({pdfjs: version, generated: outputs.map(({name, data, sha256}) => ({path: 'js/vendor/pdfjs-6.4.299/' + name, bytes: data.length, sha256})), license: 'Apache-2.0; retained unchanged'}));
