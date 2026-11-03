"""Record four verified gel-cache removals without touching Registry progress."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib
ROOT=Path(__file__).resolve().parents[3];AUD=Path(__file__).resolve().parent
FINAL=ROOT/'aerosense-wiki/audit/final-publication-20261021'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
receipt_path=FINAL/'executed-registry-historical-gel-cache-cleanup.json';receipt=read(receipt_path)
assert receipt['status']=='completed' and receipt['removed_file_count']==4 and receipt['removed_file_bytes']==1014648
for row in receipt['verified_files']:
 assert not Path(row['path']).exists()
 assert sha(Path(row['canonical']))==row['sha256']
paths=[FINAL/'publication-status.json',FINAL/'RELEASE_REVIEW.md',ROOT/'handoff.md',ROOT/'zenodo-release/summary.json',ROOT/'zenodo-release/PENDING.txt']
before={str(p.relative_to(ROOT)):sha(p) for p in paths}
status=read(paths[0]);registry_before=json.dumps({k:v for k,v in status.items() if k.startswith('registry')},sort_keys=True)
assert status['cleanup']['removed_files']==6063 and status['cleanup']['removed_bytes']==504276634
status['cleanup'].update(removed_files=6067,removed_bytes=505291282,receipts=18,historical_gel_cache_work_copies_remaining=0,
 historical_gel_cache_cleanup_receipt='executed-registry-historical-gel-cache-cleanup.json',historical_gel_cache_removed_files=4,historical_gel_cache_removed_bytes=1014648)
assert status['cleanup']['blocked_files_remaining']==83
assert json.dumps({k:v for k,v in status.items() if k.startswith('registry')},sort_keys=True)==registry_before
write(paths[0],status)
review=paths[1].read_text(encoding='utf8')
old='另有 **4 份歷史 gel cache 工作副本**仍保留，並不屬於這 83 份 blocked 檔案；其 exact canonical 已另存並登錄。'
new='另有 **4 份歷史 gel cache 工作副本**已在 canonical SHA 與 Registry 上傳核對完成後逐檔移除（1,014,648 bytes），並不屬於這 83 份 blocked 檔案；四份 exact canonical 仍完整保存。'
assert old in review;review=review.replace(old,new,1)
review=review.replace('| Registry 前端診斷內容 |','| 已歸檔並上傳 Registry 的歷史 gel cache | 4 檔／1,014,648 bytes | 四份原件逐檔 SHA 相符，快取以原生 PowerShell literal-path 刪除一次；先前 83 份 blocked 檔案未動。 |\n| Registry 前端診斷內容 |',1)
review=review.replace('17 份完成收據共移除 **6,063 個舊版本檔案、504,276,634 bytes**','18 份完成收據共移除 **6,067 個舊版本／快取檔案、505,291,282 bytes**',1)
review=review.replace('及本輪兩次已核對的 public 更新','、本輪兩次已核對的 public 更新及四份 gel cache 清理',1)
paths[1].write_text(review,encoding='utf8')
handoff=paths[2].read_text(encoding='utf8');boundary=handoff.index('> 更新日期：');head=handoff[:boundary];tail=handoff[boundary:]
assert '6,063 個過時版本檔案／504,276,634 bytes' in head
head=head.replace('6,063 個過時版本檔案／504,276,634 bytes','6,067 個過時版本／快取檔案／505,291,282 bytes',1)
old='另有 4 份歷史 gel cache 工作副本保留，與 blocked 83 份分開；其 exact canonical 已登錄。'
assert old in head;head=head.replace(old,'另有 4 份歷史 gel cache 已於 canonical／Registry 核對後逐檔清除（1,014,648 bytes），與 blocked 83 份分開；四份 exact canonical 均保留。',1)
paths[2].write_text(head+tail,encoding='utf8')
summary=read(paths[3]);summary['registry_historical_gel_cache_cleanup_2026_10_21']={
 'status':'completed','removed_files':4,'removed_bytes':1014648,'canonical_files_preserved_and_sha_rechecked':4,
 'receipt':str(receipt_path.relative_to(ROOT)).replace('\\','/'),'receipt_sha256':sha(receipt_path),
 'prior_blocked_files_untouched':83,'cache_work_copies_remaining':0,'no_recursive_deletion':True}
write(paths[3],summary)
pending=paths[4].read_text(encoding='utf8')
line='- 四份歷史 gel cache 已在逐檔 canonical SHA／Registry 核對後移除，共 1,014,648 bytes；正式原件保留，先前 83 份 blocked 檔案完全未動。\n'
marker='本輪後端、工程與 Registry 來源增補（Software 已發布並核對；Wiki 另由主流程發布）\n'
assert marker in pending;pending=pending.replace(marker,marker+line,1);paths[4].write_text(pending,encoding='utf8')
audit={'updated_at_utc':datetime.now(timezone.utc).isoformat(),'scope':'Cleanup fields only; Registry progress and historical handoff preserved',
 'files':[{'path':str(p.relative_to(ROOT)),'before_sha256':before[str(p.relative_to(ROOT))],'after_sha256':sha(p)} for p in paths],
 'newly_removed_files':4,'newly_removed_bytes':1014648,'completed_rollup_files':6067,'completed_rollup_bytes':505291282,
 'blocked_files_remaining':83,'registry_progress_unchanged':True,'historical_handoff_unchanged':True,
 'canonical_payload_count_unchanged':True}
write(AUD/'gel-cache-cleanup-status-refresh.json',audit)
print(json.dumps({k:v for k,v in audit.items() if k!='files'},indent=2))
