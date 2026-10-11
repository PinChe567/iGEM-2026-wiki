"""Archive the three explicitly supplied public wiki pages for a dated review."""
from pathlib import Path
from urllib.request import Request,urlopen
from datetime import datetime,timezone
import hashlib,json
P=Path(__file__).resolve().parent/'current_pages';P.mkdir(exist_ok=True)
rows=[]
for name in ['hardware','model','description']:
 url=f'https://pinche567.github.io/iGEM-2026-wiki/{name}.html'
 with urlopen(Request(url,headers={'User-Agent':'AeroSense-documentation-review/1.0'}),timeout=30) as response:
  data=response.read();status=response.status;final=response.url
 (P/f'{name}.html').write_bytes(data)
 rows.append({'file':name+'.html','url':url,'resolved_url':final,'status':status,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'retrieved_utc':datetime.now(timezone.utc).isoformat()})
 print(name,status,len(data),flush=True)
(P/'provenance.json').write_text(json.dumps(rows,indent=2),encoding='utf8')
