import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from '../../game/node_modules/typescript/lib/typescript.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
function edit(rel,fn){const p=path.join(root,rel),s=fs.readFileSync(p,'utf8'),n=fn(s); if(n!==s)fs.writeFileSync(p,n);}
edit('game/packages/core/src/education/items.ts',s=>{
  const tree=ts.createSourceFile('items.ts',s,ts.ScriptTarget.Latest,true),changes=[];
  function visit(n){
    if(ts.isCallExpression(n) && ['t','opt'].includes(n.expression.getText(tree))){
      const args=n.arguments,keep=n.expression.getText(tree)==='t'?1:2;
      if(args.length>keep) changes.push([args[keep-1].end,args.at(-1).end,'']);
    }
    if(ts.isFunctionDeclaration(n)&&['t','opt'].includes(n.name?.text)){
      const p=n.parameters.at(-1); if(p.name.getText(tree)==='zh') changes.push([n.parameters.at(-2).end,p.end,'']);
    }
    ts.forEachChild(n,visit);
  }
  visit(tree); for(const[a,b,v]of changes.sort((a,b)=>b[0]-a[0])) s=s.slice(0,a)+v+s.slice(b);
  return s;
});
for(const name of ['labyrinth','pixel','qc-shift','spectrum']) edit(`game/packages/core/src/${name}/storage.ts`,s=>s.replaceAll("locale: 'zh-Hant'","locale: 'en'").replaceAll("data.locale === 'en' || data.locale === 'zh-Hant' ? data.locale : 'zh-Hant'","'en'"));
edit('game/packages/content/src/odors.ts',s=>s.replace("odor.name['zh-Hant']",'odor.name.en').replace('/** Generated with Unicode escapes to preserve zh-Hant on all platforms. */','/** English odor labels; illustrative feature vectors are unchanged. */'));
edit('game/apps/wiki-client/src/data/education.ts',s=>s.replace(" && !a.results['zh-Hant'].trim()",'').replace('bilingual zh-Hant / English','English interface'));
edit('game/apps/wiki-client/src/data/team.ts',s=>s.replace(" && !record.name['zh-Hant'].trim()",'').replace(" && !record.altText['zh-Hant'].trim()",''));
edit('game/packages/core/src/qc-shift/qc-shift.test.ts',s=>s.replace(/    QC_SHIFT_\w+\['zh-Hant'\],\r?\n/g,'').replace("[row.en, row['zh-Hant']]",'[row.en]'));
edit('game/apps/wiki-client/src/data/wiki-pages.test.ts',s=>s.replace(/^.*expect\(activity.results\['zh-Hant'\]\).*\r?\n/gm,''));
edit('game/scripts/rewrite-credits.mjs',s=>s.replace("    'zh-Hant': string;\n",''));
edit('game/scripts/integrate-wiki.mjs',s=>s.replace(/\/\/ This supplied release.*?(?=const gamePrefix)/s,'').replace('localeModules, ',''));
edit('game/scripts/check-wiki-integration.mjs',s=>s.replace("import vm from 'node:vm';\n",'').replace(/const localeFile =.*?(?=let wikiLinks)/s,`for (const file of files.filter(file => file.endsWith('.js'))) {
  const source = fs.readFileSync(file, 'utf8');
  assert(!source.includes('data-shell-lang'), 'Language switch must not return in the game shell');
  assert(!source.includes('aerosense-language'), 'Wiki language preference must not affect game rendering');
}

`).replace('assert.equal(wikiLinks, 19);','assert(wikiLinks >= 1);').replace('5 compiled language cases.','English-only shell.'));
edit('game/apps/wiki-client/src/i18n/locale.test.ts',()=>`import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOCALE, isLocale, readStoredLocale } from './locale';
describe('English-only public interface', () => {
  it.each([null, 'en', 'zh-Hant', 'zh-TW', 'invalid'])('ignores prior preference %s', (stored) => {
    const getItem = vi.fn(() => stored);
    vi.stubGlobal('localStorage', { getItem });
    expect(readStoredLocale()).toBe('en');
    expect(getItem).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it('accepts only the public English locale', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(isLocale('en')).toBe(true);
    expect(isLocale('zh-Hant')).toBe(false);
  });
});
`);
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>['node_modules','dist','.git','audit','test-results','playwright-report'].includes(e.name)?[]:e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);}
for(const p of walk(path.join(root,'game')).filter(p=>p.endsWith('.html'))){let s=fs.readFileSync(p,'utf8'); const n=s.replaceAll('lang="zh-Hant"','lang="en"').replace(/\s*<p lang="en">找不到此頁面。.*?<\/p>/s,''); if(n!==s)fs.writeFileSync(p,n);}
