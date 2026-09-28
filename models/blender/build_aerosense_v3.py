"""Author AeroSense's v3 GLBs and synchronized films in Blender. No external assets.
Run: blender --background --python build_aerosense_v3.py -- assets|film|preview
Biological forms are explanatory sculptures, not predicted molecular structures.
"""
import sys, math, random
from pathlib import Path
import bpy
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build_aerosense_showcase_v2 as b

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'models/showcase_v3'; OUT.mkdir(exist_ok=True)
PREV=ROOT/'models/previews_v3'; PREV.mkdir(exist_ok=True)
random.seed(26)

def palette():
    M=b.mats()
    for k,col in {'floor':(.045,.085,.075),'wall':(.095,.18,.15),'wood':(.40,.25,.12),'paper':(.84,.84,.63),'fly':(.50,.29,.085),'eye':(.62,.105,.045),'steel':(.12,.24,.23)}.items():
        M[k].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*col,1)
    M['cream']=b.material('Porcelain',(.88,.91,.74),.26)
    M['or']=b.material('OR_jade',(.09,.47,.27),.26,.13)
    M['orco']=b.material('Orco_teal',(.035,.49,.61),.26,.1)
    M['rose']=b.material('mCherry_coral',(.78,.10,.18),.23)
    M['gold']=b.material('Linker_gold',(.95,.64,.12),.27,.3)
    M['wing']=b.material('Wing_opal',(.77,.95,.87),.2,alpha=.68)
    return M

def tube(name,points,mat,r,c):
    return b.curve(name,points,mat,r,c)

def export(c,path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in c.all_objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=True,export_extras=True)

def merge_features(c):
    for feature in ['or','orco','gcamp','mcherry','linker','membrane']:
        objects=[o for o in c.all_objects if o.get('feature')==feature]
        if not objects:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join()
        ob=bpy.context.object;ob.name=feature+'_surface';ob['feature']=feature

def text(name,body,loc,size,mat,c,rot=(math.pi/2,0,0)):
    cu=bpy.data.curves.new(name,'FONT');cu.body=body;cu.size=size;cu.extrude=.002;cu.align_x='CENTER'
    ob=bpy.data.objects.new(name,cu);c.objects.link(ob);ob.location=loc;ob.rotation_euler=rot;cu.materials.append(mat)
    # Mesh text survives GLB export.
    b.active(ob);bpy.ops.object.convert(target='MESH');return ob

def fly(c,M):
    root=b.empty('Drosophila',c=c);body=b.empty('BODY',c=c);b.parent(body,root)
    for name,loc,scale,mat in [('Thorax',(0,0,.02),(.23,.25,.19),M['fly']),('Abdomen',(0,.31,0),(.185,.34,.15),M['gold']),('Head',(0,-.27,.07),(.235,.20,.205),M['fly'])]:
        b.parent(b.sphere(name,loc,scale,mat,c,32,16),body)
    for j in range(3):
        y=.24+j*.115; width=.174*(1-((y-.31)/.36)**2)**.5
        b.parent(tube('Abdominal_band',[(width*math.cos(a),y,.136*math.sin(a)) for a in [i*math.pi/10 for i in range(11)]],M['fly'],.018,c),body)
    for sign,label in [(-1,'LEFT'),(1,'RIGHT')]:
        eye=b.sphere('Eye_'+label,(sign*.171,-.385,.12),(.128,.10,.14),M['eye'],c);b.parent(eye,body)
        b.parent(b.sphere('Eye_glint',(sign*.182,-.463,.181),(.031,.025,.037),M['cream'],c,16,8),body)
        b.parent(tube('Antenna',[(sign*.07,-.43,.19),(sign*.13,-.53,.28),(sign*.19,-.52,.30)],M['fly'],.012,c),body)
        pivot=b.empty('WING_'+label,(sign*.13,-.04,.17),c);b.parent(pivot,root)
        w=b.sphere('Wing_'+label+'_GEO',(0,0,0),(.255,.49,.025),M['wing'],c);w.location=(sign*.27,.23,0);w.rotation_euler.z=-sign*.55;b.parent(w,pivot)
        for j in range(3):
            vein=tube('Wing_'+label+'_Vein',[(0,0,.028),(sign*(.15+j*.075),.2,.029),(sign*(.25+j*.08),.44-j*.06,.025)],M['cream'],.005,c);b.parent(vein,pivot)
        for j in range(3):
            leg=tube('Leg',[(sign*.15,-.1+j*.13,0),(sign*.32,-.17+j*.21,-.13),(sign*.39,-.2+j*.24,-.22)],M['fly'],.013,c);b.parent(leg,body)
    for name,loc in [('FLY_FORWARD',(0,-1,0)),('FLY_CAMERA_ANCHOR',(0,1,.6)),('TARGET_ANCHOR',(0,-.4,.1))]:
        b.parent(b.empty(name,loc,c),root)
    return root

