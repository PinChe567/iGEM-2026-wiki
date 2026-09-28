from pathlib import Path
import sys,math,json
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]; IMG=ROOT/'images';IMG.mkdir(exist_ok=True)
CACHE=Path('work/geometry_cache')
FONT='C:/Windows/Fonts/msjh.ttc'
def font(s): return ImageFont.truetype(FONT,s)
def geo(n):
 import struct
 p=ROOT/'assembly_coordinates'/(n+'.stl')
 if n=='cap_cutaway_REFERENCE_ONLY':p=ROOT/'validation'/(n+'.stl')
 b=p.read_bytes();nn=struct.unpack_from('<I',b,80)[0]
 dt=np.dtype([('normal','<f4',3),('v','<f4',(3,3)),('attr','<u2')]);ts=np.frombuffer(b,dtype=dt,count=nn,offset=84)['v'].astype(float)
 v,iv=np.unique(ts.reshape(-1,3),axis=0,return_inverse=True)
 return v,iv.reshape(-1,3)

def boxgeo(dim,pos):
 x,y,z=dim;xx,yy,zz=pos
 v=np.array([[i*x/2+xx,j*y/2+yy,k*z+zz] for k in [0,1] for j in [-1,1] for i in [-1,1]])
 f=np.array([[0,2,3],[0,3,1],[4,5,7],[4,7,6],[0,1,5],[0,5,4],[2,6,7],[2,7,3],[0,4,6],[0,6,2],[1,3,7],[1,7,5]])
 return v,f
def render(items,size=(1100,1000),zoom=None,az=-38,el=27,center=(0,0,65)):
 im=Image.new('RGB',size,'#f6f7f9');dr=ImageDraw.Draw(im)
 az,el=map(math.radians,[az,el])
 R=np.array([[math.cos(az),-math.sin(az),0],[math.sin(az)*math.sin(el),math.cos(az)*math.sin(el),-math.cos(el)],[math.sin(az)*math.cos(el),math.cos(az)*math.cos(el),math.sin(el)]])
 allv=[];rows=[]
 for item in items:
  if isinstance(item[0],str): v,f=geo(item[0])
  else:v,f=item[0]
  v=v+np.array(item[2]);q=(v-np.array(center))@R.T;allv.append(q)
  tris=q[f]
  norms=np.cross(tris[:,1]-tris[:,0],tris[:,2]-tris[:,0]);norms=norms/(np.linalg.norm(norms,axis=1)[:,None]+1e-12)
  light=np.array([-.4,-.5,1]);light/=np.linalg.norm(light)
  shade=np.clip(.68+.30*(norms@light),.3,.98)
  for t,s in zip(tris,shade): rows.append((t[:,2].mean(),t,tuple(int(c*s) for c in item[1])))
 av=np.vstack(allv);mi=av[:,:2].min(0);ma=av[:,:2].max(0)
 scale=zoom or min((size[0]-70)/(ma[0]-mi[0]),(size[1]-70)/(ma[1]-mi[1]))
 midpoint=(mi+ma)/2
 pixels=np.array(im); depth=np.full((size[1],size[0]),-np.inf,dtype=np.float32)
 for _,t,col in rows:
  p=(t[:,:2]-midpoint)*scale+np.array(size)/2
  x0=max(0,int(np.floor(p[:,0].min())));x1=min(size[0]-1,int(np.ceil(p[:,0].max())))
  y0=max(0,int(np.floor(p[:,1].min())));y1=min(size[1]-1,int(np.ceil(p[:,1].max())))
  if x1<x0 or y1<y0:continue
  den=(p[1,1]-p[2,1])*(p[0,0]-p[2,0])+(p[2,0]-p[1,0])*(p[0,1]-p[2,1])
  if abs(den)<1e-8:continue
  xx,yy=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
  a=((p[1,1]-p[2,1])*(xx-p[2,0])+(p[2,0]-p[1,0])*(yy-p[2,1]))/den
  b=((p[2,1]-p[0,1])*(xx-p[2,0])+(p[0,0]-p[2,0])*(yy-p[2,1]))/den
  c=1-a-b; zz=a*t[0,2]+b*t[1,2]+c*t[2,2]
  region=depth[y0:y1+1,x0:x1+1];mask=(a>=-1e-7)&(b>=-1e-7)&(c>=-1e-7)&(zz>region)
  region[mask]=zz[mask];pixels[y0:y1+1,x0:x1+1][mask]=col
 im=Image.fromarray(pixels)
 return im

