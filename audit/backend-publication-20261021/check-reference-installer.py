"""Check the deterministic public installer without network/device access."""
from pathlib import Path
import ast, hashlib, importlib.util, json, sys
sys.dont_write_bytecode=True
OUT=Path(__file__).resolve().parent;WORK=OUT.parents[2]
SOURCE=WORK/'gitlab/aerosense-software/code/aerosense/hardware/03_software'
DATA=WORK/'zenodo-release/reproduction-source/hardware-odor-backend-20261021/source/analysis/odor_reference.json'
spec=importlib.util.spec_from_file_location('reviewed_reference_installer',SOURCE/'fetch_odor_reference.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
fixture=OUT/'installer-fixtures';fixture.mkdir(exist_ok=True)
checks=[]
assert module.verify(DATA.read_bytes())==DATA.read_bytes();checks.append('Exact canonical reference accepted')
try: module.verify(DATA.read_bytes()+b' ');raise AssertionError('Invalid data accepted')
except ValueError: checks.append('Altered bytes rejected')
destination=fixture/'installed-reference.json'
assert module.install(destination,DATA) in ('exact reference installed','existing exact reference verified')
assert destination.read_bytes()==DATA.read_bytes();checks.append('Offline restore preserves exact reviewed bytes')
assert module.install(destination,fixture/'missing.json')=='existing exact reference verified';checks.append('Existing exact data verified without network/read of another input')
wrong=fixture/'edited-reference.json';wrong.write_bytes(b'{"edited":true}')
try: module.install(wrong,DATA);raise AssertionError('Edited data replaced')
except ValueError: pass
assert wrong.read_bytes()==b'{"edited":true}';checks.append('Different existing data are not overwritten')
assert module.DESTINATION==SOURCE/'analysis/odor_reference.json';checks.append('Public default targets the backend reference path')
for p in SOURCE.rglob('*.py'):
    if '__pycache__' not in p.parts:ast.parse(p.read_text(encoding='utf-8'),filename=str(p))
checks.append('All selected public Python sources parse')
result={'passed':True,'checks':checks,'count':len(checks),'network_used':False,'device_used':False,'reference_data_in_software_repository':(SOURCE/'analysis/odor_reference.json').exists(),'reference_sha256':hashlib.sha256(DATA.read_bytes()).hexdigest()}
assert not result['reference_data_in_software_repository']
(OUT/'reference-installer-qa.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,indent=2))
