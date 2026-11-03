from pathlib import Path
import json, hashlib
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
def read(name):return json.loads((OUT/name).read_text(encoding='utf-8-sig'))
tests=read('game-tests-final.json')
report={
 'status':'Daily implementation complete; parent handles interactive UI review and authorizes subsequent synchronization.',
 'scope':'English-only public site, educational game and shared interfaces; source-language research artifacts and historic study locale metadata preserved.',
 'game_tests':{k:tests[k] for k in ('success','numTotalTests','numPassedTests','numFailedTests')},
 'game_typecheck':'All workspaces passed after final source correction.',
 'game_build':'Vite production build passed, 160 modules.',
 'game_reference_check':{'passed':True,'local_asset_references':102,'wiki_links':4},
 'game_external_asset_check':{'passed':True,'compiled_files':36,'official_iGEM_CDN_permitted':True},
 'game_mechanics':{k:read('game-mechanics-preservation.json')[k] for k in ('files','pass')},
 'shared_source':read('source-checks.json'),
 'preservation':{'all_26_page_media_sequences_unchanged':True,'25_page_tables_unchanged':True,'measurement_table_delta':'Separately authorized UCI-270/DoOR additions by parent task.'},
 'retired_daily_files':read('retired-translation-removal.json'),
 'official_sync_plan':{'executed':False,'files':read('source-sync-dryrun.json')['files'],'bytes':read('source-sync-dryrun.json')['bytes']},
 'publication':{'check_passed':True,'root_pages':28,'clean_routes':27,'manifest_paths':227,'external_runtime_errors':0,'missing_dependencies':0},
 'unmodified_boundaries':['GitHub checkout','Software checkout','research raw data','previously blocked cleanup targets'],
 'git_actions':{'stage':False,'commit':False,'push':False},
}
(OUT/'completion-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ('game_tests','game_mechanics','publication')}))
