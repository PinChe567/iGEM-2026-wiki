from pathlib import Path
import urllib.request,hashlib,json

HERE=Path(__file__).resolve().parent
SITE=HERE.parents[1];WORK=HERE.parents[2]
FIGS=WORK/'zenodo-release/aerosense-wiki/data/signal-metric-clarification-2026-10-21/figures'
checks=[]
for name in ['pairwise-pearson-spearman','pairwise-pearson-spearman-mobile']:
    source=FIGS/(name+'.svg');url='https://static.igem.wiki/teams/6460/wiki/hardware/'+source.name
    request=urllib.request.Request(url,headers={'User-Agent':'AeroSense-publication-verification/1.0'})
    with urllib.request.urlopen(request,timeout=45) as response:
        body=response.read();status=response.status;mime=response.headers.get('Content-Type','')
    assert status==200 and hashlib.sha256(body).digest()==hashlib.sha256(source.read_bytes()).digest()
    assert 'svg' in mime
    checks.append({'url':url,'source':str(source.relative_to(WORK)),'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'status':status,'content_type':mime,'verification':'full GET exact SHA256'})

p=SITE/'hardware.html';old=p.read_text(encoding='utf8');s=old
for row in checks:
    old_name='pairwise-correlations-mobile.svg' if 'mobile' in row['url'] else 'pairwise-correlations.svg'
    import re
    pattern=r'https://static\.igem\.wiki/[^"<> ]*/[^"<> ]*'+old_name
    matches=re.findall(pattern,s)
    assert matches,old_name
    for url in set(matches):s=s.replace(url,row['url'])
p.write_text(s,encoding='utf8',newline='\n')
receipt={'assets':checks,'before_hardware_sha256':hashlib.sha256(old.encode()).hexdigest(),'after_hardware_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'routing':'Only Figure20 desktop/mobile href/src/srcset URLs replaced after successful full GET.'}
(HERE/'verified-pairwise-official-assets.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
print(json.dumps(receipt,indent=2))
