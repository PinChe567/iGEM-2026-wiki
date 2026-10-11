"""Software arithmetic tests only; no synthetic data are delivered as experiments."""
import tempfile,unittest,csv,json,subprocess,sys
from pathlib import Path
import numpy as np
from plot_validation import optical,POSITIONS
def rows():
 data=[]
 for i,led in enumerate(POSITIONS):
  def row(kind,source,block,z,level=0):
   return dict(session_id='unit_test',sample_id='synthetic',sample_kind=kind,level_relative=level,source_well=source,led_position=led,firmware_channel=i+1,block_id=block,I_V=z.real,Q_V=z.imag,valid='true',volume_uL=100,duty_percent=25,sample_rate_Hz=4000,frequency_Hz=[41,67,89,113][i])
  for k in range(5):data.append(row('blank','ALL','blank'+str(k),1+2j))
  for level in [1,2,3]:
   for k in range(5):data.append(row('level','ALL',f'level{level}_{k}',1+2j+level*.01,level))
  for j,well in enumerate(POSITIONS):
   for k in range(5):data.append(row('single_well',well,f'well{well}_{k}',1+2j+(.04 if i==j else .004),2))
 return data
class Tests(unittest.TestCase):
 def import_record(self,record):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td);source=root/'export.json';source.write_text(json.dumps({'records':[record]}),encoding='utf-8')
   mapping=root/'mapping.csv'
   with mapping.open('w',newline='',encoding='utf-8') as h:
    w=csv.DictWriter(h,['firmware_channel','led_position','frequency_Hz','verified_by']);w.writeheader();w.writerows([dict(firmware_channel=i+1,led_position=p,frequency_Hz=[41,67,89,113][i],verified_by='unit_test') for i,p in enumerate(POSITIONS)])
   out=root/'optical.csv'
   result=subprocess.run([sys.executable,str(Path(__file__).with_name('import_ui_json.py')),str(source),'--mapping',str(mapping),'--out',str(out),'--session','unit_test','--sample','synthetic','--kind','blank','--level','0','--source-well','ALL','--last','1'],capture_output=True,text=True)
   imported=[]
   if out.exists():
    with out.open(encoding='utf-8-sig') as h:imported=list(csv.DictReader(h))
   return result.returncode,imported,result.stderr
 def test_importer_rejects_demo(self):
  code,rows,error=self.import_record(dict(mode='demo'));self.assertNotEqual(code,0);self.assertEqual(rows,[]);self.assertIn('DEMO',error)
 def test_importer_preserves_invalid(self):
  record=dict(id='unit_test_only',mode='hardware',valid=False,ledMask=15,frequenciesHz=[41,67,89,113],inPhaseV=[0]*4,quadratureV=[0]*4,dutyPercent=25,sampleRateHz=4000)
  code,imported,error=self.import_record(record);self.assertEqual(code,0,error);self.assertEqual(len(imported),4);self.assertTrue(all(r['valid']=='false' for r in imported))
 def test_importer_rejects_text_boolean(self):
  code,rows,error=self.import_record(dict(mode='hardware',valid='false'));self.assertNotEqual(code,0);self.assertEqual(rows,[]);self.assertIn('JSON boolean',error)
 def test_complex_subtraction_and_matrix(self):
  with tempfile.TemporaryDirectory() as td:
   s=optical(rows(),Path(td),Path(td)/'no_model.json')[0];m=np.array(s['amplitude_matrix_V']);self.assertTrue(np.allclose(np.diag(m),.04));self.assertTrue(np.allclose(np.array(s['row_normalized']).sum(1),1));self.assertAlmostEqual(s['levels'][0]['mean_corrected_V'],.01)
 def test_duplicate_rejected(self):
  r=rows();r.append(r[0].copy())
  with tempfile.TemporaryDirectory() as td:self.assertRaises(ValueError,optical,r,Path(td),Path(td)/'none')
 def test_mixed_conditions_rejected(self):
  r=rows();r[-1]['duty_percent']=20
  with tempfile.TemporaryDirectory() as td:self.assertRaises(ValueError,optical,r,Path(td),Path(td)/'none')
 def test_nonfinite_rejected(self):
  r=rows();r[0]['I_V']='nan'
  with tempfile.TemporaryDirectory() as td:self.assertRaises(ValueError,optical,r,Path(td),Path(td)/'none')
 def test_missing_blank_not_reported_pass(self):
  r=[x for x in rows() if x['sample_kind']!='blank']
  with tempfile.TemporaryDirectory() as td:s=optical(r,Path(td),Path(td)/'none')[0];self.assertIn('incomplete',s['matrix_status'])
if __name__=='__main__':unittest.main()
