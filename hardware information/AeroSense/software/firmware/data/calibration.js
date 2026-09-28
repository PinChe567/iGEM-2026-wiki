(function(root){
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const sd=a=>a.length>1?Math.sqrt(a.reduce((s,x)=>s+(x-mean(a))**2,0)/(a.length-1)):NaN;
function signature(r){return JSON.stringify([r.mode,r.frequenciesHz,r.dutyPercent,r.sampleRateHz]);}
function normalize(r,cal){
 if(!r?.valid)return {error:'invalid_measurement'};
 if(cal.dark.length<5||cal.baseline.length<5)return {error:'need_5_dark_and_5_baseline'};
 const all=[...cal.dark,...cal.baseline,...cal.reference];
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
const api={normalize,signature};if(typeof module!=='undefined')module.exports=api;else root.AeroCalibration=api;
})(globalThis);
