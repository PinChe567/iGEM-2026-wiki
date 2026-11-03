from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
def edit(rel,fn):
    p=ROOT/rel;s=p.read_text(encoding='utf-8');n=fn(s)
    if n!=s:p.write_text(n,encoding='utf-8',newline='\n')
edit('css/home-cut-paper-v22.css',lambda s:re.sub(r'[^{}]*\.(?:language-toggle|home-menu__language)[^{}]*\{[^{}]*\}', '',s))
edit('hardware.html',lambda s:re.sub(r',"https://static.igem.wiki/[^"]*spectral-alignment-zh-hant.svg":\{[^}]*\}','',s))
edit('scripts/PUBLICATION.txt',lambda s:s[:s.index('Remaining release verification')]+'''English-only source workflow
----------------------------
The public interface and educational game use English only. Locale catalogs,
language controls and the translation build are retired. Game unit/type checks,
source preflight and a local publication check should precede any user-authorized
synchronization. Original research metadata and source-language documents remain
unaltered. A local build is not deployment verification.
''')
edit('scripts/qa-shared-v25.cjs',lambda s:s.replace("await page.waitForFunction(()=>window.AeroSenseI18n&&!document.querySelector('[data-language-toggle]')?.disabled);", "await page.waitForFunction(()=>document.documentElement.lang==='en'&&!document.querySelector('[data-language-toggle]'));").replace("rootPages.includes(route)?['en','zh-Hant']:['en']","['en']").replace("await page.evaluate(lang=>window.AeroSenseI18n.setLanguage(lang),lang);",'').replace(",zh:r['zh-Hant']",''))
edit('scripts/qa-references-v25.cjs',lambda s:s.replace("['en','zh-Hant']","['en']").replace("await p.waitForFunction(()=>window.AeroSenseI18n&&!document.querySelector('[data-language-toggle]').disabled);await p.evaluate(x=>window.AeroSenseI18n.setLanguage(x),lang);", "await p.waitForFunction(()=>document.documentElement.lang==='en'&&!document.querySelector('[data-language-toggle']));").replace("&&(lang==='en'||row.title==='引用段落')",''))
edit('scripts/qa-references-v25.cjs',lambda s:s.replace("querySelector('[data-language-toggle']", "querySelector('[data-language-toggle]')"))
edit('game/scripts/rewrite-odors.mjs',lambda s:re.sub(r'const disclaimerZh =\n.*?;\n','',s,flags=re.S))