def receptor(c,M,offset=(0,0,0),scale=1):
    """Adjacent color-coded sculptures; not subunit stoichiometry or a structure."""
    objects=[]
    def p(x,y,z):return tuple(offset[i]+scale*v for i,v in enumerate((x,y,z)))
    for feature,cx,mat in [('or',-.56,M['or']),('orco',.56,M['orco'])]:
        for j in range(7):
            a=j*math.tau/7
            points=[p(cx+.30*math.cos(a)+.065*math.cos(t*.65+j),.30*math.sin(a)+.065*math.sin(t*.65+j),-.7+t*.058) for t in range(25)]
            ob=tube(feature+'_helix',points,mat,.083*scale,c);ob['feature']=feature;objects.append(ob)
        for j in range(6):
            a=j*math.tau/7;aa=(j+1)*math.tau/7;z=.70 if j%2 else -.70
            ob=tube(feature+'_loop',[p(cx+.3*math.cos(a),.3*math.sin(a),z),p(cx+.36*math.cos((a+aa)/2),.36*math.sin((a+aa)/2),z+(.13 if z>0 else -.13)),p(cx+.3*math.cos(aa),.3*math.sin(aa),z)],mat,.036*scale,c);ob['feature']=feature;objects.append(ob)
    ob=tube('linker',[p(.55,0,-.72),p(.87,.04,-1.01),p(.61,0,-1.23),p(.9,0,-1.40)],M['gold'],.045*scale,c);ob['feature']='linker';objects.append(ob)
    for feature,center,mat in [('gcamp',(.9,0,-1.80),M['green']),('mcherry',(-1.75,.1,-1.75),M['rose'])]:
        for j in range(11):
            a=j*math.tau/11;cx,cy,cz=center
            ob=tube(feature+'_barrel',[p(cx+.30*math.cos(a),cy+.30*math.sin(a),cz-.34),p(cx+.35*math.cos(a+.16),cy+.35*math.sin(a+.16),cz),p(cx+.30*math.cos(a+.30),cy+.30*math.sin(a+.30),cz+.34)],mat,.075*scale,c);ob['feature']=feature;objects.append(ob)
    # A phospholipid cutaway with an open central pore, not an opaque slab.
    for ix in range(-8,9):
        for iy in range(-3,4):
            x=ix*.30;y=iy*.32
            if abs(x)<1.03 and abs(y)<.58:continue
            for z in [-.45,.45]:
                ob=b.sphere('membrane_head',p(x,y,z),(.105*scale,)*3,M['cream'],c,12,8);ob['feature']='membrane';objects.append(ob)
                ob=tube('membrane_tail',[p(x,y,z*.8),p(x+.035,y,z*.2)],M['paper'],.022*scale,c);ob['feature']='membrane';objects.append(ob)
    return objects

def path(c,number,pts,M):
    b.curve('FLIGHT_PATH_%02d'%number,pts,M['green_soft'],.005,c)
    b.empty('STAGE_ANCHOR_%02d'%number,pts[-1],c)

