// DOM/API harness for the delivered browser script. This is not a visual browser test.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,checks=[];let serial=0;
function record(i=.02,q=-.01){return {id:`ui-synthetic-${++serial}`,mode:'hardware',deviceId:'board',bootId:'boot1',firmware:'AeroSense',processingSchema:2,iqConvention:'I_cos_Q_sin_peak_V',acquisitionSignature:'DDS4k-test',deviceTimeMs:serial*5000,valid:true,samples:8000,sampleRateHz:4000,dutyPercent:25,ledMask:15,frequenciesHz:[41,67,89,113],railSamples:0,maxIntervalErrorUs:0,inPhaseV:Array(4).fill(i),quadratureV:Array(4).fill(q),amplitudeV:Array(4).fill(Math.hypot(i,q))};}
function harness(){
 const els={},storage=new Map(),downloads=[],requests=[],filenames=[];let status={mode:'hardware',state:'idle',latest:null},command=0,rawText='',history=[],predictHandler=null;
 const canvas={clearRect(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 function el(id){return els[id]||(els[id]={id,value:'',checked:false,textContent:'',dataset:{},style:{},width:1000,height:260,children:[],append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;},scrollIntoView(){},getContext:()=>canvas,addEventListener(t,f){this['on'+t]=f;},click(){if(this.download)filenames.push(this.download);this.onclick?.();},parentElement:{append(){}}});}
 const sandbox={console,Date,Math,JSON,Number,String,Array,Object,Map,Set,Error,Blob,structuredClone,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  document:{getElementById:el,querySelectorAll:()=>[],createElement:()=>el('created-'+Math.random()),documentElement:{}},
  URL:{createObjectURL:b=>{downloads.push(b);return 'blob:fake';},revokeObjectURL(){}},
  confirm:()=>true,setTimeout:()=>0,setInterval:()=>1,clearInterval(){},crypto:{randomUUID:()=>`cal-${++command}`},
  fetch:async(url,options)=>{requests.push({url,body:options?.body?JSON.parse(options.body):null});return {ok:true,json:async()=>url.startsWith('/api/predict')&&predictHandler?predictHandler(url,options?.body?JSON.parse(options.body):null):url==='/api/history'?structuredClone(history):url==='/api/status'?structuredClone(status):url==='/api/odor-model'?{mode:'exploratory_reference_similarity'}:url==='/api/predict'?{status:'exploratory_similarity',features:[.1,.2,.3,.4],identifiedOdor:null,scores:[],controls:[],warnings:[]}: {command:{id:`cmd-${++command}`}},text:async()=>rawText};}};
 for(const m of fs.readFileSync(path.join(root,'firmware/data/index.html'),'utf8').matchAll(/id="([^"]+)"/g))el(m[1]);
 for(const [k,v] of Object.entries({durationSec:60,odorScope:'session',odorReference:'door',duty:25,periodMinutes:1,runMode:'single',blocks:3,chartMode:'mean',mask:15,capture:'off',key:'synthetic-key'}))el(k).value=String(v);
 vm.createContext(sandbox);for(const file of ['correction.js','calibration.js','history.js','session.js','odor_ui.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,'firmware/data',file),'utf8'),sandbox,{filename:file});
 return {els,storage,downloads,requests,filenames,eval:s=>vm.runInContext(s,sandbox),setStatus:s=>status={...status,...s},setRaw:s=>rawText=s,setHistory:s=>history=s,setPredict:f=>predictHandler=f,getStatus:()=>status};
}
async function test(name,fn){try{await fn();checks.push({name,passed:true});}catch(e){checks.push({name,passed:false,error:e.stack});}}
module.exports={harness,record};
if(require.main===module)(async()=>{
 const h=harness();h.els.conditionTag.value='B_CAL';h.els.notes.value='first label';const first=record();h.setStatus({latest:first});await h.els.connect.onclick();
 await test('record labels snapshotted on first receipt',async()=>{h.els.conditionTag.value='NE_C';h.els.notes.value='changed';await h.eval('refresh()');const r=h.eval('records[0]');assert.equal(r.conditionTag,'B_CAL');assert.equal(r.notes,'first label');assert.equal(h.eval('records.length'),1);});
 await test('new record receives new label without signature change',async()=>{h.setStatus({latest:record()});await h.eval('refresh()');assert.equal(h.eval('records[1].conditionTag'),'NE_C');assert.equal(h.eval('AeroCorrection.signature(records[0])'),h.eval('AeroCorrection.signature(records[1])'));});
 h.els.correctionContext.value='optical-condition-A';h.els.correctionContext.onchange();await h.els.collectBlank.onclick();const cmd=h.requests.filter(r=>r.url==='/api/command').at(-1);
 await test('guided blank uses five all-LED blocks',()=>{assert.equal(cmd.body.blocks,5);assert.equal(cmd.body.ledMask,15);assert.equal(h.eval('correction.enabled'),false);});
 await test('cloud capture ignores stale failed acknowledgement',async()=>{h.setStatus({lastAck:{id:'old-command',ok:false,error:'old error'},latest:record()});await h.eval('refresh()');assert.notEqual(h.eval('correctionCapture'),null);assert.equal(h.eval('correction.blank.length'),0);});
 h.setStatus({lastAck:{id:h.eval('correctionCapture.commandId'),ok:true}});
 for(let k=0;k<5;k++){h.setStatus({latest:record()});await h.eval('refresh()');}
 await test('blank capture stops exactly at five unique blocks',()=>{assert.equal(h.eval('correction.blank.length'),5);assert.equal(h.eval('correctionCapture'),null);});
 const oldId=h.eval('correction.id');await h.els.collectPhase.onclick();h.setStatus({lastAck:{id:h.eval('correctionCapture.commandId'),ok:true}});
 for(let k=0;k<5;k++){h.setStatus({latest:record(.12,-.01)});await h.eval('refresh()');}
 await test('phase capture preserves blank and starts a new calibration revision',()=>{assert.equal(h.eval('correction.blank.length'),5);assert.equal(h.eval('correction.phase.length'),5);assert.notEqual(h.eval('correction.id'),oldId);assert(h.eval(`correctionHistory[${JSON.stringify(oldId)}]`));});
 h.els.enableCorrection.checked=true;h.els.enableCorrection.onchange();
 await test('measured correction is explicitly enabled and leaves raw values unchanged',()=>{assert.equal(h.eval('correction.enabled'),true);assert.equal(h.eval('latest.inPhaseV[0]'),.12);assert(Math.abs(h.eval('processedHistory.at(-1).channels[0].inPhaseV')-.1)<1e-12);});
 h.els.baseline.onclick();const f0Id=h.eval('latest.id');h.els.export.onclick();const exportData=JSON.parse(await h.downloads.at(-1).text());
 await test('JSON exports raw labels and complete measured provenance',()=>{assert.equal(exportData.records[0].conditionTag,'B_CAL');assert.equal(exportData.records[0].inPhaseV[0],.02);assert.equal(exportData.measuredCalibration.blank.length,5);assert.equal(exportData.measuredCalibration.phase.length,5);assert(exportData.measuredProcessing.length>0);assert(exportData.measuredCalibrationHistory[oldId]);assert.equal(exportData.normalizationReferenceRecords[f0Id].captureCorrectionId,exportData.measuredCalibration.id);});
 await test('CSV contains raw and corrected channels',async()=>{h.els.csv.onclick();const csv=await h.downloads.at(-1).text();assert(csv.includes('D1_rawI_V'));assert(csv.includes('D1_correctedMagnitude_V'));assert(csv.includes('D1_EMA_projection_V'));assert(csv.includes('B_CAL'));});
 await test('changing duty disables correction without deleting raw records',()=>{const n=h.eval('records.length');h.els.duty.value='20';h.els.duty.onchange();assert.equal(h.eval('correction.enabled'),false);assert.equal(h.eval('records.length'),n);});
 await test('context changes invalidate previous living calibration',()=>{h.eval('cal.baseline=[latest]');h.els.correctionContext.value='new-optics';h.els.correctionContext.onchange();assert.equal(h.eval('cal.baseline.length'),0);assert.equal(h.eval('correction.blank.length'),0);});
 await test('language switching clears transient alert',()=>{h.eval("message('old alert')");h.els.lang.onclick();assert.equal(h.els.error.textContent,'');});
 await test('partial timing failure stays invalid and exports firmware diagnostics',async()=>{
  const f=harness(),failed={...record(),valid:false,samples:1,error:'sample_timing_or_overrun',firmwareRevision:'2026-10-12-timing1',timingFault:'adc_read_too_long',maxSampleStartDelayUs:12,maxAdcReadDurationUs:230,faultTick:1,faultNotifications:1};
  f.setStatus({state:'fault',error:failed.error,latest:failed});await f.els.connect.onclick();
  assert.equal(f.els.qc.textContent,'\u4e0d\u80fd\u5224\u8b80');assert.equal(f.els.mean.textContent,'\u2014');
  assert.equal(f.eval('records.length'),1);
  f.els.dark.onclick();assert.equal(f.eval('cal.dark.length'),0);
  f.els.export.onclick();const saved=JSON.parse(await f.downloads.at(-1).text()).records[0];
  for(const k of ['valid','samples','error','firmwareRevision','timingFault','maxSampleStartDelayUs','maxAdcReadDurationUs','faultTick','faultNotifications'])assert.equal(saved[k],failed[k]);
 });
 await test('adc2 JSON retains split timing diagnostics and acquisition identity',async()=>{
  const f=harness(),r={...record(),firmwareRevision:'2026-10-14-adc2',acquisitionSignature:'DDS4k_IQ8000_ADC2p5V_v2_adc2_41_67_89_113_duty25_mask0',ledMask:0,maxAdcReadDurationUs:26,maxConversionWindowUs:12,maxSpiTransferDurationUs:11,maxWarmupReadDurationUs:206,adcWarmupReadsDiscarded:4,adcSpiClockHz:2000000};
  f.setStatus({latest:r});await f.els.connect.onclick();f.els.export.onclick();const saved=JSON.parse(await f.downloads.at(-1).text()).records[0];
  for(const k of ['firmwareRevision','acquisitionSignature','maxAdcReadDurationUs','maxConversionWindowUs','maxSpiTransferDurationUs','maxWarmupReadDurationUs','adcWarmupReadsDiscarded','adcSpiClockHz'])assert.equal(saved[k],r[k]);
 });
 await test('one minute means 60 seconds start to start',async()=>{const f=harness();f.setStatus({scheduleVersion:1});await f.els.connect.onclick();f.els.runMode.value='repeat';await f.els.start.onclick();const c=f.requests.find(x=>x.url==='/api/command').body;assert.equal(c.periodSec,60);assert.equal(c.blocks,3);});
 await test('cloud deletion waits for matching successful acknowledgement',async()=>{const f=harness();f.setStatus({latest:record()});await f.els.connect.onclick();await f.els.deleteRecords.onclick();assert.equal(f.eval('records.length'),1);const id=f.eval('pendingDelete');assert(id);f.setStatus({latest:null,lastAck:{id,ok:true}});await f.eval('refresh()');assert.equal(f.eval('records.length'),0);assert.equal(f.eval('pendingDelete'),null);});
 await test('failed cloud deletion preserves browser records',async()=>{const f=harness();f.setStatus({latest:record()});await f.els.connect.onclick();await f.els.deleteRecords.onclick();f.setStatus({lastAck:{id:f.eval('pendingDelete'),ok:false,error:'expired_unacknowledged'}});await f.eval('refresh()');assert.equal(f.eval('records.length'),1);assert.equal(f.eval('pendingDelete'),null);});
 await test('constant legacy hardware remains unmodified but cannot pass review or calibration',async()=>{
  const f=harness(),r={...record(),conditionTag:'Light_1',adcMin:32767,adcMax:32767,meanV:32767*2.5/65536,rmsV:0};f.setStatus({latest:r});await f.els.connect.onclick();
  assert(f.els.qc.textContent.includes('固定'));assert(f.els.analysis.textContent.includes('32767'));assert.equal(f.eval('records[0].valid'),true);
  assert.equal(f.eval('AeroHistory.review(latest).usable'),false);f.els.baseline.onclick();assert.equal(f.eval('cal.baseline.length'),0);
  assert.equal(f.eval("AeroCorrection.captureError(latest,{context:'test',blank:[],phase:[]},'blank')"),'correction_valid_all_LED_block_required');
  f.els.export.onclick();const saved=JSON.parse(await f.downloads.at(-1).text()).records[0];assert.equal(saved.valid,true);assert.equal(saved.browserReview.usable,false);assert.equal(saved.adcMin,32767);
 });
 await test('filenames use saved sample name, not next sample input, and sanitize path characters',async()=>{
  const f=harness(),r={...record(),conditionTag:'暗/光:01'};f.setStatus({latest:r});await f.els.connect.onclick();f.els.conditionTag.value='next-sample';f.els.export.onclick();
  assert.equal(f.filenames.at(-1),`暗_光_01_session_${r.id}.json`);f.els.csv.onclick();assert.equal(f.filenames.at(-1),`暗_光_01_channels_${r.id}.csv`);
  assert.equal(f.eval("AeroHistory.safeName('CON')"),'AeroSense_CON');
 });
 await test('history view survives live polling and exports only the selected record',async()=>{
  const f=harness(),a={...record(),conditionTag:'Test01',ledMask:0,meanV:.12,adcMin:100,adcMax:200,plannedBlocks:3,periodSec:60,blockIndex:1},b={...record(),conditionTag:'Light01',ledMask:1,meanV:.25};
  f.setStatus({latest:a});await f.els.connect.onclick();f.setStatus({latest:b});await f.eval('refresh()');f.eval(`viewRecord(${JSON.stringify(a.id)})`);await f.eval('refresh()');
  assert.equal(f.els.mean.textContent,'0.12000 V');assert(f.els.recordSettings.textContent.includes('全部關閉'));assert.equal(f.eval('latest.id'),b.id);
  f.els.export.onclick();const data=JSON.parse(await f.downloads.at(-1).text());assert.equal(data.records.length,1);assert.equal(data.records[0].id,a.id);
  const count=f.requests.filter(x=>x.url==='/api/command').length;f.els.applySettings.onclick();assert.equal(f.els.mask.value,'0');assert.equal(f.els.blocks.value,'3');assert.equal(f.els.periodMinutes.value,'1');assert.equal(f.requests.filter(x=>x.url==='/api/command').length,count);
  f.els.returnLive.onclick();assert.equal(f.els.mean.textContent,'0.25000 V');
 });
 await test('legacy JSON imports, deduplicates and does not fabricate raw waveforms or calibration',async()=>{
  const f=harness(),r={...record(),conditionTag:'Dark',adcMin:32767,adcMax:32767,meanV:1.249961853};const data={schema:'aerosense-session-1',records:[r],measuredProcessing:[]};
  await f.eval(`importReport(${JSON.stringify(data)})`);await f.eval(`importReport(${JSON.stringify(data)})`);assert.equal(f.eval('records.length'),1);assert.equal(f.els.raw.disabled,true);assert(f.els.rawHelp.textContent.includes('舊摘要'));
  assert.equal(f.eval('visibleRecord().viewSnapshot.legacy'),true);assert.equal(f.eval('visibleRecord().viewSnapshot.normalization'),null);
  await assert.rejects(()=>f.eval(`importReport(${JSON.stringify({schema:'wrong',records:[r]})})`));assert.equal(f.eval('records.length'),1);
 });
 await test('raw capture validates identity, supports offline history export and JSON round trip',async()=>{
  const f=harness(),r={...record(),conditionTag:'Raw_test',adcMin:100,adcMax:101};const csv='record_id,sample,time_us,adc_counts,voltage_V\n'+Array.from({length:8000},(_,i)=>`${r.id},${i},${i*250},${100+i%2},${((100+i%2)*2.5/65536).toFixed(9)}`).join('\n')+'\n';
  f.setRaw(csv);f.setStatus({latest:r,rawRecordId:r.id,rawAvailable:true});await f.els.connect.onclick();assert.equal(f.eval('latest.rawCsv'),csv);
  f.setStatus({latest:record(),rawAvailable:false});await f.eval('refresh()');f.eval(`viewRecord(${JSON.stringify(r.id)});connected=false`);await f.els.raw.onclick();assert.equal(await f.downloads.at(-1).text(),csv);assert.equal(f.filenames.at(-1),`Raw_test_raw_${r.id}.csv`);
  f.els.export.onclick();const exported=JSON.parse(await f.downloads.at(-1).text());const g=harness();await g.eval(`importReport(${JSON.stringify(exported)})`);assert.equal(g.eval('visibleRecord().rawCsv'),csv);
  g.eval('delete visibleRecord().rawCsv');g.els.importRaw.files=[{size:csv.length,text:async()=>csv}];await g.els.importRaw.onchange();assert.equal(g.eval('visibleRecord().rawCsv'),csv);
  assert.throws(()=>f.eval(`AeroHistory.parseRaw(${JSON.stringify(csv.replaceAll(r.id,'wrong-id'))},visibleRecord())`));
 });
 await test('raw download race cannot attach another record waveform',async()=>{
  const f=harness(),r={...record(),conditionTag:'A'};f.setRaw('record_id,sample,time_us,adc_counts,voltage_V\nwrong-id,0,0,100,0.003814697\n');f.setStatus({latest:r,rawRecordId:r.id,rawAvailable:true});await f.els.connect.onclick();assert.equal(f.eval('latest.rawCsv'),undefined);
 });
 await test('ADC diagnostic requires current direct-device capability and preserves records',async()=>{
  const f=harness(),r={...record(),conditionTag:'Previous measurement'};
  f.setStatus({latest:r,adcDiagnosticVersion:1,remaining:0});await f.els.connect.onclick();
  f.els.conditionTag.value='ADC_room';await f.els.adcDiagnostic.onclick();
  const c=f.requests.filter(x=>x.url==='/api/command').at(-1);assert.equal(c.body.action,'diagnoseAdc');assert.equal(c.body.conditionTag,'ADC_room');
  assert.equal(f.eval('records.length'),1);assert.equal(f.eval('latest.id'),r.id);
  f.setStatus({remaining:3});await f.eval('refresh()');assert.equal(f.els.adcDiagnostic.disabled,true);
  const n=f.requests.filter(x=>x.url==='/api/command').length;await f.els.adcDiagnostic.onclick();assert.equal(f.requests.filter(x=>x.url==='/api/command').length,n);
 });
 await test('ADC report retains reader codes and uses saved diagnostic label',async()=>{
  const f=harness(),d={schema:'aerosense-adc-diagnostic-1',id:'boot-adc-1',conditionTag:'ADC/Room',spiBefore:{min:32767,max:32767,rawCodes:[32767]},gpioSlow:{min:123,max:125,rawCodes:[123,125]},spiAfter:{min:32767,max:32767,rawCodes:[32767]},dataLine:{cnvHighPullUp:[1],cnvHighPullDown:[0]}};
  f.setStatus({adcDiagnosticVersion:1,adcDiagnostic:d});await f.els.connect.onclick();f.els.conditionTag.value='next';f.els.exportAdcDiagnostic.onclick();
  const saved=JSON.parse(await f.downloads.at(-1).text());assert.deepEqual(saved.gpioSlow.rawCodes,[123,125]);assert.equal(saved.conditionTag,'ADC/Room');assert.equal(f.filenames.at(-1),'ADC_Room_adc-diagnostic_boot-adc-1.json');
  f.setStatus({adcDiagnosticRunning:true});await f.eval('refresh()');assert.equal(f.els.start.disabled,true);assert.equal(f.els.adcDiagnostic.disabled,true);assert.equal(f.els.exportAdcDiagnostic.disabled,true);
 });
 await test('ADC diagnostic is unavailable in demo, cloud relay, and old firmware',async()=>{
  for(const st of [{mode:'demo',adcDiagnosticVersion:1},{mode:'hardware',reportedDeviceStatus:{adcDiagnosticVersion:1,state:'idle',remaining:0}},{mode:'hardware'}]){
   const f=harness();f.setStatus(st);await f.els.connect.onclick();assert.equal(f.els.adcDiagnostic.disabled,true);await f.els.adcDiagnostic.onclick();assert(!f.requests.some(x=>x.body?.action==='diagnoseAdc'));
  }
 });
 await test('odor button sends the selected record and its saved raw calibration, not latest',async()=>{
  const f=harness(),a=record(),b=record(),dark=record(),baseline=record();
  a.viewSnapshot={calibration:{dark:[dark],baseline:[baseline],reference:[]},measuredCalibration:{enabled:false,blank:[],phase:[]}};
  await f.eval(`importReport(${JSON.stringify({schema:'aerosense-session-2',records:[a]})})`);
  f.setStatus({latest:b});await f.els.connect.onclick();await f.eval('predictButton.onclick()');
  const p=f.requests.find(x=>x.url==='/api/predict').body;
  assert.equal(p.record.id,a.id);assert.equal(p.calibration.baseline[0].id,baseline.id);
  assert.deepEqual(p.receptorOrder,['Or22a','Or35a','Or85b','Or98a']);assert(!('features' in p));
  assert.equal(f.eval('visibleRecord().odorAnalysis.sourceRecordId'),a.id);
  f.els.export.onclick();const saved=JSON.parse(await f.downloads.at(-1).text());
  assert.equal(saved.records[0].odorAnalysis.identifiedOdor,null);assert.equal(saved.records[0].odorAnalysis.input.calibration.baseline[0].id,baseline.id);assert.equal(f.eval('predictButton.disabled'),false);
 });
 await test('odor live analysis supports measured correction and excludes raw CSV',async()=>{
  const f=harness(),r=record();f.setStatus({latest:r});await f.els.connect.onclick();
  f.eval("latest.rawCsv='not transmitted';correction.enabled=true;correction.context='cells-A';cal.baseline=[{...latest,id:'baseline-other'}]");
  await f.eval('predictButton.onclick()');const p=f.requests.find(x=>x.url==='/api/predict').body;
  assert.equal(p.measuredCalibration.enabled,true);assert.equal(p.measuredCalibration.context,'cells-A');
  assert(!('rawCsv' in p.record));assert(!('viewSnapshot' in p.record));assert.equal(p.record.id,r.id);
 });
 await test('odor analysis rejects imported history without saved calibration',async()=>{
  const f=harness(),r=record();await f.eval(`importReport(${JSON.stringify({schema:'aerosense-session-1',records:[r]})})`);
  await f.eval('predictButton.onclick()');assert(!f.requests.some(x=>x.url==='/api/predict'));assert(f.els.error.textContent.includes('校正'));
 });
 await test('odor analysis rejects demo and constant ADC before calling backend',async()=>{
  for(const extra of [{mode:'demo'},{adcMin:32767,adcMax:32767}]){
   const f=harness();f.setStatus({latest:{...record(),...extra}});await f.els.connect.onclick();await f.eval('predictButton.onclick()');
   assert(!f.requests.some(x=>x.url==='/api/predict'));assert.equal(f.eval('predictButton.disabled'),false);
  }
 });
 const result={passed:checks.every(x=>x.passed),checks:checks.length,method:'Node VM DOM/API harness; not a real browser or physical board',cases:checks};fs.writeFileSync(path.join(root,'evidence','ui_integration_tests.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;
})();
