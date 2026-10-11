const assert=require('node:assert/strict');const C=require('./firmware/data/calibration.js');
function r(a,mask=15){return {mode:'hardware',valid:true,frequenciesHz:[41,67,89,113],dutyPercent:25,sampleRateHz:4000,ledMask:mask,inPhaseV:[a,a,a,a],quadratureV:[0,0,0,0]};}
const cal={dark:Array.from({length:5},()=>r(.01,0)),baseline:Array.from({length:5},()=>r(.11)),reference:Array.from({length:5},()=>r(.21))};
let n=C.normalize(r(.16),cal);assert(Math.abs(n.channels[0].deltaFOverF0-.5)<1e-12);assert(Math.abs(n.channels[0].referenceNormalized-.5)<1e-12);
assert.equal(C.normalize({...r(.16),valid:false},cal).error,'invalid_measurement');assert.equal(C.normalize({...r(.16),dutyPercent:20},cal).error,'calibration_conditions_changed');assert.equal(C.normalize(r(.16),{dark:[],baseline:[],reference:[]}).error,'need_5_dark_and_5_baseline');
assert.equal(C.normalize(r(.16),{...cal,baseline:Array.from({length:5},()=>r(.01))}).channels[0].error,'baseline_below_noise');
assert.equal(C.normalize(r(.16,0),cal).error,'normalization_requires_all_LEDs');
assert.equal(C.normalize({...r(.16),deviceId:'other-board'},cal).error,'calibration_conditions_changed');
assert.equal(C.normalize(r(.16),{...cal,dark:Array.from({length:5},()=>({...r(.01,0),valid:false}))}).error,'invalid_calibration_records');
assert.equal(C.addError(r(.01),{dark:[],baseline:[],reference:[]},'dark'),'dark_requires_all_LEDs_off');
assert.equal(C.addError({...r(.01,0),id:'x'},{dark:[{...r(.01,0),id:'x'}],baseline:[],reference:[]},'dark'),'block_already_added');
const fs=require('fs'),path=require('path');fs.mkdirSync(path.join(__dirname,'evidence'),{recursive:true});fs.writeFileSync(path.join(__dirname,'evidence/calibration_tests.json'),JSON.stringify({passed:true,checks:10,scope:'mathematical and validation guards; no biological data'},null,2));
console.log('10 normalization tests passed');
