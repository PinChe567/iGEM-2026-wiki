/* Measured, user-invoked postprocessing. Never modifies a raw record.
 * Firmware convention: C=I+iQ with Q=2*mean(v*sin(reference)); units V peak.
 * LED-on blank already contains electronic dark: subtract it ONCE, not dark+blank.
 */
(function(root){
'use strict';
const VERSION='measured-complex-1',MIN_BLOCKS=5,ADC_LSB=2.5/65536;
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const sd=a=>a.length>1?Math.sqrt(a.reduce((s,x)=>s+(x-mean(a))**2,0)/(a.length-1)):NaN;
const clone=x=>JSON.parse(JSON.stringify(x));
function create(context='',id=''){return {version:VERSION,id,context,enabled:false,tauSec:2,blank:[],phase:[],createdAt:new Date().toISOString()};}
function valid(r){return r?.valid===true&&r.samples===8000&&r.sampleRateHz===4000&&r.ledMask===15&&r.railSamples===0&&Number.isFinite(r.maxIntervalErrorUs)&&r.maxIntervalErrorUs>=0&&r.maxIntervalErrorUs<=50&&Number.isInteger(r.dutyPercent)&&r.dutyPercent>=1&&r.dutyPercent<=50&&JSON.stringify(r.frequenciesHz)==='[41,67,89,113]'&&typeof r.id==='string'&&r.id.length>0&&['inPhaseV','quadratureV','amplitudeV'].every(k=>Array.isArray(r[k])&&r[k].length===4&&r[k].every(Number.isFinite));}
function hasMetadata(r){return typeof r.bootId==='string'&&r.bootId.length>0&&typeof r.deviceId==='string'&&r.deviceId.length>0&&r.processingSchema===2&&r.iqConvention==='I_cos_Q_sin_peak_V'&&typeof r.acquisitionSignature==='string'&&r.acquisitionSignature.length>0&&Number.isFinite(r.deviceTimeMs)&&r.deviceTimeMs>=0;}
function signature(r){return JSON.stringify([r.mode,r.deviceId,r.bootId,r.firmware,r.processingSchema,r.iqConvention,r.sampleRateHz,r.samples,r.dutyPercent,r.ledMask,r.frequenciesHz,r.acquisitionSignature]);}
function captureError(r,c,stage){
 if(!['blank','phase'].includes(stage))return 'correction_stage_invalid';
 if(!c.context.trim())return 'correction_context_required';
 if(!valid(r))return 'correction_valid_all_LED_block_required';
 if(!hasMetadata(r))return 'correction_firmware_metadata_required';
 const all=[...c.blank,...c.phase];
 if(all.some(x=>x.id===r.id))return 'block_already_added';
 if(all.some(x=>signature(x)!==signature(r)))return 'correction_conditions_changed';
 if(stage==='phase'&&c.blank.length<MIN_BLOCKS)return 'correction_collect_blank_first';
 return null;
}
function summarize(c,r){
 if(!c||c.version!==VERSION||!c.id||!c.context?.trim())return {error:'correction_context_required'};
 if(!valid(r))return {error:'correction_valid_all_LED_block_required'};
 if(!hasMetadata(r))return {error:'correction_firmware_metadata_required'};
 if(c.blank.length<MIN_BLOCKS)return {error:'correction_need_5_blank'};
 const all=[...c.blank,...c.phase];
 if(all.some(x=>!valid(x)||!hasMetadata(x)))return {error:'correction_invalid_calibration'};
 if(new Set(all.map(x=>x.id)).size!==all.length)return {error:'correction_invalid_calibration'};
 if(all.some(x=>signature(x)!==signature(r)))return {error:'correction_conditions_changed'};
 const channels=[];
 for(let j=0;j<4;j++){
  const bi=mean(c.blank.map(x=>x.inPhaseV[j])),bq=mean(c.blank.map(x=>x.quadratureV[j]));
  const si=sd(c.blank.map(x=>x.inPhaseV[j])),sq=sd(c.blank.map(x=>x.quadratureV[j]));
  let unit=null,phaseError='correction_need_5_phase';
  const blankVectorSD=Math.hypot(si,sq);
  if(c.phase.length>=MIN_BLOCKS){
   const ri=mean(c.phase.map(x=>x.inPhaseV[j]))-bi,rq=mean(c.phase.map(x=>x.quadratureV[j]))-bq,rm=Math.hypot(ri,rq);
   const refSD=Math.hypot(sd(c.phase.map(x=>x.inPhaseV[j])),sd(c.phase.map(x=>x.quadratureV[j])));
   // Conservative internal guard, not an experimentally validated LOD.
   const uncertainty=Math.max(ADC_LSB,Math.hypot(blankVectorSD/Math.sqrt(c.blank.length),refSD/Math.sqrt(c.phase.length)));
   if(rm>5*uncertainty){unit=[ri/rm,rq/rm];phaseError=null;}else phaseError='correction_phase_reference_below_noise';
  }
  channels.push({blankI_V:bi,blankQ_V:bq,blankVectorSD_V:blankVectorSD,blankMeanSE_V:blankVectorSD/Math.sqrt(c.blank.length),phaseUnit:unit,phaseError});
 }
 return {channels,signature:signature(r),calibrationId:c.id,context:c.context,blankIds:c.blank.map(x=>x.id),phaseIds:c.phase.map(x=>x.id)};
}
function projected(i,q,s){return s.phaseUnit?{projectionV:i*s.phaseUnit[0]+q*s.phaseUnit[1],orthogonalV:q*s.phaseUnit[0]-i*s.phaseUnit[1],phaseDeviationDeg:Math.atan2(q*s.phaseUnit[0]-i*s.phaseUnit[1],i*s.phaseUnit[0]+q*s.phaseUnit[1])*180/Math.PI}:{projectionV:null,orthogonalV:null,phaseDeviationDeg:null};}
function derive(r,c){
 if(!c.enabled)return {enabled:false,error:'correction_off'};
 const s=summarize(c,r);if(s.error)return {enabled:true,error:s.error,calibrationId:c.id};
 const channels=s.channels.map((v,j)=>{
  const i=r.inPhaseV[j]-v.blankI_V,q=r.quadratureV[j]-v.blankQ_V,p=projected(i,q,v),mag=Math.hypot(i,q);
  return {channel:j+1,inPhaseV:i,quadratureV:q,amplitudeV:mag,...p,phaseReferenceError:v.phaseError,
   warning:p.phaseDeviationDeg!==null&&mag>5*Math.max(v.blankVectorSD_V,ADC_LSB)&&Math.abs(p.phaseDeviationDeg)>15?'phase_deviation_gt_15deg':null};
 });
 return {enabled:true,method:VERSION,calibrationId:c.id,context:c.context,signature:s.signature,blankIds:s.blankIds,phaseIds:s.phaseIds,channels,
  units:'V peak Fourier component; signed phase projection',darkSubtractedSeparately:false,rawRecordId:r.id};
}
function normalize(r,base,c){
 const current=derive(r,c);if(current.error)return current;
 if(base.baseline.length<MIN_BLOCKS)return {error:'correction_need_5_living_baseline'};
 const refs=[...base.baseline,...base.reference];
 if(new Set(refs.map(x=>x.id)).size!==refs.length)return {error:'correction_invalid_calibration'};
 if(refs.some(x=>x.captureCorrectionId!==c.id||x.captureContext!==c.context))return {error:'correction_recollect_living_baseline'};
 if(refs.some(x=>!valid(x)||!hasMetadata(x)||signature(x)!==signature(r)))return {error:'correction_conditions_changed'};
 const summary=summarize(c,r);const baseline=base.baseline.map(x=>derive(x,c));const reference=base.reference.map(x=>derive(x,c));
 const channels=current.channels.map((p,j)=>{
  if(p.projectionV===null)return {channel:j+1,error:p.phaseReferenceError};
  const ys=baseline.map(x=>x.channels[j].projectionV),f0=mean(ys),u=summary.channels[j].phaseUnit;
  const blankSD=sd(c.blank.map(x=>x.inPhaseV[j]*u[0]+x.quadratureV[j]*u[1]));
  const noise=Math.max(sd(ys),blankSD,ADC_LSB);
  if(!(f0>5*noise))return {channel:j+1,error:'baseline_below_noise'};
  const delta=p.projectionV-f0;let ref=null,referenceError=null,referenceNoise=null;
  if(reference.length>=MIN_BLOCKS){const ry=reference.map(x=>x.channels[j].projectionV),denom=mean(ry)-f0;referenceNoise=Math.max(noise,sd(ry));if(Math.abs(denom)>5*referenceNoise)ref=delta/denom;else referenceError='reference_response_below_noise';}
  return {channel:j+1,F0_V:f0,deltaFOverF0:delta/f0,referenceNormalized:ref,noise_V:noise,referenceNoise_V:referenceNoise,referenceError};
 });
 return {method:'measured LED-on blank; fixed fluorescence-reference phase; unsmoothed signed projection; (F-F0)/F0',calibrationId:c.id,baselineIds:base.baseline.map(x=>x.id),referenceIds:base.reference.map(x=>x.id),channels};
}
class Processor{
 constructor(){this.reset();}
 reset(){this.last=null;this.key=null;}
 update(r,c){
  const d=derive(r,c);if(d.error){this.reset();return {...d,smoothed:null};}
  if(!Number.isFinite(c.tauSec)||c.tauSec<0||c.tauSec>120){this.reset();return {...d,error:'correction_invalid_tau',smoothed:null};}
  const key=JSON.stringify([d.signature,c.id,c.context,c.tauSec,c.blank.map(x=>x.id),c.phase.map(x=>x.id)]);
  if(this.last&&this.key===key&&this.last.id===r.id)return clone(this.last.result);
  const previous=this.key===key?this.last:null,dt=previous?(r.deviceTimeMs-previous.timeMs)/1000:null;
  if(previous&&!(dt>0)){this.reset();return {...d,error:'correction_nonmonotonic_time',smoothed:null};}
  const alpha=previous&&c.tauSec>0?-Math.expm1(-dt/c.tauSec):1;
  const s=summarize(c,r);
  const channels=d.channels.map((v,j)=>{
   const old=previous?.result.smoothed.channels[j];const i=old?(1-alpha)*old.inPhaseV+alpha*v.inPhaseV:v.inPhaseV,q=old?(1-alpha)*old.quadratureV+alpha*v.quadratureV:v.quadratureV;
   return {channel:j+1,inPhaseV:i,quadratureV:q,amplitudeV:Math.hypot(i,q),...projected(i,q,s.channels[j])};
  });
  const result={...d,smoothed:{method:'EMA on corrected I/Q; first valid sample initializes state',tauSec:c.tauSec,deltaTimeSec:dt,alpha,initialized:!previous,deviceTimeMs:r.deviceTimeMs,channels,displayOnly:true}};
  this.key=key;this.last={id:r.id,timeMs:r.deviceTimeMs,result:clone(result)};return result;
 }
}
const api={VERSION,MIN_BLOCKS,ADC_LSB,create,valid,hasMetadata,signature,captureError,summarize,derive,normalize,Processor};
if(typeof module!=='undefined')module.exports=api;else root.AeroCorrection=api;
})(globalThis);
