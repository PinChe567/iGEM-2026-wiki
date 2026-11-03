from pathlib import Path
from bs4 import BeautifulSoup
import json,os,re,collections,subprocess
base=Path(__file__).parent;root=base.parents[1];repo=root.parent/'gitlab/nthu'
files=[]
for subtree in ['code','docs']:
 result=subprocess.run(['rg','--files','--hidden','--no-ignore','-g','!**/node_modules/**','-g','!**/__pycache__/**',str(repo/subtree)],capture_output=True,text=True,encoding='utf-8')
 files.extend(Path(p).relative_to(repo).as_posix()for p in result.stdout.splitlines())
records=[]
for page in sorted(root.glob('*.html')):
 s=BeautifulSoup(page.read_text(encoding='utf-8'),'html.parser')
 for i,a in enumerate([a for a in s.select('a[href]')if '10.5281/zenodo.23469212' in a['href']]):
  label=a.get_text(' ',strip=True);source=label.split(' — ')[0].strip();container=a.find_parent('tr')or a.find_parent(['li','p','div']);context=container.get_text(' ',strip=True)
  rows=[f for f in files if f.endswith('/'+source)] if re.search(r'\.(csv|json|xlsx|mp4|zip|stl)$',source,re.I)else[]
  record={'page':page.name,'doi_link_index':i,'label':label,'source_context':context[:600],'candidate_paths':rows}
  if len(rows)==1:
   record.update(proposed_path=rows[0],route='exact_filename_suffix_match',proposed_url='https://gitlab.igem.org/2026/nthu/-/raw/main/'+rows[0])
  records.append(record)
(base/'doi-link-routing-proposal.json').write_text(json.dumps({'status_note_url':'https://gitlab.igem.org/2026/nthu/-/blob/main/docs/aerosense/archive-status.md','records':records},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':len(files),'links':len(records),'exact':sum('proposed_path'in x for x in records),'unmatched':[{k:x[k]for k in ['page','doi_link_index','label','candidate_paths']}for x in records if 'proposed_path'not in x]},ensure_ascii=False,indent=2))
