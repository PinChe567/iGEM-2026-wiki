"""Read-only geometry audit; writes only its own JSON and two drawings.
Run with Python + numpy, pillow, pypdf. It never exports or changes any STL.
Vendor footprint coordinates are extracted from the supplied TOP PDF, not photos.
"""
from pathlib import Path
import hashlib, json, struct
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
from pypdf.generic import ContentStream

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
DRAWINGS = OUT.parent / 'drawings'
DRAWINGS.mkdir(exist_ok=True)
PARAMS = json.loads((ROOT/'09_engineering_sources/CAD/design_parameters.json').read_text(encoding='utf-8'))
stl = ROOT/'01_print/01_base_BLACK.stl'
raw = stl.read_bytes(); n = struct.unpack_from('<I', raw, 80)[0]
dtype=np.dtype([('normal','<f4',3),('v','<f4',(3,3)),('a','<u2')])
tri=np.frombuffer(raw,dtype=dtype,count=n,offset=84)['v'].astype(float)

def segment_hits(origin, direction, length):
    o=np.array(origin,float); d=np.array(direction,float)
    e1=tri[:,1]-tri[:,0];e2=tri[:,2]-tri[:,0];h=np.cross(np.broadcast_to(d,e2.shape),e2)
    a=np.einsum('ij,ij->i',e1,h);valid=np.abs(a)>1e-9
    inv=np.zeros_like(a);inv[valid]=1/a[valid]
    s=o-tri[:,0];u=inv*np.einsum('ij,ij->i',s,h);q=np.cross(s,e1)
    v=inv*np.einsum('j,ij->i',d,q);t=inv*np.einsum('ij,ij->i',e2,q)
    mask=valid&(u>=-1e-8)&(v>=-1e-8)&(u+v<=1+1e-8)&(t>1e-6)&(t<length-1e-6)
    return sorted(set(np.round(t[mask],6).tolist()))

sample=[]
for x in np.linspace(-7.9,14.9,24):
    for z in np.linspace(27.1,39.5,14):
        h=segment_hits([x,-60,z],[0,1,0],16)
        sample.append({'x':float(x),'z':float(z),'hit_count':len(h)})
controls={}
for key,x,z in [('left_wall',-8.1,30),('right_wall',15.1,30),('window_roof',3.5,40),('tongue',3.5,42.5),('window_floor',3.5,26.9)]:
    controls[key]=segment_hits([x,-60,z],[0,1,0],16)

# Extract the highlighted Antenna Area from the original TOP PDF vector paths.
# Unit conversion is PDF points to mm; mirror X into the optical-face-up datum.
# The rectangle is a drawn footprint/antenna area, not a measured module outline.
pdf=ROOT/'08_reference/NTHU-TEST_BOARD_V1-TOP-0911.pdf'
reader=PdfReader(pdf)
T=np.eye(3); color=None; stack=[]; path=[]; candidates=[]
for args,op in ContentStream(reader.pages[0].get_contents(),reader).operations:
    if op==b'q':stack.append((T.copy(),color))
    elif op==b'Q':T,color=stack.pop()
    elif op==b'cm':
        aa,bb,cc,dd,ee,ff=map(float,args)
        T=T@np.array([[aa,cc,ee],[bb,dd,ff],[0,0,1.]])
    elif op==b'rg':color=tuple(map(float,args))
    elif op in (b'm',b'l'):
        q=T@np.array([float(args[0]),float(args[1]),1]);path.append(q[:2])
    elif op in (b'f',b'f*',b'B',b'B*',b'b',b'b*'):
        if color==(0.792,0.522,0.416) and len(path)>=4:
            vv=np.array(path);lo=vv.min(0);hi=vv.max(0);size=(hi-lo)*25.4/72
            if 19<size[0]<21 and 6<size[1]<7:candidates.append((lo,hi))
        path=[]
    elif op in (b'S',b's',b'n'):path=[]
assert len(candidates)==1, 'Vendor PDF changed: manually inspect the antenna rectangle.'
lo,hi=candidates[0];mm=25.4/72
area={'x':[-hi[0]*mm,-lo[0]*mm], 'y':[lo[1]*mm,hi[1]*mm]}
tip=area['y'][0];cx=sum(area['x'])/2
lip_y=-52.2
vertical={'vendor_tip':segment_hits([cx,tip,50],[0,0,-1],15),
          'overhang_7p4mm':segment_hits([cx,-52.4,50],[0,0,-1],15)}
