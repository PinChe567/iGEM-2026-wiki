import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import ts from '../../game/node_modules/typescript/lib/typescript.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
function edit(rel,fn){const p=path.join(root,rel),s=fs.readFileSync(p,'utf8'),n=fn(s);if(s!==n)fs.writeFileSync(p,n);}
edit('game/apps/wiki-client/src/data/education.ts',s=>{
 const tree=ts.createSourceFile('education.ts',s,ts.ScriptTarget.Latest,true),edits=[];
 function visit(n){
  if(ts.isCallExpression(n)&&['L','download'].includes(n.expression.getText(tree))&&n.arguments.length>=2) edits.push([n.arguments[0].getStart(tree),n.arguments[1].getStart(tree),'']);
  if((ts.isFunctionDeclaration(n)&&n.name?.text==='download')||ts.isArrowFunction(n)&&n.parent.name?.text==='L') edits.push([n.parameters[0].getStart(tree),n.parameters[1].getStart(tree),'']);
  ts.forEachChild(n,visit);
 }visit(tree);for(const[a,b,v]of edits.sort((a,b)=>b[0]-a[0]))s=s.slice(0,a)+v+s.slice(b);return s;
});
edit('game/apps/wiki-client/games/labyrinth/src/game.ts',s=>s.replace('function tileLabel(tile:','function tileLabel(tile:').replace('locale: Locale): string {','_locale: Locale): string {'));
edit('game/apps/wiki-client/games/labyrinth/src/render.ts',s=>s.replace(/^\s*const zh = false;\r?\n/gm,''));
edit('game/apps/wiki-client/games/labyrinth/src/scentbound.ts',s=>s.replace('{ en: string; zh: string }','{ en: string }'));
edit('game/apps/wiki-client/games/spectrum/src/chart.ts',s=>s.replace('  locale: Locale,','  _locale: Locale,'));
edit('game/apps/wiki-client/src/pages/shared.ts',s=>s.replace('  locale: Locale,','  _locale: Locale,'));
edit('game/apps/wiki-client/src/education/study-ui.ts',s=>s.replace('item: EducationItem, locale: EducationLocale','item: EducationItem, _locale: EducationLocale').replace('opt.label[locale]','opt.label.en').replace('item.prompt[locale]','item.prompt.en'));
for(const f of fs.readdirSync(path.join(root,'game/apps/wiki-client/e2e')).filter(x=>x.endsWith('.ts'))){edit('game/apps/wiki-client/e2e/'+f,s=>s.replace(/^.*await page.locator\('\.lang-switch \[data-locale="(?:en|zh-Hant)"\]'\).click\(\);\r?\n/gm,'    await expect(page.locator(\'[data-locale]\')).toHaveCount(0);\n').replaceAll("toHaveAttribute('lang', 'zh-Hant')","toHaveAttribute('lang', 'en')").replace('switch language,','fixed English,').replace('fail, locale,','fail, English interface,'));}
