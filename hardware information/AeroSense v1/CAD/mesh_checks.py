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
 e=np.sort(np.vstack([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1);u,c=np.unique(e,axis=0,return_counts=True)
 assert np.all(c==2),(str(p),'edge counts',np.unique(c,return_counts=True))
 vol=np.einsum('ij,ij->i',ts[:,0],np.cross(ts[:,1],ts[:,2])).sum()/6;assert vol>0
 return v,f,vol,n-len(f)

def write(path,v,f):
 tri=v[f].astype(np.float32);area=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1);tri=tri[area>1e-10];area=area[area>1e-10]
 data=np.zeros(len(tri),DT);data['v']=tri;data['normal']=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])/area[:,None]
 path.write_bytes(b'AeroSense  mm; prototype'.ljust(80,b' ')+struct.pack('<I',len(tri))+data.tobytes())

