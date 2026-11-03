"""Archive only the frozen PDF-reader build recipe and direct CI integration."""
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
import argparse, csv, hashlib, json, os, shutil, subprocess

ROOT=Path(__file__).resolve().parents[3]
REPO=ROOT/'gitlab/nthu';ARCHIVE=ROOT/'zenodo-release'
AUDIT=ROOT/'aerosense-wiki/audit/final-publication-20261021'
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--cdn',action='store_true');args=parser.parse_args()
DEST=ARCHIVE/'reproduction-source'/('wiki-pdf-reader-cdn-20261021' if args.cdn else 'wiki-pdf-reader-build-20261021')
SELECTED={
 'site/scripts/build-pdfjs.mjs':'Recreates and SHA-checks reviewed PDF.js browser modules from the pinned npm package.',
 'site/tooling/pdfjs/package.json':'Pins PDF.js 6.4.299 and declares the Node runtime requirement.',
 'site/tooling/pdfjs/package-lock.json':'Exact npm version/integrity record; optional native canvas dependencies are omitted by the build.',
 'site/js/vendor/pdfjs-6.4.299/LICENSE':'Retained upstream Apache-2.0 notice, explicitly outside team MIT relicensing.',
 '.gitlab-ci.yml':'Official build invocation and pinned Node/Python images.',
 'site/scripts/ci-build.py':'Local equivalent build invocation and Node >=22.13 prerequisite guard.',
 'ci/check-source.py':'Checks the pinned dependency and required editable build sources.',
 'ci/copy-site-source.py':'Copies only editable input; excludes generated PDF modules and enforces the source size limit.',
 'ci/prepare-publication.py':'Includes generated PDF modules in the Pages output manifest.',
 '.gitignore':'Keeps node_modules and generated PDF bundles out of Git inputs.',
 'README.md':'Documents the source-only publication and rebuild workflow.',
 'site/publication-files.json':'Frozen publication path list identifying the generated PDF runtime outputs.',
}
if args.cdn:
 SELECTED.update({
  'site/js/pdf-reader.js':'Actual PDF reader with the two official CDN module URLs; preserves the runtime integration source.',
  '.gitlab-ci.yml':'Official stages no longer generate or package PDF.js modules; other build steps remain.',
  'site/scripts/ci-build.py':'Local build counterpart retaining the recipe as optional reproduction source, without packaging the modules.',
  'ci/check-source.py':'Checks retained dependency recipe and exact official runtime module URLs.',
  'ci/prepare-publication.py':'Excludes CDN-served PDF modules from generated Pages output.',
  'site/publication-files.json':'Frozen 259-entry runtime path list excluding the CDN-served PDF modules.',
 })
def native(p):
 s=str(p.absolute());return Path('\\\\?\\'+s) if os.name=='nt' and len(s)>=240 and not s.startswith('\\\\?\\') else p
def sha(p):
 h=hashlib.sha256()
 with native(p).open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def read(p):return json.loads(native(p).read_text(encoding='utf-8-sig'))
def write(p,d):native(p.parent).mkdir(parents=True,exist_ok=True);native(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

assert sha(REPO/'site/scripts/ci-build.py')==('c16967154ccef3d3b85d6d99ff349a1e4b598d31f08689bf6e6e0fd94f1bf228' if args.cdn else '3568de740ccc30de7cb5eb6ffb5e5264ed0a2d780a45081b02e8c2dccde2da65')
sources=[{'repository_path':p,'role':role,'sha256':sha(REPO/p),'bytes':native(REPO/p).stat().st_size}for p,role in SELECTED.items()]
wanted={r['sha256']for r in sources};sizes={r['bytes']for r in sources};existing={}
for name in subprocess.check_output(['rg','--files','--hidden','zenodo-release'],cwd=ROOT,text=True,encoding='utf8').splitlines():
 p=ROOT/name
 if native(p).stat().st_size not in sizes:continue
 digest=sha(p)
 if digest in wanted:existing.setdefault(digest,[]).append(p)
new=[];rows=[]
for source in sources:
 if source['sha256'] in existing:
  target=min(existing[source['sha256']],key=lambda p:(len(str(p)),str(p)));action='reuse_exact_canonical'
 else:
  target=DEST/source['repository_path'];assert target.resolve().is_relative_to(DEST.resolve())
  assert not native(target).exists(),'Existing edition must never be overwritten.'
  native(target.parent).mkdir(parents=True,exist_ok=True);shutil.copyfile(native(REPO/source['repository_path']),native(target))
  assert sha(target)==source['sha256'];existing[source['sha256']]=[target];action='preserve_missing_exact_build_source';new.append({**source,'canonical':target.relative_to(ROOT).as_posix()})
 rows.append({**source,'canonical':target.relative_to(ROOT).as_posix(),'action':action})
for row in rows:
 assert sha(REPO/row['repository_path'])==row['sha256'] and sha(ROOT/row['canonical'])==row['sha256']
lock=read(REPO/'site/tooling/pdfjs/package-lock.json')['packages']['node_modules/pdfjs-dist']
metadata={'created_at_utc':datetime.now(timezone.utc).isoformat(),'scope':'Minimal exact-byte preservation of the PDF.js build recipe and its directly changed Wiki CI integration. This is not a whole-site backup, self-contained offline npm mirror, Software research manifest change, or public-deployment claim.','repository':'https://gitlab.igem.org/2026/nthu','publication_commit':'PENDING_ROOT_SUCCESSFUL_PUSH_AND_CI','dependency':{'name':'pdfjs-dist','version':lock['version'],'resolved':lock['resolved'],'integrity':lock['integrity'],'license':'Apache-2.0 retained; no change to team/Wiki/data/image/third-party licensing'},'expected_outputs':{'pdf.mjs':'3ab3d2fee1200547309d5f5e4116066a1ccb6277451b9533aebe618530eb62ca','pdf.worker.mjs':'07ceb740d746e5d9012fcf9f27d5c7dea09f7d2f5e74f5c8109e5787551a2333'},'external_requirements':'Official Wiki checkout supplies the remaining page/game/design inputs; npm registry supplies the locked dependency. Node >=22.13 is required. CI invokes npm ci with --ignore-scripts --omit=optional and the generator validates exact input/output hashes.','excluded_from_this_preservation':['node_modules','generated pdf.mjs/pdf.worker.mjs bundles','compiled public output','whole website snapshot'],'files_checked':len(rows),'new_unique_source_files':len(new),'new_unique_source_bytes':sum(r['bytes']for r in new),'files':rows}
if args.cdn:
 metadata.update({'scope':'Minimal exact-byte preservation of the final PDF.js official-CDN runtime integration and directly changed Wiki CI settings, reusing the earlier pinned reproduction recipe and Apache notice. This is not a whole-site backup or offline npm mirror.','publication_commit':'32d9f06ab6c29da742dc2a816bc285dd02f633ac','external_requirements':'Published runtime fetches two exact-byte verified official iGEM CDN JavaScript modules. The npm lockfile and optional generator preserve reproduction provenance, but CI no longer generates or packages these modules. Other page/game/design sources remain in the official Wiki checkout.','official_cdn_modules':[r for r in read(ROOT/'aerosense-wiki/igem-upload/verified-official-urls.json') if r.get('response_sha256')in metadata['expected_outputs'].values()]})
 assert len(metadata['official_cdn_modules'])==2
mapping=DEST/('CDN-SOURCE-MANIFEST.json' if args.cdn else 'BUILD-SOURCE-MANIFEST.json');write(mapping,metadata)

master=ARCHIVE/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='')as f:
 reader=csv.DictReader(f);fields=reader.fieldnames;records=list(reader)
