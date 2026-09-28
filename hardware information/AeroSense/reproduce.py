"""Run from any directory. --out requires a new directory, preserves delivered data.
Examples: python reproduce.py --plots
python reproduce.py --out ../AeroSense_run --optics --flow --engine csharp --video
"""
from pathlib import Path
import argparse,shutil,subprocess,sys
R=Path(__file__).resolve().parent
def main():
 p=argparse.ArgumentParser();p.add_argument('--out',type=Path);p.add_argument('--plots',action='store_true');p.add_argument('--optics',action='store_true');p.add_argument('--flow',action='store_true');p.add_argument('--video',action='store_true');p.add_argument('--cad',action='store_true');p.add_argument('--engine',choices=['numpy','csharp'],default='numpy');p.add_argument('--workers',type=int,default=2);p.add_argument('--ffmpeg');a=p.parse_args();root=R
 if a.out:
  root=a.out.resolve()
  if root.exists():p.error('--out must be new')
  root.mkdir(parents=True)
  def ignore(path,names):
   skip={'__pycache__'}|{n for n in names if n.endswith('.exe')}
   if Path(path)==R/'simulation':
    if a.flow:skip.add('flow')
    if a.optics:skip.update({'optical_sweep','acceptance_map.npz','acceptance_map.json','fluence_3D.npz','fluence_3D.json'})
   return skip
  shutil.copytree(R/'simulation',root/'simulation',ignore=ignore)
  shutil.copytree(R/'CAD',root/'CAD');shutil.copytree(R/'software/analysis',root/'software/analysis');shutil.copy2(R/'requirements.txt',root/'requirements.txt')
 (root/'results/images').mkdir(parents=True,exist_ok=True)
 def run(file,*args):subprocess.run([sys.executable,str(root/file),*map(str,args)],check=True)
 if a.cad:run('CAD/build.py','--out',root/'rebuilt_CAD')
 if a.optics:run('simulation/optical_maps.py');run('simulation/parameter_sweep.py','--run','--plots');run('simulation/plot_results.py')
 if a.flow:
  if a.engine=='csharp':subprocess.run(['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File',str(root/'simulation/build_accelerator.ps1')],check=True)
  run('simulation/full_flow_sweep.py','--engine',a.engine,'--workers',a.workers);run('simulation/flow_figures_video.py')
 if a.plots:run('simulation/parameter_sweep.py','--plots');run('simulation/plot_results.py');run('simulation/flow_figures_video.py');run('software/analysis/dlia.py','--sweep')
 if a.video:run('simulation/flow_figures_video.py','--video',*(['--ffmpeg',a.ffmpeg] if a.ffmpeg else []))
 if not any([a.plots,a.optics,a.flow,a.video,a.cad]):p.print_help()
if __name__=='__main__':main()
