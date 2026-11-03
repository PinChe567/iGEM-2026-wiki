// Independent contracts for session grouping, frozen calibration and chart semantics.
// No browser dependency or hardware claims. Run: node test_session_ui.cjs
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const S = require('./firmware/data/session.js');
const UI = require('./firmware/data/odor_ui.js');
const copy = x => JSON.parse(JSON.stringify(x));
const checks = [];
function test(name, fn) {
  try { fn(); checks.push({name, passed:true}); }
  catch (error) { checks.push({name, passed:false, error:error.stack}); }
}
function calibration() {
  return {
    calibration:{dark:[{id:'dark-1',rawCsv:'not sent'}],baseline:[{id:'f0-1'}],reference:[]},
    measuredCalibration:{version:'measured-complex-1',enabled:false,id:'correction-1',context:'well-layout-A',blank:[],phase:[]}
  };
}
function record(n, overrides={}) {
  return {
    id:'record-'+n,deviceId:'board-A',bootId:'boot-A',sessionId:'boot-A-s1',
    mode:'hardware',valid:true,deviceTimeMs:1000+n*2000,
    acquisitionSignature:'same-acquisition',blockIndex:n+1,plannedBlocks:5,
    periodSec:2,acquisitionMode:'continuous',continuousSegment:0,gapBeforeUs:0,
    windowStartDeviceTimeMs:n*2000,windowEndDeviceTimeMs:(n+1)*2000,
    sessionComplete:false,sessionContext:calibration(),rawCsv:'private raw waveform',
    viewSnapshot:{calibration:{dark:[],baseline:[],reference:[]}},
    ...overrides
  };
}
function element(tag='div') {
  return {tag,children:[],style:{},textContent:'',title:'',className:'',
    append(...children) {this.children.push(...children);},
    replaceChildren(...children) {this.children=children;}};
}
function canvas() {
  const strokes=[], fills=[], labels=[]; let points=[];
  const ctx = {
    clearRect(){},fillRect(...args){fills.push({color:this.fillStyle,args});},
    fillText(text,...args){labels.push({text,args});},beginPath(){points=[];},
    moveTo(...args){points.push({op:'move',args});},
    lineTo(...args){points.push({op:'line',args});},
    stroke(){strokes.push({color:this.strokeStyle,points:copy(points)});}
  };
  return {clientWidth:800,width:800,height:300,hidden:false,getContext:()=>ctx,strokes,fills,labels};
}
const colors=['#168b80','#6b61b7','#b66a28','#3575b0'];
function channelPaths(c) {return c.strokes.filter(s=>colors.includes(s.color));}
global.document={createElement:element};
global.AeroSession=S;

test('group uses device, boot and session identity rather than sample label',()=>{
  const a=record(2), b=record(0), other=[
    record(1,{deviceId:'board-B'}),record(1,{bootId:'boot-B'}),
    record(1,{sessionId:'boot-A-s2'}),record(1,{sessionId:''})
  ];
  const input=[a,...other,b], before=input.map(r=>r.id+S.key(r));
  assert.deepEqual(S.group(input,a).map(r=>r.id),[b.id,a.id]);
  assert.deepEqual(input.map(r=>r.id+S.key(r)),before,'group must not sort the archive in place');
  assert.equal(S.key({sessionId:'x',deviceId:'d'}),null);
  assert.notEqual(S.key({deviceId:'a,b',bootId:'c',sessionId:'d'}),S.key({deviceId:'a',bootId:'b,c',sessionId:'d'}));
});
test('legacy ungrouped record remains individually inspectable but cannot become a session request',()=>{
  const r=record(0,{sessionId:undefined});
  assert.deepEqual(S.group([r,record(1)],r),[r]);
  assert.deepEqual(S.group([],null),[]);
  assert.throws(()=>S.request([r],x=>x),/session_identity_mismatch/);
});
test('group retains duplicate evidence for authoritative backend rejection',()=>{
  const a=record(0), duplicate=copy(a);
  const grouped=S.group([a,record(1),duplicate],a);
  assert.equal(grouped.filter(r=>r.id===a.id).length,2);
  assert.deepEqual(grouped.map(r=>r.deviceTimeMs),[1000,1000,3000]);
});
test('frozen calibration is a deep snapshot and session context outranks current view snapshot',()=>{
  const a=record(0),b=record(1), frozen=S.frozen([a,b]);
  assert.equal(frozen.calibration.dark[0].id,'dark-1');
  frozen.calibration.dark[0].id='changed outside';
  assert.equal(a.sessionContext.calibration.dark[0].id,'dark-1');
  assert.equal(b.sessionContext.calibration.dark[0].id,'dark-1');
  const extracted=S.context(a.sessionContext);
  a.sessionContext.measuredCalibration.context='changed later';
  assert.equal(extracted.measuredCalibration.context,'well-layout-A');
});
test('missing, legacy and changed calibrations fail explicitly',()=>{
  assert.throws(()=>S.frozen([]),/session_no_records/);
  assert.equal(S.context({legacy:true,calibration:{}}),null);
  assert.equal(S.context({}),null);
  const legacy=record(1,{sessionContext:null,viewSnapshot:{legacy:true,calibration:calibration().calibration}});
  assert.throws(()=>S.frozen([record(0),legacy]),/session_calibration_missing/);
  const changed=record(1);changed.sessionContext.calibration.baseline[0].id='other-f0';
  assert.throws(()=>S.frozen([record(0),changed]),/session_calibration_changed/);
  const changedPhase=record(1);changedPhase.sessionContext.measuredCalibration.id='other-correction';
  assert.throws(()=>S.frozen([record(0),changedPhase]),/session_calibration_changed/);
});
test('session request rejects mixed identities before transport',()=>{
  for(const field of ['deviceId','bootId','sessionId']){
    const r=record(1,{[field]:'different'});
    assert.throws(()=>S.request([record(0),r],x=>x),/session_identity_mismatch/);
  }
});

