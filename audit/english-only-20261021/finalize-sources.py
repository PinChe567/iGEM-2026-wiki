from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[2]
def edit(rel,fn):
    p=ROOT/rel;s=p.read_text(encoding='utf-8');n=fn(s)
    if n!=s:p.write_text(n,encoding='utf-8',newline='\n')
for rel in ['game/packages/content/src/odors.test.ts','game/packages/content/src/labyrinth/labyrinth-content.test.ts','game/packages/content/src/spectrum/spectrum-content.test.ts']:
    edit(rel,lambda s:re.sub(r'^.*expect\(.*\[\x27zh-Hant\x27\].*\r?\n','',s,flags=re.M).replace('bilingual science limits','English science limits'))
edit('js/pdf-reader.js',lambda s:re.sub(r"function language\(\) \{.*?\}","function language() { return words.en; }",s,count=1))
edit('js/notebook-data.js',lambda s:re.sub(r',"titleZh":"(?:[^"\\]|\\.)*"','',s))
edit('game/packages/ui/src/shell.css',lambda s:re.sub(r'\.lang-switch[^{}]*\{[^{}]*\}\s*','',s))
edit('scripts/audit-publish-assets-v7.cjs',lambda s:s.replace("['en','zh-Hant']", "['en']").replace('pcb-flow-responsive-bilingual','pcb-flow-responsive-English').replace('optical-spectra-bilingual','optical-spectra-English'))
edit('scripts/PUBLICATION.txt',lambda s:s.replace('  python scripts/build-locales.py --check\n','').replace('templates, locales, design_system','templates, design_system').replace('  js/i18n-*-v19.js\n','').replace('  2. Rebuild translation catalogs from locale JSON and explicit shared overlays;','  2. Validate the English source pages and shared interface;'))
# Purely duplicated search translations are removed; proper names remain discoverable.
edit('js/search.js',lambda s:re.sub(r'("keywords": ")([^"\n]*)(")',lambda m:m[1]+(m[2] if any(name in m[2] for name in ('Jeffrey','Jerry')) else re.sub(r'[^\x00-\x7fΩµμ°]+',' ',m[2]))+m[3],s))
# Retire obsolete locale-switch listeners, retaining ordinary UI initialization.
edit('js/model-receptor-v13.js',lambda s:re.sub(r'  // Preserve the research cycle when switching languages\.\n.*?\n  \}\);\n','',s,flags=re.S))
edit('js/education.js',lambda s:re.sub(r'    document.addEventListener\("click", function \(event\) \{\n      if \(!event.target.closest \|\| !event.target.closest\("\[data-language-toggle\]"\)\) return;.*?\n    \}, true\);\n','',s,flags=re.S))
# Odor seed generator remains reproducible with the same vectors and English labels.
edit('game/scripts/rewrite-odors.mjs',lambda s:re.sub(r"\['(?:[^'\\]|\\.)*', ('[^']*')\]",r'\1',s).replace('const [zh, en] = names[id];','const en = names[id];').replace("name: { 'zh-Hant': '${zh}', en:","name: { en:").replace("    'zh-Hant': '${disclaimerZh}',\n",'').replace("odor.name['zh-Hant']",'odor.name.en').replace('/** Generated with Unicode escapes to preserve zh-Hant on all platforms. */','/** English odor labels with unchanged illustrative vectors. */'))