def assets():
    b.wipe();b.setup_scene();M=palette();master=b.coll('MASTER');b.lights(master)
    fc=b.coll('FLY_ASSET',master);fly(fc,M);export(fc,OUT/'aerosense_fly_v3.glb')
    # Warehouse: retain useful geometry and semantic anchors, improve illumination / signage.
    warehouse=b.scene_warehouse(master,M)
    for ob in list(warehouse.objects):
        if 'Bag' in ob.name or 'Sack' in ob.name or ob.name=='VOC_SOURCE_A':
            x,y,z=ob.location;top=z+ob.dimensions.z*.46
            b.sphere('Sack_neck',(x,y,top),(.10,.09,.08),M['sack'],warehouse,16,8)
            tube('Sack_seam',[(x-.12,y-.22,z-.2),(x-.14,y-.25,z),(x-.09,y-.20,z+.25)],M['paper'],.008,warehouse)
            b.cube('Batch_tag',(x,y-.27,z+.04),(.105,.009,.10),M['cream'],.005,warehouse)
    for y in [-5,-1,3]:
        for x in [-4.7,4.7]:
            b.cube('Window_luminous',(x,y,2.4),(.025,.65,.7),M['cyan'],.05,warehouse)
    text('Food_label','STORED FOOD',(.5,-4.55,2.65),.34,M['cream'],warehouse,rot=(math.pi/2,0,math.pi))
    olf=b.coll('SCENE_02_OLFACTION',master)
    # A membrane landscape with receptors ahead, and sensory hairs at the edges.
    for i in range(18):
        y=5-i*.54
        for side in [-1,1]:
            tube('Sensillum',[(side*2.8,y,0),(side*2.35,y-.3,.7),(side*2.12,y-.6,1.2)],M['gold'],.09,olf)
            b.sphere('Sensory_surface',(side*3.3,y,-.5),(1,.46,.7),M['paper'],olf,16,8)
    obs=receptor(olf,M,(0,-2.4,1.6),1.25)
    for ob in list(obs):
        if ob.get('feature') in ['gcamp','mcherry','linker']:
            obs.remove(ob);bpy.data.objects.remove(ob,do_unlink=True)
    # Turn the membrane upright; the player approaches the ligand-binding surface.
    pivot=b.empty('RECEPTOR_MEMBRANE',(0,-2.4,1.6),olf)
    for ob in obs:ob.parent=pivot;ob.matrix_parent_inverse=pivot.matrix_basis.inverted()
    pivot.rotation_euler.x=math.pi/2
    b.empty('OR_ACTIVE_1',(-.55,-1.9,1.6),olf)
    for j in range(16):
        y=4.7-j*.42;b.sphere('ODOR_particle',(.25*math.sin(j*.6),y,1.7+.14*math.cos(j)),(.055,)*3,M['gold'],olf,12,8)
    path(olf,2,[(0,5.2,1.55),(.3,3,1.7),(-.25,1,1.65),(0,-1.5,1.6),(0,-2.6,1.6)],M)
    cell=b.scene_cell(master,M)
    # Smooth organelles and clustered reporter surfaces establish scale and direction.
    for i in range(12):
        a=i*math.tau/12
        b.sphere('Organelle',(2.7*math.cos(a),-.8+2.7*math.sin(a),.7),(.23,.48,.22),M['orco'],cell,20,10)
    for j in range(12):
        a=j*math.tau/12
        tube('GCAMP_ribbon',[(.2+.22*math.cos(a),-1.5+.22*math.sin(a),1.1),(.2+.25*math.cos(a+.2),-1.5+.25*math.sin(a+.2),1.45),(.2+.22*math.cos(a+.3),-1.5+.22*math.sin(a+.3),1.8)],M['green'],.046,cell)
    hardware=b.scene_hardware(master,M);decoder=b.scene_decoder(master,M);ret=b.scene_return(master,M)
    scs=[warehouse,olf,cell,hardware,decoder,ret];names=['warehouse','olfaction','cell','hardware','decoder','return']
    merge_features(olf)
    for i,(c,name) in enumerate(zip(scs,names),1):export(c,OUT/f'aerosense_{i:02d}_{name}_v3.glb')
    pc=b.coll('PARTS_ASSET',master);receptor(pc,M);merge_features(pc);export(pc,OUT/'aerosense_receptor_v3.glb')
    bpy.ops.wm.save_as_mainfile(filepath=str(Path(__file__).parent/'AeroSense_v3.blend'))
    # Render honest static fallbacks for each world and the parts viewer.
    s=bpy.context.scene;s.render.resolution_x=1000;s.render.resolution_y=625
    s.render.engine='BLENDER_EEVEE'
    if hasattr(s,'eevee'):s.eevee.taa_render_samples=24
    for i,c in enumerate(scs+[pc]):
        camera=b.camera_look('Preview', (3.7,6.8,3.3) if i==6 else (0,7,2.7),(0,0,-.5) if i==6 else (0,-2,1.4),40 if i==6 else 30)
        allowed=set(c.all_objects)|set(master.objects)|{camera}
        for ob in s.objects:ob.hide_render=ob not in allowed
        b.render(s,camera,PREV/('parts.png' if i==6 else f'{i+1:02d}_{names[i]}_v3.png'))
    print('V3_ASSETS_COMPLETE',flush=True)

