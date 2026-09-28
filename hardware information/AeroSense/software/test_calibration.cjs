const assert=require('node:assert/strict');const C=require('./firmware/data/calibration.js');
function r(a,mask=15){return {mode:'hardware',valid:true,frequenciesHz:[41,67,89,113],dutyPercent:25,sampleRateHz:4000,ledMask:mask,inPhaseV:[a,a,a,a],quadratureV:[0,0,0,0]};}
const cal={dark:Array.from({length:5},()=>r(.01,0)),baseline:Array.from({length:5},()=>r(.11)),reference:Array.from({length:5},()=>r(.21))};
let n=C.normalize(r(.16),cal);assert(Math.abs(n.channels[0].deltaFOverF0-.5)<1e-12);assert(Math.abs(n.channels[0].referenceNormalized-.5)<1e-12);
assert.equal(C.normalize({...r(.16),valid:false},cal).error,'invalid_measurement');assert.equal(C.normalize({...r(.16),dutyPercent:20},cal).error,'calibration_conditions_changed');assert.equal(C.normalize(r(.16),{dark:[],baseline:[],reference:[]}).error,'need_5_dark_and_5_baseline');
assert.equal(C.normalize(r(.16),{...cal,baseline:Array.from({length:5},()=>r(.01))}).channels[0].error,'baseline_below_noise');
console.log('5 normalization tests passed');