assert all(s['hit_count']==0 for s in sample)
assert all(len(v)>0 for v in controls.values())
assert len(vertical['vendor_tip'])==0 and len(vertical['overhang_7p4mm'])>0
preserved=json.loads((OUT/'current_preservation.json').read_text(encoding='utf-8'))
baseline=preserved['print_folder_sha256']
cad_sha=hashlib.sha256((OUT.parent/'aerosense.scad').read_bytes()).hexdigest()
assert cad_sha==preserved['CAD_source_sha256'], 'CAD source changed: repeat the full audit before updating the preservation record.'
stl_preservation={}
for pp in sorted((ROOT/'01_print').glob('*.stl')):
    relative=pp.relative_to(ROOT).as_posix();actual=hashlib.sha256(pp.read_bytes()).hexdigest()
    assert actual==baseline[relative], 'STL changed relative to prior preserved release: '+relative
    stl_preservation[relative]=actual
assert len(stl_preservation)==8
data={'date':'2026-10-06','STLs_unchanged':8,'four_wells_unchanged':True,'STL_SHA256':stl_preservation,
      'CAD_source_sha256':cad_sha,'CAD_source_unchanged':True,
      'vendor_TOP_sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),
      'RF_status':'The present mechanical opening does not demonstrate the recommended 15-mm housing clearance; no RF model or measured radio qualification.',
      'base_stl_sha256':hashlib.sha256(raw).hexdigest(),'geometry_changed':False,
      'aperture_mm':PARAMS['ports']['antenna'],'aperture_front_rays':len(sample),
      'aperture_front_rays_all_clear':True,'solid_controls_hit_distances_mm':controls,
      'vertical_insertion_hit_distances_mm':vertical,'vendor_drawn_antenna_area_mm':area,
      'vendor_area_to_tongue_nominal_gap_mm':tip-lip_y,
      'vendor_drawn_area_overhang_mm':-45-tip,
      'vendor_area_to_final_inner_front_wall_mm':tip-(-53.6),
      'vertical_insertion_overhang_limit_mm':7.2,
      'interpretation':'Sampled STL rays and nominal vector geometry only; not a populated-board tolerance certificate or RF simulation.',
      'official_sources':['https://documentation.espressif.com/esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.pdf',
      'https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/pcb-layout-design.html#general-principles-of-pcb-layout-for-modules-positioning-a-module-on-a-base-board']}
(OUT/'Antenna_Clearance_Evidence.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')

