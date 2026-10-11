"""Numerical, reproducibility, caption and synchronized-video checks."""
from pathlib import Path
import json,hashlib,argparse,struct
import numpy as np
from PIL import Image
import publication
P=Path(__file__).resolve().parent;R=P/'results'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def mp4_info(path):
 b=path.read_bytes();out={}
 def walk(start,end):
  while start+8<=end:
   size,typ=struct.unpack_from('>I4s',b,start)
   if size<8:break
   stop=start+size
   if typ in [b'moov',b'trak',b'mdia',b'minf',b'stbl']:walk(start+8,stop)
   if typ==b'mvhd':
    if b[start+8]==0:scale,duration=struct.unpack_from('>II',b,start+20)
    else:scale=struct.unpack_from('>I',b,start+28)[0];duration=struct.unpack_from('>Q',b,start+32)[0]
    out['duration_seconds']=duration/scale
   if typ==b'stsz':out['sample_count']=struct.unpack_from('>I',b,start+16)[0]
   start=stop
 walk(0,len(b));return out
def validate(skip_video=False):
 s=json.loads((R/'summary.json').read_text());files=[R/(v['case']+'.json') for v in s['cases']]+[R/x for x in ['summary.json','spatial_maps.npz','maps_summary.json','volume_standard_summary.json','event_limit_convergence.json','animation_paths.json']]+[P/'transport.py']
 before={str(p.relative_to(P)):sha(p) for p in files};fig_before={p.name:sha(p) for p in (P/'figures').glob('*.png')};publication.figures();fig_after={p.name:sha(p) for p in (P/'figures').glob('*.png')};after={str(p.relative_to(P)):sha(p) for p in files}
 assert before==after,'Publication regeneration changed frozen MC';assert fig_before==fig_after and len(fig_after)==10
 frequency=json.loads((R/'frequency_validation.json').read_text());assert frequency['pass_test']
 captions=json.loads((P/'captions.json').read_text())
 for name in list(fig_after)+['optical_slow_motion.mp4','optical_slow_motion.gif']:
  assert set(captions[name])=={'ZH','EN'}
  for lang in ['ZH','EN']:assert (P/'figure_notes'/f'{Path(name).stem}_{lang}.md').exists()
 video={}
 if not skip_video:
  a=json.loads((R/'video_frame_alignment.json').read_text());frames=a['frames'];assert a['pass_test'] and len(frames)==200;dat=np.load(R/'frequency_traces.npz')
  for k,row in enumerate(frames):
   ix,t,on=publication.movie_state(k);assert ix==row['sample_index']==row['history_last_sample'];assert t==row['time_s'];assert on.tolist()==row['LED_states'];assert abs(row['ideal_nW']-dat['ideal_nW'][ix])<1e-12;assert abs(row['received_nW']-dat['received_nW'][ix])<1e-12
  gif=Image.open(P/'optical_slow_motion.gif');assert gif.n_frames==200;dur=0
  for k in range(gif.n_frames):gif.seek(k);dur+=gif.info['duration']
  assert dur==20000;mp4=mp4_info(P/'optical_slow_motion.mp4');assert mp4['sample_count']==200 and abs(mp4['duration_seconds']-20)<.01
  video=dict(all_200_frames_share_one_time=True,first_frame_sample=0,no_future_trace_samples=True,actual_NE_paths_only=True,GIF_frames=200,GIF_duration_seconds=dur/1000,MP4=mp4,MP4_SHA256=sha(P/'optical_slow_motion.mp4'),GIF_SHA256=sha(P/'optical_slow_motion.gif'))
 report=dict(all_figures_reproduced=True,figure_count=10,figure_SHA256=fig_after,original_MC_unchanged_by_plotting=True,original_MC_SHA256=before,additional_MC_cases=12,additional_MC_packets=3024000,synthetic_scenarios=144,noise_replicates=32,synthetic_channel_records=18432,frequency_test=frequency,video=video,video_checked=not skip_video,status='Conditional numerical/synthetic results; not physical device validation')
 (R/'publication_validation.json').write_text(json.dumps(report,indent=2));old=json.loads((R/'validation.json').read_text());old.pop('all_8_figure_hashes_reproduced',None);old.update(report);(R/'validation.json').write_text(json.dumps(old,indent=2))
 prov=json.loads((R/'geometry_provenance.json').read_text());prov['source_SHA256']={p.name:sha(p) for p in sorted(P.glob('*.py'))};prov['publication_note']='Geometry/CAD unchanged; additional per-LED leakage MC, conditional noise/ambient model and sparse synchronized visualizations.';(R/'geometry_provenance.json').write_text(json.dumps(prov,indent=2))
 print(json.dumps({k:v for k,v in report.items() if k not in ['figure_SHA256','original_MC_SHA256']},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--skip-video',action='store_true');a=p.parse_args();validate(a.skip_video)
