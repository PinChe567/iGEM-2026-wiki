/* Node/data tests only. This does not claim browser pointer/keyboard rendering QA. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');const P=__dirname;
const html=fs.readFileSync(path.join(P,'hole_sweep_3d.html'),'utf8');const rows=JSON.parse(html.match(/const DATA=(.*?);<\/script>/s)[1]);const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(P,'scatter_math.js'),'utf8'),ctx);const m=ctx.ScatterMath;let tests=0;
assert.equal(m.validate(rows),true);tests++;
assert.equal(new Set(rows.map(r=>r.diameter_mm)).size,3);assert.equal(new Set(rows.map(r=>r.pitch_mm)).size,3);assert.equal(new Set(rows.map(r=>r.inlet_center_to_plate_top_mm)).size,2);tests++;
for(let k=0;k<100;k++){const p=[Math.sin(k),Math.cos(k*.31),Math.sin(k*.12)];const q=m.rotate(p,k*.02,k*.013);assert.ok(Math.abs(Math.hypot(...p)-Math.hypot(...q))<1e-12);}tests++;
for(const key of m.dimensions){const [lo,hi]=m.range(rows,key);assert.equal(m.normalize(lo,lo,hi),-1);assert.equal(m.normalize(hi,lo,hi),1);}tests++;
assert.equal(m.colorT(1,1,100,true),0);assert.equal(m.colorT(10,1,100,true),.5);assert.equal(m.colorT(100,1,100,true),1);tests++;
const csv=fs.readFileSync(path.join(P,'hole_sweep.csv'),'utf8').trim().split(/\r?\n/).map(r=>r.split(',')),heads=csv.shift();for(const row of rows){const found=csv.find(c=>c[heads.indexOf('case')]===row.case);assert.ok(found);for(const k of [...m.dimensions,'J_ratio_to_open','pressure_Pa'])assert.equal(Number(found[heads.indexOf(k)]),row[k]);assert.ok(fs.existsSync(path.join(P,row.raw_json)));}tests++;
for(const key of ['J_ratio_to_open','near_liquid_P95_ratio_to_open','pressure_Pa','open_area_fraction']){assert.ok(html.includes(`value="${key}"`));assert.ok(rows.every(r=>Number.isFinite(r[key])));}tests++;
assert.ok(!/<script[^>]+src=/.test(html));assert.ok(html.includes('onpointermove'));assert.ok(html.includes('onkeydown'));assert.ok(html.includes('onchange=draw'));tests++;
assert.ok(rows.every(r=>r.hole_count===6));assert.equal(new Set(rows.map(r=>r.global_hole_density_per_mm2)).size,1);tests++;
const result={passed:true,tests,computed_points:rows.length,axes:m.dimensions,external_script_dependencies:0,browser_interaction_tested:false,scope:'Node checks cover data, finite values, rotation invariance, axis mapping, colour mapping and declared controls; no browser UI execution.'};fs.writeFileSync(path.join(P,'interactive_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
