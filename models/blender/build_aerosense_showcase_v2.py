from __future__ import annotations
"""AeroSense Blender Showcase v2 — polished semantic scene kit.

Designed for the Follow-the-Signal interactive.  The script intentionally avoids
abstract rings / random circles.  Every large object has a narrative role.

Blender 4.x/5.x best-effort compatibility.
"""
import math
from pathlib import Path
import bpy
from mathutils import Vector, Euler

HERE = Path(__file__).resolve().parent
MODELS = HERE.parent if HERE.name == 'blender' else HERE
OUT = MODELS / 'showcase_v2'
PREV = MODELS / 'previews_v2'
OUT.mkdir(parents=True, exist_ok=True)
PREV.mkdir(parents=True, exist_ok=True)
OUT_BLEND = HERE / 'AeroSense_Showcase_v2.blend'

# ---------- helpers ----------
def wipe():
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    for blocks in (bpy.data.meshes,bpy.data.curves,bpy.data.materials,bpy.data.cameras,bpy.data.lights,bpy.data.worlds):
        for b in list(blocks):
            try: blocks.remove(b)
            except Exception: pass

def coll(name,parent=None):
    c=bpy.data.collections.get(name)
    if not c:
        c=bpy.data.collections.new(name); (parent or bpy.context.scene.collection).children.link(c)
    return c

def move(o,c):
    for old in list(o.users_collection): old.objects.unlink(o)
    c.objects.link(o)

def parent(ch,pa): ch.parent=pa

def empty(name,loc=(0,0,0),c=None):
    o=bpy.data.objects.new(name,None); o.location=loc; o.empty_display_size=.18; (c or bpy.context.collection).objects.link(o); return o

def active(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o

def apply_scale(o):
    active(o); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)

def smooth(o):
    if o.type=='MESH':
        for p in o.data.polygons: p.use_smooth=True

def material(name,color,rough=.55,metal=0,alpha=1,emit=None,estr=0):
    m=bpy.data.materials.new(name); m.use_nodes=True; b=m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value=(*color,1); b.inputs['Roughness'].default_value=rough
    if 'Metallic' in b.inputs: b.inputs['Metallic'].default_value=metal
    if alpha<.999:
        b.inputs['Alpha'].default_value=alpha
        for attr,val in [('surface_render_method','DITHERED'),('blend_method','BLEND')]:
            if hasattr(m,attr):
                try:setattr(m,attr,val)
                except:pass
    if emit:
        key='Emission Color' if 'Emission Color' in b.inputs else 'Emission'
        b.inputs[key].default_value=(*emit,1)
        if 'Emission Strength' in b.inputs:b.inputs['Emission Strength'].default_value=estr
    return m

def cube(name,loc,scale,mat,bevel=.06,c=None):
    bpy.ops.mesh.primitive_cube_add(location=loc); o=bpy.context.object; o.name=name; o.scale=scale; apply_scale(o); o.data.materials.append(mat)
    md=o.modifiers.new('bevel','BEVEL'); md.width=bevel; md.segments=3; active(o)
    try:bpy.ops.object.modifier_apply(modifier='bevel')
    except:pass
    smooth(o)
    if c:move(o,c)
    return o

def sphere(name,loc,scale,mat,c=None,seg=32,rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc); o=bpy.context.object;o.name=name;o.scale=scale;apply_scale(o);o.data.materials.append(mat);smooth(o)
    if c:move(o,c)
    return o

def cyl(name,loc,r,depth,mat,c=None,rot=(0,0,0),verts=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc,rotation=rot);o=bpy.context.object;o.name=name;o.data.materials.append(mat);smooth(o)
    if c:move(o,c)
    return o

def curve(name,pts,mat,bevel=.02,c=None,cyclic=False):
    cu=bpy.data.curves.new(name+'_curve','CURVE');cu.dimensions='3D';cu.resolution_u=12;cu.bevel_depth=bevel;cu.bevel_resolution=4
    sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(pts)-1)
    for bp,p in zip(sp.bezier_points,pts):bp.co=p;bp.handle_left_type='AUTO';bp.handle_right_type='AUTO'
    sp.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,cu);cu.materials.append(mat);(c or bpy.context.collection).objects.link(o);return o

