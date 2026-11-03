"""AeroSense authenticated LAN / reverse-proxy backend. Standard-library server.
python server.py --demo (explicit synthetic mode, loopback default)
For phone: --host 0.0.0.0; set AEROSENSE_UI_KEY and AEROSENSE_DEVICE_KEY first.
Internet deployment requires an HTTPS reverse proxy and its own security review.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
import argparse,os,json,sqlite3,time,threading,secrets,math,csv,io,uuid,sys
ROOT=Path(__file__).resolve().parents[1];WEB=ROOT/'firmware/data'
sys.path.insert(0,str(ROOT/'analysis'))
from device_bridge import DeviceBridge
from odor_pattern import analyze as analyze_pattern
from odor_session import analyze_session

def odor_status():
 return {'mode':'exploratory_reference_similarity','trainedModelInstalled':False,
         'validated':False,'receptorOrder':['Or22a','Or35a','Or85b','Or98a'],
         'sessionAnalysis':True,'sessionSchema':'aerosense-odor-session-request-1'}
class Store:
 def __init__(self,path,demo=False):
  self.db=sqlite3.connect(path,check_same_thread=False);self.lock=threading.RLock();self.demo=demo;self.pending=None;self.state='idle';self.remaining=0;self.next=0;self.config={};self.lastseen=0;self.lastack=None;self.device_status=None;self.device_status_at=0;self.demo_boot=uuid.uuid4().hex;self.demo_epoch=time.time();self.finished=0;self.block_start=0
  self.db.execute('CREATE TABLE IF NOT EXISTS results(id TEXT PRIMARY KEY,received REAL,mode TEXT,payload TEXT)');self.db.commit()
 def add(self,r):
  needed=['id','mode','amplitudeV','inPhaseV','quadratureV','valid','frequenciesHz','dutyPercent','ledMask']
  if any(k not in r for k in needed):raise ValueError('missing_result_fields')
  if r['mode']!=('demo' if self.demo else 'hardware'):raise ValueError('mode_mismatch')
  for key in ['amplitudeV','inPhaseV','quadratureV','frequenciesHz']:
   if not isinstance(r[key],list) or len(r[key])!=4 or any(type(x) not in (int,float) or not math.isfinite(x) for x in r[key]):raise ValueError('invalid_vector')
  if not isinstance(r['id'],str) or not r['id'] or len(r['id'])>128 or not isinstance(r['valid'],bool):raise ValueError('invalid_result')
  for k,lo,hi in [('dutyPercent',1,50),('ledMask',0,15)]:
   if type(r[k])!=int or not lo<=r[k]<=hi:raise ValueError('invalid_'+k)
  if any(v<0 for v in r['amplitudeV']) or r['frequenciesHz']!=[41,67,89,113]:raise ValueError('invalid_channels')
  # Optional metadata keeps older firmware compatible; new correction requires it.
  if 'deviceTimeMs' in r and r['deviceTimeMs'] is not None and (type(r['deviceTimeMs']) not in (int,float) or not math.isfinite(r['deviceTimeMs']) or r['deviceTimeMs']<0):raise ValueError('invalid_device_timestamp')
  with self.lock:self.db.execute('INSERT OR IGNORE INTO results VALUES(?,?,?,?)',(r['id'],time.time(),r['mode'],json.dumps(r)));self.db.commit()
 def records(self,limit=1000):
  with self.lock:return [json.loads(r[0]) for r in self.db.execute('SELECT payload FROM results WHERE mode=? ORDER BY received DESC LIMIT ?',('demo' if self.demo else 'hardware',limit))][::-1]
 def command(self,c):
  if c.get('action') not in ['start','stop','pause','resume','clearHistory']:raise ValueError('unknown_action')
  if c['action']=='start':
   mode=c.get('acquisitionMode','interval')
   if mode not in ['interval','continuous']:raise ValueError('invalid_acquisition_mode')
   c['acquisitionMode']=mode
   if mode=='continuous':
    duration=c.get('durationSec')
    if type(duration)!=int or not 10<=duration<=120 or duration%2:raise ValueError('continuous_duration_requires_even_10_to_120_seconds')
    c['blocks']=duration//2;c['periodSec']=2
   if 'periodSec' not in c:
    legacy=c.get('intervalSec',3)
    if type(legacy)!=int or not 3<=legacy<=300:raise ValueError('invalid_intervalSec')
    c['periodSec']=legacy+2
   for key,lo,hi,default in [('blocks',1,60,1),('periodSec',2 if mode=='continuous' else 5,3600,60),('dutyPercent',1,50,25),('ledMask',0,15,15)]:
    v=c.get(key,default)
    if type(v)!=int or not lo<=v<=hi:raise ValueError('invalid_'+key)
    c[key]=v
   if not isinstance(c.get('conditionTag',''),str) or len(c.get('conditionTag','').encode('utf8'))>240:raise ValueError('invalid_sample_label')
  c={**c,'id':uuid.uuid4().hex,'expires':time.time()+30}
  with self.lock:
   if self.demo:
    if c['action']=='stop':self.remaining=0;self.state='idle'
    elif c['action']=='pause':
     if not self.remaining or self.state=='paused':raise ValueError('no_active_schedule')
     self.state='paused';self.config['sessionInterrupted']=True
    elif c['action']=='resume':
     if self.state!='paused' or not self.remaining:raise ValueError('no_paused_schedule')
     if self.config.get('acquisitionMode')=='continuous':
      self.config['continuousSegment']=self.config.get('continuousSegment',1)+1;self.block_start=time.time();self.next=self.block_start+2;self.state='measuring'
     else:self.next=time.time()+3;self.state='waiting'
    elif c['action']=='clearHistory':
     if self.remaining:raise ValueError('end_schedule_before_delete')
     self.db.execute('DELETE FROM results WHERE mode=?',('demo',));self.db.commit();self.finished=0;self.config={}
    else:
     if self.remaining:raise ValueError('busy')
     self.config={**c,'continuousSegment':1,'sessionInterrupted':False};self.remaining=c['blocks'];self.finished=0;self.block_start=time.time();self.next=self.block_start+2;self.state='measuring'
   else:
    if self.pending and c['action']!='stop':raise ValueError('command_pending')
    self.pending=c
  return c
 def update_demo(self):
  if not self.demo or not self.remaining or self.state=='paused' or time.time()<self.next:return
  if self.state=='waiting':self.block_start=time.time();self.next=self.block_start+2;self.state='measuring';return
  n=len(self.records());cfg=self.config;mask=cfg['ledMask'];a=[(.04+.008*j)*(cfg['dutyPercent']/25)*(1 if mask&(1<<j) else 0)+.00003*math.sin(n*.3+j) for j in range(4)]
  r=dict(id='demo-'+uuid.uuid4().hex,mode='demo',valid=True,amplitudeV=[math.hypot(x,.00001) for x in a],inPhaseV=a,quadratureV=[0.00001]*4,frequenciesHz=[41,67,89,113],dutyPercent=cfg['dutyPercent'],ledMask=mask,samples=8000,sampleRateHz=4000,adcMin=1500,adcMax=9000,railSamples=0,maxIntervalErrorUs=0,rmsIntervalErrorUs=0,meanV=.2,rmsV=.05,batteryPercent=None,cellTemperatureC=None,note='Synthetic interface demonstration; not a biological measurement')
  r.update(deviceId='DEMO',bootId=self.demo_boot,firmware='AeroSense-demo',processingSchema=2,iqConvention='I_cos_Q_sin_peak_V',deviceTimeMs=(time.time()-self.demo_epoch)*1000,acquisitionSignature=f'DEMO_DDS4k_IQ8000_duty{cfg["dutyPercent"]}_mask{mask}')
  r.update(conditionTag=cfg.get('conditionTag',''),periodSec=cfg['periodSec'],sessionId=cfg['id'],blockIndex=self.finished+1,plannedBlocks=cfg['blocks'],blockStartMs=(self.block_start-self.demo_epoch)*1000)
  r.update(acquisitionMode=cfg.get('acquisitionMode','interval'),firmwareRevision='AeroSense-demo-session-1')
  if cfg.get('acquisitionMode')=='continuous':
   start=(self.block_start-self.demo_epoch)*1000;r.update(deviceTimeMs=start+999.875,windowStartDeviceTimeMs=start,windowEndDeviceTimeMs=start+1999.75,gapBeforeUs=0,continuousSegment=cfg['continuousSegment'],sessionInterrupted=cfg['sessionInterrupted'])
  self.add(r);self.remaining-=1;self.finished+=1
  if cfg.get('acquisitionMode')=='continuous':self.block_start+=2;self.next=self.block_start+2;self.state='measuring' if self.remaining else 'idle'
  else:self.next=max(self.block_start+cfg['periodSec'],time.time()+3);self.state='waiting' if self.remaining else 'idle'
 def status(self):
  with self.lock:
   self.update_demo();rs=self.records(1)
   if self.pending and self.pending['expires']<time.time():self.lastack={'id':self.pending['id'],'ok':False,'error':'expired_unacknowledged'};self.pending=None
   return dict(mode='demo' if self.demo else 'hardware',state=self.state if self.demo else ('online' if time.time()-self.lastseen<15 else 'offline'),remaining=self.remaining if self.demo else None,scheduleVersion=1 if self.demo else None,continuousVersion=1 if self.demo else None,acquisitionMode=self.config.get('acquisitionMode','interval') if self.demo else None,sessionId=self.config.get('id') if self.demo else None,durationSec=self.config.get('durationSec') if self.demo else None,continuousSegment=self.config.get('continuousSegment',1) if self.demo else None,sessionInterrupted=self.config.get('sessionInterrupted',False) if self.demo else None,plannedBlocks=self.config.get('blocks',0) if self.demo else None,completedBlocks=self.finished if self.demo else None,periodSec=self.config.get('periodSec',60) if self.demo else None,nextStartInSec=max(0,self.next-time.time()) if self.demo and self.state=='waiting' else 0,rawAvailable=False,latest=rs[-1] if rs else None,command=self.pending,lastAck=self.lastack,batteryPercent=None,cellTemperatureC=None,modelStatus='No validated odor classifier installed',reportedDeviceStatus=self.device_status,reportedStatusAgeSec=time.time()-self.device_status_at if self.device_status_at else None)

def make_handler(store,ui_key,device_key,bridge=None):
 class H(BaseHTTPRequestHandler):
  def log_message(self,*args):pass
  def send(self,code,obj,ctype='application/json'):
   raw=obj if isinstance(obj,bytes) else json.dumps(obj,ensure_ascii=False,allow_nan=False).encode() if ctype=='application/json' else obj.encode() if isinstance(obj,str) else obj
   self.send_response(code);self.send_header('Content-Type',ctype);self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(raw)
  def auth(self,device=False):
   if secrets.compare_digest(self.headers.get('X-Device-Key' if device else 'X-Aero-Key',''),device_key if device else ui_key):return True
   self.send(401,{'error':'authentication_required'});return False
  def do_GET(self):
   p=self.path.split('?')[0]
   if p.startswith('/api/'):
    device=p.startswith('/api/device/')
    if not self.auth(device):return
    if bridge and p in DeviceBridge.GET_ROUTES:
     code,data,ctype=bridge.request('GET',self.path)
     if p=='/api/status' and code==200:
      try:
       status=json.loads(data)
       if not isinstance(status,dict):raise ValueError('invalid_status')
       status['odorBackend']=odor_status()
       self.send(200,status)
      except (ValueError,TypeError):self.send(502,{'error':'invalid_device_status'})
     else:self.send(code,data,ctype)
    elif p=='/api/odor-model':self.send(200,odor_status())
    elif p=='/api/status':self.send(200,{**store.status(),'odorBackend':odor_status()})
    elif p=='/api/history':self.send(200,store.records())
    elif p=='/api/export.json':self.send(200,{'schema':'aerosense-result-1','records':store.records(100000)})
    elif p=='/api/device/poll':
     store.lastseen=time.time();store.status();self.send(200,{'command':store.pending})
    else:self.send(404,{'error':'not_found'})
    return
   allowed={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/calibration.js':'calibration.js','/correction.js':'correction.js','/history.js':'history.js','/style.css':'style.css','/odor_ui.js':'odor_ui.js','/session.js':'session.js'}
   if p not in allowed:self.send(404,'Not found','text/plain');return
   f=WEB/allowed[p];ctype='text/html; charset=utf-8' if f.suffix=='.html' else 'application/javascript; charset=utf-8' if f.suffix=='.js' else 'text/css'
   self.send(200,f.read_bytes(),ctype)
  def do_POST(self):
   p=self.path;device=p.startswith('/api/device/')
   if not self.auth(device):return
   try:
    size=int(self.headers.get('Content-Length','0'))
    cap=2097152 if p=='/api/predict-session' else 262144 if p=='/api/predict' else 32768
    if not 0<size<=cap:raise ValueError('invalid_body_size')
    c=json.loads(self.rfile.read(size),parse_constant=lambda _: (_ for _ in ()).throw(ValueError('nonfinite_json')))
    if not isinstance(c,dict):raise ValueError('object_required')
    if bridge and p=='/api/command':
     code,data,ctype=bridge.request('POST',p,c);self.send(code,data,ctype)
    elif p=='/api/command':self.send(200,{'ok':True,'command':store.command(c)})
    elif p=='/api/predict-session':self.send(200,analyze_session(c))
    elif p=='/api/predict':
     if 'record' in c:
      self.send(200,analyze_pattern(c));return
     # Preserve the old explicitly installed 4-feature MLP API for callers.
     # It is not the absent 10-receptor SNN and is not used by the new UI path.
     path=os.environ.get('AEROSENSE_MODEL')
     if not path:self.send(409,{'error':'no_trained_model_installed'});return
     if c.get('featureKind')!='deltaFOverF0_LED_channels':raise ValueError('feature_kind_mismatch')
     import sys;sys.path.insert(0,str(ROOT/'analysis'));from odor_model import predict
     self.send(200,predict(json.loads(Path(path).read_text()),c['features']))
    elif p=='/api/device/result':store.add(c);store.lastseen=time.time();self.send(200,{'ok':True,'id':c['id']})
    elif p=='/api/device/status':
     if c.get('mode')!='hardware' or not isinstance(c.get('state'),str):raise ValueError('invalid_device_status')
     with store.lock:store.device_status={k:c.get(k) for k in ['mode','state','boardValidated','filesystemReady','uploadQueue','wifiConnected','deviceId','error','remaining','plannedBlocks','completedBlocks','periodSec','paused','nextStartInSec','scheduleVersion','firmwareRevision','historyCount','historyCapacity','historyLatestId','rawRecordId','rawAvailable']};store.device_status_at=time.time();store.lastseen=time.time()
     self.send(200,{'ok':True})
    elif p=='/api/device/ack':
     with store.lock:
      if store.pending and c.get('id')==store.pending['id']:
       if store.pending['action']=='clearHistory' and c.get('ok') is True:store.db.execute('DELETE FROM results WHERE mode=?',('hardware',));store.db.commit()
       store.lastack=c;store.pending=None
     self.send(200,{'ok':True})
    else:self.send(404,{'error':'not_found'})
   except (ValueError,TypeError,KeyError) as e:self.send(400,{'error':str(e)})
   except OSError:self.send(503,{'error':'server_storage_or_model_unavailable'})
 return H
def main():
 p=argparse.ArgumentParser();p.add_argument('--host',default='127.0.0.1');p.add_argument('--port',type=int,default=8765);p.add_argument('--demo',action='store_true');p.add_argument('--db',default='aerosense.sqlite');p.add_argument('--device-url',help='Direct board URL, normally http://192.168.4.1');a=p.parse_args()
 key=os.environ.get('AEROSENSE_UI_KEY');dev=os.environ.get('AEROSENSE_DEVICE_KEY')
 if a.demo and a.device_url:p.error('--demo and --device-url are mutually exclusive')
 if a.host not in ['127.0.0.1','localhost'] and (not key or (not a.device_url and not dev)):p.error('Set authentication keys before LAN exposure')
 bridge=None
 if a.device_url:
  board_key=os.environ.get('AEROSENSE_BOARD_KEY')
  if not board_key:p.error('Set AEROSENSE_BOARD_KEY to the existing board API_KEY')
  try:bridge=DeviceBridge(a.device_url,board_key)
  except ValueError as e:p.error(str(e))
 key=key or 'local-demo-key';dev=dev or secrets.token_urlsafe(32)
 print('http://'+a.host+':'+str(a.port),'DEMO' if a.demo else 'HARDWARE BRIDGE' if bridge else 'HARDWARE',flush=True)
 ThreadingHTTPServer((a.host,a.port),make_handler(Store(a.db,a.demo),key,dev,bridge)).serve_forever()
if __name__=='__main__':main()
