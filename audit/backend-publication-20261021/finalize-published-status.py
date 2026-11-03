"""Register the verified Software readback and update archive status only."""
from pathlib import Path
from collections import defaultdict
from datetime import datetime,timezone
import csv,json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[3];ARC=ROOT/'zenodo-release';AUD=Path(__file__).resolve().parent
SNAP=ARC/'reproduction-source/backend-engineering-registry-publication-20261021'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
proof=read(AUD/'software-publication-readback.json')
assert proof['passed']==50 and proof['failed']==proof['unverified']==0
target=SNAP/'PUBLICATION-READBACK.json';assert not target.exists()
shutil.copyfile(AUD/'software-publication-readback.json',target)
assert sha(target)==sha(AUD/'software-publication-readback.json')
master=ARC/'manifest.csv'
with master.open(encoding='utf-8-sig',newline='') as f:
 rd=csv.DictReader(f);fields=rd.fieldnames;records=list(rd)
relative=target.relative_to(ARC).as_posix();assert not any(r['destination_relative']==relative for r in records)
records.append({'source_relative':(AUD/'software-publication-readback.json').relative_to(ROOT).as_posix(),
 'destination_relative':relative,'category':'publication-source-provenance','sha256':sha(target),'bytes':str(target.stat().st_size),
 'source_mtime_utc':datetime.fromtimestamp(target.stat().st_mtime,timezone.utc).isoformat(),
 'corresponding_pages':'Hardware reference-pattern backend; Engineering evidence; local Registry source documentation','direct_references':proof['repository']})
with master.open('w',encoding='utf-8-sig',newline='') as f:
 wr=csv.DictWriter(f,fieldnames=fields);wr.writeheader();wr.writerows(records)
unique={r['destination_relative']:r for r in records};cats=defaultdict(lambda:{'files':0,'bytes':0})
for row in unique.values():cats[row['category']]['files']+=1;cats[row['category']]['bytes']+=int(row['bytes'])
summary=read(ARC/'summary.json');summary.update(manifest_source_records=len(records),payload_files=len(unique),payload_bytes=sum(int(r['bytes']) for r in unique.values()),categories=dict(cats))
batch=summary['backend_engineering_registry_2026_10_21']
batch.update(publication_status='Software normal commit/push and 50-file anonymous exact SHA readback passed. Wiki Engineering/backend update is handled separately by root; the full Zenodo package remains unpublished.',software_public_commit=proof['commit'],software_public_readback_passed=50,software_public_readback_failed=0,publication_readback_canonical=target.relative_to(ROOT).as_posix())
status=summary['current_publication_status'];status['checked_at_utc']=datetime.now(timezone.utc).isoformat()
status['software']=f"MIT-scoped Software commit {proof['commit']} is public. All 50 changed files (49 source/configuration files plus source manifest) passed anonymous raw GET/SHA against committed blobs. Current source manifest contains 1,250 research files/12,053,740 bytes, plus seven unchanged support files. The four-receptor backend reference dataset is served separately by the verified official CDN."
status['gitlab']='Software backend/Engineering/Registry-label source update is public and verified. Wiki d1cb454/pipeline 792226 remains the latest verified deployment recorded here; root is publishing the new Engineering/backend page update separately.'
status['readback']='Existing baseline GitLab/CDN and official Wiki proofs remain historical. New Software publication added 50 full anonymous raw GET/SHA checks, all passing with 0 unverified or failed. Source-only changes do not imply Registry document Save succeeded or the full Zenodo archive is published.'
cleanup_path=ROOT/'aerosense-wiki/audit/engineering-backend-20261021/executed-public-refresh.json'
if cleanup_path.exists():
 summary['engineering_backend_public_refresh_2026_10_21']={'receipt':cleanup_path.relative_to(ROOT).as_posix(),'receipt_sha256':sha(cleanup_path),
 'removed_files':287,'removed_bytes':16687458,'distinct_from_prior_cleanup_receipts':True,'blocked_cleanup_targets_untouched':True,
 'scope':'Previous generated official Wiki public output only; verified new public replaced it. Executed by hardware agent.'}
write(ARC/'summary.json',summary)
pending=ARC/'PENDING.txt';text=pending.read_text(encoding='utf8')
text=text.replace('本輪後端、工程與 Registry 來源增補（本地準備完成；未宣稱新版本已發布）','本輪後端、工程與 Registry 來源增補（Software 已發布並核對；Wiki 另由主流程發布）',1)
text=text.replace('- Software 準備 49 份來源/設定變更與 manifest，合計 1,250 份研究來源；等主流程正常 commit/push 與匿名讀回。',
 f'- Software 已正常 commit/push：{proof["commit"]}；49 份來源/設定與 manifest 共 50 份匿名 raw GET/SHA 全數通過。合計 1,250 份研究來源／12,053,740 bytes。',1)
old='目前正式 payload 7,800 檔／24,964,835,870 bytes。'
text=text.replace(old,f'目前正式 payload {len(unique):,} 檔／{summary["payload_bytes"]:,} bytes（包含新增公開讀回收據）。',1)
text=text.replace('- 已登錄 66 份新的 canonical 檔案、2,568,698 bytes；未重新掃描完整研究包。',
 '- 第一組登錄 66 份 canonical 檔案，之後套用測試說明精確修正；另加四張歷史 gel、來源證據及公開讀回收據。所有改動均有逐項雜湊；未重新掃描完整研究包。',1)
pending.write_text(text,encoding='utf8')
review=read(AUD/'backend-review-summary.json');review['pending']='Software published and all 50 changed files read back exactly. Root separately handles Wiki and Registry publication.';review['software_public_commit']=proof['commit'];review['software_readback_passed']=50;write(AUD/'backend-review-summary.json',review)
receipt={'completed_at_utc':datetime.now(timezone.utc).isoformat(),'software_commit':proof['commit'],'software_manifest_sha256':proof['manifest_sha256'],
 'public_readback_passed':50,'public_readback_failed':0,'software_source_count':1250,'software_source_bytes':12053740,
 'payload_files':len(unique),'payload_bytes':summary['payload_bytes'],'manifest_records':len(records),
 'new_payload_files_since_backend_task':len(unique)-7729,'new_payload_bytes_since_backend_task':summary['payload_bytes']-24961249222,
 'master_manifest_sha256':sha(master),'summary_sha256':sha(ARC/'summary.json'),
 'backend_tests_passed':225,'blocked_new_work_copies':{'groups':2,'files':64,'bytes':539897,'removed':0,'retried':False},
 'four_registry_cache_work_copies_retained':True,'no_full_archive_rehash':True,'github_untouched':True}
write(AUD/'backend-engineering-publication-completion.json',receipt)
print(json.dumps(receipt,indent=2))
