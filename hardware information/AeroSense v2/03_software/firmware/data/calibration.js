(function(root){
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const sd=a=>a.length>1?Math.sqrt(a.reduce((s,x)=>s+(x-mean(a))**2,0)/(a.length-1)):NaN;
function signature(r){return JSON.stringify([r.mode,r.deviceId||'unspecified',r.bootId,r.processingSchema,r.iqConvention,r.frequenciesHz,r.dutyPercent,r.sampleRateHz,r.samples]);}
function validRecord(r){return r?.valid===true&&['inPhaseV','quadratureV'].every(k=>Array.isArray(r[k])&&r[k].length===4&&r[k].every(Number.isFinite));}
function addError(r,cal,stage){
 if(!validRecord(r))return 'valid_result_required';
 if(stage==='dark'&&r.ledMask!==0)return 'dark_requires_all_LEDs_off';
 if(stage!=='dark'&&r.ledMask!==15)return 'baseline_and_reference_require_all_LEDs';
 const all=[...cal.dark,...cal.baseline,...cal.reference];
 if(all.some(x=>x.id===r.id))return 'block_already_added';
 if(all.some(x=>signature(x)!==signature(r)))return 'clear_calibration_after_conditions_change';
 return null;
}
function normalize(r,cal){
 if(!validRecord(r))return {error:'invalid_measurement'};
 if(r.ledMask!==15)return {error:'normalization_requires_all_LEDs'};
 if(cal.dark.length<5||cal.baseline.length<5)return {error:'need_5_dark_and_5_baseline'};
 const all=[...cal.dark,...cal.baseline,...cal.reference];
 if(all.some(x=>!validRecord(x))||cal.dark.some(x=>x.ledMask!==0)||[...cal.baseline,...cal.reference].some(x=>x.ledMask!==15))return {error:'invalid_calibration_records'};
 if(all.some(x=>signature(x)!==signature(r)))return {error:'calibration_conditions_changed'};
 const out=[];
 for(let j=0;j<4;j++){
  const di=mean(cal.dark.map(x=>x.inPhaseV[j])),dq=mean(cal.dark.map(x=>x.quadratureV[j]));
  const amp=x=>Math.hypot(x.inPhaseV[j]-di,x.quadratureV[j]-dq);
  const f0=mean(cal.baseline.map(amp));const noise=Math.max(sd(cal.dark.map(x=>x.inPhaseV[j])),sd(cal.dark.map(x=>x.quadratureV[j])),2.5/65536);
  if(!(f0>5*noise)){out.push({channel:j+1,error:'baseline_below_noise'});continue;}
  const delta=amp(r)-f0;let ref=null,referenceError=null;
  if(cal.reference.length>=5){const denom=mean(cal.reference.map(amp))-f0;if(Math.abs(denom)>5*noise)ref=delta/denom;else referenceError='reference_response_below_noise';}
  out.push({channel:j+1,F0_V:f0,deltaFOverF0:delta/f0,referenceNormalized:ref,noise_V:noise,referenceError});
 }
 return {channels:out,method:'complex dark subtraction; (F-F0)/F0; optional (F-F0)/(Fref-F0)'};
}
const api={normalize,signature,addError};if(typeof module!=='undefined')module.exports=api;else root.AeroCalibration=api;
})(globalThis);
