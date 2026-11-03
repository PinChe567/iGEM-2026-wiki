/* A run is one envelope of original two-second records and one frozen calibration. */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const RECEPTORS=['Or22a','Or35a','Or85b','Or98a'];
function key(r){return r?.sessionId&&r.deviceId&&r.bootId?JSON.stringify([r.deviceId,r.bootId,r.sessionId]):null;}
function context(snapshot){if(!snapshot?.calibration||snapshot.legacy)return null;return clone({calibration:snapshot.calibration,measuredCalibration:snapshot.measuredCalibration||null});}
function signature(c){return JSON.stringify(c);}
function group(records,r){const k=key(r);return k?records.filter(x=>key(x)===k).sort((a,b)=>a.deviceTimeMs-b.deviceTimeMs):r?[r]:[];}
function frozen(rs){
 if(!rs.length)throw Error('session_no_records');
 const c=rs.map(r=>context(r.sessionContext||r.viewSnapshot));
 if(c.some(x=>!x))throw Error('session_calibration_missing');
 if(c.some(x=>signature(x)!==signature(c[0])))throw Error('session_calibration_changed');
 return c[0];
}
function request(rs,measurement,window){
 const c=frozen(rs),k=key(rs[0]);
 if(!k||rs.some(r=>key(r)!==k))throw Error('session_identity_mismatch');
 const out={schema:'aerosense-odor-session-request-1',receptorOrder:RECEPTORS,records:rs.map(measurement),
  calibration:Object.fromEntries(['dark','baseline','reference'].map(x=>[x,(c.calibration[x]||[]).map(measurement)])),
  measuredCalibration:c.measuredCalibration?{...c.measuredCalibration,blank:(c.measuredCalibration.blank||[]).map(measurement),phase:(c.measuredCalibration.phase||[]).map(measurement)}:null};
 if(window)out.responseWindow=window;
 return out;
}
function curve(rs,normalize){
 if(!rs.length)return {timeSec:[],features:[],recordIds:[],valid:[]};
 let c;try{c=frozen(rs);}catch{return {timeSec:[],features:[],recordIds:[],valid:[]};}
 const timeSec=rs.map(r=>(r.deviceTimeMs-rs[0].deviceTimeMs)/1000);
 const features=rs.map(r=>{try{const n=normalize(r,c);return !n.error&&n.channels?.length===4&&n.channels.every(x=>!x.error&&Number.isFinite(x.deltaFOverF0))?n.channels.map(x=>x.deltaFOverF0):null;}catch{return null;}});
 return {timeSec,features,recordIds:rs.map(r=>r.id),valid:features.map(Boolean)};
}
function percent(r){return Number.isFinite(r)?Math.max(0,Math.min(100,r*100)):null;}
const api={key,context,group,frozen,request,curve,percent,RECEPTORS};
if(typeof module!=='undefined')module.exports=api;else root.AeroSession=api;
})(globalThis);
