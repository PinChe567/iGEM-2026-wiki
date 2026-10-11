"""Render computed hole-sweep/transport data only; build offline interactive HTML."""
from pathlib import Path
import csv,json,math,hashlib
import numpy as np
from PIL import Image,ImageDraw
from plot_and_video import font,BG,TEXT,MUTED,GRID,TEAL,BLUE,GOLD
P=Path(__file__).resolve().parent;OUT=P/'figures';OUT.mkdir(exist_ok=True)
def read(path):return json.loads((P/path).read_text())
def palette(t):
 a=np.array([49,76,143]);b=np.array([48,181,168]);c=np.array([247,206,76]);r=a+(b-a)*t*2 if t<.5 else b+(c-b)*(t-.5)*2;return tuple(r.astype(int))
def holes():
 raw=list(csv.DictReader((P/'hole_sweep.csv').open()));rows=[{k:(v=='True' if k=='converged' else v if k in ['case','raw_json'] else float(v)) for k,v in r.items()} for r in raw]
 assert len(rows)==18 and all(r['converged'] for r in rows)
 hashes=[]
 for r in rows:
  npz=P/'hole_sweep_results'/f"{r['case']}_dx0.3_field.npz";q=np.load(npz);hashes.append(hashlib.sha256(q['xyz_mm'].tobytes()).hexdigest())
 assert len(set(hashes))==18,'Different parameters produced identical voxel geometry'
 refinements=[]
 for k in read('hole_refinement_cases.json'):
  a=read(f'hole_sweep_results/{k}_dx0.3.json');b=read(f'hole_sweep_results/{k}_dx0.2.json');o=read('results/open_dx0.2.json')
  refinements.append(dict(case=k,J_ratio_dx03=next(r['J_ratio_to_open'] for r in rows if r['case']==k),J_ratio_dx02=b['worst_mouth_downward_momentum_N']/o['worst_mouth_downward_momentum_N'],speed_ratio_dx02=b['worst_near_liquid_p95_mm_s']/o['worst_near_liquid_p95_mm_s'],all_converged=a['converged'] and b['converged']))
 summary=dict(case_count=18,refinement_solve_count=len(refinements),all_converged=all(r['converged'] for r in rows),distinct_voxel_geometries=len(set(hashes)),min_hole_diameter_cells=min(r['diameter_cells'] for r in rows),min_web_cells=min(r['web_cells'] for r in rows),min_lower_gap_cells=min(r['lower_gap_cells'] for r in rows),best_J_coarse=min(rows,key=lambda r:r['J_ratio_to_open']),max_J_coarse=max(rows,key=lambda r:r['J_ratio_to_open']),refinements=refinements,decision='Keep current shelf prototype; hole cases demonstrate lower gas circulation, not superior cell exposure. No new CAD/print option is released.',scope='Fixed six holes; pitch is spacing, not total hole-count density. Q normalized1mL/min. Hole/gap staircase sensitivity remains.')
 (P/'hole_sweep_summary.json').write_text(json.dumps(summary,indent=2))
 im=Image.new('RGB',(1650,950),BG);d=ImageDraw.Draw(im);d.text((50,25),'Perforated-plate sweep',font=font(37,True),fill=TEXT);lo=math.log10(min(r['J_ratio_to_open'] for r in rows));hi=math.log10(max(r['J_ratio_to_open'] for r in rows))
 for pane,z in enumerate([57.9,58.2]):
  x0=150+pane*730;y0=190;cw=175;ch=180;d.text((x0,110),f'{chr(65+pane)}  Inlet-to-plate gap {60.8-z-1.2:.1f} mm',font=font(27,True),fill=TEXT)
  for r in [r for r in rows if abs(r['plate_bottom_z_mm']-z)<1e-5]:
   i=[1.2,1.8,2.4].index(r['diameter_mm']);j=[3.6,4.2,4.8].index(r['pitch_mm']);x=x0+i*cw;y=y0+(2-j)*ch;t=(math.log10(r['J_ratio_to_open'])-lo)/(hi-lo);d.rectangle((x,y,x+cw-3,y+ch-3),fill=palette(t));d.text((x+50,y+70),f"{r['J_ratio_to_open']:.3f}",font=font(28,True),fill='white' if t<.35 else TEXT)
  for i,v in enumerate([1.2,1.8,2.4]):d.text((x0+i*cw+65,y0+3*ch+16),str(v),font=font(25),fill=TEXT)
  for j,v in enumerate([4.8,4.2,3.6]):d.text((x0-63,y0+j*ch+75),str(v),font=font(25),fill=TEXT)
  d.text((x0+130,y0+3*ch+62),'Hole diameter [mm]',font=font(25),fill=TEXT);d.text((x0-55,y0-43),'Pitch [mm]',font=font(23),fill=TEXT)
 d.text((160,860),'J / J(open)',font=font(23),fill=TEXT)
 for k in range(700):d.line((360+k,864,360+k,888),fill=palette(k/699))
 for i in range(5):d.text((344+i*175,900),f'{10**(lo+(hi-lo)*i/4):.3f}',font=font(18),fill=TEXT)
 im.save(OUT/'hole_sweep.png',dpi=(300,300))
 template='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Perforated-plate sweep</title><style>body{font:16px Arial;color:#17232c;max-width:1300px;margin:auto;padding:22px;background:white}h1{font-size:27px}canvas{width:100%;touch-action:none;border:1px solid #ddd}nav{display:flex;gap:16px;align-items:center;flex-wrap:wrap}button,select{font:inherit;padding:6px}a{color:#167482}#detail{min-height:2.5em;line-height:1.5}</style><h1>Perforated-plate sweep · 孔板掃參數</h1><nav><label>Colour / 顏色 <select id="metric"><option value="J_ratio_to_open">Downward momentum ratio</option><option value="near_liquid_P95_ratio_to_open">Near-liquid speed ratio</option><option value="pressure_Pa">Pressure drop</option><option value="open_area_fraction">Open-area fraction</option></select></label><button id="reset">Reset view / 重設</button><a href="hole_sweep.csv">CSV</a><a href="Figure_Guide_ZH.md">中文說明</a><a href="Figure_Guide_EN.md">English guide</a></nav><p>Drag / arrow keys: rotate · Scroll: zoom · Hover: case values</p><canvas tabindex="0" aria-label="Interactive three-dimensional scatter of18 computed perforated-plate designs"></canvas><p id="detail">18 computed points / 18個已求解幾何</p><a id="raw"></a><script>const DATA=__DATA__;</script><script>__MATH__</script><script>__UI__</script></html>'''
 html=template.replace('__DATA__',json.dumps(rows)).replace('__MATH__',(P/'scatter_math.js').read_text()).replace('__UI__',(P/'scatter_ui.js').read_text());(P/'hole_sweep_3d.html').write_text(html,encoding='utf-8')
 return summary
