"""Generate technical illustrations from the actual assembly-coordinate STLs."""
from pathlib import Path
import json,math
import numpy as np
from PIL import Image,ImageDraw
from render_core import render,boxgeo,geo,font
R=Path(__file__).resolve().parent;OUT=R/'drawings';OUT.mkdir(exist_ok=True)
names=['01_base_BLACK','02_black_hood_BLACK','03_gas_lid_BLACK','04_well_NE_CLEAR','05_well_NW_CLEAR','06_well_SW_CLEAR','07_well_SE_CLEAR']
cols=[(84,101,120),(48,59,70),(65,75,86)]+[(54,176,193)]*4
def page(title,subtitle='',size=(1800,1350)):
 im=Image.new('RGB',size,'#f6f7f9');d=ImageDraw.Draw(im);d.text((60,32),title,font=font(40),fill='#172b4d');d.text((62,91),subtitle,font=font(23),fill='#566779');return im
def label(im,xy,txt,size=25,fill='#172b4d'):ImageDraw.Draw(im).text(xy,txt,font=font(size),fill=fill)
def arrow(d,a,b,col='#e2902b',w=5):
 d.line([a,b],fill=col,width=w);ang=math.atan2(a[1]-b[1],a[0]-b[0]);d.polygon([b,(b[0]+16*math.cos(ang+.4),b[1]+16*math.sin(ang+.4)),(b[0]+16*math.cos(ang-.4),b[1]+16*math.sin(ang-.4))],fill=col)
def save(im,name):im.save(OUT/(name+'.png'))
items=[(n,c,(0,0,z)) for n,c,z in zip(names,cols,[0,50,145,95,95,95,95])]
items+=[(boxgeo((100,90,1.6),(0,0,38)),(29,139,101),(0,0,7)),(boxgeo((40,40,10),(-27,-5,6)),(90,90,95),(0,0,0))]
items+=[('08_gas_compression_plate_BLACK',(90,111,120),(0,0,120))]
im=page('AeroSense | assembly order','108 x 108 x 66 mm nominal body; exploded spacing is illustrative')
im.paste(render(items,(1120,1160),az=145,el=29),(50,150))
for y,t in [(180,'03  Lift-off lid + gas cap + shelf'),(260,'08  Four-hole compression plate'),(330,'04-07  Four clear wells'),(445,'02  Black hood + sleeves + filter seat'),(670,'PCB  Optical face upward'),(870,'Fan  40 x 40 x 10 mm'),(1010,'01  Base with fan cradle')]:label(im,(1140,y),t,23)
label(im,(1140,1160),'Two M3 x 35 screws close the stack.',22);save(im,'assembly_exploded')
im=page('Eight operating prints','Four structural pieces: PC/GF-like Black. Four clear wells: material / fit prototype.',size=(1800,1800))
positions=[(20,150),(610,150),(1200,150),(20,740),(460,740),(900,740),(1340,740)]
for i,(n,c,xy) in enumerate(zip(names,cols,positions)):
 size=(560,490) if i<3 else (420,410)
 im.paste(render([(n,c,(0,0,0))],size,az=145,el=35),xy)
 label(im,(xy[0]+20,xy[1]+size[1]),n.replace('_BLACK','').replace('_CLEAR',''),22)
