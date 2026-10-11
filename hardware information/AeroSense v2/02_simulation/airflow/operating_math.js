/* Pure, shared calculations for the offline operating-condition explorer. */
globalThis.OperationMath={
 rotate(p,yaw,pitch){let a=p[0]*Math.cos(yaw)-p[1]*Math.sin(yaw),b=p[0]*Math.sin(yaw)+p[1]*Math.cos(yaw);return[a,b*Math.cos(pitch)-p[2]*Math.sin(pitch),b*Math.sin(pitch)+p[2]*Math.cos(pitch)];},
 norm(v,lo,hi,log=false){if(log){v=Math.log10(v);lo=Math.log10(lo);hi=Math.log10(hi);}return hi===lo?0:2*(v-lo)/(hi-lo)-1;},
 front(rows){return rows.filter(a=>!rows.some(b=>b.worst_t90_s<=a.worst_t90_s&&b.gas_speed_p95_mm_s<=a.gas_speed_p95_mm_s&&(b.worst_t90_s<a.worst_t90_s||b.gas_speed_p95_mm_s<a.gas_speed_p95_mm_s)));},
 choose(rows,target,speed,re=3){return rows.filter(a=>a.worst_t90_s<=target&&a.gas_speed_p95_mm_s<=speed&&a.port_Re<=re).sort((a,b)=>a.Q_mL_min-b.Q_mL_min)[0]||null;},
 validate(rows){if(rows.length!==21||new Set(rows.map(r=>`${r.Q_mL_min}|${r.Dgas_mm2_s}`)).size!==21)throw Error('Expected 21 computed points');for(const r of rows)for(const k of ['Q_mL_min','Dgas_mm2_s','t10_s','t50_s','t90_s','gas_speed_p95_mm_s','port_Re','chamber_pressure_drop_Pa'])if(!Number.isFinite(r[k])||r[k]<0)throw Error('Invalid '+k);return true;}
};