from pathlib import Path
import unittest,tempfile,sys,json,threading,urllib.request,urllib.error,time
ROOT=Path(__file__).resolve().parent;sys.path[:0]=[str(ROOT/'server'),str(ROOT/'analysis')]
from server import Store,make_handler,ThreadingHTTPServer
import numpy as np
from dlia import demodulate,unmix,F,FS
class Tests(unittest.TestCase):
 def setUp(self):
  self.store=Store(':memory:',True);self.http=ThreadingHTTPServer(('127.0.0.1',0),make_handler(self.store,'test-ui','test-device'));self.thread=threading.Thread(target=self.http.serve_forever,daemon=True);self.thread.start();self.url='http://127.0.0.1:'+str(self.http.server_port)
 def tearDown(self):self.http.shutdown();self.http.server_close();self.store.db.close()
 def request(self,path,body=None,key='test-ui',device=False):
  req=urllib.request.Request(self.url+path,data=json.dumps(body).encode() if body is not None else None,headers={'X-Device-Key' if device else 'X-Aero-Key':key,'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(req) as r:return r.status,json.loads(r.read())
  except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
 def test_auth(self):self.assertEqual(self.request('/api/status',key='wrong')[0],401)
 def test_invalid_config(self):self.assertEqual(self.request('/api/command',{'action':'start','dutyPercent':100})[0],400)
 def test_start_stop(self):
  self.assertEqual(self.request('/api/command',{'action':'start','blocks':2})[0],200);self.store.next=0;r=self.request('/api/status')[1];self.assertEqual(r['latest']['mode'],'demo');self.assertEqual(r['remaining'],1);self.request('/api/command',{'action':'stop'});self.assertEqual(self.store.remaining,0)
 def test_duplicate_result(self):
  self.store.command({'action':'start'});self.store.next=0;r=self.store.status()['latest'];self.store.add(r);self.assertEqual(len(self.store.records()),1)
 def test_nonfinite(self):
  self.store.command({'action':'start'});self.store.next=0;r=self.store.status()['latest'];r['amplitudeV'][0]=float('nan');self.assertEqual(self.request('/api/device/result',r,'test-device',True)[0],400)
 def test_expired_command(self):
  self.store.demo=False;self.store.command({'action':'start'});self.store.pending['expires']=0;self.store.status();self.assertIsNone(self.store.pending);self.assertFalse(self.store.lastack['ok'])
 def test_ack(self):
  self.store.demo=False;c=self.store.command({'action':'start'});self.request('/api/device/ack',{'id':c['id'],'ok':True},'test-device',True);self.assertIsNone(self.store.pending)
 def test_no_model(self):self.assertEqual(self.request('/api/predict',{'features':[1]*4,'featureKind':'deltaFOverF0_LED_channels'})[0],409)
 def test_lockin_and_unmix(self):
  t=np.arange(8000)/FS;amp=np.array([.01,.02,.03,.04]);v=.2+sum(a*np.cos(2*np.pi*f*t+.3) for a,f in zip(amp,F));r=demodulate(t,v);np.testing.assert_allclose(r['amplitude'],amp,rtol=1e-10);np.testing.assert_allclose(unmix(amp,np.eye(4)),amp)
 def test_singular_rejected(self):
  with self.assertRaises(ValueError):unmix(np.ones(4),np.ones((4,4)))
if __name__=='__main__':
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Tests));out=ROOT.parent/'validation/software_tests.json';out.write_text(json.dumps(dict(tests=result.testsRun,failures=len(result.failures),errors=len(result.errors),passed=result.wasSuccessful()),indent=2));sys.exit(not result.wasSuccessful())
