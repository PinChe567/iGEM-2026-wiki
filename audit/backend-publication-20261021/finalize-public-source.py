"""Prepare source-only Software changes, preserving incoming and publication editions."""
from pathlib import Path
import hashlib, json, shutil, datetime, re
OUT=Path(__file__).resolve().parent;WORK=OUT.parents[2]
CANONICAL=WORK/'zenodo-release/reproduction-source/hardware-odor-backend-20261021'
PUBLICATION=CANONICAL/'publication'
SOFTWARE=WORK/'gitlab/aerosense-software/code/aerosense/hardware/03_software'
selection=json.loads((OUT/'backend-source-selection.json').read_text(encoding='utf-8'))
prior_path=OUT/'backend-software-preparation.json'
prior={x['path']:x['sha256'] for x in json.loads(prior_path.read_text(encoding='utf-8'))['items']} if prior_path.exists() else {}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
original=Path(selection['source_root'])
readme=(original/'README.md').read_text(encoding='utf-8')
readme=readme.replace('# AeroSense software: from power-on to a saved measurement', '# AeroSense software: from power-on to a saved measurement\n\n**Public source setup:** start with [PUBLICATION_GUIDE.md](PUBLICATION_GUIDE.md) and run `python -B fetch_odor_reference.py` to restore the separately hosted, hash-verified reference data. Private board configuration, generated evidence and data files are not included in this source checkout.',1)
assert 'with the existing board API key. No flashing is needed.' in readme
readme=readme.replace('with the existing board API key. No flashing is needed.', 'with the existing board API key. Host analysis of compatible saved records needs no flashing; the added continuous mode requires compatible updated firmware and UI.',1)
readme=readme.replace('The target is `code/aerosense` in the team Wiki repository. It supports Hardware reproduction. It is not the dedicated Best Software submission.', 'Current editable sources are in the official [AeroSense Software repository](https://gitlab.igem.org/2026/software/nthu/aerosense), under `code/aerosense/hardware/03_software`. Static reference data are hosted on the official CDN; complete research archives are prepared separately for Zenodo.')
readme=readme.replace('目標為團隊 Wiki repository 的 `code/aerosense`。用途是 Hardware 重現附件，不是 Best Software 專用 repository 提交。', '目前可編輯來源位於官方 AeroSense Software repository 的 `code/aerosense/hardware/03_software`；靜態參考資料使用官方 CDN，完整研究封裝另存於準備中的 Zenodo 資料包。')
readme=readme.replace('Preserve the Wiki root LICENSE and deployment settings.', 'Team-original AeroSense software uses the Software repository MIT LICENSE. Preserve the Wiki root LICENSE, data/image/text notices, third-party licenses and deployment settings.')
readme=readme.replace('Wiki 的根 LICENSE 與網站部署設定保持原樣。', '團隊原創程式使用 Software repository 的 MIT LICENSE；Wiki 根 LICENSE、圖文與數據及第三方授權保持原樣。')
readme=readme.replace('This keeps the file below the GitLab 10 MB limit.', 'The legacy archive utility retains a 10 MB local attachment budget; this is not a GitLab upload allowance.')
readme=readme.replace('The upload location is `code/aerosense` in the team GitLab repository.', 'This archive requires the complete local delivery tree and belongs with the research archive, not GitLab source publication.')
readme=readme.replace('GitLab 單檔上限為 10 MB，因此不附大型計算場與對應計算快取；', '歷史封裝工具使用 10 MB 的本機附件預算，這不代表 GitLab 接受壓縮包或資料集。完整重現封裝應保存在研究資料包；')
(PUBLICATION/'README.md').write_text(readme,encoding='utf-8')
ignore=(original/'.gitignore').read_text(encoding='utf-8').rstrip()+'\n\n# Installed reference data and generated/local-only material stay outside Git.\nanalysis/odor_reference.json\nevidence/\n.history/\n.vscode/\n'
(PUBLICATION/'.gitignore').write_text(ignore,encoding='utf-8')
packager=(original/'package_source.py').read_text(encoding='utf-8')
packager=packager.replace('Build the public Hardware reproduction attachment without private files.', 'Build a local Hardware research archive from the complete delivery tree.\n\nThis legacy archive is not a GitLab source upload; the source-only checkout\ndoes not contain its required numerical data or generated evidence.')
packager=packager.replace('Generated numerical fields are omitted to fit the GitLab 10 MB file limit.', 'Generated numerical fields are omitted to fit this legacy local 10 MB attachment budget.\nThis archive is research data packaging, not an allowed GitLab source upload.')
packager=packager.replace('The Wiki repository license remains unchanged. Dependencies retain their\nown licenses.', 'Team-original AeroSense software uses the Software repository MIT license.\nWiki content, research data, images and text retain their existing notices.\nDependencies retain their own licenses.')
packager=packager.replace('Source archive exceeds the GitLab 10 MB file limit.', 'Research archive exceeds the legacy local 10 MB attachment budget.')
(PUBLICATION/'package_source.py').write_text(packager,encoding='utf-8')
items=[]
for entry in selection['source_allowlist']:
    relative=entry['path']
    if relative=='analysis/odor_reference.json': continue
    source=PUBLICATION/relative if relative in ('README.md','.gitignore','package_source.py') else WORK/entry['canonical']
    target=SOFTWARE/relative
    if target.exists():
        assert sha(target) in (entry['existing_software_sha256'],sha(source),prior.get(target.relative_to(WORK/'gitlab/aerosense-software').as_posix())), 'Concurrent change: '+relative
    target.parent.mkdir(parents=True,exist_ok=True)
    if not target.exists() or sha(target)!=sha(source): shutil.copyfile(source,target)
    assert sha(target)==sha(source)
    items.append({'path':target.relative_to(WORK/'gitlab/aerosense-software').as_posix(),'sha256':sha(target),'bytes':target.stat().st_size,'canonical':source.relative_to(WORK).as_posix(),'role':'public-source adaptation (data retrieval, distribution and preserved license notices only)' if relative in ('README.md','.gitignore','package_source.py') else 'incoming source bytes unchanged'})