known={r['destination_relative']:r for r in records};added=[]
entries=[(ROOT/r['canonical'],'gitlab/nthu/'+r['repository_path'],'wiki-publication-build-source')for r in new]
entries.append((mapping,mapping.relative_to(ROOT).as_posix(),'publication-source-provenance'))
for path,source,category in entries:
 rel=path.relative_to(ARCHIVE).as_posix();digest=sha(path);size=native(path).stat().st_size
 if rel in known:assert known[rel]['sha256']==digest;continue
 row={'source_relative':source,'destination_relative':rel,'category':category,'sha256':digest,'bytes':str(size),'source_mtime_utc':datetime.fromtimestamp(native(path).stat().st_mtime,timezone.utc).isoformat(),'corresponding_pages':'PDF-reading publication build','direct_references':''};records.append(row);known[rel]=row;added.append(row)
with master.open('w',encoding='utf-8-sig',newline='')as f:
 writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(records)
unique={}
for r in records:
 if r['destination_relative'] in unique:assert unique[r['destination_relative']]['sha256']==r['sha256']
 else:unique[r['destination_relative']]=r
cats=defaultdict(lambda:{'files':0,'bytes':0})
for r in unique.values():cats[r['category']]['files']+=1;cats[r['category']]['bytes']+=int(r['bytes'])
receipt={k:v for k,v in metadata.items()if k!='files'}
receipt.update({'canonical_manifest':mapping.relative_to(ROOT).as_posix(),'canonical_manifest_sha256':sha(mapping),'canonical_registration_files':len(added),'canonical_registration_bytes':sum(int(r['bytes'])for r in added),'master_manifest_sha256':sha(master),'payload_files':len(unique),'payload_bytes':sum(int(r['bytes'])for r in unique.values()),'manifest_source_records':len(records),'source_files_modified':0,'repository_index_operations':0,'http_requests':0})
receipt_name='pdf-reader-cdn-source-preservation.json' if args.cdn else 'pdf-reader-build-source-preservation.json'
write(AUDIT/receipt_name,receipt)
summary=read(ARCHIVE/'summary.json');summary.update({'payload_files':receipt['payload_files'],'payload_bytes':receipt['payload_bytes'],'manifest_source_records':len(records),'categories':dict(cats)})
summary['wiki_pdf_reader_cdn_preservation_2026_10_21' if args.cdn else 'wiki_pdf_reader_build_preservation_2026_10_21']={'receipt':'aerosense-wiki/audit/final-publication-20261021/'+receipt_name,'canonical_manifest':receipt['canonical_manifest'],'canonical_manifest_sha256':sha(mapping),'source_files_checked':len(rows),'new_unique_source_files':len(new),'new_unique_source_bytes':receipt['new_unique_source_bytes'],'new_registered_files':len(added),'new_registered_bytes':receipt['canonical_registration_bytes'],'pdfjs_version':'6.4.299','optional_reproduction_runtime_requirement':'Node >=22.13','whole_website_backup_created':False,'node_modules_copied':False,'generated_bundles_copied':False,'public_deployment_verified':False}
write(ARCHIVE/'summary.json',summary)
print(json.dumps({k:receipt[k]for k in ['files_checked','new_unique_source_files','new_unique_source_bytes','canonical_registration_files','canonical_registration_bytes','payload_files','payload_bytes','manifest_source_records','canonical_manifest_sha256']},ensure_ascii=False))
