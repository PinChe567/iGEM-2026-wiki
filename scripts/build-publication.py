"""Build directory-index routes for a static iGEM deployment; never uploads files.

The manifest is produced by scripts/audit-publish-assets-v7.cjs in the workspace.
Use --routes-only to inspect standard-page HTML without copying media.
"""
from pathlib import Path
import argparse, json, shutil, re

site=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--output',default=str(site/'public'))
parser.add_argument('--routes-only',action='store_true')
args=parser.parse_args()
out=Path(args.output).resolve()
if out==site or site in out.parents and out.name in ['assets','js','css','game','igem-upload']:
    raise SystemExit('Choose a separate publication output directory.')
out.mkdir(parents=True,exist_ok=True)
if not args.routes_only:
    manifest=site/'publication-files.json'
    if not manifest.exists(): raise SystemExit('Generate publication-files.json from the linked-asset audit first.')
    for rel in json.loads(manifest.read_text(encoding='utf-8')):
        src=(site/rel).resolve(); dest=(out/rel).resolve()
        if not src.is_relative_to(site) or not dest.is_relative_to(out): raise SystemExit('Manifest path outside publication roots.')
        if src.is_file():
            dest.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dest)
routes=[]
for src in site.glob('*.html'):
    text=src.read_text(encoding='utf-8')
    (out/src.name).write_text(text,encoding='utf-8')
    if src.stem=='index': continue
    route=out/src.stem; route.mkdir(exist_ok=True)
    # Absolute team base preserves assets and *.html links after slash redirects.
    text=re.sub(r'<base\b[^>]*>','',text,flags=re.I)
    text=text.replace('<head>','<head>\n  <base href="/nthu/">',1)
    (route/'index.html').write_text(text,encoding='utf-8'); routes.append('/nthu/'+src.stem)
(out/'route-manifest.json').write_text(json.dumps({'team_base':'/nthu/','routes':routes,'media_copied':not args.routes_only},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'output':str(out),'standard_routes':len(routes),'media_copied':not args.routes_only}))
