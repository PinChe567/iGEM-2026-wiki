"""Readable cutaway exhibition scenes. Conceptual geometry, not molecular structures."""
from pathlib import Path
import sys, math
import bpy
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build_aerosense_v3 as v
b=v.b
OUT=v.ROOT/'models/showcase_v4';OUT.mkdir(exist_ok=True)
PRE=v.ROOT/'models/previews_v4';PRE.mkdir(exist_ok=True)
b.wipe();b.setup_scene();M=v.palette();master=b.coll('JOURNEY_V4');b.lights(master)
dark=b.material('Deep_jade',(.022,.09,.073),.3,.2)
glass=b.material('Optical_glass',(.10,.55,.43),.2,alpha=.20)
def title(c,name,body,loc,size=.24,mat=None):return v.text(name,body,loc,size,mat or M['cream'],c,rot=(math.pi/2,0,math.pi))

cell=b.coll('CELL_CUTAWAY',master)
# An architectural membrane section: no unexplained floating organelles.
b.cube('Cell_exhibit_base',(0,-.7,-1.65),(3.7,4.4,.12),dark,.18,cell)
receptors=v.receptor(cell,M,(0,-1.0,1.32),1.20)
for ob in receptors:
    if ob.get('feature')=='membrane':
        # membrane remains legible and subordinate to the receptor complex
        ob.data.materials.clear();ob.data.materials.append(glass)
v.merge_features(cell)
title(cell,'Cell_heading','ENGINEERED CELL',(0,-3.9,3.8),.40)
title(cell,'Cell_subheading','OR + Orco  /  Ca2+  /  GCaMP6f',(0,-3.9,3.35),.19)
for x,name,body,mat in [(-1.55,'OR_role','OR',M['or']),(1.3,'Orco_role','Orco',M['orco'])]:
    title(cell,name,body,(x,-1.0,2.7),.22,mat)
title(cell,'GCaMP_role','GCaMP6f',(1.65,.3,.13),.22,M['green'])
title(cell,'mCherry_role','mCherry',(-2.6,.3,.13),.19,M['rose'])
title(cell,'Extracellular','OUTSIDE',(3,-.9,2.1),.16)
title(cell,'Intracellular','CYTOPLASM',(2.7,-.9,.4),.16)
for j in range(11):
    a=j*2.4;b.sphere('Calcium_signal',(math.sin(a)*.16,-.95+math.cos(a)*.12,2.6-j*.22),(.043,)*3,M['cyan'],cell,12,8)
b.empty('GCAMP_SIGNAL_0',(1.1,-1.0,-.65),cell)
v.path(cell,3,[(0,5,1.6),(.1,2.5,1.6),(0,0,1.55),(0,-2,1.55),(0,-4.2,1.6)],M)

hw=b.coll('READER_CUTAWAY',master)
b.cube('Reader_shell',(0,-.4,-.23),(3.4,4.8,.25),M['cream'],.28,hw)
b.cube('Reader_deck',(0,-.5,.06),(3.08,4.3,.06),dark,.18,hw)
for x in [-3.28,3.28]:b.cube('Reader_side_wall',(x,-.5,.4),(.08,4.45,.4),M['cream'],.08,hw)
# Each component is arranged in the direction of travel and connected by gold traces.
for y,name,sub in [(2.7,'CARTRIDGE','FLUORESCENCE'),(.6,'PD','LIGHT TO CURRENT'),(-1.4,'TIA','CURRENT TO VOLTAGE'),(-3.4,'ADC','DIGITIZED READOUT')]:
    x=-.65 if name=='CARTRIDGE' else .65
    if name=='CARTRIDGE':
        b.cube(name,(x,y,.62),(.55,.48,.40),glass,.10,hw)
        for i in range(4):b.cyl('Sample_well',(x-.3+i*.2,y,.65),.068,.64,M['green'],hw)
    else:
        b.cube(name,(x,y,.35),(.58,.45,.18),M['steel'],.09,hw)
        for side in [-1,1]:
            for i in range(7):b.cube(name+'_pin',(x+side*.66,y-.3+i*.10,.24),(.14,.024,.025),M['gold'],.005,hw)
    title(hw,name+'_label',name,(x,y+.48,1.25),.24)
    title(hw,name+'_meaning',sub,(x,y+.5,1.0),.115)
    v.tube(name+'_signal_trace',[(x,y-.5,.17),(x*.4,y-.8,.17),(.65,y-1.4,.17)],M['gold'],.025,hw)
for side in [-1,1]:
    for j in range(5):b.cube('Vent',(side*2.9,3.2-j*.22,.095),(.055,.07,.025),M['steel'],.02,hw)
title(hw,'Reader_heading','OPTICAL READER',(0,-4.4,2.6),.35)
v.path(hw,4,[(0,5,1.7),(0,2.8,1.7),(0,.3,1.7),(0,-2,1.7),(0,-4.2,1.7)],M)
olf=b.coll('NATURAL_OLFACTION',master)
cuticle=b.material('Antenna_cuticle',(.30,.20,.08),.5)
for side in [-1,1]:
    b.sphere('Antenna_surface',(side*3.25,.1,-.3),(1.1,4.4,.55),cuticle,olf,32,16)
    for row in range(3):
        for j in range(11):
            x=side*(2.65+row*.43);y=4-j*.72;h=.55+(j%4)*.13
            v.tube('Olfactory_sensillum',[(x,y,.12),(x-side*.1,y-.09,h*.65),(x-side*.22,y-.2,h)],M['gold'],.027,olf)
            b.sphere('Sensillum_socket',(x,y,.1),(.085,.10,.045),M['fly'],olf,12,8)
