"""Replot saved fields in place. Use --solve only for an expensive full replay."""
from pathlib import Path
import argparse,concurrent.futures,subprocess,sys
P=Path(__file__).resolve().parent
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--solve',action='store_true');ap.add_argument('--video',action='store_true');ap.add_argument('--ffmpeg');a=ap.parse_args();dest=P
 if a.solve:
  subprocess.run(['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File',str(dest/'build_solver.ps1')],check=True)
  def run(args):subprocess.run([sys.executable,str(dest/'run_flow.py'),*args],check=True)
  run(['--all','--workers','2'])
  with concurrent.futures.ThreadPoolExecutor(2) as ex:
   tasks=[ex.submit(run,['--case',case,'--dx',str(dx)]) for dx in [.3,.2] for case in ['open','shelf_w8_e0p2']]
   for t in tasks:t.result()
  run(['--case','shelf_w4_e3p6','--dx','.3'])
  import json
  for case in ['open','shelf_w8_e0p2']:
   drho=str(json.loads((dest/'data/results'/f'{case}_dx0.3.json').read_text())['dp_at_1mLmin_Pa']/3.6)
   run(['--case',case,'--dx','.3','--tau','.55','--drho',drho,'--max-steps','80000','--tag-suffix','_near1mLmin'])
  run(['--benchmark','--dx','.3']);run(['--benchmark','--dx','.3','--engine','numpy','--tag-suffix','_numpy']);run(['--benchmark','--dx','.3','--tau','.55','--tag-suffix','_tau055'])
  subprocess.run([sys.executable,str(dest/'hole_sweep.py'),'--run','--refine'],check=True)
  subprocess.run([sys.executable,str(dest/'gas_transport.py'),'--run','--checks'],check=True)
  subprocess.run([sys.executable,str(dest/'operating_sweep.py'),'--run','--checks','--refine','--selected-checks'],check=True)
 subprocess.run([sys.executable,'-B',str(dest/'analyze.py')],check=True)
 args=[sys.executable,'-B',str(dest/'plot_and_video.py')]
 if a.video:args+=['--video']
 if a.ffmpeg:args+=['--ffmpeg',a.ffmpeg]
 subprocess.run(args,check=True)
 for script in ['supplemental_figures.py','operating_figures.py']:
  subprocess.run([sys.executable,'-B',str(dest/script)],check=True)
 print('Rebuilt seven figures and summary CSVs from saved data.')
if __name__=='__main__':main()