def plane(name,loc,size,mat,c=None,rot=(0,0,0)):
    bpy.ops.mesh.primitive_plane_add(size=size,location=loc,rotation=rot);o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    if c:move(o,c)
    return o

def cam(name,loc,rot,lens=34):
    d=bpy.data.cameras.new(name);d.lens=lens;o=bpy.data.objects.new(name,d);bpy.context.scene.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;return o

def engine():
    try: items=[x.identifier for x in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    except: items=[]
    for x in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT','CYCLES','BLENDER_WORKBENCH'):
        if x in items:return x
    return items[0] if items else 'BLENDER_EEVEE'

def setup_scene():
    s=bpy.context.scene;s.render.engine=engine();s.render.resolution_x=1600;s.render.resolution_y=900;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    try:s.view_settings.look='AgX - Medium High Contrast'
    except:pass
    w=bpy.data.worlds.new('AeroSenseWorld');w.use_nodes=True;s.world=w;bg=w.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(0.055,0.065,0.06,1);bg.inputs['Strength'].default_value=.38

def lights(c):
    bpy.ops.object.light_add(type='AREA',location=(0,-1,7));a=bpy.context.object;a.data.energy=1200;a.data.shape='RECTANGLE';a.data.size=8;a.data.size_y=5;a.rotation_euler=(0,0,0);move(a,c)
    bpy.ops.object.light_add(type='AREA',location=(5,2,3));b=bpy.context.object;b.data.energy=800;b.data.color=(0.76,0.92,0.82);b.data.size=5;b.rotation_euler=(math.radians(70),0,math.radians(125));move(b,c)
    bpy.ops.object.light_add(type='AREA',location=(-5,-2,3));f=bpy.context.object;f.data.energy=650;f.data.color=(1.0,0.72,0.52);f.data.size=4;f.rotation_euler=(math.radians(75),0,math.radians(-110));move(f,c)

# ---------- materials ----------
def mats():
    return {
      'floor':material('M_floor',(0.12,0.115,0.105),.85), 'wall':material('M_wall',(0.19,0.18,0.16),.9),
      'wood':material('M_wood',(0.33,0.20,0.105),.78), 'steel':material('M_steel',(0.19,0.21,0.20),.34,.5),
      'sack':material('M_sack',(0.60,0.47,0.29),.98), 'coffee':material('M_coffee',(0.16,0.07,0.035),.6),
      'paper':material('M_paper',(0.78,0.72,0.63),.9), 'fly':material('M_fly',(0.12,0.07,0.035),.5),
      'eye':material('M_eye',(0.52,0.055,0.04),.25), 'wing':material('M_wing',(0.72,0.86,0.82),.2,alpha=.42),
      'green':material('M_signal',(0.18,0.85,0.48),.25,emit=(0.18,0.9,0.5),estr=1.4),
      'green_soft':material('M_signal_soft',(0.30,0.72,0.46),.3,alpha=.16,emit=(0.25,0.8,0.45),estr=.35),
      'membrane':material('M_membrane',(0.22,0.50,0.44),.2,alpha=.25), 'nucleus':material('M_nucleus',(0.30,0.20,0.42),.55,alpha=.7),
      'pcb':material('M_pcb',(0.035,0.19,0.10),.72), 'copper':material('M_copper',(0.80,0.43,0.12),.25,.35),
      'black':material('M_black',(0.018,0.022,0.020),.65),'cyan':material('M_cyan',(0.16,0.65,0.75),.25,emit=(0.16,0.72,0.82),estr=.8),
      'node':material('M_node',(0.09,0.12,0.11),.45),'active':material('M_active',(0.24,0.92,0.53),.2,emit=(0.24,0.96,0.55),estr=1.6),
    }

# ---------- fly: dorsal/rear chase view, body unified, wings attached ----------
def build_fly(c,M,name='Drosophila'):
    root=empty(name,(0,0,0),c); body=empty('BODY',(0,0,0),c);parent(body,root)
    # Blender local coordinate: -Y = forward, +Z = dorsal up
    thor=sphere('Thorax',(0,0,0.02),(.20,.25,.17),M['fly'],c)
    head=sphere('Head',(0,-.27,.045),(.16,.14,.14),M['fly'],c)
    abd=sphere('Abdomen',(0,.34,-.015),(.14,.38,.12),M['fly'],c)
    for o in (thor,head,abd):parent(o,body)
    for sx in (-1,1):
        eye=sphere('Eye_L' if sx<0 else 'Eye_R',(sx*.112,-.33,.075),(.072,.055,.075),M['eye'],c,24,12);parent(eye,body)
        ant=curve('Antenna_L' if sx<0 else 'Antenna_R',[(sx*.05,-.39,.10),(sx*.075,-.48,.13),(sx*.12,-.56,.17)],M['fly'],.006,c);parent(ant,body)
    # wings start at thorax, visibly attached
    for sx,label in [(-1,'LEFT'),(1,'RIGHT')]:
        pivot=empty('WING_'+label,(sx*.12,-.02,.10),c);parent(pivot,root)
        verts=[(0,0,0),(sx*.15,-.02,.01),(sx*.43,.02,.015),(sx*.74,.26,.01),(sx*.64,.54,0),(sx*.30,.44,.005),(sx*.08,.18,.008)]
        mesh=bpy.data.meshes.new('Wing_'+label+'_mesh');mesh.from_pydata(verts,[],[(0,1,2,3,4,5,6)]);wing=bpy.data.objects.new('Wing_'+label+'_GEO',mesh);c.objects.link(wing);wing.data.materials.append(M['wing']);parent(wing,pivot)
        # veins
        for vi,end in enumerate([(sx*.62,.44,.015),(sx*.55,.18,.018),(sx*.30,.38,.014)]):
            v=curve(f'Wing_{label}_Vein_{vi}',[(0,0,.02),end],M['steel'],.004,c);parent(v,pivot)
    # halteres and legs
    for sx in (-1,1):
        h=sphere('Haltere_L' if sx<0 else 'Haltere_R',(sx*.13,.10,-.06),(.022,.05,.022),M['paper'],c,18,10);parent(h,body)
    legsets=[(-.11,-.10,.0,-.28,-.24,-.19),(.11,-.10,.0,.28,-.24,-.19),(-.12,.06,-.05,-.31,.15,-.22),(.12,.06,-.05,.31,.15,-.22),(-.10,.19,-.06,-.27,.40,-.18),(.10,.19,-.06,.27,.40,-.18)]
    for i,p in enumerate(legsets):
        leg=curve('Leg_%02d'%i,[(p[0],p[1],p[2]),((p[0]+p[3])*.55,(p[1]+p[4])*.55,p[5]*.5),(p[3],p[4],p[5])],M['fly'],.008,c);parent(leg,body)
    empty('FLY_FORWARD',(0,-.75,.02),c); empty('FLY_CAMERA_ANCHOR',(0,.95,.55),c)
    return root

# ---------- detailed warehouse ----------
def scene_warehouse(master,M):
    c=coll('SCENE_01_WAREHOUSE',master);r=empty('ROOT_01',(0,0,0),c)
    floor=cube('WarehouseFloor',(0,0,-.08),(4.8,9,.08),M['floor'],.02,c);parent(floor,r)
    # walls/ceiling beams
    for x in (-4.9,4.9): parent(cube('Wall', (x,0,2.2),(.10,9,2.3),M['wall'],.02,c),r)
    for y in [-6,-2,2,6]:
        beam=cube('CeilingBeam',(0,y,4.25),(4.9,.08,.10),M['steel'],.01,c);parent(beam,r)
        # hanging lights
        lamp=cyl('Lamp',(0,y,3.75),.30,.12,M['steel'],c);parent(lamp,r)
        bpy.ops.object.light_add(type='AREA',location=(0,y,3.55));L=bpy.context.object;L.data.energy=420;L.data.size=2;L.data.color=(1.0,.78,.56);L.rotation_euler=(0,0,0);move(L,c);parent(L,r)
    # shelves rich details
    for sx in (-1,1):
        x=sx*3.45
        for yi,y in enumerate([-5.3,-2.6,.1,2.8,5.5]):
            # uprights + planks
            for dx in (-.66,.66):parent(cube(f'Upright_{sx}_{yi}_{dx}',(x+dx,y,1.55),(.055,.9,1.55),M['steel'],.015,c),r)
            for z in (.25,1.15,2.05,2.95):parent(cube('ShelfPlank',(x,y,z),(.74,.92,.045),M['wood'],.018,c),r)
            # objects - crates/sacks/jars
            for row,z in enumerate((.60,1.50,2.40)):
                for j in (-1,0,1):
                    yy=y+j*.48
                    if (yi+row+j)%3==0:
                        o=sphere('CoffeeSack',(x-sx*.12,yy,z),(.30,.20,.38),M['sack'],c,24,12)
                    elif (yi+row+j)%3==1:
                        o=cube('WoodCrate',(x-sx*.12,yy,z),(.32,.20,.25),M['wood'],.035,c)
                    else:
                        o=cyl('StorageJar',(x-sx*.12,yy,z),.22,.48,M['paper'],c)
                    parent(o,r)
    # central real-world obstacles & emitting object
    for i,(x,y) in enumerate([(-1.45,2.3),(1.45,.7),(-1.25,-.9),(1.6,-2.1)]):
        crate=cube('ObstacleCrate_%d'%i,(x,y,.28),(.55,.55,.28),M['wood'],.04,c);parent(crate,r)
        bag=sphere('ObstacleBag_%d'%i,(x,y,.76),(.28,.20,.42),M['sack'],c,24,12);parent(bag,r)
    pallet=cube('VOC_PALLET',(.55,-4.15,.18),(.95,.72,.18),M['wood'],.025,c);parent(pallet,r)
    source=sphere('VOC_SOURCE_A',(.55,-4.15,.86),(.44,.31,.62),M['sack'],c,28,14);parent(source,r)
    # coffee beans visual on open top / nearby bin
    binbox=cube('CoffeeBin',(-1.8,-4.0,.55),(.72,.65,.55),M['wood'],.035,c);parent(binbox,r)
    for ix in range(7):
        for iy in range(5):
            bean=sphere('CoffeeBean',(-2.18+ix*.13,-4.28+iy*.14,1.12),(.055,.085,.045),M['coffee'],c,16,8);bean.rotation_euler=(.1,0,(ix+iy)*.4);parent(bean,r)
    anchor=empty('VOC_SOURCE_ANCHOR',(.55,-4.15,1.60),c);parent(anchor,r)
    # wispy plume, not circles
    for k,dx in enumerate((-.18,0,.20)):
        pts=[(.55+dx,-4.1,1.45),(.45+dx*.7,-3.1,1.85),(.72+dx,-2.0,2.05),(.38+dx*.6,-.8,2.25),(dx*.4,.4,2.15)]
        p=curve('ODOR_WISP_%d'%k,pts,M['green_soft'],.035-k*.006,c);parent(p,r)
    # semantic path is smooth and forward, modest y undulation
    pts=[(0,5.8,1.45),(-.55,3.7,1.55),(.35,1.8,1.35),(-.45,-.4,1.60),(.55,-2.3,1.28),(.55,-4.0,1.45)]
    path=curve('FLIGHT_PATH_01',pts,M['green_soft'],.005,c);parent(path,r)
    empty('PATH_START',pts[0],c);empty('PATH_TARGET',pts[-1],c);empty('STAGE_ANCHOR_01',(.5,-2.8,2.0),c)
    return c

# ---------- olfaction: one giant sensillum / receptor tunnel, no random rings ----------
def scene_olfaction(master,M):
    c=coll('SCENE_02_OLFACTION',master);r=empty('ROOT_02',(0,0,0),c)
    # curved antenna cutaway walls
    left=curve('ANTENNA_RIDGE_L',[(-3,5,.2),(-2.5,2,1.0),(-2,-1,1.5),(-1.2,-4,1.9)],M['paper'],.34,c);right=curve('ANTENNA_RIDGE_R',[(3,5,.2),(2.5,2,1.0),(2,-1,1.5),(1.2,-4,1.9)],M['paper'],.34,c);parent(left,r);parent(right,r)
    # sensilla as tapered-ish cylinders angled inward
    for sx in (-1,1):
        for i in range(8):
            y=4.0-i*1.0; x=sx*(2.45-.13*i); z=.45+.14*i
            s=cyl('Sensillum_%s_%d'%('L' if sx<0 else 'R',i),(x,y,z),.07,1.20,M['paper'],c,rot=(math.radians(70),0,math.radians(-sx*18))) ;parent(s,r)
    # one obvious receptor gateway ahead
    membrane=cube('RECEPTOR_MEMBRANE',(0,-3.2,1.5),(2.4,.18,1.35),M['membrane'],.12,c);parent(membrane,r)
    for i,x in enumerate([-1.4,-.7,0,.7,1.4]):
        stalk=cyl('OR_CHANNEL_%d'%i,(x,-3.35,1.5),.12,.55,M['black'],c,rot=(math.radians(90),0,0));parent(stalk,r)
        cap=sphere('OR_ACTIVE_%d'%i,(x,-3.65,1.5),(.16,.16,.16),M['green'] if i in (1,3,4) else M['paper'],c,18,10);parent(cap,r)
    # odor ribbons converge to receptor gateway
    for k,x in enumerate((-.35,0,.33)):
        p=curve('ODOR_TO_RECEPTOR_%d'%k,[(x,4,1.6),(x*.5,1.8,1.75),(-x*.4,-.4,1.85),(x*.25,-2.8,1.55)],M['green_soft'],.024,c);parent(p,r)
    pathpts=[(0,5.2,1.55),(.35,3,1.75),(-.25,1,1.72),(.25,-1.2,1.72),(0,-3.0,1.55)]
    path=curve('FLIGHT_PATH_02',pathpts,M['green_soft'],.005,c);parent(path,r);empty('STAGE_ANCHOR_02',(0,-2.7,2.6),c)
    return c

# ---------- cell: one large cell chamber with obvious receptor -> Ca -> GCaMP ----------
def scene_cell(master,M):
    c=coll('SCENE_03_CELL',master);r=empty('ROOT_03',(0,0,0),c)
    # translucent cell body + nucleus
    cell=sphere('HEK293T_CELL',(0,-.6,1.35),(3.4,4.1,2.5),M['membrane'],c,40,22);parent(cell,r)
    nucleus=sphere('NUCLEUS',(-1.25,-.2,1.45),(1.0,1.35,.95),M['nucleus'],c,32,18);parent(nucleus,r)
    # membrane receptor at entry
    receptor=cyl('OR_ORCO_RECEPTOR',(0,3.1,1.55),.22,.9,M['black'],c,rot=(math.radians(90),0,0));parent(receptor,r)
    receptorGlow=sphere('RECEPTOR_GLOW',(0,2.62,1.55),(.30,.18,.30),M['green'],c,20,10);parent(receptorGlow,r)
    # calcium trails flow inward; GCaMP pockets
    for i,x in enumerate([-.7,-.35,0,.35,.7]):
        pts=[(x*.2,2.3,1.55),(x,1.1,1.35),(x*.6,-.4,1.2),(x*.3,-1.8,1.4)]
        tr=curve('CA_SIGNAL_%d'%i,pts,M['cyan'],.022,c);parent(tr,r)
    for i,(x,y,z) in enumerate([(-.8,-1.3,1.0),(.2,-1.5,1.45),(.95,-.9,1.2),(.4,.1,.9)]):
        g=sphere('GCAMP_SIGNAL_%d'%i,(x,y,z),(.18,.18,.18),M['green'],c,18,10);parent(g,r)
    pathpts=[(0,4.2,1.55),(0,2.7,1.55),(.45,1.0,1.35),(-.35,-.7,1.22),(.2,-2.9,1.35)]
    path=curve('FLIGHT_PATH_03',pathpts,M['green_soft'],.005,c);parent(path,r);empty('STAGE_ANCHOR_03',(.7,-1.3,2.2),c)
    return c

# ---------- hardware: clear optical chamber to photodiode to PCB corridor ----------
def scene_hardware(master,M):
    c=coll('SCENE_04_HARDWARE',master);r=empty('ROOT_04',(0,0,0),c)
    board=cube('PCB_BASE',(0,-.8,.0),(4.5,6.6,.10),M['pcb'],.05,c);parent(board,r)
    # optical sample chamber front
    chamber=cube('OPTICAL_CHAMBER',(0,4.4,1.15),(1.8,1.1,1.15),M['membrane'],.16,c);parent(chamber,r)
    led=cyl('LED_EXCITATION',(-1.1,4.2,1.2),.26,.48,M['green'],c,rot=(0,math.radians(90),0));parent(led,r)
    pd=cyl('PD',(0,2.75,.48),.35,.18,M['paper'],c);parent(pd,r)
    # blocks along center, recognizable labels can be HTML not 3D text
    tia=cube('TIA',(0,1.0,.35),(.75,.58,.20),M['black'],.06,c);adc=cube('ADC',(.7,-1.0,.35),(.82,.62,.20),M['black'],.06,c);mcu=cube('MCU',(-.55,-3.0,.35),(1.0,.72,.20),M['black'],.06,c)
    for o in (tia,adc,mcu):parent(o,r)
    tracepts=[(0,2.7,.22),(0,1.0,.22),(.7,-1.0,.22),(-.55,-3.0,.22),(0,-5.2,.22)]
    trace=curve('TRACE_MAIN',tracepts,M['copper'],.055,c);parent(trace,r)
    signal=curve('SIGNAL_PATH',[(0,4.1,1.4),(0,3.2,.8),(0,2.7,.42),(0,1.0,.46),(.7,-1.0,.46),(-.55,-3,.46)],M['green'],.035,c);parent(signal,r)
    # capacitor/resistor city around sides for richness
    for i,y in enumerate([2.0,.2,-1.8,-3.8]):
        for sx in (-1,1):
            x=sx*(1.6+.3*(i%2));cap=cyl('Cap',(x,y,.40),.18,.55,M['paper'],c);parent(cap,r)
            res=cube('Res',(sx*2.35,y-.5,.30),(.34,.15,.13),M['copper'],.03,c);parent(res,r)
    pathpts=[(0,5.5,1.45),(0,3.3,.85),(0,1.2,.65),(.65,-.8,.62),(-.5,-3.0,.65),(0,-5.2,.72)]
    path=curve('FLIGHT_PATH_04',pathpts,M['green_soft'],.005,c);parent(path,r);empty('STAGE_ANCHOR_04',(1.0,-.8,1.5),c)
    return c

# ---------- decoder: explicit AL glomeruli -> sparse mushroom-body field ----------
def scene_decoder(master,M):
    c=coll('SCENE_05_DECODER',master);r=empty('ROOT_05',(0,0,0),c)
    floor=cube('DecoderFloor',(0,0,-.08),(4.8,7.0,.08),M['black'],.03,c);parent(floor,r)
    # AL glomeruli: clustered ellipsoids, not rings
    centers=[(-1.2,3.5,.9),(-.4,3.2,1.2),(.5,3.45,.8),(1.25,3.1,1.15),(-.8,2.5,.85),(.2,2.55,1.3),(.95,2.45,.9)]
    for i,p in enumerate(centers):
        g=sphere('AL_GLOMERULUS_%d'%i,p,(.38,.45,.34),M['active'] if i in (1,3,5) else M['node'],c,24,12);parent(g,r)
    # projection fibers
    for i,p in enumerate(centers):
        pts=[p,(p[0]*.55,1.2,1.6),(p[0]*.25,-.4,1.7)]
        f=curve('PROJECTION_%d'%i,pts,M['green_soft'] if i in (1,3,5) else M['steel'],.018,c);parent(f,r)
    # mushroom body sparse field: organized cloud, only subset active
    for row,y in enumerate([-.8,-1.7,-2.6,-3.5,-4.4]):
        for col,x in enumerate([-2.4,-1.8,-1.2,-.6,0,.6,1.2,1.8,2.4]):
            z=.75+.18*math.sin(row*.7+col*.6);active=((row*9+col)%7==0 or (row==3 and col in (2,6)))
            n=sphere('KC_ACTIVE' if active else 'KC_NODE',(x,y,z),(.095,.095,.095),M['active'] if active else M['node'],c,14,7);parent(n,r)
    pathpts=[(0,5.5,1.1),(.15,3.1,1.25),(-.15,1.2,1.55),(.25,-.8,1.45),(-.35,-2.7,1.1),(0,-4.8,.95)]
    path=curve('FLIGHT_PATH_05',pathpts,M['green_soft'],.005,c);parent(path,r);empty('STAGE_ANCHOR_05',(.6,-3.3,1.7),c)
    return c

# ---------- return scene with clearer application ----------
def scene_return(master,M):
    c=coll('SCENE_06_RETURN',master);r=empty('ROOT_06',(0,0,0),c)
    floor=cube('ReturnFloor',(0,0,-.08),(4.8,8,.08),M['floor'],.03,c);parent(floor,r)
    # rows of stored-food pallets, one highlighted conceptual source
    for ix,x in enumerate([-2.8,-1.4,0,1.4,2.8]):
        for iy,y in enumerate([2.5,0,-2.5]):
            pal=cube('FoodPallet',(x,y,.15),(.55,.50,.15),M['wood'],.03,c);bag=sphere('FoodBag',(x,y,.70),(.32,.25,.52),M['sack'],c,24,12);parent(pal,r);parent(bag,r)
    glow=sphere('RETURN_TARGET_GLOW',(1.4,-2.5,1.5),(.16,.16,.16),M['green'],c,18,9);parent(glow,r)
    final=curve('FINAL_ODOR',[(1.4,-2.5,1.3),(1.1,-1.1,1.75),(.65,.6,1.95),(.2,2.2,1.8)],M['green_soft'],.035,c);parent(final,r)
    pathpts=[(0,5.5,1.35),(-.4,3.0,1.5),(.5,.8,1.3),(-.3,-1.0,1.55),(1.1,-2.2,1.45)]
    path=curve('FLIGHT_PATH_06',pathpts,M['green_soft'],.005,c);parent(path,r);empty('STAGE_ANCHOR_06',(1.4,-2.5,2.0),c)
    return c

# ---------- preview/export ----------
def camera_look(name,loc,target,lens=32):
    o=cam(name,loc,(0,0,0),lens);direction=Vector(target)-Vector(loc);o.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();return o

def export_collection(c,path):
    # use selection rather than hiding collections (safer)
    bpy.ops.object.select_all(action='DESELECT')
    objs=[]
    def collect_collection(cc):
        objs.extend(list(cc.objects))
        for ch in cc.children: collect_collection(ch)
    collect_collection(c)
    for o in objs:o.select_set(True)
    if objs:bpy.context.view_layer.objects.active=objs[0]
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=True)

