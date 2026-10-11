"""Recreate publication figures from CSVs using NumPy/Pillow; no embedded data.
Labels are intentionally short. Full assumptions belong in figure_notes/.
"""
from pathlib import Path
import csv,math,json
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from model import slab_bottom
R=Path(__file__).resolve().parent;O=R/'figures';O.mkdir(exist_ok=True)
COL=['#0072B2','#D55E00','#009E73','#CC79A7','#333333'];INK='#202a31'
def font(n):
    for p in ['C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','DejaVuSans.ttf']:
        try:return ImageFont.truetype(p,n)
        except OSError:pass
    return ImageFont.load_default(size=n)
def rows(n):return list(csv.DictReader((R/'results'/(n+'.csv')).open(encoding='utf-8-sig')))
def canvas():return Image.new('RGB',(1800,1040),'white')
def text(im,p,s,n=27,anchor='lt',fill=INK):ImageDraw.Draw(im).text(p,s,font=font(n),fill=fill,anchor=anchor)
def axis(im,box,xlim,ylim,xt,yt,xlabel,ylabel,letter='',logx=False,logy=False):
    l,t,r,b=box;d=ImageDraw.Draw(im)
    def f(v,lim,log):
        if log:v=math.log10(max(v,1e-300));lim=tuple(math.log10(q) for q in lim)
        return (v-lim[0])/(lim[1]-lim[0])
    def xy(x,y):return l+f(x,xlim,logx)*(r-l),b-f(y,ylim,logy)*(b-t)
    d.line([(l,t),(l,b),(r,b)],fill=INK,width=3)
    for x,s in xt:
        px,_=xy(x,ylim[0]);d.line([(px,b),(px,b+9)],fill=INK,width=2);text(im,(px,b+17),s,25,'mt')
    for y,s in yt:
        _,py=xy(xlim[0],y);d.line([(l-9,py),(l,py)],fill=INK,width=2);text(im,(l-15,py),s,25,'rm')
        if y!=ylim[0]:d.line([(l+1,py),(r,py)],fill='#e7ebed',width=1)
    text(im,((l+r)/2,b+67),xlabel,29,'mt')
    lab=Image.new('RGBA',(700,42),(255,255,255,0));ImageDraw.Draw(lab).text((350,21),ylabel,font=font(27),fill=INK,anchor='mm');lab=lab.rotate(90,expand=True)
    im.paste(lab,(4 if l<900 else int(l-160),int((t+b)/2-350)),lab)
    text(im,(l-28,t-57),letter,38)
    return xy
def line(im,xy,x,y,c,width=4,mark=False):
    p=[xy(float(a),float(b)) for a,b in zip(x,y) if np.isfinite(a) and np.isfinite(b)]
    if len(p)>1:ImageDraw.Draw(im).line(p,fill=c,width=width)
    if mark:
        for a,b in p:ImageDraw.Draw(im).ellipse((a-6,b-6,a+6,b+6),fill=c)
def legend(im,p,items):
    d=ImageDraw.Draw(im)
    for j,(label,c) in enumerate(items):
        x,y=p[0],p[1]+j*36;d.line([(x,y+12),(x+35,y+12)],fill=c,width=4);text(im,(x+48,y),label,25)
