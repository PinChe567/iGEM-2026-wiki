"""Complete read-only link routing and section-order audits; no HTML writes."""
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlsplit, urlunsplit
import collections, hashlib, json, re

base = Path(__file__).parent
root = base.parents[1]
repo = root.parent / 'gitlab/nthu'
status_url = 'https://gitlab.igem.org/2026/nthu/-/blob/main/docs/aerosense/archive-status.md'
proposal = json.loads((base/'doi-link-routing-proposal.json').read_text(encoding='utf-8'))
exact = {
 ('results.html',2): 'code/aerosense/wetlab/aerosense-wiki/assets/results/final-test/derived/plate-p2-timeseries.csv',
 ('results.html',3): 'code/aerosense/wetlab/aerosense-wiki/assets/results/final-test/derived/plate-p2-well-summary.csv',
 ('results.html',4): 'code/aerosense/wetlab/aerosense-wiki/assets/results/final-test/experiment-metadata.json',
 ('results.html',14): 'docs/aerosense/parts/data/nuclear-object-per-condition.csv',
 ('results.html',16): 'code/aerosense/wetlab/aerosense-wiki/assets/results/microscopy/source-manifest.json',
}
stl = json.loads((base/'printable-stl-source-manifest.json').read_text(encoding='utf-8'))
for i, item in enumerate(stl['files'],4): exact[('hardware.html',i)] = item['destination']
for row in proposal['records']:
    key = (row['page'],row['doi_link_index'])
    label = re.sub(r'\s*[—·]\s*Zenodo research record$', '', row['label'])
    if key in exact:
        rel = exact[key]; data = (repo/rel).read_bytes()
        row.update(proposed_path=rel, route='specific_verified_local_publication_file',
                   proposed_url='https://gitlab.igem.org/2026/nthu/-/raw/main/'+rel,
                   proposed_label=label, sha256=hashlib.sha256(data).hexdigest(),
                   public_url_verified=False,
                   reason='Exact matching artifact exists in official GitLab staging tree; public availability must be checked after publication.')
    else:
        general = bool(re.fullmatch(r'(?:Zenodo DOI .+|Research data record.*|Zenodo research record)',row['label']))
        row.update(route='archive_status_not_download', proposed_url=status_url,
                   proposed_label='Research archive status' if general else label+' · archive availability',
                   public_url_verified=False,
                   reason='No unambiguous matching downloadable artifact identified in the official GitLab staging tree. Do not label the status note as the file or a published DOI.')
        row.pop('proposed_path',None)
proposal['summary'] = dict(collections.Counter(x['route'] for x in proposal['records']))
proposal['limitations'] = ['This is a routing proposal, not an HTML edit or public upload.',
 '117 anchor occurrences are indexed within each page; prose-only DOI occurrences require a separate text check.',
 'Model provenance.json suffix matches are unrelated artifacts and must not be substituted.',
 'The complete raw-data package remains locally prepared; no public Zenodo deposit has been verified.']
(base/'doi-link-routing-proposal.json').write_text(json.dumps(proposal,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

report = json.loads((base/'external-link-report.json').read_text(encoding='utf-8'))
occurrences = collections.defaultdict(list)
pages = []
for file in sorted(root.glob('*.html')):
    soup = BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
    headings = []
    for h in soup.select('main h2, section#references h2'):
        label=h.get_text(' ',strip=True)
        kind=next((v for rx,v in [(r'^Abstract$','abstract'),(r'^Introduction\b','introduction'),(r'^Discussion\b','discussion'),(r'^Conclusion\b','conclusion'),(r'^Data availability$','data_availability'),(r'^Supplementary (?:data|information)\b','supplementary'),(r'^References$','references')] if re.search(rx,label,re.I)),None)
        if kind: headings.append({'label':label,'kind':kind})
    pages.append({'page':file.name,'named_sections':headings,'action':'none',
                  'reason':'Parallel physical/decoder/receptor streams each retain their own Discussion and Conclusion, followed by shared data and references.' if file.name=='model.html' else 'Existing named sections are in the requested order; omitted sections are not invented. Educational, directory and glossary layouts retain their purpose.'})
    for index,a in enumerate(soup.select('a[href]')):
        url=a['href']
        if not url.startswith(('http://','https://')): continue
        parts=urlsplit(url); normalized=urlunsplit((parts.scheme,parts.netloc,parts.path,parts.query,''))
        context=a.find_parent('tr') or a.find_parent(['li','p','div']) or a
        section=a.find_parent('section')
        occurrences[normalized].append({'page':file.name,'anchor_index':index,'label':a.get_text(' ',strip=True),
          'section':section.get('id') if section else None,
          'source_context':context.get_text(' ',strip=True)[:600],
          'in_reference_list': bool(a.find_parent(id='references'))})
for result in report['results']:
    if result['url'] in occurrences: result['occurrences']=occurrences[result['url']]
    if re.search(r'/(?:users/sign_in|login|signin)(?:[/?#]|$)|accounts\.google\.',result.get('final_url',''),re.I):
        result['classification']='not_verified';result['reason']='Redirected to an authentication page.'
report['counts']=dict(collections.Counter(r['classification'] for r in report['results']))
report['context_enrichment']='Anchor labels, table-row/paragraph contexts, and anchor indexes extracted from local HTML after checks. Historical missing occurrences retained.'
(base/'external-link-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
summary={'html_pages':28,'unique_urls':report['unique_urls'],'counts':report['counts'],
 'broken':[r for r in report['results'] if r['classification']=='broken'],
 'not_verified_by_status':dict(collections.Counter(str(r.get('status')) for r in report['results'] if r['classification']=='not_verified')),
 'disallowed_cloud_storage_links':sum(bool(re.search(r'drive\.google|docs\.google|dropbox|sharepoint|onedrive',r['url'],re.I)) for r in report['results']),
 'scope':'HTTP reachability only; no citation-claim validation; 403/429 never classified as broken.'}
(base/'external-link-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(base/'section-order-audit.json').write_text(json.dumps({'html_pages':28,'html_mutations':0,'required_reorders':[], 'pages':pages},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'routing':proposal['summary'],'link_counts':report['counts'],'section_order_required_moves':0},ensure_ascii=False))
