import fs from 'node:fs';import path from 'node:path';import {Script} from 'node:vm';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
import postcss from '../../game/node_modules/postcss/lib/postcss.mjs';
import ts from '../../game/node_modules/typescript/lib/typescript.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),issues=[],preexisting=[];
let javascript=0,styles=0;
for(const name of fs.readdirSync(path.join(root,'js')).filter(n=>n.endsWith('.js'))){
 const file=path.join(root,'js',name),source=fs.readFileSync(file,'utf8');
 const check=spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8'});
 if(check.status===0)javascript++;else issues.push({file:name,error:check.stderr});
 if(/AeroSenseI18n|aerosense:languagechange|data-language-toggle/.test(source))issues.push({file:name,error:'retired translation hook'});
}
for(const name of fs.readdirSync(path.join(root,'css')).filter(n=>n.endsWith('.css'))){
 try{postcss.parse(fs.readFileSync(path.join(root,'css',name),'utf8'),{from:name});styles++;}catch(e){
  const old=path.join(root,'../gitlab/nthu/site/css',name),same=fs.existsSync(old)&&fs.readFileSync(old).equals(fs.readFileSync(path.join(root,'css',name)));
  (same?preexisting:issues).push({file:name,error:e.message,unchanged_from_official_source:same});
 }
}
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>['node_modules','dist','e2e','docs'].includes(e.name)?[]:e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);}
const han=[];
for(const f of [...walk(path.join(root,'game/apps')),...walk(path.join(root,'game/packages'))].filter(f=>/\.(ts|js)$/.test(f)&&!f.endsWith('.test.ts'))){
 const s=fs.readFileSync(f,'utf8'),t=ts.createSourceFile(f,s,ts.ScriptTarget.Latest,true);
 function visit(n){if(ts.isStringLiteralLike(n)&&/\p{Script=Han}/u.test(n.text))han.push({file:path.relative(root,f),line:t.getLineAndCharacterOfPosition(n.pos).line+1,text:n.text});ts.forEachChild(n,visit);}visit(t);
}
const report={javascript_syntax_passed:javascript,css_parse_passed:styles,remaining_game_Han_string_literals:han,issues,preexisting};
fs.writeFileSync(path.join(root,'audit/english-only-20261021/source-checks.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
if(issues.length||han.length)process.exitCode=1;