def linepanel(d,rect,series,xlabel,ylabel,title,xmax,ymax):
 x,y,w,h=rect;d.text((x,y-70),title,font=font(28,True),fill=TEXT)
 for v in np.linspace(0,ymax,6):
  yy=y+h*(1-v/ymax);d.line((x,yy,x+w,yy),fill=GRID,width=1);d.text((x-60,yy-12),f'{v:.2g}',font=font(20),fill=TEXT)
 for v in np.linspace(0,xmax,6):d.text((x+w*v/xmax-15,y+h+15),f'{v:g}',font=font(20),fill=TEXT)
 d.line((x,y,x,y+h,x+w,y+h),fill=TEXT,width=2);d.text((x+w/2-65,y+h+55),xlabel,font=font(23),fill=TEXT);d.text((x,y-33),ylabel,font=font(23),fill=TEXT)
 for name,xx,yy,col in series:d.line([(x+w*float(a)/xmax,y+h*(1-float(b)/ymax)) for a,b in zip(xx,yy)],fill=col,width=4)
 for i,(name,_,_,col) in enumerate(series):d.line((x+15,y+20+34*i,x+47,y+20+34*i),fill=col,width=4);d.text((x+55,y+5+34*i),name,font=font(20),fill=TEXT)
def transport():
 base=P/'gas_transport_results';paths=[base/f'{case}_D{D}_dx0.4_dt0.5.json' for case in ['open','shelf_w8_e0p2'] for D in [5,10,20]]
 if not all(p.exists() for p in paths):return None
 results=[json.loads(p.read_text()) for p in paths];r=next(r for r in results if r['case']=='shelf_w8_e0p2' and r['Dgas_mm2_s']==10)
 data=np.genfromtxt(base/(r['tag']+'.csv'),delimiter=',',names=True);colors=[TEAL,BLUE,GOLD,'#b24c65'];im=Image.new('RGB',(1850,840),BG);d=ImageDraw.Draw(im);d.text((55,25),'Gas delivery',font=font(37,True),fill=TEXT)
 series=[(w,data['time_s'],data[w+'_near_liquid'],c) for w,c in zip(['NE','NW','SW','SE'],colors)];linepanel(d,(115,180,700,510),series,'Time [s]','C / Cin','A  Selected shelf',300,1)
 series=[]
 for case,name,col in [('open','Open',BLUE),('shelf_w8_e0p2','Selected shelf',TEAL)]:
  rr=[q for q in results if q['case']==case];series.append((name,[q['Dgas_mm2_s'] for q in rr],[max(q['t90_s'][w+'_near_liquid'] for w in ['NE','NW','SW','SE']) for q in rr],col))
 ymax=math.ceil(max(max(q[2]) for q in series)/50)*50;linepanel(d,(1080,180,650,510),series,'Dgas [mm²/s]','Worst-well t90 [s]','B  Diffusivity sensitivity',20,ymax);im.save(OUT/'gas_delivery.png',dpi=(300,300))
 checks=[json.loads(p.read_text()) for p in base.glob('*.json') if p.name!='analytic_benchmark.json'];summary=dict(gas_scalar_solves=len(checks),conditions=results,max_relative_global_mass_residual=max(q['relative_global_mass_residual'] for q in checks),max_uniform_field_operator_residual=max(q['uniform_field_operator_residual_relative'] for q in checks),concentration_bounds=[min(q['concentration_min'] for q in checks),max(q['concentration_max'] for q in checks)],scope='Gas-only species delivery; no liquid uptake or cell arrival. Local low Pe permits diffusion even when velocity markers barely move.')
 for label,tag in [('mesh','shelf_w8_e0p2_D10_dx0.3_dt0.5'),('time','shelf_w8_e0p2_D10_dx0.4_dt0.25')]:
  p=base/(tag+'.json')
  if p.exists():q=json.loads(p.read_text());summary[label+'_NE_near_liquid_t90_relative_change']=q['t90_s']['NE_near_liquid']/r['t90_s']['NE_near_liquid']-1
 (P/'gas_transport_summary.json').write_text(json.dumps(summary,indent=2));return summary
if __name__=='__main__':holes();transport()
