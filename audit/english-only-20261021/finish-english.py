from pathlib import Path
import json, re
ROOT=Path(__file__).resolve().parents[2]
WS=ROOT.parent
def edit(relative, fn):
    path=ROOT/relative
    old=path.read_text(encoding='utf-8')
    new=fn(old)
    if old!=new: path.write_text(new, encoding='utf-8', newline='\n')

edit('game/apps/wiki-client/src/i18n/locale.ts', lambda s: '''/** The public education interface has one language. Saved study records retain their original metadata. */
export type Locale = 'en';
export const LOCALES: Locale[] = ['en'];
export const DEFAULT_LOCALE: Locale = 'en';
export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en';
}
export function readStoredLocale(): Locale {
  return DEFAULT_LOCALE;
}
''')
def shell(s):
    s=s.replace('brandMarkup, footerMarkup, langSwitchMarkup', 'brandMarkup, footerMarkup')
    s=re.sub(r'import \{\s*readStoredLocale,.*?\} from \'../i18n/locale\';', "import { type Locale } from '../i18n/locale';",s,flags=re.S)
    s=s.replace('let locale = readStoredLocale();', "const locale: Locale = 'en';")
    s=s.replace('          <div data-shell-lang></div>\n','')
    s=re.sub(r"  const langHost = .*?;\n",'',s)
    s=re.sub(r'    langHost.innerHTML = langSwitchMarkup\(.*?\n    \}\);\n','',s,flags=re.S)
    s=re.sub(r"    langHost.querySelectorAll<HTMLButtonElement>\('\[data-locale\]'\).*?\n    \}\);\n",'',s,flags=re.S)
    s=re.sub(r"  window.addEventListener\('storage', \(event\) => \{.*?\n  \}\);\n",'',s,flags=re.S)
    s=s.replace('applyLocale','paintEnglish')
    s=s.replace('  paintEnglish();','  paintEnglish();\n  refreshDialogLabels();')
    return s
edit('game/apps/wiki-client/src/shell/mount.ts', shell)
edit('game/packages/ui/src/shell.ts', lambda s: re.sub(r'export function langSwitchMarkup\(.*?(?=export function footerMarkup)', '', re.sub(r'  lang(?:Zh|En|SwitchAria): string;\n','',s), flags=re.S))
edit('game/packages/ui/src/index.ts', lambda s:s.replace('  langSwitchMarkup,\n',''))
edit('game/apps/wiki-client/src/i18n/messages.ts', lambda s: re.sub(r"^\s*lang(?:Zh|En|SwitchAria):.*\n", '',s,flags=re.M).replace('/** All zh-Hant strings use Unicode escapes so encoding stays stable on Windows. */','/** English interface copy. */').replace('return messages[locale];','return messages.en;').replace('t(locale: Locale)', 't(_locale: Locale)'))

def remove_translations(value):
    if isinstance(value,list): return [remove_translations(v) for v in value]
    if isinstance(value,dict):
        return {k: remove_translations(v) for k,v in value.items() if not ('en' in value and k in {'zh','zh-Hant','zh-TW'})}
    return value
for path in (ROOT/'game').rglob('*.json'):
    if {'node_modules','dist','.git','audit','test-results','playwright-report'}.intersection(path.parts): continue
    text=path.read_text(encoding='utf-8')
    value=json.loads(text)
    converted=remove_translations(value)
    if converted!=value: path.write_text(json.dumps(converted,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

path=ROOT/'home-bundle-sources.json'
value=json.loads(path.read_text(encoding='utf-8'))
for key in ('styles','scripts'): value[key]=[s for s in value[key] if not re.search(r'(?:i18n-|language-v19)',s)]
path.write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
edit('scripts/ci-build.py', lambda s:s.replace('"scripts/build-locales.py", ','').replace(' or re.match(r"js/i18n-.*-v19\\.js$", relative)','').replace('    run([sys.executable, "scripts/build-locales.py"])\n',''))

path=WS/'gitlab/nthu/.gitlab-ci.yml'
s=path.read_text(encoding='utf-8').replace('locales:', 'source-check:').replace('job: locales','job: source-check')
s=s.replace('    - python site/scripts/build-locales.py\n','').replace('    - python site/scripts/build-locales.py --check\n','')
s=s.replace('  artifacts:\n    paths:\n      - site/js/i18n-*-v19.js\n    expire_in: 1 day\n','')
s=s.replace('    - job: source-check\n      artifacts: true','    - job: source-check\n      artifacts: false')
path.write_text(s,encoding='utf-8',newline='\n')
path=WS/'gitlab/nthu/ci/check-source.py'
s=path.read_text(encoding='utf-8').replace('"scripts/build-locales.py", ','')
s=re.sub(r'for directory in \("locales/source".*?(?=lock =)', '',s,flags=re.S)
s=re.sub(r'generated = \{"js/i18n-".*?generated.add\("css/design-system.css"\)', 'generated = {"css/design-system.css"}',s,flags=re.S)
path.write_text(s,encoding='utf-8',newline='\n')
path=WS/'gitlab/nthu/ci/copy-site-source.py'
s=path.read_text(encoding='utf-8').replace('"css","js","locales","design_system/styles"','"css","js","design_system/styles"').replace('"build-locales.py",','')
s=s.replace(' or bool(re.fullmatch(r"js/i18n-.*-v19\\.js", relative))', '')
path.write_text(s,encoding='utf-8',newline='\n')
path=WS/'gitlab/nthu/ci/prepare-publication.py'
s=path.read_text(encoding='utf-8')
s=re.sub(r'^generated.update\(p.relative_to\(SITE\).*?glob\("i18n-\*-v19.js"\)\)\n','',s,flags=re.M)
s=s.replace('and p not in cdn_modules}', 'and p not in cdn_modules\n            and not p.startswith("js/i18n-") and p not in {"js/language-v19.js", "css/language-v19.css"}}')
path.write_text(s,encoding='utf-8',newline='\n')
