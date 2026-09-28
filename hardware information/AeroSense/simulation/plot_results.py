"""Render raw simulation fields without fitting a synthetic halo or peak normalization.
Pillow rendering is used because matplotlib is unavailable in this environment.
The color field uses nearest-neighbour cells; contours use linear interpolation only.
"""
from pathlib import Path
import numpy as np,json,csv,math
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;IMG=HERE.parent/'results/images';IMG.mkdir(exist_ok=True)

def font(n):
 for name in ['C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
  try:return ImageFont.truetype(name,n)
  except OSError:pass
 return ImageFont.load_default()

def jet(t):
 t=np.asarray(t);r=np.clip(1.5-abs(4*t-3),0,1);g=np.clip(1.5-abs(4*t-2),0,1);b=np.clip(1.5-abs(4*t-1),0,1)
 return np.stack([r,g,b],-1)

def panel(im,offset,title,data,rs,zs,vmin,vmax,unit,contours=(),note='',material=None):
 ox,oy=offset;d=ImageDraw.Draw(im);x0=ox+85;y0=oy+90;pw=430;ph=570
 d.text((ox+25,oy+12),title,font=font(26),fill='#172d3d')
 arr=np.flipud(data.T);finite=np.isfinite(arr);norm=(np.log10(np.maximum(arr,vmin))-math.log10(vmin))/math.log10(vmax/vmin)
 rgb=np.uint8(jet(np.nan_to_num(np.clip(norm,0,1)))*255);rgb[~finite]=[30,33,39];rgb[finite&(arr<=0)]=[255,255,255]
 if material is not None:
  mm=np.flipud(material.T);rgb[(mm==1)&~finite]=[98,105,114];rgb[(mm==4)&~finite]=[62,83,153]
 bm=Image.fromarray(rgb).resize((pw,ph),Image.Resampling.NEAREST);im.paste(bm,(x0,y0))
 redges=[rs[0]-(rs[1]-rs[0])/2,rs[-1]+(rs[1]-rs[0])/2];zedges=[zs[0]-(zs[1]-zs[0])/2-39.6,zs[-1]+(zs[1]-zs[0])/2-39.6]
 def px(r):return x0+(r-redges[0])/(redges[1]-redges[0])*pw
 def py(z):return y0+ph-(z-39.6-zedges[0])/(zedges[1]-zedges[0])*ph
 # Approximate component envelopes at the PCB, not fictitious light sources.
 d.rectangle((max(x0,px(-1.73)),py(40.5),px(1.73),py(39.6)),fill='#327563')
 d.text((px(-.45),py(40.25)),'PD',font=font(18),fill='white')
 d.rectangle((px(5.78),py(41.3),min(x0+pw,px(7.39)),py(39.6)),fill='#9d612c')
 d.text((px(5.86),py(40.7)),'LED',font=font(18),fill='white')
 # Marching-squares contours. NaN cells are never bridged.
 for level in contours:
  for i in range(len(rs)-1):
   for j in range(len(zs)-1):
    vals=[data[i,j],data[i+1,j],data[i+1,j+1],data[i,j+1]]
    if not np.all(np.isfinite(vals)):continue
    corners=[(rs[i],zs[j]),(rs[i+1],zs[j]),(rs[i+1],zs[j+1]),(rs[i],zs[j+1])];pts=[]
    for a,b in [(0,1),(1,2),(2,3),(3,0)]:
     va,vb=vals[a],vals[b]
     if (va<level)!=(vb<level):
      t=(level-va)/(vb-va);x=corners[a][0]*(1-t)+corners[b][0]*t;z=corners[a][1]*(1-t)+corners[b][1]*t;pts.append((px(x),py(z)))
    for k in range(0,len(pts)-1,2):d.line([pts[k],pts[k+1]],fill='white',width=2)
 d.rectangle((x0,y0,x0+pw,y0+ph),outline='#334155',width=2)
 for r in [0,2,4,6]:
  x=px(r);d.line((x,y0+ph,x,y0+ph+8),fill='black',width=2);d.text((x-7,y0+ph+13),str(r),font=font(21),fill='black')
 for z in [0,2,4,6,8,10,12]:
  y=py(z+39.6)
  if y0<=y<=y0+ph:d.line((x0-8,y,x0,y),fill='black',width=2);d.text((x0-39,y-12),str(z),font=font(21),fill='black')
 d.text((x0+135,y0+ph+46),'Radial r (mm)',font=font(23),fill='black')
 d.text((ox+15,oy+53),'Z above PCB (mm)',font=font(21),fill='black')
 bar=np.uint8(jet(np.linspace(1,0,ph))*255);im.paste(Image.fromarray(bar[:,None,:]).resize((22,ph)),(x0+pw+20,y0))
 lo=math.floor(math.log10(vmin));hi=math.ceil(math.log10(vmax))
 for val in range(lo,hi+1):
  yy=y0+(math.log10(vmax)-val)/math.log10(vmax/vmin)*ph
  if y0-1<=yy<=y0+ph+1:d.text((x0+pw+49,yy-12),f'1e{val}',font=font(19),fill='black')
 d.text((x0+pw+12,y0-30),unit,font=font(18),fill='black')
 d.text((ox+25,oy+745),note,font=font(19),fill='#405366')

def optical():
 A=np.load(HERE/'acceptance_map.npz');F=np.load(HERE/'fluence_3D.npz');eta=A['eta'];xyz=A['xyz_mm'];shape=eta.shape
 ix=tuple(np.searchsorted(F[k],xyz[:,i],side='right')-1 for i,k in enumerate(['x_mm','y_mm','z_mm']))
 H=F['emission_fluence_uW_mm2'][ix].reshape(shape);EX=F['excitation_fluence_uW_mm2'][ix].reshape(shape);HS=F['emission_SE_uW_mm2'][ix].reshape(shape)
 H[~np.isfinite(eta)]=np.nan;EX[~np.isfinite(eta)]=np.nan;J=H*eta
 # Independent MC acceptance versus fluorescence stages; first-order SE propagation.
 JS=np.sqrt((H*A['SE'])**2+(eta*HS)**2)
 rows=[]
 for i,r in enumerate(A['r_mm']):
  for j,z in enumerate(A['z_mm']):
   if np.isfinite(eta[i,j]):rows.append([r,z-39.6,eta[i,j],A['SE'][i,j],int(A['detected_packets'][i,j]),EX[i,j],H[i,j],HS[i,j],J[i,j],JS[i,j]])
 with (HERE/'spatial_map_values.csv').open('w',newline='') as f:
  w=csv.writer(f);w.writerow(['radial_r_mm','z_above_PCB_mm','eta','eta_SE','detected_packets','Phi_ex_uW_mm2','Phi_em_uW_mm2','Phi_em_SE','J_uW_mm2','J_SE_first_order']);w.writerows(rows)
 for fname,plots in [('paper_I_J_correspondence.png',[("I-type: PD acceptance",eta*100,.001,10.,'%',(.1,1.),'White contours: 0.1% and 1% if present'),("J-type: Phi_em x acceptance",J,1e-6,1e-2,'uW/mm2',(),'Product follows paper; not source density')]),('fluence_maps.png',[("Excitation scalar fluence rate",EX,1e-3,1e2,'uW/mm2',(),'NE LED on; P_LED = 500 uW assumed'),("H-type: emission scalar fluence rate",H,1e-5,1.,'uW/mm2',(),'QY = 1 assumed; not measured GCaMP output')])]:
  im=Image.new('RGB',(1400,1000),'white');d=ImageDraw.Draw(im)
  d.text((30,20),'AeroSense  | spatial Monte Carlo | conditional model',font=font(30),fill='#172d3d')
  for k,(title,data,mi,ma,unit,cont,nt) in enumerate(plots):panel(im,(k*700,90),title,data,A['r_mm'],A['z_mm'],mi,ma,unit,cont,nt,A['material'])
  d.text((35,905),'Section: through PD package datum and NE LED. Dark = outside liquid source domain.',font=font(24),fill='#35495b')
  d.text((35,940),'Raw MC cells; log scale; no peak normalization. Sampling precision is reported in map_summary.json.',font=font(21),fill='#a4452b')
  d.text((35,972),'Gray: resin. Blue: filter. Component envelopes assumed; CSV contains full values and sampling SE.',font=font(20),fill='#35495b')
  im.save(IMG/fname)
 rel=A['SE']/np.maximum(eta,1e-300);valid=np.isfinite(eta);hrel=HS/np.maximum(H,1e-300)
 summary=dict(max_eta=float(np.nanmax(eta)),max_J_uW_mm2=float(np.nanmax(J)),max_Phi_em_uW_mm2=float(np.nanmax(H)),median_eta_relative_SE=float(np.nanmedian(rel)),eta_points_relative_SE_over_25_percent=int(np.sum((rel>.25)&valid)),em_field_points_relative_SE_over_25_percent=int(np.sum((hrel>.25)&valid)),zero_em_field_points=int(np.sum((H==0)&valid)),valid_points=int(valid.sum()),J_definition='Phi_em(r)*eta(r), as paper Fig 2J; not a volumetric source contribution integral',uncertainty='SE covers MC sampling only; three fluorescence replicates are a limited precision estimate. Unknown material and biological parameters not covered.')
 (HERE/'map_summary.json').write_text(json.dumps(summary,indent=2));print(summary)

if __name__=='__main__':optical()
