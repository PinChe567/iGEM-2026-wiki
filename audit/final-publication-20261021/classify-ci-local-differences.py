"""Resolve CI/local differences without saving a duplicate artifact ZIP or source tree."""
from pathlib import Path
import collections,datetime,difflib,hashlib,io,json,re,urllib.request,zipfile
A=Path(__file__).resolve().parent;R=A.parents[2];PUBLIC=R/'gitlab/nthu/public'
manifest=json.loads((A/'official-ci-public-hash-manifest.json').read_text(encoding='utf-8'))
with urllib.request.urlopen(urllib.request.Request(manifest['artifact_url'],headers={'User-Agent':'AeroSense-public-deployment-verification/1.0','Accept-Encoding':'identity'}),timeout=90) as response:archive=response.read()
assert hashlib.sha256(archive).hexdigest()==manifest['artifact_zip_sha256'],'CI artifact changed'
def comparable(data):
    return re.sub(rb'([?&]v=)[a-f0-9]{8,64}',rb'\1<CACHE_HASH>',re.sub(rb'\r+\n',b'\n',data))
results=[]
with zipfile.ZipFile(io.BytesIO(archive)) as zipped:
    for row in manifest['local_comparison']:
        if row['comparison']!='generated or source content differs':continue
        remote=zipped.read('public/'+row['path']);local=(PUBLIC/row['path']).read_bytes()
        equivalent=comparable(remote)==comparable(local)
        terminal_only=not equivalent and comparable(remote).rstrip(b'\n')==comparable(local).rstrip(b'\n')
        classification='line endings and cache version queries only' if equivalent else 'same normalized text; terminal newline differs' if terminal_only else 'requires difference review'
        result={'path':row['path'],'classification':classification,'ci_sha256':row['ci']['sha256'],'local_sha256':row['local']['sha256'],'scientific_text_unchanged_after_only_lf_and_cache_normalization':equivalent or terminal_only}
        result['repeated_crlf_sequences']={'ci':len(re.findall(rb'\r{2,}\n',remote)),'local':len(re.findall(rb'\r{2,}\n',local))}
        if terminal_only:
            result['terminal_lf_bytes']={'ci':len(comparable(remote))-len(comparable(remote).rstrip(b'\n')),'local':len(comparable(local))-len(comparable(local).rstrip(b'\n'))}
        if not equivalent and not terminal_only:
            lines=list(difflib.unified_diff(comparable(local).decode('utf-8',errors='replace').splitlines(),comparable(remote).decode('utf-8',errors='replace').splitlines(),fromfile='local',tofile='ci',n=1))
            result['bounded_diff']=[line[:600] for line in lines[:35]]
        results.append(result)
out={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'wiki_commit':manifest['wiki_commit'],'pipeline_id':manifest['pipeline_id'],'artifact_sha256_rechecked':True,'artifact_zip_saved':False,'scope':'Only the 66 non-exact/non-LF-only local comparisons; normalizes CRLF and repeated-CRLF sequences and hexadecimal ?v=/&v= cache query values, with a separate terminal-LF check. No other content is masked. The eight game HTML files contain one extra CR in a local CRCRLF before the injected footer; their line text is unchanged.','summary':dict(collections.Counter(r['classification'] for r in results)),'differences':results}
(A/'official-ci-local-difference-review.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'summary':out['summary'],'unresolved':[r for r in results if r['classification']=='requires difference review']},ensure_ascii=False))
