"""Recreate delivered CFD and figures in a NEW directory, or replot saved fields.
Windows full replay: python reproduce.py --fresh-dir replay --video
Saved-data plots only: python reproduce.py
Requires Python3.11+, NumPy, Pillow and SciPy; imageio-ffmpeg only for MP4.
"""
from pathlib import Path
import argparse,concurrent.futures,shutil,subprocess,sys
P=Path(__file__).resolve().parent
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--fresh-dir');ap.add_argument('--video',action='store_true');ap.add_argument('--ffmpeg');a=ap.parse_args();dest=P
 if a.fresh_dir:
  dest=Path(a.fresh_dir).resolve()
  if dest.exists():raise FileExistsError('Choose a NEW output directory; no existing data will be overwritten.')
  dest.mkdir(parents=True)
  for name in ['reproduce.py','run_flow.py','lbm_reference.py','LbmCoreFast.cs','LbmCorePhysical.cs','build_solver.ps1','analyze.py','plot_and_video.py','requirements.txt','hole_sweep.py','gas_transport.py','supplemental_figures.py','publication_notes.py','scatter_math.js','scatter_ui.js','test_interactive.cjs','validate_publication.py']:
   shutil.copy2(P/name,dest/name)
  for name in ['operating_sweep.py','operating_figures.py','operating_sweep_config.json','operating_refinement_config.json','operating_selected_check_config.json','operating_math.js','operating_ui.js','test_operating.cjs']:
   shutil.copy2(P/name,dest/name)
  subprocess.run(['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File',str(dest/'build_solver.ps1')],check=True)
  def run(args):subprocess.run([sys.executable,str(dest/'run_flow.py'),*args],check=True)
  run(['--all','--workers','2'])
  with concurrent.futures.ThreadPoolExecutor(2) as ex:
   tasks=[ex.submit(run,['--case',case,'--dx',str(dx)]) for dx in [.3,.2] for case in ['open','shelf_w8_e0p2']]
   for t in tasks:t.result()
  run(['--case','shelf_w4_e3p6','--dx','.3'])
  import json
  for case in ['open','shelf_w8_e0p2']:
   drho=str(json.loads((dest/'results'/f'{case}_dx0.3.json').read_text())['dp_at_1mLmin_Pa']/3.6)
   run(['--case',case,'--dx','.3','--tau','.55','--drho',drho,'--max-steps','80000','--tag-suffix','_near1mLmin'])
  run(['--benchmark','--dx','.3']);run(['--benchmark','--dx','.3','--engine','numpy','--tag-suffix','_numpy']);run(['--benchmark','--dx','.3','--tau','.55','--tag-suffix','_tau055'])
  subprocess.run([sys.executable,str(dest/'hole_sweep.py'),'--run','--refine'],check=True)
  subprocess.run([sys.executable,str(dest/'gas_transport.py'),'--run','--checks'],check=True)
  subprocess.run([sys.executable,str(dest/'operating_sweep.py'),'--run','--checks','--refine','--selected-checks'],check=True)
 subprocess.run([sys.executable,str(dest/'analyze.py')],check=True)
 args=[sys.executable,str(dest/'plot_and_video.py')]
 if a.video:args+=['--video']
 if a.ffmpeg:args+=['--ffmpeg',a.ffmpeg]
 subprocess.run(args,check=True)
 subprocess.run([sys.executable,str(dest/'supplemental_figures.py')],check=True)
 if (dest/'operating_results').exists():
  subprocess.run([sys.executable,str(dest/'operating_figures.py')],check=True)
 subprocess.run([sys.executable,str(dest/'publication_notes.py')],check=True)
 print('Completed:',dest)
if __name__=='__main__':main()
