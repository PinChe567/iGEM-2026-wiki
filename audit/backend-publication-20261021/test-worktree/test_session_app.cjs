// Integration/race checks against delivered app.js; no real browser/board claim.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {harness,record}=require('./test_ui.cjs');
const checks=[];
const plain=x=>JSON.parse(JSON.stringify(x));
async function test(name,fn){try{await fn();checks.push({name,passed:true});}catch(e){checks.push({name,passed:false,error:e.stack});}}
async function settle(){for(let i=0;i<12;i++)await Promise.resolve();}
function context(){return {calibration:{dark:[{...record(.001,0),id:'dark-frozen',ledMask:0}],baseline:[{...record(.101,0),id:'baseline-frozen'}],reference:[]},measuredCalibration:{version:'measured-complex-1',id:'corr-frozen',context:'cells-one',enabled:false,tauSec:2,blank:[],phase:[]}};}
function run(id='run-1',count=6){return Array.from({length:count},(_,i)=>({...record(.11,0),id:id+'-'+(i+1),sessionId:id,conditionTag:id,firmwareRevision:'continuous1',acquisitionSignature:'DDS4k_IQ8000_ADC2p5V_v2_adc2_41_67_89_113_duty25_mask15',adcMin:1000,adcMax:20000,meanV:.2,deviceTimeMs:101000+i*2000,blockIndex:i+1,plannedBlocks:count,periodSec:2,acquisitionMode:'continuous',continuousSegment:1,sessionInterrupted:false,gapBeforeUs:0,windowStartDeviceTimeMs:100000.125+i*2000,windowEndDeviceTimeMs:101999.875+i*2000}));}
function result(body,compound='benzaldehyde'){return {schema:'aerosense-odor-session-1',status:'exploratory_similarity',identifiedOdor:null,validated:false,recordCount:body.records.length,validRecordCount:body.records.length,curve:{timeSec:body.records.map((r,i)=>i*2),features:body.records.map(()=>[.01,.02,.03,.04]),recordIds:body.records.map(r=>r.id),valid:body.records.map(()=>true),gaps:[]},aggregate:{window:body.responseWindow||{startSec:-1,endSec:body.records.length*2-1},quality:{signalGuardPassed:true,patternContrastGuardPassed:true},literatureReference:{status:'exploratory_similarity',scores:[{compound,pearsonR:.9,similarityPercent:90},{compound:'other',pearsonR:.1,similarityPercent:10}]},p2Diagnostics:{status:'exploratory_similarity',scores:[]}},warnings:[]};}
async function seed(h,rs,ctx=context()){
 h.eval(`sessionContexts.set(AeroSession.key(${JSON.stringify(rs[0])}),${JSON.stringify(ctx)})`);
 h.setHistory(rs);h.setStatus({deviceId:'board',bootId:'boot1',sessionId:rs[0].sessionId,latest:rs.at(-1),historyLatestId:rs.at(-1).id,historyCompleteAvailable:true,continuousVersion:1,state:'idle',remaining:0,acquisitionMode:'continuous'});
 await h.els.connect.onclick();return ctx;
}

