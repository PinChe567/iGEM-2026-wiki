"""Check four-filter artifacts, complete video decoding and sample alignment.
Run after filter_compare_model.py. Saved movies are not rewritten by this check.
"""
from pathlib import Path
import hashlib,json,subprocess
import numpy as np
import imageio_ffmpeg
from filter_compare_visuals import mp4_info
P=Path(__file__).resolve().parent.parent
O=P/'code/data'; CSV=P/'results'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 v=json.loads((O/'filter_comparison_validation.json').read_text(encoding='utf-8'))
 assert v['pass_test'] and v['all_figures_reproduced']
 for field,base in [('figure_SHA256',P/'figures'),('source_SHA256',P/'code'),('input_SHA256',O),('data_SHA256',O)]:
  for name,h in v[field].items():
   path=(CSV/name) if name.endswith('.csv') else base/name
   assert sha(path)==h,(field,name)
 movie=P/'videos/filter_signal_comparison.mp4'
 assert mp4_info(movie)=={'duration_s':20.,'frame_count':200}
 decode=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-i',str(movie),'-progress','pipe:1','-nostats','-f','null','-'],capture_output=True,text=True,check=True)
 count=[int(x.split('=')[1]) for x in decode.stdout.splitlines() if x.startswith('frame=')]
 assert count[-1]==200 and not decode.stderr.strip()
 align=json.loads((O/'filter_comparison_frame_alignment.json').read_text())
 traces=np.load(O/'filter_comparison_traces.npz')
 assert len(align)==200
 for k,a in enumerate(align):
  i=4*k
  assert a['frame']==k and a['sample']==i and a['physical_time_s']==i/4000
  assert np.array_equal(a['LED_gates'],traces['gates'][i])
  for field in ['raw','ideal','residual']:assert np.array_equal(a[field+'_nA'],traces[field][:,i])
 v['video']=dict(path='videos/'+movie.name,sha256=sha(movie),**mp4_info(movie),fps=10,dimensions=[2530,1190],all_200_frames_decoded_successfully=True,all_200_alignment_records_match_saved_traces=True,physical_time_range_s=[0,.199],slowdown=100,visual_review='Existing movie was reviewed before directory simplification. This check validates bytes, decode and alignment; it does not infer new visual review.')
 v['layout']='README + code/data + results CSV + figures + videos'
 (O/'filter_comparison_validation.json').write_text(json.dumps(v,indent=2),encoding='utf-8')
 print('PASS: figure/input/data hashes; 200 decoded frames; 200 aligned records.')
if __name__=='__main__':main()
