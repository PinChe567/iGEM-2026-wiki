"""Prepare faithful print copies and local verified assets; canonical HTML remains untouched."""
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import unquote,urlsplit,quote
import json,hashlib,subprocess,mimetypes,re

ROOT=Path(__file__).resolve().parents[3]
SITE=ROOT/'aerosense-wiki'; GIT=ROOT/'gitlab/nthu'
FINAL=SITE/'audit/final-publication-20261021'; OUT=FINAL/'cdn-document-conversions'; OUT.mkdir(exist_ok=True)
PLAN=json.loads((Path(__file__).parent/'gitlab-hosting-correction-plan.json').read_text(encoding='utf8'))
LEDGER=json.loads((SITE/'igem-upload/verified-official-urls.json').read_text(encoding='utf8'))
CDN={r['official_url']:r for r in LEDGER}; BYSHA={r['source_sha256']:r for r in LEDGER if r.get('source_sha256')==r.get('response_sha256')}
SUPERSEDED={u:r for r in LEDGER for u in r.get('superseded_official_urls',[])}
CORRECTIONS=json.loads((FINAL/'verified-cdn-corrections-mapping.json').read_text(encoding='utf8'))
for r in CORRECTIONS['files']: BYSHA[r['sha256']]=r
STATUS='https://gitlab.igem.org/2026/nthu/-/blob/main/docs/aerosense/archive-status.md'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
sources=[r for r in PLAN['records'] if r['action']=='pending_document_pdf_render' and r['extension']=='.html']
required=set()
for r in sources:
    s=BeautifulSoup((ROOT/r['local_path']).read_text(encoding='utf8'),'html.parser')
    required.update(t['src'] for t in s.find_all('img',src=True))
    required.update(t['poster'] for t in s.find_all('video',poster=True))
names=set()
for url in required:
    if url not in CDN:
        assert url in SUPERSEDED,('Unrecognized historical image URL',url)
        continue
    for p in CDN[url]['source_paths']: names.add(Path(p).name)
args=['rg','--files','zenodo-release']
for name in sorted(names): args+=['-g',name]
paths=subprocess.check_output(args,cwd=ROOT,text=True,encoding='utf8').splitlines()
byname={}
for p in paths: byname.setdefault(Path(p).name,[]).append(ROOT/p)
assets={}; remote=[]
for url in sorted(required):
    if url not in CDN: continue
    record=CDN[url]; candidates=[]
    for p in record['source_paths']:
        candidates += [SITE/p,ROOT/'zenodo-release/aerosense-wiki'/p]
        candidates += byname.get(Path(p).name,[])
    matches=[]
    for p in dict.fromkeys(candidates):
        if p.is_file() and sha(p)==record['source_sha256']: matches.append(p)
    if not matches:
        remote.append({'url':url,'reason':'Exact historical source image is absent from current canonical locations; preserve the referenced verified CDN bytes instead of replacing with a changed current figure.','expected_sha256':record.get('response_sha256'),'ledger_proof':'aerosense-wiki/igem-upload/verified-official-urls.json'})
        continue
    source=matches[0]
    assets[url]={'local_path':str(source),'sha256':sha(source),'mime_type':mimetypes.guess_type(source.name)[0] or 'application/octet-stream','cdn_verification_grade':record.get('verification_grade'),'cdn_response_sha256':record.get('response_sha256'),'source_to_cdn_proof':'aerosense-wiki/igem-upload/verified-official-urls.json'}

