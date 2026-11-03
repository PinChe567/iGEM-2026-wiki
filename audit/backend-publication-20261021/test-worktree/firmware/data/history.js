/* Browser archive. Keep original hardware fields intact; review is separate. */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function measurement(r){const {rawCsv,viewSnapshot,sessionContext,sessionAnalysis,odorAnalysis,browserReview,rawUnavailableReason,...result}=r;return clone(result);}
function constant(r){return r?.mode==='hardware'&&r.samples===8000&&Number.isInteger(r.adcMin)&&r.adcMin===r.adcMax;}
function review(r){const flat=constant(r);return {version:'adc-review-1',usable:!!r&&r.valid===true&&r.samples===8000&&!flat,constantCode:flat,reason:flat?'ADC_constant':r?.error||(!r?.valid?'invalid_measurement':'')};}
function safeName(s){let n=String(s||'AeroSense').normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/g,'').trim().slice(0,80);if(!n)n='AeroSense';if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(n))n='AeroSense_'+n;return n;}
function filename(r,kind,ext){return `${safeName(r?.conditionTag)}_${kind}_${safeName(r?.id||'records')}.${ext}`;}
function validRecord(r){return r&&typeof r.id==='string'&&r.id.length>0&&r.id.length<=128&&['hardware','demo'].includes(r.mode)&&typeof r.valid==='boolean'&&Number.isInteger(r.samples)&&r.samples>=0&&r.samples<=8000&&Number.isInteger(r.ledMask)&&r.ledMask>=0&&r.ledMask<=15&&Number.isInteger(r.dutyPercent)&&r.dutyPercent>=1&&r.dutyPercent<=50&&['inPhaseV','quadratureV','amplitudeV'].every(k=>Array.isArray(r[k])&&r[k].length===4&&r[k].every(Number.isFinite));}
function parseRaw(csv,r){
 if(typeof csv!=='string'||csv.length>2000000)throw Error('raw_invalid');
 const rows=csv.trim().split(/\r?\n/),head=rows.shift();
 if(head!=='record_id,sample,time_us,adc_counts,voltage_V'||rows.length!==r.samples||!rows.length)throw Error('raw_invalid');
 let previous=-1;
 return rows.map((line,i)=>{const a=line.split(','),t=Number(a[2]),code=Number(a[3]),v=Number(a[4]);
  if(a.length!==5||a[0]!==r.id||Number(a[1])!==i||!Number.isFinite(t)||t<0||(i&&t<=previous)||!Number.isInteger(code)||code<0||code>65535||!Number.isFinite(v)||Math.abs(v-code*2.5/65536)>1e-8)throw Error('raw_record_changed');
  previous=t;return {timeUs:t,code,voltage:v};
 });
}
function importSession(data){
 if(!data||!['aerosense-session-1','aerosense-session-2'].includes(data.schema)||!Array.isArray(data.records)||data.records.length>1000||!data.records.every(validRecord))throw Error('import_invalid');
 return data.records.map(r=>{const out=clone(r);if(out.rawCsv)parseRaw(out.rawCsv,out);
  out.imported=true;
  // Old exports have no per-record calibration snapshot. Do not substitute
  // today's calibration or another record's raw data for missing provenance.
  if(!out.viewSnapshot)out.viewSnapshot={legacy:true,normalization:out.normalization||null,processing:(data.measuredProcessing||[]).filter(x=>x.sourceRecordId===r.id).at(-1)||null};
  return out;
 });
}
function archive(){
 let dbPromise;
 function db(){if(!root.indexedDB)return Promise.reject(Error('archive_unavailable'));return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const q=root.indexedDB.open('AeroSenseHistory',1);q.onupgradeneeded=()=>q.result.createObjectStore('records',{keyPath:'id'});q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);q.onblocked=()=>reject(Error('archive_blocked'));}));}
 async function run(mode,action){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('records',mode);let result;const q=action(tx.objectStore('records'));if(q)q.onsuccess=()=>{result=q.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
 return {available:!!root.indexedDB,all:()=>run('readonly',s=>s.getAll()),put:r=>run('readwrite',s=>s.put(clone(r))),remove:id=>run('readwrite',s=>s.delete(id)),clear:()=>run('readwrite',s=>s.clear())};
}
const api={clone,measurement,constant,review,safeName,filename,validRecord,parseRaw,importSession,archive};
if(typeof module!=='undefined')module.exports=api;else root.AeroHistory=api;
})(globalThis);
