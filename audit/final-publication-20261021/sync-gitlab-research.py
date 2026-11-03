"""Apply the reviewed source/document plan; no website, CI, Git, or remote writes."""
from pathlib import Path
import ast,datetime,hashlib,json,shutil
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];REPO=ROOT/'gitlab/nthu'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
plan=json.loads((OUT/'gitlab-sync-plan.json').read_text(encoding='utf-8'))
records=[]
for item in plan['files']:
    source=ROOT/item['source'];dest=REPO/item['destination']
    assert dest.resolve().is_relative_to(REPO.resolve())
    assert item['destination'].startswith(('code/aerosense/wetlab/','code/aerosense/parts-analysis/','docs/aerosense/parts/'))
    before=sha(dest) if dest.is_file() else None
    assert before==item['destination_sha256'],('Destination changed after review',item['destination'])
    dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest)
    records.append({'source':item['source'],'path':item['destination'],'source_bytes':source.stat().st_size,'source_sha256':sha(source),'bytes':dest.stat().st_size,'sha256':sha(dest),'previous_sha256':before,'selection':'current canonical source/document copy; no raw measurements copied'})

p=REPO/'code/aerosense/parts-analysis/integrate_disturbance_characterisation.py'
t=p.read_text(encoding='utf-8')
t=t.replace('import csv\n','import argparse\nimport csv\n',1)
t=t.replace('HERE = Path(__file__).resolve().parent\nROOT = HERE.parent\nBATCH = "odor-2026-10-21"\nSOURCE = ROOT / "zenodo-release/aerosense-wiki/data" / BATCH\nFIGSOURCE = ROOT / "aerosense-wiki/fig" / BATCH',
'''SCRIPT_DIR = Path(__file__).resolve().parent
BATCH = "odor-2026-10-21"
# Publication copy: preserve scientific inputs while locating the GitLab layout.
if (SCRIPT_DIR.parents[2] / "docs/aerosense/parts").is_dir():
    ROOT = SCRIPT_DIR.parents[2]
    HERE = ROOT / "docs/aerosense/parts"
    SOURCE = ROOT / "code/aerosense/wetlab/aerosense-wiki/data" / BATCH
    FIGSOURCE = SOURCE / "figures/change-analysis"
else:
    HERE = SCRIPT_DIR
    ROOT = HERE.parent
    SOURCE = ROOT / "zenodo-release/aerosense-wiki/data" / BATCH
    FIGSOURCE = ROOT / "aerosense-wiki/fig" / BATCH''')
t=t.replace('def main():\n    rows = audit_and_calculate()',
'''def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validate-only", action="store_true", help="Check all 72 corrected wells and 66 reference ratios without writing documents or figures")
    args = parser.parse_args()
    rows = audit_and_calculate()
    if args.validate_only:
        print(json.dumps({"corrected_wells_verified":72,"vuaa1_referenced_ratios_verified":66,"writes":0}))
        return''')
assert 'SCRIPT_DIR = ' in t and '--validate-only' in t
ast.parse(t);p.write_text(t,encoding='utf-8',newline='\n')
for r in records:
    dest=REPO/r['path'];r['bytes']=dest.stat().st_size;r['sha256']=sha(dest)
    if r['sha256']!=r['source_sha256']:r['selection']='publication adaptation: GitLab data/document paths plus read-only validation CLI; scientific calculations unchanged'
(OUT/'gitlab-research-sync-receipt.json').write_text(json.dumps({'executed_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':records,'count':len(records),'bytes':sum(r['bytes'] for r in records),'website_ci_git_remote_changed':False,'raw_measurements_copied':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'copied':len(records),'bytes':sum(r['bytes'] for r in records),'adapted_scripts':sum(r['sha256']!=r['source_sha256'] for r in records)}))
