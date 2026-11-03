"""Run source-selected tests against loopback fixtures, never a physical board."""
from pathlib import Path
import ast, datetime, hashlib, json, os, subprocess, sys
OUT=Path(__file__).resolve().parent
TREE=OUT/'test-worktree'
env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1',PYTHONUTF8='1')
commands=[
    [sys.executable,'-B','-m','unittest','-v','test_odor_pattern','test_odor_session','test_odor_integration','test_software','test_model'],
    ['node','test_correction.cjs'], ['node','test_calibration.cjs'],
    ['node','test_history_browser.cjs'], ['node','test_ui.cjs'],
    ['node','test_session_ui.cjs'], ['node','test_session_app.cjs'],
    [sys.executable,'-B','start_odor_backend.py','--check'],
    [sys.executable,'-B','test_adc_firmware.py'],
]
results=[]
for number,command in enumerate(commands,1):
    print(json.dumps({'starting':number,'command':command}),flush=True)
    start=datetime.datetime.now(datetime.timezone.utc).isoformat()
    process=subprocess.run(command,cwd=TREE,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180)
    log=OUT/f'test-{number:02d}.log'
    log.write_text(process.stdout+'\n'+process.stderr,encoding='utf-8')
    results.append({'command':command,'started_at_utc':start,'exit_code':process.returncode,'log':log.name,'log_sha256':hashlib.sha256(log.read_bytes()).hexdigest(),'output_tail':(process.stdout+'\n'+process.stderr)[-1000:]})
    print(json.dumps({'finished':number,'exit_code':process.returncode,'tail':results[-1]['output_tail']}),flush=True)
    (OUT/'test-results.json').write_text(json.dumps({'python':sys.version,'executable':sys.executable,'no_device_access':True,'fixtures':'local loopback HTTP and deterministic virtual DOM/C++ clock-SPI','PYTHONDONTWRITEBYTECODE':True,'results':results},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for path in TREE.rglob('*.py'):
    ast.parse(path.read_text(encoding='utf-8'),filename=str(path))
print(json.dumps({'commands':len(results),'passed':sum(x['exit_code']==0 for x in results),'failed':sum(x['exit_code']!=0 for x in results),'python_syntax_files':len(list(TREE.rglob('*.py')))}))
raise SystemExit(1 if any(x['exit_code'] for x in results) else 0)