(async()=>{
 await test('firmware status exposes bootId for frozen session binding',()=>{
  const src=fs.readFileSync(path.join(__dirname,'firmware/src/main.cpp'),'utf8');
  const status=src.match(/String status\(\)\{([\s\S]*?)\n\}/)?.[1];
  assert(status);assert.match(status,/d\["bootId"\]\s*=\s*bootId/);
 });
 await test('start snapshot binds to new session and remains frozen across calibration edits',async()=>{
  const h=harness(),ctx=context(),rs=run();
  h.eval(`cal=${JSON.stringify(ctx.calibration)};correction=${JSON.stringify(ctx.measuredCalibration)}`);
  h.setStatus({deviceId:'board',bootId:'boot1',sessionId:'old-run',continuousVersion:1,remaining:0});await h.els.connect.onclick();
  h.els.runMode.value='continuous';h.els.durationSec.value='12';await h.els.start.onclick();
  assert(h.eval('pendingRunContext'));
  h.setStatus({sessionId:'run-1',latest:rs[0],historyLatestId:rs[0].id,state:'measuring',remaining:5,acquisitionMode:'continuous',historyCompleteAvailable:false});h.setHistory([rs[0]]);await h.eval('refresh()');
  assert.equal(h.eval('pendingRunContext'),null);
  assert.equal(h.eval('latest.sessionContext.calibration.baseline[0].id'),'baseline-frozen');
  h.eval("cal.baseline[0].id='changed-after-start';correction.context='changed-after-start'");
  h.setStatus({latest:rs[1],historyLatestId:rs[1].id});h.setHistory(rs.slice(0,2));await h.eval('refresh()');
  const frozen=plain(h.eval('AeroSession.frozen(AeroSession.group(records,latest))'));
  assert.deepEqual(frozen,ctx);
  const command=h.requests.find(x=>x.body?.action==='start').body;
  assert.equal(command.acquisitionMode,'continuous');assert.equal(command.durationSec,12);assert.equal(command.periodSec,2);
 });
 await test('last-four live history is recovered in full on stop despite unchanged latest ID',async()=>{
  const h=harness(),rs=run(),ctx=context();
  h.eval(`sessionContexts.set(AeroSession.key(${JSON.stringify(rs[0])}),${JSON.stringify(ctx)})`);
  h.setHistory(rs.slice(-4));h.setStatus({deviceId:'board',bootId:'boot1',sessionId:'run-1',latest:rs.at(-1),historyLatestId:rs.at(-1).id,historyCompleteAvailable:false,state:'measuring',remaining:1,acquisitionMode:'continuous'});
  await h.els.connect.onclick();assert.equal(h.eval('records.length'),4);
  const before=h.requests.filter(x=>x.url==='/api/history').length;
  h.setHistory(rs);h.setStatus({state:'idle',remaining:0,historyCompleteAvailable:true});await h.eval('refresh()');
  assert.equal(h.requests.filter(x=>x.url==='/api/history').length,before+1);
  assert.equal(h.eval('records.length'),6);
  assert(h.eval('records.every(r=>r.sessionContext&&!r.viewSnapshot.legacy)'));
 });
 await test('one-session export/import preserves all blocks frozen calibration and analysis inputs',async()=>{
  const h=harness(),rs=run(),ctx=await seed(h,rs);h.setPredict(async(url,body)=>result(body));
  await h.eval('analyzeOdor()');h.els.exportOdorSession.onclick();
  const report=JSON.parse(await h.downloads.at(-1).text());
  assert.equal(report.records.length,6);assert.equal(report.sessionId,'run-1');
  assert.deepEqual(report.records[0].sessionContext,ctx);
  assert.equal(report.records[0].sessionAnalysis.input.records.length,6);
  const g=harness();g.setPredict(async(url,body)=>result(body));await g.eval(`importReport(${JSON.stringify(report)})`);
  assert.equal(g.eval('records.length'),6);assert.equal(g.eval('odorSelection().rs.length'),6);
  g.eval("cal={dark:[],baseline:[],reference:[]};correction.context='unrelated'");
  await g.eval('analyzeOdor()');const sent=g.requests.find(x=>x.url==='/api/predict-session').body;
  assert.equal(sent.calibration.baseline[0].id,'baseline-frozen');
  assert.equal(sent.records[0].conditionTag,'run-1');assert.equal(sent.records[0].sessionInterrupted,false);
  assert(!('sessionContext' in sent.records[0]));assert(!('sessionAnalysis' in sent.records[0]));
 });
 await test('derived session data cannot recursively enter a new calibration measurement',()=>{
  const h=harness();const r={...record(),sessionContext:context(),sessionAnalysis:{input:{records:[record()]}},odorAnalysis:{input:{}},captureContext:'cells-one',captureCorrectionId:'corr-frozen'};
  const clean=plain(h.eval(`AeroHistory.measurement(${JSON.stringify(r)})`));
  for(const k of ['sessionContext','sessionAnalysis','odorAnalysis'])assert(!(k in clean));
  assert.equal(clean.captureContext,'cells-one');assert.equal(clean.captureCorrectionId,'corr-frozen');
 });
 await test('saved session import restores missing calibration after device-only history recovery',async()=>{
  const a=harness(),rs=run(),ctx=await seed(a,rs);a.els.exportOdorSession.onclick();
  const report=JSON.parse(await a.downloads.at(-1).text()),b=harness();
  b.setHistory(rs);b.setStatus({deviceId:'board',bootId:'boot1',sessionId:'run-1',latest:null,historyLatestId:rs.at(-1).id,historyCompleteAvailable:true,state:'idle',remaining:0});
  await b.els.connect.onclick();assert.equal(b.eval('records.length'),6);
  assert.equal(b.eval('records[0].viewSnapshot.legacy'),true);
  await b.eval(`importReport(${JSON.stringify(report)})`);
  assert.equal(b.eval('records.length'),6);
  assert.deepEqual(plain(b.eval('AeroSession.frozen(AeroSession.group(records,visibleRecord()))')),ctx);
 });
 await test('same record ID with altered raw I/Q is rejected during import',async()=>{
  const h=harness(),rs=run();await seed(h,rs);h.els.exportOdorSession.onclick();
  const report=JSON.parse(await h.downloads.at(-1).text());report.records[0].inPhaseV[0]+=.001;
  await assert.rejects(()=>h.eval(`importReport(${JSON.stringify(report)})`),/import_conflict/);
 });
 await test('late session response stays attached to original selection and does not replace another view',async()=>{
  const h=harness(),a=run('run-A'),b=run('run-B');await seed(h,a);
  h.eval(`sessionContexts.set(AeroSession.key(${JSON.stringify(b[0])}),${JSON.stringify(context())});${JSON.stringify(b)}.forEach(r=>addRecord(r,true))`);
  let resolve,body;h.setPredict(async(url,payload)=>{body=payload;return new Promise(r=>resolve=r);});
  const pending=h.eval('analyzeOdor()');await settle();assert(resolve);
  h.eval(`viewRecord(${JSON.stringify(b[0].id)})`);resolve(result(body,'run-A-only'));await pending;
  assert.equal(h.eval('visibleRecord().sessionId'),'run-B');
  assert(!h.els.odorSummary.textContent.includes('run-A-only'));
  assert.equal(h.eval("records.find(r=>r.id==='run-A-1').sessionAnalysis.input.records[0].sessionId"),'run-A');
  assert.equal(h.eval("records.find(r=>r.id==='run-B-1').sessionAnalysis"),undefined);
 });
 await test('edited response window rejects stale in-flight result until reanalysis',async()=>{
  const h=harness();await seed(h,run());h.els.odorWindowStart.value='0';h.els.odorWindowEnd.value='4';
  let resolve,body;h.setPredict(async(url,payload)=>{body=payload;return new Promise(r=>resolve=r);});
  const pending=h.eval('analyzeOdor()');await settle();assert(resolve);
  h.els.odorWindowEnd.value='8';h.els.odorWindowEnd.onchange();resolve(result(body,'old-window'));await pending;
  assert.equal(h.eval('Boolean(odorCurrent(odorSelection(),odorSaved(odorSelection())))'),false);
  assert(!h.els.odorSummary.textContent.includes('old-window'));
 });
 await test('clearing records during analysis cannot resurrect deleted session',async()=>{
  const h=harness();await seed(h,run());let resolve,body;
  h.setPredict(async(url,payload)=>{body=payload;return new Promise(r=>resolve=r);});
  const pending=h.eval('analyzeOdor()');await settle();assert(resolve);
  await h.eval('clearLocalHistory()');resolve(result(body));await pending;
  assert.equal(h.eval('records.length'),0);assert.equal(h.eval('latest'),null);
  assert(!h.els.odorSummary.textContent.includes('benzaldehyde'));
 });
 await test('automatic error runs once per source stamp and surfaces a stable reason',async()=>{
  const h=harness();await seed(h,run());let calls=0;
  h.setPredict(async()=>{calls++;throw Error('synthetic_backend_failure');});
  h.setStatus({odorBackend:{mode:'exploratory_reference_similarity'}});await h.eval('refresh()');await settle();
  for(let i=0;i<3;i++){h.eval('renderOdor()');await settle();}
  assert.equal(calls,1);assert(h.els.odorSummary.textContent.includes('synthetic_backend_failure'));
  assert.equal(h.eval('odorBusy'),false);
 });
 await test('continuous duration and capability guards preserve interval command semantics',async()=>{
  const h=harness();h.setStatus({deviceId:'board',bootId:'boot1',sessionId:'old',continuousVersion:1,scheduleVersion:1,remaining:0});await h.els.connect.onclick();
  h.els.runMode.value='continuous';
  for(const duration of ['9','11','121','10.5']){h.els.durationSec.value=duration;await h.els.start.onclick();}
  assert.equal(h.requests.filter(x=>x.body?.action==='start').length,0);
  h.els.durationSec.value='120';await h.els.start.onclick();const c=h.requests.find(x=>x.body?.action==='start').body;
  assert.equal(c.acquisitionMode,'continuous');assert.equal(c.durationSec,120);assert.equal(c.blocks,60);assert.equal(c.periodSec,2);
  h.setStatus({sessionId:'continuous-finished',state:'idle',remaining:0});await h.eval('refresh()');
  h.els.runMode.value='repeat';h.els.periodMinutes.value='1';h.els.blocks.value='3';await h.els.start.onclick();
  const interval=h.requests.filter(x=>x.body?.action==='start').at(-1).body;assert.equal(interval.periodSec,60);assert.equal(interval.blocks,3);assert(!('acquisitionMode' in interval));
  for(const status of [{deviceId:'board',bootId:'boot1',sessionId:'old'},{reportedDeviceStatus:{deviceId:'board',bootId:'boot1',sessionId:'old',state:'idle',remaining:0,continuousVersion:1}}]){
   const g=harness();g.setStatus(status);await g.els.connect.onclick();g.els.runMode.value='continuous';await g.els.start.onclick();assert(!g.requests.some(x=>x.body?.action==='start'));
  }
 });
 await test('cloud start ignores stale acknowledgements and clears a matching rejection',async()=>{
  const h=harness(),old={deviceId:'board',bootId:'boot1',sessionId:'old',state:'idle',remaining:0,scheduleVersion:1};
  h.setStatus({reportedDeviceStatus:old,lastAck:{id:'stale',ok:false,error:'old_failure'}});await h.els.connect.onclick();await h.els.start.onclick();
  const id=h.eval('pendingRunContext.commandId');assert(id);assert.equal(h.eval('pendingRunContext.requireAck'),true);
  h.setStatus({reportedDeviceStatus:{...old,sessionId:'new'},lastAck:{id:'stale',ok:true}});await h.eval('refresh()');
  assert.equal(h.eval('sessionContexts.size'),0);assert(h.eval('pendingRunContext'));
  h.setStatus({lastAck:{id,ok:false,error:'command_rejected'}});await h.eval('refresh()');
  assert.equal(h.eval('pendingRunContext'),null);assert.equal(h.eval('sessionContexts.size'),0);
 });
 await test('cloud start binds only after matching successful top-level acknowledgement',async()=>{
  const h=harness(),old={deviceId:'board',bootId:'boot1',sessionId:'old',state:'idle',remaining:0,scheduleVersion:1};
  h.setStatus({reportedDeviceStatus:old});await h.els.connect.onclick();await h.els.start.onclick();
  const id=h.eval('pendingRunContext.commandId');h.setStatus({reportedDeviceStatus:{...old,sessionId:'new'},lastAck:{id,ok:true}});await h.eval('refresh()');
  assert.equal(h.eval('pendingRunContext'),null);assert.equal(h.eval('sessionContexts.size'),1);
  assert(h.eval("sessionContexts.has(JSON.stringify(['board','boot1','new']))"));
 });
 await test('polling during start response cannot prematurely bind or null pending context',async()=>{
  const h=harness();h.setStatus({deviceId:'board',bootId:'boot1',sessionId:'old',continuousVersion:1,state:'idle',remaining:0});await h.els.connect.onclick();h.els.runMode.value='continuous';
  h.eval("const startRaceOriginalFetch=fetch;fetch=async(...args)=>{const response=await startRaceOriginalFetch(...args);if(args[0]==='/api/command')return {...response,json:async()=>{await new Promise(resolve=>globalThis.releaseStartResponse=resolve);return response.json();}};return response;}");
  const pending=h.els.start.onclick();await settle();assert(h.eval('typeof releaseStartResponse')==='function');
  h.setStatus({sessionId:'new'});await h.eval('refresh()');const premature=h.eval('sessionContexts.size');
  h.eval('releaseStartResponse()');await pending;
  assert.equal(premature,0);assert.equal(h.eval('pendingRunContext'),null);assert.equal(h.eval('sessionContexts.size'),1);
  assert(!h.els.error.textContent.includes('Cannot set'));
 });
 const report={passed:checks.every(x=>x.passed),checks:checks.length,method:'Node VM delivered-app integration; not physical hardware or a visual browser test',cases:checks};
 console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
})();