objects=v.receptor(olf,M,(0,-2.4,1.3),1.08)
for ob in list(objects):
    if ob.get('feature') in ['gcamp','mcherry','linker']:bpy.data.objects.remove(ob,do_unlink=True)
    elif ob.get('feature')=='membrane':ob.data.materials.clear();ob.data.materials.append(glass)
v.merge_features(olf)
title(olf,'Natural_heading','NATURAL OLFACTION',(0,-3.8,3.15),.32)
title(olf,'Natural_subheading','OR + Orco  /  an odor-gated channel',(0,-3.8,2.75),.16)
title(olf,'Natural_sensilla','SENSORY HAIRS',(-3.0,.6,1.2),.18,M['gold'])
b.empty('RECEPTOR_MEMBRANE',(0,-2.4,1.5),olf);b.empty('OR_ACTIVE_1',(-.55,-2.4,1.7),olf)
v.path(olf,2,[(0,5,1.6),(0,2.5,1.6),(0,0,1.6),(0,-2,1.6),(0,-4.2,1.6)],M)

dec=b.coll('PATTERN_DECODING',master)
b.cube('Neural_exhibit_base',(0,-.3,-.15),(4.0,4.8,.12),dark,.2,dec)
layers=[]
for layer,(y,count,label) in enumerate([(3,7,'RECEPTOR INPUT'),(.3,7,'CONTRAST'),(-2.7,19,'SPARSE CODE')]):
    pts=[]
    for j in range(count):
        x=-2.7+(j%7)*.9;z=.65+(j//7)*.62
        active=layer<2 or j in [2,9,17]
        ob=b.sphere('KC_ACTIVE' if layer==2 and active else f'Layer_{layer}_node_{j}',(x,y,z),(.13 if active else .075,)*3,M['green'] if active else M['steel'],dec,16,10)
        pts.append((x,y,z))
    layers.append(pts);title(dec,f'Layer_{layer}_label',label,(0,y,3.0),.28)
for layer in [0,1]:
    for j,a in enumerate(layers[layer]):
        for k in [j%len(layers[layer+1]),(j*3+2)%len(layers[layer+1])]:
            z=layers[layer+1][k]
            v.tube('Neural_connection',[a,((a[0]+z[0])*.5,(a[1]+z[1])*.5,(a[2]+z[2])*.5+.18),z],M['green_soft'],.009,dec)
title(dec,'Decoder_note','ILLUSTRATIVE NETWORK / NOT MEASURED DATA',(0,-4.5,2.4),.16)
v.path(dec,5,[(0,5,1.6),(0,2.5,1.6),(0,0,1.6),(0,-2,1.6),(0,-4.2,1.6)],M)

ret=b.coll('RESPONSIBLE_NEXT_STEP',master)
banana=b.material('Banana_peel',(.88,.57,.08),.42)
b.cube('Return_floor',(0,0,-.15),(5,5,.12),dark,.12,ret)
for side in [-1,1]:
    x=side*2.25;y=-.5
    b.cube('Batch_crate_base',(x,y,.25),(1.0,1.3,.12),M['wood'],.045,ret)
    for z in [.48,.75,1.02]:
        for sy in [-1,1]:b.cube('Crate_slats',(x,y+sy*1.28,z),(1.0,.045,.095),M['wood'],.035,ret)
    for sx in [-1,1]:b.cube('Crate_end',(x+sx*.98,y,.73),(.055,1.3,.49),M['wood'],.035,ret)
    for j in range(7):
        yy=y-.91+j*.30
        v.tube('Banana',[(x-.61,yy,1.27),(x-.35,yy,1.02),(x+.08,yy,.98),(x+.48,yy,1.15),(x+.62,yy,1.43)],banana,.12,ret)
        b.sphere('Banana_tip',(x+.62,yy,1.43),(.09,.075,.08),cuticle,ret,12,8)
    title(ret,'Batch_label','STORED FOOD',(x,y+1.38,.72),.16)
title(ret,'Act_heading','SCREEN  >  CONFIRM',(0,-3.8,3.2),.40)
title(ret,'Act_note','A SIGNAL SUPPORTS A NEXT STEP',(0,-3.8,2.75),.19)
title(ret,'Act_boundary','NOT A FOOD-SAFETY CERTIFICATE',(0,-3.8,2.4),.15)
b.empty('RETURN_TARGET_GLOW',(0,-2.8,1.6),ret)
v.path(ret,6,[(0,5,1.6),(0,2.5,1.6),(0,0,1.6),(0,-2,1.6),(0,-4.2,1.6)],M)
scenes=[(olf,'02_olfaction'),(cell,'03_cell'),(hw,'04_hardware'),(dec,'05_decoder'),(ret,'06_return')]
for c,name in scenes:v.export(c,OUT/f'aerosense_{name}_v4.glb')
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.render.resolution_x=1200;s.render.resolution_y=750;s.render.resolution_percentage=100;s.view_settings.exposure=-1.0
camera=b.camera_look('Gallery_camera',(5.6,10,5.7),(0,-.6,.8),39)
bpy.ops.wm.save_as_mainfile(filepath=str(Path(__file__).parent/'AeroSense_Journey_v4.blend'))
for c,name in scenes:
    allowed=set(c.all_objects)|set(master.objects)|{camera}
    for ob in s.objects:ob.hide_render=ob not in allowed
    b.render(s,camera,PRE/f'{name}_v4.png')
for ob in s.objects:
    hide=ob not in set(cell.all_objects)|set(master.objects)|{camera}
    ob.hide_set(hide);ob.hide_render=hide
bpy.ops.wm.save_as_mainfile(filepath=str(Path(__file__).parent/'AeroSense_Journey_v4.blend'))
print('JOURNEY_V4_COMPLETE',flush=True)