for relative in ('fetch_odor_reference.py','PUBLICATION_GUIDE.md'):
    source=PUBLICATION/relative;target=SOFTWARE/relative
    assert not target.exists() or sha(target)==sha(source),relative
    shutil.copyfile(source,target)
    items.append({'path':target.relative_to(WORK/'gitlab/aerosense-software').as_posix(),'sha256':sha(target),'bytes':target.stat().st_size,'canonical':source.relative_to(WORK).as_posix(),'role':'new source-only publication setup'})
assert not (SOFTWARE/'analysis/odor_reference.json').exists()
credential_findings=[]
for item in items:
    p=WORK/'gitlab/aerosense-software'/item['path']
    text=p.read_text(encoding='utf-8-sig')
    if re.search(r'(?:glpat-|ghp_)[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',text): credential_findings.append(item['path'])
assert not credential_findings,credential_findings
report={'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_only':True,'files':len(items),'items':items,'reference_data_in_git':False,'private_configuration_read_or_copied':False,'original_folder_unchanged':all(sha(original/x['path'])==x['sha256'] for x in selection['source_allowlist']),'credential_pattern_findings':credential_findings,'commit_push':'Not performed; waiting for release owner and all-agent source freeze','manifest_registration':'Pending final Engineering/Registry freeze','retained_duplicate_status':'16 task-created exact duplicates were blocked from cleanup before execution; mappings use pre-existing canonical files and these retained work copies are reported separately.'}
(OUT/'backend-software-preparation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'blocked-new-canonical-deduplication.json').write_text(json.dumps({'status':'blocked before execution','files_removed':0,'count':16,'action':'Native PowerShell exact Remove-Item after source/canonical SHA verification','review_response':'blocked by policy; no further reason provided','retry_performed':False,'plan':'new-canonical-duplicates-cleanup-plan.json'},indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='items'},ensure_ascii=True,indent=2))
