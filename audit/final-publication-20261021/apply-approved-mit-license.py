"""Apply the user's approved team-software MIT scope; no Git operations."""
from pathlib import Path
import datetime, hashlib, json, os, subprocess
A=Path(__file__).resolve().parent;R=A.parents[2];REPO=R/'gitlab/aerosense-software'
def n(p):return Path('\\\\?\\'+str(p.absolute())) if os.name=='nt' else p
def h(p):return hashlib.sha256(n(p).read_bytes()).hexdigest()
index_before=h(REPO/'.git/index')
before=json.loads((REPO/'code/aerosense/source-manifest.json').read_text(encoding='utf-8'))
before_hashes={r['path']:r['sha256'] for r in before['files']+before['repository_support_files']}
third_party=[r['path'] for r in before['files'] if '/vendor/' in r['path'] or '/tools/USalign/' in r['path'] or r['path'].endswith(('LICENSE.three.js.txt','thinking-orbs.txt'))]
changed=[]
def change(relative,old,new):
    p=REPO/relative;t=n(p).read_text(encoding='utf-8')
    assert t.count(old)==1,(relative,t.count(old))
    n(p).write_text(t.replace(old,new),encoding='utf-8',newline='\n')
    changed.append(relative)
proposal=(A/'PROPOSED_SOFTWARE_LICENSE.txt').read_text(encoding='utf-8')
mit='MIT License'+proposal.split('MIT License',1)[1]
assert 'Copyright (c) 2026 NTHU iGEM Team' in mit
(REPO/'LICENSE').write_text(mit,encoding='utf-8',newline='\n');changed.append('LICENSE')
scope='Team-original AeroSense software is licensed under the [MIT License](LICENSE), copyright (c) 2026 NTHU iGEM Team. This grant covers the team\'s original software; research data, images, text and the Wiki retain their existing notices and are not relicensed by this software decision. Third-party components retain their own licenses and attributions, as listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).'
change('README.md',"The repository's initial Apache 2.0 template [LICENSE](LICENSE) is retained while the team confirms its own software licensing choice. This preparation does not treat a template or the Wiki's Creative Commons license as a newly authorized grant for team-origin software. Publication of the final team-license statement remains pending that decision. Third-party components retain their own notices, summarized in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).",scope)
change('THIRD_PARTY_NOTICES.md','Third-party source, documentation and dependency notices retain their original scope. They do not by themselves authorize a license for the team\'s separate contributions. The root license decision is described in [README.md](README.md).','Team-original AeroSense software is MIT-licensed under the root [LICENSE](LICENSE). Third-party source, documentation and dependency notices retain their original scope and are not replaced by the team\'s MIT grant. Research data, images, text and the Wiki keep their existing notices; the software license does not relicense them. See [README.md](README.md#license-status) for the approved scope.')
change('code/aerosense/README.md','The initial Software repository license template is unchanged while the team license decision remains pending; see the [repository license status](../../README.md#license-status).','Team-original AeroSense software is licensed under the [MIT License](../../LICENSE); research data, images, text and the Wiki retain their existing notices. See the [repository license scope](../../README.md#license-status).')
change('code/aerosense/wetlab/reproduction-readme.txt','This is unpublished research source material. Final author, version, license,\npermissions and missing experimental/model inputs remain in PENDING.txt.','The full research archive remains unpublished. Team-original AeroSense software\nis covered by the Software repository MIT license. Research data, images, text\nand third-party material retain their existing notices; archive permissions and\nmissing experimental/model inputs remain separate publication requirements.')
change('code/aerosense/hardware/03_software/README.md','Preserve the Wiki root LICENSE and deployment settings.','Team-original AeroSense software uses the Software repository MIT LICENSE. Preserve the Wiki root LICENSE, data/image/text notices, third-party licenses and deployment settings.')
change('code/aerosense/hardware/03_software/README.md','Wiki 的根 LICENSE 與網站部署設定保持原樣。','團隊原創 AeroSense 軟體採 Software repository 的 MIT LICENSE。Wiki 的根 LICENSE、資料／圖片／文字與第三方授權及網站部署設定保持原樣。')
change('code/aerosense/hardware/03_software/package_source.py','The Wiki repository license remains unchanged. Dependencies retain their\nown licenses. Source references remain in the model README files.','Team-original AeroSense software uses the Software repository MIT license.\nWiki content, research data, images and text retain their existing notices.\nDependencies retain their own licenses. Source references remain in the model\nREADME files.')
game='code/aerosense/education/odor-pixel-suite/'
change(game+'docs/education-games/README.md',"The user confirmed on 18 October 2026 that Odor Pixel Suite and its odor atlas were created by the NTHU FLY iGEM 2026 team. Authorship is recorded in `assets-manifest.json`. Reuse and redistribution terms for the game and atlas have not been separately specified; the website's general license link does not establish a separate license for these files.","The user confirmed on 18 October 2026 that Odor Pixel Suite and its odor atlas were created by the NTHU FLY iGEM 2026 team. Authorship is recorded in `assets-manifest.json`. The team-original game software is covered by the Software repository MIT license. This software grant does not relicense the odor-atlas artwork, educational text or research data; their existing notices remain in force. The artwork's separate reuse terms remain unspecified in the asset manifest.")
p=REPO/(game+'assets-manifest.json');j=json.loads(p.read_text(encoding='utf-8'))
assert len(j['assets'])==1 and j['assets'][0]['license']=='TODO-VERIFY'
asset=j['assets'][0]
asset['licenseNote']='Team-original game software is MIT-licensed. This asset record concerns the odor-atlas artwork; its separate reuse and redistribution terms remain unspecified and are not changed by the software license.'
asset['creditText']['zh-Hant']='Odor Pixel Suite 與氣味圖鑑由 NTHU FLY iGEM 2026 團隊製作；使用者於 2026 年 10 月 18 日確認團隊自製。團隊原創遊戲軟體採 MIT 授權；氣味圖鑑圖片的重用及再散布條款仍未另行指定，不因軟體授權而變更。'
asset['creditText']['en']='Odor Pixel Suite and its odor atlas were created by the NTHU FLY iGEM 2026 team; team authorship was confirmed by the user on 18 October 2026. Team-original game software is MIT-licensed; the odor-atlas artwork\'s separate reuse and redistribution terms remain unspecified and are not changed by the software license.'
p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');changed.append(game+'assets-manifest.json')
change(game+'apps/wiki-client/src/data/education.ts','使用者於 2026 年 10 月 18 日確認遊戲由 NTHU FLY iGEM 2026 團隊自製。遊戲與氣味圖鑑的重用及再散布條款尚未另行指定；團隊作者身分確認不等於新增開放授權。','使用者於 2026 年 10 月 18 日確認遊戲由 NTHU FLY iGEM 2026 團隊自製。團隊原創遊戲軟體採 MIT 授權；氣味圖鑑圖片的重用及再散布條款仍未另行指定，圖片、資料與文字的既有授權保持原樣。')
change(game+'apps/wiki-client/src/data/education.ts','The user confirmed on 18 October 2026 that the game was created by the NTHU FLY iGEM 2026 team. Reuse and redistribution terms for the game and odor atlas have not been separately specified; confirming authorship does not add an open license.','The user confirmed on 18 October 2026 that the game was created by the NTHU FLY iGEM 2026 team. Team-original game software is MIT-licensed. Separate reuse terms for the odor-atlas artwork remain unspecified; existing notices for images, data and text are unchanged.')
change(game+'apps/wiki-client/src/data/education.ts','教育說明文件與遊戲原始碼授權尚未在倉庫根目錄公布。','團隊原創遊戲原始碼採 Software repository 的 MIT 授權；教育文字、圖片與資料保留各自既有授權，不包含在此次軟體授權變更中。')
change(game+'apps/wiki-client/src/data/education.ts','Educator docs and game source license are not published at the repository root yet.','Team-original game source uses the Software repository MIT license. Educational text, images and data retain their existing notices and are outside this software license change.')
subprocess.run(['node','scripts/rewrite-credits.mjs'],cwd=REPO/game,check=True)
changed.append(game+'packages/content/src/credits.ts')
assert all(h(REPO/p)==before_hashes[p] for p in third_party)
assert h(REPO/'.git/index')==index_before
receipt={'applied_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'authorization':'Explicit user approval relayed by root for the proposed MIT license and team-original software scope.','proposal_path':'aerosense-wiki/audit/final-publication-20261021/PROPOSED_SOFTWARE_LICENSE.txt','proposal_sha256':h(A/'PROPOSED_SOFTWARE_LICENSE.txt'),'license_sha256':h(REPO/'LICENSE'),'copyright_holder':'2026 NTHU iGEM Team','approved_scope':'Team-original AeroSense software only. Research data, images, text, Wiki and third-party notices unchanged.','changed_files':[{'path':p,'previous_sha256':before_hashes[p],'sha256':h(REPO/p)} for p in sorted(set(changed))],'third_party_files_checked_unchanged':len(third_party),'artwork_license_field_unchanged':'TODO-VERIFY','software_index_unchanged':True,'source_manifest_refresh_pending':True}
(A/'approved-mit-license-application.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in receipt.items() if k!='changed_files'},ensure_ascii=False))
