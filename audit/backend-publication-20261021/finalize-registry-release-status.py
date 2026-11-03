"""Finalize current release summaries after footer-cleaned public proof passes."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,re
ROOT=Path(__file__).resolve().parents[3];ARC=ROOT/'zenodo-release';AUD=Path(__file__).resolve().parent
FINAL=ROOT/'aerosense-wiki/audit/final-publication-20261021'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
proof=read(FINAL/'registry-final-publication-readback.json');payload=FINAL/'registry-upload-documentation-payload.json'
assert proof['all_76_exact'] and proof['expected_payload_sha256']==sha(payload)
assert 'These Markdown entries are prepared for Registry.' not in payload.read_text(encoding='utf8')
assert proof['successful_page_GETs']==26 and proof['exact_matching_entries']==76 and not proof['unexpected_entries']
entries=[e for p in proof['pages'] for e in p['entries']]
assert len(entries)==76 and all(e['pass'] for e in entries)
survey=read(FINAL/'registry-current-existing-entry-survey.json')
original_ids={e['uuid'] for p in survey['pages'] for e in p['existing_entries']}
final_ids={e['remote_entry_id'] for e in entries}
assert len(original_ids)==survey['existing_entry_count']==51
assert len(final_ids)==76 and original_ids.issubset(final_ids)
preserved=len(original_ids & final_ids);created=len(final_ids-original_ids)
assert preserved==51 and created==25
metadata=read(FINAL/'registry-collection-metadata-readback.json');dom=read(FINAL/'registry-collection-description-readback.json')
assert metadata['all_exact'] and dom['description_exact'] and dom['description_characters']==868
source=read(AUD/'registry-footer-source-publication-completion.json');assert source['passed']==13
archive=read(AUD/'final-registry-evidence-preservation.json');assert archive['status']=='completed'
media=read(ROOT/'aerosense-wiki/audit/engineering-backend-20261021/final-scope-and-media.json')
assert media['official_cdn_urls']==media['official_cdn_with_full_byte_proof']==730
summary=read(ARC/'summary.json');files=summary['payload_files'];size=summary['payload_bytes'];records=summary['manifest_source_records']
software_commit=source['commit'];manifest=source['manifest_sha256'];source_bytes=source['software_source_bytes']
wiki='dbcfaf9414747dc2989b5ca134a1ea45452eea03';now=datetime.now(timezone.utc).isoformat()
review_path=FINAL/'RELEASE_REVIEW.md';status_path=FINAL/'publication-status.json';handoff_path=ROOT/'handoff.md';pending_path=ARC/'PENDING.txt'
targets=[review_path,status_path,handoff_path,ARC/'summary.json',pending_path]
before={p.relative_to(ROOT).as_posix():sha(p) for p in targets}

status=read(status_path)
status.update(status='Latest Wiki and MIT Software published and verified; all76 Registry documents and collection description publicly matched; Judging draft not submitted; Zenodo local unpublished',
 updated_at_utc=now,next_scope='User makes the final Judging Form Save and Submit click before the confirmed deadline. Presentation Video/Judging Session, safety review outcome and full Zenodo publication remain separate pending items.',
 registry_published=True,registry_publication_complete=True,registry_publication_status='COMPLETE AND PUBLICLY VERIFIED',registry_verified_saved_entries=76,
 registry_published_field_scope='All76 expected documentation entries match the final footer-cleaned payload; collection title/description/UUID also match.')
status['software'].update(commit=software_commit,source_manifest_sha256=manifest,research_bytes=source_bytes,
 changed_files_readback_pass=13,readback_receipt='../backend-publication-20261021/registry-footer-software-readback.json',
 prior_backend_engineering_readback_pass=50,prior_backend_engineering_commit='df7b3bc9731fc03205e0a1ac907e90e634d693fb')
status['validation']['public_readback']='Wiki315/315 passes (34 fresh HTTP,281 unchanged exact CI proofs). Software footer-only13/13 changed files pass raw GET/SHA; previous backend/Engineering50/50 proof retained. Current730 static CDN URL proofs and15 active Video Universe URL forms resolving to12 Public/Published videos are verified.'
status['registry']='COMPLETE:26 public pages and76 expected title/type/whole-body/team-affiliation matches;51 old IDs preserved,25 new unique entries,0 unexpected or duplicate entries. The11 stale administrative footers were removed and rechecked. Collection description868characters,title andUUID match via official public route and independent DOM. Prior Registry-only-image HTTP400 was resolved by75 official image uploads.'
status['registry_evidence'].update(full_body_readback_status='passed76/76',final_readback='registry-final-publication-readback.json',
 collection_metadata_readback='registry-collection-metadata-readback.json',collection_dom_readback='registry-collection-description-readback.json',
 collection_description_sha256=dom['description_sha256'],collection_description_characters=868,existing_ids_preserved=51,new_unique_entries=25,
 unexpected_entries=0,duplicate_entries=0,stale_administrative_footers_removed=11,
 original_html_anchors_and_36_incoming_links_preserved=True,
 editor_state_note='Source text alone initially did not commit editor state. A native Rich edit followed by restoring the exact approved Source body allowed the11 footer-only saves; no additional source changes or anchor removal.')
status['judging_form']='Official UI still shows Not Started. The150-word draft and six evidence confirmations remain complete in the open tab; Save and Submit has not been pressed and is reserved for the user. Confirmed deadline2026-10-21 23:00Asia/Taipei. Eligible is form validation only.'
status['judging_form_submitted']=False
status['media']={'static_official_urls_with_byte_proof':730,'video_url_forms':15,'unique_public_published_videos':12,
 'video_count_correction':'Includes the existing Model Four-Filter Signal Comparison UUID7fc4bb2a-623b-4fee-90c0-d1836add9c2e; this was not a new upload.',
 'static_receipt':'../engineering-backend-20261021/final-scope-and-media.json'}
status['archive'].update(payload_files=files,payload_bytes=size,manifest_records=records)
status['final_rollup']='../backend-publication-20261021/final-registry-evidence-preservation.json'
assert status['cleanup']['blocked_files_remaining']==83 and status['cleanup']['historical_gel_cache_work_copies_remaining']==0
write(status_path,status)

review=review_path.read_text(encoding='utf8')
limits=review.split('## 必須保留的研究解讀界線\n',1)[1].split('\n## 正式交件狀態',1)[0]
numeric_table=re.search(r'\| 配對構築 \|[\s\S]+?\n\n',review).group(0)
def replace_bullet(text,prefix,new):
 lines=text.splitlines();matches=[i for i,x in enumerate(lines) if x.startswith(prefix)];assert len(matches)==1
 lines[matches[0]]=new;return '\n'.join(lines)+'\n'
review=replace_bullet(review,'- **Software：',f'- **Software：最新來源已正常發布並讀回。** 官方 [AeroSense Software](https://gitlab.igem.org/2026/software/nthu/aerosense) commit `{software_commit}`；尾註清理的12份來源加manifest共 **13/13** 匿名 raw GET/SHA 相符，前輪後端／工程 **50/50** 證據保留。現行 **1,250份研究來源／{source_bytes:,} bytes**，另有7份未變支援檔及manifest，共1,258項；manifest SHA `{manifest}`。MIT僅適用使用者核准的團隊原創程式，資料、圖文、Wiki與第三方 notices 不變。')
review=replace_bullet(review,'- **Zenodo：',f'- **Zenodo：完整研究包仍在本地，未發布。** 現行 **{records:,}筆來源記錄、{files:,}個唯一payload、{size:,} bytes**；只登錄必要新版本與精簡公開證據，未重掃完整包，也未再複製整站、圖片或完整Registry payload。')
review=replace_bullet(review,'- **Registry：','- **Registry：76/76文件與Collection說明已公開核對完成。** 26個公開頁面上的標題、類型、全文及團隊歸屬全部符合最終payload；51個舊ID保留、25筆新增且唯一，沒有額外或重複條目。11處過時管理尾註已移除並增量重驗。75/75張官方Registry圖片已核對；自動AVIF轉製／縮放不宣稱與來源bytes相同。Collection的868字元說明、標題與UUID亦經官方公開端點和獨立DOM核對一致。先前400僅接受Registry上傳圖片的問題已解決。')
review=replace_bullet(review,'- **Judging Form：','- **Judging Form：150字草稿與六個evidence checkbox已就緒，官方UI仍顯示Not Started，尚未按Save and Submit。** 最後操作保留給使用者，期限為2026-10-21 23:00臺灣時間；保留草稿分頁不要重新整理。Eligible僅為表單檢核，不代表評審認定或獲獎；網站仍保留157字Abstract。')
old='網站引用的 12 個 Video Universe 網址對應 11 支獨立影片，已核對公開狀態；'
new='現行網站的 **15 種 Video Universe URL 形式對應 12 支獨立 Public／Published 影片**，已完成公開metadata核對；先前漏算Model的 Four-Filter Signal Comparison（UUID `7fc4bb2a-623b-4fee-90c0-d1836add9c2e`），這是更正統計而非新增上傳。'
assert old in review;review=review.replace(old,new,1)
review=review.replace('既有官方圖片、影片與本輪科學 SVG 的核對收據繼續保留。','現行 **730個官方static CDN URL均有完整bytes／SHA證據**；既有圖片、影片與科學SVG的收據保留，不把舊549筆子集誤當現行總數。',1)
intro='## 本輪工程證據、後端與 Registry 來源\n\n'
footnote=f'最後視覺檢查後，另刪除11筆Test2文件及生成模板內兩句過時行政尾註。逐檔比較確認只移除該155-byte文字，科學敘述、表格、數值、標題、圖片與連結均不變。正常Software commit `{software_commit}`與13/13公開檔案讀回已完成；Registry同11個既有條目重存後亦併入最終76/76正文核對。\n\n'
assert intro in review;review=review.replace(intro,intro+footnote,1)
a=review.index('Registry 的 25 個 parts 加 collection',review.index('## 正式交件狀態'))
b=review.index('\n\nAttributions',a)
review=review[:a]+'Registry的25個parts加collection已完成76項文件更新。Ijung Chen以既有作者權限操作；原先HTTP400訊息 **Only images uploaded to the Registry are allowed** 已確認並透過75張官方Insert Image上傳解決。最新公開核對涵蓋26頁、76項標題／type／完整Markdown正文／團隊歸屬：**76/76一致，51舊ID保留、25新增唯一條目，無extras或duplicates**。11筆Test2的過時管理尾註清理後，以10次新的paced公開請求、1份先前已核對的Or19a證據及65份未改內容證據完成增量檢查。Collection標題／UUID／868字元說明亦由官方API與獨立公開DOM核對；較短的錯誤API路徑曾回404，不是實際Collection不存在或保存失敗。最終精簡證據已歸檔，不另複製整份payload或圖片。'+review[b:]
review=review.replace('草稿仍未提交，Save and submit 留由使用者最後操作','官方UI仍為Not Started；分頁內草稿與六個勾選保留，尚未按Save and Submit，最後操作留由使用者',1)
old='- Registry 進行中證據：`registry-image-upload-readback.json`、`registry-or35a-first-confirmed-save.json`；75/75 圖片，首筆標題／全文相符。全 76 項正文最終讀回仍待發布負責人完成。'
new='- Registry最終證據：`registry-final-publication-readback.json`、`registry-collection-metadata-readback.json`、`registry-collection-description-readback.json`、`registry-image-upload-readback.json`；76/76全文、51舊ID／25新增、868字元Collection說明、75張圖。尾註更新前的首筆與全批證據保留為歷史。'
assert old in review;review=review.replace(old,new,1)
review=review.replace('## 查核依據與待補欄位\n\n','## 查核依據與待補欄位\n\n- 最後來源與歸檔：`../backend-publication-20261021/registry-footer-source-publication-completion.json`、`final-registry-evidence-preservation.json`（同目錄）；13/13來源讀回與精簡Registry證據登錄。\n',1)
end=review.index('**待補、不得視為已完成：')
review=review[:end]+'**仍待完成：使用者最後提交已就緒的Judging Form；後續Presentation Video／Judging Session；Zenodo正式發布。** Wiki最新CI／315/315讀回、Software最新13/13來源讀回、Registry76/76正文與Collection說明均已完成。Safety為Final Submitted／Awaiting Review，不能把等待官方審查誤寫成未提交，也不由Eligible推論獲獎。\n'
assert limits==review.split('## 必須保留的研究解讀界線\n',1)[1].split('\n## 正式交件狀態',1)[0]
assert numeric_table==re.search(r'\| 配對構築 \|[\s\S]+?\n\n',review).group(0)
review_path.write_text(review,encoding='utf8')

handoff=handoff_path.read_text(encoding='utf8');boundary=handoff.index('> 更新日期：');head=handoff[:boundary];tail=handoff[boundary:]
a=head.index('Software 最新正常 push');b=head.index('\n\n本輪後端',a)
head=head[:a]+f'Software最新正常push為 `{software_commit}`；只移除11筆Test2文件與生成模板的過時行政尾註，12份來源加manifest共 **13/13** 公開raw GET／commit blob SHA核對。前輪後端／工程的50/50證據保留。現行 **1,250份研究來源／{source_bytes:,} bytes**，另7支援檔及manifest，共1,258項；manifest SHA `{manifest}`。官方repository `https://gitlab.igem.org/2026/software/nthu/aerosense`，本地 `gitlab/aerosense-software/`，研究路徑不變。MIT已獲明確同意，僅適用團隊原創程式；Wiki、資料、圖文與第三方notices不變，不再詢問。'+head[b:]
a=head.index('**Registry 目前為 IN PROGRESS');b=head.index('\n\nJudging Form',a)
head=head[:a]+'**Registry已完成並公開核對：26頁、76/76文件標題／type／全文／團隊歸屬一致，51個舊ID保留、25筆新增唯一條目，無extras或duplicates。** 原HTTP400要求僅使用Registry上傳圖片，已由75張官方Insert Image上傳解決；75/75可讀／來源映射通過，AVIF自動轉製縮放不宣稱與輸入bytes相同。最後11筆Test2過時管理尾註已刪除、重存並做增量公開讀回。Collection標題、UUID與 **868字元說明** 也經正確官方公開API與獨立DOM精確核對（SHA `c55d22b8342a48c5c567ebd59c92b249eef470ec1dceb6fe7de4e7e57a55e82d`）。不再沿用0/76、1/76、IN PROGRESS或不明Save失敗的舊現況。Registry圖片URL只在upload payload替換，原始科學數字、圖與來源記錄保留。'+head[b:]
head=head.replace('**尚未提交，Save and submit 保留給使用者最後操作；','**官方UI仍顯示Not Started，150字草稿與六個勾選在保留分頁內就緒；尚未按Save and Submit，最後操作保留給使用者；',1)
head=re.sub(r'現有 8,161 筆來源記錄、7,801 個唯一 payload、24,964,872,847 bytes',f'現有 {records:,}筆來源記錄、{files:,}個唯一payload、{size:,} bytes',head,count=1)
head=head.replace('GitHub 副本完全未動。','現行730個static CDN URL均有完整bytes／SHA證據；15種Video Universe URL形式對應12支Public／Published影片（包含原已公開的Model Four-Filter Signal Comparison，並非新上傳）。GitHub副本完全未動。',1)
head=head.replace('Registry 後續完成數由主流程依新保存／全文讀回收據更新，不以此段的 1/76 當作已完成或永遠固定的最終數字。','Registry最終證據為 `registry-final-publication-readback.json` 及兩份collection公開讀回收據；精簡歸檔映射在 `audit/backend-publication-20261021/final-registry-evidence-preservation.json`。後續只依實際新修改刷新對應證據，不重跑既有成功發布。',1)
head += '\nRegistry既有文件編輯交接：含空HTML錨點的正文可能觸發Rich Markdown解析錯誤，僅改Source後Save可能只更新時間戳而保留舊正文。已驗證的UI操作是：暫用可解析且無空錨點的Source → 切Rich並原生按Space／Backspace觸發onChange → 回Source貼回完整最終正文（保留原錨點）→ 在Source模式Save → 核對公開正文SHA。這是已解決的編輯器狀態問題；11個錨點與36條導入連結全部保留，來源只刪兩句過時尾註。詳見 `aerosense-wiki/audit/final-publication-20261021/registry-footer-cleanup-native-ui-log.json`。Judging草稿分頁11仍保留且未送出；舊代理草稿分頁12已關閉。\n\n'
handoff_path.write_text(head+tail,encoding='utf8')

current=summary['current_publication_status'];current['checked_at_utc']=now
current.update(registry='Completed:26pages/76exact title,type,full body,affiliation;51oldIDs preserved,25newunique,0extras/duplicates. Eleven stale administrative footers removed and reverified. Collection title/UUID/868-character description exact via official public API and DOM.',
 wiki=f'Wiki{wiki},pipeline792720 successful;315/315 deployed checks passed (34freshHTTP,281unchanged proofs),287CI files/28routes,27cleanbase checks.',
 software=f'Software{software_commit} published;13/13footer-only changed source/manifest files pass anonymous raw GET/SHA. Earlier backend/Engineering50/50proof retained.1250research sources/{source_bytes}bytes;manifest{manifest}.',
 gitlab='Both official repositories are public and verified. Latest Wiki and Software narrow updates complete; no GitHub changes.',
 official_cdn='730current official static URL proofs verified; Registry75imageuploads separately verified with documented automatic conversion.',
 videos='15active VideoUniverse URL forms resolve to12uniquePublic/Published videos, including the existing Model Four-Filter Signal Comparison. Count correction only; no new upload implied.',
 judging_form='OfficialUI NotStarted;150-word draft and six confirmations ready in retained tab, SaveandSubmit unpressed. User finalclick required before2026-10-21 23:00Asia/Taipei.',
 readback='FinalWiki315/315; latestSoftware13/13with previous50/50source proof retained; Registry76/76andcollectiondescription exact;730staticURLproofs. Incremental unchanged evidence explicitly retained.')
write(ARC/'summary.json',summary)
pending=pending_path.read_text(encoding='utf8')
pending=pending.replace('本輪後端、工程與 Registry 來源增補（Software 已發布並核對；Wiki 另由主流程發布）','本輪網站、Software與Registry增補（均已發布並公開核對）',1)
pending=re.sub(r'目前正式 payload [\d,]+ 檔／[\d,]+ bytes（包含新增公開讀回收據）。',f'目前正式payload {files:,}檔／{size:,} bytes（含必要最終公開證據）。',pending,count=1)
marker='目前發布狀態\n'
newstatus=f'\n最新完成：Wiki `{wiki}`／CI792720／315核對；Software `{software_commit}`／13檔rawSHA通過（前輪50檔證據保留）；Registry26頁76全文相符、51舊ID及25新唯一條目，Collection868字元說明核對完成。\n現行來源1,250檔／{source_bytes:,} bytes；730staticURL證據、15影片URL形式／12獨立Public/Published影片。Judging官方仍Not Started，分頁草稿與六勾選就緒，Save and Submit保留使用者最後按下；Zenodo完整包仍未發布。\n'
assert marker in pending;pending=pending.replace(marker,marker+newstatus,1)
pending=re.sub(r'\[ \] 使用者已恢復登入 Ijung Chen；[\s\S]*?    Collection: https://registry\.igem\.org/collections/40067138-a3dd-4e5b-b8a4-50b097ee0156',
 '[x] Registry已完成76/76公開正文核對（51舊ID保留、25新增唯一），Collection說明868字元一致。先前400圖片限制已以75官方圖片上傳解決；沒有extra或duplicate條目。\n    Collection: https://registry.igem.org/collections/40067138-a3dd-4e5b-b8a4-50b097ee0156',pending,count=1)
pending=pending.replace('線上 Save 因僅接受 Registry 圖片回傳 400，主流程另處理圖片，尚未宣稱成功發布。','先前線上Save的Registry圖片限制已解決，76/76正文與Collection說明均已公開核對。',1)
pending=pending.replace('本輪新頁面另待發布。','本輪工程／後端增補亦已由最新pipeline792720部署核對。',1)
pending_path.write_text(pending,encoding='utf8')

receipt={'updated_at_utc':now,'status':'All authorized website/software/Registry publication and readback complete; user/formal pending items retained',
 'wiki_commit':wiki,'pipeline':792720,'software_commit':software_commit,'software_manifest_sha256':manifest,
 'registry_entries_exact':76,'registry_existing_ids_preserved':51,'registry_new_unique_entries':25,'collection_description_chars':868,
 'software_final_changed_files_readback':13,'static_proofs':730,'video_url_forms':15,'unique_public_videos':12,
 'payload_files':files,'payload_bytes':size,'manifest_records':records,'judging_form_submitted':False,'blocked_files_remaining':83,'gel_cache_remaining':0,
 'historical_handoff_unchanged':True,'scientific_table_and_record19_limits_unchanged':True,
 'files':[{'path':p.relative_to(ROOT).as_posix(),'before_sha256':before[p.relative_to(ROOT).as_posix()],'after_sha256':sha(p)} for p in targets]}
write(AUD/'final-registry-release-status.json',receipt)
print(json.dumps({k:v for k,v in receipt.items() if k!='files'},indent=2))
