"""AeroSense authenticated LAN / reverse-proxy backend. Standard-library server.
python server.py --demo (explicit synthetic mode, loopback default)
For phone: --host 0.0.0.0; set AEROSENSE_UI_KEY and AEROSENSE_DEVICE_KEY first.
Internet deployment requires an HTTPS reverse proxy and its own security review.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
import argparse,os,json,sqlite3,time,threading,secrets,math,csv,io,uuid
ROOT=Path(__file__).resolve().parents[1];WEB=ROOT/'firmware/data'
class Store:
 def __init__(self,path,demo=False):
  self.db=sqlite3.connect(path,check_same_thread=False);self.lock=threading.RLock();self.demo=demo;self.pending=None;self.state='idle';self.remaining=0;self.next=0;self.config={};self.lastseen=0;self.lastack=None
  self.db.execute('CREATE TABLE IF NOT EXISTS results(id TEXT PRIMARY KEY,received REAL,mode TEXT,payload TEXT)');self.db.commit()
 def add(self,r):
  needed=['id','mode','amplitudeV','inPhaseV','quadratureV','valid','frequenciesHz','dutyPercent','ledMask']
  if any(k not in r for k in needed):raise ValueError('missing_result_fields')
  if r['mode'] not in ['hardware','demo'] or (not self.demo and r['mode']!='hardware'):raise ValueError('mode_mismatch')
  for key in ['amplitudeV','inPhaseV','quadratureV','frequenciesHz']:
   if len(r[key])!=4 or any(not isinstance(x,(int,float)) or not math.isfinite(x) for x in r[key]):raise ValueError('invalid_vector')
  if not isinstance(r['id'],str) or len(r['id'])>128 or not isinstance(r['valid'],bool):raise ValueError('invalid_result')
  with self.lock:self.db.execute('INSERT OR IGNORE INTO results VALUES(?,?,?,?)',(r['id'],time.time(),r['mode'],json.dumps(r)));self.db.commit()
 def records(self,limit=1000):
  with self.lock:return [json.loads(r[0]) for r in self.db.execute('SELECT payload FROM results ORDER BY received DESC LIMIT ?',(limit,))][::-1]
 def command(self,c):
  if c.get('action') not in ['start','stop']:raise ValueError('unknown_action')
  if c['action']=='start':
   for key,lo,hi,default in [('blocks',1,60,1),('intervalSec',3,300,3),('dutyPercent',1,50,25),('ledMask',0,15,15)]:
    v=c.get(key,default)
    if type(v)!=int or not lo<=v<=hi:raise ValueError('invalid_'+key)
    c[key]=v
  c={**c,'id':uuid.uuid4().hex,'expires':time.time()+30}
  with self.lock:
   if self.demo:
    if c['action']=='stop':self.remaining=0;self.state='idle'
    else:
     if self.remaining:raise ValueError('busy')
     self.config=c;self.remaining=c['blocks'];self.next=time.time()+2;self.state='measuring'
   else:
    if self.pending and c['action']!='stop':raise ValueError('command_pending')
    self.pending=c
  return c
 def update_demo(self):
  if not self.demo or not self.remaining or time.time()<self.next:return
  n=len(self.records());cfg=self.config;mask=cfg['ledMask'];a=[(.04+.008*j)*(cfg['dutyPercent']/25)*(1 if mask&(1<<j) else 0)+.00003*math.sin(n*.3+j) for j in range(4)]
  r=dict(id='demo-'+uuid.uuid4().hex,mode='demo',valid=True,amplitudeV=[abs(x) for x in a],inPhaseV=a,quadratureV=[0.00001]*4,frequenciesHz=[41,67,89,113],dutyPercent=cfg['dutyPercent'],ledMask=mask,samples=8000,sampleRateHz=4000,adcMin=1500,adcMax=9000,railSamples=0,maxIntervalErrorUs=0,rmsIntervalErrorUs=0,meanV=.2,rmsV=.05,batteryPercent=None,cellTemperatureC=None,note='Synthetic interface demonstration; not a biological measurement')
  self.add(r);self.remaining-=1;self.next=time.time()+cfg['intervalSec']+2;self.state='measuring' if self.remaining else 'idle'
 def status(self):
  with self.lock:
   self.update_demo();rs=self.records(1)
   if self.pending and self.pending['expires']<time.time():self.lastack={'id':self.pending['id'],'ok':False,'error':'expired_unacknowledged'};self.pending=None
   return dict(mode='demo' if self.demo else 'hardware',state=self.state if self.demo else ('online' if time.time()-self.lastseen<15 else 'offline'),remaining=self.remaining if self.demo else None,latest=rs[-1] if rs else None,command=self.pending,lastAck=self.lastack,batteryPercent=None,cellTemperatureC=None,modelStatus='No validated odor classifier installed')

def make_handler(store,ui_key,device_key):
 class H(BaseHTTPRequestHandler):
  def log_message(self,*args):pass
  def send(self,code,obj,ctype='application/json'):
   raw=json.dumps(obj,ensure_ascii=False,allow_nan=False).encode() if ctype=='application/json' else obj.encode() if isinstance(obj,str) else obj
   self.send_response(code);self.send_header('Content-Type',ctype);self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(raw)
  def auth(self,device=False):
   if secrets.compare_digest(self.headers.get('X-Device-Key' if device else 'X-Aero-Key',''),device_key if device else ui_key):return True
   self.send(401,{'error':'authentication_required'});return False
  def do_GET(self):
   p=self.path.split('?')[0]
   if p.startswith('/api/'):
    device=p.startswith('/api/device/')
    if not self.auth(device):return
    if p=='/api/status':self.send(200,store.status())
    elif p=='/api/history':self.send(200,store.records())
    elif p=='/api/export.json':self.send(200,{'schema':'aerosense-result-1','records':store.records(100000)})
    elif p=='/api/device/poll':
     store.lastseen=time.time();store.status();self.send(200,{'command':store.pending})
    else:self.send(404,{'error':'not_found'})
    return
   allowed={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/calibration.js':'calibration.js','/style.css':'style.css'}
   if p not in allowed:self.send(404,'Not found','text/plain');return
   f=WEB/allowed[p];ctype='text/html; charset=utf-8' if f.suffix=='.html' else 'application/javascript; charset=utf-8' if f.suffix=='.js' else 'text/css'
   self.send(200,f.read_bytes(),ctype)
  def do_POST(self):
   p=self.path;device=p.startswith('/api/device/')
   if not self.auth(device):return
   try:
    size=int(self.headers.get('Content-Length','0'))
    if not 0<size<=32768:raise ValueError('invalid_body_size')
    c=json.loads(self.rfile.read(size))
    if not isinstance(c,dict):raise ValueError('object_required')
    if p=='/api/command':self.send(200,{'ok':True,'command':store.command(c)})
    elif p=='/api/predict':
     path=os.environ.get('AEROSENSE_MODEL')
     if not path:self.send(409,{'error':'no_trained_model_installed'});return
     if c.get('featureKind')!='deltaFOverF0_LED_channels':raise ValueError('feature_kind_mismatch')
     import sys;sys.path.insert(0,str(ROOT/'analysis'));from odor_model import predict
     self.send(200,predict(json.loads(Path(path).read_text()),c['features']))
    elif p=='/api/device/result':store.add(c);store.lastseen=time.time();self.send(200,{'ok':True,'id':c['id']})
    elif p=='/api/device/ack':
     with store.lock:
      if store.pending and c.get('id')==store.pending['id']:store.lastack=c;store.pending=None
     self.send(200,{'ok':True})
    else:self.send(404,{'error':'not_found'})
   except (ValueError,TypeError,KeyError) as e:self.send(400,{'error':str(e)})
 return H
def main():
 p=argparse.ArgumentParser();p.add_argument('--host',default='127.0.0.1');p.add_argument('--port',type=int,default=8765);p.add_argument('--demo',action='store_true');p.add_argument('--db',default='aerosense.sqlite');a=p.parse_args()
 key=os.environ.get('AEROSENSE_UI_KEY');dev=os.environ.get('AEROSENSE_DEVICE_KEY')
 if a.host not in ['127.0.0.1','localhost'] and (not key or not dev):p.error('Set both authentication keys before LAN exposure')
 key=key or 'local-demo-key';dev=dev or secrets.token_urlsafe(32)
 print('http://'+a.host+':'+str(a.port),'DEMO' if a.demo else 'HARDWARE',flush=True)
 ThreadingHTTPServer((a.host,a.port),make_handler(Store(a.db,a.demo),key,dev)).serve_forever()
if __name__=='__main__':main()