def save(im,n):im.save(O/(n+'.png'),dpi=(300,300))
BOX1=(140,130,820,860);BOX2=(1070,130,1750,860)
def main():
    im=canvas();xy=axis(im,BOX1,(0,48),(0,1),[(v,str(v)) for v in [0,12,24,36,48]],[(v,str(v)) for v in [0,.25,.5,.75,1]],'Time (h)','Bottom / surface concentration','A')
    t=np.linspace(.001,48*3600,500)
    for j,D in enumerate([.5e-9,1e-9,2e-9]):line(im,xy,t/3600,slab_bottom(t,100/11.2*1e-3,D),COL[j])
    legend(im,(430,640),[('D = 0.5 x 10^-9 m²/s',COL[0]),('D = 1 x 10^-9 m²/s',COL[1]),('D = 2 x 10^-9 m²/s',COL[2])])
    xy=axis(im,BOX2,(0,5),(0,1),[(v,str(v)) for v in [0,1,2,3,4,5]],[(v,str(v)) for v in [0,.25,.5,.75,1]],'Time (s)','Gas-bottom / rim concentration','B')
    t=np.linspace(.0001,5,500);line(im,xy,t,slab_bottom(t,3.571428571e-3,1e-5),COL[0]);text(im,(1120,700),'Zero gas velocity',26);text(im,(1120,740),'D = 10^-5 m²/s',26)
    save(im,'01_gas_and_liquid_times')
    im=canvas();xy=axis(im,BOX1,(0,125),(0,75),[(v,str(v)) for v in [0,25,50,75,100,125]],[(v,str(v)) for v in [0,15,30,45,60,75]],'Fill volume (µL)','Bottom t90 (h)','A')
    rs=rows('liquid_depth_sweep')
    for j,D in enumerate([.5e-9,1e-9,2e-9]):
        a=[r for r in rs if float(r['D_liquid_m2_s'])==D];line(im,xy,[float(r['liquid_uL']) for r in a],[float(r['t90_s'])/3600 for r in a],COL[j],mark=True)
    legend(im,(160,150),[('D = 0.5 x 10^-9',COL[0]),('D = 1 x 10^-9',COL[1]),('D = 2 x 10^-9',COL[2])])
    xy=axis(im,BOX2,(1,100),(.1,100),[(v,str(v)) for v in [1,10,100]],[(v,str(v)) for v in [.1,1,10,100]],'Effective D / molecular D','Bottom t90 (h)','B',True,True)
    rs=rows('mixing_feed_sensitivity')
    for j,L in enumerate([0,100]):
        a=[r for r in rs if float(r['K_liquid_gas'])==10 and float(r['thickness_um'])==L and r['feed_mL_min']=='ideal_step']
        line(im,xy,[1,10,100],[float(r['t90_s'])/3600 for r in a],COL[j],mark=True)
    legend(im,(1110,170),[('No membrane',COL[0]),('PDMS 100 µm',COL[1])]);save(im,'02_depth_and_mixing')
    im=canvas();xy=axis(im,BOX1,(25,500),(.01,1e5),[(v,str(v)) for v in [25,50,100,250,500]],[(10.**v,f'10^{v}') for v in [-2,-1,0,1,2,3,4,5]],'PDMS thickness (µm)','Bulk time lag (s)','A',True,True)
    rs=rows('intrinsic_properties')
    for j,D in enumerate([1e-12,1e-11,1e-10,1e-9]):
        a=[r for r in rs if float(r['D_PDMS_m2_s'])==D and float(r['K_PDMS_gas'])==100]
        line(im,xy,[float(r['thickness_um']) for r in a],[float(r['lag_s']) for r in a],COL[j],mark=True)
    legend(im,(170,150),[(f'D = 10^-{12-j} m²/s',COL[j]) for j in range(4)])
    xy=axis(im,BOX2,(25,500),(1e-7,.01),[(v,str(v)) for v in [25,50,100,250,500]],[(10.**v,f'10^{v}') for v in [-7,-6,-5,-4,-3,-2]],'PDMS thickness (µm)','Bulk permeance (m/s)','B',True,True)
    for j,K in enumerate([1,10,100,1000]):
        a=[r for r in rs if float(r['D_PDMS_m2_s'])==1e-10 and float(r['K_PDMS_gas'])==K]
        line(im,xy,[float(r['thickness_um']) for r in a],[float(r['permeance_m_s']) for r in a],COL[j],mark=True)
    legend(im,(1100,700),[(f'K = {K}',COL[j]) for j,K in enumerate([1,10,100,1000])]);save(im,'03_intrinsic_PDMS')
    im=canvas();rs=rows('membrane_sweep');d=ImageDraw.Draw(im)
    for panel,K in enumerate([1,100]):
        l=180+panel*860;t=190;cw=128;ch=135
        text(im,(l-35,100),('A' if panel==0 else 'B')+f'   K = {K}',36)
        for i,D in enumerate([1e-12,1e-11,1e-10,1e-9]):
            text(im,(l-20,t+(i+.5)*ch),f'10^-{12-i}',27,'rm')
            for j,L in enumerate([25,50,100,250,500]):
                row=next(r for r in rs if float(r['thickness_um'])==L and float(r['D_PDMS_m2_s'] or 0)==D and float(r['K_PDMS_gas'] or 0)==K and float(r['K_liquid_gas'])==10)
                v=float(row['t90_s'])/3600 if row['t90_s'] else None
                if v is None:c='#d9d9d9';s='>168'
                else:
                    f=min(1,max(0,(v-22.8)/(168-22.8)));c=tuple(int(a+(b-a)*f) for a,b in zip((225,242,248),(0,95,140)));s=f'{v:.1f}'
                d.rectangle((l+j*cw,t+i*ch,l+(j+1)*cw-2,t+(i+1)*ch-2),fill=c)
                text(im,(l+(j+.5)*cw,t+(i+.5)*ch),s,30,'mm',fill='white' if v is not None and v>90 else INK)
        for j,L in enumerate([25,50,100,250,500]):text(im,(l+(j+.5)*cw,t+4*ch+22),str(L),27,'mt')
        text(im,(l+2.5*cw,t+4*ch+78),'PDMS thickness (µm)',30,'mt')
    for label_x in [5,865]:
        lab=Image.new('RGBA',(550,40),(255,255,255,0));ImageDraw.Draw(lab).text((275,20),'D_PDMS (m²/s)',font=font(27),fill=INK,anchor='mm');lab=lab.rotate(90,expand=True)
        im.paste(lab,(label_x,185),lab)
    text(im,(900,35),'t90 (h)',30,'mt')
    d.rectangle((750,900,785,930),fill='#d9d9d9');text(im,(805,900),'>168 h',28)
    save(im,'04_PDMS_coupled_sweep')
    im=canvas();xy=axis(im,BOX1,(0,24),(0,.03),[(v,str(v)) for v in [0,6,12,18,24]],[(v,f'{v:.2f}') for v in [0,.01,.02,.03]],'Time from pulse start (h)','Bottom / input concentration','A')
    rs=rows('pulse_histories')
    for j,name in enumerate(['no_membrane','PDMS_100um_nominal','PDMS_100um_storage']):
        a=[r for r in rs if r['case']==name and float(r['time_s'])<=86400];line(im,xy,[float(r['time_s'])/3600 for r in a],[max(0,float(r['bottom_fraction'])) for r in a],COL[j])
    legend(im,(420,180),[('No membrane',COL[0]),('100 µm, K = 100',COL[1]),('100 µm, K = 1000',COL[2])]);text(im,(430,340),'Input pulse: 20 min',26)
    xy=axis(im,BOX2,(0,120),(0,1200),[(v,str(v)) for v in [0,20,40,60,80,100,120]],[(v,str(v)) for v in [0,300,600,900,1200]],'Time from pulse start (min)','PDMS inventory / Cgas (µL)','B')
    for j,name in enumerate(['PDMS_100um_nominal','PDMS_100um_storage']):
        a=[r for r in rs if r['case']==name and float(r['time_s'])<=7200];line(im,xy,[float(r['time_s'])/60 for r in a],[max(0,float(r['PDMS_stored_per_Cgas_m']))*11.2e-6*1e9 for r in a],COL[j+1])
    legend(im,(1330,570),[('K = 100',COL[1]),('K = 1000',COL[2])]);save(im,'05_pulse_and_storage')
    im=canvas();xy=axis(im,BOX1,(0,100),(0,8),[(v,str(v)) for v in [0,25,50,75,100]],[(v,str(v)) for v in [0,2,4,6,8]],'Fill volume (µL)','Maximum O2 supply (pmol/s/well)','A')
    rs=rows('oxygen_capacity')
    for j,L in enumerate([0,100,500]):
        a=[r for r in rs if float(r['PDMS_um'])==L and float(r['assumed_demand_pmol_s'])==.1];line(im,xy,[float(r['liquid_uL']) for r in a],[float(r['max_supply_pmol_s']) for r in a],COL[j],mark=True)
    legend(im,(440,170),[('No membrane',COL[0]),('PDMS 100 µm',COL[1]),('PDMS 500 µm',COL[2])])
    xy=axis(im,BOX2,(.01,10),(0,1),[(v,str(v)) for v in [.01,.1,1,10]],[(v,str(v)) for v in [0,.25,.5,.75,1]],'Assumed demand (pmol/s/well)','Steady bottom / surface O2','B',True)
    for j,V in enumerate([10,50,100]):
        r=next(r for r in rs if float(r['liquid_uL'])==V and float(r['PDMS_um'])==100);cap=float(r['max_supply_pmol_s']);loads=np.geomspace(.01,cap,120);line(im,xy,loads,1-loads/cap,COL[j])
    legend(im,(1120,630),[(f'{V} µL',COL[j]) for j,V in enumerate([10,50,100])]);save(im,'06_oxygen_capacity')
    im=canvas();xy=axis(im,BOX1,(16,128),(.0001,1),[(v,str(v)) for v in [16,32,64,128]],[(v,str(v)) for v in [.0001,.001,.01,.1,1]],'Cells per slab','Relative analytical error (%)','A',True,True)
    rs=rows('numerical_validation')
    for j,col in enumerate(['lag_relative_error','liquid_t90_relative_error']):line(im,xy,[float(r['cells']) for r in rs],[float(r[col])*100 for r in rs],COL[j],mark=True)
    legend(im,(170,180),[('Membrane time lag',COL[0]),('Liquid-bottom t90',COL[1])])
    xy=axis(im,BOX2,(24,96),(23.54,23.57),[(v,str(v)) for v in [24,48,96]],[(v,f'{v:.2f}') for v in [23.54,23.55,23.56,23.57]],'Liquid cells in coupled model','Coupled bottom t90 (h)','B',True)
    rs=rows('coupled_convergence');line(im,xy,[float(r['liquid_cells']) for r in rs],[float(r['t90_s'])/3600 for r in rs],COL[0],mark=True);save(im,'07_numerical_validation')
    print('Saved seven figures in',O)
if __name__=='__main__':main()
