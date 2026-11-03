"""Create a new corrected-label batch; preserve every historical input/output."""
from pathlib import Path
import csv,json,re,shutil,hashlib,datetime
ROOT=Path(__file__).resolve().parents[3];DATA=ROOT/'zenodo-release/aerosense-wiki/data'
OLD=DATA/'odor-2026-10-21';NEW=DATA/'test2-confirmed-map-2026-10-21'
names=['Or7a','Or19a','Or42a','Or98a','Or22a','Or67a','Or67b','Or59b','Or85b','Or35a','ORCO only','Blank']
constructs=[x+' + ORCO' if i<10 else x for i,x in enumerate(names)]
keys=[x.lower().replace(' ','-') for x in names]
NEW.mkdir(exist_ok=True)
for folder in ['analysis','derived']:
 shutil.copytree(OLD/folder,NEW/folder,dirs_exist_ok=True)
for p in OLD.glob('*'):
 if p.is_file():shutil.copy2(p,NEW/p.name)
numeric_checks=[]
for p in (NEW/'derived').glob('*.csv'):
 with p.open(encoding='utf-8-sig',newline='') as f:rows=list(csv.DictReader(f));fields=list(rows[0])
 if 'position' not in fields:continue
 for r in rows:
  if r.get('test')=='Test 1':continue
  pos=int(r['position'])
  if 'construct' in r:r['construct']=constructs[pos-1]
  if 'receptor_key' in r:r['receptor_key']=keys[pos-1]
  if 'batch' in r:r['batch']=NEW.name
 with p.open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
 for before,after in zip(csv.DictReader((OLD/'derived'/p.name).open(encoding='utf-8-sig')),rows):
  assert all(before[k]==after[k] for k in fields if k not in ['construct','receptor_key','batch'])
 numeric_checks.append({'file':p.name,'rows':len(rows),'all_nonlabel_fields_unchanged':True})
for p in (NEW/'analysis').glob('*.py'):
 s=p.read_text('utf8')
 s=re.sub(r'^(NAMES|CONSTRUCTS)\s*=.*$',lambda m:m.group(1)+'='+repr(constructs),s,flags=re.M)
 s=re.sub(r'^KEYS\s*=.*$','KEYS='+repr(keys),s,flags=re.M)
 s=s.replace('.replace("notransfect","untransfected")','.replace("notransfect","untransfected").replace("blank","untransfected")')
 s=s.replace('(4,ORANGE,"Or35a + ORCO")','(10,ORANGE,"Or35a + ORCO")')
 s=s.replace('selections=[("A",11),("A",12),("A",4),("H",5),("H",4),("H",11)]','selections=[("A",11),("A",12),("A",10),("H",3),("H",10),("H",11)]')
 s=s.replace('default=HERE/"raw"','default=HERE.parent/"odor-2026-10-21/raw"')
 p.write_text(s,encoding='utf8',newline='\n')
# Derive the corrected S/N files without rendering yet.
for filename,call in [('analyze_change.py','derive'),('normalize_vuaa1.py','build')]:
 p=NEW/'analysis'/filename;g={'__name__':'mapping_validation','__file__':str(p)}
 exec(compile(p.read_text('utf8'),str(p),'exec'),g);g[call]()
# The legacy summary is retained as an audit metric, with the corrected map explicit.
p=NEW/'derived/summary.json'
if p.exists():
 d=json.loads(p.read_text('utf8'));d['constructs_by_position']={str(i+1):x for i,x in enumerate(constructs)};d['mapping_source']='Experimenter-confirmed correction on 2026-10-21; supersedes earlier Test 2 receptor labels; raw wells/cells unchanged.';p.write_text(json.dumps(d,indent=2)+'\n',encoding='utf8')
clar=DATA/'signal-metric-confirmed-map-2026-10-21';clar.mkdir(exist_ok=True)
oldclar=DATA/'signal-metric-clarification-2026-10-21'
for filename in ['build_clarification.py','requirements.txt','README.md']:
 shutil.copy2(oldclar/filename,clar/filename)
p=clar/'build_clarification.py';s=p.read_text('utf8').replace("wet=root/'data/odor-2026-10-21'","wet=root/'data/test2-confirmed-map-2026-10-21'")
s=re.sub(r'^RECEPTORS=.*$','RECEPTORS='+repr(names[:11]),s,flags=re.M)
p.write_text(s,encoding='utf8',newline='\n')
receipt={'confirmed_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'authority':'Direct experimenter confirmation relayed by root in this task','new_batch':str(NEW),'historical_batch_retained':str(OLD),'constructs_by_position':{str(i+1):v for i,v in enumerate(constructs)},'numeric_invariance':numeric_checks,'raw_source_directory':'../odor-2026-10-21/raw','interpretation':'Only receptor/control labels and correct construct-to-well associations change. Per-well RFU and S/N calculations are unchanged. Historical labels are superseded, not silently overwritten.'}
(NEW/'MAPPING-CORRECTION.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
(NEW/'README-CONFIRMED-MAP.txt').write_text(receipt['interpretation']+'\nRaw source files remain unchanged in ../odor-2026-10-21/raw.\n'+json.dumps(receipt['constructs_by_position'],indent=2)+'\n',encoding='utf8')
print(json.dumps({'new_batch':str(NEW),'clarification':str(clar),'checks':numeric_checks},indent=2))
