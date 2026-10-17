"""Build interface palettes from the supplied illustration colors; never edit image pixels."""
from pathlib import Path
from PIL import Image
import json
SITE=Path(__file__).resolve().parents[1];DS=SITE/'design_system'
data=json.loads((DS/'palettes-v14.json').read_text(encoding='utf8'))
art=Image.open(SITE/data['source']).convert('RGB')
crops={r['page']:r for r in json.loads((SITE/'assets/editorial/claude-v13/manifest.json').read_text(encoding='utf8'))['crops']}
def rgb(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
def hx(c): return '#'+''.join(f'{round(x):02x}' for x in c)
def mix(a,b,t): return hx([x*t+y*(1-t) for x,y in zip(rgb(a),rgb(b))])
def luminance(h):
 c=[v/255 for v in rgb(h)];c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]
 return sum(v*w for v,w in zip(c,[.2126,.7152,.0722]))
def contrast(a,b):
 a,b=sorted([luminance(a),luminance(b)])
 return (b+.05)/(a+.05)
css=['/* Generated from design_system/palettes-v14.json. Rebuild with scripts/build-illustration-palettes-v14.py. */']
proof=[]
for item in data['pages']:
 page=item['page'];crop=crops[page];paper=hx(art.getpixel((crop['x']+2,crop['y']+2)));a=item['accent'];d=item['dark'];s=item['secondary']
 selector='body.signal-atlas.page-'+page
 if page=='index':selector='body.signal-atlas.page-home'
 elif page=='safety-and-security':selector='body.signal-atlas.page-safety'
 elif page=='learning-platform':selector='body.signal-atlas.page-learning:not([data-learn-module])'
 elif page.startswith('learning-'):selector=f'body.signal-atlas.page-learning[data-learn-module="{page.split("-")[1]}"]'
 ground=mix(paper,'#ffffff',.38);soft=mix(a,paper,.04);tint=mix(paper,'#ffffff',.6)
 values={'v-accent':a,'v-dark':d,'v-secondary':s,'v-art-paper':paper,'v-page-ground':ground,'v-ink':mix(d,'#20251f',.68),'v-muted':mix(d,'#797772',.52),'v-pigment':mix(a,paper,.27),'v-soft':soft,'v-tint':tint,'v-rule':mix(a,paper,.23),'v-tape':mix(a,paper,.13),'v-cover-text':'#fffdf8','v-cover-muted':mix(a,'#ffffff',.12),'v-cover-panel':mix(a,d,.55),'v-sketch-soft':mix(a,paper,.6),'v-paper':ground,'v-sheet':'#ffffff'}
 css.append(selector+'{'+''.join('--'+k+':'+v+';' for k,v in values.items())+'}')
 checks={'whiteOnAccent':contrast('#ffffff',a),'coverText':contrast(values['v-cover-text'],d),'mutedOnGround':contrast(values['v-muted'],ground),'accentOnSoft':contrast(a,soft)}
 if min(checks.values())<4.5:raise ValueError((page,checks))
 proof.append({'page':page,'family':item['family'],'sourcePaper':paper,'accent':a,'cover':d,'contrast':{k:round(v,2) for k,v in checks.items()}})
(DS/'styles/illustration-palette.css').write_text('\n'.join(css)+'\n',encoding='utf8')
out=DS;out.mkdir(parents=True,exist_ok=True)
(out/'palette-contrast.json').write_text(json.dumps({'passed':True,'pages':proof},indent=2)+'\n',encoding='utf8')
print(json.dumps({'pages':len(proof),'minimumContrast':round(min(min(p['contrast'].values()) for p in proof),2)}))