// Isolate the delivered serializer from app.js without running the application.
// This verifies its real allowlist, not a test-only substitute for raw stripping.
const app=fs.readFileSync(path.join(__dirname,'firmware/data/app.js'),'utf8');
const serializerSource=app.match(/^function odorMeasurement\(r\)\{[\s\S]*?^\}/m);
const measure=serializerSource?vm.runInNewContext(serializerSource[0]+'\nodorMeasurement;'):null;
test('request carries actual session timing metadata and strips raw/snapshot bodies',()=>{
  assert.equal(typeof measure,'function','app must expose the acquisition serializer');
  const a=record(0),b=record(1,{sessionComplete:true}),window={startSec:0,endSec:4};
  const p=S.request([a,b],r=>copy(measure(r)),window);
  assert.equal(p.schema,'aerosense-odor-session-request-1');
  assert.deepEqual(p.receptorOrder,['Or22a','Or35a','Or85b','Or98a']);
  assert.deepEqual(p.responseWindow,window);
  for(let i=0;i<2;i++)for(const field of ['id','sessionId','deviceId','bootId','blockIndex','plannedBlocks','periodSec','acquisitionMode','windowStartDeviceTimeMs','windowEndDeviceTimeMs','gapBeforeUs','continuousSegment','sessionComplete','deviceTimeMs','acquisitionSignature'])
    assert.deepEqual(p.records[i][field],[a,b][i][field],field);
  assert(!JSON.stringify(p).includes('rawCsv'));
  assert(!JSON.stringify(p).includes('viewSnapshot'));
  assert(!JSON.stringify(p).includes('sessionContext'));
  assert.equal(p.calibration.dark[0].id,'dark-1');
  assert.equal(p.measuredCalibration.id,'correction-1');
  assert.equal(S.request([a],r=>copy(measure(r))).responseWindow,undefined);
});
test('percent is positive correlation on an independent scale, not normalized probability',()=>{
  assert.equal(S.percent(-.9),0);assert.equal(S.percent(0),0);
  assert.equal(S.percent(.8),80);assert.equal(S.percent(.9),90);
  assert.equal(S.percent(1),100);assert.equal(S.percent(1.00001),100);
  assert.equal(S.percent(-2),0);
  for(const x of [null,undefined,NaN,Infinity,-Infinity,'0.9'])assert.equal(S.percent(x),null);
  assert.equal([.8,.9].map(S.percent).reduce((a,b)=>a+b,0),170);
});
test('bars show independent percentages with signed r and preserve caller ordering',()=>{
  const target=element(),scores=[{compound:'benzaldehyde',pearsonR:-.3},{compound:'2-heptanone',pearsonR:.8},{compound:'3-octanol',pearsonR:.9}];
  UI.bars(target,scores,true,'zh');
  assert.deepEqual(scores.map(x=>x.compound),['benzaldehyde','2-heptanone','3-octanol']);
  assert.deepEqual(target.children.map(r=>r.children[0].children[1].textContent),['90.0%','80.0%','0.0%']);
  assert.equal(target.children[0].children[0].children[0].textContent,'3-辛醇 · 3-octanol');
  assert.equal(target.children[2].title,'Pearson r = -0.3000');
  assert.deepEqual(target.children.map(r=>r.children[1].children[0].style.width),['90%','80%','0%']);
});
test('disabled, null and empty scores cannot display a confidence bar',()=>{
  const target=element();UI.bars(target,[{compound:'2-heptanone',pearsonR:1}],false,'en');
  assert.equal(target.children[0].children[0].children[1].textContent,'—');
  assert.equal(target.children[0].children[1].children[0].style.width,'0%');
  UI.bars(target,[{compound:'2-heptanone',pearsonR:null}],true,'en');
  assert.equal(target.children[0].children[0].children[1].textContent,'—');
  UI.bars(target,[],true,'en');assert.equal(target.children.length,0);
});
test('curve retains co-temporal vectors, signed values and device-time gaps',()=>{
  const rs=[record(0),record(1),record(2,{deviceTimeMs:9000})];
  const vectors=[[.1,-.2,.3,.4],[.2,-.1,.4,.5],[.4,-.3,.2,.1]];
  const seen=[];
  const data=S.curve(rs,(r,c)=>{seen.push(c.calibration.dark[0].id);return {channels:vectors[rs.indexOf(r)].map(deltaFOverF0=>({deltaFOverF0}))};});
  assert.deepEqual(data.timeSec,[0,2,8]);assert.deepEqual(data.features,vectors);
  assert.deepEqual(data.recordIds,rs.map(r=>r.id));assert.deepEqual(data.valid,[true,true,true]);
  assert.deepEqual(seen,['dark-1','dark-1','dark-1']);
});
test('invalid, thrown, nonfinite and incomplete normalization stays missing without zero fill',()=>{
  const rs=Array.from({length:6},(_,i)=>record(i));
  const data=S.curve(rs,r=>{
    if(r.blockIndex===2)return {error:'ADC_rail'};
    if(r.blockIndex===3)throw Error('invalid_measurement');
    if(r.blockIndex===4)return {channels:[{deltaFOverF0:NaN},...Array(3).fill({deltaFOverF0:.1})]};
    if(r.blockIndex===5)return {channels:Array(3).fill({deltaFOverF0:.1})};
    if(r.blockIndex===6)return {channels:[{error:'phase'},...Array(3).fill({deltaFOverF0:.1})]};
    return {channels:Array(4).fill({deltaFOverF0:-.1})};
  });
  assert.deepEqual(data.features,[[-.1,-.1,-.1,-.1],null,null,null,null,null]);
  assert.deepEqual(data.timeSec,[0,2,4,6,8,10]);
  assert.deepEqual(data.valid,[true,false,false,false,false,false]);
  assert.deepEqual(S.curve([],()=>{}),{timeSec:[],features:[],recordIds:[],valid:[]});
  assert.deepEqual(S.curve([record(0,{sessionContext:null,viewSnapshot:{legacy:true}})],()=>{throw Error('must not normalize');}),{timeSec:[],features:[],recordIds:[],valid:[]});
});
test('plot breaks paths over invalid blocks and missing device-time intervals',()=>{
  const c=canvas(),rs=[record(0),record(1),record(2),record(3),record(4)];
  const data={timeSec:[0,2,4,8,10],features:[[.1,-.2,.3,.4],null,[.2,-.1,.4,.5],[.3,-.2,.1,.2],[.4,-.1,.2,.3]]};
  assert.equal(UI.curve(c,data,rs,'en'),true);assert.equal(c.hidden,false);
  for(const stroke of channelPaths(c))assert.deepEqual(stroke.points.map(p=>p.op),['move','move','move','line']);
  assert.equal(channelPaths(c).length,4);
  assert(c.labels.some(x=>x.text==='ΔF/F₀ (%)'));
  assert(c.labels.some(x=>x.text==='Time (s)'));
  assert(c.labels.some(x=>/^-[0-9]/.test(x.text)),'negative responses must remain on the axis');
});
test('plot breaks a continuous line on segment change or measured acquisition gap',()=>{
  const c=canvas(),rs=[record(0),record(1),record(2,{continuousSegment:1}),record(3,{continuousSegment:1,gapBeforeUs:2000})];
  UI.curve(c,{timeSec:[0,2,4,6],features:Array.from({length:4},()=>[.1,.2,.3,.4])},rs,'zh');
  for(const stroke of channelPaths(c))assert.deepEqual(stroke.points.map(p=>p.op),['move','line','move','move']);
});
test('empty or wholly invalid curve hides the canvas instead of fabricating points',()=>{
  for(const features of [[],[null,null],[[NaN,NaN,NaN,NaN]]]){
    const c=canvas();assert.equal(UI.curve(c,{timeSec:features.map((_,i)=>i*2),features},[],'en'),false);
    assert.equal(c.hidden,true);assert.equal(channelPaths(c).length,0);
  }
});

for(const check of checks)console.log((check.passed?'PASS ':'FAIL ')+check.name+(check.error?'\n'+check.error:''));
const failed=checks.filter(x=>!x.passed).length;
console.log(`Session/chart contracts: ${checks.length-failed}/${checks.length} passed.`);
process.exitCode=failed?1:0;
