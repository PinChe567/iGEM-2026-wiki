// DOM/API harness for the delivered browser script. This is not a visual browser test.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,checks=[];let serial=0;
function record(i=.02,q=-.01){return {id:`ui-synthetic-${++serial}`,mode:'hardware',deviceId:'board',bootId:'boot1',firmware:'AeroSense',processingSchema:2,iqConvention:'I_cos_Q_sin_peak_V',acquisitionSignature:'DDS4k-test',deviceTimeMs:serial*5000,valid:true,samples:8000,sampleRateHz:4000,dutyPercent:25,ledMask:15,frequenciesHz:[41,67,89,113],railSamples:0,maxIntervalErrorUs:0,inPhaseV:Array(4).fill(i),quadratureV:Array(4).fill(q),amplitudeV:Array(4).fill(Math.hypot(i,q))};}
function harness(){
 const els={},storage=new Map(),downloads=[],requests=[];let status={mode:'hardware',state:'idle',latest:null},command=0;
 const canvas={clearRect(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 function el(id){return els[id]||(els[id]={id,value:'',checked:false,textContent:'',dataset:{},width:1000,height:260,append(){},replaceChildren(){},getContext:()=>canvas,addEventListener(t,f){this['on'+t]=f;},click(){this.onclick?.();},parentElement:{append(){}}});}
 const sandbox={console,Date,Math,JSON,Number,String,Array,Object,Map,Set,Error,Blob,structuredClone,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  document:{getElementById:el,querySelectorAll:()=>[],createElement:()=>el('created-'+Math.random()),documentElement:{}},
  URL:{createObjectURL:b=>{downloads.push(b);return 'blob:fake';},revokeObjectURL(){}},
  setTimeout:()=>0,setInterval:()=>1,clearInterval(){},crypto:{randomUUID:()=>`cal-${++command}`},
  fetch:async(url,options)=>{requests.push({url,body:options?.body?JSON.parse(options.body):null});return {ok:true,json:async()=>url==='/api/status'?structuredClone(status):{command:{id:`cmd-${++command}`}},text:async()=>''};}};
 for(const m of fs.readFileSync(path.join(root,'firmware/data/index.html'),'utf8').matchAll(/id="([^"]+)"/g))el(m[1]);
 for(const [k,v] of Object.entries({duty:25,interval:3,blocks:5,mask:15,capture:'off',key:'synthetic-key'}))el(k).value=String(v);
 vm.createContext(sandbox);for(const file of ['correction.js','calibration.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,'firmware/data',file),'utf8'),sandbox,{filename:file});
 return {els,storage,downloads,requests,eval:s=>vm.runInContext(s,sandbox),setStatus:s=>status={...status,...s},getStatus:()=>status};
}
async function test(name,fn){try{await fn();checks.push({name,passed:true});}catch(e){checks.push({name,passed:false,error:e.stack});}}
(async()=>{
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
 const result={passed:checks.every(x=>x.passed),checks:checks.length,method:'Node VM DOM/API harness; not a real browser or physical board',cases:checks};fs.writeFileSync(path.join(root,'evidence','ui_integration_tests.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;
})();
