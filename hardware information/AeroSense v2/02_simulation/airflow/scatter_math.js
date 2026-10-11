/* Pure functions used by the self-contained offline 3D scatter and Node tests. */
globalThis.ScatterMath={
 dimensions:['diameter_mm','pitch_mm','inlet_center_to_plate_top_mm'],
 normalize(v,lo,hi){if(!Number.isFinite(v+lo+hi)||hi<=lo)throw Error('Invalid axis range');return 2*(v-lo)/(hi-lo)-1;},
 rotate(p,yaw,pitch){const a=p[0]*Math.cos(yaw)-p[1]*Math.sin(yaw),b=p[0]*Math.sin(yaw)+p[1]*Math.cos(yaw);return [a,b*Math.cos(pitch)-p[2]*Math.sin(pitch),b*Math.sin(pitch)+p[2]*Math.cos(pitch)];},
 range(rows,key){const x=rows.map(r=>Number(r[key]));if(x.some(v=>!Number.isFinite(v)))throw Error('Nonfinite metric');return [Math.min(...x),Math.max(...x)];},
 colorT(value,lo,hi,log=false){if(log){if(Math.min(value,lo,hi)<=0)throw Error('Log requires positive values');value=Math.log10(value);lo=Math.log10(lo);hi=Math.log10(hi);}return hi===lo?.5:Math.min(1,Math.max(0,(value-lo)/(hi-lo)));},
 validate(rows){if(rows.length!==18||new Set(rows.map(r=>r.case)).size!==18)throw Error('Expected18 unique computed cases');for(const r of rows){if(r.converged!==true)throw Error('Nonconverged case');for(const k of [...this.dimensions,'J_ratio_to_open','near_liquid_P95_ratio_to_open','pressure_Pa'])if(!Number.isFinite(r[k]))throw Error('Nonfinite '+k);}return true;}
};