save(im,'parts')
im.paste(render([('08_gas_compression_plate_BLACK',(75,93,104),(0,0,0))],(460,360),az=145,el=50),(660,1360));label(im,(655,1720),'08  Gas compression plate',25);save(im,'parts')
im=page('Base | fan and access','PCB removed for clarity. Fan blows upward into the electronics bay.')
im.paste(render([(names[0],cols[0],(0,0,0))],(1180,1070),az=145,el=65),(0,160))
for i,t in enumerate(['A  Integral 40 mm fan corner cradle','B  Two diagonal fan screws M3 x 16','C  Four PCB pillars at (+/-45, +/-40)','D  USB-C: front edge, X = +31.5','E  SW1: right edge, Y = +7','F  Underside J3 / reset / boot access','No extra fan bracket or hinge.','Do not block the underside intake.']):label(im,(1150,200+i*92),t,24)
save(im,'base_fan_ports')
im=page('Lid underside | open, cleanable gas cap','Selected CFD geometry: a wide horizontal inlet shelf, integral with the lid.')
im.paste(render([(names[2],cols[2],(0,0,0))],(1050,1050),az=145,el=-45),(0,170))
v,f=geo(names[2]);mask=(np.abs(v[f][:,:,0])<20).all(axis=1)&(np.abs(v[f][:,:,1])<10).all(axis=1)
vv,iv=np.unique(v[f[mask]].reshape(-1,3),axis=0,return_inverse=True);ff=iv.reshape(-1,3)
im.paste(render([((vv,ff),(112,135,151),(0,0,0))],(660,650),az=155,el=-35),(1100,170))
for i,t in enumerate(['Shelf: 7.2 x 8.0 x 1.2 mm','Inlet at -X; outlet at +X','Tube bore 2.4 mm; barb 3.4 / 4.0 mm','Shared headspace over four liquids','Remove plate to access underside','No closed perforated-plate cavity']):label(im,(1090,850+i*64),t,23)
save(im,'lid_gas_shelf')
# Accurate orthographic optical layout, not an invented rendered concept.
im=page('Optical registration | optical face upward','Millimetres. PD active area is an offset proxy; vendor orientation and heights still require confirmation.')
d=ImageDraw.Draw(im);scale=46;ox,oy=670,730
def rect(x0,y0,x1,y1,col,outline=None,w=2):d.rectangle((ox+x0*scale,oy-y1*scale,ox+x1*scale,oy-y0*scale),fill=col,outline=outline,width=w)
rect(-10,-9,10,9,'#3c4652')
for sx,sy,n in [(1,1,'NE'),(-1,1,'NW'),(-1,-1,'SW'),(1,-1,'SE')]:
 x,y=sx*3.3,sy*2.65;rect(x-2.65,y-2.05,x+2.65,y+2.05,'#c5eef0');rect(x-2,y-1.4,x+2,y+1.4,'#39adb9')
 label(im,(ox+x*scale-38,oy-y*scale-14),n,26,'#ffffff')
 x,y=sx*3.3,sy*5.7;rect(x-.8,y-.5,x+.8,y+.5,'#f4ba3b')
rect(-1.5,-1.65,1.5,.85,'#ee8575');d.line([(ox,oy-540),(ox,oy+540)],fill='#97a3ad',width=2);d.line([(ox-610,oy),(ox+610,oy)],fill='#97a3ad',width=2)
for i,t in enumerate(['Well centres (+/-3.3, +/-2.65)','Liquid section 4.0 x 2.8','LED centres (+/-3.3, +/-5.7)','PD sensitive centre (0, -0.4)','Minimum shared black wall 1.2','Bottom optical band z42.5-44.2','Flat floor thickness 0.5','Nominal liquid per well: 100 uL']):label(im,(1260,245+i*115),t,21)
save(im,'optical_registration')
# Dimensioned longitudinal section: this is a schematic at scale, with z references.
im=page('Optical and gas stack | schematic section','Section through a well row; the central PD and inlet shelf are projected for explanation.',size=(2000,1350))
d=ImageDraw.Draw(im);sc=35;xx,zz=770,1270
def section(x0,z0,x1,z1,c):d.rectangle((xx+x0*sc,zz-(z1-38)*sc,xx+x1*sc,zz-(z0-38)*sc),fill=c)
section(-14,38,14,39.6,'#218a60');section(-10,44.2,10,55.5,'#323e4a')
for x in [-3.3,3.3]:
 section(x-2.5,42.5,x+2.5,55.5,'#afe5ec');section(x-2,43,x+2,55.5,'#edf9fa');section(x-2,43,x+2,51.93,'#40b8c3')
