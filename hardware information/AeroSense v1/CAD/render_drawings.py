from pathlib import Path
import sys,json,shutil,re,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'CAD'))
from mesh_checks import read,write
from render_core import render,boxgeo
def font(s):
 for p in ['C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
  try:return ImageFont.truetype(p,s)
  except OSError:pass
 return ImageFont.load_default()
M=json.loads((R/'CAD/parts.json').read_text());W=R/'CAD/assembly_coordinates';W.mkdir(exist_ok=True);I=R/'results/images';items=[];checks=[]
for name,m in M.items():
 v,f,vol,deg=read(R/'STL'/(name+'.stl'));v+=np.array(m['original_min'])
 for k in list(m):
  if k.startswith('changed_in'):del m[k]
 m['note']='Nominal geometry, mm. Verify against vendor populated-board STEP and printed coupons.';m['sha256']=hashlib.sha256((R/'STL'/(name+'.stl')).read_bytes()).hexdigest();m['triangles']=len(f)
 col=(70,151,175) if name.startswith('05') else (73,89,106);items.append(((v,f),col,(0,0,0)))
 checks.append(dict(file=name+'.stl',volume_mm3=vol,closed_two_faces_per_edge=True,triangles=len(f),one_piece_expected=True))
 im=Image.new('RGB',(1200,1030),'white');d=ImageDraw.Draw(im);d.text((25,12),name,font=font(26),fill='#17384b')
 for j,(label,az,el) in enumerate([('TOP',0,90),('FRONT',0,0),('RIGHT',90,0),('ISOMETRIC',-35,28)]):
  x=j%2*600;y=j//2*485+60;im.paste(render([((v,f),col,(0,0,0))],(570,385),az=az,el=el),(x+15,y+35));d.text((x+20,y),label,font=font(22),fill='#17384b')
  a,b=[(0,1),(0,2),(1,2),(0,1)][j];d.text((x+20,y+426),f"{'XYZ'[a]} {m['size_mm'][a]:.2f} | {'XYZ'[b]} {m['size_mm'][b]:.2f} mm",font=font(20),fill='#17384b')
 im.save(I/(name+'_drawing.png'))

exploded=[]
for name,item in zip(M,items):
 shift=0 if name.startswith('02') else 30 if name.startswith('01') else 115 if name.startswith('03') else 90 if name.startswith('04') else 55
 exploded.append((item[0],item[1],(0,0,shift)))
pcb=boxgeo((100,90,1.6),(0,0,38));exploded.append((pcb,(41,133,96),(0,0,10)))
im=render(exploded,(1300,1350),az=-35,el=20);ImageDraw.Draw(im).text((30,20),'AeroSense | exploded assembly (illustrative spacing)',font=font(28),fill='#17384b');im.save(I/'assembly_exploded.png')
im=render([items[0],items[1],items[2]],(1100,850),az=-35,el=26);im.save(I/'assembly_closed.png')
# Datum drawing based on audited manufacturer optical-center dimension and provisional PCB PDF registration.
im=Image.new('RGB',(1200,880),'white');d=ImageDraw.Draw(im);d.text((30,20),'LED registration and PD optical center | mm',font=font(30),fill='#17384b')
def xy(x,y):return (520+x*49,450-y*49)
def rect(x,y,w,h,col):d.rectangle((*xy(x-w/2,y+h/2),*xy(x+w/2,y-h/2)),outline=col,width=3)
rect(0,0,4,5,'#355668');rect(0,-.4,3,2.5,'#168d99');d.ellipse((*xy(-.07,-.33),*xy(.07,-.47)),fill='red')
for q,sx,sy,led in [('NE',1,1,'D3'),('NW',-1,1,'D4'),('SW',-1,-1,'D1'),('SE',1,-1,'D2')]:
 rect(sx*3.3,sy*5.7,3.6,1.4,'#b57930');rect(sx*3.3,sy*2.65,4.7,3.4,'#507daa');x,y=xy(sx*3.3,sy*2.65);d.text((x-30,y-13),q,font=font(20),fill='#17384b');x,y=xy(sx*3.3,sy*5.7);d.text((x-18,y-13),led,font=font(20),fill='#17384b')
for j,t in enumerate(['LED centers: (+/-3.3, +/-5.7)','Well liquid centers: (+/-3.3, +/-2.65)','PD package datum: (0,0)','PD optical center: (0,-0.4) provisional rotation','Sensitive rectangle 3 x 2.5 is an area proxy','Confirm bottom-view mirroring and pad polarity']):d.text((35,720+j*24),t,font=font(20),fill='#17384b')
im.save(I/'optical_registration.png')
