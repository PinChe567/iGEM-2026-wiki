// Scoped source transform: remove translation branches while retaining English and mechanics.
import ts from '../../game/node_modules/typescript/lib/typescript.js';
import fs from 'node:fs';
import path from 'node:path';
const site=path.resolve('aerosense-wiki'), audit=path.join(site,'audit/english-only-20261021');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','dist','audit','.git','__pycache__','docs','e2e'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(?:js|mjs|ts)$/.test(p)&&!p.endsWith('.d.ts')&&!p.includes(path.sep+'vendor'+path.sep)&&!path.basename(p).startsWith('i18n-')&&!p.endsWith('language-v19.js')&&!p.endsWith('home.bundle.js'))files.push(p);}}
walk(path.join(site,'js'));walk(path.join(site,'game'));
const receipts=[];
for(const file of files){
 let source=fs.readFileSync(file,'utf8'), original=source;
 if(!/AeroSenseI18n|zh-Hant|zh-TW|aerosense:languagechange|startsWith\(['"]zh|\blocale\b|\bzh\s*:/.test(source))continue;
 for(let round=0;round<5;round++){
  const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('.ts')?ts.ScriptKind.TS:ts.ScriptKind.JS), edits=[];
  const text=n=>n.getText(sf), val=n=>{if(ts.isStringLiteralLike(n))return n.text;return null;};
  const isAPI=n=>text(n)==='window.AeroSenseI18n';
  const flagNames=new Set();
  function collect(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.initializer&&/^(?:zh|chinese|isZh|isChinese|isZH)$/.test(n.name.text)&&(/\.lang|zh-Hant|startsWith/.test(text(n.initializer))||text(n.initializer)==='false'))flagNames.add(n.name.text);ts.forEachChild(n,collect);}collect(sf);
  const bool=n=>{
   if(ts.isParenthesizedExpression(n))return bool(n.expression);
   if(n.kind===ts.SyntaxKind.TrueKeyword)return true;if(n.kind===ts.SyntaxKind.FalseKeyword)return false;
   if(isAPI(n))return false;
   if(ts.isIdentifier(n)&&flagNames.has(n.text))return false;
   if(ts.isBinaryExpression(n)){
    const a=n.left,b=n.right,op=n.operatorToken.kind;
    if([ts.SyntaxKind.EqualsEqualsEqualsToken,ts.SyntaxKind.EqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsToken].includes(op)){
     const s=val(a)??val(b), other=val(a)!==null?b:a;
     if(s&&/^zh(?:-|$)/.test(s)&&(/(?:locale|language|\.lang\b|AeroSenseI18n)/i.test(text(other))))return [ts.SyntaxKind.ExclamationEqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsToken].includes(op);
     if(s==='en'&&(/(?:locale|language|\.lang\b)/i.test(text(other))))return [ts.SyntaxKind.EqualsEqualsEqualsToken,ts.SyntaxKind.EqualsEqualsToken].includes(op);
    }
    if(op===ts.SyntaxKind.AmpersandAmpersandToken){if(bool(a)===false||bool(b)===false)return false;if(bool(a)===true)return bool(b);}
    if(op===ts.SyntaxKind.BarBarToken){if(bool(a)===true||bool(b)===true)return true;if(bool(a)===false)return bool(b);}
   }
   if(ts.isCallExpression(n)&&/document\.documentElement\.lang\.startsWith\(['"]zh['"]\)/.test(text(n)))return false;
   return undefined;
  };
  const edit=(n,t)=>edits.push({start:n.getStart(sf),end:n.end,text:t});
  function visit(n){
   if(ts.isPropertyAssignment(n)||ts.isPropertySignature(n)){
    const key=ts.isIdentifier(n.name)?n.name.text:val(n.name);
    const parent=n.parent;
    if(key==='zh-Hant'||key==='zh-TW'||(key==='zh'&&parent.properties?.some(p=>p.name&&(val(p.name)==='en'||p.name.text==='en')))){
     let end=n.end; if(source[end]===',')end++;edit(n,'');edits[edits.length-1].end=end;return;
    }
    if(key&&key.includes('zh-Hant')&&key.includes('/')){let end=n.end;if(source[end]===',')end++;edit(n,'');edits[edits.length-1].end=end;return;}
   }
   if(ts.isUnionTypeNode(n)&&n.types.some(t=>ts.isLiteralTypeNode(t)&&val(t.literal)==='en')&&n.types.some(t=>ts.isLiteralTypeNode(t)&&/^zh(?:-|$)/.test(val(t.literal)||''))){
    if(ts.isTypeAliasDeclaration(n.parent)&&n.parent.name.text==='EducationLocale')return;
    edit(n,n.types.filter(t=>!(ts.isLiteralTypeNode(t)&&/^zh(?:-|$)/.test(val(t.literal)||''))).map(text).join(' | '));return;
   }
   if(ts.isExpressionStatement(n)&&ts.isCallExpression(n.expression)){
    const c=n.expression;
    if(c.arguments[0]&&val(c.arguments[0])==='aerosense:languagechange'){edit(n,'');return;}
   }
   if(ts.isConditionalExpression(n)){const v=bool(n.condition);if(v!==undefined){edit(n,text(v?n.whenTrue:n.whenFalse));return;}}
   if(ts.isIfStatement(n)){const v=bool(n.expression);if(v!==undefined){edit(n,v?text(n.thenStatement):n.elseStatement?text(n.elseStatement):'');return;}}
   if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&isAPI(n.expression.expression)){
    const method=n.expression.name.text,args=n.arguments.map(text);
    const replacement={sourceText:`${args[0]}.textContent`,sourceAttribute:`${args[0]}.getAttribute(${args[1]})`,cloneSource:`${args[0]}.cloneNode(true)`,t:args[0],lookup:args[0],refresh:'void 0',registerGlossaryFragment:'void 0',setDisplayText:`(${args[0]}.textContent = ${args[1]})`}[method];
    if(replacement){edit(n,replacement);return;}
   }
   if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&flagNames.has(n.name.text)&&n.initializer){edit(n.initializer,'false');return;}
   ts.forEachChild(n,visit);
  }
  visit(sf);if(!edits.length)break;
  for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);
 }
 if(source!==original){fs.writeFileSync(file,source);receipts.push({path:path.relative(site,file).replaceAll('\\','/'),oldBytes:Buffer.byteLength(original),newBytes:Buffer.byteLength(source)});}
}
fs.writeFileSync(path.join(audit,'code-transform.json'),JSON.stringify(receipts,null,2)+'\n');console.log(JSON.stringify({changed:receipts.length,files:receipts.map(x=>x.path)},null,2));
