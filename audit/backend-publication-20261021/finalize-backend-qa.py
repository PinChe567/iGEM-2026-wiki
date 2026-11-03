"""Summarize isolated checks and prepare exact cleanup of this task's test copies."""
from pathlib import Path
import datetime, hashlib, json, stat
OUT=Path(__file__).resolve().parent;WORK=OUT.parents[2]
read=lambda name:json.loads((OUT/name).read_text(encoding='utf-8-sig'))
source=read('backend-software-preparation.json')
tests=read('test-results.json')
continuous=read('continuous-host-test.json')
installer=read('reference-installer-qa.json')
selection=read('backend-source-selection.json')
assert all(r['exit_code']==0 for i,r in enumerate(tests['results']) if i!=3)
assert continuous['exit_code']==0 and installer['passed']
node_counts=[]
for number,key in [(2,'tests'),(5,'cases'),(7,'cases')]:
    output=json.loads((OUT/f'test-{number:02d}.log').read_text(encoding='utf-8'))
    assert output['passed'] and all(row['passed'] for row in output[key])
    node_counts.append(len(output[key]))
assert sum(node_counts)+10+15==103
canonical_new=[x for x in selection['source_allowlist'] if not x['canonical_reused']]
blocked=read('new-canonical-duplicates-cleanup-plan.json')['files']
summary={
    'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status':'Backend source frozen and ready for unified manifest/source review; no commit/push by this task.',
    'backend_kind':'Four-receptor Pearson reference-pattern comparator, not a trained PN-KC-MBON classifier',
    'receptor_map':{'D1':'Or22a + ORCO','D2':'Or35a + ORCO','D3':'Or85b + ORCO','D4':'Or98a + ORCO'},
    'source_files_prepared':source['files'],
    'reference_data_in_git':False,
    'reference_url':'https://static.igem.wiki/teams/6460/wiki/downloads/odor-reference.json',
    'reference_sha256':'4257e93ba2aee8e255e30461a69c781338f8b5d62bb0d5bc097bd92c3a310c77',
    'test_counts':{'python_unittest':75,'node_virtual_DOM_and_algorithms':103,'host_sampler_control_flow':29,'host_continuous_sampler_and_serializer':11,'reference_installer':7},
    'tested_cases_total':225,
    'backend_check':'passed; exact reviewed JSON loaded with trainedModelInstalled=false',
    'not_executed':[{'test':'test_history_browser.cjs','reason':'Playwright dependency unavailable; actual browser test not rerun through CLI per parent instruction. No browser check is claimed.'},{'test':'physical-board flashing/acceptance','reason':'Outside this publication review; no device was accessed.'},{'test':'full PlatformIO firmware/buildfs compile','reason':'Not rerun; host tests exercised actual extracted firmware sampler/serializer only.'},{'test':'legacy synthetic test_model.py main routine','reason':'Unchanged legacy code imported but its main-only synthetic training routine was not executed.'}],
    'P2_reference_24_values_exact':True,
    'DoOR_provenance':'Original cited reference vectors preserved. Four direct local HTTPS reads could not be completed because local certificate verification failed; source validation is not claimed from these failed requests.',
    'original_allowlist_hashes_unchanged':source['original_folder_unchanged'],
    'private_configuration_read_or_copied':False,
    'whitespace_check':'Passed with one-command core.whitespace=cr-at-eol; source CRLF bytes preserved, no Git setting changed.',
    'canonical_selection':{'new_incoming_files':len(canonical_new),'reused_existing_files':selection['canonical_reused_files'],'publication_adaptations_and_new_helpers':5},
    'retained_blocked_work_copies':{'count':len(blocked),'bytes':sum(x['bytes'] for x in blocked),'plan':'new-canonical-duplicates-cleanup-plan.json','action':'Removal blocked before execution; zero removed and no retry. These are not selected as duplicate canonicals.'},
    'pending':'Final Software and Zenodo manifest registration after Engineering/Registry freeze; root owns commit/push.'
}
(OUT/'backend-review-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
files=[]
for relative in ['test-worktree','installer-fixtures']:
    directory=OUT/relative
    assert directory.resolve().is_relative_to(OUT.resolve())
    for path in sorted(directory.rglob('*')):
        assert not path.is_symlink() and not path.stat().st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT
        if path.is_file():
            assert path.suffix!='.pyc'
            files.append({'path':path.relative_to(WORK).as_posix(),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'role':'Isolated test source/fixture or generated test result; source mappings and durable test logs retained outside this scope'})
(OUT/'temporary-test-cleanup-plan.json').write_text(json.dumps({'roots':['aerosense-wiki/audit/backend-publication-20261021/test-worktree','aerosense-wiki/audit/backend-publication-20261021/installer-fixtures'],'files':files,'count':len(files),'bytes':sum(x['bytes'] for x in files),'guard':'No canonical, original source, blocked copies, pyc or Git checkout is a deletion target.'},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'test_counts':summary['test_counts'],'retained_blocked':summary['retained_blocked_work_copies'],'temporary_test_files':len(files)},indent=2))