PRINT_CSS='''
@page {size: A4 landscape; margin: 12mm 12mm 16mm;}
html,body{background:#fff!important;color:#17262d!important;font-family:Arial,Helvetica,sans-serif!important;font-size:10pt!important;line-height:1.42!important;max-width:none!important;width:auto!important;margin:0!important;padding:0!important;overflow:visible!important;}
main,article,section,aside,.container,.wrapper,.card,.panel,.sheet{max-width:none!important;width:auto!important;margin-left:0!important;margin-right:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;}
main{padding:0!important;border:0!important;}
h1{font-size:21pt!important;line-height:1.15!important;margin:4mm 0 5mm!important;}
h2{font-size:15pt!important;margin:6mm 0 3mm!important;line-height:1.2!important;break-after:avoid;}
h3{font-size:12pt!important;margin:4mm 0 2mm!important;line-height:1.2!important;break-after:avoid;}
h4{font-size:10pt!important;margin:3mm 0 2mm!important;break-after:avoid;}
p,li,dd,dt{font-size:10pt!important;line-height:1.42!important;orphans:3;widows:3;}
p{margin:2.5mm 0!important;}
table{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;font-size:8pt!important;margin:3mm 0 5mm!important;break-inside:auto!important;}
thead{display:table-header-group!important;} tr{break-inside:avoid!important;}
th,td{font-size:8pt!important;line-height:1.3!important;text-align:left!important;vertical-align:top!important;min-width:0!important;max-width:none!important;padding:2mm!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;border:0.25mm solid #ccd8dd!important;color:#17262d!important;}
th{background:#eaf1f3!important;font-weight:700!important;}
td{background:transparent!important;}
.table-scroll,.table-wrap,.table-container{overflow:visible!important;width:auto!important;max-width:none!important;}
figure{margin:4mm 0!important;break-inside:avoid!important;max-width:100%!important;}
img,svg{display:block!important;max-width:100%!important;max-height:155mm!important;width:auto!important;height:auto!important;object-fit:contain!important;margin-left:auto!important;margin-right:auto!important;}
figcaption{font-size:9pt!important;line-height:1.35!important;margin-top:2mm!important;}
.re-story-figure img{max-height:130mm!important;}
.re-figure-links{margin:1mm 0!important;font-size:8pt!important;break-before:avoid!important;}
a{color:#1b5964!important;text-decoration:underline!important;overflow-wrap:anywhere!important;}
code,pre{font-size:8.5pt!important;line-height:1.35!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;max-width:100%!important;}
details{display:block!important;} details>summary{font-weight:700!important;}
details>*{display:block!important;} [hidden]{display:block!important;}
.visually-hidden,.sr-only{display:block!important;position:static!important;clip:auto!important;clip-path:none!important;width:auto!important;height:auto!important;margin:2mm 0!important;overflow:visible!important;white-space:normal!important;}
.grid,.cards,.columns,.two-col{display:block!important;}
'''
records=[]
for r in sources:
    source=ROOT/r['local_path']; html=source.read_text(encoding='utf8'); soup=BeautifulSoup(html,'html.parser')
    original_text=soup.body.get_text(' ',strip=True) if soup.body else soup.get_text(' ',strip=True)
    changes=[]
    json_reflow=[]
    for pre in soup.find_all('pre'):
        raw=pre.get_text()
        try: parsed=json.loads(raw)
        except (ValueError,TypeError): continue
        # Remove indentation outside JSON strings, preserving every string/number lexeme.
        chars=[]; inside=False; escaped=False
        for char in raw:
            if inside:
                chars.append(char)
                if escaped: escaped=False
                elif char=='\\': escaped=True
                elif char=='"': inside=False
            elif char=='"': inside=True; chars.append(char)
            elif not char.isspace():
                chars.append(char)
                if char in ',:': chars.append(' ')
        compact=''.join(chars); assert json.loads(compact)==parsed
        pre.clear(); pre.append(compact)
        json_reflow.append({'original_characters':len(raw),'print_characters':len(compact),'parsed_value_identity':True,'numbers_and_strings_lexically_preserved':True})
    for node in soup.find_all('noscript'): node.name='div'
    relocated_figure_links=0
    for links in soup.select('.re-figure-links'):
        asset_link=links.find('a',href=True)
        if not asset_link: continue
        match=soup.find('img',src=asset_link['href'])
        figure=match.find_parent('figure') if match else None
        if figure:
            figure.append(links.extract()); relocated_figure_links+=1
    video_count=len(soup.find_all('video'))
    for video in soup.find_all('video'):
        assert video.get('poster'), 'A video without a static poster requires an explicit conversion decision.'
        wrapper=soup.new_tag('div')
        poster=soup.new_tag('img',src=video['poster'],alt=video.get('aria-label','Animation poster'))
        wrapper.append(poster)
        for child in list(video.contents): wrapper.append(child.extract())
        if 'airflow_comparison.mp4' in video.get('src',''):
            paragraph=soup.new_tag('p'); link=soup.new_tag('a',href='https://video.igem.org/w/2yZDbpFQo7BArcfWDsJoZB'); link.string='Watch the corresponding airflow animation — VideoUniverse'; paragraph.append(link); wrapper.append(paragraph)
        else: raise RuntimeError('Unmapped video '+video.get('src',''))
        video.replace_with(wrapper)
    for a in soup.find_all('a',href=True):
        href=a['href']; old_label=a.get_text(' ',strip=True)
        if href.startswith(('#','mailto:')): continue
        target=None; availability=False
        if href.startswith('https://gitlab.igem.org/2026/nthu/-/'):
            match=re.match(r'https://gitlab.igem.org/2026/nthu/-/(?:raw|blob)/main/(.*)',href)
            candidate=GIT/unquote(match.group(1)) if match else None
        elif not href.startswith(('https:','http:')):
            split=urlsplit(href); path=unquote(split.path)
            if path.endswith('.html') and Path(path).name in {'results.html','experiments.html','measurement.html','hardware.html','model.html'}:
                target='https://2026.igem.wiki/nthu/'+Path(path).stem+('#'+split.fragment if split.fragment else '')
                candidate=None
            else: candidate=(source.parent/path).resolve()
        else: continue
        if candidate and candidate.is_file():
            h=sha(candidate)
            if h in BYSHA: target=BYSHA[h]['official_url']
            elif candidate.suffix in {'.py','.md','.txt'}:
                target='https://gitlab.igem.org/2026/nthu/-/blob/main/'+quote(candidate.relative_to(GIT).as_posix(),safe='/')
            elif candidate.name=='nuclear-object-parameters.json':
                target='https://gitlab.igem.org/2026/nthu/-/blob/main/'+quote(candidate.relative_to(GIT).as_posix(),safe='/')
            else: target=STATUS; availability=True
        elif candidate:
            target=STATUS; availability=True
        if target and target!=href:
            a['href']=target
            if availability: a.append(' (archive availability)')
            changes.append({'old_href':href,'new_href':target,'old_label':old_label,'new_label':a.get_text(' ',strip=True)})
    for d in soup.find_all('details'): d['open']=''
    for image in soup.find_all('img'): image['loading']='eager'
    for link in soup.find_all('link'):
        if 'icon' in (link.get('rel') or []): link.decompose()
    style=soup.new_tag('style'); style.string=PRINT_CSS
    if soup.head: soup.head.append(style)
    else: soup.insert(0,style)
    name=source.stem+'.pdf'; prepared=OUT/(source.stem+'.print.html')
    prepared.write_text(str(soup),encoding='utf8')
    record={'source_path':str(source),'source_sha256':sha(source),'source_bytes':source.stat().st_size,'prepared_html':str(prepared),'pdf_path':str(OUT/name),'title':soup.title.get_text() if soup.title else source.stem,'image_count':len(soup.find_all('img')),'video_posters_preserved':video_count,'table_count':len(soup.find_all('table')),'table_row_counts':[len(t.find_all('tr')) for t in soup.find_all('table')],'headings':[h.get_text(' ',strip=True) for h in soup.find_all(['h1','h2','h3','h4'])],'original_body_text':original_text,'prepared_body_text':soup.body.get_text(' ',strip=True) if soup.body else soup.get_text(' ',strip=True),'link_routing':changes,'json_print_reflow':json_reflow,'figure_download_link_groups_kept_with_their_figure':relocated_figure_links}
    records.append(record)
manifest={'scope':'Six faithful HTML-to-PDF reading editions; no canonical HTML or scientific content mutated. Typography, wrapping and pagination adapted for paper. Links are routed only to existing verified CDN files, exact text sources, wiki pages, or accurate archive availability. Current verified canonical local image sources are used without downloading; historical superseded image URLs are preserved exactly and require one browser fetch rather than substituting current changed content.','assets':assets,'historical_remote_assets':remote+[{'url':u,'reason':'The report cites this historical CDN image; ledger marks it superseded. Preserve the exact historical referenced image instead of substituting the new changed figure.','ledger_replacement_not_used':SUPERSEDED[u]['official_url']} for u in sorted(required) if u not in CDN],'documents':records}
(OUT/'html-document-render-plan.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'documents':len(records),'verified_local_image_sources':len(assets),'files':[Path(r['pdf_path']).name for r in records]},indent=2))
