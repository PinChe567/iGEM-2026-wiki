"""Independent stdlib audit of the fixed five-point display (no input mutation)."""
from pathlib import Path
import csv, hashlib, json, math, statistics, sys
from xml.etree import ElementTree as ET

HERE=Path(__file__).resolve().parent
WORK=HERE.parents[2]
ARCHIVE=WORK/'zenodo-release'
BATCH=ARCHIVE/'aerosense-wiki/data/signal-metric-clarification-2026-10-21'
PATTERN=ARCHIVE/'aerosense-wiki/data/hardware-wetlab-pattern-comparison-2026-10-21'
BACKEND=WORK.parent/'PCB layout/chatgpt version/03_software'
def rows(path):
    with path.open(encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def ranks(v):
    ordered=sorted(enumerate(v),key=lambda a:a[1]); result=[None]*len(v)
    for i,value in enumerate(v):
        positions=[j+1 for j,(_,x) in enumerate(ordered) if x==value]
        result[i]=sum(positions)/len(positions)
    return result

selected=[r for r in rows(PATTERN/'aligned-timepoints.csv') if r['scenario']=='nominal_native5_selected']
labels=['Or35a','Or85b','Or98a','ORCO only']; groups={}
for i in range(4):
    series=sorted((r for r in selected if r['channel']==f'D{i+1}'),key=lambda r:float(r['time_s']))
    assert [float(r['time_s']) for r in series]==[0,12,24,36,48]
    groups[i]={key:[float(r[key]) for r in series] for key in ['hardware_mV','wetlab_rfu','hardware_F_over_first','wetlab_F_over_first']}

display=rows(BATCH/'hardware-pairwise-display.csv'); checks=[]
for i in range(4):
    for j in range(4):
        x=groups[i]['hardware_mV'];y=groups[j]['wetlab_rfu'];nx=groups[i]['hardware_F_over_first'];ny=groups[j]['wetlab_F_over_first']
        assert all(math.isclose(a/x[0],b,rel_tol=0,abs_tol=1e-12) for a,b in zip(x,nx))
        assert all(math.isclose(a/y[0],b,rel_tol=0,abs_tol=1e-12) for a,b in zip(y,ny))
        row=next(r for r in display if r['hardware_channel']==f'D{i+1}' and r['wetlab_construct']==labels[j])
        r=statistics.correlation(x,y); rho=statistics.correlation(ranks(x),ranks(y))
        norm_r=statistics.correlation(nx,ny);norm_rho=statistics.correlation(ranks(nx),ranks(ny))
        dr=statistics.correlation([b-a for a,b in zip(nx,nx[1:])],[b-a for a,b in zip(ny,ny[1:])])
        err=max(abs(r-float(row['pearson_level'])),abs(rho-float(row['spearman_level'])),abs(r-norm_r),abs(rho-norm_rho),abs(dr-float(row['pearson_first_difference_retained_sensitivity'])))
        assert err<1e-12
        checks.append({'hardware_channel':f'D{i+1}','wetlab_construct':labels[j],'pearson_raw':r,'pearson_normalized':norm_r,'spearman_raw':rho,'spearman_normalized':norm_rho,'max_error':err})

source_proof=json.loads((BATCH/'verification.json').read_text())
for p in source_proof['inputs'].values():assert sha(ARCHIVE/p['archive_path'])==p['sha256']
figures=[]
for name in ['pairwise-pearson-spearman.svg','pairwise-pearson-spearman-mobile.svg']:
    p=BATCH/'figures'/name;root=ET.parse(p).getroot();text=' '.join(''.join(e.itertext()) for e in root.iter() if e.tag.endswith('text'))
    assert 'Pearson r' in text and 'Spearman' in text and 'five time points' in text
    assert 'four intervals' not in text and 'First differences' not in text
    figures.append({'path':p.relative_to(ARCHIVE).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size})

backend_files=['README.md','analysis/odor_session.py','analysis/odor_pattern.py','start_odor_backend.py']
backend={name:{'sha256':sha(BACKEND/name),'bytes':(BACKEND/name).stat().st_size} for name in backend_files}
session=(BACKEND/'analysis/odor_session.py').read_text(encoding='utf-8')
pattern=(BACKEND/'analysis/odor_pattern.py').read_text(encoding='utf-8')
assert '100 * max(0, r)' in session
assert 'RECEPTORS = ["Or22a", "Or35a", "Or85b", "Or98a"]' in pattern
assert '"identifiedOdor": None, "validated": False' in session
report={'status':'passed','method':'Independent Python standard-library statistics.correlation and average ranks, no scipy/numpy correlation reuse.','native_nominal_times_s':[0,12,24,36,48],'pairings':checks,'maximum_absolute_error':max(c['max_error'] for c in checks),'original_input_hashes_verified':len(source_proof['inputs']),'figures':figures,'backend_source_hashes':backend,'provenance_qualification':'Source inspection supports implemented software behavior, not physical-device or biological validation.','no_input_files_changed':True}
(HERE/'independent-hardware-review.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':report['status'],'pairs':len(checks),'maximum_error':report['maximum_absolute_error'],'figures':figures},indent=2))
