"""Regenerate canonical printable/assembly meshes with OpenSCAD + numpy.
python CAD/build.py --out new_geometry --openscad /path/to/openscad
Body uses canonical input mesh; tray/lid are canonical mesh inputs, not fully parametric CAD.
"""
from pathlib import Path
import subprocess,argparse,shutil,json
from mesh_checks import read,write
HERE=Path(__file__).resolve().parent
def build(out,exe):
 out=Path(out);(out/'STL').mkdir(parents=True,exist_ok=True);(out/'assembly_coordinates').mkdir(exist_ok=True)
 meta=json.loads((HERE/'parts.json').read_text())
 for name,m in meta.items():
  dest=out/'assembly_coordinates'/(name+'.stl')
  if name.startswith(('02','03')):shutil.copy2(HERE/'assembly_coordinates'/(name+'.stl'),dest)
  else:
   part='well' if name.startswith('05') else 'body' if name.startswith('01') else 'cap';args=[exe,'--export-format','binstl','-o',str(dest),'-D',f'part="{part}"']
   if part=='well':
    q=name.split('_')[2];sx=1 if q in ['NE','SE'] else -1;sy=1 if q in ['NE','NW'] else -1;args+=['-D',f'sx={sx}','-D',f'sy={sy}']
   subprocess.run(args+[str(HERE/'model.scad')],check=True)
  v,f,vol,deg=read(dest);write(out/'STL'/(name+'.stl'),v-v.min(0),f)
 # Export the accessible cap in the same assembly datum, then translate for printing.
 opt=out/'STL/OPTION_accessible_cap';opt.mkdir(exist_ok=True)
 for part in ['lower','upper']:
  dest=out/'assembly_coordinates'/('04_split_'+part+'_BLACK.stl')
  subprocess.run([exe,'--export-format','binstl','-o',str(dest),'-D','part="split_'+part+'"',str(HERE/'accessible_cap.scad')],check=True)
  v,f,vol,deg=read(dest);write(opt/dest.name,v-v.min(0),f)
 return meta
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('--openscad',default=shutil.which('openscad') or 'C:/Program Files/OpenSCAD/openscad.com');a=p.parse_args();build(a.out,a.openscad)
