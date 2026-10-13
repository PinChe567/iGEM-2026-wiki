import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sources=['tokens','claude-crops','compatibility','foundation','components','home','illustration-palette','palette-components','content-alignment','watercolor-pixel-v15','learning-color-v15','evidence-caption-v15','pixel-frames-v16','editorial-v16','hero-pixel-v17','heading-insets-v17','typography-v17','surface-harmony-v17','flat-editorial-v20','cohesive-v21','patterned-v22','review-v25'];
const css='/* Generated Signal Atlas. Edit design_system/styles/*.css; run scripts/build-design-system.mjs. */\n'+sources.map(n=>`\n/* ${n} */\n`+fs.readFileSync(path.join(site,'design_system/styles',n+'.css'),'utf8')).join('\n');
fs.writeFileSync(path.join(site,'css/design-system.css'),css);
console.log(`Signal Atlas: ${sources.length} source layers, ${Buffer.byteLength(css)} bytes, ${createHash('sha256').update(css).digest('hex').slice(0,16)}`);