def render(scene,camera,path):
    scene.camera=camera;scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)

def main():
    wipe();setup_scene();M=mats();master=coll('MASTER');lights(master)
    flyc=coll('FLY_ASSET',master);fly=build_fly(flyc,M)
    scs=[scene_warehouse(master,M),scene_olfaction(master,M),scene_cell(master,M),scene_hardware(master,M),scene_decoder(master,M),scene_return(master,M)]
    # save .blend
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND))
    export_collection(flyc,OUT/'aerosense_fly_v2.glb')
    names=['warehouse','olfaction','cell','hardware','decoder','return']
    for i,(s,n) in enumerate(zip(scs,names),1):export_collection(s,OUT/f'aerosense_{i:02d}_{n}_v2.glb')
    # previews: temporarily hide all but collection via view-layer visibility through objects
    cameras=[
      camera_look('Cam01',(0,7.8,2.7),(.2,-2.6,1.25),34),
      camera_look('Cam02',(0,6.2,2.7),(0,-2.9,1.55),34),
      camera_look('Cam03',(0,5.7,2.6),(0,-1.0,1.25),34),
      camera_look('Cam04',(0,6.4,3.0),(0,-1.8,.6),34),
      camera_look('Cam05',(0,6.0,2.7),(0,-2.6,1.05),34),
      camera_look('Cam06',(0,6.8,2.7),(.7,-1.8,1.25),34),
    ]
    # render each scene with non-scene assets hidden_render
    all_scene_objs={s.name:set(s.all_objects) for s in scs}
    for idx,(s,n,ca) in enumerate(zip(scs,names,cameras),1):
        allowed=set(s.all_objects)|set(master.objects)|{ca}
        for o in bpy.context.scene.objects:o.hide_render=(o not in allowed)
        render(bpy.context.scene,ca,PREV/f'{idx:02d}_{n}_v2.png')
    for o in bpy.context.scene.objects:o.hide_render=False
    print('AeroSense Showcase v2 complete')
    print(OUT_BLEND);print(OUT);print(PREV)

if __name__=='__main__':main()
