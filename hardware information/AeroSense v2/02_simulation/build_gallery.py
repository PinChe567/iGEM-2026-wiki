"""Build the offline bilingual figure index from current figures and captions.
Run after all three simulation subfolders have generated their outputs.
"""
from pathlib import Path
import html, json

R=Path(__file__).resolve().parent
GROUPS=[('optics','光學','Optics'),('airflow','氣流與氣相傳輸','Airflow and gas transport'),('membrane','PDMS與液體傳輸','PDMS and liquid transport')]
STYLE='''*{box-sizing:border-box}body{margin:0;background:#f4f6f7;color:#17313f;font:16px/1.7 system-ui,"Microsoft JhengHei",sans-serif}header{padding:46px max(5vw,22px);background:#17313f;color:white}h1{font-size:clamp(28px,4vw,44px);line-height:1.25}header a{color:#a5e4df}main{max-width:1120px;margin:auto;padding:26px 20px}nav{display:flex;gap:18px;flex-wrap:wrap}a{color:#08797a}section{margin:36px 0}article{margin:25px 0;background:white;border:1px solid #d5e1e5;padding:22px;border-radius:12px}h2{font-size:26px}h3{font-size:18px;overflow-wrap:anywhere}figure{margin:18px 0}img,video{display:block;max-width:100%;width:100%;height:auto}figcaption{font-size:15px;margin-top:14px;white-space:pre-line}.links{display:flex;gap:18px;flex-wrap:wrap}.note{background:#fff5df;border-left:4px solid #ba923f;padding:18px;margin:24px 0}.muted{font-size:14px;color:#506775}code{background:#eaf0f3;padding:2px 5px}footer{padding:20px 0;border-top:1px solid #d5e1e5}'''

def e(v):return html.escape(str(v))
def link(path,text):return f'<a href="{e(path)}">{e(text)}</a>'
def caption(data,name,lang):
    row=data.get(name,data.get('figures',{}).get(name,{}))
    if isinstance(row,str):return row
    if not isinstance(row,dict):return ''
    value=row.get(lang,row.get('caption_'+lang,''))
    if isinstance(value,dict):value=value.get('caption','')
    return value

def build():
 for lang in ['ZH','EN']:
    T=lambda zh,en:zh if lang=='ZH' else en
    body=[]
    for folder,zh,en in GROUPS:
        d=R/folder
        if not d.exists():continue
        cap_path=d/'captions.json'
        caps=json.loads(cap_path.read_text(encoding='utf8')) if cap_path.exists() else {}
        group=[f'<section id="{folder}"><h2>{e(T(zh,en))}</h2><div class="links">']
        for p,label in [(d/f'Figure_Guide_{lang}.md',T('逐圖說明與重現','Figure notes and reproduction')),(d/f'Analysis_{lang}.md',T('分析報告','Analysis')),(d/f'Airflow_Analysis_{lang}.md',T('分析報告','Analysis'))]:
            if p.exists():group.append(link(p.relative_to(R).as_posix(),label))
        group.append('</div>')
        for p in sorted(d.rglob('*.html')):
            if p.name.startswith(('index','INDEX')):continue
            group.append('<p>'+link(p.relative_to(R).as_posix(),T('互動圖：','Interactive: ')+p.stem)+'</p>')
        for p in sorted((d/'figures').glob('*.png')):
            relative=p.relative_to(R).as_posix()
            cap=caption(caps,p.name,lang)
            note=d/'figure_notes'/f'{p.stem}_{lang}.md'
            group.append(f'<article><h3>{e(p.stem)}</h3><figure><a href="{e(relative)}"><img src="{e(relative)}" loading="lazy" alt="{e(p.stem)}"></a>')
            if cap:group.append('<figcaption>'+e(cap)+'</figcaption>')
            group.append('</figure>')
            if note.exists():group.append(link(note.relative_to(R).as_posix(),T('方法、結果、座標與圖例','Methods, results, axes and legends')))
            group.append('</article>')
        for p in sorted(d.glob('*.mp4')):
            relative=p.relative_to(R).as_posix();cap=caption(caps,p.name,lang)
            group.append(f'<article><h3>{e(p.stem)}</h3><video controls preload="metadata" src="{e(relative)}"></video>')
            if cap:group.append('<p>'+e(cap)+'</p>')
            note=d/'figure_notes'/f'{p.stem}_{lang}.md'
            if note.exists():group.append(link(note.relative_to(R).as_posix(),T('影片時間、訊號與模型說明','Video timing, signal and model notes')))
            group.append('</article>')
        group.append('</section>');body.extend(group)
    title=T('AeroSense 模擬圖與影片','AeroSense simulation figures and movies')
    nav=''.join(link('#'+n,T(z,en)) for n,z,en in GROUPS)
    intro=T('圖內保留標題、座標與圖例；完整解釋放在圖說與逐圖 Markdown。所有結果均為數值模型或明示的合成訊號，尚非實板或細胞量測。','Figures retain titles, axes and legends. Captions and individual Markdown notes explain methods and interpretation. Results are computations or explicitly synthetic signals, not physical-board or cell measurements.')
    note=T('使用者已確認：細胞貼附井底，每井100 µL。請分開閱讀氣相到達、薄膜傳輸、液體中擴散及光學讀取；其中一項通過，不代表整個生物感測流程通過。','Confirmed configuration: bottom-adherent cells and100 µL per well. Read gas arrival, membrane permeation, liquid diffusion and optical detection separately; success in one does not validate the full biological sensing chain.')
    alternate='EN' if lang=='ZH' else 'ZH'
    doc=f'<!doctype html><html lang="{T("zh-Hant","en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><style>{STYLE}</style></head><body><header><h1>{e(title)}</h1><p>{e(intro)}</p><nav>{link("INDEX_"+alternate+".html",T("English","繁體中文"))}{link("../START_HERE.html",T("完整package入口","Package home"))}</nav></header><main><nav>{nav}</nav><p class="note">{e(note)}</p>'+''.join(body)+f'<footer>{e(T("重建此索引：python build_gallery.py；各模型的重現指令請看該區Figure Guide。","Rebuild this index: python build_gallery.py. Model reproduction commands are in each Figure Guide."))}</footer></main></body></html>'
    (R/f'INDEX_{lang}.html').write_text(doc,encoding='utf8')
    print(f'INDEX_{lang}.html')

if __name__=='__main__':build()
