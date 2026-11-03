"""Resolve the existing third-party header dependency for a host-only firmware test."""
from pathlib import Path
import datetime, hashlib, json, os, subprocess, sys
OUT=Path(__file__).resolve().parent;WORK=OUT.parents[2];TREE=OUT/'test-worktree'
library=WORK.parent/'PCB layout/chatgpt version/03_software/firmware/.pio/libdeps/esp32dev/ArduinoJson'
metadata=json.loads((library/'library.json').read_text(encoding='utf-8'))
assert metadata['version']=='6.21.5'
include=library/'src';assert (include/'ArduinoJson.h').is_file()
env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1',PYTHONUTF8='1')
env['CL']=env.get('CL','')+' /I"'+str(include)+'"'
process=subprocess.run([sys.executable,'-B','test_continuous_firmware.py'],cwd=TREE,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120)
log=OUT/'continuous-host-test.log';log.write_text(process.stdout+'\n'+process.stderr,encoding='utf-8')
result={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exit_code':process.returncode,'scope':'Actual firmware sampler and serializer with fake clock/SPI on host MSVC; no board or flashing. Test source unchanged.','dependency':'Existing ArduinoJson 6.21.5 headers read only; no .pio files copied or published','library_json_sha256':hashlib.sha256((library/'library.json').read_bytes()).hexdigest(),'log_sha256':hashlib.sha256(log.read_bytes()).hexdigest(),'output':process.stdout+'\n'+process.stderr}
(OUT/'continuous-host-test.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=True,indent=2));raise SystemExit(process.returncode)
