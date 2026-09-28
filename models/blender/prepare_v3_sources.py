"""Give the editable Blender sources useful opening views and a fly portrait."""
from pathlib import Path
import sys,bpy
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
import build_aerosense_showcase_v2 as b
bpy.ops.wm.open_mainfile(filepath=str(HERE/'AeroSense_v3.blend'))
s=bpy.context.scene
s.render.resolution_x=1000;s.render.resolution_y=750;s.render.image_settings.file_format='PNG'
for name,collection,loc,target in [('AeroSense_Fly_v3','FLY_ASSET',(1.5,-2.5,1.8),(0,0,0)),('AeroSense_v3','PARTS_ASSET',(3,-7,3),(0,0,-.4))]:
    c=bpy.data.collections[collection]
    camera=b.camera_look('Editorial_camera',loc,target,48)
    s.camera=camera;allowed=set(c.all_objects)|{camera}|{o for o in s.objects if o.type=='LIGHT'}
    for o in s.objects:o.hide_render=o not in allowed;o.hide_set(o not in allowed)
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE/(name+'.blend')))
    if collection=='FLY_ASSET':b.render(s,camera,HERE.parent/'previews_v3/fly.png')
print('SOURCE_VIEWS_READY')
