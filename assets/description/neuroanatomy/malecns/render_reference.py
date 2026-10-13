"""Render a static atlas reference from local, sourced MaleCNS geometry.

Run: python render_reference.py
Dependencies: numpy, matplotlib, pillow. No network calls or microscopy edits.
SWC centerline coordinates and parent edges are used unchanged (8 nm -> um).
NPZ surfaces are offline-decimated source meshes; see provenance.json.
"""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import to_rgb
from mpl_toolkits.mplot3d.art3d import Poly3DCollection, Line3DCollection
from mpl_toolkits.mplot3d import proj3d
from PIL import Image

P=Path(__file__).resolve().parent
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12,'text.color':'#203c34'})
rows=json.loads((P/'selected-neurons.json').read_text())
meshes=json.loads((P/'geometry-manifest.json').read_text())
colors={'ALPN':'#247458','DAN':'#b77819','MBON':'#8260a1','Kenyon_Cell':'#7a8d86'}
def display(v):
    return np.column_stack((v[:,0],v[:,2],-v[:,1]))

geo={}
for m in meshes:
    z=np.load(P/m['file']);geo[m['name']]=(display(z['vertices']),z['faces'])
neurons=[]
for r in rows:
    swc=np.loadtxt(P/'source'/f"{r['bodyId']}.swc")
    pts=display(swc[:,2:5]*0.008)
    indexes={int(node):i for i,node in enumerate(swc[:,0])}
    # Reject a missing parent, rather than inventing geometry.
    edges=[(i,indexes[int(parent)]) for i,parent in enumerate(swc[:,6]) if int(parent)>=0]
    neurons.append((r,pts[np.array(edges)],pts))

def surface(ax,name,alpha,color='#9aaba3'):
    vertices,faces=geo[name]
    tris=vertices[faces]
    normal=np.cross(tris[:,1]-tris[:,0],tris[:,2]-tris[:,0])
    normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-10)
    light=np.array([-.3,-.5,.8]);light/=np.linalg.norm(light)
    shade=.70+.30*np.abs(normal@light)
    rgb=np.array(to_rgb(color))
    fc=np.column_stack([np.clip(rgb[None,:]*shade[:,None],0,1),np.full(len(faces),alpha)])
    ax.add_collection3d(Poly3DCollection(tris,facecolors=fc,edgecolors='none',linewidths=0,rasterized=True))

def scene(ax,full=False):
    if full:surface(ax,'brain-shell.ngmesh',.050,'#aab7b1')
    for name in geo:
        if name=='brain-shell.ngmesh':continue
        if '(L)' in name and not full:continue
        alpha=.06 if full else .055
        if name.startswith('upper-AL'):alpha=.10
        surface(ax,name,alpha)
    # Geometry is retained; neuron color is an editorial encoding of source class.
    for r,segments,pts in sorted(neurons,key=lambda x:x[0]['class']!='Kenyon_Cell'):
        cls=r['class'];lw=.35 if cls=='Kenyon_Cell' else .75
        ax.add_collection3d(Line3DCollection(segments,colors=colors[cls],linewidths=lw*(.72 if full else 1),alpha=.40 if cls=='Kenyon_Cell' else .94,rasterized=True))
    if full:
        ax.set(xlim=(0,765),ylim=(65,425),zlim=(-450,-20));ax.set_box_aspect((765,360,430))
    else:
        ax.set(xlim=(170,400),ylim=(70,310),zlim=(-290,-35));ax.set_box_aspect((230,240,255))
    ax.view_init(elev=19,azim=-75)
    ax.set_proj_type('ortho')
    ax.set_axis_off();ax.set_facecolor('white')

fig=plt.figure(figsize=(16,9.5),dpi=160,facecolor='white')
left=fig.add_axes([-.03,.20,.51,.65],projection='3d',computed_zorder=False)
right=fig.add_axes([.39,.13,.64,.79],projection='3d',computed_zorder=False)
scene(left,True);scene(right,False)
fig.text(.055,.935,'A real brain, reconstructed.',fontsize=25,weight='bold')
fig.text(.056,.898,'SELECTED OLFACTORY + MUSHROOM-BODY ANATOMY  /  MALECNS v1.0',fontsize=10,color='#5a7065')
fig.text(.075,.785,'Whole-brain context',fontsize=13,weight='bold')
fig.text(.60,.84,'Selected neuron detail',fontsize=13,weight='bold')

def label(ax,name,text,offset):
    v,f=geo[name];point=v.mean(axis=0)
    x,y,z=proj3d.proj_transform(*point,ax.get_proj())
    ax.annotate(text,(x,y),xytext=offset,textcoords='offset points',fontsize=11,
                ha='left' if offset[0]>=0 else 'right',va='center',color='#334c41',
                arrowprops={'arrowstyle':'-','color':'#82988c','lw':.8},
                bbox={'boxstyle':'round,pad=.18','fc':'white','ec':'none','alpha':.92})

label(right,'upper-AL(R).ngmesh','Antennal lobe\nAL(R)',(-65,-20))
label(right,'CA(R).ngmesh','Mushroom-body calyx\nCA(R)',(38,39))
label(right,'LH(R).ngmesh','Lateral horn\nLH(R)',(-59,42))
label(right,'gL(R).ngmesh','MB lobes\nγ lobe shown here',(70,-32))

legend=[('ALPN','Projection neurons','DM1 + VA1d  ·  4 cells'),('DAN','Dopaminergic neurons','PPL101 + PPL103  ·  2 cells'),('MBON','Mushroom-body output','MBON11 + MBON12  ·  3 cells'),('Kenyon_Cell','Kenyon cells','KCg-m  ·  15 selected cells')]
for i,(cls,title,sub) in enumerate(legend):
    x=.055+i*.24
    fig.add_artist(plt.Line2D([x,x+.024],[.158,.158],transform=fig.transFigure,color=colors[cls],lw=3))
    fig.text(x,.121,title,fontsize=11,weight='bold')
    fig.text(x,.092,sub,fontsize=9,color='#53675d')
fig.text(.055,.048,'EM-derived centerlines + neuropil surfaces. Colors show cell classes; gray surfaces locate brain regions.',fontsize=9,color='#53675d')
fig.text(.055,.025,'Not a TH/GH146 expression map, not our fly specimen, and not a claim of synapses between the selected cells.',fontsize=9,color='#53675d')
fig.savefig(P/'fly-brain-reconstruction.png',dpi=160,facecolor='white')
plt.close(fig)
with Image.open(P/'fly-brain-reconstruction.png') as im:
    im.convert('RGB').save(P/'fly-brain-reconstruction.webp','WEBP',quality=88,method=6)
print(json.dumps({'webp_bytes':(P/'fly-brain-reconstruction.webp').stat().st_size,'png_bytes':(P/'fly-brain-reconstruction.png').stat().st_size,'pixels':[2560,1520],'neuron_count':len(rows),'edge_count':sum(len(n[1]) for n in neurons)}))
