"""Validate reproduction, caption coverage, raw-data provenance and scalar metadata.
python validate_publication.py --replot
Optional --reference-zip PATH compares original velocity outputs with an earlier release.
"""
from pathlib import Path
import argparse,ast,hashlib,json,subprocess,sys,zipfile
P=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 a=argparse.ArgumentParser();a.add_argument('--replot',action='store_true');a.add_argument('--reference-zip');args=a.parse_args()
 for p in P.glob('*.py'):ast.parse(p.read_text(encoding='utf-8'))
 before={p.name:sha(p) for p in (P/'figures').glob('*.png')}
 if args.replot:subprocess.run([sys.executable,str(P/'reproduce.py')],check=True)
 after={p.name:sha(p) for p in (P/'figures').glob('*.png')}
 static_names=[n for n in before if not n.startswith('airflow_movie_')]
 if args.replot:assert all(before[n]==after[n] for n in static_names),'Replot changed a saved static figure unexpectedly'
 caps=json.loads((P/'captions.json').read_text(encoding='utf-8'));expected=set(after)|{p.name for p in P.glob('*.mp4')}|{p.name for p in P.glob('*_3d.html')};assert set(caps)==expected
 for name in caps:
  for lang in ['ZH','EN']:assert (P/'figure_notes'/(Path(name).stem+'_'+lang+'.md')).exists()
 zero=json.loads((P/'gas_transport_results/shelf_w8_e0p2_D10_dx0.4_dt0.5_diffusion_only.json').read_text());assert all(v['local_Re_p95']==0 and v['local_Pe_p95']==0 and v['advective_L_over_U_s'] is None for v in zero['velocity_scales'])
 raw_count=None
 if args.reference_zip:
  raw_count=0
  with zipfile.ZipFile(args.reference_zip) as z:
   for p in (P/'results').iterdir():
    if not p.is_file():continue
    n='chatgpt version/02_simulation/airflow/results/'+p.name;assert hashlib.sha256(z.read(n)).hexdigest()==sha(p),p.name;raw_count+=1
 result=dict(passed=True,python_syntax=True,figure_captions=len(caps),bilingual_note_files=len(caps)*2,figure_hashes_reproduced=all(before[n]==after[n] for n in static_names) if args.replot else None,reproduced_static_figures=static_names if args.replot else [],poster_frames_regenerated_by_this_check=False,figure_SHA256=after,diffusion_only_velocity_metadata_zero=True,original_velocity_files_matching_reference_zip=raw_count,baseline_rim_CSV_SHA256=sha(P/'gas_transport_results/shelf_w8_e0p2_D10_dx0.4_dt0.5.csv'),interactive_validation=json.loads((P/'interactive_validation.json').read_text()),scope='Only listed static figures are re-rendered by this check; poster hashes are recorded. No physical validation or browser interaction test is implied.')
 if (P/'operating_validation.json').exists():result['operating_validation']=json.loads((P/'operating_validation.json').read_text())
 (P/'publication_validation.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
if __name__=='__main__':main()