FONT=next((str(p) for p in [Path('C:/Windows/Fonts/msjh.ttc'),Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')] if p.exists()),None)
if FONT is None:raise RuntimeError('A CJK font is required for both diagrams: edit FONT to an installed Unicode CJK font.')
def f(s):return ImageFont.truetype(FONT,s)
def make_drawing(language):
 im=Image.new('RGB',(1600,1170),'#f4f7fa');draw=ImageDraw.Draw(im)
 translations={'ESP32 天線：既有底座開口核對': 'ESP32 antenna: existing base opening audit', 'A   實際STL前壁 / front face': 'A   Actual STL front wall', 'B   中央剖面 / insertion path': 'B   Center section / insertion path', '開口寬 23 mm × 高 12.6 mm；正面可穿過。': 'Opening: 23 mm wide × 12.6 mm high.', '廠商繪製區到上緣舌榫：名義 ': 'Drawn antenna area to tongue: ', ' mm。': ' mm nominal.', '底座 / base': 'Base', '模組代理 / assumed module': 'Assumed module envelope', '既有切孔 / cut': 'Existing cut', '圖中模組高度是假設：裝於PCB下側、Z=34.9–38 mm；不是從照片量測。': 'Module height is assumed below PCB, Z=34.9–38 mm; not measured from photographs.', '粉紅 Antenna Area 的PDF向量尺寸為19.80 × 6.54 mm；不等於實物公差證明。': 'Vendor Antenna Area vector: 19.80 × 6.54 mm; this is not a physical tolerance certificate.', '垂直放入時，上方舌榫比最終前壁更靠內：超過7.2 mm凸出可能卡住。': 'Vertical insertion meets the tongue first: overhang >7.2 mm may catch its inner edge.', '機構能放入 ≠ RF已驗證。Espressif建議天線周圍15 mm淨空，仍須裝殼通訊測試。': 'Mechanical fit ≠ RF qualification. Espressif recommends 15 mm housing clearance; test radio.'}
 def txt(x,y,t,size=23,color='#203a4a'):
     if language=='EN':
         for old,new in translations.items():t=t.replace(old,new)
         if len(t)>90 and size>=23:size=22
     draw.text((x,y),t,font=f(size),fill=color)
 txt(55,30,'ESP32 天線：既有底座開口核對',38)
 txt(55,86,'Existing base STL + nominal vendor drawing · no geometry changes',24,'#506977')

 def panel(rect,title,xmin,xmax,zmin,zmax):
     x0,y0,x1,y1=rect;draw.rounded_rectangle(rect,radius=12,fill='white',outline='#cbd8e0',width=2)
     txt(x0+22,y0+16,title,25)
     area=(x0+72,y0+80,x1-28,y1-64)
     def xy(x,z):return (area[0]+(x-xmin)/(xmax-xmin)*(area[2]-area[0]),area[3]-(z-zmin)/(zmax-zmin)*(area[3]-area[1]))
     def box(xa,xb,za,zb,fill,outline=None):
         a=xy(max(xmin,xa),max(zmin,za));b=xy(min(xmax,xb),min(zmax,zb))
         draw.rectangle([a[0],b[1],b[0],a[1]],fill=fill,outline=outline,width=2)
     for z in np.arange(np.ceil(zmin/5)*5,zmax+1e-6,5):
         a=xy(xmin,z);b=xy(xmax,z);draw.line([a,b],fill='#e4ebef');txt(x0+16,a[1]-12,str(int(z)),18)
     for x in np.arange(np.ceil(xmin/5)*5,xmax+1e-6,5):
         a=xy(x,zmin);b=xy(x,zmax);draw.line([a,b],fill='#e4ebef');txt(a[0]-16,area[3]+12,str(int(x)),18)
     txt(x0+12,y0+51,'Z / mm',17)
     return xy,box,area

 xy,bx,ar=panel((45,145,790,725),'A   實際STL前壁 / front face',-14,20,24,46)
 layer=Image.new('RGBA',im.size,(0,0,0,0));ld=ImageDraw.Draw(layer)
 front=tri[np.max(np.abs(tri[:,:,1]+56),axis=1)<0.0001]
 for t in front:
     if np.all(t[:,2]<24) or np.all(t[:,2]>46):continue
     points=[xy(v[0],min(46,max(24,v[2]))) for v in t]
     ld.polygon(points,fill='#465867')
 cropbox=tuple(map(int,ar));im.paste(layer.crop(cropbox),cropbox,layer.crop(cropbox))
 # The front-face cut reveals the interior. Cyan outline denotes the actual cut.
 bx(-8,15,27,39.6,None,'#168fa3')
 # Nominal 18-mm module width, shown as a proxy; mounting Z is still an assumption.
 bx(cx-9,cx+9,34.9,38,'#e1aa4e','#986d29')
 txt(380,696,'X / mm',18)
 txt(95,744,'開口寬 23 mm × 高 12.6 mm；正面可穿過。',23)
 txt(95,780,'Window is open through the front wall.',21)

 xy2,bx2,ar2=panel((810,145,1555,725),'B   中央剖面 / insertion path',-60,-36,24,46)
 bx2(-56,-53.6,24,27,'#465867')
 bx2(-56,-53.6,39.6,42,'#465867')
 bx2(-54.2,-52.2,41.8,43.3,'#465867')
 bx2(-56,-44,27,39.6,None,'#168fa3')
 bx2(-45,-36,38,39.6,'#4f967a')
 bx2(tip,-36,34.9,38,'#e1aa4e','#986d29')
 for y in [tip,lip_y]:
     a=xy2(y,38);b=xy2(y,45)
     draw.line([a,b],fill='#a16427',width=2)
 a=xy2(-49.5,45);b=xy2(-49.5,41)
 draw.line([a,b],fill='#168fa3',width=4)
 draw.polygon([b,(b[0]-7,b[1]-12),(b[0]+7,b[1]-12)],fill='#168fa3')
 txt(1150,696,'Y / mm',18)
 txt(850,744,f'廠商繪製區到上緣舌榫：名義 {tip-lip_y:.2f} mm。',23)
 txt(850,780,'Actual overhang and mounting Z must be checked.',21)

 draw.rounded_rectangle((55,838,1545,1123),radius=10,fill='#e9f1f5')
 for x,c,t in [(85,'#465867','底座 / base'),(410,'#4f967a','PCB'),(610,'#e1aa4e','模組代理 / assumed module'),(1160,'#168fa3','既有切孔 / cut')]:
     draw.rectangle((x,862,x+22,884),fill=c);txt(x+33,855,t,21)
 txt(85,910,'圖中模組高度是假設：裝於PCB下側、Z=34.9–38 mm；不是從照片量測。',24)
 txt(85,952,'粉紅 Antenna Area 的PDF向量尺寸為19.80 × 6.54 mm；不等於實物公差證明。',24)
 txt(85,994,'垂直放入時，上方舌榫比最終前壁更靠內：超過7.2 mm凸出可能卡住。',24)
 txt(85,1036,'機構能放入 ≠ RF已驗證。Espressif建議天線周圍15 mm淨空，仍須裝殼通訊測試。',24)
 txt(55,1136,'Source: supplied TOP PDF, selected 01_base_BLACK.stl and Espressif documentation. Units: mm.',18,'#506977')
 im.save(DRAWINGS/('Antenna_Clearance_'+language+'.png'))

make_drawing('ZH')
make_drawing('EN')
print(json.dumps(data,ensure_ascii=False,indent=2))
