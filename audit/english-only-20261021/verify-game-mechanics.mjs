import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import ts from '../../game/node_modules/typescript/lib/typescript.js';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),baseline=path.join(site,'../gitlab/nthu/site');
const rows=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){if(!['node_modules','dist'].includes(e.name))walk(p);}else if(p.endsWith('.ts')&&!p.endsWith('.test.ts')){
 const rel=path.relative(site,p),old=path.join(baseline,rel);if(!fs.existsSync(old))continue;
 function numbers(f){const s=fs.readFileSync(f,'utf8'),sf=ts.createSourceFile(f,s,ts.ScriptTarget.Latest,true),values=[];function visit(n){if(ts.isNumericLiteral(n))values.push(n.text);ts.forEachChild(n,visit);}visit(sf);return values;}
 const before=numbers(old),after=numbers(p);rows.push({path:rel.replaceAll('\\','/'),numeric_literals:after.length,unchanged:JSON.stringify(before)===JSON.stringify(after)});
}}}
walk(path.join(site,'game/packages/core/src'));walk(path.join(site,'game/packages/content/src'));
const report={scope:'Non-test game core and content sources; compare numeric literals in original order, excluding translated text strings.',files:rows.length,pass:rows.every(r=>r.unchanged),rows};
fs.writeFileSync(path.join(site,'audit/english-only-20261021/game-mechanics-preservation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({files:report.files,pass:report.pass,failures:rows.filter(r=>!r.unchanged)}));if(!report.pass)process.exitCode=1;
