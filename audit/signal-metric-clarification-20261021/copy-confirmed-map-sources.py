from pathlib import Path
from datetime import datetime,timezone
import ast,hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[3];AUD=Path(__file__).resolve().parent
DATA=ROOT/'zenodo-release/aerosense-wiki/data';REPO=ROOT/'gitlab/aerosense-software'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest_path=REPO/'code/aerosense/source-manifest.json';manifest=json.loads(manifest_path.read_text(encoding='utf8'));rows={r['path']:r for r in manifest['files']}
targets=[('hardware-confirmed-map-2026-10-21','code/aerosense/hardware/07_validation/hardware-confirmed-map',['analyze_patterns.py','verify_patterns.py','README.md','requirements.txt']),
 ('signal-metric-confirmed-map-2026-10-21','code/aerosense/hardware/07_validation/signal-metric-confirmed-map',['build_clarification.py','README.md','requirements.txt']),
 ('test2-confirmed-map-2026-10-21','code/aerosense/wetlab/aerosense-wiki/data/test2-confirmed-map-2026-10-21',['analysis/analyze_change.py','analysis/analyze_odor.py','analysis/normalize_vuaa1.py','analysis/requirements.txt']),
 ('odor-f1-dynamic-20261021','code/aerosense/wetlab/odor-f1-dynamic',['code/analyze_f1_dynamic.py','code/validate_f1_dynamic.py','requirements.txt','README_EN.txt'])]
added=[]
for batch,prefix,names in targets:
 for name in names:
    source=DATA/batch/name;relative=prefix+'/'+name;dest=REPO/relative
    assert source.is_file() and source.stat().st_size<1_000_000
    if source.suffix=='.py':ast.parse(source.read_text(encoding='utf-8-sig'))
    if dest.exists():assert sha(dest)==sha(source),relative
    else:dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest)
    assert sha(dest)==sha(source)
    row={'path':relative,'source':source.relative_to(ROOT).as_posix(),'topic':'hardware' if prefix.startswith('code/aerosense/hardware/') else 'wetlab',
     'source_bytes':source.stat().st_size,'source_sha256':sha(source),'bytes':dest.stat().st_size,'sha256':sha(dest),
     'selection':'User-confirmed receptor-map correction or separately defined F1 analysis. Exact canonical editable source; raw and derived data stay outside Git. Earlier map editions remain historical.',
     'repository_policy_category':'analysis_source' if source.suffix=='.py' else 'dependency_specification' if source.name=='requirements.txt' else 'reproduction_documentation'}
    rows[relative]=row;added.append(row)
manifest['files']=sorted(rows.values(),key=lambda r:r['path'])
manifest['summary']['retained_manifest_files']=len(rows);manifest['summary']['retained_bytes']=sum(r['bytes'] for r in rows.values())
manifest['status']='User confirmed the new F1 ordering as the corrected Test 2 map. Corrected-map analysis sources and F1 sources are prepared; final Registry Markdown mirrors and publication verification remain pending.'
manifest['confirmed_map_revision']={'at_utc':datetime.now(timezone.utc).isoformat(),'source_files':added,'user_confirmed_map':['Or7a','Or19a','Or42a','Or98a','Or22a','Or67a','Or67b','Or59b','Or85b','Or35a','ORCO only','Blank'],'raw_values_changed':False,'git_operations':False}
if 'browser_comment_final_source_revision' in manifest:manifest['browser_comment_final_source_revision']['f1_additions_excluded']=False
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(AUD/'confirmed-map-software-sources.json').write_text(json.dumps({'sources':added,'manifest_sha256':sha(manifest_path),'source_count':len(rows),'source_bytes':manifest['summary']['retained_bytes'],'registry_mirrors_pending':True,'git_operations':False},indent=2)+'\n',encoding='utf8')
page=ROOT/'aerosense-wiki/hardware.html';text=page.read_text(encoding='utf8');text=text.replace('/hardware/07_validation/hardware-wetlab-pattern-comparison/', '/hardware/07_validation/hardware-confirmed-map/');page.write_text(text,encoding='utf8')
print(json.dumps({'prepared_sources':len(added),'manifest_files':len(rows),'hardware_source_link_updated':True}))