def film(preview=False):
    b.wipe();b.setup_scene();M=palette();c=b.coll('CINEMA');b.lights(c);s=bpy.context.scene
    s.view_settings.exposure=-1.35
    # A composed still-life: large food forms, dark negative space for HTML title,
    # porcelain concept reader, controlled highlights and a shared camera.
    floor=b.cube('Studio',(0,0,-.4),(25,25,.2),M['floor'],.1,c)
    b.cube('Plinth',(1.4,0,-.13),(2.35,1.5,.13),M['wood'],.12,c)
    for y in [-1.4,1.4]:
        for z in [.12,.37,.62]:b.cube('Crate_slats',(1.4,y,z),(2.4,.045,.09),M['wood'],.035,c)
    for x in [-.96,3.76]:b.cube('Crate_end',(x,0,.35),(.055,1.45,.36),M['wood'],.045,c)
    fruit=b.material('Fresh_citrus',(.95,.29,.025),.42)
    nodes=fruit.node_tree.nodes;links=fruit.node_tree.links;noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=85
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.24;bump.inputs['Distance'].default_value=.04
    links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])
    for ix in range(5):
        for iy in range(3):
            x=-.46+ix*.88+random.uniform(-.06,.06);y=-.9+iy*.86+random.uniform(-.06,.06);z=.58+random.random()*.09
            k=random.uniform(.94,1.05);b.sphere('Citrus',(x,y,z),(.45*k,.43*k,.44*k),fruit,c,32,20)
            b.sphere('Calyx',(x,y,z+.432),(.08,.08,.027),M['or'],c,16,8)
            leaf=b.sphere('Leaf',(x+.13,y,z+.47),(.19,.065,.027),M['or'],c,20,10);leaf.rotation_euler.z=.6
    # A separate little coffee sample reinforces the project's stored-food setting.
    for i in range(28):
        x=random.uniform(-1.4,0);y=random.uniform(-2.4,-1.6)
        ob=b.sphere('Coffee_bean',(x,y,-.04),(.105,.155,.085),M['coffee'],c,16,8);ob.rotation_euler.z=random.uniform(0,6)
        groove=tube('Bean_groove',[(x-.018,y-.12,.025),(x+.015,y,.042),(x-.005,y+.12,.025)],M['black'],.011,c)
    device=b.empty('Concept_reader',c=c)
    for ob in [b.cube('Reader_body',(4.7,.15,.70),(.65,.52,.87),M['cream'],.18,c),b.cube('Reader_screen',(4.7,-.385,.91),(.46,.025,.34),M['black'],.065,c),b.cube('Reader_LED',(4.7,-.42,.3),(.25,.016,.022),M['green'],.015,c)]:b.parent(ob,device)
    text('Brand','AeroSense',(4.7,-.416,.56),.13,M['cream'],c)
    for i in range(24):
        tube('Screen_wave',[(4.32+i*.03,-.418,.9),(4.35+i*.03,-.418,.90+.12*math.sin(i*.9))],M['green'],.012,c)
    # Dedicated lighting: warm key, teal rim, generous area lights.
    for loc,color,power,size in [((1,-4,7),(1,.79,.52),1800,6),((4,3,5),(.34,1,.77),1700,4),((-4,0,4),(.38,.67,1),1000,5)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((1,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
    camera=b.camera_look('Film_camera',(-.5,-10,5.6),(1.6,0,.5),40);s.camera=camera
    for f,loc,target in [(1,(-.5,-10,5.6),(1.6,0,.5)),(72,(.7,-8.7,4.7),(1.7,0,.6)),(144,(2.2,-8.2,4.2),(2.35,0,.65))]:
        camera.location=loc;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.keyframe_insert('location',frame=f);camera.keyframe_insert('rotation_euler',frame=f)
    s.frame_start=1;s.frame_end=144;s.render.fps=24;s.render.resolution_x=1280;s.render.resolution_y=720
    if hasattr(s,'eevee'):s.eevee.taa_render_samples=24
    # Bloom is baked into the MP4, not a replacement CSS animation.
    if hasattr(s,'compositing_node_group'):
        tree=bpy.data.node_groups.new('Film_bloom','CompositorNodeTree');s.compositing_node_group=tree
        tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor');out=tree.nodes.new('NodeGroupOutput')
    else:
        s.use_nodes=True;tree=s.node_tree;tree.nodes.clear();out=tree.nodes.new('CompositorNodeComposite')
    rl=tree.nodes.new('CompositorNodeRLayers');gl=tree.nodes.new('CompositorNodeGlare')
    if hasattr(gl,'glare_type'):gl.glare_type='FOG_GLOW';gl.quality='MEDIUM'
    else:gl.inputs['Type'].default_value='Fog Glow';gl.inputs['Threshold'].default_value=1.8;gl.inputs['Strength'].default_value=.5
    tree.links.new(rl.outputs['Image'],gl.inputs['Image']);tree.links.new(gl.outputs['Image'],out.inputs[0])
    dest=ROOT/'homepage_animation';dest.mkdir(exist_ok=True)
    def output(kind):
        if preview:
            s.frame_set(65);s.render.image_settings.file_format='PNG';s.render.filepath=str(PREV/f'film-{kind}.png');bpy.ops.render.render(write_still=True)
        else:
            if hasattr(s.render.image_settings,'media_type'):s.render.image_settings.media_type='VIDEO'
            s.render.image_settings.file_format='FFMPEG';s.render.ffmpeg.format='MPEG4';s.render.ffmpeg.codec='H264';s.render.ffmpeg.constant_rate_factor='HIGH';s.render.ffmpeg.gopsize=12;s.render.ffmpeg.use_max_b_frames=False;s.render.filepath=str(dest/f'aerosense-{kind}-v3.mp4');bpy.ops.render.render(animation=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(Path(__file__).parent/'AeroSense_Cinema_v3.blend'))
    output('visible')
    # Same geometry, camera keys, duration and seed: lens remains registered.
    nt=fruit.node_tree;bs=nt.nodes.get('Principled BSDF');ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.35;ramp.color_ramp.elements[0].color=(.025,.09,.025,1);ramp.color_ramp.elements[1].position=.64;ramp.color_ramp.elements[1].color=(.43,.19,.025,1)
    patch=nt.nodes.new('ShaderNodeTexNoise');patch.inputs['Scale'].default_value=5;patch.inputs['Detail'].default_value=3;nt.links.new(patch.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs[0],bs.inputs['Base Color'])
    for i in range(30):
        a=i*2.399;x=1.4+1.5*math.cos(a);y=.9*math.sin(a);z=.7+(i%8)*.28
        points=[(x+.20*math.sin(j*.5+a),y+.13*math.cos(j*.6+a),z+j*.11) for j in range(20)]
        ob=tube('VOC_ribbon',points,M['green'],.009 if i%3 else .017,c)
        for f in [1,72,144]:ob.location.z=.12*math.sin(f*.04+a);ob.keyframe_insert('location',frame=f)
        bead=b.sphere('VOC_particle',(x,y,z),(.035,)*3,M['green'],c,12,8)
        for f in [1,72,144]:bead.location.z=z+.16*math.sin(f*.06+a);bead.keyframe_insert('location',frame=f)
    bpy.ops.wm.save_as_mainfile(filepath=str(Path(__file__).parent/'AeroSense_Cinema_Signal_v3.blend'))
    output('scan');print('V3_FILM_COMPLETE',flush=True)

if __name__=='__main__':
    mode=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'assets'
    if mode=='assets':assets()
    else:film(mode=='preview')
