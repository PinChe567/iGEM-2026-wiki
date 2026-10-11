from pathlib import Path
import numpy as np,json,struct,shutil,hashlib

DT=np.dtype([('normal','<f4',3),('v','<f4',(3,3)),('attr','<u2')])

def read(p):
 b=p.read_bytes();n=struct.unpack_from('<I',b,80)[0];assert len(b)==84+50*n
 ts=np.frombuffer(b,dtype=DT,offset=84,count=n)['v'].astype(float)
 assert np.isfinite(ts).all()
 area=np.linalg.norm(np.cross(ts[:,1]-ts[:,0],ts[:,2]-ts[:,0]),axis=1)
 ts=ts[area>1e-10]
 v,inv=np.unique(ts.reshape(-1,3),axis=0,return_inverse=True);f=inv.reshape(-1,3)
 # OpenSCAD binary export sometimes inserts collinear zero-area triangles.
 # Removing them exposes T-junctions on the SAME straight edge. Split those
 # edges at existing vertices; never fill a spatial hole or move a surface.
 for iteration in range(20):
  ee=np.sort(np.vstack([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1);uu,cc=np.unique(ee,axis=0,return_counts=True)
  boundary=uu[cc==1]
  if len(boundary)==0:break
  candidates=np.unique(boundary);change=False
  for a,b in boundary:
   d=v[b]-v[a];ll=np.dot(d,d)
   for q in candidates:
    if q==a or q==b:continue
    t=np.dot(v[q]-v[a],d)/ll
    if 1e-8<t<1-1e-8 and np.linalg.norm(v[q]-v[a]-t*d)<1e-7:
     fi=np.flatnonzero(np.any(f==a,axis=1)&np.any(f==b,axis=1))[0];tri=f[fi]
     for j in range(3):
      if {tri[j],tri[(j+1)%3]}=={a,b}:
       aa,bb,other=tri[j],tri[(j+1)%3],tri[(j+2)%3];break
     f=np.concatenate([np.delete(f,fi,axis=0),[[aa,q,other],[q,bb,other]]]);change=True;break
   if change:break
  if not change:break
 ts=v[f]
 e=np.sort(np.vstack([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1);u,c=np.unique(e,axis=0,return_counts=True)
 assert np.all(c==2),(str(p),'edge counts',np.unique(c,return_counts=True))
 vol=np.einsum('ij,ij->i',ts[:,0],np.cross(ts[:,1],ts[:,2])).sum()/6;assert vol>0
 return v,f,vol,n-int(np.sum(area>1e-10))

def write(path,v,f):
 tri=v[f].astype(np.float32);area=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1);tri=tri[area>1e-10];area=area[area>1e-10]
 data=np.zeros(len(tri),DT);data['v']=tri;data['normal']=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])/area[:,None]
 path.write_bytes(b'AeroSense  mm; prototype'.ljust(80,b' ')+struct.pack('<I',len(tri))+data.tobytes())