section(-10,55.5,10,56.1,'#e4b35e');section(-10,56.1,10,57.3,'#657b89');section(-9.2,57.3,9.2,57.9,'#e4b35e');section(-9.2,57.9,9.2,64,'#323e4a');section(-7.4,57.3,7.4,62.5,'#eef5fa');section(-7.4,58.2,-.2,59.4,'#fbad35');section(-14,64,14,66,'#485562');section(-2.4,41.1,2.4,42.1,'#94b379');section(-1.5,39.6,1.5,40.5,'#dc7866')
for x in [-3.3,3.3]:section(x-2,55.5,x+2,57.3,'#eef5fa')
last_y=0
for z,txt in [(66,'Lid top 66'),(62.5,'Plenum roof 62.5'),(59.4,'Inlet shelf top 59.4'),(57.3,'Pressure plate top 57.3'),(55.5,'Well top / gasket lower 55.5'),(51.93,'100 uL free surface 51.93'),(44.2,'Black sleeve lower 44.2'),(43,'Liquid floor 43.0'),(42.5,'Outer flat floor 42.5'),(39.6,'PCB optical face 39.6')]:
 yy=zz-(z-38)*sc;ty=max(yy,last_y+28);last_y=ty;d.line([(xx+14*sc,yy),(xx+16*sc,ty)],fill='#55687a',width=2);label(im,(xx+16*sc+8,ty-14),txt,20)
save(im,'stack_section')
im=page('Ports and board fit | plan','PDF-derived interface envelopes, not vendor-certified component heights.')
d=ImageDraw.Draw(im);s=9;cx,cy=650,715
def pr(x0,y0,x1,y1,c,o=None):d.rectangle((cx+x0*s,cy-y1*s,cx+x1*s,cy-y0*s),fill=c,outline=o,width=3)
pr(-54,-56,54,52,'#69798a');pr(-50,-45,50,45,'#218a60')
for x in [-45,45]:
 for y in [-40,40]:d.ellipse((cx+x*s-15,cy-y*s-15,cx+x*s+15,cy-y*s+15),fill='#eef2f5')
pr(21.5,-56,41.5,-46,'#eba334');pr(49,-4.5,54,18.5,'#eba334');pr(-8,-56,15,-44,'#c6b4e1');pr(-47,-25,-7,15,'#1d3042')
label(im,(cx-37*s,cy+7*s),'FAN',30,'#ffffff')
for i,t in enumerate(['Front (-Y): USB-C opening 20 x 12','Right (+X): SW1 opening 23 x 13','PCB 100 x 90; nominal hole pitch 90 x 80','PCB underside z38; optical face z39.6','Fan top z16: 22 mm below bare board','Reserve >=0.5 mm over real components','J2 is charging / power only.','Use J3 UART to program ESP32.']):label(im,(1180,230+110*i),t,23)
save(im,'port_plan')
# 1:1 vector cutting template; retain a 20 mm check scale.
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="80mm" height="55mm" viewBox="0 0 80 55"><g fill="none" stroke="black" stroke-width="0.12">','<rect x="10" y="10" width="20" height="18"/>']
for sx in [-1,1]:
 for sy in [-1,1]:svg.append(f'<rect x="{20+sx*3.3-2}" y="{19-sy*2.65-1.4}" width="4" height="2.8"/>')
svg+=['<rect x="45" y="10" width="4" height="4"/>','<rect x="45.5" y="10.3" width="3" height="3.4"/>','<path d="M10 38h20 M10 36v4 M30 36v4"/></g><g font-family="Arial" font-size="2.5"><text x="10" y="7">Well gasket, 0.8 mm stock</text><text x="43" y="7">PD seal</text><text x="10" y="44">20 mm check: print at 100%, no fit-to-page.</text><text x="10" y="49">Cut apertures accurately; verify PD active area.</text></g></svg>']
svg.insert(-1,'<rect x="54" y="10" width="18.4" height="15.6"/><rect x="55.8" y="11.8" width="14.8" height="12"/>')
(OUT/'gasket_cut_template_1to1.svg').write_text(''.join(svg),encoding='utf8')
print('Generated actual-mesh drawings and 1:1 gasket template.')
