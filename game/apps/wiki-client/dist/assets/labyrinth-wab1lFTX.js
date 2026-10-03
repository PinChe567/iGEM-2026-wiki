import{g as or}from"./index-CXh1DE2f.js";import{r as Tl,c as El,a as Dh,l as Nh,b as Uh,d as Fh,e as Oh,g as kh,f as Bh,h as zh,t as Gh}from"./science-hash-BjG7703R.js";import{a as Hh,b as Vh,c as Wh,t as Ks,r as Xh,m as qh,s as $h}from"./mount-D2POQTHj.js";import{i as Kh,A as Yh,P as Zh,S as ou,C as Jh,t as _n,a as Mc,b as qr,c as Qh,E as jh,d as lu,e as Fi,f as cu,g as mr,h as Ao,j as du,k as cr,V as ef,l as tf,I as wl,m as nf,n as rf,M as xc,o as sf,r as pn,p as uu,q as af,s as of,u as hs}from"./map-BktXfWpY.js";import{p as hu,L as ia,r as lf}from"./storage-CmXva9Kt.js";function cf(n,e){return n.authorizedGates.has(e)||Kh(n.odorId,e)?{allowed:!0,usedPhaseShift:!1,artifactRequired:!1}:{allowed:!1,reason:"gate_unauthorized"}}function fu(n,e,t){return t*n.width+e}function gr(n,e,t){return e>=0&&t>=0&&e<n.width&&t<n.height}function df(n,e,t){if(gr(n,e,t))return n.tiles.find(i=>i.x===e&&i.y===t)}function uf(n,e,t){if(!gr(n,e,t))return!0;const i=fu(n,e,t);return n.collision[i]===!0}function hf(n,e){return n.kind!=="door"||!n.doorId?!0:e.get(n.doorId)!==!1}const ff=.8,pf=7,mf=64;function gf(n,e,t){return gr(n,e,t)?n.collision[fu(n,e,t)]===!0:!0}function _f(n,e,t,i){const r=Math.cos(t),s=Math.sin(t),a=.05;let o=0,l=e.x,c=e.y;for(;o<i;){l+=r*a,c+=s*a,o+=a;const d=Math.floor(l),u=Math.floor(c);if(gf(n,d,u))return{angle:t,distance:o,hitX:l,hitY:c,hitWall:!0}}return{angle:t,distance:i,hitX:e.x+r*i,hitY:e.y+s*i,hitWall:!1}}function vf(n=mf){return n*Math.PI/180}function pu(n,e,t,i,r={}){const s=r.haloRadius??ff,a=r.coneRange??pf,o=r.coneFovRad??vf(),l=i.x-e.x,c=i.y-e.y,d=Math.hypot(l,c);if(d<1e-6)return!0;const u=Math.atan2(c,l),h=_f(n,e,u,d+.01);if(h.hitWall&&h.distance<d-.02)return!1;if(d<=s)return!0;let f=u-t;for(;f>Math.PI;)f-=Math.PI*2;for(;f<-Math.PI;)f+=Math.PI*2;return Math.abs(f)<=o/2&&d<=a}const yf=.28;function bc(n,e,t,i,r){const s=Mf(n,e,t,yf);let a,o=!1,l=!1;for(const{tx:c,ty:d}of s){if(!gr(n,c,d)||uf(n,c,d))return{blocked:!0,reason:"blocked_wall"};const u=df(n,c,d);if(!u)return{blocked:!0,reason:"out_of_bounds"};if(u.kind==="door"&&!hf(u,i))return{blocked:!0,reason:"door_closed"};if(u.kind==="gate"&&u.gateId){const h=cf(r,u.gateId);if(!h.allowed)return{blocked:!0,reason:h.reason};a=u.gateId,o=h.usedPhaseShift,l=h.artifactRequired}}return{blocked:!1,gateId:a,usedPhaseShift:o,artifactRequired:l}}function Mf(n,e,t,i){const r=Math.floor(e-i),s=Math.floor(e+i),a=Math.floor(t-i),o=Math.floor(t+i),l=[];for(let c=a;c<=o;c+=1)for(let d=r;d<=s;d+=1)gr(n,d,c)&&l.push({tx:d,ty:c});return l.length===0&&gr(n,Math.floor(e),Math.floor(t))&&l.push({tx:Math.floor(e),ty:Math.floor(t)}),l}function mu(n,e,t,i,r){let s=e.x,a=e.y,o,l=!1,c=!1;if(t.x!==0){const d=s+t.x,u=bc(n,d,a,r,i);if(!u.blocked)s=d,u.gateId&&(o=u.gateId,l=u.usedPhaseShift,c=u.artifactRequired);else if(t.y===0)return{ok:!1,reason:u.reason,position:{x:s,y:a}}}if(t.y!==0){const d=a+t.y,u=bc(n,s,d,r,i);if(!u.blocked)a=d,u.gateId&&(o=u.gateId,l=u.usedPhaseShift,c=u.artifactRequired);else if(t.x===0)return{ok:!1,reason:u.reason,position:{x:s,y:a}}}return{ok:!0,position:{x:s,y:a},crossedGateId:o,usedPhaseShift:l,artifactRequired:c}}function xf(n){return{scanCharge:n,repairScrap:0,keys:0}}function Aa(n,e,t){return t===0?n:e==="scanCharge"?n.scanCharge===null?n:{...n,scanCharge:n.scanCharge+t}:e==="repairScrap"?{...n,repairScrap:n.repairScrap+t}:e==="keys"?{...n,keys:n.keys+t}:n}function Al(n,e,t,i){if(!(i!=null&&i.resources))return{inventory:n,health:e};let r=n,s=e;const a=i.resources;return a.scanCharge&&(r=Aa(r,"scanCharge",a.scanCharge)),a.repairScrap&&(r=Aa(r,"repairScrap",a.repairScrap)),a.keys&&(r=Aa(r,"keys",a.keys)),a.health&&(s=Math.min(t,s+a.health)),{inventory:r,health:s}}function bf(n){return n.scanCharge===null?n:n.scanCharge<=0?null:{...n,scanCharge:n.scanCharge-1}}function Sf(n){return n.scanCharge===null||n.scanCharge>0}function _a(n,e){return n.player.collectedModules.includes(e)}function Ii(n,e,t){if(!n)return!0;const i=[];return n.learnedOdorIds&&n.learnedOdorIds.length>0&&i.push(n.learnedOdorIds.every(r=>e.learnedOdorIds.includes(r))),n.moduleIds&&n.moduleIds.length>0&&i.push(n.moduleIds.every(r=>e.collectedModules.includes(r))),n.scanRequired&&i.push(t),i.length===0?!0:(n.mode??"all")==="any"?i.some(Boolean):i.every(Boolean)}function gu(n,e,t,i){var o,l,c;if(n.kind!=="hiddenPassage"&&n.kind!=="hiddenChest"&&n.kind!=="thornWall")return!1;const r={...n.requirements,scanRequired:!1},s=((o=n.requirements)==null?void 0:o.scanRequired)===!0,a=n.odorId??((c=(l=n.requirements)==null?void 0:l.learnedOdorIds)==null?void 0:c[0]);return i!==void 0&&a&&i!==a?!1:Ii(r,e,!1)&&(!s||t)}function _u(n,e,t){return n.kind!=="decayBarrier"?!1:e.revealedBarrierIds.includes(n.id)?!0:Ii(n.requirements,e,t)}function Sc(n){return n.interactables.filter(e=>e.kind==="scentGate"?Ii(e.requirements,n.player,!1):e.kind==="decayBarrier"?_u(e,n.player,n.player.scan.active):e.kind==="scentLock"?n.player.solvedPuzzleIds.includes(e.id):!1).map(e=>e.id)}function Tf(n,e){if(e.kind!=="exitSeal"||!e.sealId||n.player.restoredSealIds.includes(e.sealId))return!1;if(e.sealId==="storage")return n.player.foundClueIds.includes("storage-coffee");if(e.sealId==="garden"){const t=n.interactables.find(i=>i.kind==="thornWall"&&i.trueTarget);return!!(t&&n.unlockedPassageIds.includes(t.id))}return e.sealId==="signal"?n.player.collectedModules.includes("signal-filter"):!1}function vu(n,e){return n.includes(e)?[...n]:[...n,e]}function at(){return{hitEnemyIds:[],playerDamaged:!1,respawned:!1,learnedOdorId:null,openedId:null,unlockedPassageId:null,sealId:null,message:null}}function yu(n,e=n.elapsedMs){return e>=n.player.invulnerableUntilMs}function _r(n,e){return Math.hypot(n.x-e.x,n.y-e.y)}function Tc(n,e){let t=Math.abs(n-e)%(Math.PI*2);return t>Math.PI&&(t=Math.PI*2-t),t}function Ef(n){return n.kind==="noiseBloom"?n.coreTiles.map(e=>_n(e)):[n.position]}function Rl(n,e,t){const i=e.coreTiles[e.trueCoreIndex]??e.coreTiles[0];return i?_r(n,_n(i))<=t:_r(n,e.position)<=t}function Cl(n,e,t){return e.coreTiles.length===0?_r(n,e.position)<=t:e.coreTiles.some(i=>_r(n,_n(i))<=t)}function wf(n,e,t){if(e.defeated)return!1;if(e.kind==="noiseBloom"){if(!(t?Cl(n.player.position,e,qr):Rl(n.player.position,e,qr)))return!1;if(t)return!0;const a=e.coreTiles[e.trueCoreIndex],o=Math.atan2(_n(a).y-n.player.position.y,_n(a).x-n.player.position.x);return Tc(n.player.facing,o)<=Mc/2*Math.PI/180}if(_r(n.player.position,e.position)>qr)return!1;if(t)return!0;const r=Math.atan2(e.position.y-n.player.position.y,e.position.x-n.player.position.x);return Tc(n.player.facing,r)<=Mc/2*Math.PI/180}const Af={sporeling:{resources:{scanCharge:1}},vineCrawler:{resources:{repairScrap:1}},noiseWisp:{resources:{scanCharge:1}},mimicSpore:{resources:{keys:1,health:1}},noiseBloom:{moduleId:"signal-filter",resources:{scanCharge:1}}};function Rf(n,e){const t=n.enemies.find(a=>a.id===e);if(!t||t.defeated)return n;const i=Af[t.kind],r=Al(n.player.inventory,n.player.health,n.player.maxHealth,i);let s=n.player.collectedModules;return i.moduleId&&(s=vu(s,i.moduleId)),{...n,enemies:n.enemies.map(a=>a.id===e?{...a,defeated:!0,health:0,aggro:!1,disguised:!1}:a),player:{...n.player,inventory:r.inventory,health:r.health,collectedModules:s,defeatedEnemyIds:n.player.defeatedEnemyIds.includes(e)?n.player.defeatedEnemyIds:[...n.player.defeatedEnemyIds,e]}}}function Cf(n,e){if(n.elapsedMs<n.player.attackCooldownUntilMs)return n;let t={...n,player:{...n.player,attackCooldownUntilMs:n.elapsedMs+Yh},lastFeedback:{...at()}};const i=[];for(const s of t.enemies){if(!wf(t,s,e))continue;i.push(s.id);const a={...s,aggro:!0,revealed:!0,disguised:!1,health:s.health-Zh};t={...t,enemies:t.enemies.map(o=>o.id===s.id?a:o)},a.health<=0&&(t=Rf(t,s.id))}let r=i.length>0?"hit":null;if(!r){const s=t.enemies.find(a=>a.kind==="noiseBloom"&&!a.defeated);s&&Cl(n.player.position,s,qr)&&!Rl(n.player.position,s,qr)&&(r="bloom-wrong-core")}return{...t,lastFeedback:{...t.lastFeedback,hitEnemyIds:i,message:r}}}function If(n){const e=n.interactables.find(i=>i.id===n.player.currentCheckpointId),t=(e==null?void 0:e.tile)??n.map.spawn;return _n(t)}function Pf(n){const e=If(n);return{...n,player:{...n.player,health:n.player.maxHealth,position:{...e},prevPosition:{...e},invulnerableUntilMs:n.elapsedMs+lu},lastFeedback:{...n.lastFeedback,respawned:!0,playerDamaged:!0}}}function Lf(n,e=Jh){if(!yu(n))return n;const t=Math.max(0,n.player.health-e);let i={...n,player:{...n.player,health:t,invulnerableUntilMs:n.elapsedMs+lu},lastFeedback:{...at(),playerDamaged:!0}};return t<=0&&(i=Pf(i)),i}function Df(n){if(n.elapsedMs<ou||!yu(n))return n;const e=Qh+jh;for(const t of n.enemies){if(t.defeated||t.kind==="mimicSpore"&&t.disguised||t.kind==="vineCrawler"&&!t.aggro&&!t.revealed)continue;if(t.kind==="noiseBloom"?Rl(n.player.position,t,e):Ef(t).some(r=>_r(n.player.position,r)<=e))return Lf(n)}return n}function Mu(n,e){return e.x<0||e.y<0||e.x>=n.width||e.y>=n.height?!1:n.collision[e.y*n.width+e.x]!==!0}function Nf(n,e,t,i=3){const r=El(t),s=[];for(let l=-2;l<=2;l+=1)for(let c=-2;c<=2;c+=1){if(c===0&&l===0)continue;const d={x:e.x+c,y:e.y+l};Mu(n,d)&&s.push(d)}const a=[],o=[...s];for(;a.length<i&&o.length>0;){const l=Tl(r,o.length),c=o.splice(l,1)[0];c&&a.push(c)}return a}function Uf(n,e,t="standard"){const i=El(`${e}:boss`),r=Fi[t].extraNoise;return n.enemies.map(s=>{const a=cu(s.kind,t),o=s.coreTiles??[s.tile],l=s.kind==="noiseBloom"?Tl(i,o.length):0,c=s.kind==="noiseBloom"?o[l]??s.tile:s.tile,d=_n(c);return{id:s.id,kind:s.kind,position:d,health:a,maxHealth:a,facing:0,aggro:s.kind==="noiseBloom",revealed:!1,disguised:s.kind==="mimicSpore",defeated:!1,trueCoreIndex:l,coreTiles:o,phase:1,falseMarkerTiles:s.kind==="noiseWisp"?Nf(n,s.tile,`${e}:${s.id}`,r?6:3):[]}})}function Ff(n,e){return Math.hypot(n.x-e.x,n.y-e.y)}function Of(n,e){if(n.defeated)return n;const t=e.elapsedMs<ou,i=Ff(n.position,e.player.position),r=e.player.scan.active;let s=n.aggro,a=n.revealed,o=n.disguised;n.kind==="vineCrawler"?(r&&i<=cr||!t&&i<=ef)&&(s=!0,a=!0):n.kind==="mimicSpore"?r&&i<=cr&&(a=!0,o=!1):n.kind==="noiseWisp"?(!t&&i<=Ao.noiseWisp.aggroRange&&(s=!0),r&&i<=cr&&(a=!0)):n.kind==="sporeling"?!t&&i<=Ao.sporeling.aggroRange&&(s=!0):n.kind==="noiseBloom"&&r&&(a=!0);let l=n.phase,c=n.trueCoreIndex,d=n.position;return n.kind==="noiseBloom"&&n.phase===1&&n.health<=n.maxHealth/2&&(l=2,c=(n.trueCoreIndex+1)%Math.max(1,n.coreTiles.length),d=_n(n.coreTiles[c])),{...n,aggro:s,revealed:a,disguised:o,phase:l,trueCoreIndex:c,position:d}}function kf(n,e){const t=mr(n.map,n.unlockedPassageIds),i=new Map(t.doors.map(a=>[a.id,n.openDoorIds.includes(a.id)])),r=n.player.position,s=n.enemies.map(a=>{const o=Of(a,n);if(o.defeated||o.kind==="mimicSpore"&&o.disguised||o.kind==="vineCrawler"&&!o.aggro)return o;const l=Ao[o.kind],c=(o.kind==="noiseBloom"&&o.phase===2?l.speed*1.25:l.speed)*Fi[n.difficulty].enemySpeedMul,d=o.kind==="noiseBloom"?_n(o.coreTiles[o.trueCoreIndex]??o.coreTiles[0]):r;if(o.kind==="noiseBloom")return{...o,position:{...d}};if(!o.aggro)return o;const u=d.x-o.position.x,h=d.y-o.position.y,f=Math.hypot(u,h);if(f<.08)return o;const g={x:u/f*c*e,y:h/f*c*e},v=mu(t,o.position,g,du,i);return{...o,position:v.position,facing:Math.atan2(h,u)}});return{...n,enemies:s}}function Bf(n,e){const t=cu("sporeling",n.difficulty),r=[{x:e.x+1,y:e.y},{x:e.x-1,y:e.y},{x:e.x,y:e.y+1},{x:e.x,y:e.y-1}].find(a=>Mu(n.map,a))??e,s=`alarm-spore-${Math.floor(n.elapsedMs)}`;return n.enemies.some(a=>a.id===s&&!a.defeated)?n:{...n,enemies:[...n.enemies,{id:s,kind:"sporeling",position:_n(r),health:t,maxHealth:t,facing:0,aggro:!0,revealed:!0,disguised:!1,defeated:!1,trueCoreIndex:0,coreTiles:[r],phase:1,falseMarkerTiles:[]}]}}function zf(n,e){return{...n,enemies:n.enemies.map(t=>t.id===e?{...t,disguised:!1,revealed:!0,aggro:!0}:t)}}const Gf={junior:{zoneWidth:.4,speed:.62},standard:{zoneWidth:.24,speed:.96},challenge:{zoneWidth:.14,speed:1.28}},Hf={junior:3,standard:4,challenge:5},Ra=tf.slice(0,6);function Vf(n,e){const t=n.interactables.find(i=>i.id===e&&i.kind==="scentLock");return t!=null&&t.odorId?{id:t.id,kind:"scentLock",choices:t.lockChoices??["banana","lemon","mint"],answerId:t.odorId}:null}function Wf(n,e){const t=Gf[n.difficulty],i=.5-t.zoneWidth/2;return{id:e,kind:"skillCheck",choices:[],answerId:"hit",needed:2,hits:0,indicator:.08,dir:1,zoneStart:i,zoneWidth:t.zoneWidth,speed:t.speed,cooldownUntilMs:0}}function Xf(n,e){const t=Hf[n.difficulty],i=El(`${n.seed}:${e}:pattern`),r=[];for(let o=0;o<t;o+=1)r.push(Ra[Tl(i,Ra.length)]??"coffee");const s=Ra.filter(o=>!r.includes(o)).slice(0,2),a=[...new Set([...r,...s])];return{id:e,kind:"patternMemory",choices:a,answerId:r.join(","),sequence:r,input:[],revealUntilMs:n.elapsedMs+(n.difficulty==="junior"?2200:1600)}}function Ca(n,e){return{...n,phase:"puzzle",activePuzzle:e,lastFeedback:{...at(),message:"puzzle"}}}function Il(n,e){var s;const t=n.interactables.find(a=>a.id===e);if(!t||n.player.openedChestIds.includes(e))return{...n,phase:"playing",activePuzzle:null};const i=Al(n.player.inventory,n.player.health,n.player.maxHealth,t.loot),r=(s=t.loot)==null?void 0:s.moduleId;return{...n,phase:"playing",activePuzzle:null,player:{...n.player,inventory:i.inventory,health:i.health,collectedModules:r?vu(n.player.collectedModules,r):n.player.collectedModules,openedChestIds:[...n.player.openedChestIds,e]},lastFeedback:{...at(),openedId:e,message:r?"module-online":"opened"}}}function xu(n,e,t){const i=n.activePuzzle;if(!i||i.kind!=="skillCheck")return n;const r=i.speed??1,s=i.dir??1;let a=(i.indicator??0)+s*r*(t/1e3),o=s;a>=1?(a=1,o=-1):a<=0&&(a=0,o=1);let l={...i,indicator:a,dir:o};if((e.attackPressed||e.interactPressed)&&n.elapsedMs>=(i.cooldownUntilMs??0)){const c=i.zoneStart??.4,d=i.zoneWidth??.2,u=a>=c&&a<=c+d;if(l={...l,cooldownUntilMs:n.elapsedMs+280},u){const f=(i.hits??0)+1;return l={...l,hits:f},f>=(i.needed??2)?Il({...n,activePuzzle:l},i.id):{...n,activePuzzle:l,lastFeedback:{...at(),message:"skill-hit"}}}l={...l,hits:0};let h={...n,activePuzzle:l,lastFeedback:{...at(),message:"skill-miss"}};if(n.difficulty==="challenge"){const f=n.interactables.find(g=>g.id===i.id);f&&(h=Bf(h,f.tile))}return h}return{...n,activePuzzle:l}}function Ec(n,e){const t=n.activePuzzle;if(!t)return n;if(t.kind==="skillCheck")return xu(n,{attackPressed:e==="hit",interactPressed:!1},0);if(t.kind==="patternMemory"){if(n.elapsedMs<(t.revealUntilMs??0))return n;const i=t.sequence??[],r=[...t.input??[],e],s=r.length-1;return r[s]!==i[s]?{...n,activePuzzle:{...t,input:[]},lastFeedback:{...at(),message:"pattern-miss"}}:r.length>=i.length?Il({...n,activePuzzle:{...t,input:r}},t.id):{...n,activePuzzle:{...t,input:r},lastFeedback:{...at(),message:"pattern-hit"}}}return e!==t.answerId?{...n,lastFeedback:{...at(),message:"wrong-scent"}}:t.kind==="scentLock"?{...n,phase:"playing",activePuzzle:null,player:{...n.player,solvedPuzzleIds:n.player.solvedPuzzleIds.includes(t.id)?n.player.solvedPuzzleIds:[...n.player.solvedPuzzleIds,t.id]},lastFeedback:{...at(),message:"lock-open"}}:{...n,phase:"playing",activePuzzle:null,player:{...n.player,exitPatternSolved:!0},lastFeedback:{...at(),message:"exit-ready"}}}function wi(){return{item:null,enemyId:null,input:"none",labelKey:"",enabled:!1,disabledReason:null,actionType:"none"}}function qf(n,e=wl){const t=n.player.position;return n.interactables.map(i=>({item:i,distance:Math.hypot(t.x-(i.tile.x+.5),t.y-(i.tile.y+.5))})).filter(i=>i.distance<=e).sort((i,r)=>i.distance-r.distance).map(i=>i.item)}function bu(n,e=wl){const t=n.player.position;return n.enemies.find(i=>i.kind!=="mimicSpore"||i.defeated||!i.disguised?!1:Math.hypot(t.x-i.position.x,t.y-i.position.y)<=e)}function fs(n,e,t,i){var r,s;if(!n)return null;if((r=n.moduleIds)!=null&&r.includes("receptor-cartridge")&&!e.collectedModules.includes("receptor-cartridge"))return"need-receptor";if((s=n.moduleIds)!=null&&s.includes("pattern-decoder")&&!e.collectedModules.includes("pattern-decoder"))return"decoder-offline";if(n.moduleIds&&n.moduleIds.some(a=>!e.collectedModules.includes(a)))return"locked";if(n.learnedOdorIds&&n.learnedOdorIds.length>0){const a=n.learnedOdorIds.find(l=>!e.learnedOdorIds.includes(l));if(a)return`${a}-profile-required`;const o=n.learnedOdorIds[0];if(o&&i!==o&&!t)return`${o}-profile-required`}return n.scanRequired&&!t?"scan-surface-first":"locked"}function wc(n,e){var a,o;const t=bu(n);if(!e&&t)return{item:null,enemyId:t.id,input:"E",labelKey:"promptChest",enabled:!0,disabledReason:null,actionType:"reveal-mimic"};if(!e)return wi();const i=n.player,r=i.scan.active,s=i.highlightedIds.includes(e.id);if(e.kind==="scentTrail"||e.kind==="noisyField"||e.kind==="scentGate")return e.kind==="scentTrail"&&e.odorId&&i.learnedOdorIds.includes(e.odorId)&&!s?{item:e,enemyId:null,input:"Q",labelKey:"promptScanTrail",enabled:!0,disabledReason:i.activeScentProfileId===e.odorId?null:`${e.odorId}-profile-required`,actionType:"none"}:wi();if(e.kind==="checkpoint")return e.id===i.currentCheckpointId?{item:e,enemyId:null,input:"E",labelKey:"promptCheckpoint",enabled:!1,disabledReason:"checkpoint",actionType:"inspect"}:{item:e,enemyId:null,input:"E",labelKey:"promptCheckpoint",enabled:!0,disabledReason:null,actionType:"set-checkpoint"};if(e.kind==="odorSample"&&e.odorId)return i.learnedOdorIds.includes(e.odorId)?{item:e,enemyId:null,input:"E",labelKey:"promptSample",enabled:!1,disabledReason:"already-learned",actionType:"inspect"}:Ii(e.requirements,i,r)?{item:e,enemyId:null,input:"E",labelKey:"promptSample",enabled:!0,disabledReason:null,actionType:"learn-odor"}:{item:e,enemyId:null,input:"E",labelKey:"promptSample",enabled:!1,disabledReason:fs(e.requirements,i,r,i.activeScentProfileId),actionType:"inspect"};if(e.kind==="chest"||e.kind==="modulePedestal")return i.openedChestIds.includes(e.id)?{item:e,enemyId:null,input:"E",labelKey:"promptChest",enabled:!1,disabledReason:"already-open",actionType:"inspect"}:Ii(e.requirements,i,r)?{item:e,enemyId:null,input:"E",labelKey:e.kind==="modulePedestal"?"promptPedestal":"promptChest",enabled:!0,disabledReason:null,actionType:"open-chest"}:{item:e,enemyId:null,input:"E",labelKey:"promptChest",enabled:!1,disabledReason:fs(e.requirements,i,r,i.activeScentProfileId),actionType:"inspect"};if(e.kind==="coffeePile")return i.searchedPileIds.includes(e.id)?{item:e,enemyId:null,input:"E",labelKey:"promptPile",enabled:!1,disabledReason:"already-searched",actionType:"inspect"}:!i.learnedOdorIds.includes("coffee")||i.activeScentProfileId!=="coffee"?{item:e,enemyId:null,input:i.learnedOdorIds.includes("coffee")?"Q":"E",labelKey:i.learnedOdorIds.includes("coffee")?"promptScanPile":"promptPile",enabled:!1,disabledReason:"coffee-profile-required",actionType:"inspect"}:s?{item:e,enemyId:null,input:"E",labelKey:"promptPile",enabled:!0,disabledReason:null,actionType:"search-pile"}:{item:e,enemyId:null,input:"Q",labelKey:"promptScanPile",enabled:!0,disabledReason:"scan-surface-first",actionType:"none"};if(e.kind==="exitSeal"&&e.sealId){if(i.restoredSealIds.includes(e.sealId))return{item:e,enemyId:null,input:"E",labelKey:"promptSeal",enabled:!1,disabledReason:"seal-already",actionType:"inspect"};if(!Tf(n,e)){const l=e.sealId==="storage"?"coffee-profile-required":e.sealId==="garden"?"rose-profile-required":"signal-seal-locked";return{item:e,enemyId:null,input:"E",labelKey:"promptSeal",enabled:!1,disabledReason:l,actionType:"inspect"}}return{item:e,enemyId:null,input:"E",labelKey:"promptSeal",enabled:!0,disabledReason:null,actionType:"restore-seal"}}if(e.kind==="decayBarrier")return i.revealedBarrierIds.includes(e.id)||n.openDoorIds.includes(e.id)?wi():{item:e,enemyId:null,input:"Q",labelKey:"promptVines",enabled:i.learnedOdorIds.includes("lemon")&&i.activeScentProfileId==="lemon",disabledReason:i.learnedOdorIds.includes("lemon")&&i.activeScentProfileId==="lemon"?"scan-surface-first":"lemon-profile-required",actionType:"none"};if(e.kind==="thornWall")return n.unlockedPassageIds.includes(e.id)?wi():!i.learnedOdorIds.includes("rose")||i.activeScentProfileId!=="rose"?{item:e,enemyId:null,input:i.learnedOdorIds.includes("rose")?"Q":"E",labelKey:"promptThorn",enabled:!1,disabledReason:"rose-profile-required",actionType:"inspect"}:!s&&!gu(e,i,r)?{item:e,enemyId:null,input:"Q",labelKey:"promptThorn",enabled:!0,disabledReason:"scan-surface-first",actionType:"none"}:{item:e,enemyId:null,input:"E",labelKey:"promptThorn",enabled:!0,disabledReason:null,actionType:"open-passage"};if(e.kind==="hiddenPassage"||e.kind==="hiddenChest"){if(!n.unlockedPassageIds.includes(e.id)){const c=e.odorId??((o=(a=e.requirements)==null?void 0:a.learnedOdorIds)==null?void 0:o[0]),d=!c||i.activeScentProfileId===c;return!Ii({...e.requirements,scanRequired:!1},i,!1)||!d?{item:e,enemyId:null,input:c&&i.learnedOdorIds.includes(c)?"Q":"E",labelKey:"promptScanWall",enabled:!1,disabledReason:fs(e.requirements,i,r,i.activeScentProfileId),actionType:"inspect"}:{item:e,enemyId:null,input:"Q",labelKey:"promptScanWall",enabled:!0,disabledReason:"scan-surface-first",actionType:"none"}}return e.kind==="hiddenChest"?i.openedChestIds.includes(e.id)?{item:e,enemyId:null,input:"E",labelKey:"promptChest",enabled:!1,disabledReason:"already-open",actionType:"inspect"}:{item:e,enemyId:null,input:"E",labelKey:"promptChest",enabled:!0,disabledReason:null,actionType:"open-chest"}:wi()}return e.kind==="scentLock"?i.solvedPuzzleIds.includes(e.id)?{item:e,enemyId:null,input:"E",labelKey:"promptLock",enabled:!1,disabledReason:"lock-open",actionType:"inspect"}:Ii(e.requirements,i,!1)?{item:e,enemyId:null,input:"E",labelKey:"promptLock",enabled:!0,disabledReason:null,actionType:"open-scent-lock"}:{item:e,enemyId:null,input:"E",labelKey:"promptLock",enabled:!1,disabledReason:fs(e.requirements,i,!1,i.activeScentProfileId),actionType:"inspect"}:e.kind==="exit"?{item:e,enemyId:null,input:"E",labelKey:"promptExit",enabled:!0,disabledReason:null,actionType:"use-exit"}:wi()}function va(n){if(bu(n))return wc(n);for(const t of qf(n)){const i=wc(n,t);if(i.input!=="none"||i.actionType!=="none")return i}return wi()}function hi(n,e){return{...n,lastFeedback:{...at(),message:e}}}function Ro(n,e){return e&&!n.player.learnedOdorIds.includes(e)?hi(n,"scent-not-learned"):{...n,player:{...n.player,activeScentProfileId:e},lastFeedback:{...at(),message:e?"profile-selected":"profile-cleared"}}}function $f(n){const e=va(n);if(e.actionType==="reveal-mimic"&&e.enemyId)return{...zf(n,e.enemyId),lastFeedback:{...at(),message:"mimic"}};if(e.input==="none"&&e.actionType==="none")return hi(n,"nothing-nearby");if(e.input==="Q"||!e.enabled)return hi(n,e.disabledReason??"scan-surface-first");const t=e.item;if(!t)return hi(n,"nothing-nearby");if(e.actionType==="set-checkpoint")return{...n,player:{...n.player,currentCheckpointId:t.id,discoveredCheckpointIds:n.player.discoveredCheckpointIds.includes(t.id)?n.player.discoveredCheckpointIds:[...n.player.discoveredCheckpointIds,t.id]},lastFeedback:{...at(),message:"checkpoint"}};if(e.actionType==="inspect")return hi(n,e.disabledReason??"locked");if(e.actionType==="open-passage")return n.unlockedPassageIds.includes(t.id)?hi(n,"secret-found"):{...n,unlockedPassageIds:[...n.unlockedPassageIds,t.id],player:{...n.player,discoveredSecretIds:t.secretId?n.player.discoveredSecretIds.includes(t.secretId)?n.player.discoveredSecretIds:[...n.player.discoveredSecretIds,t.secretId]:n.player.discoveredSecretIds},lastFeedback:{...at(),unlockedPassageId:t.id,message:"thorn-open"}};if(e.actionType==="open-scent-lock"){const i=Vf(n,t.id);return i?Ca(n,i):hi(n,"locked")}if(e.actionType==="learn-odor"&&t.odorId)return{...n,player:{...n.player,learnedOdorIds:[...n.player.learnedOdorIds,t.odorId],activeScentProfileId:t.odorId},lastFeedback:{...at(),learnedOdorId:t.odorId,message:"learned"}};if(e.actionType==="search-pile"){const i=[...n.player.searchedPileIds,t.id];if(!t.trueTarget)return{...n,player:{...n.player,searchedPileIds:i},lastFeedback:{...at(),message:"no-matching-pattern"}};const r=Al(n.player.inventory,n.player.health,n.player.maxHealth,t.loot),s=t.clueId??"storage-coffee";return{...n,player:{...n.player,inventory:r.inventory,health:r.health,searchedPileIds:i,foundClueIds:n.player.foundClueIds.includes(s)?n.player.foundClueIds:[...n.player.foundClueIds,s]},lastFeedback:{...at(),openedId:t.id,message:"pile-clue"}}}return e.actionType==="restore-seal"&&t.sealId?{...n,player:{...n.player,restoredSealIds:n.player.restoredSealIds.includes(t.sealId)?n.player.restoredSealIds:[...n.player.restoredSealIds,t.sealId]},lastFeedback:{...at(),message:"seal-restored",sealId:t.sealId}}:e.actionType==="open-chest"?t.lockMinigame==="skillCheck"?Ca(n,Wf(n,t.id)):t.lockMinigame==="patternMemory"?Ca(n,Xf(n,t.id)):Il(n,t.id):e.actionType==="inspect-exit"?{...n,player:{...n.player,inspectedExit:!0},lastFeedback:{...at(),message:"restore-seals"}}:e.actionType==="use-exit"?{...n,phase:"victory",lastFeedback:{...at(),message:"exit"}}:hi(n,"nothing-nearby")}function vi(n){const e=n.interactables.find(i=>i.kind==="exit");return{id:"leave",tile:(e==null?void 0:e.tile)??n.map.exitTile,labelKey:"objFindExit",wingKey:"wingSignal"}}function Kf(n){const e=vi(n);return Math.atan2(e.tile.y+.5-n.player.position.y,e.tile.x+.5-n.player.position.x)}function Yf(n){const e=n.interactables.filter(i=>i.secretId),t=new Set(n.player.discoveredSecretIds).size;return{found:t,total:Math.max(e.length,t)}}function Su(n,e=wl){const t=n.player.explored.slice(),i=n.player.position.x,r=n.player.position.y,s=n.map.width,a=n.map.height;let o=!1;const l=Math.max(0,Math.floor(i-e)),c=Math.min(s-1,Math.ceil(i+e)),d=Math.max(0,Math.floor(r-e)),u=Math.min(a-1,Math.ceil(r+e));for(let h=d;h<=u;h+=1)for(let f=l;f<=c;f+=1){if(Math.hypot(i-(f+.5),r-(h+.5))>e)continue;const g=h*s+f;t[g]||(t[g]=!0,o=!0)}return o?{...n,player:{...n.player,explored:t}}:n}function Ia(n){return nf[n]}function Zf(n){return _a(n,"receptor-cartridge")}function Pl(n){return _a(n,"optical-reader")}function dr(n){return _a(n,"signal-filter")}function Jf(n){return _a(n,"pattern-decoder")}function Tu(n){if(!Zf(n))return[];const e=dr(n),t=Pl(n),i=Jf(n),r=n.player.scan.active,s=[];for(const a of n.interactables){if(a.kind==="odorSample"&&a.odorId&&s.push({id:`scent-${a.id}`,tile:a.tile,odorId:a.odorId,vector:Ia(a.odorId),intensity:1,falseSignal:!1,classified:i&&n.player.learnedOdorIds.includes(a.odorId)}),a.kind==="coffeePile"){const o=n.player.highlightedIds.includes(a.id);(r||o)&&s.push({id:`pile-${a.id}`,tile:a.tile,odorId:"coffee",vector:Ia("coffee"),intensity:a.trueTarget?1:.45,falseSignal:!1,classified:i||o})}a.kind==="scentTrail"&&(t||n.player.highlightedIds.includes(a.id))&&s.push({id:`trail-${a.id}`,tile:a.tile,odorId:a.odorId,vector:a.odorId?Ia(a.odorId):void 0,intensity:a.trailIntensity??.5,falseSignal:!1,classified:i}),a.kind==="noisyField"&&!e&&s.push({id:`noise-${a.id}`,tile:a.tile,intensity:r?.35:.55,falseSignal:!0,classified:r})}for(const a of n.enemies)if(!(a.kind!=="noiseWisp"||a.defeated||e)){for(const[o,l]of a.falseMarkerTiles.entries())s.push({id:`wisp-false-${a.id}-${o}`,tile:l,intensity:.4,falseSignal:!0,classified:r||a.revealed});(r||a.revealed)&&s.push({id:`wisp-core-${a.id}`,tile:{x:Math.floor(a.position.x),y:Math.floor(a.position.y)},intensity:.9,falseSignal:!1,classified:!0})}return s}function Pa(n,e){return Math.hypot(n.player.position.x-(e.x+.5),n.player.position.y-(e.y+.5))}function Eu(n,e={}){if(!n.player.scan.active)return n;const t=n.player.activeScentProfileId,i=[];let r=n,s=null,a=n.lastFeedback.message;for(const c of n.interactables)Pa(r,c.tile)>cr||(c.kind==="coffeePile"&&t==="coffee"&&i.push(c.id),c.kind==="scentTrail"&&t&&c.odorId===t&&i.push(c.id),(c.kind==="hiddenPassage"||c.kind==="hiddenChest"||c.kind==="thornWall")&&!r.unlockedPassageIds.includes(c.id)&&gu(c,r.player,!0,t)&&(i.push(c.id),r={...r,unlockedPassageIds:[...r.unlockedPassageIds,c.id],player:{...r.player,discoveredSecretIds:c.secretId?r.player.discoveredSecretIds.includes(c.secretId)?r.player.discoveredSecretIds:[...r.player.discoveredSecretIds,c.secretId]:r.player.discoveredSecretIds}},s=c.id,a=c.kind==="thornWall"?"thorn-open":"secret-found"),c.kind==="decayBarrier"&&!r.player.revealedBarrierIds.includes(c.id)&&t==="lemon"&&_u(c,r.player,!0)&&(i.push(c.id),r={...r,player:{...r.player,revealedBarrierIds:[...r.player.revealedBarrierIds,c.id]}},a="decay-reveal"));return n.interactables.some(c=>c.kind==="coffeePile"&&Pa(n,c.tile)<=cr)&&t!=="coffee"&&i.length===0&&(a="coffee-profile-required"),n.interactables.some(c=>c.kind==="thornWall"&&Pa(n,c.tile)<=cr)&&t!=="rose"&&!s&&(a=a??"rose-profile-required"),e.silent&&!s&&a!=="decay-reveal"?{...r,player:{...r.player,highlightedIds:i}}:{...r,player:{...r.player,highlightedIds:i},lastFeedback:{...at(),unlockedPassageId:s,message:a??(i.length>0?"scan":"no-matching-pattern")}}}function Qf(){return{moveX:0,moveY:0,attackPressed:!1,scanPressed:!1,interactPressed:!1,pausePressed:!1,selectScentId:null,selectScentIndex:null}}function jf(n){const e=n.difficulty??"standard",t=Fi[e],i=n.map??rf(),r=_n(i.spawn),s=i.interactables.find(c=>c.kind==="checkpoint"),a=Array.from({length:i.width*i.height},()=>!1),o=i.spawn.y*i.width+i.spawn.x;a[o]=!0;const l={seed:n.seed,difficulty:e,map:i,player:{position:{...r},prevPosition:{...r},facing:0,maxHealth:t.maxHealth,health:t.maxHealth,currentCheckpointId:(s==null?void 0:s.id)??"spawn",learnedOdorIds:[],collectedModules:[],openedChestIds:[],defeatedEnemyIds:[],discoveredSecretIds:[],solvedPuzzleIds:[],revealedBarrierIds:[],restoredSealIds:[],activeScentProfileId:null,highlightedIds:[],searchedPileIds:[],foundClueIds:[],discoveredCheckpointIds:s?[s.id]:[],explored:a,inspectedExit:!1,exitPatternSolved:!1,inventory:xf(t.startingScanCharges),scan:{active:!1,remainingMs:0,cooldownRemainingMs:0},invulnerableUntilMs:0,attackCooldownUntilMs:0},enemies:Uf(i,n.seed,e),interactables:i.interactables,openDoorIds:[],unlockedPassageIds:[],elapsedMs:0,phase:"playing",activePuzzle:null,lastFeedback:at()};return Su(l,2.2)}function ep(n){return mr(n.map,n.unlockedPassageIds)}function tp(n,e){const t={...n.player.scan};return t.active?(t.remainingMs=Math.max(0,t.remainingMs-e),t.remainingMs<=0&&(t.active=!1,t.remainingMs=0,t.cooldownRemainingMs=Fi[n.difficulty].scanCooldownMs)):t.cooldownRemainingMs>0&&(t.cooldownRemainingMs=Math.max(0,t.cooldownRemainingMs-e)),{...n,player:{...n.player,scan:t}}}function np(n){if(n.player.scan.active||n.player.scan.cooldownRemainingMs>0)return n;if(!Sf(n.player.inventory))return{...n,lastFeedback:{...at(),message:"no-scan-charge"}};const e=bf(n.player.inventory);if(!e)return n;const t={...n,player:{...n.player,inventory:e,scan:{active:!0,remainingMs:sf,cooldownRemainingMs:0}},lastFeedback:{...at(),message:"scan"}};return Eu(t)}function wu(n,e){return Math.floor(n.x)===e.x&&Math.floor(n.y)===e.y}function ip(n){const e=n.interactables.find(i=>i.kind==="checkpoint"&&wu(n.player.position,i.tile));if(!e)return n;const t=n.player.discoveredCheckpointIds.includes(e.id)?n.player.discoveredCheckpointIds:[...n.player.discoveredCheckpointIds,e.id];return e.id===n.player.currentCheckpointId&&t===n.player.discoveredCheckpointIds?n:{...n,player:{...n.player,currentCheckpointId:e.id,discoveredCheckpointIds:t}}}function rp(n){const e=n.interactables.find(t=>t.kind==="exit");return!e||!wu(n.player.position,e.tile)?n:{...n,phase:"victory",lastFeedback:{...at(),message:"exit"}}}function sp(n,e){if(e.selectScentId)return Ro(n,e.selectScentId);if(e.selectScentIndex!=null&&e.selectScentIndex>=0){const t=n.player.learnedOdorIds[e.selectScentIndex]??null;return Ro(n,t)}return n}function Ac(n,e,t){var s;if(n.phase==="puzzle"){if(e.pausePressed)return{...n,phase:"playing",activePuzzle:null};const a={...n,elapsedMs:n.elapsedMs+t};return((s=a.activePuzzle)==null?void 0:s.kind)==="skillCheck"?xu(a,e,t):a}if(e.pausePressed&&n.phase!=="victory")return{...n,phase:n.phase==="paused"?"playing":"paused",player:{...n.player,prevPosition:{...n.player.position}}};if(n.phase!=="playing"||t<=0)return{...n,player:{...n.player,prevPosition:{...n.player.position}}};let i={...n,elapsedMs:n.elapsedMs+t,lastFeedback:at(),player:{...n.player,prevPosition:{...n.player.position}}};i=sp(i,e),e.scanPressed&&(i=np(i)),i=tp(i,t);const r=Math.hypot(e.moveX,e.moveY);if(r>.001){const a=e.moveX/r,o=e.moveY/r;i={...i,player:{...i.player,facing:Math.atan2(o,a)}};const l=ep(i),c=new Map(l.doors.map(u=>[u.id,i.openDoorIds.includes(u.id)])),d=mu(l,i.player.position,{x:a*xc*(t/1e3),y:o*xc*(t/1e3)},du,c);i={...i,player:{...i.player,position:d.position}},i.player.scan.active&&(i=Eu(i,{silent:!0}))}return i=Su(i),i={...i,openDoorIds:Sc(i)},i=ip(i),e.attackPressed&&(i=Cf(i,Fi[i.difficulty].attackOmni)),e.interactPressed&&(i=$f(i)),i=kf(i,t/1e3),i=Df(i),i={...i,openDoorIds:Sc(i)},i=rp(i),i}const ap=24e4;function op(n){const e=n.player.health*20,t=n.player.collectedModules.length*80,i=n.player.learnedOdorIds.length*30,r=n.player.discoveredSecretIds.length*50,s=n.player.defeatedEnemyIds.length*15,a=n.phase==="victory"?Math.max(0,Math.round((ap-n.elapsedMs)/1e3)):0;return{health:e,modules:t,odors:i,secrets:r,defeated:s,timeBonus:a,total:e+t+i+r+s+a}}function La(n,e=document){var t;(t=e.querySelector(`#${n}`))==null||t.showModal()}function lp(n=document){n.querySelectorAll("[data-close]").forEach(e=>{e.addEventListener("click",()=>{var i;const t=e.dataset.close;t&&((i=n.querySelector(`#${t}`))==null||i.close())})})}const cp={KeyW:{x:0,y:-1},KeyS:{x:0,y:1},KeyA:{x:-1,y:0},KeyD:{x:1,y:0},ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};function dp(){const n=new Set;let e=!1,t=!1,i=!1,r=!1,s=!1,a=!1,o=null,l=!1,c={x:0,y:0};const d=f=>{const g=f.target;if(!(g instanceof HTMLInputElement||g instanceof HTMLTextAreaElement)){if(f.code==="Space"&&(f.repeat||(e=!0),f.preventDefault()),f.code==="KeyQ"&&(f.repeat||(t=!0),f.preventDefault()),f.code==="KeyE"&&(f.repeat||(i=!0),f.preventDefault()),f.code==="Escape"&&(f.repeat||(r=!0),f.preventDefault()),f.code==="KeyH"&&(f.repeat||(s=!0),f.preventDefault()),f.code==="Tab"&&(f.repeat||(a=!0),f.preventDefault()),f.code.startsWith("Digit")&&!f.repeat){const v=Number(f.code.slice(5));v>=1&&v<=7&&(o=v-1)}n.add(f.code)}},u=f=>{n.delete(f.code)},h=f=>{const g=f.querySelector("[data-joystick]"),v=f.querySelector("[data-joystick-knob]"),m=f.querySelector("[data-attack-btn]"),p=f.querySelector("[data-scan-btn]"),w=f.querySelector("[data-interact-btn]");if(g&&v){const A=(b,R)=>{const E=g.getBoundingClientRect(),y=E.left+E.width/2,C=E.top+E.height/2;let P=(b-y)/(E.width/2),D=(R-C)/(E.height/2);const U=Math.hypot(P,D);U>1&&(P/=U,D/=U),c={x:P,y:D},v.style.transform=`translate(${P*26}px, ${D*26}px)`},M=()=>{l=!1,c={x:0,y:0},v.style.transform="translate(0,0)"};g.addEventListener("pointerdown",b=>{l=!0,g.setPointerCapture(b.pointerId),A(b.clientX,b.clientY),b.preventDefault()}),g.addEventListener("pointermove",b=>{l&&A(b.clientX,b.clientY)}),g.addEventListener("pointerup",M),g.addEventListener("pointercancel",M)}m==null||m.addEventListener("pointerdown",A=>{e=!0,A.preventDefault()}),p==null||p.addEventListener("pointerdown",A=>{t=!0,A.preventDefault()}),w==null||w.addEventListener("pointerdown",A=>{i=!0,A.preventDefault()})};return{attach(f){window.addEventListener("keydown",d),window.addEventListener("keyup",u),h(f)},detach(){window.removeEventListener("keydown",d),window.removeEventListener("keyup",u),n.clear()},sample(){let f=0,g=0;for(const m of n){const p=cp[m];p&&(f+=p.x,g+=p.y)}l&&(f+=c.x,g+=c.y);const v={moveX:f,moveY:g,attackPressed:e,scanPressed:t,interactPressed:i,pausePressed:r,selectScentId:null,selectScentIndex:o,hintPressed:s,libraryPressed:a};return e=t=i=r=s=a=!1,o=null,v}}}const up=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect x="8" y="14" width="32" height="24" rx="3" fill="#6b4a2a"/>
  <rect x="8" y="14" width="32" height="6" fill="#8a6136"/>
  <path d="M8 26h32M16 14v24M32 14v24" stroke="#3b2d12" stroke-width="1.6"/>
  <rect x="8" y="14" width="32" height="24" rx="3" fill="none" stroke="#3b2d12" stroke-width="1.5"/>
</svg>
`,hp=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <ellipse cx="24" cy="32" rx="13" ry="10" fill="#7a4e28"/>
  <path d="M14 28c2-10 6-16 10-16s8 6 10 16" fill="#8d5a30"/>
  <path d="M18 14h12l-2 6H20l-2-6Z" fill="#cde76d"/>
  <ellipse cx="20" cy="34" rx="1.4" ry="1" fill="#3b2d12"/>
  <ellipse cx="26" cy="31" rx="1.2" ry=".9" fill="#3b2d12"/>
  <ellipse cx="29" cy="35" rx="1" ry=".8" fill="#3b2d12"/>
</svg>
`,fp=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <path d="M10 42c6-10 8-18 6-28 8 4 12 12 10 22" stroke="#2f6b3c" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M22 18c6-4 12-4 16 2" stroke="#3f8a4c" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M18 28l-6-8M28 24l7-5M24 34l5 6" stroke="#5a3a48" stroke-width="2" stroke-linecap="round"/>
  <circle cx="32" cy="16" r="3" fill="#ee7b66"/>
  <circle cx="14" cy="20" r="2.4" fill="#cde76d"/>
</svg>
`,pp=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect x="8" y="10" width="32" height="28" rx="4" fill="#1c2438"/>
  <rect x="11" y="14" width="16" height="8" rx="2" fill="#2a3348"/>
  <rect x="29" y="14" width="8" height="8" rx="2" fill="#7655e8" opacity=".8"/>
  <path d="M12 28h24M12 32h18" stroke="#cde76d" stroke-width="1.6" opacity=".7"/>
  <circle cx="16" cy="36" r="2" fill="#ee7b66"/>
  <circle cx="22" cy="36" r="2" fill="#9b7dff"/>
  <path d="M34 10c4 8 6 16 4 28" stroke="#9b7dff" stroke-width="1.4" opacity=".55"/>
</svg>
`,mp=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <ellipse cx="24" cy="40" rx="12" ry="3" fill="#0b1018" opacity=".4"/>
  <rect x="9" y="22" width="30" height="16" rx="3" fill="#c9a24a"/>
  <path d="M9 22c0-8 6.5-14 15-14s15 6 15 14" fill="#e6c56a"/>
  <rect x="9" y="20" width="30" height="5" fill="#8a6a22"/>
  <circle cx="24" cy="28" r="3.2" fill="#3b2d12"/>
  <rect x="22.6" y="24" width="2.8" height="6" rx="1" fill="#211c2b"/>
</svg>
`,gp=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <ellipse cx="24" cy="40" rx="12" ry="3" fill="#0b1018" opacity=".4"/>
  <rect x="9" y="24" width="30" height="14" rx="3" fill="#c9a24a"/>
  <path d="M10 22c2-12 7-18 14-18 8 0 13 7 14 18" fill="#e6c56a"/>
  <path d="M24 24 38 14" stroke="#f4efe0" stroke-width="2" opacity=".7"/>
  <rect x="16" y="27" width="16" height="6" rx="2" fill="#f4efe0" opacity=".55"/>
</svg>
`,_p=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <ellipse cx="24" cy="40" rx="10" ry="3" fill="#0b1018" opacity=".4"/>
  <ellipse cx="24" cy="26" rx="13" ry="12" fill="#ee7b66"/>
  <ellipse cx="24" cy="22" rx="10" ry="8" fill="#f09a8a"/>
  <circle cx="19" cy="23" r="3.2" fill="#211c2b"/>
  <circle cx="29" cy="23" r="3.2" fill="#211c2b"/>
  <circle cx="20" cy="22" r="1.1" fill="#f4efe0"/>
  <circle cx="30" cy="22" r="1.1" fill="#f4efe0"/>
  <path d="M18 31c2.2 3 8.8 3 12 0" stroke="#211c2b" stroke-width="1.6" fill="none"/>
</svg>
`,vp=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <ellipse cx="24" cy="40" rx="10" ry="3.2" fill="#0b1018" opacity=".45"/>
  <path d="M16 18c0-7 3.6-12 8-12s8 5 8 12c0 4-1.4 9-2.2 12H18.2C17.4 27 16 22 16 18Z" fill="#f4efe0"/>
  <path d="M19 16.5c.4-4 2.4-7.5 5-7.5s4.6 3.5 5 7.5" stroke="#211c2b" stroke-width="1.2"/>
  <rect x="18" y="20" width="12" height="9" rx="3" fill="#7655e8"/>
  <circle cx="24" cy="24.5" r="2.4" fill="#cde76d"/>
  <path d="M20 32h8l1.5 7h-11L20 32Z" fill="#211c2b"/>
  <path d="M29.5 22.5 35 20.5" stroke="#cde76d" stroke-width="2" stroke-linecap="round"/>
</svg>
`,Ue="#cde76d",Bt="#9b7dff",vt="#ee7b66",bt="#e6c56a",Wt="#f4efe0",Ll="#211c2b",yp="#121826",Dl={storage:{floorA:"#2a2218",floorB:"#32281c",wall:"#3a2e24",wallEdge:"#6a4e34",moss:"#4a5a2c",accent:"#8a6136"},greenhouse:{floorA:"#16241e",floorB:"#1c2e24",wall:"#1e382c",wallEdge:"#3f6b48",moss:"#2f6b3c",accent:"#4a8a52"},signal:{floorA:"#161c2c",floorB:"#1a2234",wall:"#242c40",wallEdge:"#4a5a78",moss:"#3a4460",accent:"#7655e8"},atrium:{floorA:"#1c2433",floorB:"#182030",wall:"#243044",wallEdge:"#5a6a90",moss:"#3a4a48",accent:"#e6c56a"},corridor:{floorA:"#1a2030",floorB:"#1c2232",wall:"#222a3c",wallEdge:"#4a5870",moss:"#3a4a40",accent:"#9b7dff"}},Rc={};function ei(n){return`data:image/svg+xml;charset=utf-8,${encodeURIComponent(n)}`}function Mp(n){let e=Rc[n];return e||(e=new Image,e.src=n,Rc[n]=e),e}function Pi(n,e,t,i,r,s=1){const a=Mp(e);!a.complete||a.naturalWidth===0||(n.save(),n.globalAlpha=s,n.drawImage(a,t-r/2,i-r/2,r,r),n.restore())}const mi={crate:ei(up),sack:ei(hp),vine:ei(fp),panel:ei(pp),chestClosed:ei(mp),chestOpen:ei(gp),sporeling:ei(_p),player:ei(vp)};function ra(n,e){const t=Math.sin(n*127.1+e*311.7)*43758.5453;return t-Math.floor(t)}function vn(n,e,t,i,r,s){const a=Math.min(s,i/2,r/2);n.beginPath(),n.moveTo(e+a,t),n.arcTo(e+i,t,e+i,t+r,a),n.arcTo(e+i,t+r,e,t+r,a),n.arcTo(e,t+r,e,t,a),n.arcTo(e,t,e+i,t,a),n.closePath()}function hn(n,e,t,i,r,s){const a=n.createRadialGradient(e,t,1,e,t,i);a.addColorStop(0,r),a.addColorStop(1,"rgba(0,0,0,0)"),n.globalAlpha=s,n.fillStyle=a,n.beginPath(),n.arc(e,t,i,0,Math.PI*2),n.fill(),n.globalAlpha=1}function yi(n,e,t,i,r,s=.35){n.fillStyle=`rgba(8,10,16,${s})`,n.beginPath(),n.ellipse(e,t+r*.9,i,r*.45,0,0,Math.PI*2),n.fill()}function Co(n,e){const t=parseInt(n.slice(1),16),i=Math.round((t>>16&255)*e),r=Math.round((t>>8&255)*e),s=Math.round((t&255)*e);return`rgb(${i},${r},${s})`}function xp(n,e,t,i,r,s,a,o,l){const c=Dl[r],d=(s+a)%2===0;n.fillStyle=l?d?"#243044":"#1a2434":Co(d?c.floorA:c.floorB,.45+o*.55),n.fillRect(e,t,i,i),n.strokeStyle=`rgba(70,90,120,${.1*o})`,n.strokeRect(e+.5,t+.5,i-1,i-1);const u=ra(s,a);n.fillStyle=c.moss,n.globalAlpha=.18*o;for(let h=0;h<4;h+=1){const f=e+u*(11+h*7)%1*i,g=t+u*(19+h*5)%1*i;n.beginPath(),n.arc(f,g,i*.04,0,Math.PI*2),n.fill()}n.globalAlpha=1,r==="storage"&&u>.72&&(n.fillStyle="#5a3a18",n.globalAlpha=.55*o,n.beginPath(),n.ellipse(e+i*.3,t+i*.62,i*.05,i*.03,.4,0,Math.PI*2),n.fill(),n.globalAlpha=1),r==="greenhouse"&&u>.65&&(n.strokeStyle=c.moss,n.globalAlpha=.35*o,n.lineWidth=1.4,n.beginPath(),n.moveTo(e+i*.1,t+i),n.quadraticCurveTo(e+i*.4,t+i*.4,e+i*.7,t+i*.85),n.stroke(),n.globalAlpha=1),r==="signal"&&u>.8&&(n.fillStyle=Bt,n.globalAlpha=.22*o,n.fillRect(e,t+i*.45,i,2),n.globalAlpha=1)}function bp(n,e,t,i,r,s,a,o,l,c){const d=Dl[r];n.fillStyle=l?"#07090d":Co(d.wall,.5+o*.5),vn(n,e+1,t+1,i-2,i-2,5),n.fill(),n.strokeStyle=Co(d.wallEdge,o),n.lineWidth=1.2,n.stroke(),c.n||(n.fillStyle=`rgba(244,239,224,${.08*o})`,n.fillRect(e+4,t+3,i-8,3)),r==="greenhouse"&&(n.strokeStyle=d.moss,n.globalAlpha=.55*o,n.lineWidth=2,n.beginPath(),n.moveTo(e+i*.2,t+i-2),n.quadraticCurveTo(e+i*.5,t+i*.2,e+i*.85,t+i*.7),n.stroke(),n.globalAlpha=1),r==="signal"&&ra(s,a)>.55&&(n.fillStyle=Ue,n.globalAlpha=.25+.2*Math.sin(s+a),n.fillRect(e+3,t+i*.3,i-6,2),n.globalAlpha=1),r==="storage"&&ra(s+3,a)>.7&&(n.fillStyle=d.accent,n.globalAlpha=.35*o,n.fillRect(e+i*.2,t+i*.35,i*.6,i*.18),n.globalAlpha=1)}function Sp(n,e,t,i,r,s,a,o,l){if(l)return;const c=ra(s*1.7,a*2.1);r==="storage"&&(c>.82?Pi(n,mi.crate,e+i*.5,t+i*.55,i*.55,.55*o):c>.7&&Pi(n,mi.sack,e+i*.55,t+i*.6,i*.5,.5*o)),r==="greenhouse"&&c>.78&&(Pi(n,mi.vine,e+i*.5,t+i*.5,i*.7,.45*o),c>.9&&(n.fillStyle=vt,n.globalAlpha=.5*o,n.beginPath(),n.arc(e+i*.62,t+i*.32,i*.06,0,Math.PI*2),n.fill(),n.globalAlpha=1)),r==="signal"&&c>.8&&Pi(n,mi.panel,e+i*.5,t+i*.5,i*.58,.45*o)}function Tp(n,e,t,i,r,s){n.save(),n.translate(e,t);const a=i*.16;if(!s||!r){n.fillStyle=Wt,n.font=`700 ${Math.round(i*.28)}px ui-sans-serif`,n.textAlign="center",n.textBaseline="middle",n.fillText("?",0,1),n.restore();return}n.strokeStyle=Wt,n.fillStyle=Ue,n.lineWidth=1.6,r==="coffee"?(n.fillStyle="#8b5a2b",n.beginPath(),n.ellipse(0,0,a,a*.7,.4,0,Math.PI*2),n.fill()):r==="rose"?(n.fillStyle=vt,n.beginPath(),n.arc(0,0,a,0,Math.PI*2),n.fill()):r==="mint"?(n.strokeStyle=Ue,n.beginPath(),n.moveTo(0,-a),n.quadraticCurveTo(a,0,0,a),n.quadraticCurveTo(-a,0,0,-a),n.stroke()):r==="lemon"?(n.fillStyle=Ue,n.beginPath(),n.ellipse(0,0,a*.9,a*1.15,0,0,Math.PI*2),n.fill()):r==="pine"?(n.fillStyle="#3f8a4c",n.beginPath(),n.moveTo(0,-a),n.lineTo(a,a),n.lineTo(-a,a),n.fill()):r==="banana"?(n.strokeStyle=bt,n.lineWidth=3,n.beginPath(),n.arc(0,0,a,.2,2.6),n.stroke()):(n.fillStyle=vt,n.beginPath(),n.arc(0,0,a*.8,0,Math.PI*2),n.fill()),n.restore()}function Ep(n,e,t,i,r,s,a,o,l,c){const d=c?0:Math.sin(s/(a?90:420))*(a?2.2:1.1);n.save(),n.translate(e,t+d),n.rotate(r),o&&(n.globalAlpha=.45+.35*Math.abs(Math.sin(s/70))),yi(n,0,i*.12,i*.16,i*.1,.4),n.fillStyle=l?"#fff":Wt,vn(n,-i*.14,-i*.18,i*.28,i*.3,6),n.fill(),n.fillStyle=Bt,vn(n,-i*.1,-i*.04,i*.2,i*.14,4),n.fill(),n.fillStyle=Ue,n.beginPath(),n.arc(i*.02,.02*i,i*.05,0,Math.PI*2),n.fill(),n.fillStyle=Ll,n.fillRect(-i*.12,i*.1,i*.08,i*.1),n.fillRect(i*.04,i*.1,i*.08,i*.1),n.fillStyle=Ue,n.beginPath(),n.moveTo(i*.18,0),n.lineTo(i*.08,-5),n.lineTo(i*.08,5),n.fill(),Pi(n,mi.player,0,-i*.02,i*.85,l?.35:.92),n.restore()}function wp(n,e,t,i,r,s){n.save(),n.translate(e,t),n.rotate(r),n.strokeStyle=`rgba(205,231,109,${.9*(1-s)})`,n.lineWidth=4,n.beginPath(),n.arc(0,0,i*(.28+s*.18),-.9,.9),n.stroke(),n.strokeStyle=`rgba(244,239,224,${.7*(1-s)})`,n.lineWidth=2,n.beginPath(),n.arc(0,0,i*(.22+s*.12),-.7,.7),n.stroke(),n.restore()}function Da(n,e,t,i,r,s,a=0,o=0,l=0){n.save(),n.translate(e+a,t),yi(n,0,i*.12,i*.18,i*.08,.4),n.fillStyle=r?"#6d5a32":bt,vn(n,-i*.18,-i*.02,i*.36,i*.18,4),n.fill(),n.strokeStyle=s?"#fff":"#3b2d12",n.stroke(),n.save(),n.translate(0,-i*.02),n.rotate(-o*1.1),n.fillStyle=r&&o<=0?"#8a6a22":"#e6c56a",vn(n,-i*.18,-i*.16,i*.36,i*.14,4),n.fill(),n.restore(),n.fillStyle="#3b2d12",n.fillRect(-3,-2,6,8),Pi(n,r||o>.4?mi.chestOpen:mi.chestClosed,0,0,i*.7,.95),l>0&&(hn(n,0,-i*.2-l,i*.22,bt,.55),n.fillStyle=bt,n.beginPath(),n.arc(0,-i*.18-l,i*.07,0,Math.PI*2),n.fill()),n.restore()}function Na(n,e,t,i,r,s,a){const o=a?1:1+Math.sin(r/180)*.08;n.save(),n.translate(e,t),n.scale(1+(1-o)*.4,o),yi(n,0,i*.1,i*.16,i*.08,.4),n.fillStyle=s?"#fff":vt,n.beginPath(),n.ellipse(0,0,i*.18,i*.16,0,0,Math.PI*2),n.fill(),n.fillStyle=Ll,n.beginPath(),n.arc(-i*.06,-i*.03,i*.04,0,Math.PI*2),n.arc(i*.06,-i*.03,i*.04,0,Math.PI*2),n.fill(),n.fillStyle=Wt,n.beginPath(),n.arc(-i*.05,-i*.045,i*.015,0,Math.PI*2),n.arc(i*.07,-i*.045,i*.015,0,Math.PI*2),n.fill(),Pi(n,mi.sporeling,0,0,i*.72,s?.4:.95),n.restore()}function Ap(n,e,t,i,r,s,a){const o=s?a?1:.55+.45*Math.min(1,(Math.sin(r/220)+1)/2):.22;n.save(),n.translate(e,t),n.scale(1,o),yi(n,0,i*.08,i*.18,i*.07,.35),n.strokeStyle=s?vt:"#2c4a38",n.lineWidth=i*.07,n.beginPath(),n.moveTo(-i*.18,i*.1),n.quadraticCurveTo(0,-i*.22*o,i*.18,i*.1),n.stroke(),n.fillStyle=s?vt:"#2c4a38",n.beginPath(),n.ellipse(0,-i*.04,i*.1,i*.07,0,0,Math.PI*2),n.fill(),s&&(n.fillStyle=Ll,n.beginPath(),n.arc(-4,-i*.05,2.2,0,Math.PI*2),n.arc(4,-i*.05,2.2,0,Math.PI*2),n.fill()),n.restore()}function Rp(n,e,t,i,r,s,a){const o=a?.7:.45+.55*((Math.sin(r/70)+1)/2);if(hn(n,e,t,i*.32,s?Ue:vt,.35*o),n.fillStyle=s?Wt:vt,n.globalAlpha=.5+.5*o,n.beginPath(),n.arc(e,t,i*.1,0,Math.PI*2),n.fill(),n.globalAlpha=1,!a){for(let l=0;l<5;l+=1){const c=r/180+l;n.fillStyle=s?Ue:vt,n.globalAlpha=.4,n.beginPath(),n.arc(e+Math.cos(c)*i*.18,t+Math.sin(c*1.4)*i*.14,2,0,Math.PI*2),n.fill()}n.globalAlpha=1}}function Cp(n,e,t,i,r,s,a,o,l){const c=l?1:1+Math.sin(r/160+o)*.12,d=s;n.strokeStyle=d?Ue:vt,n.lineWidth=d?4:3,n.beginPath(),n.arc(e,t,i*.2*c,0,Math.PI*2),n.stroke(),n.fillStyle=d?Ue:"rgba(238,123,102,0.4)",n.beginPath(),n.arc(e,t,i*.09*c,0,Math.PI*2),n.fill(),a&&!s&&(n.fillStyle=Wt,n.font=`700 ${Math.round(i*.2)}px ui-sans-serif`,n.textAlign="center",n.fillText("?",e,t-i*.28))}function Ua(n,e,t,i,r,s){const a=s?0:r/40%16;n.save(),n.strokeStyle=Ue,n.lineWidth=2.5,n.setLineDash([6,5]),n.lineDashOffset=-a,n.strokeRect(e-i*.42,t-i*.42,i*.84,i*.84),n.restore()}function Ip(n,e,t,i,r,s){n.save(),n.globalAlpha=1-r,n.strokeStyle=s==="vine"?Ue:Wt,n.lineWidth=2,n.beginPath(),n.moveTo(e-i*.3,t-i*.1),n.lineTo(e+i*.05,t+i*.2),n.lineTo(e+i*.22,t-i*.25),n.stroke(),n.fillStyle=s==="vine"?"#3f6b48":"#2a3348",vn(n,e-i*.4,t-i*.4,i*.8,i*.8,6),n.fill(),n.restore()}const Pp=1100,Lp=900,Dp=700;function Np(){return{particles:[],chests:new Map,dissolves:new Map,deaths:new Map,slashUntil:0,slashFacing:0,hitFlashUntil:0,knockX:0,knockY:0,knockUntil:0,scanTintUntil:0,collectUntil:0,collectOdor:null,collectFrom:null,seenOpened:new Set,seenUnlocked:new Set,seenRevealed:new Set,seenDefeated:new Set,seenLearned:new Set,mimicUntil:new Map,bloomPhaseUntil:new Map}}function Nl(n,e,t){if(!n)return 1;const i=t?280:Pp;return Math.min(1,(e-n.started)/i)}function Ul(n,e,t){if(!n)return 1;const i=t?220:Lp;return Math.min(1,(e-n.started)/i)}function Fl(n,e,t){if(!n)return 1;const i=t?180:Dp;return Math.min(1,(e-n.started)/i)}function ti(n,e,t,i,r,s,a){const o=a?Math.min(4,r):r;for(let l=0;l<o;l+=1){const c=Math.PI*2*l/o+Math.random()*.4,d=.4+Math.random()*1.4;n.particles.push({x:e,y:t,vx:Math.cos(c)*d,vy:Math.sin(c)*d-(s==="gold"?.6:0),life:1,max:.35+Math.random()*.45,color:i,size:s==="scent"?.08:.05+Math.random()*.05,kind:s})}}function Up(n,e,t,i){const r=e.lastFeedback,s=e.player.position.x,a=e.player.position.y;if(r.message==="scan"&&(n.scanTintUntil=t+(i?180:520)),r.learnedOdorId&&!n.seenLearned.has(r.learnedOdorId+e.elapsedMs)){n.seenLearned.add(r.learnedOdorId),n.collectUntil=t+(i?280:900),n.collectOdor=r.learnedOdorId;const l=e.interactables.find(c=>c.odorId===r.learnedOdorId&&c.kind==="odorSample");n.collectFrom=l?{x:l.tile.x+.5,y:l.tile.y+.5}:{x:s,y:a},ti(n,n.collectFrom.x,n.collectFrom.y,"#9b7dff",18,"scent",i)}if(r.openedId&&!n.seenOpened.has(r.openedId)){n.seenOpened.add(r.openedId),n.chests.set(r.openedId,{started:t,phase:"shake"});const l=e.interactables.find(c=>c.id===r.openedId);l&&ti(n,l.tile.x+.5,l.tile.y+.5,"#e6c56a",14,"gold",i)}if(r.unlockedPassageId&&!n.seenUnlocked.has(r.unlockedPassageId)){n.seenUnlocked.add(r.unlockedPassageId);const l=e.interactables.find(c=>c.id===r.unlockedPassageId);l&&(n.dissolves.set(r.unlockedPassageId,{started:t,kind:l.kind==="thornWall"||l.kind==="decayBarrier"?"vine":"wall",tileX:l.tile.x,tileY:l.tile.y}),ti(n,l.tile.x+.5,l.tile.y+.5,"#cde76d",16,"dust",i))}if(r.message==="decay-reveal")for(const l of e.interactables)l.kind==="decayBarrier"&&e.player.revealedBarrierIds.includes(l.id)&&(n.seenRevealed.has(l.id)||(n.seenRevealed.add(l.id),n.dissolves.set(l.id,{started:t,kind:"vine",tileX:l.tile.x,tileY:l.tile.y}),ti(n,l.tile.x+.5,l.tile.y+.5,"#3f8a4c",12,"dust",i)));r.playerDamaged&&(n.hitFlashUntil=t+(i?80:220),n.knockUntil=t+(i?80:180),n.knockX=-Math.cos(e.player.facing)*.18,n.knockY=-Math.sin(e.player.facing)*.18);for(const l of r.hitEnemyIds){const c=e.enemies.find(d=>d.id===l);c&&ti(n,c.position.x,c.position.y,"#ee7b66",8,"spark",i)}for(const l of e.enemies)l.defeated&&!n.seenDefeated.has(l.id)&&(n.seenDefeated.add(l.id),n.deaths.set(l.id,{started:t,kind:l.kind,x:l.position.x,y:l.position.y}),ti(n,l.position.x,l.position.y,"#ee7b66",20,"spore",i)),l.kind==="mimicSpore"&&!l.disguised&&!n.mimicUntil.has(l.id)&&n.mimicUntil.set(l.id,t+(i?160:640)),l.kind==="noiseBloom"&&l.phase>=2&&!n.bloomPhaseUntil.has(l.id)&&(n.bloomPhaseUntil.set(l.id,t+(i?200:700)),ti(n,l.position.x,l.position.y,"#9b7dff",16,"spark",i));const o=i?.035:.016;n.particles=n.particles.filter(l=>l.life>0);for(const l of n.particles)l.x+=l.vx*o,l.y+=l.vy*o,l.vy+=(l.kind==="gold"?-.6:.15)*o,l.life-=o/l.max;if(n.collectUntil>t&&n.collectFrom){const l=(n.collectUntil-t)/900;if(!i){ti(n,n.collectFrom.x,n.collectFrom.y,"#9b7dff",1,"scent",!0);const c=n.particles[n.particles.length-1];c&&(c.vx=(s-n.collectFrom.x)*2.4,c.vy=(a-n.collectFrom.y)*2.4)}l<0&&(n.collectFrom=null)}for(const[l,c]of n.chests){const d=Nl(c,t,i);d<.18?c.phase="shake":d<.45?c.phase="lid":d<.7?c.phase="burst":d<1?c.phase="float":c.phase="done",d>=1&&n.chests.delete(l)}for(const[l,c]of n.dissolves)Ul(c,t,i)>=1&&n.dissolves.delete(l);for(const[l,c]of n.deaths)Fl(c,t,i)>=1&&n.deaths.delete(l)}function Fp(n,e,t,i){n.slashUntil=t+(i?90:220),n.slashFacing=e}function Au(n,e){return e<n.slashUntil}const ps={greenhouse:{x:.5,y:.16,label:"GREENHOUSE"},storage:{x:.14,y:.5,label:"STORAGE"},atrium:{x:.5,y:.5,label:"CENTRAL"},signal:{x:.86,y:.5,label:"SIGNAL LAB"},exit:{x:.5,y:.86,label:"EXIT"}},Op=[["greenhouse","atrium"],["storage","atrium"],["signal","atrium"],["atrium","exit"]];function kp(n){const e=new Set,t=n.map.width;for(let i=0;i<n.map.height;i+=1)for(let r=0;r<t;r+=1){if(!n.player.explored[i*t+r])continue;const s=pn(r,i);s==="corridor"?e.add("atrium"):e.add(s),r===n.map.exitTile.x&&i===n.map.exitTile.y&&e.add("exit")}return e.has("atrium")&&e.add("exit"),e}function Cc(n){const e=pn(Math.floor(n.player.position.x),Math.floor(n.player.position.y));return e==="storage"||e==="greenhouse"||e==="signal"||e==="atrium"?e:"atrium"}function Bp(n,e){const t=pn(Math.floor(n),Math.floor(e));return t==="storage"||t==="greenhouse"||t==="signal"||t==="atrium"?t:"atrium"}function zp(n,e,t,i,r,s){const a=kp(e),o=Cc(e);n.fillStyle="rgba(12,16,24,0.82)",vn(n,t,i,r,s,12),n.fill(),n.strokeStyle="rgba(205,231,109,0.22)",n.lineWidth=1,n.stroke();const l=u=>t+ps[u].x*r,c=u=>i+ps[u].y*s;n.lineWidth=2;for(const[u,h]of Op){const f=a.has(u)&&a.has(h);n.strokeStyle=f?"rgba(205,231,109,0.55)":"rgba(244,239,224,0.08)",n.beginPath(),n.moveTo(l(u),c(u)),n.lineTo(l(h),c(h)),n.stroke()}for(const u of Object.keys(ps)){const h=a.has(u),f=o===u,g=l(u),v=c(u);n.beginPath(),n.arc(g,v,f?6.5:5,0,Math.PI*2),n.fillStyle=h?u==="exit"?bt:f?Ue:"rgba(244,239,224,0.55)":"rgba(244,239,224,0.12)",n.fill(),f&&(n.strokeStyle=Wt,n.lineWidth=1.5,n.stroke()),h&&(n.fillStyle="rgba(244,239,224,0.78)",n.font="700 8px ui-sans-serif",n.textAlign="center",n.textBaseline="top",n.fillText(ps[u].label,g,v+8))}for(const u of e.interactables){if(Gp(e,u))continue;const h=Bp(u.tile.x,u.tile.y);a.has(h)&&(n.fillStyle=Ue,n.beginPath(),n.arc(l(h)+9,c(h)-6,2.2,0,Math.PI*2),n.fill())}const d=Cc(e);n.fillStyle=Wt,n.beginPath(),n.arc(l(d),c(d),3.2,0,Math.PI*2),n.fill()}function Gp(n,e){return e.kind!=="checkpoint"?!0:!n.player.discoveredCheckpointIds.includes(e.id)}const Fa=46,Hp=2;function Vp(n){const e=n.getContext("2d");if(!e)throw new Error("2d context unavailable");let t=0,i=0,r=1;const s={x:1.5,y:1.5,zoom:1},a=(c,d)=>{t=Math.max(1,Math.floor(c)),i=Math.max(1,Math.floor(d)),r=Math.min(window.devicePixelRatio||1,Hp),n.width=Math.floor(t*r),n.height=Math.floor(i*r),n.style.width=`${t}px`,n.style.height=`${i}px`,e.setTransform(r,0,0,r,0,0)},o=(c,d)=>({x:(c-s.x)*Fa*s.zoom+t/2,y:(d-s.y)*Fa*s.zoom+i/2});return{resize:a,draw:(c,d)=>{const u=mr(c.map,c.unlockedPassageIds),h=Fi[c.difficulty],f=c.player.position.x,g=c.player.position.y,v=d.reducedMotion?1:.18;s.x+=(f-s.x)*v,s.y+=(g-s.y)*v,s.zoom=c.difficulty==="junior"?1.12:1;const m=d.pulseMs,p=d.fx,w=p&&m<p.knockUntil&&!d.reducedMotion?1:0,A=((p==null?void 0:p.knockX)??0)*w,M=((p==null?void 0:p.knockY)??0)*w;e.clearRect(0,0,t,i),e.fillStyle=yp,e.fillRect(0,0,t,i);const b=c.player.scan.active,R=d.lowDarkness?.42:.12,E=Fa*s.zoom,y=new Set(c.interactables.map(I=>`${I.tile.x},${I.tile.y}`));for(let I=0;I<c.map.height;I+=1)for(let L=0;L<c.map.width;L+=1){const z=u.collision[I*c.map.width+L]===!0,K=o(L,I);if(K.x+E<-20||K.y+E<-20||K.x>t+20||K.y>i+20)continue;const Q=d.lowDarkness||b||pu(u,{x:f,y:g},c.player.facing,{x:L+.5,y:I+.5},{haloRadius:d.lowDarkness?2.4:1.15,coneRange:d.lowDarkness?8:5.2})?1:R,se=pn(L,I);if(z){const ce=I>0&&u.collision[(I-1)*c.map.width+L]===!0;L<c.map.width-1&&u.collision[I*c.map.width+L+1],I<c.map.height-1&&u.collision[(I+1)*c.map.width+L],L>0&&u.collision[I*c.map.width+L-1],bp(e,K.x,K.y,E,se,L,I,Q,d.highContrast,{n:ce})}else xp(e,K.x,K.y,E,se,L,I,Q,d.highContrast),Sp(e,K.x,K.y,E,se,L,I,Q,y.has(`${L},${I}`))}const C=new Set(c.openDoorIds);for(const I of c.interactables){const L=o(I.tile.x+.5,I.tile.y+.5),z=c.player.highlightedIds.includes(I.id),K=h.shimmerSecrets&&(I.kind==="hiddenPassage"||I.kind==="hiddenChest")&&!c.unlockedPassageIds.includes(I.id);if(I.kind==="scentTrail"&&Pl(c)&&b&&hn(e,L.x,L.y,E*.55,Ue,I.trailIntensity??.6),I.kind==="noisyField"&&b&&!dr(c)&&hn(e,L.x,L.y,E*.7,vt,.35),I.kind==="chest"||I.kind==="hiddenChest"&&c.unlockedPassageIds.includes(I.id)){const Q=c.player.openedChestIds.includes(I.id),se=p==null?void 0:p.chests.get(I.id),ce=Nl(se,m,d.reducedMotion),Be=(se==null?void 0:se.phase)==="shake"&&!d.reducedMotion?Math.sin(m/18)*3:0,We=se?Math.min(1,Math.max(0,(ce-.18)/.3)):Q?1:0,ze=se&&ce>.45?(ce-.45)*E*.7:0;Da(e,L.x,L.y,E,Q,d.highContrast,Be,We,ze),se&&ce>.45&&ce<.85&&hn(e,L.x,L.y-E*.1,E*.4,bt,.45)}I.kind==="coffeePile"&&Kp(e,L.x,L.y,E,z,!!I.trueTarget),I.kind==="exitSeal"&&Yp(e,L.x,L.y,E,c.player.restoredSealIds.includes(I.sealId??"storage"),m,d.reducedMotion),I.kind==="thornWall"&&!c.unlockedPassageIds.includes(I.id)&&(Zp(e,L.x,L.y,E,z),b&&z&&Ua(e,L.x,L.y,E,m,d.reducedMotion)),I.kind==="modulePedestal"&&Wp(e,L.x,L.y,E,m,d.reducedMotion),I.kind==="odorSample"&&Xp(e,L.x,L.y,E,b,m,d.reducedMotion),I.kind==="checkpoint"&&qp(e,L.x,L.y,E,I.id===c.player.currentCheckpointId),I.kind==="exit"&&$p(e,L.x,L.y,E,c.player.restoredSealIds.length),I.kind==="decayBarrier"&&!C.has(I.id)&&(Qp(e,L.x,L.y,E,b),b&&Ua(e,L.x,L.y,E,m,d.reducedMotion)),I.kind==="scentLock"&&!c.player.solvedPuzzleIds.includes(I.id)&&jp(e,L.x,L.y,E),I.kind==="hiddenPassage"&&!c.unlockedPassageIds.includes(I.id)&&b&&z&&Ua(e,L.x,L.y,E,m,d.reducedMotion),K&&!d.reducedMotion?(e.strokeStyle=bt,e.globalAlpha=.45+(Math.sin(m/280)+1)*.15,e.lineWidth=2,e.strokeRect(L.x-E*.35,L.y-E*.35,E*.7,E*.7),e.globalAlpha=1):K&&(e.strokeStyle=bt,e.globalAlpha=.7,e.strokeRect(L.x-E*.35,L.y-E*.35,E*.7,E*.7),e.globalAlpha=1);const ie=p==null?void 0:p.dissolves.get(I.id);ie&&Ip(e,L.x,L.y,E,Ul(ie,m,d.reducedMotion),ie.kind)}if(b){const I=Tu(c),L=1-c.player.scan.remainingMs/1800;for(const z of I){if(z.falseSignal&&dr(c))continue;const K=o(z.tile.x+.5,z.tile.y+.5),ie=d.reducedMotion?1:Math.min(1,Math.max(0,L*1.4-.1));hn(e,K.x,K.y,E*.42,z.falseSignal?vt:Bt,(z.falseSignal?.3:.55)*ie),e.globalAlpha=ie,Tp(e,K.x,K.y,E,z.odorId,!!(z.classified&&z.odorId)),e.globalAlpha=1}}for(const I of c.enemies){if(I.defeated)continue;const L=o(I.position.x,I.position.y),z=!!(p&&c.lastFeedback.hitEnemyIds.includes(I.id));if(I.kind==="mimicSpore"&&I.disguised){Da(e,L.x,L.y,E,!1,d.highContrast),b&&(e.strokeStyle=vt,e.setLineDash([4,4]),e.lineDashOffset=d.reducedMotion?0:-m/30,e.strokeRect(L.x-14,L.y-14,28,28),e.setLineDash([]));continue}if(I.kind==="mimicSpore"){const K=(p==null?void 0:p.mimicUntil.get(I.id))??0;(K>m&&!d.reducedMotion?(K-m)/640:0)>.4?Da(e,L.x,L.y,E,!1,d.highContrast,Math.sin(m/20)*2):Na(e,L.x,L.y,E,m,z,d.reducedMotion);continue}if(I.kind==="noiseBloom"){const K=c.difficulty==="junior",ie=K||I.revealed||b;for(const[Q,se]of I.coreTiles.entries()){const ce=o(se.x+.5,se.y+.5);Cp(e,ce.x,ce.y,E,m,ie&&(K||Q===I.trueCoreIndex),b,I.phase,d.reducedMotion)}continue}if(I.kind==="vineCrawler")Ap(e,L.x,L.y,E,m,I.revealed||b,d.reducedMotion);else if(I.kind==="noiseWisp"){if(Rp(e,L.x,L.y,E,m,b&&I.revealed,d.reducedMotion),!dr(c)||!b)for(const K of I.falseMarkerTiles){const ie=o(K.x+.5,K.y+.5);e.globalAlpha=d.reducedMotion?.35:.22+.18*Math.sin(m/90+K.x),hn(e,ie.x,ie.y,E*.2,vt,.4),e.fillStyle=vt,e.beginPath(),e.arc(ie.x,ie.y,E*.07,0,Math.PI*2),e.fill(),e.globalAlpha=1}}else Na(e,L.x,L.y,E,m,z,d.reducedMotion)}if(p){for(const I of p.deaths.values()){const L=Fl(I,m,d.reducedMotion),z=o(I.x,I.y);e.globalAlpha=1-L,(I.kind==="sporeling"||I.kind==="mimicSpore")&&Na(e,z.x,z.y,E*(1+L*.4),m,!0,!0),e.globalAlpha=1}for(const I of p.particles){const L=o(I.x,I.y);e.globalAlpha=Math.max(0,I.life),e.fillStyle=I.color,e.beginPath(),e.arc(L.x,L.y,Math.max(1.2,I.size*E*4),0,Math.PI*2),e.fill()}e.globalAlpha=1}const P=o(f+A,g+M),D=Math.hypot(f-c.player.prevPosition.x,g-c.player.prevPosition.y)>.002,U=c.player.invulnerableUntilMs>c.elapsedMs;if(Ep(e,P.x,P.y,E,c.player.facing,m,D,U,!!(p&&m<p.hitFlashUntil),d.reducedMotion),p&&Au(p,m)){const I=1-(p.slashUntil-m)/220;wp(e,P.x,P.y,E,p.slashFacing,d.reducedMotion?.4:I)}const V=va(c);if(V.input!=="none"){const I=V.item?{x:V.item.tile.x+.5,y:V.item.tile.y+.5}:{x:f,y:g},L=o(I.x,I.y);Jp(e,L.x,L.y-E*.42,V.input,E)}if(b||d.nudgeScan){const I=b?1-c.player.scan.remainingMs/1800:m/900%1,L=d.reducedMotion?1:5;for(let z=0;z<L;z+=1){const K=(I+z/L)%1,ie=(.45+K*(b?5.8:2.4))*E,Q=(b?.7:.34)*(1-K);e.beginPath(),e.arc(P.x,P.y,ie,0,Math.PI*2),e.strokeStyle=z%2===0?`rgba(205,231,109,${Q})`:`rgba(155,125,255,${Q})`,e.lineWidth=b?5:3,e.stroke()}b&&!d.reducedMotion&&(e.save(),e.globalCompositeOperation="screen",e.strokeStyle="rgba(155,125,255,0.28)",e.beginPath(),e.arc(P.x+2,P.y,E*(1.4+I*2),0,Math.PI*2),e.stroke(),e.strokeStyle="rgba(205,231,109,0.22)",e.beginPath(),e.arc(P.x-2,P.y,E*(1.2+I*2.1),0,Math.PI*2),e.stroke(),e.restore())}if(d.hintLevel>=2){const I=c.interactables.find(L=>L.kind==="scentTrail");if(I){const L=o(I.tile.x+.5,I.tile.y+.5);hn(e,L.x,L.y,E,Ue,.55)}}if(d.hintLevel>=3){const I=vi(c),L=o(I.tile.x+.5,I.tile.y+.5);e.strokeStyle=bt,e.lineWidth=3,e.beginPath(),e.arc(L.x,L.y,E*.48,0,Math.PI*2),e.stroke()}if(p&&m<p.scanTintUntil&&b){const I=d.reducedMotion?.08:.12;e.fillStyle=`rgba(155,125,255,${I})`,e.fillRect(0,0,t,i),d.reducedMotion||(e.fillStyle="rgba(205,231,109,0.04)",e.fillRect(2,0,t,i))}const J=e.createRadialGradient(t/2,i/2,i*.2,t/2,i/2,i*.72);J.addColorStop(0,"rgba(8,10,18,0)"),J.addColorStop(1,d.lowDarkness?"rgba(8,10,18,0.18)":"rgba(8,10,18,0.46)"),e.fillStyle=J,e.fillRect(0,0,t,i),Ru(e,c,t,i)},camera:s,worldToScreen:o}}function Wp(n,e,t,i,r,s){yi(n,e,t+6,i*.16,i*.08,.4),n.fillStyle="#2a3040",vn(n,e-i*.14,t,i*.28,i*.12,3),n.fill(),n.fillStyle=Bt,n.beginPath(),n.arc(e,t-i*.04,i*.12,0,Math.PI*2),n.fill(),n.strokeStyle=bt,n.stroke(),s||hn(n,e,t-i*.04,i*.22,Bt,.25+.1*Math.sin(r/260))}function Xp(n,e,t,i,r,s,a){yi(n,e,t+4,i*.12,i*.06,.35),n.fillStyle=r?Ue:"#7aa0c4",n.beginPath(),n.arc(e,t,i*.11,0,Math.PI*2),n.fill(),n.strokeStyle=Wt,n.globalAlpha=.5,n.stroke(),n.globalAlpha=1,r&&!a&&hn(n,e,t,i*.28,Bt,.4+.15*Math.sin(s/140))}function qp(n,e,t,i,r){const s=i*.18;n.strokeStyle=r?Ue:"#89a",n.lineWidth=2,n.beginPath(),n.moveTo(e-s*.4,t+s),n.lineTo(e-s*.4,t-s),n.lineTo(e+s,t-s*.4),n.lineTo(e-s*.4,t),n.stroke()}function $p(n,e,t,i,r=0){n.save(),n.strokeStyle=bt,n.lineWidth=3,vn(n,e-i*.28,t-i*.28,i*.56,i*.56,8),n.stroke(),n.fillStyle="rgba(230,197,106,0.12)",n.fill(),n.fillStyle=bt,n.font=`700 ${Math.round(i*.18)}px ui-sans-serif`,n.textAlign="center",n.fillText("X",e,t-2);for(let s=0;s<3;s+=1)n.fillStyle=s<r?bt:"rgba(244,239,224,0.28)",n.beginPath(),n.arc(e-i*.16+s*i*.16,t+i*.18,i*.045,0,Math.PI*2),n.fill();n.restore()}function Kp(n,e,t,i,r,s){yi(n,e,t+6,i*.18,i*.08,.35),n.fillStyle=r?s?Ue:"#8b5a2b":"#6a4420",n.beginPath(),n.ellipse(e,t+4,i*.18,i*.12,0,0,Math.PI*2),n.fill(),n.fillStyle="#3b2d12",n.beginPath(),n.ellipse(e-4,t+2,3,2,.4,0,Math.PI*2),n.ellipse(e+5,t+5,2.5,1.6,-.3,0,Math.PI*2),n.fill(),r&&(n.strokeStyle=s?Ue:Bt,n.lineWidth=2,n.stroke())}function Yp(n,e,t,i,r,s,a){yi(n,e,t+6,i*.14,i*.07,.35),n.strokeStyle=r?bt:"#89a",n.lineWidth=3,n.beginPath(),n.arc(e,t,i*.16,0,Math.PI*2),n.stroke(),n.fillStyle=r?bt:"transparent",n.beginPath(),n.arc(e,t,i*.07,0,Math.PI*2),n.fill(),r&&!a&&hn(n,e,t,i*.28,bt,.3+.1*Math.sin(s/240))}function Zp(n,e,t,i,r){n.strokeStyle=r?Ue:"#5a3a48",n.lineWidth=Math.max(2,i*.07),n.beginPath(),n.moveTo(e-i*.2,t+i*.18),n.lineTo(e,t-i*.2),n.lineTo(e+i*.2,t+i*.18),n.stroke(),n.beginPath(),n.moveTo(e-i*.08,t),n.lineTo(e-i*.18,t-i*.08),n.moveTo(e+i*.08,t),n.lineTo(e+i*.2,t-i*.06),n.stroke()}function Jp(n,e,t,i,r){const s=r*.32,a=r*.22;n.fillStyle="rgba(18,24,36,0.88)",vn(n,e-s/2,t-a/2,s,a,4),n.fill(),n.strokeStyle=Ue,n.stroke(),n.fillStyle=Wt,n.font=`700 ${Math.round(r*.16)}px ui-sans-serif`,n.textAlign="center",n.textBaseline="middle",n.fillText(i,e,t+.5),n.textBaseline="alphabetic"}function Ru(n,e,t,i,r=!0){const a=r?Math.min(176,t*.3):t,o=r?Math.min(148,i*.28):i,l=r?t-a-12:0,c=r?i-o-12:0;zp(n,e,l,c,a,o)}function Qp(n,e,t,i,r){const s=i*.22;n.strokeStyle=r?Ue:"#3f6b48",n.lineWidth=Math.max(2,i*.06),n.beginPath(),n.moveTo(e-s,t+s),n.quadraticCurveTo(e,t-s*1.2,e+s,t+s),n.stroke(),n.beginPath(),n.moveTo(e-s*.4,t+s),n.quadraticCurveTo(e+4,t-s*.4,e+s*.6,t+s*.4),n.stroke(),r&&(n.fillStyle=Ue,n.font=`700 ${Math.round(i*.24)}px ui-sans-serif`,n.textAlign="center",n.fillText("?",e,t-s))}function jp(n,e,t,i){const r=i*.13;n.strokeStyle=Bt,n.lineWidth=Math.max(2,i*.06),n.beginPath(),n.arc(e,t-r*.6,r,Math.PI,0),n.stroke(),n.fillStyle=Bt,vn(n,e-r*1.2,t-r*.5,r*2.4,r*1.6,3),n.fill()}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ol="185",em=0,Ic=1,tm=2,Ys=1,nm=2,Vr=3,Xn=0,Kt=1,An=2,Vn=0,ur=1,Pc=2,Lc=3,Dc=4,im=5,Ri=100,rm=101,sm=102,am=103,om=104,lm=200,cm=201,dm=202,um=203,Io=204,Po=205,hm=206,fm=207,pm=208,mm=209,gm=210,_m=211,vm=212,ym=213,Mm=214,Lo=0,Do=1,No=2,vr=3,Uo=4,Fo=5,Oo=6,ko=7,kl=0,xm=1,bm=2,mn=0,Cu=1,Iu=2,Pu=3,Lu=4,Du=5,Nu=6,Uu=7,Nc="attached",Sm="detached",Fu=300,Ni=301,yr=302,Oa=303,ka=304,ya=306,Mr=1e3,Rn=1001,sa=1002,Dt=1003,Ou=1004,Wr=1005,At=1006,Zs=1007,Gn=1008,Qt=1009,ku=1010,Bu=1011,Zr=1012,Bl=1013,Pn=1014,an=1015,qn=1016,zl=1017,Gl=1018,Jr=1020,zu=35902,Gu=35899,Hu=1021,Vu=1022,on=1023,$n=1026,Li=1027,Hl=1028,Vl=1029,Ui=1030,Wl=1031,Xl=1033,Js=33776,Qs=33777,js=33778,ea=33779,Bo=35840,zo=35841,Go=35842,Ho=35843,Vo=36196,Wo=37492,Xo=37496,qo=37488,$o=37489,aa=37490,Ko=37491,Yo=37808,Zo=37809,Jo=37810,Qo=37811,jo=37812,el=37813,tl=37814,nl=37815,il=37816,rl=37817,sl=37818,al=37819,ol=37820,ll=37821,cl=36492,dl=36494,ul=36495,hl=36283,fl=36284,oa=36285,pl=36286,Qr=2300,jr=2301,Ba=2302,Uc=2303,Fc=2400,Oc=2401,kc=2402,Tm=2500,Em=0,Wu=1,ml=2,wm=3200,la=0,Am=1,pi="",Pt="srgb",en="srgb-linear",ca="linear",nt="srgb",Gi=7680,Bc=519,Rm=512,Cm=513,Im=514,ql=515,Pm=516,Lm=517,$l=518,Dm=519,gl=35044,zc=35048,Gc="300 es",Cn=2e3,es=2001;function Nm(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Um(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function ts(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Fm(){const n=ts("canvas");return n.style.display="block",n}const Hc={};function da(...n){const e="THREE."+n.shift();console.log(e,...n)}function Xu(n){const e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ae(...n){n=Xu(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Oe(...n){n=Xu(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function hr(...n){const e=n.join(" ");e in Hc||(Hc[e]=!0,Ae(...n))}function Om(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}const km={[Lo]:Do,[No]:Oo,[Uo]:ko,[vr]:Fo,[Do]:Lo,[Oo]:No,[ko]:Uo,[Fo]:vr};class Oi{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Ht=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Vc=1234567;const $r=Math.PI/180,xr=180/Math.PI;function gn(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ht[n&255]+Ht[n>>8&255]+Ht[n>>16&255]+Ht[n>>24&255]+"-"+Ht[e&255]+Ht[e>>8&255]+"-"+Ht[e>>16&15|64]+Ht[e>>24&255]+"-"+Ht[t&63|128]+Ht[t>>8&255]+"-"+Ht[t>>16&255]+Ht[t>>24&255]+Ht[i&255]+Ht[i>>8&255]+Ht[i>>16&255]+Ht[i>>24&255]).toLowerCase()}function Ze(n,e,t){return Math.max(e,Math.min(t,n))}function Kl(n,e){return(n%e+e)%e}function Bm(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function zm(n,e,t){return n!==e?(t-n)/(e-n):0}function Kr(n,e,t){return(1-t)*n+t*e}function Gm(n,e,t,i){return Kr(n,e,1-Math.exp(-t*i))}function Hm(n,e=1){return e-Math.abs(Kl(n,e*2)-e)}function Vm(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function Wm(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function Xm(n,e){return n+Math.floor(Math.random()*(e-n+1))}function qm(n,e){return n+Math.random()*(e-n)}function $m(n){return n*(.5-Math.random())}function Km(n){n!==void 0&&(Vc=n);let e=Vc+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Ym(n){return n*$r}function Zm(n){return n*xr}function Jm(n){return(n&n-1)===0&&n!==0}function Qm(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function jm(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function eg(n,e,t,i,r){const s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+i)/2),d=a((e+i)/2),u=s((e-i)/2),h=a((e-i)/2),f=s((i-e)/2),g=a((i-e)/2);switch(r){case"XYX":n.set(o*d,l*u,l*h,o*c);break;case"YZY":n.set(l*h,o*d,l*u,o*c);break;case"ZXZ":n.set(l*u,l*h,o*d,o*c);break;case"XZX":n.set(o*d,l*g,l*f,o*c);break;case"YXY":n.set(l*f,o*d,l*g,o*c);break;case"ZYZ":n.set(l*g,l*f,o*d,o*c);break;default:Ae("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function fn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function it(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const tg={DEG2RAD:$r,RAD2DEG:xr,generateUUID:gn,clamp:Ze,euclideanModulo:Kl,mapLinear:Bm,inverseLerp:zm,lerp:Kr,damp:Gm,pingpong:Hm,smoothstep:Vm,smootherstep:Wm,randInt:Xm,randFloat:qm,randFloatSpread:$m,seededRandom:Km,degToRad:Ym,radToDeg:Zm,isPowerOfTwo:Jm,ceilPowerOfTwo:Qm,floorPowerOfTwo:jm,setQuaternionFromProperEuler:eg,normalize:it,denormalize:fn},ac=class ac{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Ze(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};ac.prototype.isVector2=!0;let ke=ac;class Yn{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let l=i[r+0],c=i[r+1],d=i[r+2],u=i[r+3],h=s[a+0],f=s[a+1],g=s[a+2],v=s[a+3];if(u!==v||l!==h||c!==f||d!==g){let m=l*h+c*f+d*g+u*v;m<0&&(h=-h,f=-f,g=-g,v=-v,m=-m);let p=1-o;if(m<.9995){const w=Math.acos(m),A=Math.sin(w);p=Math.sin(p*w)/A,o=Math.sin(o*w)/A,l=l*p+h*o,c=c*p+f*o,d=d*p+g*o,u=u*p+v*o}else{l=l*p+h*o,c=c*p+f*o,d=d*p+g*o,u=u*p+v*o;const w=1/Math.sqrt(l*l+c*c+d*d+u*u);l*=w,c*=w,d*=w,u*=w}}e[t]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,r,s,a){const o=i[r],l=i[r+1],c=i[r+2],d=i[r+3],u=s[a],h=s[a+1],f=s[a+2],g=s[a+3];return e[t]=o*g+d*u+l*f-c*h,e[t+1]=l*g+d*h+c*u-o*f,e[t+2]=c*g+d*f+o*h-l*u,e[t+3]=d*g-o*u-l*h-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),d=o(r/2),u=o(s/2),h=l(i/2),f=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=h*d*u+c*f*g,this._y=c*f*u-h*d*g,this._z=c*d*g+h*f*u,this._w=c*d*u-h*f*g;break;case"YXZ":this._x=h*d*u+c*f*g,this._y=c*f*u-h*d*g,this._z=c*d*g-h*f*u,this._w=c*d*u+h*f*g;break;case"ZXY":this._x=h*d*u-c*f*g,this._y=c*f*u+h*d*g,this._z=c*d*g+h*f*u,this._w=c*d*u-h*f*g;break;case"ZYX":this._x=h*d*u-c*f*g,this._y=c*f*u+h*d*g,this._z=c*d*g-h*f*u,this._w=c*d*u+h*f*g;break;case"YZX":this._x=h*d*u+c*f*g,this._y=c*f*u+h*d*g,this._z=c*d*g-h*f*u,this._w=c*d*u-h*f*g;break;case"XZY":this._x=h*d*u-c*f*g,this._y=c*f*u-h*d*g,this._z=c*d*g+h*f*u,this._w=c*d*u+h*f*g;break;default:Ae("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],d=t[6],u=t[10],h=i+o+u;if(h>0){const f=.5/Math.sqrt(h+1);this._w=.25/f,this._x=(d-l)*f,this._y=(s-c)*f,this._z=(a-r)*f}else if(i>o&&i>u){const f=2*Math.sqrt(1+i-o-u);this._w=(d-l)/f,this._x=.25*f,this._y=(r+a)/f,this._z=(s+c)/f}else if(o>u){const f=2*Math.sqrt(1+o-i-u);this._w=(s-c)/f,this._x=(r+a)/f,this._y=.25*f,this._z=(l+d)/f}else{const f=2*Math.sqrt(1+u-i-o);this._w=(a-r)/f,this._x=(s+c)/f,this._y=(l+d)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ze(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,d=t._w;return this._x=i*d+a*o+r*c-s*l,this._y=r*d+a*l+s*o-i*c,this._z=s*d+a*c+i*l-r*o,this._w=a*d-i*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),d=Math.sin(c);l=Math.sin(l*c)/d,t=Math.sin(t*c)/d,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const oc=class oc{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Wc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Wc.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*i),d=2*(o*t-s*r),u=2*(s*i-a*t);return this.x=t+l*c+a*u-o*d,this.y=i+l*d+o*c-s*u,this.z=r+l*u+s*d-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this.z=Ze(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this.z=Ze(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return za.copy(this).projectOnVector(e),this.sub(za)}reflect(e){return this.sub(za.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Ze(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};oc.prototype.isVector3=!0;let O=oc;const za=new O,Wc=new Yn,lc=class lc{constructor(e,t,i,r,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c)}set(e,t,i,r,s,a,o,l,c){const d=this.elements;return d[0]=e,d[1]=r,d[2]=o,d[3]=t,d[4]=s,d[5]=l,d[6]=i,d[7]=a,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],d=i[4],u=i[7],h=i[2],f=i[5],g=i[8],v=r[0],m=r[3],p=r[6],w=r[1],A=r[4],M=r[7],b=r[2],R=r[5],E=r[8];return s[0]=a*v+o*w+l*b,s[3]=a*m+o*A+l*R,s[6]=a*p+o*M+l*E,s[1]=c*v+d*w+u*b,s[4]=c*m+d*A+u*R,s[7]=c*p+d*M+u*E,s[2]=h*v+f*w+g*b,s[5]=h*m+f*A+g*R,s[8]=h*p+f*M+g*E,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8];return t*a*d-t*o*c-i*s*d+i*o*l+r*s*c-r*a*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],u=d*a-o*c,h=o*l-d*s,f=c*s-a*l,g=t*u+i*h+r*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/g;return e[0]=u*v,e[1]=(r*c-d*i)*v,e[2]=(o*i-r*a)*v,e[3]=h*v,e[4]=(d*t-r*l)*v,e[5]=(r*s-o*t)*v,e[6]=f*v,e[7]=(i*l-c*t)*v,e[8]=(a*t-i*s)*v,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return hr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ga.makeScale(e,t)),this}rotate(e){return hr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ga.makeRotation(-e)),this}translate(e,t){return hr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ga.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};lc.prototype.isMatrix3=!0;let Ge=lc;const Ga=new Ge,Xc=new Ge().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),qc=new Ge().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function ng(){const n={enabled:!0,workingColorSpace:en,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===nt&&(r.r=Wn(r.r),r.g=Wn(r.g),r.b=Wn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===nt&&(r.r=fr(r.r),r.g=fr(r.g),r.b=fr(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===pi?ca:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return hr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return hr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[en]:{primaries:e,whitePoint:i,transfer:ca,toXYZ:Xc,fromXYZ:qc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Pt},outputColorSpaceConfig:{drawingBufferColorSpace:Pt}},[Pt]:{primaries:e,whitePoint:i,transfer:nt,toXYZ:Xc,fromXYZ:qc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Pt}}}),n}const Ye=ng();function Wn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function fr(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Hi;class ig{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Hi===void 0&&(Hi=ts("canvas")),Hi.width=e.width,Hi.height=e.height;const r=Hi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Hi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=ts("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Wn(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Wn(t[i]/255)*255):t[i]=Wn(t[i]);return{data:t,width:e.width,height:e.height}}else return Ae("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let rg=0;class Yl{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:rg++}),this.uuid=gn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(Ha(r[a].image)):s.push(Ha(r[a]))}else s=Ha(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function Ha(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?ig.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ae("Texture: Unable to serialize Texture."),{})}let sg=0;const Va=new O;class Nt extends Oi{constructor(e=Nt.DEFAULT_IMAGE,t=Nt.DEFAULT_MAPPING,i=Rn,r=Rn,s=At,a=Gn,o=on,l=Qt,c=Nt.DEFAULT_ANISOTROPY,d=pi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:sg++}),this.uuid=gn(),this.name="",this.source=new Yl(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ke(0,0),this.repeat=new ke(1,1),this.center=new ke(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ge,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Va).x}get height(){return this.source.getSize(Va).y}get depth(){return this.source.getSize(Va).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){Ae(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ae(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Fu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Mr:e.x=e.x-Math.floor(e.x);break;case Rn:e.x=e.x<0?0:1;break;case sa:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Mr:e.y=e.y-Math.floor(e.y);break;case Rn:e.y=e.y<0?0:1;break;case sa:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Nt.DEFAULT_IMAGE=null;Nt.DEFAULT_MAPPING=Fu;Nt.DEFAULT_ANISOTROPY=1;const cc=class cc{constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const l=e.elements,c=l[0],d=l[4],u=l[8],h=l[1],f=l[5],g=l[9],v=l[2],m=l[6],p=l[10];if(Math.abs(d-h)<.01&&Math.abs(u-v)<.01&&Math.abs(g-m)<.01){if(Math.abs(d+h)<.1&&Math.abs(u+v)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const A=(c+1)/2,M=(f+1)/2,b=(p+1)/2,R=(d+h)/4,E=(u+v)/4,y=(g+m)/4;return A>M&&A>b?A<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(A),r=R/i,s=E/i):M>b?M<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(M),i=R/r,s=y/r):b<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(b),i=E/s,r=y/s),this.set(i,r,s,t),this}let w=Math.sqrt((m-g)*(m-g)+(u-v)*(u-v)+(h-d)*(h-d));return Math.abs(w)<.001&&(w=1),this.x=(m-g)/w,this.y=(u-v)/w,this.z=(h-d)/w,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this.z=Ze(this.z,e.z,t.z),this.w=Ze(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this.z=Ze(this.z,e,t),this.w=Ze(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};cc.prototype.isVector4=!0;let ot=cc;class ag extends Oi{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:At,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new ot(0,0,e,t),this.scissorTest=!1,this.viewport=new ot(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:i.depth},s=new Nt(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:At,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new Yl(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class In extends ag{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class qu extends Nt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class og extends Nt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const ga=class ga{constructor(e,t,i,r,s,a,o,l,c,d,u,h,f,g,v,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c,d,u,h,f,g,v,m)}set(e,t,i,r,s,a,o,l,c,d,u,h,f,g,v,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=d,p[10]=u,p[14]=h,p[3]=f,p[7]=g,p[11]=v,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ga().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,i=e.elements,r=1/Vi.setFromMatrixColumn(e,0).length(),s=1/Vi.setFromMatrixColumn(e,1).length(),a=1/Vi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),d=Math.cos(s),u=Math.sin(s);if(e.order==="XYZ"){const h=a*d,f=a*u,g=o*d,v=o*u;t[0]=l*d,t[4]=-l*u,t[8]=c,t[1]=f+g*c,t[5]=h-v*c,t[9]=-o*l,t[2]=v-h*c,t[6]=g+f*c,t[10]=a*l}else if(e.order==="YXZ"){const h=l*d,f=l*u,g=c*d,v=c*u;t[0]=h+v*o,t[4]=g*o-f,t[8]=a*c,t[1]=a*u,t[5]=a*d,t[9]=-o,t[2]=f*o-g,t[6]=v+h*o,t[10]=a*l}else if(e.order==="ZXY"){const h=l*d,f=l*u,g=c*d,v=c*u;t[0]=h-v*o,t[4]=-a*u,t[8]=g+f*o,t[1]=f+g*o,t[5]=a*d,t[9]=v-h*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const h=a*d,f=a*u,g=o*d,v=o*u;t[0]=l*d,t[4]=g*c-f,t[8]=h*c+v,t[1]=l*u,t[5]=v*c+h,t[9]=f*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const h=a*l,f=a*c,g=o*l,v=o*c;t[0]=l*d,t[4]=v-h*u,t[8]=g*u+f,t[1]=u,t[5]=a*d,t[9]=-o*d,t[2]=-c*d,t[6]=f*u+g,t[10]=h-v*u}else if(e.order==="XZY"){const h=a*l,f=a*c,g=o*l,v=o*c;t[0]=l*d,t[4]=-u,t[8]=c*d,t[1]=h*u+v,t[5]=a*d,t[9]=f*u-g,t[2]=g*u-f,t[6]=o*d,t[10]=v*u+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(lg,e,cg)}lookAt(e,t,i){const r=this.elements;return Zt.subVectors(e,t),Zt.lengthSq()===0&&(Zt.z=1),Zt.normalize(),ni.crossVectors(i,Zt),ni.lengthSq()===0&&(Math.abs(i.z)===1?Zt.x+=1e-4:Zt.z+=1e-4,Zt.normalize(),ni.crossVectors(i,Zt)),ni.normalize(),ms.crossVectors(Zt,ni),r[0]=ni.x,r[4]=ms.x,r[8]=Zt.x,r[1]=ni.y,r[5]=ms.y,r[9]=Zt.y,r[2]=ni.z,r[6]=ms.z,r[10]=Zt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],d=i[1],u=i[5],h=i[9],f=i[13],g=i[2],v=i[6],m=i[10],p=i[14],w=i[3],A=i[7],M=i[11],b=i[15],R=r[0],E=r[4],y=r[8],C=r[12],P=r[1],D=r[5],U=r[9],V=r[13],J=r[2],I=r[6],L=r[10],z=r[14],K=r[3],ie=r[7],Q=r[11],se=r[15];return s[0]=a*R+o*P+l*J+c*K,s[4]=a*E+o*D+l*I+c*ie,s[8]=a*y+o*U+l*L+c*Q,s[12]=a*C+o*V+l*z+c*se,s[1]=d*R+u*P+h*J+f*K,s[5]=d*E+u*D+h*I+f*ie,s[9]=d*y+u*U+h*L+f*Q,s[13]=d*C+u*V+h*z+f*se,s[2]=g*R+v*P+m*J+p*K,s[6]=g*E+v*D+m*I+p*ie,s[10]=g*y+v*U+m*L+p*Q,s[14]=g*C+v*V+m*z+p*se,s[3]=w*R+A*P+M*J+b*K,s[7]=w*E+A*D+M*I+b*ie,s[11]=w*y+A*U+M*L+b*Q,s[15]=w*C+A*V+M*z+b*se,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],d=e[2],u=e[6],h=e[10],f=e[14],g=e[3],v=e[7],m=e[11],p=e[15],w=l*f-c*h,A=o*f-c*u,M=o*h-l*u,b=a*f-c*d,R=a*h-l*d,E=a*u-o*d;return t*(v*w-m*A+p*M)-i*(g*w-m*b+p*R)+r*(g*A-v*b+p*E)-s*(g*M-v*R+m*E)}determinantAffine(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[1],a=e[5],o=e[9],l=e[2],c=e[6],d=e[10];return t*(a*d-o*c)-i*(s*d-o*l)+r*(s*c-a*l)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],u=e[9],h=e[10],f=e[11],g=e[12],v=e[13],m=e[14],p=e[15],w=t*o-i*a,A=t*l-r*a,M=t*c-s*a,b=i*l-r*o,R=i*c-s*o,E=r*c-s*l,y=d*v-u*g,C=d*m-h*g,P=d*p-f*g,D=u*m-h*v,U=u*p-f*v,V=h*p-f*m,J=w*V-A*U+M*D+b*P-R*C+E*y;if(J===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const I=1/J;return e[0]=(o*V-l*U+c*D)*I,e[1]=(r*U-i*V-s*D)*I,e[2]=(v*E-m*R+p*b)*I,e[3]=(h*R-u*E-f*b)*I,e[4]=(l*P-a*V-c*C)*I,e[5]=(t*V-r*P+s*C)*I,e[6]=(m*M-g*E-p*A)*I,e[7]=(d*E-h*M+f*A)*I,e[8]=(a*U-o*P+c*y)*I,e[9]=(i*P-t*U-s*y)*I,e[10]=(g*R-v*M+p*w)*I,e[11]=(u*M-d*R-f*w)*I,e[12]=(o*C-a*D-l*y)*I,e[13]=(t*D-i*C+r*y)*I,e[14]=(v*A-g*b-m*w)*I,e[15]=(d*b-u*A+h*w)*I,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,d=s*o;return this.set(c*a+i,c*o-r*l,c*l+r*o,0,c*o+r*l,d*o+i,d*l-r*a,0,c*l-r*o,d*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,d=a+a,u=o+o,h=s*c,f=s*d,g=s*u,v=a*d,m=a*u,p=o*u,w=l*c,A=l*d,M=l*u,b=i.x,R=i.y,E=i.z;return r[0]=(1-(v+p))*b,r[1]=(f+M)*b,r[2]=(g-A)*b,r[3]=0,r[4]=(f-M)*R,r[5]=(1-(h+p))*R,r[6]=(m+w)*R,r[7]=0,r[8]=(g+A)*E,r[9]=(m-w)*E,r[10]=(1-(h+v))*E,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return i.set(1,1,1),t.identity(),this;let a=Vi.set(r[0],r[1],r[2]).length();const o=Vi.set(r[4],r[5],r[6]).length(),l=Vi.set(r[8],r[9],r[10]).length();s<0&&(a=-a),cn.copy(this);const c=1/a,d=1/o,u=1/l;return cn.elements[0]*=c,cn.elements[1]*=c,cn.elements[2]*=c,cn.elements[4]*=d,cn.elements[5]*=d,cn.elements[6]*=d,cn.elements[8]*=u,cn.elements[9]*=u,cn.elements[10]*=u,t.setFromRotationMatrix(cn),i.x=a,i.y=o,i.z=l,this}makePerspective(e,t,i,r,s,a,o=Cn,l=!1){const c=this.elements,d=2*s/(t-e),u=2*s/(i-r),h=(t+e)/(t-e),f=(i+r)/(i-r);let g,v;if(l)g=s/(a-s),v=a*s/(a-s);else if(o===Cn)g=-(a+s)/(a-s),v=-2*a*s/(a-s);else if(o===es)g=-a/(a-s),v=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=v,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=Cn,l=!1){const c=this.elements,d=2/(t-e),u=2/(i-r),h=-(t+e)/(t-e),f=-(i+r)/(i-r);let g,v;if(l)g=1/(a-s),v=a/(a-s);else if(o===Cn)g=-2/(a-s),v=-(a+s)/(a-s);else if(o===es)g=-1/(a-s),v=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=g,c[14]=v,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}};ga.prototype.isMatrix4=!0;let Ve=ga;const Vi=new O,cn=new Ve,lg=new O(0,0,0),cg=new O(1,1,1),ni=new O,ms=new O,Zt=new O,$c=new Ve,Kc=new Yn;class Kn{constructor(e=0,t=0,i=0,r=Kn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],d=r[9],u=r[2],h=r[6],f=r[10];switch(t){case"XYZ":this._y=Math.asin(Ze(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-d,f),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ze(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(Ze(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Ze(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(h,f),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Ze(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Ze(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-d,f),this._y=0);break;default:Ae("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return $c.makeRotationFromQuaternion(e),this.setFromRotationMatrix($c,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Kc.setFromEuler(this),this.setFromQuaternion(Kc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Kn.DEFAULT_ORDER="XYZ";class $u{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let dg=0;const Yc=new O,Wi=new Yn,Un=new Ve,gs=new O,Cr=new O,ug=new O,hg=new Yn,Zc=new O(1,0,0),Jc=new O(0,1,0),Qc=new O(0,0,1),jc={type:"added"},fg={type:"removed"},Xi={type:"childadded",child:null},Wa={type:"childremoved",child:null};class ht extends Oi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:dg++}),this.uuid=gn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ht.DEFAULT_UP.clone();const e=new O,t=new Kn,i=new Yn,r=new O(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Ve},normalMatrix:{value:new Ge}}),this.matrix=new Ve,this.matrixWorld=new Ve,this.matrixAutoUpdate=ht.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ht.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new $u,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.multiply(Wi),this}rotateOnWorldAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.premultiply(Wi),this}rotateX(e){return this.rotateOnAxis(Zc,e)}rotateY(e){return this.rotateOnAxis(Jc,e)}rotateZ(e){return this.rotateOnAxis(Qc,e)}translateOnAxis(e,t){return Yc.copy(e).applyQuaternion(this.quaternion),this.position.add(Yc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Zc,e)}translateY(e){return this.translateOnAxis(Jc,e)}translateZ(e){return this.translateOnAxis(Qc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Un.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?gs.copy(e):gs.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Cr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Un.lookAt(Cr,gs,this.up):Un.lookAt(gs,Cr,this.up),this.quaternion.setFromRotationMatrix(Un),r&&(Un.extractRotation(r.matrixWorld),Wi.setFromRotationMatrix(Un),this.quaternion.premultiply(Wi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Oe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(jc),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null):Oe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(fg),Wa.child=e,this.dispatchEvent(Wa),Wa.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Un.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Un.multiply(e.parent.matrixWorld)),e.applyMatrix4(Un),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(jc),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cr,e,ug),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cr,hg,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,i)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){const u=l[c];s(e.shapes,u)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),d=a(e.images),u=a(e.shapes),h=a(e.skeletons),f=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),d.length>0&&(i.images=d),u.length>0&&(i.shapes=u),h.length>0&&(i.skeletons=h),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=r,i;function a(o){const l=[];for(const c in o){const d=o[c];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}ht.DEFAULT_UP=new O(0,1,0);ht.DEFAULT_MATRIX_AUTO_UPDATE=!0;ht.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class ut extends ht{constructor(){super(),this.isGroup=!0,this.type="Group"}}const pg={type:"move"};class Xa{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ut,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ut,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ut,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const v of e.hand.values()){const m=t.getJointPose(v,i),p=this._getHandJoint(c,v);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const d=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],h=d.position.distanceTo(u.position),f=.02,g=.005;c.inputState.pinching&&h>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(pg)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new ut;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const Ku={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ii={h:0,s:0,l:0},_s={h:0,s:0,l:0};function qa(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class De{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Pt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ye.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=Ye.workingColorSpace){return this.r=e,this.g=t,this.b=i,Ye.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=Ye.workingColorSpace){if(e=Kl(e,1),t=Ze(t,0,1),i=Ze(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=qa(a,s,e+1/3),this.g=qa(a,s,e),this.b=qa(a,s,e-1/3)}return Ye.colorSpaceToWorking(this,r),this}setStyle(e,t=Pt){function i(s){s!==void 0&&parseFloat(s)<1&&Ae("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ae("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ae("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Pt){const i=Ku[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ae("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Wn(e.r),this.g=Wn(e.g),this.b=Wn(e.b),this}copyLinearToSRGB(e){return this.r=fr(e.r),this.g=fr(e.g),this.b=fr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Pt){return Ye.workingToColorSpace(Vt.copy(this),e),Math.round(Ze(Vt.r*255,0,255))*65536+Math.round(Ze(Vt.g*255,0,255))*256+Math.round(Ze(Vt.b*255,0,255))}getHexString(e=Pt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ye.workingColorSpace){Ye.workingToColorSpace(Vt.copy(this),t);const i=Vt.r,r=Vt.g,s=Vt.b,a=Math.max(i,r,s),o=Math.min(i,r,s);let l,c;const d=(o+a)/2;if(o===a)l=0,c=0;else{const u=a-o;switch(c=d<=.5?u/(a+o):u/(2-a-o),a){case i:l=(r-s)/u+(r<s?6:0);break;case r:l=(s-i)/u+2;break;case s:l=(i-r)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=d,e}getRGB(e,t=Ye.workingColorSpace){return Ye.workingToColorSpace(Vt.copy(this),t),e.r=Vt.r,e.g=Vt.g,e.b=Vt.b,e}getStyle(e=Pt){Ye.workingToColorSpace(Vt.copy(this),e);const t=Vt.r,i=Vt.g,r=Vt.b;return e!==Pt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(ii),this.setHSL(ii.h+e,ii.s+t,ii.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ii),e.getHSL(_s);const i=Kr(ii.h,_s.h,t),r=Kr(ii.s,_s.s,t),s=Kr(ii.l,_s.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Vt=new De;De.NAMES=Ku;class ua{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new De(e),this.density=t}clone(){return new ua(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class mg extends ht{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Kn,this.environmentIntensity=1,this.environmentRotation=new Kn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const dn=new O,Fn=new O,$a=new O,On=new O,qi=new O,$i=new O,ed=new O,Ka=new O,Ya=new O,Za=new O,Ja=new ot,Qa=new ot,ja=new ot;class sn{constructor(e=new O,t=new O,i=new O){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),dn.subVectors(e,t),r.cross(dn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){dn.subVectors(r,t),Fn.subVectors(i,t),$a.subVectors(e,t);const a=dn.dot(dn),o=dn.dot(Fn),l=dn.dot($a),c=Fn.dot(Fn),d=Fn.dot($a),u=a*c-o*o;if(u===0)return s.set(0,0,0),null;const h=1/u,f=(c*l-o*d)*h,g=(a*d-o*l)*h;return s.set(1-f-g,g,f)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,On)===null?!1:On.x>=0&&On.y>=0&&On.x+On.y<=1}static getInterpolation(e,t,i,r,s,a,o,l){return this.getBarycoord(e,t,i,r,On)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,On.x),l.addScaledVector(a,On.y),l.addScaledVector(o,On.z),l)}static getInterpolatedAttribute(e,t,i,r,s,a){return Ja.setScalar(0),Qa.setScalar(0),ja.setScalar(0),Ja.fromBufferAttribute(e,t),Qa.fromBufferAttribute(e,i),ja.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Ja,s.x),a.addScaledVector(Qa,s.y),a.addScaledVector(ja,s.z),a}static isFrontFacing(e,t,i,r){return dn.subVectors(i,t),Fn.subVectors(e,t),dn.cross(Fn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return dn.subVectors(this.c,this.b),Fn.subVectors(this.a,this.b),dn.cross(Fn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return sn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return sn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return sn.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return sn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return sn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let a,o;qi.subVectors(r,i),$i.subVectors(s,i),Ka.subVectors(e,i);const l=qi.dot(Ka),c=$i.dot(Ka);if(l<=0&&c<=0)return t.copy(i);Ya.subVectors(e,r);const d=qi.dot(Ya),u=$i.dot(Ya);if(d>=0&&u<=d)return t.copy(r);const h=l*u-d*c;if(h<=0&&l>=0&&d<=0)return a=l/(l-d),t.copy(i).addScaledVector(qi,a);Za.subVectors(e,s);const f=qi.dot(Za),g=$i.dot(Za);if(g>=0&&f<=g)return t.copy(s);const v=f*c-l*g;if(v<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(i).addScaledVector($i,o);const m=d*g-f*u;if(m<=0&&u-d>=0&&f-g>=0)return ed.subVectors(s,r),o=(u-d)/(u-d+(f-g)),t.copy(r).addScaledVector(ed,o);const p=1/(m+v+h);return a=v*p,o=h*p,t.copy(i).addScaledVector(qi,a).addScaledVector($i,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Zn{constructor(e=new O(1/0,1/0,1/0),t=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(un.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(un.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=un.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,un):un.fromBufferAttribute(s,a),un.applyMatrix4(e.matrixWorld),this.expandByPoint(un);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),vs.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),vs.copy(i.boundingBox)),vs.applyMatrix4(e.matrixWorld),this.union(vs)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,un),un.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ir),ys.subVectors(this.max,Ir),Ki.subVectors(e.a,Ir),Yi.subVectors(e.b,Ir),Zi.subVectors(e.c,Ir),ri.subVectors(Yi,Ki),si.subVectors(Zi,Yi),xi.subVectors(Ki,Zi);let t=[0,-ri.z,ri.y,0,-si.z,si.y,0,-xi.z,xi.y,ri.z,0,-ri.x,si.z,0,-si.x,xi.z,0,-xi.x,-ri.y,ri.x,0,-si.y,si.x,0,-xi.y,xi.x,0];return!eo(t,Ki,Yi,Zi,ys)||(t=[1,0,0,0,1,0,0,0,1],!eo(t,Ki,Yi,Zi,ys))?!1:(Ms.crossVectors(ri,si),t=[Ms.x,Ms.y,Ms.z],eo(t,Ki,Yi,Zi,ys))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,un).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(un).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(kn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),kn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),kn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),kn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),kn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),kn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),kn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),kn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(kn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const kn=[new O,new O,new O,new O,new O,new O,new O,new O],un=new O,vs=new Zn,Ki=new O,Yi=new O,Zi=new O,ri=new O,si=new O,xi=new O,Ir=new O,ys=new O,Ms=new O,bi=new O;function eo(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){bi.fromArray(n,s);const o=r.x*Math.abs(bi.x)+r.y*Math.abs(bi.y)+r.z*Math.abs(bi.z),l=e.dot(bi),c=t.dot(bi),d=i.dot(bi);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>o)return!1}return!0}const Ct=new O,xs=new ke;let gg=0;class zt extends Oi{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:gg++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=gl,this.updateRanges=[],this.gpuType=an,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)xs.fromBufferAttribute(this,t),xs.applyMatrix3(e),this.setXY(t,xs.x,xs.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix3(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix4(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.applyNormalMatrix(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.transformDirection(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=fn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=it(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=fn(t,this.array)),t}setX(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=fn(t,this.array)),t}setY(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=fn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=fn(t,this.array)),t}setW(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=it(t,this.array),i=it(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=it(t,this.array),i=it(i,this.array),r=it(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=it(t,this.array),i=it(i,this.array),r=it(r,this.array),s=it(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==gl&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}}class Yu extends zt{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class Zu extends zt{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class mt extends zt{constructor(e,t,i){super(new Float32Array(e),t,i)}}const _g=new Zn,Pr=new O,to=new O;class Dn{constructor(e=new O,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):_g.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Pr.subVectors(e,this.center);const t=Pr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Pr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(to.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Pr.copy(e.center).add(to)),this.expandByPoint(Pr.copy(e.center).sub(to))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let vg=0;const nn=new Ve,no=new ht,Ji=new O,Jt=new Zn,Lr=new Zn,kt=new O;class Ot extends Oi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:vg++}),this.uuid=gn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Nm(e)?Zu:Yu)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Ge().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return nn.makeRotationFromQuaternion(e),this.applyMatrix4(nn),this}rotateX(e){return nn.makeRotationX(e),this.applyMatrix4(nn),this}rotateY(e){return nn.makeRotationY(e),this.applyMatrix4(nn),this}rotateZ(e){return nn.makeRotationZ(e),this.applyMatrix4(nn),this}translate(e,t,i){return nn.makeTranslation(e,t,i),this.applyMatrix4(nn),this}scale(e,t,i){return nn.makeScale(e,t,i),this.applyMatrix4(nn),this}lookAt(e){return no.lookAt(e),no.updateMatrix(),this.applyMatrix4(no.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ji).negate(),this.translate(Ji.x,Ji.y,Ji.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new mt(i,3))}else{const i=Math.min(e.length,t.count);for(let r=0;r<i;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ae("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Zn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Oe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];Jt.setFromBufferAttribute(s),this.morphTargetsRelative?(kt.addVectors(this.boundingBox.min,Jt.min),this.boundingBox.expandByPoint(kt),kt.addVectors(this.boundingBox.max,Jt.max),this.boundingBox.expandByPoint(kt)):(this.boundingBox.expandByPoint(Jt.min),this.boundingBox.expandByPoint(Jt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Oe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Dn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Oe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(e){const i=this.boundingSphere.center;if(Jt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];Lr.setFromBufferAttribute(o),this.morphTargetsRelative?(kt.addVectors(Jt.min,Lr.min),Jt.expandByPoint(kt),kt.addVectors(Jt.max,Lr.max),Jt.expandByPoint(kt)):(Jt.expandByPoint(Lr.min),Jt.expandByPoint(Lr.max))}Jt.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)kt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(kt));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,d=o.count;c<d;c++)kt.fromBufferAttribute(o,c),l&&(Ji.fromBufferAttribute(e,c),kt.add(Ji)),r=Math.max(r,i.distanceToSquared(kt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Oe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Oe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==i.count)&&(a=new zt(new Float32Array(4*i.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let y=0;y<i.count;y++)o[y]=new O,l[y]=new O;const c=new O,d=new O,u=new O,h=new ke,f=new ke,g=new ke,v=new O,m=new O;function p(y,C,P){c.fromBufferAttribute(i,y),d.fromBufferAttribute(i,C),u.fromBufferAttribute(i,P),h.fromBufferAttribute(s,y),f.fromBufferAttribute(s,C),g.fromBufferAttribute(s,P),d.sub(c),u.sub(c),f.sub(h),g.sub(h);const D=1/(f.x*g.y-g.x*f.y);isFinite(D)&&(v.copy(d).multiplyScalar(g.y).addScaledVector(u,-f.y).multiplyScalar(D),m.copy(u).multiplyScalar(f.x).addScaledVector(d,-g.x).multiplyScalar(D),o[y].add(v),o[C].add(v),o[P].add(v),l[y].add(m),l[C].add(m),l[P].add(m))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let y=0,C=w.length;y<C;++y){const P=w[y],D=P.start,U=P.count;for(let V=D,J=D+U;V<J;V+=3)p(e.getX(V+0),e.getX(V+1),e.getX(V+2))}const A=new O,M=new O,b=new O,R=new O;function E(y){b.fromBufferAttribute(r,y),R.copy(b);const C=o[y];A.copy(C),A.sub(b.multiplyScalar(b.dot(C))).normalize(),M.crossVectors(R,C);const D=M.dot(l[y])<0?-1:1;a.setXYZW(y,A.x,A.y,A.z,D)}for(let y=0,C=w.length;y<C;++y){const P=w[y],D=P.start,U=P.count;for(let V=D,J=D+U;V<J;V+=3)E(e.getX(V+0)),E(e.getX(V+1)),E(e.getX(V+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new zt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,f=i.count;h<f;h++)i.setXYZ(h,0,0,0);const r=new O,s=new O,a=new O,o=new O,l=new O,c=new O,d=new O,u=new O;if(e)for(let h=0,f=e.count;h<f;h+=3){const g=e.getX(h+0),v=e.getX(h+1),m=e.getX(h+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,v),a.fromBufferAttribute(t,m),d.subVectors(a,s),u.subVectors(r,s),d.cross(u),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,v),c.fromBufferAttribute(i,m),o.add(d),l.add(d),c.add(d),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(v,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,f=t.count;h<f;h+=3)r.fromBufferAttribute(t,h+0),s.fromBufferAttribute(t,h+1),a.fromBufferAttribute(t,h+2),d.subVectors(a,s),u.subVectors(r,s),d.cross(u),i.setXYZ(h+0,d.x,d.y,d.z),i.setXYZ(h+1,d.x,d.y,d.z),i.setXYZ(h+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)kt.fromBufferAttribute(e,t),kt.normalize(),e.setXYZ(t,kt.x,kt.y,kt.z)}toNonIndexed(){function e(o,l){const c=o.array,d=o.itemSize,u=o.normalized,h=new c.constructor(l.length*d);let f=0,g=0;for(let v=0,m=l.length;v<m;v++){o.isInterleavedBufferAttribute?f=l[v]*o.data.stride+o.offset:f=l[v]*d;for(let p=0;p<d;p++)h[g++]=c[f++]}return new zt(h,d,u)}if(this.index===null)return Ae("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Ot,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,i);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let d=0,u=c.length;d<u;d++){const h=c[d],f=e(h,i);l.push(f)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],d=[];for(let u=0,h=c.length;u<h;u++){const f=c[u];d.push(f.toJSON(e.data))}d.length>0&&(r[l]=d,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const c in r){const d=r[c];this.setAttribute(c,d.clone(t))}const s=e.morphAttributes;for(const c in s){const d=[],u=s[c];for(let h=0,f=u.length;h<f;h++)d.push(u[h].clone(t));this.morphAttributes[c]=d}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,d=a.length;c<d;c++){const u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ju{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=gl,this.updateRanges=[],this.version=0,this.uuid=gn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,s=this.stride;r<s;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=gn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=gn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Xt=new O;class ns{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)Xt.fromBufferAttribute(this,t),Xt.applyMatrix4(e),this.setXYZ(t,Xt.x,Xt.y,Xt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Xt.fromBufferAttribute(this,t),Xt.applyNormalMatrix(e),this.setXYZ(t,Xt.x,Xt.y,Xt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Xt.fromBufferAttribute(this,t),Xt.transformDirection(e),this.setXYZ(t,Xt.x,Xt.y,Xt.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=fn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=it(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=fn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=fn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=fn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=fn(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=it(t,this.array),i=it(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=it(t,this.array),i=it(i,this.array),r=it(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=it(t,this.array),i=it(i,this.array),r=it(r,this.array),s=it(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=s,this}clone(e){if(e===void 0){da("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return new zt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new ns(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){da("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}let yg=0;class ln extends Oi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:yg++}),this.uuid=gn(),this.name="",this.type="Material",this.blending=ur,this.side=Xn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Io,this.blendDst=Po,this.blendEquation=Ri,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new De(0,0,0),this.blendAlpha=0,this.depthFunc=vr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Bc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Gi,this.stencilZFail=Gi,this.stencilZPass=Gi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){Ae(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ae(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==ur&&(i.blending=this.blending),this.side!==Xn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Io&&(i.blendSrc=this.blendSrc),this.blendDst!==Po&&(i.blendDst=this.blendDst),this.blendEquation!==Ri&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==vr&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Bc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Gi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Gi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Gi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new De().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new ke().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ke().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Qu extends ln{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new De(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}let Qi;const Dr=new O,ji=new O,er=new O,tr=new ke,Nr=new ke,ju=new Ve,bs=new O,Ur=new O,Ss=new O,td=new ke,io=new ke,nd=new ke;class Mg extends ht{constructor(e=new Qu){if(super(),this.isSprite=!0,this.type="Sprite",Qi===void 0){Qi=new Ot;const t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new Ju(t,5);Qi.setIndex([0,1,2,0,2,3]),Qi.setAttribute("position",new ns(i,3,0,!1)),Qi.setAttribute("uv",new ns(i,2,3,!1))}this.geometry=Qi,this.material=e,this.center=new ke(.5,.5),this.count=1}raycast(e,t){e.camera===null&&Oe('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ji.setFromMatrixScale(this.matrixWorld),ju.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),er.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ji.multiplyScalar(-er.z);const i=this.material.rotation;let r,s;i!==0&&(s=Math.cos(i),r=Math.sin(i));const a=this.center;Ts(bs.set(-.5,-.5,0),er,a,ji,r,s),Ts(Ur.set(.5,-.5,0),er,a,ji,r,s),Ts(Ss.set(.5,.5,0),er,a,ji,r,s),td.set(0,0),io.set(1,0),nd.set(1,1);let o=e.ray.intersectTriangle(bs,Ur,Ss,!1,Dr);if(o===null&&(Ts(Ur.set(-.5,.5,0),er,a,ji,r,s),io.set(0,1),o=e.ray.intersectTriangle(bs,Ss,Ur,!1,Dr),o===null))return;const l=e.ray.origin.distanceTo(Dr);l<e.near||l>e.far||t.push({distance:l,point:Dr.clone(),uv:sn.getInterpolation(Dr,bs,Ur,Ss,td,io,nd,new ke),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}}function Ts(n,e,t,i,r,s){tr.subVectors(n,t).addScalar(.5).multiply(i),r!==void 0?(Nr.x=s*tr.x-r*tr.y,Nr.y=r*tr.x+s*tr.y):Nr.copy(tr),n.copy(e),n.x+=Nr.x,n.y+=Nr.y,n.applyMatrix4(ju)}const Bn=new O,ro=new O,Es=new O,ai=new O,so=new O,ws=new O,ao=new O;class Ma{constructor(e=new O,t=new O(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Bn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Bn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Bn.copy(this.origin).addScaledVector(this.direction,t),Bn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){ro.copy(e).add(t).multiplyScalar(.5),Es.copy(t).sub(e).normalize(),ai.copy(this.origin).sub(ro);const s=e.distanceTo(t)*.5,a=-this.direction.dot(Es),o=ai.dot(this.direction),l=-ai.dot(Es),c=ai.lengthSq(),d=Math.abs(1-a*a);let u,h,f,g;if(d>0)if(u=a*l-o,h=a*o-l,g=s*d,u>=0)if(h>=-g)if(h<=g){const v=1/d;u*=v,h*=v,f=u*(u+a*h+2*o)+h*(a*u+h+2*l)+c}else h=s,u=Math.max(0,-(a*h+o)),f=-u*u+h*(h+2*l)+c;else h=-s,u=Math.max(0,-(a*h+o)),f=-u*u+h*(h+2*l)+c;else h<=-g?(u=Math.max(0,-(-a*s+o)),h=u>0?-s:Math.min(Math.max(-s,-l),s),f=-u*u+h*(h+2*l)+c):h<=g?(u=0,h=Math.min(Math.max(-s,-l),s),f=h*(h+2*l)+c):(u=Math.max(0,-(a*s+o)),h=u>0?s:Math.min(Math.max(-s,-l),s),f=-u*u+h*(h+2*l)+c);else h=a>0?-s:s,u=Math.max(0,-(a*h+o)),f=-u*u+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(ro).addScaledVector(Es,h),f}intersectSphere(e,t){Bn.subVectors(e.center,this.origin);const i=Bn.dot(this.direction),r=Bn.dot(Bn)-i*i,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,l;const c=1/this.direction.x,d=1/this.direction.y,u=1/this.direction.z,h=this.origin;return c>=0?(i=(e.min.x-h.x)*c,r=(e.max.x-h.x)*c):(i=(e.max.x-h.x)*c,r=(e.min.x-h.x)*c),d>=0?(s=(e.min.y-h.y)*d,a=(e.max.y-h.y)*d):(s=(e.max.y-h.y)*d,a=(e.min.y-h.y)*d),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-h.z)*u,l=(e.max.z-h.z)*u):(o=(e.max.z-h.z)*u,l=(e.min.z-h.z)*u),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Bn)!==null}intersectTriangle(e,t,i,r,s){so.subVectors(t,e),ws.subVectors(i,e),ao.crossVectors(so,ws);let a=this.direction.dot(ao),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;ai.subVectors(this.origin,e);const l=o*this.direction.dot(ws.crossVectors(ai,ws));if(l<0)return null;const c=o*this.direction.dot(so.cross(ai));if(c<0||l+c>a)return null;const d=-o*ai.dot(ao);return d<0?null:this.at(d/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Di extends ln{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new De(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Kn,this.combine=kl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const id=new Ve,Si=new Ma,As=new Dn,rd=new O,Rs=new O,Cs=new O,Is=new O,oo=new O,Ps=new O,sd=new O,Ls=new O;class me extends ht{constructor(e=new Ot,t=new Di){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){Ps.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const d=o[l],u=s[l];d!==0&&(oo.fromBufferAttribute(u,e),a?Ps.addScaledVector(oo,d):Ps.addScaledVector(oo.sub(t),d))}t.add(Ps)}return t}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),As.copy(i.boundingSphere),As.applyMatrix4(s),Si.copy(e.ray).recast(e.near),!(As.containsPoint(Si.origin)===!1&&(Si.intersectSphere(As,rd)===null||Si.origin.distanceToSquared(rd)>(e.far-e.near)**2))&&(id.copy(s).invert(),Si.copy(e.ray).applyMatrix4(id),!(i.boundingBox!==null&&Si.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Si)))}_computeIntersections(e,t,i){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,d=s.attributes.uv1,u=s.attributes.normal,h=s.groups,f=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,v=h.length;g<v;g++){const m=h[g],p=a[m.materialIndex],w=Math.max(m.start,f.start),A=Math.min(o.count,Math.min(m.start+m.count,f.start+f.count));for(let M=w,b=A;M<b;M+=3){const R=o.getX(M),E=o.getX(M+1),y=o.getX(M+2);r=Ds(this,p,e,i,c,d,u,R,E,y),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,f.start),v=Math.min(o.count,f.start+f.count);for(let m=g,p=v;m<p;m+=3){const w=o.getX(m),A=o.getX(m+1),M=o.getX(m+2);r=Ds(this,a,e,i,c,d,u,w,A,M),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,v=h.length;g<v;g++){const m=h[g],p=a[m.materialIndex],w=Math.max(m.start,f.start),A=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let M=w,b=A;M<b;M+=3){const R=M,E=M+1,y=M+2;r=Ds(this,p,e,i,c,d,u,R,E,y),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,f.start),v=Math.min(l.count,f.start+f.count);for(let m=g,p=v;m<p;m+=3){const w=m,A=m+1,M=m+2;r=Ds(this,a,e,i,c,d,u,w,A,M),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function xg(n,e,t,i,r,s,a,o){let l;if(e.side===Kt?l=i.intersectTriangle(a,s,r,!0,o):l=i.intersectTriangle(r,s,a,e.side===Xn,o),l===null)return null;Ls.copy(o),Ls.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(Ls);return c<t.near||c>t.far?null:{distance:c,point:Ls.clone(),object:n}}function Ds(n,e,t,i,r,s,a,o,l,c){n.getVertexPosition(o,Rs),n.getVertexPosition(l,Cs),n.getVertexPosition(c,Is);const d=xg(n,e,t,i,Rs,Cs,Is,sd);if(d){const u=new O;sn.getBarycoord(sd,Rs,Cs,Is,u),r&&(d.uv=sn.getInterpolatedAttribute(r,o,l,c,u,new ke)),s&&(d.uv1=sn.getInterpolatedAttribute(s,o,l,c,u,new ke)),a&&(d.normal=sn.getInterpolatedAttribute(a,o,l,c,u,new O),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));const h={a:o,b:l,c,normal:new O,materialIndex:0};sn.getNormal(Rs,Cs,Is,h.normal),d.face=h,d.barycoord=u}return d}const Fr=new ot,ad=new ot,od=new ot,bg=new ot,ld=new Ve,Ns=new O,lo=new Dn,cd=new Ve,co=new Ma;class Sg extends me{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Nc,this.bindMatrix=new Ve,this.bindMatrixInverse=new Ve,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Zn),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,Ns),this.boundingBox.expandByPoint(Ns)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Dn),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,Ns),this.boundingSphere.expandByPoint(Ns)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const i=this.material,r=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),lo.copy(this.boundingSphere),lo.applyMatrix4(r),e.ray.intersectsSphere(lo)!==!1&&(cd.copy(r).invert(),co.copy(e.ray).applyMatrix4(cd),!(this.boundingBox!==null&&co.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,co)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new ot,t=this.geometry.attributes.skinWeight;for(let i=0,r=t.count;i<r;i++){e.fromBufferAttribute(t,i);const s=1/e.manhattanLength();s!==1/0?e.multiplyScalar(s):e.set(1,0,0,0),t.setXYZW(i,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Nc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Sm?this.bindMatrixInverse.copy(this.bindMatrix).invert():Ae("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const i=this.skeleton,r=this.geometry;ad.fromBufferAttribute(r.attributes.skinIndex,e),od.fromBufferAttribute(r.attributes.skinWeight,e),t.isVector4?(Fr.copy(t),t.set(0,0,0,0)):(Fr.set(...t,1),t.set(0,0,0)),Fr.applyMatrix4(this.bindMatrix);for(let s=0;s<4;s++){const a=od.getComponent(s);if(a!==0){const o=ad.getComponent(s);ld.multiplyMatrices(i.bones[o].matrixWorld,i.boneInverses[o]),t.addScaledVector(bg.copy(Fr).applyMatrix4(ld),a)}}return t.isVector4&&(t.w=Fr.w),t.applyMatrix4(this.bindMatrixInverse)}}class eh extends ht{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Zl extends Nt{constructor(e=null,t=1,i=1,r,s,a,o,l,c=Dt,d=Dt,u,h){super(null,a,o,l,c,d,r,s,u,h),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const dd=new Ve,Tg=new Ve;class Jl{constructor(e=[],t=[]){this.uuid=gn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){Ae("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,r=this.bones.length;i<r;i++)this.boneInverses.push(new Ve)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const i=new Ve;this.bones[e]&&i.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const i=this.bones[e];i&&i.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const i=this.bones[e];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){const e=this.bones,t=this.boneInverses,i=this.boneMatrices,r=this.boneTexture;for(let s=0,a=e.length;s<a;s++){const o=e[s]?e[s].matrixWorld:Tg;dd.multiplyMatrices(o,t[s]),dd.toArray(i,s*16)}r!==null&&(r.needsUpdate=!0)}clone(){return new Jl(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const i=new Zl(t,e,e,on,an);return i.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=i,this}getBoneByName(e){for(let t=0,i=this.bones.length;t<i;t++){const r=this.bones[t];if(r.name===e)return r}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let i=0,r=e.bones.length;i<r;i++){const s=e.bones[i];let a=t[s];a===void 0&&(Ae("Skeleton: No bone found with UUID:",s),a=new eh),this.bones.push(a),this.boneInverses.push(new Ve().fromArray(e.boneInverses[i]))}return this.init(),this}toJSON(){const e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,i=this.boneInverses;for(let r=0,s=t.length;r<s;r++){const a=t[r];e.bones.push(a.uuid);const o=i[r];e.boneInverses.push(o.toArray())}return e}}class is extends zt{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const nr=new Ve,ud=new Ve,Us=[],hd=new Zn,Eg=new Ve,Or=new me,kr=new Dn;class _l extends me{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new is(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,Eg)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Zn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,nr),hd.copy(e.boundingBox).applyMatrix4(nr),this.boundingBox.union(hd)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Dn),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,nr),kr.copy(e.boundingSphere).applyMatrix4(nr),this.boundingSphere.union(kr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=i.length+1,a=e*s+1;for(let o=0;o<i.length;o++)i[o]=r[a+o]}raycast(e,t){const i=this.matrixWorld,r=this.count;if(Or.geometry=this.geometry,Or.material=this.material,Or.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),kr.copy(this.boundingSphere),kr.applyMatrix4(i),e.ray.intersectsSphere(kr)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,nr),ud.multiplyMatrices(i,nr),Or.matrixWorld=ud,Or.raycast(e,Us);for(let a=0,o=Us.length;a<o;a++){const l=Us[a];l.instanceId=s,l.object=this,t.push(l)}Us.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new is(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new Zl(new Float32Array(r*this.count),r,this.count,Hl,an));const s=this.morphTexture.source.data.data;let a=0;for(let c=0;c<i.length;c++)a+=i[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=r*e;return s[l]=o,s.set(i,l+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const uo=new O,wg=new O,Ag=new Ge;class Ai{constructor(e=new O(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=uo.subVectors(i,t).cross(wg.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){const r=e.delta(uo),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||Ag.getNormalMatrix(e),r=this.coplanarPoint(uo).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Ti=new Dn,Rg=new ke(.5,.5),Fs=new O;class Ql{constructor(e=new Ai,t=new Ai,i=new Ai,r=new Ai,s=new Ai,a=new Ai){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Cn,i=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],c=s[3],d=s[4],u=s[5],h=s[6],f=s[7],g=s[8],v=s[9],m=s[10],p=s[11],w=s[12],A=s[13],M=s[14],b=s[15];if(r[0].setComponents(c-a,f-d,p-g,b-w).normalize(),r[1].setComponents(c+a,f+d,p+g,b+w).normalize(),r[2].setComponents(c+o,f+u,p+v,b+A).normalize(),r[3].setComponents(c-o,f-u,p-v,b-A).normalize(),i)r[4].setComponents(l,h,m,M).normalize(),r[5].setComponents(c-l,f-h,p-m,b-M).normalize();else if(r[4].setComponents(c-l,f-h,p-m,b-M).normalize(),t===Cn)r[5].setComponents(c+l,f+h,p+m,b+M).normalize();else if(t===es)r[5].setComponents(l,h,m,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ti.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ti.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ti)}intersectsSprite(e){Ti.center.set(0,0,0);const t=Rg.distanceTo(e.center);return Ti.radius=.7071067811865476+t,Ti.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ti)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(Fs.x=r.normal.x>0?e.max.x:e.min.x,Fs.y=r.normal.y>0?e.max.y:e.min.y,Fs.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Fs)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class th extends ln{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new De(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const ha=new O,fa=new O,fd=new Ve,Br=new Ma,Os=new Dn,ho=new O,pd=new O;class jl extends ht{constructor(e=new Ot,t=new th){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)ha.fromBufferAttribute(t,r-1),fa.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=ha.distanceTo(fa);e.setAttribute("lineDistance",new mt(i,1))}else Ae("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Os.copy(i.boundingSphere),Os.applyMatrix4(r),Os.radius+=s,e.ray.intersectsSphere(Os)===!1)return;fd.copy(r).invert(),Br.copy(e.ray).applyMatrix4(fd);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,d=i.index,h=i.attributes.position;if(d!==null){const f=Math.max(0,a.start),g=Math.min(d.count,a.start+a.count);for(let v=f,m=g-1;v<m;v+=c){const p=d.getX(v),w=d.getX(v+1),A=ks(this,e,Br,l,p,w,v);A&&t.push(A)}if(this.isLineLoop){const v=d.getX(g-1),m=d.getX(f),p=ks(this,e,Br,l,v,m,g-1);p&&t.push(p)}}else{const f=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let v=f,m=g-1;v<m;v+=c){const p=ks(this,e,Br,l,v,v+1,v);p&&t.push(p)}if(this.isLineLoop){const v=ks(this,e,Br,l,g-1,f,g-1);v&&t.push(v)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function ks(n,e,t,i,r,s,a){const o=n.geometry.attributes.position;if(ha.fromBufferAttribute(o,r),fa.fromBufferAttribute(o,s),t.distanceSqToSegment(ha,fa,ho,pd)>i)return;ho.applyMatrix4(n.matrixWorld);const c=e.ray.origin.distanceTo(ho);if(!(c<e.near||c>e.far))return{distance:c,point:pd.clone().applyMatrix4(n.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:n}}const md=new O,gd=new O;class Cg extends jl{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)md.fromBufferAttribute(t,r),gd.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+md.distanceTo(gd);e.setAttribute("lineDistance",new mt(i,1))}else Ae("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Ig extends jl{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class ec extends ln{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new De(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const _d=new Ve,vl=new Ma,Bs=new Dn,zs=new O;class nh extends ht{constructor(e=new Ot,t=new ec){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Bs.copy(i.boundingSphere),Bs.applyMatrix4(r),Bs.radius+=s,e.ray.intersectsSphere(Bs)===!1)return;_d.copy(r).invert(),vl.copy(e.ray).applyMatrix4(_d);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,u=i.attributes.position;if(c!==null){const h=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let g=h,v=f;g<v;g++){const m=c.getX(g);zs.fromBufferAttribute(u,m),vd(zs,m,l,r,e,t,this)}}else{const h=Math.max(0,a.start),f=Math.min(u.count,a.start+a.count);for(let g=h,v=f;g<v;g++)zs.fromBufferAttribute(u,g),vd(zs,g,l,r,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function vd(n,e,t,i,r,s,a){const o=vl.distanceSqToPoint(n);if(o<t){const l=new O;vl.closestPointToPoint(n,l),l.applyMatrix4(i);const c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}class ih extends Nt{constructor(e=[],t=Ni,i,r,s,a,o,l,c,d){super(e,t,i,r,s,a,o,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Pg extends Nt{constructor(e,t,i,r,s,a,o,l,c){super(e,t,i,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class br extends Nt{constructor(e,t,i=Pn,r,s,a,o=Dt,l=Dt,c,d=$n,u=1){if(d!==$n&&d!==Li)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const h={width:e,height:t,depth:u};super(h,r,s,a,o,l,d,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Yl(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class Lg extends br{constructor(e,t=Pn,i=Ni,r,s,a=Dt,o=Dt,l,c=$n){const d={width:e,height:e,depth:1},u=[d,d,d,d,d,d];super(e,e,t,i,r,s,a,o,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class rh extends Nt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class je extends Ot{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],d=[],u=[];let h=0,f=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,r,a,2),g("x","z","y",1,-1,e,i,-t,r,a,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new mt(c,3)),this.setAttribute("normal",new mt(d,3)),this.setAttribute("uv",new mt(u,2));function g(v,m,p,w,A,M,b,R,E,y,C){const P=M/E,D=b/y,U=M/2,V=b/2,J=R/2,I=E+1,L=y+1;let z=0,K=0;const ie=new O;for(let Q=0;Q<L;Q++){const se=Q*D-V;for(let ce=0;ce<I;ce++){const Be=ce*P-U;ie[v]=Be*w,ie[m]=se*A,ie[p]=J,c.push(ie.x,ie.y,ie.z),ie[v]=0,ie[m]=0,ie[p]=R>0?1:-1,d.push(ie.x,ie.y,ie.z),u.push(ce/E),u.push(1-Q/y),z+=1}}for(let Q=0;Q<y;Q++)for(let se=0;se<E;se++){const ce=h+se+I*Q,Be=h+se+I*(Q+1),We=h+(se+1)+I*(Q+1),ze=h+(se+1)+I*Q;l.push(ce,Be,ze),l.push(Be,We,ze),K+=6}o.addGroup(f,K,C),f+=K,h+=z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new je(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class as extends Ot{constructor(e=1,t=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);const s=[],a=[],o=[],l=[],c=new O,d=new ke;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,h=3;u<=t;u++,h+=3){const f=i+u/t*r;c.x=e*Math.cos(f),c.y=e*Math.sin(f),a.push(c.x,c.y,c.z),o.push(0,0,1),d.x=(a[h]/e+1)/2,d.y=(a[h+1]/e+1)/2,l.push(d.x,d.y)}for(let u=1;u<=t;u++)s.push(u,u+1,0);this.setIndex(s),this.setAttribute("position",new mt(a,3)),this.setAttribute("normal",new mt(o,3)),this.setAttribute("uv",new mt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new as(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class jt extends Ot{constructor(e=1,t=1,i=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const d=[],u=[],h=[],f=[];let g=0;const v=[],m=i/2;let p=0;w(),a===!1&&(e>0&&A(!0),t>0&&A(!1)),this.setIndex(d),this.setAttribute("position",new mt(u,3)),this.setAttribute("normal",new mt(h,3)),this.setAttribute("uv",new mt(f,2));function w(){const M=new O,b=new O;let R=0;const E=(t-e)/i;for(let y=0;y<=s;y++){const C=[],P=y/s,D=P*(t-e)+e;for(let U=0;U<=r;U++){const V=U/r,J=V*l+o,I=Math.sin(J),L=Math.cos(J);b.x=D*I,b.y=-P*i+m,b.z=D*L,u.push(b.x,b.y,b.z),M.set(I,E,L).normalize(),h.push(M.x,M.y,M.z),f.push(V,1-P),C.push(g++)}v.push(C)}for(let y=0;y<r;y++)for(let C=0;C<s;C++){const P=v[C][y],D=v[C+1][y],U=v[C+1][y+1],V=v[C][y+1];(e>0||C!==0)&&(d.push(P,D,V),R+=3),(t>0||C!==s-1)&&(d.push(D,U,V),R+=3)}c.addGroup(p,R,0),p+=R}function A(M){const b=g,R=new ke,E=new O;let y=0;const C=M===!0?e:t,P=M===!0?1:-1;for(let U=1;U<=r;U++)u.push(0,m*P,0),h.push(0,P,0),f.push(.5,.5),g++;const D=g;for(let U=0;U<=r;U++){const J=U/r*l+o,I=Math.cos(J),L=Math.sin(J);E.x=C*L,E.y=m*P,E.z=C*I,u.push(E.x,E.y,E.z),h.push(0,P,0),R.x=I*.5+.5,R.y=L*.5*P+.5,f.push(R.x,R.y),g++}for(let U=0;U<r;U++){const V=b+U,J=D+U;M===!0?d.push(J,J+1,V):d.push(J+1,J,V),y+=3}c.addGroup(p,y,M===!0?1:2),p+=y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new jt(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class os extends jt{constructor(e=1,t=1,i=32,r=1,s=!1,a=0,o=Math.PI*2){super(0,e,t,i,r,s,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:a,thetaLength:o}}static fromJSON(e){return new os(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class ls extends Ot{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(r),c=o+1,d=l+1,u=e/o,h=t/l,f=[],g=[],v=[],m=[];for(let p=0;p<d;p++){const w=p*h-a;for(let A=0;A<c;A++){const M=A*u-s;g.push(M,-w,0),v.push(0,0,1),m.push(A/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let w=0;w<o;w++){const A=w+c*p,M=w+c*(p+1),b=w+1+c*(p+1),R=w+1+c*p;f.push(A,M,R),f.push(M,b,R)}this.setIndex(f),this.setAttribute("position",new mt(g,3)),this.setAttribute("normal",new mt(v,3)),this.setAttribute("uv",new mt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ls(e.width,e.height,e.widthSegments,e.heightSegments)}}class pa extends Ot{constructor(e=.5,t=1,i=32,r=1,s=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:s,thetaLength:a},i=Math.max(3,i),r=Math.max(1,r);const o=[],l=[],c=[],d=[];let u=e;const h=(t-e)/r,f=new O,g=new ke;for(let v=0;v<=r;v++){for(let m=0;m<=i;m++){const p=s+m/i*a;f.x=u*Math.cos(p),f.y=u*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/t+1)/2,g.y=(f.y/t+1)/2,d.push(g.x,g.y)}u+=h}for(let v=0;v<r;v++){const m=v*(i+1);for(let p=0;p<i;p++){const w=p+m,A=w,M=w+i+1,b=w+i+2,R=w+1;o.push(A,M,R),o.push(M,b,R)}}this.setIndex(o),this.setAttribute("position",new mt(l,3)),this.setAttribute("normal",new mt(c,3)),this.setAttribute("uv",new mt(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new pa(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class Lt extends Ot{constructor(e=1,t=32,i=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const l=Math.min(a+o,Math.PI);let c=0;const d=[],u=new O,h=new O,f=[],g=[],v=[],m=[];for(let p=0;p<=i;p++){const w=[],A=p/i,M=a+A*o,b=e*Math.cos(M),R=Math.sqrt(e*e-b*b);let E=0;p===0&&a===0?E=.5/t:p===i&&l===Math.PI&&(E=-.5/t);for(let y=0;y<=t;y++){const C=y/t,P=r+C*s;u.x=-R*Math.cos(P),u.y=b,u.z=R*Math.sin(P),g.push(u.x,u.y,u.z),h.copy(u).normalize(),v.push(h.x,h.y,h.z),m.push(C+E,1-A),w.push(c++)}d.push(w)}for(let p=0;p<i;p++)for(let w=0;w<t;w++){const A=d[p][w+1],M=d[p][w],b=d[p+1][w],R=d[p+1][w+1];(p!==0||a>0)&&f.push(A,M,R),(p!==i-1||l<Math.PI)&&f.push(M,b,R)}this.setIndex(f),this.setAttribute("position",new mt(g,3)),this.setAttribute("normal",new mt(v,3)),this.setAttribute("uv",new mt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Lt(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class xa extends Ot{constructor(e=1,t=.4,i=12,r=48,s=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:s,thetaStart:a,thetaLength:o},i=Math.floor(i),r=Math.floor(r);const l=[],c=[],d=[],u=[],h=new O,f=new O,g=new O;for(let v=0;v<=i;v++){const m=a+v/i*o;for(let p=0;p<=r;p++){const w=p/r*s;f.x=(e+t*Math.cos(m))*Math.cos(w),f.y=(e+t*Math.cos(m))*Math.sin(w),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),h.x=e*Math.cos(w),h.y=e*Math.sin(w),g.subVectors(f,h).normalize(),d.push(g.x,g.y,g.z),u.push(p/r),u.push(v/i)}}for(let v=1;v<=i;v++)for(let m=1;m<=r;m++){const p=(r+1)*v+m-1,w=(r+1)*(v-1)+m-1,A=(r+1)*(v-1)+m,M=(r+1)*v+m;l.push(p,w,M),l.push(w,A,M)}this.setIndex(l),this.setAttribute("position",new mt(c,3)),this.setAttribute("normal",new mt(d,3)),this.setAttribute("uv",new mt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new xa(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}function Sr(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];if(yd(r))r.isRenderTargetTexture?(Ae("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(yd(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function qt(n){const e={};for(let t=0;t<n.length;t++){const i=Sr(n[t]);for(const r in i)e[r]=i[r]}return e}function yd(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function Dg(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function sh(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ye.workingColorSpace}const Ng={clone:Sr,merge:qt};var Ug=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Fg=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Ln extends ln{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ug,this.fragmentShader=Fg,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Sr(e.uniforms),this.uniformsGroups=Dg(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const i in e.uniforms){const r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new De().setHex(r.value);break;case"v2":this.uniforms[i].value=new ke().fromArray(r.value);break;case"v3":this.uniforms[i].value=new O().fromArray(r.value);break;case"v4":this.uniforms[i].value=new ot().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Ge().fromArray(r.value);break;case"m4":this.uniforms[i].value=new Ve().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class Og extends Ln{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class tc extends ln{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new De(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new De(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=la,this.normalScale=new ke(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Kn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Nn extends tc{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ke(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Ze(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new De(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new De(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new De(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class nc extends ln{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new De(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new De(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=la,this.normalScale=new ke(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Kn,this.combine=kl,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class kg extends ln{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=wm,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Bg extends ln{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}function Gs(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function zg(n){function e(r,s){return n[r]-n[s]}const t=n.length,i=new Array(t);for(let r=0;r!==t;++r)i[r]=r;return i.sort(e),i}function Md(n,e,t){const i=n.length,r=new n.constructor(i);for(let s=0,a=0;a!==i;++s){const o=t[s]*e;for(let l=0;l!==e;++l)r[a++]=n[o+l]}return r}function Gg(n,e,t,i){let r=1,s=n[0];for(;s!==void 0&&s[i]===void 0;)s=n[r++];if(s===void 0)return;let a=s[i];if(a!==void 0)if(Array.isArray(a))do a=s[i],a!==void 0&&(e.push(s.time),t.push(...a)),s=n[r++];while(s!==void 0);else if(a.toArray!==void 0)do a=s[i],a!==void 0&&(e.push(s.time),a.toArray(t,t.length)),s=n[r++];while(s!==void 0);else do a=s[i],a!==void 0&&(e.push(s.time),t.push(a)),s=n[r++];while(s!==void 0)}class Tr{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let i=this._cachedIndex,r=t[i],s=t[i-1];n:{e:{let a;t:{i:if(!(e<r)){for(let o=i+2;;){if(r===void 0){if(e<s)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(s=r,r=t[++i],e<r)break e}a=t.length;break t}if(!(e>=s)){const o=t[1];e<o&&(i=2,s=o);for(let l=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(r=s,s=t[--i-1],e>=s)break e}a=i,i=0;break t}break n}for(;i<a;){const o=i+a>>>1;e<t[o]?a=o:i=o+1}if(r=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let a=0;a!==r;++a)t[a]=i[s+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}}class Hg extends Tr{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Fc,endingEnd:Fc}}intervalChanged_(e,t,i){const r=this.parameterPositions;let s=e-2,a=e+1,o=r[s],l=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Oc:s=e,o=2*t-i;break;case kc:s=r.length-2,o=t+r[s]-r[s+1];break;default:s=e,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Oc:a=e,l=2*i-t;break;case kc:a=1,l=i+r[1]-r[0];break;default:a=e-1,l=t}const c=(i-t)*.5,d=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-i),this._offsetPrev=s*d,this._offsetNext=a*d}interpolate_(e,t,i,r){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,d=this._offsetPrev,u=this._offsetNext,h=this._weightPrev,f=this._weightNext,g=(i-t)/(r-t),v=g*g,m=v*g,p=-h*m+2*h*v-h*g,w=(1+h)*m+(-1.5-2*h)*v+(-.5+h)*g+1,A=(-1-f)*m+(1.5+f)*v+.5*g,M=f*m-f*v;for(let b=0;b!==o;++b)s[b]=p*a[d+b]+w*a[c+b]+A*a[l+b]+M*a[u+b];return s}}class Vg extends Tr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,d=(i-t)/(r-t),u=1-d;for(let h=0;h!==o;++h)s[h]=a[c+h]*u+a[l+h]*d;return s}}class Wg extends Tr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}}class Xg extends Tr{interpolate_(e,t,i,r){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,d=this.inTangents,u=this.outTangents;if(!d||!u){const g=(i-t)/(r-t),v=1-g;for(let m=0;m!==o;++m)s[m]=a[c+m]*v+a[l+m]*g;return s}const h=o*2,f=e-1;for(let g=0;g!==o;++g){const v=a[c+g],m=a[l+g],p=f*h+g*2,w=u[p],A=u[p+1],M=e*h+g*2,b=d[M],R=d[M+1];let E=(i-t)/(r-t),y,C,P,D,U;for(let V=0;V<8;V++){y=E*E,C=y*E,P=1-E,D=P*P,U=D*P;const I=U*t+3*D*E*w+3*P*y*b+C*r-i;if(Math.abs(I)<1e-10)break;const L=3*D*(w-t)+6*P*E*(b-w)+3*y*(r-b);if(Math.abs(L)<1e-10)break;E=E-I/L,E=Math.max(0,Math.min(1,E))}s[g]=U*v+3*D*E*A+3*P*y*R+C*m}return s}}class yn{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Gs(t,this.TimeBufferType),this.values=Gs(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Gs(e.times,Array),values:Gs(e.values,Array)};const r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Wg(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Vg(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Hg(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){const t=new Xg(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Qr:t=this.InterpolantFactoryMethodDiscrete;break;case jr:t=this.InterpolantFactoryMethodLinear;break;case Ba:t=this.InterpolantFactoryMethodSmooth;break;case Uc:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){const i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Ae("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Qr;case this.InterpolantFactoryMethodLinear:return jr;case this.InterpolantFactoryMethodSmooth:return Ba;case this.InterpolantFactoryMethodBezier:return Uc}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){const t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e}return this}trim(e,t){const i=this.times,r=i.length;let s=0,a=r-1;for(;s!==r&&i[s]<e;)++s;for(;a!==-1&&i[a]>t;)--a;if(++a,s!==0||a!==r){s>=a&&(a=Math.max(a,1),s=a-1);const o=this.getValueSize();this.times=i.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(Oe("KeyframeTrack: Invalid value size in track.",this),e=!1);const i=this.times,r=this.values,s=i.length;s===0&&(Oe("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){const l=i[o];if(typeof l=="number"&&isNaN(l)){Oe("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Oe("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(r!==void 0&&Um(r))for(let o=0,l=r.length;o!==l;++o){const c=r[o];if(isNaN(c)){Oe("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===Ba,s=e.length-1;let a=1;for(let o=1;o<s;++o){let l=!1;const c=e[o],d=e[o+1];if(c!==d&&(o!==1||c!==e[0]))if(r)l=!0;else{const u=o*i,h=u-i,f=u+i;for(let g=0;g!==i;++g){const v=t[u+g];if(v!==t[h+g]||v!==t[f+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];const u=o*i,h=a*i;for(let f=0;f!==i;++f)t[h+f]=t[u+f]}++a}}if(s>0){e[a]=e[s];for(let o=s*i,l=a*i,c=0;c!==i;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}}yn.prototype.ValueTypeName="";yn.prototype.TimeBufferType=Float32Array;yn.prototype.ValueBufferType=Float32Array;yn.prototype.DefaultInterpolation=jr;class Er extends yn{constructor(e,t,i){super(e,t,i)}}Er.prototype.ValueTypeName="bool";Er.prototype.ValueBufferType=Array;Er.prototype.DefaultInterpolation=Qr;Er.prototype.InterpolantFactoryMethodLinear=void 0;Er.prototype.InterpolantFactoryMethodSmooth=void 0;class ah extends yn{constructor(e,t,i,r){super(e,t,i,r)}}ah.prototype.ValueTypeName="color";class rs extends yn{constructor(e,t,i,r){super(e,t,i,r)}}rs.prototype.ValueTypeName="number";class qg extends Tr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(i-t)/(r-t);let c=e*o;for(let d=c+o;c!==d;c+=4)Yn.slerpFlat(s,0,a,c-o,a,c,l);return s}}class ss extends yn{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new qg(this.times,this.values,this.getValueSize(),e)}}ss.prototype.ValueTypeName="quaternion";ss.prototype.InterpolantFactoryMethodSmooth=void 0;class wr extends yn{constructor(e,t,i){super(e,t,i)}}wr.prototype.ValueTypeName="string";wr.prototype.ValueBufferType=Array;wr.prototype.DefaultInterpolation=Qr;wr.prototype.InterpolantFactoryMethodLinear=void 0;wr.prototype.InterpolantFactoryMethodSmooth=void 0;class ma extends yn{constructor(e,t,i,r){super(e,t,i,r)}}ma.prototype.ValueTypeName="vector";class $g{constructor(e="",t=-1,i=[],r=Tm){this.name=e,this.tracks=i,this.duration=t,this.blendMode=r,this.uuid=gn(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){const t=[],i=e.tracks,r=1/(e.fps||1);for(let a=0,o=i.length;a!==o;++a)t.push(Yg(i[a]).scale(r));const s=new this(e.name,e.duration,t,e.blendMode);return s.uuid=e.uuid,s.userData=JSON.parse(e.userData||"{}"),s}static toJSON(e){const t=[],i=e.tracks,r={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let s=0,a=i.length;s!==a;++s)t.push(yn.toJSON(i[s]));return r}static CreateFromMorphTargetSequence(e,t,i,r){const s=t.length,a=[];for(let o=0;o<s;o++){let l=[],c=[];l.push((o+s-1)%s,o,(o+1)%s),c.push(0,1,0);const d=zg(l);l=Md(l,1,d),c=Md(c,1,d),!r&&l[0]===0&&(l.push(s),c.push(c[0])),a.push(new rs(".morphTargetInfluences["+t[o].name+"]",l,c).scale(1/i))}return new this(e,-1,a)}static findByName(e,t){let i=e;if(!Array.isArray(e)){const r=e;i=r.geometry&&r.geometry.animations||r.animations}for(let r=0;r<i.length;r++)if(i[r].name===t)return i[r];return null}static CreateClipsFromMorphTargetSequences(e,t,i){const r={},s=/^([\w-]*?)([\d]+)$/;for(let o=0,l=e.length;o<l;o++){const c=e[o],d=c.name.match(s);if(d&&d.length>1){const u=d[1];let h=r[u];h||(r[u]=h=[]),h.push(c)}}const a=[];for(const o in r)a.push(this.CreateFromMorphTargetSequence(o,r[o],t,i));return a}resetDuration(){const e=this.tracks;let t=0;for(let i=0,r=e.length;i!==r;++i){const s=this.tracks[i];t=Math.max(t,s.times[s.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let i=0;i<this.tracks.length;i++)e.push(this.tracks[i].clone());const t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}}function Kg(n){switch(n.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return rs;case"vector":case"vector2":case"vector3":case"vector4":return ma;case"color":return ah;case"quaternion":return ss;case"bool":case"boolean":return Er;case"string":return wr}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+n)}function Yg(n){if(n.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=Kg(n.type);if(n.times===void 0){const t=[],i=[];Gg(n.keys,t,i,"value"),n.times=t,n.values=i}return e.parse!==void 0?e.parse(n):new e(n.name,n.times,n.values,n.interpolation)}const Hn={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(xd(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!xd(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function xd(n){try{const e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class Zg{constructor(e,t,i){const r=this;let s=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(d){o++,s===!1&&r.onStart!==void 0&&r.onStart(d,a,o),s=!0},this.itemEnd=function(d){a++,r.onProgress!==void 0&&r.onProgress(d,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(d){r.onError!==void 0&&r.onError(d)},this.resolveURL=function(d){return d=d.normalize("NFC"),l?l(d):d},this.setURLModifier=function(d){return l=d,this},this.addHandler=function(d,u){return c.push(d,u),this},this.removeHandler=function(d){const u=c.indexOf(d);return u!==-1&&c.splice(u,2),this},this.getHandler=function(d){for(let u=0,h=c.length;u<h;u+=2){const f=c[u],g=c[u+1];if(f.global&&(f.lastIndex=0),f.test(d))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const Jg=new Zg;class Ar{constructor(e){this.manager=e!==void 0?e:Jg,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}Ar.DEFAULT_MATERIAL_NAME="__DEFAULT";const zn={};class Qg extends Error{constructor(e,t){super(e),this.response=t}}class oh extends Ar{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=Hn.get(`file:${e}`);if(s!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(s),this.manager.itemEnd(e)},0);return}if(zn[e]!==void 0){zn[e].push({onLoad:t,onProgress:i,onError:r});return}zn[e]=[],zn[e].push({onLoad:t,onProgress:i,onError:r});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&Ae("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const d=zn[e],u=c.body.getReader(),h=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),f=h?parseInt(h):0,g=f!==0;let v=0;const m=new ReadableStream({start(p){w();function w(){u.read().then(({done:A,value:M})=>{if(A)p.close();else{v+=M.byteLength;const b=new ProgressEvent("progress",{lengthComputable:g,loaded:v,total:f});for(let R=0,E=d.length;R<E;R++){const y=d[R];y.onProgress&&y.onProgress(b)}p.enqueue(M),w()}},A=>{p.error(A)})}}});return new Response(m)}else throw new Qg(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(d=>new DOMParser().parseFromString(d,o));case"json":return c.json();default:if(o==="")return c.text();{const u=/charset="?([^;"\s]*)"?/i.exec(o),h=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(h);return c.arrayBuffer().then(g=>f.decode(g))}}}).then(c=>{Hn.add(`file:${e}`,c);const d=zn[e];delete zn[e];for(let u=0,h=d.length;u<h;u++){const f=d[u];f.onLoad&&f.onLoad(c)}}).catch(c=>{const d=zn[e];if(d===void 0)throw this.manager.itemError(e),c;delete zn[e];for(let u=0,h=d.length;u<h;u++){const f=d[u];f.onError&&f.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const ir=new WeakMap;class jg extends Ar{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=this,a=Hn.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)s.manager.itemStart(e),setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0);else{let u=ir.get(a);u===void 0&&(u=[],ir.set(a,u)),u.push({onLoad:t,onError:r})}return a}const o=ts("img");function l(){d(),t&&t(this);const u=ir.get(this)||[];for(let h=0;h<u.length;h++){const f=u[h];f.onLoad&&f.onLoad(this)}ir.delete(this),s.manager.itemEnd(e)}function c(u){d(),r&&r(u),Hn.remove(`image:${e}`);const h=ir.get(this)||[];for(let f=0;f<h.length;f++){const g=h[f];g.onError&&g.onError(u)}ir.delete(this),s.manager.itemError(e),s.manager.itemEnd(e)}function d(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Hn.add(`image:${e}`,o),s.manager.itemStart(e),o.src=e,o}}class e0 extends Ar{constructor(e){super(e)}load(e,t,i,r){const s=new Nt,a=new jg(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){s.image=o,s.needsUpdate=!0,t!==void 0&&t(s)},i,r),s}}class ba extends ht{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new De(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}class t0 extends ba{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ht.DEFAULT_UP),this.updateMatrix(),this.groundColor=new De(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){const t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}}const fo=new Ve,bd=new O,Sd=new O;class ic{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ke(512,512),this.mapType=Qt,this.map=null,this.mapPass=null,this.matrix=new Ve,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ql,this._frameExtents=new ke(1,1),this._viewportCount=1,this._viewports=[new ot(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;bd.setFromMatrixPosition(e.matrixWorld),t.position.copy(bd),Sd.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Sd),t.updateMatrixWorld(),fo.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(fo,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===es||t.reversedDepth?i.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(fo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const Hs=new O,Vs=new Yn,Sn=new O;class lh extends ht{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ve,this.projectionMatrix=new Ve,this.projectionMatrixInverse=new Ve,this.coordinateSystem=Cn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Hs,Vs,Sn),Sn.x===1&&Sn.y===1&&Sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Hs,Vs,Sn.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(Hs,Vs,Sn),Sn.x===1&&Sn.y===1&&Sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Hs,Vs,Sn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const oi=new O,Td=new ke,Ed=new ke;class $t extends lh{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=xr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan($r*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return xr*2*Math.atan(Math.tan($r*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){oi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(oi.x,oi.y).multiplyScalar(-e/oi.z),oi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(oi.x,oi.y).multiplyScalar(-e/oi.z)}getViewSize(e,t){return this.getViewBounds(e,Td,Ed),t.subVectors(Ed,Td)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan($r*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*i/c,r*=a.width/l,i*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class n0 extends ic{constructor(){super(new $t(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){const t=this.camera,i=xr*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,s=e.distance||t.far;(i!==t.fov||r!==t.aspect||s!==t.far)&&(t.fov=i,t.aspect=r,t.far=s,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class i0 extends ba{constructor(e,t,i=0,r=Math.PI/3,s=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ht.DEFAULT_UP),this.updateMatrix(),this.target=new ht,this.distance=i,this.angle=r,this.penumbra=s,this.decay=a,this.map=null,this.shadow=new n0}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}}class r0 extends ic{constructor(){super(new $t(90,1,.5,500)),this.isPointLightShadow=!0}}class fi extends ba{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new r0}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}}class cs extends lh{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,a=i+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=d*this.view.offsetY,l=o-d*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class s0 extends ic{constructor(){super(new cs(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class ch extends ba{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ht.DEFAULT_UP),this.updateMatrix(),this.target=new ht,this.shadow=new s0}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}class Yr{static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}const po=new WeakMap;class a0 extends Ar{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&Ae("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&Ae("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=this,a=Hn.get(`image-bitmap:${e}`);if(a!==void 0){if(s.manager.itemStart(e),a.then){a.then(c=>{po.has(a)===!0?(r&&r(po.get(a)),s.manager.itemError(e),s.manager.itemEnd(e)):(t&&t(c),s.manager.itemEnd(e))});return}setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0);return}const o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader,o.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;const l=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(s.options,{colorSpaceConversion:"none"}))}).then(function(c){Hn.add(`image-bitmap:${e}`,c),t&&t(c),s.manager.itemEnd(e)}).catch(function(c){r&&r(c),po.set(l,c),Hn.remove(`image-bitmap:${e}`),s.manager.itemError(e),s.manager.itemEnd(e)});Hn.add(`image-bitmap:${e}`,l),s.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const rr=-90,sr=1;class o0 extends ht{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new $t(rr,sr,e,t);r.layers=this.layers,this.add(r);const s=new $t(rr,sr,e,t);s.layers=this.layers,this.add(s);const a=new $t(rr,sr,e,t);a.layers=this.layers,this.add(a);const o=new $t(rr,sr,e,t);o.layers=this.layers,this.add(o);const l=new $t(rr,sr,e,t);l.layers=this.layers,this.add(l);const c=new $t(rr,sr,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===Cn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===es)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,d]=this.children,u=e.getRenderTarget(),h=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const v=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=v,e.setRenderTarget(i,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,d),e.setRenderTarget(u,h,f),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class l0 extends $t{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const rc="\\[\\]\\.:\\/",c0=new RegExp("["+rc+"]","g"),sc="[^"+rc+"]",d0="[^"+rc.replace("\\.","")+"]",u0=/((?:WC+[\/:])*)/.source.replace("WC",sc),h0=/(WCOD+)?/.source.replace("WCOD",d0),f0=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",sc),p0=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",sc),m0=new RegExp("^"+u0+h0+f0+p0+"$"),g0=["material","materials","bones","map"];class _0{constructor(e,t,i){const r=i||rt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();const i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){const i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}}class rt{constructor(e,t,i){this.path=t,this.parsedPath=i||rt.parseTrackName(t),this.node=rt.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new rt.Composite(e,t,i):new rt(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(c0,"")}static parseTrackName(e){const t=m0.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);const i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){const s=i.nodeName.substring(r+1);g0.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){const i=function(s){for(let a=0;a<s.length;a++){const o=s[a];if(o.name===t||o.uuid===t)return o;const l=i(o.children);if(l)return l}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,i=t.objectName,r=t.propertyName;let s=t.propertyIndex;if(e||(e=rt.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ae("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){Oe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Oe("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Oe("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let d=0;d<e.length;d++)if(e[d].name===c){c=d;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Oe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Oe("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Oe("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){Oe("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}const a=e[r];if(a===void 0){const c=t.nodeName;Oe("PropertyBinding: Trying to update property for track: "+c+"."+r+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){Oe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Oe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=r;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}rt.Composite=_0;rt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};rt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};rt.prototype.GetterByBindingType=[rt.prototype._getValue_direct,rt.prototype._getValue_array,rt.prototype._getValue_arrayElement,rt.prototype._getValue_toArray];rt.prototype.SetterByBindingTypeAndVersioning=[[rt.prototype._setValue_direct,rt.prototype._setValue_direct_setNeedsUpdate,rt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[rt.prototype._setValue_array,rt.prototype._setValue_array_setNeedsUpdate,rt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[rt.prototype._setValue_arrayElement,rt.prototype._setValue_arrayElement_setNeedsUpdate,rt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[rt.prototype._setValue_fromArray,rt.prototype._setValue_fromArray_setNeedsUpdate,rt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];const dc=class dc{constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){const s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}};dc.prototype.isMatrix2=!0;let wd=dc;function Ad(n,e,t,i){const r=v0(i);switch(t){case Hu:return n*e;case Hl:return n*e/r.components*r.byteLength;case Vl:return n*e/r.components*r.byteLength;case Ui:return n*e*2/r.components*r.byteLength;case Wl:return n*e*2/r.components*r.byteLength;case Vu:return n*e*3/r.components*r.byteLength;case on:return n*e*4/r.components*r.byteLength;case Xl:return n*e*4/r.components*r.byteLength;case Js:case Qs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case js:case ea:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case zo:case Ho:return Math.max(n,16)*Math.max(e,8)/4;case Bo:case Go:return Math.max(n,8)*Math.max(e,8)/2;case Vo:case Wo:case qo:case $o:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Xo:case aa:case Ko:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Yo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Zo:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Jo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Qo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case jo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case el:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case tl:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case nl:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case il:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case rl:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case sl:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case al:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case ol:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case ll:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case cl:case dl:case ul:return Math.ceil(n/4)*Math.ceil(e/4)*16;case hl:case fl:return Math.ceil(n/4)*Math.ceil(e/4)*8;case oa:case pl:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function v0(n){switch(n){case Qt:case ku:return{byteLength:1,components:1};case Zr:case Bu:case qn:return{byteLength:2,components:1};case zl:case Gl:return{byteLength:2,components:4};case Pn:case Bl:case an:return{byteLength:4,components:1};case zu:case Gu:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ol}}));typeof window<"u"&&(window.__THREE__?Ae("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ol);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function dh(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function y0(n){const e=new WeakMap;function t(o,l){const c=o.array,d=o.usage,u=c.byteLength,h=n.createBuffer();n.bindBuffer(l,h),n.bufferData(l,c,d),o.onUploadCallback();let f;if(c instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=n.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=n.SHORT;else if(c instanceof Uint32Array)f=n.UNSIGNED_INT;else if(c instanceof Int32Array)f=n.INT;else if(c instanceof Int8Array)f=n.BYTE;else if(c instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function i(o,l,c){const d=l.array,u=l.updateRanges;if(n.bindBuffer(c,o),u.length===0)n.bufferSubData(c,0,d);else{u.sort((f,g)=>f.start-g.start);let h=0;for(let f=1;f<u.length;f++){const g=u[h],v=u[f];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++h,u[h]=v)}u.length=h+1;for(let f=0,g=u.length;f<g;f++){const v=u[f];n.bufferSubData(c,v.start*d.BYTES_PER_ELEMENT,d,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(n.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const d=e.get(o);(!d||d.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var M0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,x0=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,b0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,S0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,T0=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,E0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,w0=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,A0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,R0=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,C0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,I0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,P0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,L0=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,D0=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,N0=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,U0=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,F0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,O0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,k0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,B0=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,z0=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,G0=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,H0=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,V0=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,W0=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,X0=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,q0=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,$0=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,K0=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Y0=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Z0="gl_FragColor = linearToOutputTexel( gl_FragColor );",J0=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Q0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,j0=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,e_=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,t_=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,n_=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,i_=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,r_=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,s_=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,a_=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,o_=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,l_=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,c_=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,d_=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,u_=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,h_=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,f_=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,p_=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,m_=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,g_=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,__=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,v_=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,y_=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,M_=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,x_=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,b_=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,S_=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,T_=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,E_=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,w_=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,A_=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,R_=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,C_=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,I_=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,P_=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,L_=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,D_=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,N_=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,U_=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,F_=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,O_=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,k_=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,B_=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,z_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,G_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,H_=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,V_=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,W_=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,X_=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,q_=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,$_=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,K_=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Y_=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Z_=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,J_=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Q_=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,j_=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,ev=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,tv=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,nv=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,iv=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,rv=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,sv=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,av=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ov=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,lv=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,cv=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,dv=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,uv=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,hv=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,fv=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,pv=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,mv=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,gv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,_v=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,vv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,yv=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Mv=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,xv=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,bv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Sv=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ev=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Av=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Rv=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Cv=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Iv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Pv=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Lv=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Dv=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Nv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Uv=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Fv=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ov=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,kv=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Bv=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zv=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Gv=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Hv=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Vv=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Wv=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Xv=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qv=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$v=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Kv=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Yv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Zv=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Jv=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Qv=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,jv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,qe={alphahash_fragment:M0,alphahash_pars_fragment:x0,alphamap_fragment:b0,alphamap_pars_fragment:S0,alphatest_fragment:T0,alphatest_pars_fragment:E0,aomap_fragment:w0,aomap_pars_fragment:A0,batching_pars_vertex:R0,batching_vertex:C0,begin_vertex:I0,beginnormal_vertex:P0,bsdfs:L0,iridescence_fragment:D0,bumpmap_pars_fragment:N0,clipping_planes_fragment:U0,clipping_planes_pars_fragment:F0,clipping_planes_pars_vertex:O0,clipping_planes_vertex:k0,color_fragment:B0,color_pars_fragment:z0,color_pars_vertex:G0,color_vertex:H0,common:V0,cube_uv_reflection_fragment:W0,defaultnormal_vertex:X0,displacementmap_pars_vertex:q0,displacementmap_vertex:$0,emissivemap_fragment:K0,emissivemap_pars_fragment:Y0,colorspace_fragment:Z0,colorspace_pars_fragment:J0,envmap_fragment:Q0,envmap_common_pars_fragment:j0,envmap_pars_fragment:e_,envmap_pars_vertex:t_,envmap_physical_pars_fragment:h_,envmap_vertex:n_,fog_vertex:i_,fog_pars_vertex:r_,fog_fragment:s_,fog_pars_fragment:a_,gradientmap_pars_fragment:o_,lightmap_pars_fragment:l_,lights_lambert_fragment:c_,lights_lambert_pars_fragment:d_,lights_pars_begin:u_,lights_toon_fragment:f_,lights_toon_pars_fragment:p_,lights_phong_fragment:m_,lights_phong_pars_fragment:g_,lights_physical_fragment:__,lights_physical_pars_fragment:v_,lights_fragment_begin:y_,lights_fragment_maps:M_,lights_fragment_end:x_,lightprobes_pars_fragment:b_,logdepthbuf_fragment:S_,logdepthbuf_pars_fragment:T_,logdepthbuf_pars_vertex:E_,logdepthbuf_vertex:w_,map_fragment:A_,map_pars_fragment:R_,map_particle_fragment:C_,map_particle_pars_fragment:I_,metalnessmap_fragment:P_,metalnessmap_pars_fragment:L_,morphinstance_vertex:D_,morphcolor_vertex:N_,morphnormal_vertex:U_,morphtarget_pars_vertex:F_,morphtarget_vertex:O_,normal_fragment_begin:k_,normal_fragment_maps:B_,normal_pars_fragment:z_,normal_pars_vertex:G_,normal_vertex:H_,normalmap_pars_fragment:V_,clearcoat_normal_fragment_begin:W_,clearcoat_normal_fragment_maps:X_,clearcoat_pars_fragment:q_,iridescence_pars_fragment:$_,opaque_fragment:K_,packing:Y_,premultiplied_alpha_fragment:Z_,project_vertex:J_,dithering_fragment:Q_,dithering_pars_fragment:j_,roughnessmap_fragment:ev,roughnessmap_pars_fragment:tv,shadowmap_pars_fragment:nv,shadowmap_pars_vertex:iv,shadowmap_vertex:rv,shadowmask_pars_fragment:sv,skinbase_vertex:av,skinning_pars_vertex:ov,skinning_vertex:lv,skinnormal_vertex:cv,specularmap_fragment:dv,specularmap_pars_fragment:uv,tonemapping_fragment:hv,tonemapping_pars_fragment:fv,transmission_fragment:pv,transmission_pars_fragment:mv,uv_pars_fragment:gv,uv_pars_vertex:_v,uv_vertex:vv,worldpos_vertex:yv,background_vert:Mv,background_frag:xv,backgroundCube_vert:bv,backgroundCube_frag:Sv,cube_vert:Tv,cube_frag:Ev,depth_vert:wv,depth_frag:Av,distance_vert:Rv,distance_frag:Cv,equirect_vert:Iv,equirect_frag:Pv,linedashed_vert:Lv,linedashed_frag:Dv,meshbasic_vert:Nv,meshbasic_frag:Uv,meshlambert_vert:Fv,meshlambert_frag:Ov,meshmatcap_vert:kv,meshmatcap_frag:Bv,meshnormal_vert:zv,meshnormal_frag:Gv,meshphong_vert:Hv,meshphong_frag:Vv,meshphysical_vert:Wv,meshphysical_frag:Xv,meshtoon_vert:qv,meshtoon_frag:$v,points_vert:Kv,points_frag:Yv,shadow_vert:Zv,shadow_frag:Jv,sprite_vert:Qv,sprite_frag:jv},ye={common:{diffuse:{value:new De(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ge},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ge}},envmap:{envMap:{value:null},envMapRotation:{value:new Ge},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ge}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ge}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ge},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ge},normalScale:{value:new ke(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ge},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ge}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ge}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ge}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new De(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new O},probesMax:{value:new O},probesResolution:{value:new O}},points:{diffuse:{value:new De(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0},uvTransform:{value:new Ge}},sprite:{diffuse:{value:new De(16777215)},opacity:{value:1},center:{value:new ke(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ge},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0}}},wn={basic:{uniforms:qt([ye.common,ye.specularmap,ye.envmap,ye.aomap,ye.lightmap,ye.fog]),vertexShader:qe.meshbasic_vert,fragmentShader:qe.meshbasic_frag},lambert:{uniforms:qt([ye.common,ye.specularmap,ye.envmap,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.fog,ye.lights,{emissive:{value:new De(0)},envMapIntensity:{value:1}}]),vertexShader:qe.meshlambert_vert,fragmentShader:qe.meshlambert_frag},phong:{uniforms:qt([ye.common,ye.specularmap,ye.envmap,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.fog,ye.lights,{emissive:{value:new De(0)},specular:{value:new De(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:qe.meshphong_vert,fragmentShader:qe.meshphong_frag},standard:{uniforms:qt([ye.common,ye.envmap,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.roughnessmap,ye.metalnessmap,ye.fog,ye.lights,{emissive:{value:new De(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:qe.meshphysical_vert,fragmentShader:qe.meshphysical_frag},toon:{uniforms:qt([ye.common,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.gradientmap,ye.fog,ye.lights,{emissive:{value:new De(0)}}]),vertexShader:qe.meshtoon_vert,fragmentShader:qe.meshtoon_frag},matcap:{uniforms:qt([ye.common,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.fog,{matcap:{value:null}}]),vertexShader:qe.meshmatcap_vert,fragmentShader:qe.meshmatcap_frag},points:{uniforms:qt([ye.points,ye.fog]),vertexShader:qe.points_vert,fragmentShader:qe.points_frag},dashed:{uniforms:qt([ye.common,ye.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:qe.linedashed_vert,fragmentShader:qe.linedashed_frag},depth:{uniforms:qt([ye.common,ye.displacementmap]),vertexShader:qe.depth_vert,fragmentShader:qe.depth_frag},normal:{uniforms:qt([ye.common,ye.bumpmap,ye.normalmap,ye.displacementmap,{opacity:{value:1}}]),vertexShader:qe.meshnormal_vert,fragmentShader:qe.meshnormal_frag},sprite:{uniforms:qt([ye.sprite,ye.fog]),vertexShader:qe.sprite_vert,fragmentShader:qe.sprite_frag},background:{uniforms:{uvTransform:{value:new Ge},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:qe.background_vert,fragmentShader:qe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ge}},vertexShader:qe.backgroundCube_vert,fragmentShader:qe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:qe.cube_vert,fragmentShader:qe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:qe.equirect_vert,fragmentShader:qe.equirect_frag},distance:{uniforms:qt([ye.common,ye.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:qe.distance_vert,fragmentShader:qe.distance_frag},shadow:{uniforms:qt([ye.lights,ye.fog,{color:{value:new De(0)},opacity:{value:1}}]),vertexShader:qe.shadow_vert,fragmentShader:qe.shadow_frag}};wn.physical={uniforms:qt([wn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ge},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ge},clearcoatNormalScale:{value:new ke(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ge},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ge},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ge},sheen:{value:0},sheenColor:{value:new De(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ge},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ge},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ge},transmissionSamplerSize:{value:new ke},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ge},attenuationDistance:{value:0},attenuationColor:{value:new De(0)},specularColor:{value:new De(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ge},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ge},anisotropyVector:{value:new ke},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ge}}]),vertexShader:qe.meshphysical_vert,fragmentShader:qe.meshphysical_frag};const Ws={r:0,b:0,g:0},ey=new Ve,uh=new Ge;uh.set(-1,0,0,0,1,0,0,0,1);function ty(n,e,t,i,r,s){const a=new De(0);let o=r===!0?0:1,l,c,d=null,u=0,h=null;function f(w){let A=w.isScene===!0?w.background:null;if(A&&A.isTexture){const M=w.backgroundBlurriness>0;A=e.get(A,M)}return A}function g(w){let A=!1;const M=f(w);M===null?m(a,o):M&&M.isColor&&(m(M,1),A=!0);const b=n.xr.getEnvironmentBlendMode();b==="additive"?t.buffers.color.setClear(0,0,0,1,s):b==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||A)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function v(w,A){const M=f(A);M&&(M.isCubeTexture||M.mapping===ya)?(c===void 0&&(c=new me(new je(1,1,1),new Ln({name:"BackgroundCubeMaterial",uniforms:Sr(wn.backgroundCube.uniforms),vertexShader:wn.backgroundCube.vertexShader,fragmentShader:wn.backgroundCube.fragmentShader,side:Kt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(b,R,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=M,c.material.uniforms.backgroundBlurriness.value=A.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(ey.makeRotationFromEuler(A.backgroundRotation)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(uh),c.material.toneMapped=Ye.getTransfer(M.colorSpace)!==nt,(d!==M||u!==M.version||h!==n.toneMapping)&&(c.material.needsUpdate=!0,d=M,u=M.version,h=n.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null)):M&&M.isTexture&&(l===void 0&&(l=new me(new ls(2,2),new Ln({name:"BackgroundMaterial",uniforms:Sr(wn.background.uniforms),vertexShader:wn.background.vertexShader,fragmentShader:wn.background.fragmentShader,side:Xn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=M,l.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,l.material.toneMapped=Ye.getTransfer(M.colorSpace)!==nt,M.matrixAutoUpdate===!0&&M.updateMatrix(),l.material.uniforms.uvTransform.value.copy(M.matrix),(d!==M||u!==M.version||h!==n.toneMapping)&&(l.material.needsUpdate=!0,d=M,u=M.version,h=n.toneMapping),l.layers.enableAll(),w.unshift(l,l.geometry,l.material,0,0,null))}function m(w,A){w.getRGB(Ws,sh(n)),t.buffers.color.setClear(Ws.r,Ws.g,Ws.b,A,s)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(w,A=1){a.set(w),o=A,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(w){o=w,m(a,o)},render:g,addToRenderList:v,dispose:p}}function ny(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=h(null);let s=r,a=!1;function o(D,U,V,J,I){let L=!1;const z=u(D,J,V,U);s!==z&&(s=z,c(s.object)),L=f(D,J,V,I),L&&g(D,J,V,I),I!==null&&e.update(I,n.ELEMENT_ARRAY_BUFFER),(L||a)&&(a=!1,M(D,U,V,J),I!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(I).buffer))}function l(){return n.createVertexArray()}function c(D){return n.bindVertexArray(D)}function d(D){return n.deleteVertexArray(D)}function u(D,U,V,J){const I=J.wireframe===!0;let L=i[U.id];L===void 0&&(L={},i[U.id]=L);const z=D.isInstancedMesh===!0?D.id:0;let K=L[z];K===void 0&&(K={},L[z]=K);let ie=K[V.id];ie===void 0&&(ie={},K[V.id]=ie);let Q=ie[I];return Q===void 0&&(Q=h(l()),ie[I]=Q),Q}function h(D){const U=[],V=[],J=[];for(let I=0;I<t;I++)U[I]=0,V[I]=0,J[I]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:V,attributeDivisors:J,object:D,attributes:{},index:null}}function f(D,U,V,J){const I=s.attributes,L=U.attributes;let z=0;const K=V.getAttributes();for(const ie in K)if(K[ie].location>=0){const se=I[ie];let ce=L[ie];if(ce===void 0&&(ie==="instanceMatrix"&&D.instanceMatrix&&(ce=D.instanceMatrix),ie==="instanceColor"&&D.instanceColor&&(ce=D.instanceColor)),se===void 0||se.attribute!==ce||ce&&se.data!==ce.data)return!0;z++}return s.attributesNum!==z||s.index!==J}function g(D,U,V,J){const I={},L=U.attributes;let z=0;const K=V.getAttributes();for(const ie in K)if(K[ie].location>=0){let se=L[ie];se===void 0&&(ie==="instanceMatrix"&&D.instanceMatrix&&(se=D.instanceMatrix),ie==="instanceColor"&&D.instanceColor&&(se=D.instanceColor));const ce={};ce.attribute=se,se&&se.data&&(ce.data=se.data),I[ie]=ce,z++}s.attributes=I,s.attributesNum=z,s.index=J}function v(){const D=s.newAttributes;for(let U=0,V=D.length;U<V;U++)D[U]=0}function m(D){p(D,0)}function p(D,U){const V=s.newAttributes,J=s.enabledAttributes,I=s.attributeDivisors;V[D]=1,J[D]===0&&(n.enableVertexAttribArray(D),J[D]=1),I[D]!==U&&(n.vertexAttribDivisor(D,U),I[D]=U)}function w(){const D=s.newAttributes,U=s.enabledAttributes;for(let V=0,J=U.length;V<J;V++)U[V]!==D[V]&&(n.disableVertexAttribArray(V),U[V]=0)}function A(D,U,V,J,I,L,z){z===!0?n.vertexAttribIPointer(D,U,V,I,L):n.vertexAttribPointer(D,U,V,J,I,L)}function M(D,U,V,J){v();const I=J.attributes,L=V.getAttributes(),z=U.defaultAttributeValues;for(const K in L){const ie=L[K];if(ie.location>=0){let Q=I[K];if(Q===void 0&&(K==="instanceMatrix"&&D.instanceMatrix&&(Q=D.instanceMatrix),K==="instanceColor"&&D.instanceColor&&(Q=D.instanceColor)),Q!==void 0){const se=Q.normalized,ce=Q.itemSize,Be=e.get(Q);if(Be===void 0)continue;const We=Be.buffer,ze=Be.type,te=Be.bytesPerElement,fe=ze===n.INT||ze===n.UNSIGNED_INT||Q.gpuType===Bl;if(Q.isInterleavedBufferAttribute){const le=Q.data,Ie=le.stride,Ne=Q.offset;if(le.isInstancedInterleavedBuffer){for(let Le=0;Le<ie.locationSize;Le++)p(ie.location+Le,le.meshPerAttribute);D.isInstancedMesh!==!0&&J._maxInstanceCount===void 0&&(J._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let Le=0;Le<ie.locationSize;Le++)m(ie.location+Le);n.bindBuffer(n.ARRAY_BUFFER,We);for(let Le=0;Le<ie.locationSize;Le++)A(ie.location+Le,ce/ie.locationSize,ze,se,Ie*te,(Ne+ce/ie.locationSize*Le)*te,fe)}else{if(Q.isInstancedBufferAttribute){for(let le=0;le<ie.locationSize;le++)p(ie.location+le,Q.meshPerAttribute);D.isInstancedMesh!==!0&&J._maxInstanceCount===void 0&&(J._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let le=0;le<ie.locationSize;le++)m(ie.location+le);n.bindBuffer(n.ARRAY_BUFFER,We);for(let le=0;le<ie.locationSize;le++)A(ie.location+le,ce/ie.locationSize,ze,se,ce*te,ce/ie.locationSize*le*te,fe)}}else if(z!==void 0){const se=z[K];if(se!==void 0)switch(se.length){case 2:n.vertexAttrib2fv(ie.location,se);break;case 3:n.vertexAttrib3fv(ie.location,se);break;case 4:n.vertexAttrib4fv(ie.location,se);break;default:n.vertexAttrib1fv(ie.location,se)}}}}w()}function b(){C();for(const D in i){const U=i[D];for(const V in U){const J=U[V];for(const I in J){const L=J[I];for(const z in L)d(L[z].object),delete L[z];delete J[I]}}delete i[D]}}function R(D){if(i[D.id]===void 0)return;const U=i[D.id];for(const V in U){const J=U[V];for(const I in J){const L=J[I];for(const z in L)d(L[z].object),delete L[z];delete J[I]}}delete i[D.id]}function E(D){for(const U in i){const V=i[U];for(const J in V){const I=V[J];if(I[D.id]===void 0)continue;const L=I[D.id];for(const z in L)d(L[z].object),delete L[z];delete I[D.id]}}}function y(D){for(const U in i){const V=i[U],J=D.isInstancedMesh===!0?D.id:0,I=V[J];if(I!==void 0){for(const L in I){const z=I[L];for(const K in z)d(z[K].object),delete z[K];delete I[L]}delete V[J],Object.keys(V).length===0&&delete i[U]}}}function C(){P(),a=!0,s!==r&&(s=r,c(s.object))}function P(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:C,resetDefaultState:P,dispose:b,releaseStatesOfGeometry:R,releaseStatesOfObject:y,releaseStatesOfProgram:E,initAttributes:v,enableAttribute:m,disableUnusedAttributes:w}}function iy(n,e,t){let i;function r(l){i=l}function s(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function a(l,c,d){d!==0&&(n.drawArraysInstanced(i,l,c,d),t.update(c,i,d))}function o(l,c,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,d);let h=0;for(let f=0;f<d;f++)h+=c[f];t.update(h,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function ry(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const E=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(E){return!(E!==on&&i.convert(E)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(E){const y=E===qn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(E!==Qt&&i.convert(E)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&E!==an&&!y)}function l(E){if(E==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const d=l(c);d!==c&&(Ae("WebGLRenderer:",c,"not supported, using",d,"instead."),c=d);const u=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&h===!1&&Ae("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),w=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),A=n.getParameter(n.MAX_VARYING_VECTORS),M=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),b=n.getParameter(n.MAX_SAMPLES),R=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:h,maxTextures:f,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:w,maxVaryings:A,maxFragmentUniforms:M,maxSamples:b,samples:R}}function sy(n){const e=this;let t=null,i=0,r=!1,s=!1;const a=new Ai,o=new Ge,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,h){const f=u.length!==0||h||i!==0||r;return r=h,i=u.length,f},this.beginShadows=function(){s=!0,d(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,h){t=d(u,h,0)},this.setState=function(u,h,f){const g=u.clippingPlanes,v=u.clipIntersection,m=u.clipShadows,p=n.get(u);if(!r||g===null||g.length===0||s&&!m)s?d(null):c();else{const w=s?0:i,A=w*4;let M=p.clippingState||null;l.value=M,M=d(g,h,A,f);for(let b=0;b!==A;++b)M[b]=t[b];p.clippingState=M,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=w}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function d(u,h,f,g){const v=u!==null?u.length:0;let m=null;if(v!==0){if(m=l.value,g!==!0||m===null){const p=f+v*4,w=h.matrixWorldInverse;o.getNormalMatrix(w),(m===null||m.length<p)&&(m=new Float32Array(p));for(let A=0,M=f;A!==v;++A,M+=4)a.copy(u[A]).applyMatrix4(w,o),a.normal.toArray(m,M),m[M+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,m}}const gi=4,Rd=[.125,.215,.35,.446,.526,.582],Ci=20,ay=256,zr=new cs,Cd=new De;let mo=null,go=0,_o=0,vo=!1;const oy=new O;class Id{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){const{size:a=256,position:o=oy}=s;mo=this._renderer.getRenderTarget(),go=this._renderer.getActiveCubeFace(),_o=this._renderer.getActiveMipmapLevel(),vo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Dd(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ld(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(mo,go,_o),this._renderer.xr.enabled=vo,e.scissorTest=!1,ar(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ni||e.mapping===yr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),mo=this._renderer.getRenderTarget(),go=this._renderer.getActiveCubeFace(),_o=this._renderer.getActiveMipmapLevel(),vo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:At,minFilter:At,generateMipmaps:!1,type:qn,format:on,colorSpace:en,depthBuffer:!1},r=Pd(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Pd(e,t,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=ly(s)),this._blurMaterial=dy(s,e,t),this._ggxMaterial=cy(s,e,t)}return r}_compileMaterial(e){const t=new me(new Ot,e);this._renderer.compile(t,zr)}_sceneToCubeUV(e,t,i,r,s){const l=new $t(90,1,t,i),c=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,f=u.toneMapping;u.getClearColor(Cd),u.toneMapping=mn,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(r),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new me(new je,new Di({name:"PMREM.Background",side:Kt,depthWrite:!1,depthTest:!1})));const v=this._backgroundBox,m=v.material;let p=!1;const w=e.background;w?w.isColor&&(m.color.copy(w),e.background=null,p=!0):(m.color.copy(Cd),p=!0);for(let A=0;A<6;A++){const M=A%3;M===0?(l.up.set(0,c[A],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+d[A],s.y,s.z)):M===1?(l.up.set(0,0,c[A]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+d[A],s.z)):(l.up.set(0,c[A],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+d[A]));const b=this._cubeSize;ar(r,M*b,A>2?b:0,b,b),u.setRenderTarget(r),p&&u.render(v,l),u.render(e,l)}u.toneMapping=f,u.autoClear=h,e.background=w}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===Ni||e.mapping===yr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Dd()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ld());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;ar(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,zr)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;const l=a.uniforms,c=i/(this._lodMeshes.length-1),d=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-d*d),h=0+c*1.25,f=u*h,{_lodMax:g}=this,v=this._sizeLods[i],m=3*v*(i>g-gi?i-g+gi:0),p=4*(this._cubeSize-v);l.envMap.value=e.texture,l.roughness.value=f,l.mipInt.value=g-t,ar(s,m,p,3*v,2*v),r.setRenderTarget(s),r.render(o,zr),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=g-i,ar(e,m,p,3*v,2*v),r.setRenderTarget(e),r.render(o,zr)}_blur(e,t,i,r,s){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Oe("blur direction must be either latitudinal or longitudinal!");const d=3,u=this._lodMeshes[r];u.material=c;const h=c.uniforms,f=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*Ci-1),v=s/g,m=isFinite(s)?1+Math.floor(d*v):Ci;m>Ci&&Ae(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ci}`);const p=[];let w=0;for(let E=0;E<Ci;++E){const y=E/v,C=Math.exp(-y*y/2);p.push(C),E===0?w+=C:E<m&&(w+=2*C)}for(let E=0;E<p.length;E++)p[E]=p[E]/w;h.envMap.value=e.texture,h.samples.value=m,h.weights.value=p,h.latitudinal.value=a==="latitudinal",o&&(h.poleAxis.value=o);const{_lodMax:A}=this;h.dTheta.value=g,h.mipInt.value=A-i;const M=this._sizeLods[r],b=3*M*(r>A-gi?r-A+gi:0),R=4*(this._cubeSize-M);ar(t,b,R,3*M,2*M),l.setRenderTarget(t),l.render(u,zr)}}function ly(n){const e=[],t=[],i=[];let r=n;const s=n-gi+1+Rd.length;for(let a=0;a<s;a++){const o=Math.pow(2,r);e.push(o);let l=1/o;a>n-gi?l=Rd[a-n+gi-1]:a===0&&(l=0),t.push(l);const c=1/(o-2),d=-c,u=1+c,h=[d,d,u,d,u,u,d,d,u,u,d,u],f=6,g=6,v=3,m=2,p=1,w=new Float32Array(v*g*f),A=new Float32Array(m*g*f),M=new Float32Array(p*g*f);for(let R=0;R<f;R++){const E=R%3*2/3-1,y=R>2?0:-1,C=[E,y,0,E+2/3,y,0,E+2/3,y+1,0,E,y,0,E+2/3,y+1,0,E,y+1,0];w.set(C,v*g*R),A.set(h,m*g*R);const P=[R,R,R,R,R,R];M.set(P,p*g*R)}const b=new Ot;b.setAttribute("position",new zt(w,v)),b.setAttribute("uv",new zt(A,m)),b.setAttribute("faceIndex",new zt(M,p)),i.push(new me(b,null)),r>gi&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function Pd(n,e,t){const i=new In(n,e,t);return i.texture.mapping=ya,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ar(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function cy(n,e,t){return new Ln({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:ay,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Sa(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function dy(n,e,t){const i=new Float32Array(Ci),r=new O(0,1,0);return new Ln({name:"SphericalGaussianBlur",defines:{n:Ci,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Sa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Ld(){return new Ln({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Sa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Dd(){return new Ln({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Sa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Sa(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class hh extends In{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new ih(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new je(5,5,5),s=new Ln({name:"CubemapFromEquirect",uniforms:Sr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Kt,blending:Vn});s.uniforms.tEquirect.value=t;const a=new me(r,s),o=t.minFilter;return t.minFilter===Gn&&(t.minFilter=At),new o0(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}}function uy(n){let e=new WeakMap,t=new WeakMap,i=null;function r(h,f=!1){return h==null?null:f?a(h):s(h)}function s(h){if(h&&h.isTexture){const f=h.mapping;if(f===Oa||f===ka)if(e.has(h)){const g=e.get(h).texture;return o(g,h.mapping)}else{const g=h.image;if(g&&g.height>0){const v=new hh(g.height);return v.fromEquirectangularTexture(n,h),e.set(h,v),h.addEventListener("dispose",c),o(v.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture){const f=h.mapping,g=f===Oa||f===ka,v=f===Ni||f===yr;if(g||v){let m=t.get(h);const p=m!==void 0?m.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==p)return i===null&&(i=new Id(n)),m=g?i.fromEquirectangular(h,m):i.fromCubemap(h,m),m.texture.pmremVersion=h.pmremVersion,t.set(h,m),m.texture;if(m!==void 0)return m.texture;{const w=h.image;return g&&w&&w.height>0||v&&w&&l(w)?(i===null&&(i=new Id(n)),m=g?i.fromEquirectangular(h):i.fromCubemap(h),m.texture.pmremVersion=h.pmremVersion,t.set(h,m),h.addEventListener("dispose",d),m.texture):null}}}return h}function o(h,f){return f===Oa?h.mapping=Ni:f===ka&&(h.mapping=yr),h}function l(h){let f=0;const g=6;for(let v=0;v<g;v++)h[v]!==void 0&&f++;return f===g}function c(h){const f=h.target;f.removeEventListener("dispose",c);const g=e.get(f);g!==void 0&&(e.delete(f),g.dispose())}function d(h){const f=h.target;f.removeEventListener("dispose",d);const g=t.get(f);g!==void 0&&(t.delete(f),g.dispose())}function u(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:u}}function hy(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&hr("WebGLRenderer: "+i+" extension not supported."),r}}}function fy(n,e,t,i){const r={},s=new WeakMap;function a(u){const h=u.target;h.index!==null&&e.remove(h.index);for(const g in h.attributes)e.remove(h.attributes[g]);h.removeEventListener("dispose",a),delete r[h.id];const f=s.get(h);f&&(e.remove(f),s.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function o(u,h){return r[h.id]===!0||(h.addEventListener("dispose",a),r[h.id]=!0,t.memory.geometries++),h}function l(u){const h=u.attributes;for(const f in h)e.update(h[f],n.ARRAY_BUFFER)}function c(u){const h=[],f=u.index,g=u.attributes.position;let v=0;if(g===void 0)return;if(f!==null){const w=f.array;v=f.version;for(let A=0,M=w.length;A<M;A+=3){const b=w[A+0],R=w[A+1],E=w[A+2];h.push(b,R,R,E,E,b)}}else{const w=g.array;v=g.version;for(let A=0,M=w.length/3-1;A<M;A+=3){const b=A+0,R=A+1,E=A+2;h.push(b,R,R,E,E,b)}}const m=new(g.count>=65535?Zu:Yu)(h,1);m.version=v;const p=s.get(u);p&&e.remove(p),s.set(u,m)}function d(u){const h=s.get(u);if(h){const f=u.index;f!==null&&h.version<f.version&&c(u)}else c(u);return s.get(u)}return{get:o,update:l,getWireframeAttribute:d}}function py(n,e,t){let i;function r(u){i=u}let s,a;function o(u){s=u.type,a=u.bytesPerElement}function l(u,h){n.drawElements(i,h,s,u*a),t.update(h,i,1)}function c(u,h,f){f!==0&&(n.drawElementsInstanced(i,h,s,u*a,f),t.update(h,i,f))}function d(u,h,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,s,u,0,f);let v=0;for(let m=0;m<f;m++)v+=h[m];t.update(v,i,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=d}function my(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:Oe("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function gy(n,e,t){const i=new WeakMap,r=new ot;function s(a,o,l){const c=a.morphTargetInfluences,d=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=d!==void 0?d.length:0;let h=i.get(o);if(h===void 0||h.count!==u){let C=function(){E.dispose(),i.delete(o),o.removeEventListener("dispose",C)};h!==void 0&&h.texture.dispose();const f=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,v=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],w=o.morphAttributes.color||[];let A=0;f===!0&&(A=1),g===!0&&(A=2),v===!0&&(A=3);let M=o.attributes.position.count*A,b=1;M>e.maxTextureSize&&(b=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);const R=new Float32Array(M*b*4*u),E=new qu(R,M,b,u);E.type=an,E.needsUpdate=!0;const y=A*4;for(let P=0;P<u;P++){const D=m[P],U=p[P],V=w[P],J=M*b*4*P;for(let I=0;I<D.count;I++){const L=I*y;f===!0&&(r.fromBufferAttribute(D,I),R[J+L+0]=r.x,R[J+L+1]=r.y,R[J+L+2]=r.z,R[J+L+3]=0),g===!0&&(r.fromBufferAttribute(U,I),R[J+L+4]=r.x,R[J+L+5]=r.y,R[J+L+6]=r.z,R[J+L+7]=0),v===!0&&(r.fromBufferAttribute(V,I),R[J+L+8]=r.x,R[J+L+9]=r.y,R[J+L+10]=r.z,R[J+L+11]=V.itemSize===4?r.w:1)}}h={count:u,texture:E,size:new ke(M,b)},i.set(o,h),o.addEventListener("dispose",C)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let f=0;for(let v=0;v<c.length;v++)f+=c[v];const g=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(n,"morphTargetBaseInfluence",g),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",h.size)}return{update:s}}function _y(n,e,t,i,r){let s=new WeakMap;function a(c){const d=r.render.frame,u=c.geometry,h=e.get(c,u);if(s.get(h)!==d&&(e.update(h),s.set(h,d)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==d&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),s.set(c,d))),c.isSkinnedMesh){const f=c.skeleton;s.get(f)!==d&&(f.update(),s.set(f,d))}return h}function o(){s=new WeakMap}function l(c){const d=c.target;d.removeEventListener("dispose",l),i.releaseStatesOfObject(d),t.remove(d.instanceMatrix),d.instanceColor!==null&&t.remove(d.instanceColor)}return{update:a,dispose:o}}const vy={[Cu]:"LINEAR_TONE_MAPPING",[Iu]:"REINHARD_TONE_MAPPING",[Pu]:"CINEON_TONE_MAPPING",[Lu]:"ACES_FILMIC_TONE_MAPPING",[Nu]:"AGX_TONE_MAPPING",[Uu]:"NEUTRAL_TONE_MAPPING",[Du]:"CUSTOM_TONE_MAPPING"};function yy(n,e,t,i,r,s){const a=new In(e,t,{type:n,depthBuffer:r,stencilBuffer:s,samples:i?4:0,depthTexture:r?new br(e,t):void 0}),o=new In(e,t,{type:qn,depthBuffer:!1,stencilBuffer:!1}),l=new Ot;l.setAttribute("position",new mt([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new mt([0,2,0,0,2,0],2));const c=new Og({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new me(l,c),u=new cs(-1,1,1,-1,0,1);let h=null,f=null,g=!1,v,m=null,p=[],w=!1;this.setSize=function(A,M){a.setSize(A,M),o.setSize(A,M);for(let b=0;b<p.length;b++){const R=p[b];R.setSize&&R.setSize(A,M)}},this.setEffects=function(A){p=A,w=p.length>0&&p[0].isRenderPass===!0;const M=a.width,b=a.height;for(let R=0;R<p.length;R++){const E=p[R];E.setSize&&E.setSize(M,b)}},this.begin=function(A,M){if(g||A.toneMapping===mn&&p.length===0)return!1;if(m=M,M!==null){const b=M.width,R=M.height;(a.width!==b||a.height!==R)&&this.setSize(b,R)}return w===!1&&A.setRenderTarget(a),v=A.toneMapping,A.toneMapping=mn,!0},this.hasRenderPass=function(){return w},this.end=function(A,M){A.toneMapping=v,g=!0;let b=a,R=o;for(let E=0;E<p.length;E++){const y=p[E];if(y.enabled!==!1&&(y.render(A,R,b,M),y.needsSwap!==!1)){const C=b;b=R,R=C}}if(h!==A.outputColorSpace||f!==A.toneMapping){h=A.outputColorSpace,f=A.toneMapping,c.defines={},Ye.getTransfer(h)===nt&&(c.defines.SRGB_TRANSFER="");const E=vy[f];E&&(c.defines[E]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=b.texture,A.setRenderTarget(m),A.render(d,u),m=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){a.depthTexture&&a.depthTexture.dispose(),a.dispose(),o.dispose(),l.dispose(),c.dispose()}}const fh=new Nt,yl=new br(1,1),ph=new qu,mh=new og,gh=new ih,Nd=[],Ud=[],Fd=new Float32Array(16),Od=new Float32Array(9),kd=new Float32Array(4);function Rr(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=Nd[r];if(s===void 0&&(s=new Float32Array(r),Nd[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function Ut(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Ft(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Ta(n,e){let t=Ud[e];t===void 0&&(t=new Int32Array(e),Ud[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function My(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function xy(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;n.uniform2fv(this.addr,e),Ft(t,e)}}function by(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ut(t,e))return;n.uniform3fv(this.addr,e),Ft(t,e)}}function Sy(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;n.uniform4fv(this.addr,e),Ft(t,e)}}function Ty(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Ut(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Ft(t,e)}else{if(Ut(t,i))return;kd.set(i),n.uniformMatrix2fv(this.addr,!1,kd),Ft(t,i)}}function Ey(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Ut(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Ft(t,e)}else{if(Ut(t,i))return;Od.set(i),n.uniformMatrix3fv(this.addr,!1,Od),Ft(t,i)}}function wy(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Ut(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Ft(t,e)}else{if(Ut(t,i))return;Fd.set(i),n.uniformMatrix4fv(this.addr,!1,Fd),Ft(t,i)}}function Ay(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Ry(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;n.uniform2iv(this.addr,e),Ft(t,e)}}function Cy(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ut(t,e))return;n.uniform3iv(this.addr,e),Ft(t,e)}}function Iy(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;n.uniform4iv(this.addr,e),Ft(t,e)}}function Py(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Ly(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;n.uniform2uiv(this.addr,e),Ft(t,e)}}function Dy(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ut(t,e))return;n.uniform3uiv(this.addr,e),Ft(t,e)}}function Ny(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;n.uniform4uiv(this.addr,e),Ft(t,e)}}function Uy(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(yl.compareFunction=t.isReversedDepthBuffer()?$l:ql,s=yl):s=fh,t.setTexture2D(e||s,r)}function Fy(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||mh,r)}function Oy(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||gh,r)}function ky(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||ph,r)}function By(n){switch(n){case 5126:return My;case 35664:return xy;case 35665:return by;case 35666:return Sy;case 35674:return Ty;case 35675:return Ey;case 35676:return wy;case 5124:case 35670:return Ay;case 35667:case 35671:return Ry;case 35668:case 35672:return Cy;case 35669:case 35673:return Iy;case 5125:return Py;case 36294:return Ly;case 36295:return Dy;case 36296:return Ny;case 35678:case 36198:case 36298:case 36306:case 35682:return Uy;case 35679:case 36299:case 36307:return Fy;case 35680:case 36300:case 36308:case 36293:return Oy;case 36289:case 36303:case 36311:case 36292:return ky}}function zy(n,e){n.uniform1fv(this.addr,e)}function Gy(n,e){const t=Rr(e,this.size,2);n.uniform2fv(this.addr,t)}function Hy(n,e){const t=Rr(e,this.size,3);n.uniform3fv(this.addr,t)}function Vy(n,e){const t=Rr(e,this.size,4);n.uniform4fv(this.addr,t)}function Wy(n,e){const t=Rr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Xy(n,e){const t=Rr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function qy(n,e){const t=Rr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function $y(n,e){n.uniform1iv(this.addr,e)}function Ky(n,e){n.uniform2iv(this.addr,e)}function Yy(n,e){n.uniform3iv(this.addr,e)}function Zy(n,e){n.uniform4iv(this.addr,e)}function Jy(n,e){n.uniform1uiv(this.addr,e)}function Qy(n,e){n.uniform2uiv(this.addr,e)}function jy(n,e){n.uniform3uiv(this.addr,e)}function eM(n,e){n.uniform4uiv(this.addr,e)}function tM(n,e,t){const i=this.cache,r=e.length,s=Ta(t,r);Ut(i,s)||(n.uniform1iv(this.addr,s),Ft(i,s));let a;this.type===n.SAMPLER_2D_SHADOW?a=yl:a=fh;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function nM(n,e,t){const i=this.cache,r=e.length,s=Ta(t,r);Ut(i,s)||(n.uniform1iv(this.addr,s),Ft(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||mh,s[a])}function iM(n,e,t){const i=this.cache,r=e.length,s=Ta(t,r);Ut(i,s)||(n.uniform1iv(this.addr,s),Ft(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||gh,s[a])}function rM(n,e,t){const i=this.cache,r=e.length,s=Ta(t,r);Ut(i,s)||(n.uniform1iv(this.addr,s),Ft(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||ph,s[a])}function sM(n){switch(n){case 5126:return zy;case 35664:return Gy;case 35665:return Hy;case 35666:return Vy;case 35674:return Wy;case 35675:return Xy;case 35676:return qy;case 5124:case 35670:return $y;case 35667:case 35671:return Ky;case 35668:case 35672:return Yy;case 35669:case 35673:return Zy;case 5125:return Jy;case 36294:return Qy;case 36295:return jy;case 36296:return eM;case 35678:case 36198:case 36298:case 36306:case 35682:return tM;case 35679:case 36299:case 36307:return nM;case 35680:case 36300:case 36308:case 36293:return iM;case 36289:case 36303:case 36311:case 36292:return rM}}class aM{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=By(t.type)}}class oM{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=sM(t.type)}}class lM{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],i)}}}const yo=/(\w+)(\])?(\[|\.)?/g;function Bd(n,e){n.seq.push(e),n.map[e.id]=e}function cM(n,e,t){const i=n.name,r=i.length;for(yo.lastIndex=0;;){const s=yo.exec(i),a=yo.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){Bd(t,c===void 0?new aM(o,n,e):new oM(o,n,e));break}else{let u=t.map[o];u===void 0&&(u=new lM(o),Bd(t,u)),t=u}}}class ta{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);cM(o,l,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&i.push(a)}return i}}function zd(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const dM=37297;let uM=0;function hM(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}const Gd=new Ge;function fM(n){Ye._getMatrix(Gd,Ye.workingColorSpace,n);const e=`mat3( ${Gd.elements.map(t=>t.toFixed(4))} )`;switch(Ye.getTransfer(n)){case ca:return[e,"LinearTransferOETF"];case nt:return[e,"sRGBTransferOETF"];default:return Ae("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Hd(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+hM(n.getShaderSource(e),o)}else return s}function pM(n,e){const t=fM(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const mM={[Cu]:"Linear",[Iu]:"Reinhard",[Pu]:"Cineon",[Lu]:"ACESFilmic",[Nu]:"AgX",[Uu]:"Neutral",[Du]:"Custom"};function gM(n,e){const t=mM[e];return t===void 0?(Ae("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Xs=new O;function _M(){Ye.getLuminanceCoefficients(Xs);const n=Xs.x.toFixed(4),e=Xs.y.toFixed(4),t=Xs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function vM(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Xr).join(`
`)}function yM(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function MM(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),a=s.name;let o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function Xr(n){return n!==""}function Vd(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Wd(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const xM=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ml(n){return n.replace(xM,SM)}const bM=new Map;function SM(n,e){let t=qe[e];if(t===void 0){const i=bM.get(e);if(i!==void 0)t=qe[i],Ae('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Ml(t)}const TM=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Xd(n){return n.replace(TM,EM)}function EM(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function qd(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const wM={[Ys]:"SHADOWMAP_TYPE_PCF",[Vr]:"SHADOWMAP_TYPE_VSM"};function AM(n){return wM[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const RM={[Ni]:"ENVMAP_TYPE_CUBE",[yr]:"ENVMAP_TYPE_CUBE",[ya]:"ENVMAP_TYPE_CUBE_UV"};function CM(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":RM[n.envMapMode]||"ENVMAP_TYPE_CUBE"}const IM={[yr]:"ENVMAP_MODE_REFRACTION"};function PM(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":IM[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}const LM={[kl]:"ENVMAP_BLENDING_MULTIPLY",[xm]:"ENVMAP_BLENDING_MIX",[bm]:"ENVMAP_BLENDING_ADD"};function DM(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":LM[n.combine]||"ENVMAP_BLENDING_NONE"}function NM(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function UM(n,e,t,i){const r=n.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=AM(t),c=CM(t),d=PM(t),u=DM(t),h=NM(t),f=vM(t),g=yM(s),v=r.createProgram();let m,p,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Xr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Xr).join(`
`),p.length>0&&(p+=`
`)):(m=[qd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Xr).join(`
`),p=[qd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+d:"",t.envMap?"#define "+u:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==mn?"#define TONE_MAPPING":"",t.toneMapping!==mn?qe.tonemapping_pars_fragment:"",t.toneMapping!==mn?gM("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",qe.colorspace_pars_fragment,pM("linearToOutputTexel",t.outputColorSpace),_M(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Xr).join(`
`)),a=Ml(a),a=Vd(a,t),a=Wd(a,t),o=Ml(o),o=Vd(o,t),o=Wd(o,t),a=Xd(a),o=Xd(o),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===Gc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Gc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const A=w+m+a,M=w+p+o,b=zd(r,r.VERTEX_SHADER,A),R=zd(r,r.FRAGMENT_SHADER,M);r.attachShader(v,b),r.attachShader(v,R),t.index0AttributeName!==void 0?r.bindAttribLocation(v,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(v,0,"position"),r.linkProgram(v);function E(D){if(n.debug.checkShaderErrors){const U=r.getProgramInfoLog(v)||"",V=r.getShaderInfoLog(b)||"",J=r.getShaderInfoLog(R)||"",I=U.trim(),L=V.trim(),z=J.trim();let K=!0,ie=!0;if(r.getProgramParameter(v,r.LINK_STATUS)===!1)if(K=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,v,b,R);else{const Q=Hd(r,b,"vertex"),se=Hd(r,R,"fragment");Oe("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(v,r.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+I+`
`+Q+`
`+se)}else I!==""?Ae("WebGLProgram: Program Info Log:",I):(L===""||z==="")&&(ie=!1);ie&&(D.diagnostics={runnable:K,programLog:I,vertexShader:{log:L,prefix:m},fragmentShader:{log:z,prefix:p}})}r.deleteShader(b),r.deleteShader(R),y=new ta(r,v),C=MM(r,v)}let y;this.getUniforms=function(){return y===void 0&&E(this),y};let C;this.getAttributes=function(){return C===void 0&&E(this),C};let P=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=r.getProgramParameter(v,dM)),P},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=uM++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=b,this.fragmentShader=R,this}let FM=0;class OM{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new kM(e),t.set(e,i)),i}}class kM{constructor(e){this.id=FM++,this.code=e,this.usedTimes=0}}function BM(n){return n===Ui||n===aa||n===oa}function zM(n,e,t,i,r,s){const a=new $u,o=new OM,l=new Set,c=[],d=new Map,u=i.logarithmicDepthBuffer;let h=i.precision;const f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(y){return l.add(y),y===0?"uv":`uv${y}`}function v(y,C,P,D,U,V){const J=D.fog,I=U.geometry,L=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?D.environment:null,z=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,K=e.get(y.envMap||L,z),ie=K&&K.mapping===ya?K.image.height:null,Q=f[y.type];y.precision!==null&&(h=i.getMaxPrecision(y.precision),h!==y.precision&&Ae("WebGLProgram.getParameters:",y.precision,"not supported, using",h,"instead."));const se=I.morphAttributes.position||I.morphAttributes.normal||I.morphAttributes.color,ce=se!==void 0?se.length:0;let Be=0;I.morphAttributes.position!==void 0&&(Be=1),I.morphAttributes.normal!==void 0&&(Be=2),I.morphAttributes.color!==void 0&&(Be=3);let We,ze,te,fe;if(Q){const ve=wn[Q];We=ve.vertexShader,ze=ve.fragmentShader}else{We=y.vertexShader,ze=y.fragmentShader;const ve=o.getVertexShaderStage(y),lt=o.getFragmentShaderStage(y);o.update(y,ve,lt),te=ve.id,fe=lt.id}const le=n.getRenderTarget(),Ie=n.state.buffers.depth.getReversed(),Ne=U.isInstancedMesh===!0,Le=U.isBatchedMesh===!0,gt=!!y.map,Xe=!!y.matcap,tt=!!K,Qe=!!y.aoMap,Je=!!y.lightMap,yt=!!y.bumpMap&&y.wireframe===!1,Tt=!!y.normalMap,Mt=!!y.displacementMap,It=!!y.emissiveMap,_t=!!y.metalnessMap,xt=!!y.roughnessMap,S=y.anisotropy>0,Z=y.clearcoat>0,H=y.dispersion>0,T=y.iridescence>0,_=y.sheen>0,N=y.transmission>0,k=S&&!!y.anisotropyMap,G=Z&&!!y.clearcoatMap,ne=Z&&!!y.clearcoatNormalMap,re=Z&&!!y.clearcoatRoughnessMap,q=T&&!!y.iridescenceMap,$=T&&!!y.iridescenceThicknessMap,oe=_&&!!y.sheenColorMap,ue=_&&!!y.sheenRoughnessMap,ae=!!y.specularMap,de=!!y.specularColorMap,Ee=!!y.specularIntensityMap,Re=N&&!!y.transmissionMap,Fe=N&&!!y.thicknessMap,F=!!y.gradientMap,he=!!y.alphaMap,ee=y.alphaTest>0,pe=!!y.alphaHash,_e=!!y.extensions;let j=mn;y.toneMapped&&(le===null||le.isXRRenderTarget===!0)&&(j=n.toneMapping);const ge={shaderID:Q,shaderType:y.type,shaderName:y.name,vertexShader:We,fragmentShader:ze,defines:y.defines,customVertexShaderID:te,customFragmentShaderID:fe,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:h,batching:Le,batchingColor:Le&&U._colorsTexture!==null,instancing:Ne,instancingColor:Ne&&U.instanceColor!==null,instancingMorph:Ne&&U.morphTexture!==null,outputColorSpace:le===null?n.outputColorSpace:le.isXRRenderTarget===!0?le.texture.colorSpace:Ye.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:gt,matcap:Xe,envMap:tt,envMapMode:tt&&K.mapping,envMapCubeUVHeight:ie,aoMap:Qe,lightMap:Je,bumpMap:yt,normalMap:Tt,displacementMap:Mt,emissiveMap:It,normalMapObjectSpace:Tt&&y.normalMapType===Am,normalMapTangentSpace:Tt&&y.normalMapType===la,packedNormalMap:Tt&&y.normalMapType===la&&BM(y.normalMap.format),metalnessMap:_t,roughnessMap:xt,anisotropy:S,anisotropyMap:k,clearcoat:Z,clearcoatMap:G,clearcoatNormalMap:ne,clearcoatRoughnessMap:re,dispersion:H,iridescence:T,iridescenceMap:q,iridescenceThicknessMap:$,sheen:_,sheenColorMap:oe,sheenRoughnessMap:ue,specularMap:ae,specularColorMap:de,specularIntensityMap:Ee,transmission:N,transmissionMap:Re,thicknessMap:Fe,gradientMap:F,opaque:y.transparent===!1&&y.blending===ur&&y.alphaToCoverage===!1,alphaMap:he,alphaTest:ee,alphaHash:pe,combine:y.combine,mapUv:gt&&g(y.map.channel),aoMapUv:Qe&&g(y.aoMap.channel),lightMapUv:Je&&g(y.lightMap.channel),bumpMapUv:yt&&g(y.bumpMap.channel),normalMapUv:Tt&&g(y.normalMap.channel),displacementMapUv:Mt&&g(y.displacementMap.channel),emissiveMapUv:It&&g(y.emissiveMap.channel),metalnessMapUv:_t&&g(y.metalnessMap.channel),roughnessMapUv:xt&&g(y.roughnessMap.channel),anisotropyMapUv:k&&g(y.anisotropyMap.channel),clearcoatMapUv:G&&g(y.clearcoatMap.channel),clearcoatNormalMapUv:ne&&g(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:re&&g(y.clearcoatRoughnessMap.channel),iridescenceMapUv:q&&g(y.iridescenceMap.channel),iridescenceThicknessMapUv:$&&g(y.iridescenceThicknessMap.channel),sheenColorMapUv:oe&&g(y.sheenColorMap.channel),sheenRoughnessMapUv:ue&&g(y.sheenRoughnessMap.channel),specularMapUv:ae&&g(y.specularMap.channel),specularColorMapUv:de&&g(y.specularColorMap.channel),specularIntensityMapUv:Ee&&g(y.specularIntensityMap.channel),transmissionMapUv:Re&&g(y.transmissionMap.channel),thicknessMapUv:Fe&&g(y.thicknessMap.channel),alphaMapUv:he&&g(y.alphaMap.channel),vertexTangents:!!I.attributes.tangent&&(Tt||S),vertexNormals:!!I.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!I.attributes.color&&I.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!I.attributes.uv&&(gt||he),fog:!!J,useFog:y.fog===!0,fogExp2:!!J&&J.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||I.attributes.normal===void 0&&Tt===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:Ie,skinning:U.isSkinnedMesh===!0,hasPositionAttribute:I.attributes.position!==void 0,morphTargets:I.morphAttributes.position!==void 0,morphNormals:I.morphAttributes.normal!==void 0,morphColors:I.morphAttributes.color!==void 0,morphTargetsCount:ce,morphTextureStride:Be,numDirLights:C.directional.length,numPointLights:C.point.length,numSpotLights:C.spot.length,numSpotLightMaps:C.spotLightMap.length,numRectAreaLights:C.rectArea.length,numHemiLights:C.hemi.length,numDirLightShadows:C.directionalShadowMap.length,numPointLightShadows:C.pointShadowMap.length,numSpotLightShadows:C.spotShadowMap.length,numSpotLightShadowsWithMaps:C.numSpotLightShadowsWithMaps,numLightProbes:C.numLightProbes,numLightProbeGrids:V.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:y.dithering,shadowMapEnabled:n.shadowMap.enabled&&P.length>0,shadowMapType:n.shadowMap.type,toneMapping:j,decodeVideoTexture:gt&&y.map.isVideoTexture===!0&&Ye.getTransfer(y.map.colorSpace)===nt,decodeVideoTextureEmissive:It&&y.emissiveMap.isVideoTexture===!0&&Ye.getTransfer(y.emissiveMap.colorSpace)===nt,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===An,flipSided:y.side===Kt,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:_e&&y.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(_e&&y.extensions.multiDraw===!0||Le)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return ge.vertexUv1s=l.has(1),ge.vertexUv2s=l.has(2),ge.vertexUv3s=l.has(3),l.clear(),ge}function m(y){const C=[];if(y.shaderID?C.push(y.shaderID):(C.push(y.customVertexShaderID),C.push(y.customFragmentShaderID)),y.defines!==void 0)for(const P in y.defines)C.push(P),C.push(y.defines[P]);return y.isRawShaderMaterial===!1&&(p(C,y),w(C,y),C.push(n.outputColorSpace)),C.push(y.customProgramCacheKey),C.join()}function p(y,C){y.push(C.precision),y.push(C.outputColorSpace),y.push(C.envMapMode),y.push(C.envMapCubeUVHeight),y.push(C.mapUv),y.push(C.alphaMapUv),y.push(C.lightMapUv),y.push(C.aoMapUv),y.push(C.bumpMapUv),y.push(C.normalMapUv),y.push(C.displacementMapUv),y.push(C.emissiveMapUv),y.push(C.metalnessMapUv),y.push(C.roughnessMapUv),y.push(C.anisotropyMapUv),y.push(C.clearcoatMapUv),y.push(C.clearcoatNormalMapUv),y.push(C.clearcoatRoughnessMapUv),y.push(C.iridescenceMapUv),y.push(C.iridescenceThicknessMapUv),y.push(C.sheenColorMapUv),y.push(C.sheenRoughnessMapUv),y.push(C.specularMapUv),y.push(C.specularColorMapUv),y.push(C.specularIntensityMapUv),y.push(C.transmissionMapUv),y.push(C.thicknessMapUv),y.push(C.combine),y.push(C.fogExp2),y.push(C.sizeAttenuation),y.push(C.morphTargetsCount),y.push(C.morphAttributeCount),y.push(C.numDirLights),y.push(C.numPointLights),y.push(C.numSpotLights),y.push(C.numSpotLightMaps),y.push(C.numHemiLights),y.push(C.numRectAreaLights),y.push(C.numDirLightShadows),y.push(C.numPointLightShadows),y.push(C.numSpotLightShadows),y.push(C.numSpotLightShadowsWithMaps),y.push(C.numLightProbes),y.push(C.shadowMapType),y.push(C.toneMapping),y.push(C.numClippingPlanes),y.push(C.numClipIntersection),y.push(C.depthPacking)}function w(y,C){a.disableAll(),C.instancing&&a.enable(0),C.instancingColor&&a.enable(1),C.instancingMorph&&a.enable(2),C.matcap&&a.enable(3),C.envMap&&a.enable(4),C.normalMapObjectSpace&&a.enable(5),C.normalMapTangentSpace&&a.enable(6),C.clearcoat&&a.enable(7),C.iridescence&&a.enable(8),C.alphaTest&&a.enable(9),C.vertexColors&&a.enable(10),C.vertexAlphas&&a.enable(11),C.vertexUv1s&&a.enable(12),C.vertexUv2s&&a.enable(13),C.vertexUv3s&&a.enable(14),C.vertexTangents&&a.enable(15),C.anisotropy&&a.enable(16),C.alphaHash&&a.enable(17),C.batching&&a.enable(18),C.dispersion&&a.enable(19),C.batchingColor&&a.enable(20),C.gradientMap&&a.enable(21),C.packedNormalMap&&a.enable(22),C.vertexNormals&&a.enable(23),y.push(a.mask),a.disableAll(),C.fog&&a.enable(0),C.useFog&&a.enable(1),C.flatShading&&a.enable(2),C.logarithmicDepthBuffer&&a.enable(3),C.reversedDepthBuffer&&a.enable(4),C.skinning&&a.enable(5),C.morphTargets&&a.enable(6),C.morphNormals&&a.enable(7),C.morphColors&&a.enable(8),C.premultipliedAlpha&&a.enable(9),C.shadowMapEnabled&&a.enable(10),C.doubleSided&&a.enable(11),C.flipSided&&a.enable(12),C.useDepthPacking&&a.enable(13),C.dithering&&a.enable(14),C.transmission&&a.enable(15),C.sheen&&a.enable(16),C.opaque&&a.enable(17),C.pointsUvs&&a.enable(18),C.decodeVideoTexture&&a.enable(19),C.decodeVideoTextureEmissive&&a.enable(20),C.alphaToCoverage&&a.enable(21),C.numLightProbeGrids>0&&a.enable(22),C.hasPositionAttribute&&a.enable(23),y.push(a.mask)}function A(y){const C=f[y.type];let P;if(C){const D=wn[C];P=Ng.clone(D.uniforms)}else P=y.uniforms;return P}function M(y,C){let P=d.get(C);return P!==void 0?++P.usedTimes:(P=new UM(n,C,y,r),c.push(P),d.set(C,P)),P}function b(y){if(--y.usedTimes===0){const C=c.indexOf(y);c[C]=c[c.length-1],c.pop(),d.delete(y.cacheKey),y.destroy()}}function R(y){o.remove(y)}function E(){o.dispose()}return{getParameters:v,getProgramCacheKey:m,getUniforms:A,acquireProgram:M,releaseProgram:b,releaseShaderCache:R,programs:c,dispose:E}}function GM(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,l){n.get(a)[o]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function HM(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function $d(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Kd(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(h){let f=0;return h.isInstancedMesh&&(f+=2),h.isSkinnedMesh&&(f+=1),f}function o(h,f,g,v,m,p){let w=n[e];return w===void 0?(w={id:h.id,object:h,geometry:f,material:g,materialVariant:a(h),groupOrder:v,renderOrder:h.renderOrder,z:m,group:p},n[e]=w):(w.id=h.id,w.object=h,w.geometry=f,w.material=g,w.materialVariant=a(h),w.groupOrder=v,w.renderOrder=h.renderOrder,w.z=m,w.group=p),e++,w}function l(h,f,g,v,m,p){const w=o(h,f,g,v,m,p);g.transmission>0?i.push(w):g.transparent===!0?r.push(w):t.push(w)}function c(h,f,g,v,m,p){const w=o(h,f,g,v,m,p);g.transmission>0?i.unshift(w):g.transparent===!0?r.unshift(w):t.unshift(w)}function d(h,f,g){t.length>1&&t.sort(h||HM),i.length>1&&i.sort(f||$d),r.length>1&&r.sort(f||$d),g&&(t.reverse(),i.reverse(),r.reverse())}function u(){for(let h=e,f=n.length;h<f;h++){const g=n[h];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:l,unshift:c,finish:u,sort:d}}function VM(){let n=new WeakMap;function e(i,r){const s=n.get(i);let a;return s===void 0?(a=new Kd,n.set(i,[a])):r>=s.length?(a=new Kd,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function WM(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new O,color:new De};break;case"SpotLight":t={position:new O,direction:new O,color:new De,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new O,color:new De,distance:0,decay:0};break;case"HemisphereLight":t={direction:new O,skyColor:new De,groundColor:new De};break;case"RectAreaLight":t={color:new De,position:new O,halfWidth:new O,halfHeight:new O};break}return n[e.id]=t,t}}}function XM(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ke};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ke};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ke,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let qM=0;function $M(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function KM(n){const e=new WM,t=XM(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new O);const r=new O,s=new Ve,a=new Ve;function o(c){let d=0,u=0,h=0;for(let C=0;C<9;C++)i.probe[C].set(0,0,0);let f=0,g=0,v=0,m=0,p=0,w=0,A=0,M=0,b=0,R=0,E=0;c.sort($M);for(let C=0,P=c.length;C<P;C++){const D=c[C],U=D.color,V=D.intensity,J=D.distance;let I=null;if(D.shadow&&D.shadow.map&&(D.shadow.map.texture.format===Ui?I=D.shadow.map.texture:I=D.shadow.map.depthTexture||D.shadow.map.texture),D.isAmbientLight)d+=U.r*V,u+=U.g*V,h+=U.b*V;else if(D.isLightProbe){for(let L=0;L<9;L++)i.probe[L].addScaledVector(D.sh.coefficients[L],V);E++}else if(D.isDirectionalLight){const L=e.get(D);if(L.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){const z=D.shadow,K=t.get(D);K.shadowIntensity=z.intensity,K.shadowBias=z.bias,K.shadowNormalBias=z.normalBias,K.shadowRadius=z.radius,K.shadowMapSize=z.mapSize,i.directionalShadow[f]=K,i.directionalShadowMap[f]=I,i.directionalShadowMatrix[f]=D.shadow.matrix,w++}i.directional[f]=L,f++}else if(D.isSpotLight){const L=e.get(D);L.position.setFromMatrixPosition(D.matrixWorld),L.color.copy(U).multiplyScalar(V),L.distance=J,L.coneCos=Math.cos(D.angle),L.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),L.decay=D.decay,i.spot[v]=L;const z=D.shadow;if(D.map&&(i.spotLightMap[b]=D.map,b++,z.updateMatrices(D),D.castShadow&&R++),i.spotLightMatrix[v]=z.matrix,D.castShadow){const K=t.get(D);K.shadowIntensity=z.intensity,K.shadowBias=z.bias,K.shadowNormalBias=z.normalBias,K.shadowRadius=z.radius,K.shadowMapSize=z.mapSize,i.spotShadow[v]=K,i.spotShadowMap[v]=I,M++}v++}else if(D.isRectAreaLight){const L=e.get(D);L.color.copy(U).multiplyScalar(V),L.halfWidth.set(D.width*.5,0,0),L.halfHeight.set(0,D.height*.5,0),i.rectArea[m]=L,m++}else if(D.isPointLight){const L=e.get(D);if(L.color.copy(D.color).multiplyScalar(D.intensity),L.distance=D.distance,L.decay=D.decay,D.castShadow){const z=D.shadow,K=t.get(D);K.shadowIntensity=z.intensity,K.shadowBias=z.bias,K.shadowNormalBias=z.normalBias,K.shadowRadius=z.radius,K.shadowMapSize=z.mapSize,K.shadowCameraNear=z.camera.near,K.shadowCameraFar=z.camera.far,i.pointShadow[g]=K,i.pointShadowMap[g]=I,i.pointShadowMatrix[g]=D.shadow.matrix,A++}i.point[g]=L,g++}else if(D.isHemisphereLight){const L=e.get(D);L.skyColor.copy(D.color).multiplyScalar(V),L.groundColor.copy(D.groundColor).multiplyScalar(V),i.hemi[p]=L,p++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ye.LTC_FLOAT_1,i.rectAreaLTC2=ye.LTC_FLOAT_2):(i.rectAreaLTC1=ye.LTC_HALF_1,i.rectAreaLTC2=ye.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=u,i.ambient[2]=h;const y=i.hash;(y.directionalLength!==f||y.pointLength!==g||y.spotLength!==v||y.rectAreaLength!==m||y.hemiLength!==p||y.numDirectionalShadows!==w||y.numPointShadows!==A||y.numSpotShadows!==M||y.numSpotMaps!==b||y.numLightProbes!==E)&&(i.directional.length=f,i.spot.length=v,i.rectArea.length=m,i.point.length=g,i.hemi.length=p,i.directionalShadow.length=w,i.directionalShadowMap.length=w,i.pointShadow.length=A,i.pointShadowMap.length=A,i.spotShadow.length=M,i.spotShadowMap.length=M,i.directionalShadowMatrix.length=w,i.pointShadowMatrix.length=A,i.spotLightMatrix.length=M+b-R,i.spotLightMap.length=b,i.numSpotLightShadowsWithMaps=R,i.numLightProbes=E,y.directionalLength=f,y.pointLength=g,y.spotLength=v,y.rectAreaLength=m,y.hemiLength=p,y.numDirectionalShadows=w,y.numPointShadows=A,y.numSpotShadows=M,y.numSpotMaps=b,y.numLightProbes=E,i.version=qM++)}function l(c,d){let u=0,h=0,f=0,g=0,v=0;const m=d.matrixWorldInverse;for(let p=0,w=c.length;p<w;p++){const A=c[p];if(A.isDirectionalLight){const M=i.directional[u];M.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(m),u++}else if(A.isSpotLight){const M=i.spot[f];M.position.setFromMatrixPosition(A.matrixWorld),M.position.applyMatrix4(m),M.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(m),f++}else if(A.isRectAreaLight){const M=i.rectArea[g];M.position.setFromMatrixPosition(A.matrixWorld),M.position.applyMatrix4(m),a.identity(),s.copy(A.matrixWorld),s.premultiply(m),a.extractRotation(s),M.halfWidth.set(A.width*.5,0,0),M.halfHeight.set(0,A.height*.5,0),M.halfWidth.applyMatrix4(a),M.halfHeight.applyMatrix4(a),g++}else if(A.isPointLight){const M=i.point[h];M.position.setFromMatrixPosition(A.matrixWorld),M.position.applyMatrix4(m),h++}else if(A.isHemisphereLight){const M=i.hemi[v];M.direction.setFromMatrixPosition(A.matrixWorld),M.direction.transformDirection(m),v++}}}return{setup:o,setupView:l,state:i}}function Yd(n){const e=new KM(n),t=[],i=[],r=[];function s(h){u.camera=h,t.length=0,i.length=0,r.length=0}function a(h){t.push(h)}function o(h){i.push(h)}function l(h){r.push(h)}function c(){e.setup(t)}function d(h){e.setupView(t,h)}const u={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:u,setupLights:c,setupLightsView:d,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function YM(n){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Yd(n),e.set(r,[o])):s>=a.length?(o=new Yd(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}const ZM=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,JM=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,QM=[new O(1,0,0),new O(-1,0,0),new O(0,1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1)],jM=[new O(0,-1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1),new O(0,-1,0),new O(0,-1,0)],Zd=new Ve,Gr=new O,Mo=new O;function ex(n,e,t){let i=new Ql;const r=new ke,s=new ke,a=new ot,o=new kg,l=new Bg,c={},d=t.maxTextureSize,u={[Xn]:Kt,[Kt]:Xn,[An]:An},h=new Ln({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ke},radius:{value:4}},vertexShader:ZM,fragmentShader:JM}),f=h.clone();f.defines.HORIZONTAL_PASS=1;const g=new Ot;g.setAttribute("position",new zt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new me(g,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ys;let p=this.type;this.render=function(R,E,y){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||R.length===0)return;this.type===nm&&(Ae("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=Ys);const C=n.getRenderTarget(),P=n.getActiveCubeFace(),D=n.getActiveMipmapLevel(),U=n.state;U.setBlending(Vn),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);const V=p!==this.type;V&&E.traverse(function(J){J.material&&(Array.isArray(J.material)?J.material.forEach(I=>I.needsUpdate=!0):J.material.needsUpdate=!0)});for(let J=0,I=R.length;J<I;J++){const L=R[J],z=L.shadow;if(z===void 0){Ae("WebGLShadowMap:",L,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;r.copy(z.mapSize);const K=z.getFrameExtents();r.multiply(K),s.copy(z.mapSize),(r.x>d||r.y>d)&&(r.x>d&&(s.x=Math.floor(d/K.x),r.x=s.x*K.x,z.mapSize.x=s.x),r.y>d&&(s.y=Math.floor(d/K.y),r.y=s.y*K.y,z.mapSize.y=s.y));const ie=n.state.buffers.depth.getReversed();if(z.camera._reversedDepth=ie,z.map===null||V===!0){if(z.map!==null&&(z.map.depthTexture!==null&&(z.map.depthTexture.dispose(),z.map.depthTexture=null),z.map.dispose()),this.type===Vr){if(L.isPointLight){Ae("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}z.map=new In(r.x,r.y,{format:Ui,type:qn,minFilter:At,magFilter:At,generateMipmaps:!1}),z.map.texture.name=L.name+".shadowMap",z.map.depthTexture=new br(r.x,r.y,an),z.map.depthTexture.name=L.name+".shadowMapDepth",z.map.depthTexture.format=$n,z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=Dt,z.map.depthTexture.magFilter=Dt}else L.isPointLight?(z.map=new hh(r.x),z.map.depthTexture=new Lg(r.x,Pn)):(z.map=new In(r.x,r.y),z.map.depthTexture=new br(r.x,r.y,Pn)),z.map.depthTexture.name=L.name+".shadowMap",z.map.depthTexture.format=$n,this.type===Ys?(z.map.depthTexture.compareFunction=ie?$l:ql,z.map.depthTexture.minFilter=At,z.map.depthTexture.magFilter=At):(z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=Dt,z.map.depthTexture.magFilter=Dt);z.camera.updateProjectionMatrix()}const Q=z.map.isWebGLCubeRenderTarget?6:1;for(let se=0;se<Q;se++){if(z.map.isWebGLCubeRenderTarget)n.setRenderTarget(z.map,se),n.clear();else{se===0&&(n.setRenderTarget(z.map),n.clear());const ce=z.getViewport(se);a.set(s.x*ce.x,s.y*ce.y,s.x*ce.z,s.y*ce.w),U.viewport(a)}if(L.isPointLight){const ce=z.camera,Be=z.matrix,We=L.distance||ce.far;We!==ce.far&&(ce.far=We,ce.updateProjectionMatrix()),Gr.setFromMatrixPosition(L.matrixWorld),ce.position.copy(Gr),Mo.copy(ce.position),Mo.add(QM[se]),ce.up.copy(jM[se]),ce.lookAt(Mo),ce.updateMatrixWorld(),Be.makeTranslation(-Gr.x,-Gr.y,-Gr.z),Zd.multiplyMatrices(ce.projectionMatrix,ce.matrixWorldInverse),z._frustum.setFromProjectionMatrix(Zd,ce.coordinateSystem,ce.reversedDepth)}else z.updateMatrices(L);i=z.getFrustum(),M(E,y,z.camera,L,this.type)}z.isPointLightShadow!==!0&&this.type===Vr&&w(z,y),z.needsUpdate=!1}p=this.type,m.needsUpdate=!1,n.setRenderTarget(C,P,D)};function w(R,E){const y=e.update(v);h.defines.VSM_SAMPLES!==R.blurSamples&&(h.defines.VSM_SAMPLES=R.blurSamples,f.defines.VSM_SAMPLES=R.blurSamples,h.needsUpdate=!0,f.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new In(r.x,r.y,{format:Ui,type:qn})),h.uniforms.shadow_pass.value=R.map.depthTexture,h.uniforms.resolution.value=R.mapSize,h.uniforms.radius.value=R.radius,n.setRenderTarget(R.mapPass),n.clear(),n.renderBufferDirect(E,null,y,h,v,null),f.uniforms.shadow_pass.value=R.mapPass.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,n.setRenderTarget(R.map),n.clear(),n.renderBufferDirect(E,null,y,f,v,null)}function A(R,E,y,C){let P=null;const D=y.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(D!==void 0)P=D;else if(P=y.isPointLight===!0?l:o,n.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0||E.alphaToCoverage===!0){const U=P.uuid,V=E.uuid;let J=c[U];J===void 0&&(J={},c[U]=J);let I=J[V];I===void 0&&(I=P.clone(),J[V]=I,E.addEventListener("dispose",b)),P=I}if(P.visible=E.visible,P.wireframe=E.wireframe,C===Vr?P.side=E.shadowSide!==null?E.shadowSide:E.side:P.side=E.shadowSide!==null?E.shadowSide:u[E.side],P.alphaMap=E.alphaMap,P.alphaTest=E.alphaToCoverage===!0?.5:E.alphaTest,P.map=E.map,P.clipShadows=E.clipShadows,P.clippingPlanes=E.clippingPlanes,P.clipIntersection=E.clipIntersection,P.displacementMap=E.displacementMap,P.displacementScale=E.displacementScale,P.displacementBias=E.displacementBias,P.wireframeLinewidth=E.wireframeLinewidth,P.linewidth=E.linewidth,y.isPointLight===!0&&P.isMeshDistanceMaterial===!0){const U=n.properties.get(P);U.light=y}return P}function M(R,E,y,C,P){if(R.visible===!1)return;if(R.layers.test(E.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&P===Vr)&&(!R.frustumCulled||i.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,R.matrixWorld);const V=e.update(R),J=R.material;if(Array.isArray(J)){const I=V.groups;for(let L=0,z=I.length;L<z;L++){const K=I[L],ie=J[K.materialIndex];if(ie&&ie.visible){const Q=A(R,ie,C,P);R.onBeforeShadow(n,R,E,y,V,Q,K),n.renderBufferDirect(y,null,V,Q,R,K),R.onAfterShadow(n,R,E,y,V,Q,K)}}}else if(J.visible){const I=A(R,J,C,P);R.onBeforeShadow(n,R,E,y,V,I,null),n.renderBufferDirect(y,null,V,I,R,null),R.onAfterShadow(n,R,E,y,V,I,null)}}const U=R.children;for(let V=0,J=U.length;V<J;V++)M(U[V],E,y,C,P)}function b(R){R.target.removeEventListener("dispose",b);for(const y in c){const C=c[y],P=R.target.uuid;P in C&&(C[P].dispose(),delete C[P])}}}function tx(n,e){function t(){let F=!1;const he=new ot;let ee=null;const pe=new ot(0,0,0,0);return{setMask:function(_e){ee!==_e&&!F&&(n.colorMask(_e,_e,_e,_e),ee=_e)},setLocked:function(_e){F=_e},setClear:function(_e,j,ge,ve,lt){lt===!0&&(_e*=ve,j*=ve,ge*=ve),he.set(_e,j,ge,ve),pe.equals(he)===!1&&(n.clearColor(_e,j,ge,ve),pe.copy(he))},reset:function(){F=!1,ee=null,pe.set(-1,0,0,0)}}}function i(){let F=!1,he=!1,ee=null,pe=null,_e=null;return{setReversed:function(j){if(he!==j){const ge=e.get("EXT_clip_control");j?ge.clipControlEXT(ge.LOWER_LEFT_EXT,ge.ZERO_TO_ONE_EXT):ge.clipControlEXT(ge.LOWER_LEFT_EXT,ge.NEGATIVE_ONE_TO_ONE_EXT),he=j;const ve=_e;_e=null,this.setClear(ve)}},getReversed:function(){return he},setTest:function(j){j?le(n.DEPTH_TEST):Ie(n.DEPTH_TEST)},setMask:function(j){ee!==j&&!F&&(n.depthMask(j),ee=j)},setFunc:function(j){if(he&&(j=km[j]),pe!==j){switch(j){case Lo:n.depthFunc(n.NEVER);break;case Do:n.depthFunc(n.ALWAYS);break;case No:n.depthFunc(n.LESS);break;case vr:n.depthFunc(n.LEQUAL);break;case Uo:n.depthFunc(n.EQUAL);break;case Fo:n.depthFunc(n.GEQUAL);break;case Oo:n.depthFunc(n.GREATER);break;case ko:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}pe=j}},setLocked:function(j){F=j},setClear:function(j){_e!==j&&(_e=j,he&&(j=1-j),n.clearDepth(j))},reset:function(){F=!1,ee=null,pe=null,_e=null,he=!1}}}function r(){let F=!1,he=null,ee=null,pe=null,_e=null,j=null,ge=null,ve=null,lt=null;return{setTest:function(ft){F||(ft?le(n.STENCIL_TEST):Ie(n.STENCIL_TEST))},setMask:function(ft){he!==ft&&!F&&(n.stencilMask(ft),he=ft)},setFunc:function(ft,Mn,xn){(ee!==ft||pe!==Mn||_e!==xn)&&(n.stencilFunc(ft,Mn,xn),ee=ft,pe=Mn,_e=xn)},setOp:function(ft,Mn,xn){(j!==ft||ge!==Mn||ve!==xn)&&(n.stencilOp(ft,Mn,xn),j=ft,ge=Mn,ve=xn)},setLocked:function(ft){F=ft},setClear:function(ft){lt!==ft&&(n.clearStencil(ft),lt=ft)},reset:function(){F=!1,he=null,ee=null,pe=null,_e=null,j=null,ge=null,ve=null,lt=null}}}const s=new t,a=new i,o=new r,l=new WeakMap,c=new WeakMap;let d={},u={},h={},f=new WeakMap,g=[],v=null,m=!1,p=null,w=null,A=null,M=null,b=null,R=null,E=null,y=new De(0,0,0),C=0,P=!1,D=null,U=null,V=null,J=null,I=null;const L=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let z=!1,K=0;const ie=n.getParameter(n.VERSION);ie.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec(ie)[1]),z=K>=1):ie.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec(ie)[1]),z=K>=2);let Q=null,se={};const ce=n.getParameter(n.SCISSOR_BOX),Be=n.getParameter(n.VIEWPORT),We=new ot().fromArray(ce),ze=new ot().fromArray(Be);function te(F,he,ee,pe){const _e=new Uint8Array(4),j=n.createTexture();n.bindTexture(F,j),n.texParameteri(F,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(F,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ge=0;ge<ee;ge++)F===n.TEXTURE_3D||F===n.TEXTURE_2D_ARRAY?n.texImage3D(he,0,n.RGBA,1,1,pe,0,n.RGBA,n.UNSIGNED_BYTE,_e):n.texImage2D(he+ge,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,_e);return j}const fe={};fe[n.TEXTURE_2D]=te(n.TEXTURE_2D,n.TEXTURE_2D,1),fe[n.TEXTURE_CUBE_MAP]=te(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),fe[n.TEXTURE_2D_ARRAY]=te(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),fe[n.TEXTURE_3D]=te(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),le(n.DEPTH_TEST),a.setFunc(vr),yt(!1),Tt(Ic),le(n.CULL_FACE),Qe(Vn);function le(F){d[F]!==!0&&(n.enable(F),d[F]=!0)}function Ie(F){d[F]!==!1&&(n.disable(F),d[F]=!1)}function Ne(F,he){return h[F]!==he?(n.bindFramebuffer(F,he),h[F]=he,F===n.DRAW_FRAMEBUFFER&&(h[n.FRAMEBUFFER]=he),F===n.FRAMEBUFFER&&(h[n.DRAW_FRAMEBUFFER]=he),!0):!1}function Le(F,he){let ee=g,pe=!1;if(F){ee=f.get(he),ee===void 0&&(ee=[],f.set(he,ee));const _e=F.textures;if(ee.length!==_e.length||ee[0]!==n.COLOR_ATTACHMENT0){for(let j=0,ge=_e.length;j<ge;j++)ee[j]=n.COLOR_ATTACHMENT0+j;ee.length=_e.length,pe=!0}}else ee[0]!==n.BACK&&(ee[0]=n.BACK,pe=!0);pe&&n.drawBuffers(ee)}function gt(F){return v!==F?(n.useProgram(F),v=F,!0):!1}const Xe={[Ri]:n.FUNC_ADD,[rm]:n.FUNC_SUBTRACT,[sm]:n.FUNC_REVERSE_SUBTRACT};Xe[am]=n.MIN,Xe[om]=n.MAX;const tt={[lm]:n.ZERO,[cm]:n.ONE,[dm]:n.SRC_COLOR,[Io]:n.SRC_ALPHA,[gm]:n.SRC_ALPHA_SATURATE,[pm]:n.DST_COLOR,[hm]:n.DST_ALPHA,[um]:n.ONE_MINUS_SRC_COLOR,[Po]:n.ONE_MINUS_SRC_ALPHA,[mm]:n.ONE_MINUS_DST_COLOR,[fm]:n.ONE_MINUS_DST_ALPHA,[_m]:n.CONSTANT_COLOR,[vm]:n.ONE_MINUS_CONSTANT_COLOR,[ym]:n.CONSTANT_ALPHA,[Mm]:n.ONE_MINUS_CONSTANT_ALPHA};function Qe(F,he,ee,pe,_e,j,ge,ve,lt,ft){if(F===Vn){m===!0&&(Ie(n.BLEND),m=!1);return}if(m===!1&&(le(n.BLEND),m=!0),F!==im){if(F!==p||ft!==P){if((w!==Ri||b!==Ri)&&(n.blendEquation(n.FUNC_ADD),w=Ri,b=Ri),ft)switch(F){case ur:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Pc:n.blendFunc(n.ONE,n.ONE);break;case Lc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Dc:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Oe("WebGLState: Invalid blending: ",F);break}else switch(F){case ur:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Pc:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Lc:Oe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Dc:Oe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Oe("WebGLState: Invalid blending: ",F);break}A=null,M=null,R=null,E=null,y.set(0,0,0),C=0,p=F,P=ft}return}_e=_e||he,j=j||ee,ge=ge||pe,(he!==w||_e!==b)&&(n.blendEquationSeparate(Xe[he],Xe[_e]),w=he,b=_e),(ee!==A||pe!==M||j!==R||ge!==E)&&(n.blendFuncSeparate(tt[ee],tt[pe],tt[j],tt[ge]),A=ee,M=pe,R=j,E=ge),(ve.equals(y)===!1||lt!==C)&&(n.blendColor(ve.r,ve.g,ve.b,lt),y.copy(ve),C=lt),p=F,P=!1}function Je(F,he){F.side===An?Ie(n.CULL_FACE):le(n.CULL_FACE);let ee=F.side===Kt;he&&(ee=!ee),yt(ee),F.blending===ur&&F.transparent===!1?Qe(Vn):Qe(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),a.setFunc(F.depthFunc),a.setTest(F.depthTest),a.setMask(F.depthWrite),s.setMask(F.colorWrite);const pe=F.stencilWrite;o.setTest(pe),pe&&(o.setMask(F.stencilWriteMask),o.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),o.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),It(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?le(n.SAMPLE_ALPHA_TO_COVERAGE):Ie(n.SAMPLE_ALPHA_TO_COVERAGE)}function yt(F){D!==F&&(F?n.frontFace(n.CW):n.frontFace(n.CCW),D=F)}function Tt(F){F!==em?(le(n.CULL_FACE),F!==U&&(F===Ic?n.cullFace(n.BACK):F===tm?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Ie(n.CULL_FACE),U=F}function Mt(F){F!==V&&(z&&n.lineWidth(F),V=F)}function It(F,he,ee){F?(le(n.POLYGON_OFFSET_FILL),(J!==he||I!==ee)&&(J=he,I=ee,a.getReversed()&&(he=-he),n.polygonOffset(he,ee))):Ie(n.POLYGON_OFFSET_FILL)}function _t(F){F?le(n.SCISSOR_TEST):Ie(n.SCISSOR_TEST)}function xt(F){F===void 0&&(F=n.TEXTURE0+L-1),Q!==F&&(n.activeTexture(F),Q=F)}function S(F,he,ee){ee===void 0&&(Q===null?ee=n.TEXTURE0+L-1:ee=Q);let pe=se[ee];pe===void 0&&(pe={type:void 0,texture:void 0},se[ee]=pe),(pe.type!==F||pe.texture!==he)&&(Q!==ee&&(n.activeTexture(ee),Q=ee),n.bindTexture(F,he||fe[F]),pe.type=F,pe.texture=he)}function Z(){const F=se[Q];F!==void 0&&F.type!==void 0&&(n.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function H(){try{n.compressedTexImage2D(...arguments)}catch(F){Oe("WebGLState:",F)}}function T(){try{n.compressedTexImage3D(...arguments)}catch(F){Oe("WebGLState:",F)}}function _(){try{n.texSubImage2D(...arguments)}catch(F){Oe("WebGLState:",F)}}function N(){try{n.texSubImage3D(...arguments)}catch(F){Oe("WebGLState:",F)}}function k(){try{n.compressedTexSubImage2D(...arguments)}catch(F){Oe("WebGLState:",F)}}function G(){try{n.compressedTexSubImage3D(...arguments)}catch(F){Oe("WebGLState:",F)}}function ne(){try{n.texStorage2D(...arguments)}catch(F){Oe("WebGLState:",F)}}function re(){try{n.texStorage3D(...arguments)}catch(F){Oe("WebGLState:",F)}}function q(){try{n.texImage2D(...arguments)}catch(F){Oe("WebGLState:",F)}}function $(){try{n.texImage3D(...arguments)}catch(F){Oe("WebGLState:",F)}}function oe(F){return u[F]!==void 0?u[F]:n.getParameter(F)}function ue(F,he){u[F]!==he&&(n.pixelStorei(F,he),u[F]=he)}function ae(F){We.equals(F)===!1&&(n.scissor(F.x,F.y,F.z,F.w),We.copy(F))}function de(F){ze.equals(F)===!1&&(n.viewport(F.x,F.y,F.z,F.w),ze.copy(F))}function Ee(F,he){let ee=c.get(he);ee===void 0&&(ee=new WeakMap,c.set(he,ee));let pe=ee.get(F);pe===void 0&&(pe=n.getUniformBlockIndex(he,F.name),ee.set(F,pe))}function Re(F,he){const pe=c.get(he).get(F);l.get(he)!==pe&&(n.uniformBlockBinding(he,pe,F.__bindingPointIndex),l.set(he,pe))}function Fe(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),d={},u={},Q=null,se={},h={},f=new WeakMap,g=[],v=null,m=!1,p=null,w=null,A=null,M=null,b=null,R=null,E=null,y=new De(0,0,0),C=0,P=!1,D=null,U=null,V=null,J=null,I=null,We.set(0,0,n.canvas.width,n.canvas.height),ze.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:le,disable:Ie,bindFramebuffer:Ne,drawBuffers:Le,useProgram:gt,setBlending:Qe,setMaterial:Je,setFlipSided:yt,setCullFace:Tt,setLineWidth:Mt,setPolygonOffset:It,setScissorTest:_t,activeTexture:xt,bindTexture:S,unbindTexture:Z,compressedTexImage2D:H,compressedTexImage3D:T,texImage2D:q,texImage3D:$,pixelStorei:ue,getParameter:oe,updateUBOMapping:Ee,uniformBlockBinding:Re,texStorage2D:ne,texStorage3D:re,texSubImage2D:_,texSubImage3D:N,compressedTexSubImage2D:k,compressedTexSubImage3D:G,scissor:ae,viewport:de,reset:Fe}}function nx(n,e,t,i,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ke,d=new WeakMap,u=new Set;let h;const f=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(T,_){return g?new OffscreenCanvas(T,_):ts("canvas")}function m(T,_,N){let k=1;const G=H(T);if((G.width>N||G.height>N)&&(k=N/Math.max(G.width,G.height)),k<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){const ne=Math.floor(k*G.width),re=Math.floor(k*G.height);h===void 0&&(h=v(ne,re));const q=_?v(ne,re):h;return q.width=ne,q.height=re,q.getContext("2d").drawImage(T,0,0,ne,re),Ae("WebGLRenderer: Texture has been resized from ("+G.width+"x"+G.height+") to ("+ne+"x"+re+")."),q}else return"data"in T&&Ae("WebGLRenderer: Image in DataTexture is too big ("+G.width+"x"+G.height+")."),T;return T}function p(T){return T.generateMipmaps}function w(T){n.generateMipmap(T)}function A(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function M(T,_,N,k,G,ne=!1){if(T!==null){if(n[T]!==void 0)return n[T];Ae("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let re;k&&(re=e.get("EXT_texture_norm16"),re||Ae("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let q=_;if(_===n.RED&&(N===n.FLOAT&&(q=n.R32F),N===n.HALF_FLOAT&&(q=n.R16F),N===n.UNSIGNED_BYTE&&(q=n.R8),N===n.UNSIGNED_SHORT&&re&&(q=re.R16_EXT),N===n.SHORT&&re&&(q=re.R16_SNORM_EXT)),_===n.RED_INTEGER&&(N===n.UNSIGNED_BYTE&&(q=n.R8UI),N===n.UNSIGNED_SHORT&&(q=n.R16UI),N===n.UNSIGNED_INT&&(q=n.R32UI),N===n.BYTE&&(q=n.R8I),N===n.SHORT&&(q=n.R16I),N===n.INT&&(q=n.R32I)),_===n.RG&&(N===n.FLOAT&&(q=n.RG32F),N===n.HALF_FLOAT&&(q=n.RG16F),N===n.UNSIGNED_BYTE&&(q=n.RG8),N===n.UNSIGNED_SHORT&&re&&(q=re.RG16_EXT),N===n.SHORT&&re&&(q=re.RG16_SNORM_EXT)),_===n.RG_INTEGER&&(N===n.UNSIGNED_BYTE&&(q=n.RG8UI),N===n.UNSIGNED_SHORT&&(q=n.RG16UI),N===n.UNSIGNED_INT&&(q=n.RG32UI),N===n.BYTE&&(q=n.RG8I),N===n.SHORT&&(q=n.RG16I),N===n.INT&&(q=n.RG32I)),_===n.RGB_INTEGER&&(N===n.UNSIGNED_BYTE&&(q=n.RGB8UI),N===n.UNSIGNED_SHORT&&(q=n.RGB16UI),N===n.UNSIGNED_INT&&(q=n.RGB32UI),N===n.BYTE&&(q=n.RGB8I),N===n.SHORT&&(q=n.RGB16I),N===n.INT&&(q=n.RGB32I)),_===n.RGBA_INTEGER&&(N===n.UNSIGNED_BYTE&&(q=n.RGBA8UI),N===n.UNSIGNED_SHORT&&(q=n.RGBA16UI),N===n.UNSIGNED_INT&&(q=n.RGBA32UI),N===n.BYTE&&(q=n.RGBA8I),N===n.SHORT&&(q=n.RGBA16I),N===n.INT&&(q=n.RGBA32I)),_===n.RGB&&(N===n.UNSIGNED_SHORT&&re&&(q=re.RGB16_EXT),N===n.SHORT&&re&&(q=re.RGB16_SNORM_EXT),N===n.UNSIGNED_INT_5_9_9_9_REV&&(q=n.RGB9_E5),N===n.UNSIGNED_INT_10F_11F_11F_REV&&(q=n.R11F_G11F_B10F)),_===n.RGBA){const $=ne?ca:Ye.getTransfer(G);N===n.FLOAT&&(q=n.RGBA32F),N===n.HALF_FLOAT&&(q=n.RGBA16F),N===n.UNSIGNED_BYTE&&(q=$===nt?n.SRGB8_ALPHA8:n.RGBA8),N===n.UNSIGNED_SHORT&&re&&(q=re.RGBA16_EXT),N===n.SHORT&&re&&(q=re.RGBA16_SNORM_EXT),N===n.UNSIGNED_SHORT_4_4_4_4&&(q=n.RGBA4),N===n.UNSIGNED_SHORT_5_5_5_1&&(q=n.RGB5_A1)}return(q===n.R16F||q===n.R32F||q===n.RG16F||q===n.RG32F||q===n.RGBA16F||q===n.RGBA32F)&&e.get("EXT_color_buffer_float"),q}function b(T,_){let N;return T?_===null||_===Pn||_===Jr?N=n.DEPTH24_STENCIL8:_===an?N=n.DEPTH32F_STENCIL8:_===Zr&&(N=n.DEPTH24_STENCIL8,Ae("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Pn||_===Jr?N=n.DEPTH_COMPONENT24:_===an?N=n.DEPTH_COMPONENT32F:_===Zr&&(N=n.DEPTH_COMPONENT16),N}function R(T,_){return p(T)===!0||T.isFramebufferTexture&&T.minFilter!==Dt&&T.minFilter!==At?Math.log2(Math.max(_.width,_.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?_.mipmaps.length:1}function E(T){const _=T.target;_.removeEventListener("dispose",E),C(_),_.isVideoTexture&&d.delete(_),_.isHTMLTexture&&u.delete(_)}function y(T){const _=T.target;_.removeEventListener("dispose",y),D(_)}function C(T){const _=i.get(T);if(_.__webglInit===void 0)return;const N=T.source,k=f.get(N);if(k){const G=k[_.__cacheKey];G.usedTimes--,G.usedTimes===0&&P(T),Object.keys(k).length===0&&f.delete(N)}i.remove(T)}function P(T){const _=i.get(T);n.deleteTexture(_.__webglTexture);const N=T.source,k=f.get(N);delete k[_.__cacheKey],a.memory.textures--}function D(T){const _=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let k=0;k<6;k++){if(Array.isArray(_.__webglFramebuffer[k]))for(let G=0;G<_.__webglFramebuffer[k].length;G++)n.deleteFramebuffer(_.__webglFramebuffer[k][G]);else n.deleteFramebuffer(_.__webglFramebuffer[k]);_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer[k])}else{if(Array.isArray(_.__webglFramebuffer))for(let k=0;k<_.__webglFramebuffer.length;k++)n.deleteFramebuffer(_.__webglFramebuffer[k]);else n.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&n.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let k=0;k<_.__webglColorRenderbuffer.length;k++)_.__webglColorRenderbuffer[k]&&n.deleteRenderbuffer(_.__webglColorRenderbuffer[k]);_.__webglDepthRenderbuffer&&n.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const N=T.textures;for(let k=0,G=N.length;k<G;k++){const ne=i.get(N[k]);ne.__webglTexture&&(n.deleteTexture(ne.__webglTexture),a.memory.textures--),i.remove(N[k])}i.remove(T)}let U=0;function V(){U=0}function J(){return U}function I(T){U=T}function L(){const T=U;return T>=r.maxTextures&&Ae("WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+r.maxTextures),U+=1,T}function z(T){const _=[];return _.push(T.wrapS),_.push(T.wrapT),_.push(T.wrapR||0),_.push(T.magFilter),_.push(T.minFilter),_.push(T.anisotropy),_.push(T.internalFormat),_.push(T.format),_.push(T.type),_.push(T.generateMipmaps),_.push(T.premultiplyAlpha),_.push(T.flipY),_.push(T.unpackAlignment),_.push(T.colorSpace),_.join()}function K(T,_){const N=i.get(T);if(T.isVideoTexture&&S(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&N.__version!==T.version){const k=T.image;if(k===null)Ae("WebGLRenderer: Texture marked for update but no image data found.");else if(k.complete===!1)Ae("WebGLRenderer: Texture marked for update but image is incomplete");else{Ie(N,T,_);return}}else T.isExternalTexture&&(N.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,N.__webglTexture,n.TEXTURE0+_)}function ie(T,_){const N=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&N.__version!==T.version){Ie(N,T,_);return}else T.isExternalTexture&&(N.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,N.__webglTexture,n.TEXTURE0+_)}function Q(T,_){const N=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&N.__version!==T.version){Ie(N,T,_);return}t.bindTexture(n.TEXTURE_3D,N.__webglTexture,n.TEXTURE0+_)}function se(T,_){const N=i.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&N.__version!==T.version){Ne(N,T,_);return}t.bindTexture(n.TEXTURE_CUBE_MAP,N.__webglTexture,n.TEXTURE0+_)}const ce={[Mr]:n.REPEAT,[Rn]:n.CLAMP_TO_EDGE,[sa]:n.MIRRORED_REPEAT},Be={[Dt]:n.NEAREST,[Ou]:n.NEAREST_MIPMAP_NEAREST,[Wr]:n.NEAREST_MIPMAP_LINEAR,[At]:n.LINEAR,[Zs]:n.LINEAR_MIPMAP_NEAREST,[Gn]:n.LINEAR_MIPMAP_LINEAR},We={[Rm]:n.NEVER,[Dm]:n.ALWAYS,[Cm]:n.LESS,[ql]:n.LEQUAL,[Im]:n.EQUAL,[$l]:n.GEQUAL,[Pm]:n.GREATER,[Lm]:n.NOTEQUAL};function ze(T,_){if(_.type===an&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===At||_.magFilter===Zs||_.magFilter===Wr||_.magFilter===Gn||_.minFilter===At||_.minFilter===Zs||_.minFilter===Wr||_.minFilter===Gn)&&Ae("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,ce[_.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,ce[_.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,ce[_.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,Be[_.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,Be[_.minFilter]),_.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,We[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Dt||_.minFilter!==Wr&&_.minFilter!==Gn||_.type===an&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||i.get(_).__currentAnisotropy){const N=e.get("EXT_texture_filter_anisotropic");n.texParameterf(T,N.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,r.getMaxAnisotropy())),i.get(_).__currentAnisotropy=_.anisotropy}}}function te(T,_){let N=!1;T.__webglInit===void 0&&(T.__webglInit=!0,_.addEventListener("dispose",E));const k=_.source;let G=f.get(k);G===void 0&&(G={},f.set(k,G));const ne=z(_);if(ne!==T.__cacheKey){G[ne]===void 0&&(G[ne]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,N=!0),G[ne].usedTimes++;const re=G[T.__cacheKey];re!==void 0&&(G[T.__cacheKey].usedTimes--,re.usedTimes===0&&P(_)),T.__cacheKey=ne,T.__webglTexture=G[ne].texture}return N}function fe(T,_,N){return Math.floor(Math.floor(T/N)/_)}function le(T,_,N,k){const ne=T.updateRanges;if(ne.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,_.width,_.height,N,k,_.data);else{ne.sort((ue,ae)=>ue.start-ae.start);let re=0;for(let ue=1;ue<ne.length;ue++){const ae=ne[re],de=ne[ue],Ee=ae.start+ae.count,Re=fe(de.start,_.width,4),Fe=fe(ae.start,_.width,4);de.start<=Ee+1&&Re===Fe&&fe(de.start+de.count-1,_.width,4)===Re?ae.count=Math.max(ae.count,de.start+de.count-ae.start):(++re,ne[re]=de)}ne.length=re+1;const q=t.getParameter(n.UNPACK_ROW_LENGTH),$=t.getParameter(n.UNPACK_SKIP_PIXELS),oe=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,_.width);for(let ue=0,ae=ne.length;ue<ae;ue++){const de=ne[ue],Ee=Math.floor(de.start/4),Re=Math.ceil(de.count/4),Fe=Ee%_.width,F=Math.floor(Ee/_.width),he=Re,ee=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Fe),t.pixelStorei(n.UNPACK_SKIP_ROWS,F),t.texSubImage2D(n.TEXTURE_2D,0,Fe,F,he,ee,N,k,_.data)}T.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,q),t.pixelStorei(n.UNPACK_SKIP_PIXELS,$),t.pixelStorei(n.UNPACK_SKIP_ROWS,oe)}}function Ie(T,_,N){let k=n.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(k=n.TEXTURE_2D_ARRAY),_.isData3DTexture&&(k=n.TEXTURE_3D);const G=te(T,_),ne=_.source;t.bindTexture(k,T.__webglTexture,n.TEXTURE0+N);const re=i.get(ne);if(ne.version!==re.__version||G===!0){if(t.activeTexture(n.TEXTURE0+N),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){const ee=Ye.getPrimaries(Ye.workingColorSpace),pe=_.colorSpace===pi?null:Ye.getPrimaries(_.colorSpace),_e=_.colorSpace===pi||ee===pe?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,_e)}t.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment);let $=m(_.image,!1,r.maxTextureSize);$=Z(_,$);const oe=s.convert(_.format,_.colorSpace),ue=s.convert(_.type);let ae=M(_.internalFormat,oe,ue,_.normalized,_.colorSpace,_.isVideoTexture);ze(k,_);let de;const Ee=_.mipmaps,Re=_.isVideoTexture!==!0,Fe=re.__version===void 0||G===!0,F=ne.dataReady,he=R(_,$);if(_.isDepthTexture)ae=b(_.format===Li,_.type),Fe&&(Re?t.texStorage2D(n.TEXTURE_2D,1,ae,$.width,$.height):t.texImage2D(n.TEXTURE_2D,0,ae,$.width,$.height,0,oe,ue,null));else if(_.isDataTexture)if(Ee.length>0){Re&&Fe&&t.texStorage2D(n.TEXTURE_2D,he,ae,Ee[0].width,Ee[0].height);for(let ee=0,pe=Ee.length;ee<pe;ee++)de=Ee[ee],Re?F&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,de.width,de.height,oe,ue,de.data):t.texImage2D(n.TEXTURE_2D,ee,ae,de.width,de.height,0,oe,ue,de.data);_.generateMipmaps=!1}else Re?(Fe&&t.texStorage2D(n.TEXTURE_2D,he,ae,$.width,$.height),F&&le(_,$,oe,ue)):t.texImage2D(n.TEXTURE_2D,0,ae,$.width,$.height,0,oe,ue,$.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Re&&Fe&&t.texStorage3D(n.TEXTURE_2D_ARRAY,he,ae,Ee[0].width,Ee[0].height,$.depth);for(let ee=0,pe=Ee.length;ee<pe;ee++)if(de=Ee[ee],_.format!==on)if(oe!==null)if(Re){if(F)if(_.layerUpdates.size>0){const _e=Ad(de.width,de.height,_.format,_.type);for(const j of _.layerUpdates){const ge=de.data.subarray(j*_e/de.data.BYTES_PER_ELEMENT,(j+1)*_e/de.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,j,de.width,de.height,1,oe,ge)}_.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,0,de.width,de.height,$.depth,oe,de.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ee,ae,de.width,de.height,$.depth,0,de.data,0,0);else Ae("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Re?F&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,0,de.width,de.height,$.depth,oe,ue,de.data):t.texImage3D(n.TEXTURE_2D_ARRAY,ee,ae,de.width,de.height,$.depth,0,oe,ue,de.data)}else{Re&&Fe&&t.texStorage2D(n.TEXTURE_2D,he,ae,Ee[0].width,Ee[0].height);for(let ee=0,pe=Ee.length;ee<pe;ee++)de=Ee[ee],_.format!==on?oe!==null?Re?F&&t.compressedTexSubImage2D(n.TEXTURE_2D,ee,0,0,de.width,de.height,oe,de.data):t.compressedTexImage2D(n.TEXTURE_2D,ee,ae,de.width,de.height,0,de.data):Ae("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Re?F&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,de.width,de.height,oe,ue,de.data):t.texImage2D(n.TEXTURE_2D,ee,ae,de.width,de.height,0,oe,ue,de.data)}else if(_.isDataArrayTexture)if(Re){if(Fe&&t.texStorage3D(n.TEXTURE_2D_ARRAY,he,ae,$.width,$.height,$.depth),F)if(_.layerUpdates.size>0){const ee=Ad($.width,$.height,_.format,_.type);for(const pe of _.layerUpdates){const _e=$.data.subarray(pe*ee/$.data.BYTES_PER_ELEMENT,(pe+1)*ee/$.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,pe,$.width,$.height,1,oe,ue,_e)}_.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,$.width,$.height,$.depth,oe,ue,$.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,ae,$.width,$.height,$.depth,0,oe,ue,$.data);else if(_.isData3DTexture)Re?(Fe&&t.texStorage3D(n.TEXTURE_3D,he,ae,$.width,$.height,$.depth),F&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,$.width,$.height,$.depth,oe,ue,$.data)):t.texImage3D(n.TEXTURE_3D,0,ae,$.width,$.height,$.depth,0,oe,ue,$.data);else if(_.isFramebufferTexture){if(Fe)if(Re)t.texStorage2D(n.TEXTURE_2D,he,ae,$.width,$.height);else{let ee=$.width,pe=$.height;for(let _e=0;_e<he;_e++)t.texImage2D(n.TEXTURE_2D,_e,ae,ee,pe,0,oe,ue,null),ee>>=1,pe>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in n){const ee=n.canvas;if(ee.hasAttribute("layoutsubtree")||ee.setAttribute("layoutsubtree","true"),$.parentNode!==ee){ee.appendChild($),u.add(_),ee.onpaint=pe=>{const _e=pe.changedElements;for(const j of u)_e.includes(j.image)&&(j.needsUpdate=!0)},ee.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,$);else{const _e=n.RGBA,j=n.RGBA,ge=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,_e,j,ge,$)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(Ee.length>0){if(Re&&Fe){const ee=H(Ee[0]);t.texStorage2D(n.TEXTURE_2D,he,ae,ee.width,ee.height)}for(let ee=0,pe=Ee.length;ee<pe;ee++)de=Ee[ee],Re?F&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,oe,ue,de):t.texImage2D(n.TEXTURE_2D,ee,ae,oe,ue,de);_.generateMipmaps=!1}else if(Re){if(Fe){const ee=H($);t.texStorage2D(n.TEXTURE_2D,he,ae,ee.width,ee.height)}F&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,oe,ue,$)}else t.texImage2D(n.TEXTURE_2D,0,ae,oe,ue,$);p(_)&&w(k),re.__version=ne.version,_.onUpdate&&_.onUpdate(_)}T.__version=_.version}function Ne(T,_,N){if(_.image.length!==6)return;const k=te(T,_),G=_.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+N);const ne=i.get(G);if(G.version!==ne.__version||k===!0){t.activeTexture(n.TEXTURE0+N);const re=Ye.getPrimaries(Ye.workingColorSpace),q=_.colorSpace===pi?null:Ye.getPrimaries(_.colorSpace),$=_.colorSpace===pi||re===q?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,$);const oe=_.isCompressedTexture||_.image[0].isCompressedTexture,ue=_.image[0]&&_.image[0].isDataTexture,ae=[];for(let j=0;j<6;j++)!oe&&!ue?ae[j]=m(_.image[j],!0,r.maxCubemapSize):ae[j]=ue?_.image[j].image:_.image[j],ae[j]=Z(_,ae[j]);const de=ae[0],Ee=s.convert(_.format,_.colorSpace),Re=s.convert(_.type),Fe=M(_.internalFormat,Ee,Re,_.normalized,_.colorSpace),F=_.isVideoTexture!==!0,he=ne.__version===void 0||k===!0,ee=G.dataReady;let pe=R(_,de);ze(n.TEXTURE_CUBE_MAP,_);let _e;if(oe){F&&he&&t.texStorage2D(n.TEXTURE_CUBE_MAP,pe,Fe,de.width,de.height);for(let j=0;j<6;j++){_e=ae[j].mipmaps;for(let ge=0;ge<_e.length;ge++){const ve=_e[ge];_.format!==on?Ee!==null?F?ee&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge,0,0,ve.width,ve.height,Ee,ve.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge,Fe,ve.width,ve.height,0,ve.data):Ae("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):F?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge,0,0,ve.width,ve.height,Ee,Re,ve.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge,Fe,ve.width,ve.height,0,Ee,Re,ve.data)}}}else{if(_e=_.mipmaps,F&&he){_e.length>0&&pe++;const j=H(ae[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,pe,Fe,j.width,j.height)}for(let j=0;j<6;j++)if(ue){F?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,ae[j].width,ae[j].height,Ee,Re,ae[j].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Fe,ae[j].width,ae[j].height,0,Ee,Re,ae[j].data);for(let ge=0;ge<_e.length;ge++){const lt=_e[ge].image[j].image;F?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge+1,0,0,lt.width,lt.height,Ee,Re,lt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge+1,Fe,lt.width,lt.height,0,Ee,Re,lt.data)}}else{F?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,Ee,Re,ae[j]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Fe,Ee,Re,ae[j]);for(let ge=0;ge<_e.length;ge++){const ve=_e[ge];F?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge+1,0,0,Ee,Re,ve.image[j]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge+1,Fe,Ee,Re,ve.image[j])}}}p(_)&&w(n.TEXTURE_CUBE_MAP),ne.__version=G.version,_.onUpdate&&_.onUpdate(_)}T.__version=_.version}function Le(T,_,N,k,G,ne){const re=s.convert(N.format,N.colorSpace),q=s.convert(N.type),$=M(N.internalFormat,re,q,N.normalized,N.colorSpace),oe=i.get(_),ue=i.get(N);if(ue.__renderTarget=_,!oe.__hasExternalTextures){const ae=Math.max(1,_.width>>ne),de=Math.max(1,_.height>>ne);G===n.TEXTURE_3D||G===n.TEXTURE_2D_ARRAY?t.texImage3D(G,ne,$,ae,de,_.depth,0,re,q,null):t.texImage2D(G,ne,$,ae,de,0,re,q,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),xt(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,k,G,ue.__webglTexture,0,_t(_)):(G===n.TEXTURE_2D||G>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&G<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,k,G,ue.__webglTexture,ne),t.bindFramebuffer(n.FRAMEBUFFER,null)}function gt(T,_,N){if(n.bindRenderbuffer(n.RENDERBUFFER,T),_.depthBuffer){const k=_.depthTexture,G=k&&k.isDepthTexture?k.type:null,ne=b(_.stencilBuffer,G),re=_.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;xt(_)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,_t(_),ne,_.width,_.height):N?n.renderbufferStorageMultisample(n.RENDERBUFFER,_t(_),ne,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,ne,_.width,_.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,re,n.RENDERBUFFER,T)}else{const k=_.textures;for(let G=0;G<k.length;G++){const ne=k[G],re=s.convert(ne.format,ne.colorSpace),q=s.convert(ne.type),$=M(ne.internalFormat,re,q,ne.normalized,ne.colorSpace);xt(_)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,_t(_),$,_.width,_.height):N?n.renderbufferStorageMultisample(n.RENDERBUFFER,_t(_),$,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,$,_.width,_.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Xe(T,_,N){const k=_.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const G=i.get(_.depthTexture);if(G.__renderTarget=_,(!G.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),k){if(G.__webglInit===void 0&&(G.__webglInit=!0,_.depthTexture.addEventListener("dispose",E)),G.__webglTexture===void 0){G.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,G.__webglTexture),ze(n.TEXTURE_CUBE_MAP,_.depthTexture);const oe=s.convert(_.depthTexture.format),ue=s.convert(_.depthTexture.type);let ae;_.depthTexture.format===$n?ae=n.DEPTH_COMPONENT24:_.depthTexture.format===Li&&(ae=n.DEPTH24_STENCIL8);for(let de=0;de<6;de++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,0,ae,_.width,_.height,0,oe,ue,null)}}else K(_.depthTexture,0);const ne=G.__webglTexture,re=_t(_),q=k?n.TEXTURE_CUBE_MAP_POSITIVE_X+N:n.TEXTURE_2D,$=_.depthTexture.format===Li?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(_.depthTexture.format===$n)xt(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,q,ne,0,re):n.framebufferTexture2D(n.FRAMEBUFFER,$,q,ne,0);else if(_.depthTexture.format===Li)xt(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,q,ne,0,re):n.framebufferTexture2D(n.FRAMEBUFFER,$,q,ne,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function tt(T){const _=i.get(T),N=T.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==T.depthTexture){const k=T.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),k){const G=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,k.removeEventListener("dispose",G)};k.addEventListener("dispose",G),_.__depthDisposeCallback=G}_.__boundDepthTexture=k}if(T.depthTexture&&!_.__autoAllocateDepthBuffer)if(N)for(let k=0;k<6;k++)Xe(_.__webglFramebuffer[k],T,k);else{const k=T.texture.mipmaps;k&&k.length>0?Xe(_.__webglFramebuffer[0],T,0):Xe(_.__webglFramebuffer,T,0)}else if(N){_.__webglDepthbuffer=[];for(let k=0;k<6;k++)if(t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[k]),_.__webglDepthbuffer[k]===void 0)_.__webglDepthbuffer[k]=n.createRenderbuffer(),gt(_.__webglDepthbuffer[k],T,!1);else{const G=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ne=_.__webglDepthbuffer[k];n.bindRenderbuffer(n.RENDERBUFFER,ne),n.framebufferRenderbuffer(n.FRAMEBUFFER,G,n.RENDERBUFFER,ne)}}else{const k=T.texture.mipmaps;if(k&&k.length>0?t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=n.createRenderbuffer(),gt(_.__webglDepthbuffer,T,!1);else{const G=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ne=_.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ne),n.framebufferRenderbuffer(n.FRAMEBUFFER,G,n.RENDERBUFFER,ne)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function Qe(T,_,N){const k=i.get(T);_!==void 0&&Le(k.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),N!==void 0&&tt(T)}function Je(T){const _=T.texture,N=i.get(T),k=i.get(_);T.addEventListener("dispose",y);const G=T.textures,ne=T.isWebGLCubeRenderTarget===!0,re=G.length>1;if(re||(k.__webglTexture===void 0&&(k.__webglTexture=n.createTexture()),k.__version=_.version,a.memory.textures++),ne){N.__webglFramebuffer=[];for(let q=0;q<6;q++)if(_.mipmaps&&_.mipmaps.length>0){N.__webglFramebuffer[q]=[];for(let $=0;$<_.mipmaps.length;$++)N.__webglFramebuffer[q][$]=n.createFramebuffer()}else N.__webglFramebuffer[q]=n.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){N.__webglFramebuffer=[];for(let q=0;q<_.mipmaps.length;q++)N.__webglFramebuffer[q]=n.createFramebuffer()}else N.__webglFramebuffer=n.createFramebuffer();if(re)for(let q=0,$=G.length;q<$;q++){const oe=i.get(G[q]);oe.__webglTexture===void 0&&(oe.__webglTexture=n.createTexture(),a.memory.textures++)}if(T.samples>0&&xt(T)===!1){N.__webglMultisampledFramebuffer=n.createFramebuffer(),N.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,N.__webglMultisampledFramebuffer);for(let q=0;q<G.length;q++){const $=G[q];N.__webglColorRenderbuffer[q]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,N.__webglColorRenderbuffer[q]);const oe=s.convert($.format,$.colorSpace),ue=s.convert($.type),ae=M($.internalFormat,oe,ue,$.normalized,$.colorSpace,T.isXRRenderTarget===!0),de=_t(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,de,ae,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+q,n.RENDERBUFFER,N.__webglColorRenderbuffer[q])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(N.__webglDepthRenderbuffer=n.createRenderbuffer(),gt(N.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ne){t.bindTexture(n.TEXTURE_CUBE_MAP,k.__webglTexture),ze(n.TEXTURE_CUBE_MAP,_);for(let q=0;q<6;q++)if(_.mipmaps&&_.mipmaps.length>0)for(let $=0;$<_.mipmaps.length;$++)Le(N.__webglFramebuffer[q][$],T,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+q,$);else Le(N.__webglFramebuffer[q],T,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+q,0);p(_)&&w(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(re){for(let q=0,$=G.length;q<$;q++){const oe=G[q],ue=i.get(oe);let ae=n.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ae=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ae,ue.__webglTexture),ze(ae,oe),Le(N.__webglFramebuffer,T,oe,n.COLOR_ATTACHMENT0+q,ae,0),p(oe)&&w(ae)}t.unbindTexture()}else{let q=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(q=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(q,k.__webglTexture),ze(q,_),_.mipmaps&&_.mipmaps.length>0)for(let $=0;$<_.mipmaps.length;$++)Le(N.__webglFramebuffer[$],T,_,n.COLOR_ATTACHMENT0,q,$);else Le(N.__webglFramebuffer,T,_,n.COLOR_ATTACHMENT0,q,0);p(_)&&w(q),t.unbindTexture()}T.depthBuffer&&tt(T)}function yt(T){const _=T.textures;for(let N=0,k=_.length;N<k;N++){const G=_[N];if(p(G)){const ne=A(T),re=i.get(G).__webglTexture;t.bindTexture(ne,re),w(ne),t.unbindTexture()}}}const Tt=[],Mt=[];function It(T){if(T.samples>0){if(xt(T)===!1){const _=T.textures,N=T.width,k=T.height;let G=n.COLOR_BUFFER_BIT;const ne=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,re=i.get(T),q=_.length>1;if(q)for(let oe=0;oe<_.length;oe++)t.bindFramebuffer(n.FRAMEBUFFER,re.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+oe,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,re.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+oe,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,re.__webglMultisampledFramebuffer);const $=T.texture.mipmaps;$&&$.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,re.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,re.__webglFramebuffer);for(let oe=0;oe<_.length;oe++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(G|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(G|=n.STENCIL_BUFFER_BIT)),q){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,re.__webglColorRenderbuffer[oe]);const ue=i.get(_[oe]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ue,0)}n.blitFramebuffer(0,0,N,k,0,0,N,k,G,n.NEAREST),l===!0&&(Tt.length=0,Mt.length=0,Tt.push(n.COLOR_ATTACHMENT0+oe),T.depthBuffer&&T.resolveDepthBuffer===!1&&(Tt.push(ne),Mt.push(ne),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Mt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Tt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),q)for(let oe=0;oe<_.length;oe++){t.bindFramebuffer(n.FRAMEBUFFER,re.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+oe,n.RENDERBUFFER,re.__webglColorRenderbuffer[oe]);const ue=i.get(_[oe]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,re.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+oe,n.TEXTURE_2D,ue,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,re.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){const _=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[_])}}}function _t(T){return Math.min(r.maxSamples,T.samples)}function xt(T){const _=i.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function S(T){const _=a.render.frame;d.get(T)!==_&&(d.set(T,_),T.update())}function Z(T,_){const N=T.colorSpace,k=T.format,G=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||N!==en&&N!==pi&&(Ye.getTransfer(N)===nt?(k!==on||G!==Qt)&&Ae("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Oe("WebGLTextures: Unsupported texture color space:",N)),_}function H(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=L,this.resetTextureUnits=V,this.getTextureUnits=J,this.setTextureUnits=I,this.setTexture2D=K,this.setTexture2DArray=ie,this.setTexture3D=Q,this.setTextureCube=se,this.rebindTextures=Qe,this.setupRenderTarget=Je,this.updateRenderTargetMipmap=yt,this.updateMultisampleRenderTarget=It,this.setupDepthRenderbuffer=tt,this.setupFrameBufferTexture=Le,this.useMultisampledRTT=xt,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function ix(n,e){function t(i,r=pi){let s;const a=Ye.getTransfer(r);if(i===Qt)return n.UNSIGNED_BYTE;if(i===zl)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Gl)return n.UNSIGNED_SHORT_5_5_5_1;if(i===zu)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Gu)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===ku)return n.BYTE;if(i===Bu)return n.SHORT;if(i===Zr)return n.UNSIGNED_SHORT;if(i===Bl)return n.INT;if(i===Pn)return n.UNSIGNED_INT;if(i===an)return n.FLOAT;if(i===qn)return n.HALF_FLOAT;if(i===Hu)return n.ALPHA;if(i===Vu)return n.RGB;if(i===on)return n.RGBA;if(i===$n)return n.DEPTH_COMPONENT;if(i===Li)return n.DEPTH_STENCIL;if(i===Hl)return n.RED;if(i===Vl)return n.RED_INTEGER;if(i===Ui)return n.RG;if(i===Wl)return n.RG_INTEGER;if(i===Xl)return n.RGBA_INTEGER;if(i===Js||i===Qs||i===js||i===ea)if(a===nt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===Js)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Qs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===js)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===ea)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===Js)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Qs)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===js)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===ea)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Bo||i===zo||i===Go||i===Ho)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Bo)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===zo)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Go)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Ho)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Vo||i===Wo||i===Xo||i===qo||i===$o||i===aa||i===Ko)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Vo||i===Wo)return a===nt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Xo)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===qo)return s.COMPRESSED_R11_EAC;if(i===$o)return s.COMPRESSED_SIGNED_R11_EAC;if(i===aa)return s.COMPRESSED_RG11_EAC;if(i===Ko)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Yo||i===Zo||i===Jo||i===Qo||i===jo||i===el||i===tl||i===nl||i===il||i===rl||i===sl||i===al||i===ol||i===ll)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Yo)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Zo)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Jo)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Qo)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===jo)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===el)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===tl)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===nl)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===il)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===rl)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===sl)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===al)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===ol)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===ll)return a===nt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===cl||i===dl||i===ul)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===cl)return a===nt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===dl)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===ul)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===hl||i===fl||i===oa||i===pl)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===hl)return s.COMPRESSED_RED_RGTC1_EXT;if(i===fl)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===oa)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===pl)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Jr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const rx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,sx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class ax{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new rh(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new Ln({vertexShader:rx,fragmentShader:sx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new me(new ls(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class ox extends Oi{constructor(e,t){super();const i=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,d=null,u=null,h=null,f=null,g=null;const v=typeof XRWebGLBinding<"u",m=new ax,p={},w=t.getContextAttributes();let A=null,M=null;const b=[],R=[],E=new ke;let y=null;const C=new $t;C.viewport=new ot;const P=new $t;P.viewport=new ot;const D=[C,P],U=new l0;let V=null,J=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(te){let fe=b[te];return fe===void 0&&(fe=new Xa,b[te]=fe),fe.getTargetRaySpace()},this.getControllerGrip=function(te){let fe=b[te];return fe===void 0&&(fe=new Xa,b[te]=fe),fe.getGripSpace()},this.getHand=function(te){let fe=b[te];return fe===void 0&&(fe=new Xa,b[te]=fe),fe.getHandSpace()};function I(te){const fe=R.indexOf(te.inputSource);if(fe===-1)return;const le=b[fe];le!==void 0&&(le.update(te.inputSource,te.frame,c||a),le.dispatchEvent({type:te.type,data:te.inputSource}))}function L(){r.removeEventListener("select",I),r.removeEventListener("selectstart",I),r.removeEventListener("selectend",I),r.removeEventListener("squeeze",I),r.removeEventListener("squeezestart",I),r.removeEventListener("squeezeend",I),r.removeEventListener("end",L),r.removeEventListener("inputsourceschange",z);for(let te=0;te<b.length;te++){const fe=R[te];fe!==null&&(R[te]=null,b[te].disconnect(fe))}V=null,J=null,m.reset();for(const te in p)delete p[te];e.setRenderTarget(A),f=null,h=null,u=null,r=null,M=null,ze.stop(),i.isPresenting=!1,e.setPixelRatio(y),e.setSize(E.width,E.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(te){s=te,i.isPresenting===!0&&Ae("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(te){o=te,i.isPresenting===!0&&Ae("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(te){c=te},this.getBaseLayer=function(){return h!==null?h:f},this.getBinding=function(){return u===null&&v&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(te){if(r=te,r!==null){if(A=e.getRenderTarget(),r.addEventListener("select",I),r.addEventListener("selectstart",I),r.addEventListener("selectend",I),r.addEventListener("squeeze",I),r.addEventListener("squeezestart",I),r.addEventListener("squeezeend",I),r.addEventListener("end",L),r.addEventListener("inputsourceschange",z),w.xrCompatible!==!0&&await t.makeXRCompatible(),y=e.getPixelRatio(),e.getSize(E),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let le=null,Ie=null,Ne=null;w.depth&&(Ne=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,le=w.stencil?Li:$n,Ie=w.stencil?Jr:Pn);const Le={colorFormat:t.RGBA8,depthFormat:Ne,scaleFactor:s};u=this.getBinding(),h=u.createProjectionLayer(Le),r.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),M=new In(h.textureWidth,h.textureHeight,{format:on,type:Qt,depthTexture:new br(h.textureWidth,h.textureHeight,Ie,void 0,void 0,void 0,void 0,void 0,void 0,le),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{const le={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(r,t,le),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),M=new In(f.framebufferWidth,f.framebufferHeight,{format:on,type:Qt,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),ze.setContext(r),ze.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function z(te){for(let fe=0;fe<te.removed.length;fe++){const le=te.removed[fe],Ie=R.indexOf(le);Ie>=0&&(R[Ie]=null,b[Ie].disconnect(le))}for(let fe=0;fe<te.added.length;fe++){const le=te.added[fe];let Ie=R.indexOf(le);if(Ie===-1){for(let Le=0;Le<b.length;Le++)if(Le>=R.length){R.push(le),Ie=Le;break}else if(R[Le]===null){R[Le]=le,Ie=Le;break}if(Ie===-1)break}const Ne=b[Ie];Ne&&Ne.connect(le)}}const K=new O,ie=new O;function Q(te,fe,le){K.setFromMatrixPosition(fe.matrixWorld),ie.setFromMatrixPosition(le.matrixWorld);const Ie=K.distanceTo(ie),Ne=fe.projectionMatrix.elements,Le=le.projectionMatrix.elements,gt=Ne[14]/(Ne[10]-1),Xe=Ne[14]/(Ne[10]+1),tt=(Ne[9]+1)/Ne[5],Qe=(Ne[9]-1)/Ne[5],Je=(Ne[8]-1)/Ne[0],yt=(Le[8]+1)/Le[0],Tt=gt*Je,Mt=gt*yt,It=Ie/(-Je+yt),_t=It*-Je;if(fe.matrixWorld.decompose(te.position,te.quaternion,te.scale),te.translateX(_t),te.translateZ(It),te.matrixWorld.compose(te.position,te.quaternion,te.scale),te.matrixWorldInverse.copy(te.matrixWorld).invert(),Ne[10]===-1)te.projectionMatrix.copy(fe.projectionMatrix),te.projectionMatrixInverse.copy(fe.projectionMatrixInverse);else{const xt=gt+It,S=Xe+It,Z=Tt-_t,H=Mt+(Ie-_t),T=tt*Xe/S*xt,_=Qe*Xe/S*xt;te.projectionMatrix.makePerspective(Z,H,T,_,xt,S),te.projectionMatrixInverse.copy(te.projectionMatrix).invert()}}function se(te,fe){fe===null?te.matrixWorld.copy(te.matrix):te.matrixWorld.multiplyMatrices(fe.matrixWorld,te.matrix),te.matrixWorldInverse.copy(te.matrixWorld).invert()}this.updateCamera=function(te){if(r===null)return;let fe=te.near,le=te.far;m.texture!==null&&(m.depthNear>0&&(fe=m.depthNear),m.depthFar>0&&(le=m.depthFar)),U.near=P.near=C.near=fe,U.far=P.far=C.far=le,(V!==U.near||J!==U.far)&&(r.updateRenderState({depthNear:U.near,depthFar:U.far}),V=U.near,J=U.far),U.layers.mask=te.layers.mask|6,C.layers.mask=U.layers.mask&-5,P.layers.mask=U.layers.mask&-3;const Ie=te.parent,Ne=U.cameras;se(U,Ie);for(let Le=0;Le<Ne.length;Le++)se(Ne[Le],Ie);Ne.length===2?Q(U,C,P):U.projectionMatrix.copy(C.projectionMatrix),ce(te,U,Ie)};function ce(te,fe,le){le===null?te.matrix.copy(fe.matrixWorld):(te.matrix.copy(le.matrixWorld),te.matrix.invert(),te.matrix.multiply(fe.matrixWorld)),te.matrix.decompose(te.position,te.quaternion,te.scale),te.updateMatrixWorld(!0),te.projectionMatrix.copy(fe.projectionMatrix),te.projectionMatrixInverse.copy(fe.projectionMatrixInverse),te.isPerspectiveCamera&&(te.fov=xr*2*Math.atan(1/te.projectionMatrix.elements[5]),te.zoom=1)}this.getCamera=function(){return U},this.getFoveation=function(){if(!(h===null&&f===null))return l},this.setFoveation=function(te){l=te,h!==null&&(h.fixedFoveation=te),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=te)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(U)},this.getCameraTexture=function(te){return p[te]};let Be=null;function We(te,fe){if(d=fe.getViewerPose(c||a),g=fe,d!==null){const le=d.views;f!==null&&(e.setRenderTargetFramebuffer(M,f.framebuffer),e.setRenderTarget(M));let Ie=!1;le.length!==U.cameras.length&&(U.cameras.length=0,Ie=!0);for(let Xe=0;Xe<le.length;Xe++){const tt=le[Xe];let Qe=null;if(f!==null)Qe=f.getViewport(tt);else{const yt=u.getViewSubImage(h,tt);Qe=yt.viewport,Xe===0&&(e.setRenderTargetTextures(M,yt.colorTexture,yt.depthStencilTexture),e.setRenderTarget(M))}let Je=D[Xe];Je===void 0&&(Je=new $t,Je.layers.enable(Xe),Je.viewport=new ot,D[Xe]=Je),Je.matrix.fromArray(tt.transform.matrix),Je.matrix.decompose(Je.position,Je.quaternion,Je.scale),Je.projectionMatrix.fromArray(tt.projectionMatrix),Je.projectionMatrixInverse.copy(Je.projectionMatrix).invert(),Je.viewport.set(Qe.x,Qe.y,Qe.width,Qe.height),Xe===0&&(U.matrix.copy(Je.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),Ie===!0&&U.cameras.push(Je)}const Ne=r.enabledFeatures;if(Ne&&Ne.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&v){u=i.getBinding();const Xe=u.getDepthInformation(le[0]);Xe&&Xe.isValid&&Xe.texture&&m.init(Xe,r.renderState)}if(Ne&&Ne.includes("camera-access")&&v){e.state.unbindTexture(),u=i.getBinding();for(let Xe=0;Xe<le.length;Xe++){const tt=le[Xe].camera;if(tt){let Qe=p[tt];Qe||(Qe=new rh,p[tt]=Qe);const Je=u.getCameraImage(tt);Qe.sourceTexture=Je}}}}for(let le=0;le<b.length;le++){const Ie=R[le],Ne=b[le];Ie!==null&&Ne!==void 0&&Ne.update(Ie,fe,c||a)}Be&&Be(te,fe),fe.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:fe}),g=null}const ze=new dh;ze.setAnimationLoop(We),this.setAnimationLoop=function(te){Be=te},this.dispose=function(){}}}const lx=new Ve,_h=new Ge;_h.set(-1,0,0,0,1,0,0,0,1);function cx(n,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,sh(n)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function r(m,p,w,A,M){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(m,p):p.isMeshLambertMaterial?(s(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(m,p),u(m,p)):p.isMeshPhongMaterial?(s(m,p),d(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(m,p),h(m,p),p.isMeshPhysicalMaterial&&f(m,p,M)):p.isMeshMatcapMaterial?(s(m,p),g(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),v(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,w,A):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Kt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Kt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const w=e.get(p),A=w.envMap,M=w.envMapRotation;A&&(m.envMap.value=A,m.envMapRotation.value.setFromMatrix4(lx.makeRotationFromEuler(M)).transpose(),A.isCubeTexture&&A.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(_h),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,w,A){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*w,m.scale.value=A*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function d(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function h(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,w){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Kt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=w.texture,m.transmissionSamplerSize.value.set(w.width,w.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function v(m,p){const w=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(w.matrixWorld),m.nearDistance.value=w.shadow.camera.near,m.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function dx(n,e,t,i){let r={},s={},a=[];const o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,b){const R=b.program;i.uniformBlockBinding(M,R)}function c(M,b){let R=r[M.id];R===void 0&&(m(M),R=d(M),r[M.id]=R,M.addEventListener("dispose",w));const E=b.program;i.updateUBOMapping(M,E);const y=e.render.frame;s[M.id]!==y&&(h(M),s[M.id]=y)}function d(M){const b=u();M.__bindingPointIndex=b;const R=n.createBuffer(),E=M.__size,y=M.usage;return n.bindBuffer(n.UNIFORM_BUFFER,R),n.bufferData(n.UNIFORM_BUFFER,E,y),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,b,R),R}function u(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return Oe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(M){const b=r[M.id],R=M.uniforms,E=M.__cache;n.bindBuffer(n.UNIFORM_BUFFER,b);for(let y=0,C=R.length;y<C;y++){const P=R[y];if(Array.isArray(P))for(let D=0,U=P.length;D<U;D++)f(P[D],y,D,E);else f(P,y,0,E)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(M,b,R,E){if(v(M,b,R,E)===!0){const y=M.__offset,C=M.value;if(Array.isArray(C)){let P=0;for(let D=0;D<C.length;D++){const U=C[D],V=p(U);g(U,M.__data,P),typeof U!="number"&&typeof U!="boolean"&&!U.isMatrix3&&!ArrayBuffer.isView(U)&&(P+=V.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(C,M.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,y,M.__data)}}function g(M,b,R){typeof M=="number"||typeof M=="boolean"?b[0]=M:M.isMatrix3?(b[0]=M.elements[0],b[1]=M.elements[1],b[2]=M.elements[2],b[3]=0,b[4]=M.elements[3],b[5]=M.elements[4],b[6]=M.elements[5],b[7]=0,b[8]=M.elements[6],b[9]=M.elements[7],b[10]=M.elements[8],b[11]=0):ArrayBuffer.isView(M)?b.set(new M.constructor(M.buffer,M.byteOffset,b.length)):M.toArray(b,R)}function v(M,b,R,E){const y=M.value,C=b+"_"+R;if(E[C]===void 0)return typeof y=="number"||typeof y=="boolean"?E[C]=y:ArrayBuffer.isView(y)?E[C]=y.slice():E[C]=y.clone(),!0;{const P=E[C];if(typeof y=="number"||typeof y=="boolean"){if(P!==y)return E[C]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(P.equals(y)===!1)return P.copy(y),!0}}return!1}function m(M){const b=M.uniforms;let R=0;const E=16;for(let C=0,P=b.length;C<P;C++){const D=Array.isArray(b[C])?b[C]:[b[C]];for(let U=0,V=D.length;U<V;U++){const J=D[U],I=Array.isArray(J.value)?J.value:[J.value];for(let L=0,z=I.length;L<z;L++){const K=I[L],ie=p(K),Q=R%E,se=Q%ie.boundary,ce=Q+se;R+=se,ce!==0&&E-ce<ie.storage&&(R+=E-ce),J.__data=new Float32Array(ie.storage/Float32Array.BYTES_PER_ELEMENT),J.__offset=R,R+=ie.storage}}}const y=R%E;return y>0&&(R+=E-y),M.__size=R,M.__cache={},this}function p(M){const b={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(b.boundary=4,b.storage=4):M.isVector2?(b.boundary=8,b.storage=8):M.isVector3||M.isColor?(b.boundary=16,b.storage=12):M.isVector4?(b.boundary=16,b.storage=16):M.isMatrix3?(b.boundary=48,b.storage=48):M.isMatrix4?(b.boundary=64,b.storage=64):M.isTexture?Ae("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(M)?(b.boundary=16,b.storage=M.byteLength):Ae("WebGLRenderer: Unsupported uniform value type.",M),b}function w(M){const b=M.target;b.removeEventListener("dispose",w);const R=a.indexOf(b.__bindingPointIndex);a.splice(R,1),n.deleteBuffer(r[b.id]),delete r[b.id],delete s[b.id]}function A(){for(const M in r)n.deleteBuffer(r[M]);a=[],r={},s={}}return{bind:l,update:c,dispose:A}}const ux=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Tn=null;function hx(){return Tn===null&&(Tn=new Zl(ux,16,16,Ui,qn),Tn.name="DFG_LUT",Tn.minFilter=At,Tn.magFilter=At,Tn.wrapS=Rn,Tn.wrapT=Rn,Tn.generateMipmaps=!1,Tn.needsUpdate=!0),Tn}class fx{constructor(e={}){const{canvas:t=Fm(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:h=!1,outputBufferType:f=Qt}=e;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=a;const v=f,m=new Set([Xl,Wl,Vl]),p=new Set([Qt,Pn,Zr,Jr,zl,Gl]),w=new Uint32Array(4),A=new Int32Array(4),M=new O;let b=null,R=null;const E=[],y=[];let C=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=mn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const P=this;let D=!1,U=null,V=null,J=null,I=null;this._outputColorSpace=Pt;let L=0,z=0,K=null,ie=-1,Q=null;const se=new ot,ce=new ot;let Be=null;const We=new De(0);let ze=0,te=t.width,fe=t.height,le=1,Ie=null,Ne=null;const Le=new ot(0,0,te,fe),gt=new ot(0,0,te,fe);let Xe=!1;const tt=new Ql;let Qe=!1,Je=!1;const yt=new Ve,Tt=new O,Mt=new ot,It={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let _t=!1;function xt(){return K===null?le:1}let S=i;function Z(x,B){return t.getContext(x,B)}try{const x={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ol}`),t.addEventListener("webglcontextlost",lt,!1),t.addEventListener("webglcontextrestored",ft,!1),t.addEventListener("webglcontextcreationerror",Mn,!1),S===null){const B="webgl2";if(S=Z(B,x),S===null)throw Z(B)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(x){throw Oe("WebGLRenderer: "+x.message),x}let H,T,_,N,k,G,ne,re,q,$,oe,ue,ae,de,Ee,Re,Fe,F,he,ee,pe,_e,j;function ge(){H=new hy(S),H.init(),pe=new ix(S,H),T=new ry(S,H,e,pe),_=new tx(S,H),T.reversedDepthBuffer&&h&&_.buffers.depth.setReversed(!0),V=S.createFramebuffer(),J=S.createFramebuffer(),I=S.createFramebuffer(),N=new my(S),k=new GM,G=new nx(S,H,_,k,T,pe,N),ne=new uy(P),re=new y0(S),_e=new ny(S,re),q=new fy(S,re,N,_e),$=new _y(S,q,re,_e,N),F=new gy(S,T,G),Ee=new sy(k),oe=new zM(P,ne,H,T,_e,Ee),ue=new cx(P,k),ae=new VM,de=new YM(H),Fe=new ty(P,ne,_,$,g,l),Re=new ex(P,$,T),j=new dx(S,N,T,_),he=new iy(S,H,N),ee=new py(S,H,N),N.programs=oe.programs,P.capabilities=T,P.extensions=H,P.properties=k,P.renderLists=ae,P.shadowMap=Re,P.state=_,P.info=N}ge(),v!==Qt&&(C=new yy(v,t.width,t.height,o,r,s));const ve=new ox(P,S);this.xr=ve,this.getContext=function(){return S},this.getContextAttributes=function(){return S.getContextAttributes()},this.forceContextLoss=function(){const x=H.get("WEBGL_lose_context");x&&x.loseContext()},this.forceContextRestore=function(){const x=H.get("WEBGL_lose_context");x&&x.restoreContext()},this.getPixelRatio=function(){return le},this.setPixelRatio=function(x){x!==void 0&&(le=x,this.setSize(te,fe,!1))},this.getSize=function(x){return x.set(te,fe)},this.setSize=function(x,B,Y=!0){if(ve.isPresenting){Ae("WebGLRenderer: Can't change size while VR device is presenting.");return}te=x,fe=B,t.width=Math.floor(x*le),t.height=Math.floor(B*le),Y===!0&&(t.style.width=x+"px",t.style.height=B+"px"),C!==null&&C.setSize(t.width,t.height),this.setViewport(0,0,x,B)},this.getDrawingBufferSize=function(x){return x.set(te*le,fe*le).floor()},this.setDrawingBufferSize=function(x,B,Y){te=x,fe=B,le=Y,t.width=Math.floor(x*Y),t.height=Math.floor(B*Y),this.setViewport(0,0,x,B)},this.setEffects=function(x){if(v===Qt){Oe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(x){for(let B=0;B<x.length;B++)if(x[B].isOutputPass===!0){Ae("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}C.setEffects(x||[])},this.getCurrentViewport=function(x){return x.copy(se)},this.getViewport=function(x){return x.copy(Le)},this.setViewport=function(x,B,Y,W){x.isVector4?Le.set(x.x,x.y,x.z,x.w):Le.set(x,B,Y,W),_.viewport(se.copy(Le).multiplyScalar(le).round())},this.getScissor=function(x){return x.copy(gt)},this.setScissor=function(x,B,Y,W){x.isVector4?gt.set(x.x,x.y,x.z,x.w):gt.set(x,B,Y,W),_.scissor(ce.copy(gt).multiplyScalar(le).round())},this.getScissorTest=function(){return Xe},this.setScissorTest=function(x){_.setScissorTest(Xe=x)},this.setOpaqueSort=function(x){Ie=x},this.setTransparentSort=function(x){Ne=x},this.getClearColor=function(x){return x.copy(Fe.getClearColor())},this.setClearColor=function(){Fe.setClearColor(...arguments)},this.getClearAlpha=function(){return Fe.getClearAlpha()},this.setClearAlpha=function(){Fe.setClearAlpha(...arguments)},this.clear=function(x=!0,B=!0,Y=!0){let W=0;if(x){let X=!1;if(K!==null){const xe=K.texture.format;X=m.has(xe)}if(X){const xe=K.texture.type,Te=p.has(xe),Me=Fe.getClearColor(),we=Fe.getClearAlpha(),Ce=Me.r,He=Me.g,$e=Me.b;Te?(w[0]=Ce,w[1]=He,w[2]=$e,w[3]=we,S.clearBufferuiv(S.COLOR,0,w)):(A[0]=Ce,A[1]=He,A[2]=$e,A[3]=we,S.clearBufferiv(S.COLOR,0,A))}else W|=S.COLOR_BUFFER_BIT}B&&(W|=S.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Y&&(W|=S.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),W!==0&&S.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(x){x.setRenderer(this),U=x},this.dispose=function(){t.removeEventListener("webglcontextlost",lt,!1),t.removeEventListener("webglcontextrestored",ft,!1),t.removeEventListener("webglcontextcreationerror",Mn,!1),Fe.dispose(),ae.dispose(),de.dispose(),k.dispose(),ne.dispose(),$.dispose(),_e.dispose(),j.dispose(),oe.dispose(),ve.dispose(),ve.removeEventListener("sessionstart",hc),ve.removeEventListener("sessionend",fc),Mi.stop()};function lt(x){x.preventDefault(),da("WebGLRenderer: Context Lost."),D=!0}function ft(){da("WebGLRenderer: Context Restored."),D=!1;const x=N.autoReset,B=Re.enabled,Y=Re.autoUpdate,W=Re.needsUpdate,X=Re.type;ge(),N.autoReset=x,Re.enabled=B,Re.autoUpdate=Y,Re.needsUpdate=W,Re.type=X}function Mn(x){Oe("WebGLRenderer: A WebGL context could not be created. Reason: ",x.statusMessage)}function xn(x){const B=x.target;B.removeEventListener("dispose",xn),wh(B)}function wh(x){Ah(x),k.remove(x)}function Ah(x){const B=k.get(x).programs;B!==void 0&&(B.forEach(function(Y){oe.releaseProgram(Y)}),x.isShaderMaterial&&oe.releaseShaderCache(x))}this.renderBufferDirect=function(x,B,Y,W,X,xe){B===null&&(B=It);const Te=X.isMesh&&X.matrixWorld.determinantAffine()<0,Me=Ih(x,B,Y,W,X);_.setMaterial(W,Te);let we=Y.index,Ce=1;if(W.wireframe===!0){if(we=q.getWireframeAttribute(Y),we===void 0)return;Ce=2}const He=Y.drawRange,$e=Y.attributes.position;let Pe=He.start*Ce,st=(He.start+He.count)*Ce;xe!==null&&(Pe=Math.max(Pe,xe.start*Ce),st=Math.min(st,(xe.start+xe.count)*Ce)),we!==null?(Pe=Math.max(Pe,0),st=Math.min(st,we.count)):$e!=null&&(Pe=Math.max(Pe,0),st=Math.min(st,$e.count));const Et=st-Pe;if(Et<0||Et===1/0)return;_e.setup(X,W,Me,Y,we);let St,ct=he;if(we!==null&&(St=re.get(we),ct=ee,ct.setIndex(St)),X.isMesh)W.wireframe===!0?(_.setLineWidth(W.wireframeLinewidth*xt()),ct.setMode(S.LINES)):ct.setMode(S.TRIANGLES);else if(X.isLine){let Gt=W.linewidth;Gt===void 0&&(Gt=1),_.setLineWidth(Gt*xt()),X.isLineSegments?ct.setMode(S.LINES):X.isLineLoop?ct.setMode(S.LINE_LOOP):ct.setMode(S.LINE_STRIP)}else X.isPoints?ct.setMode(S.POINTS):X.isSprite&&ct.setMode(S.TRIANGLES);if(X.isBatchedMesh)if(H.get("WEBGL_multi_draw"))ct.renderMultiDraw(X._multiDrawStarts,X._multiDrawCounts,X._multiDrawCount);else{const Gt=X._multiDrawStarts,Se=X._multiDrawCounts,Yt=X._multiDrawCount,et=we?re.get(we).bytesPerElement:1,tn=k.get(W).currentProgram.getUniforms();for(let bn=0;bn<Yt;bn++)tn.setValue(S,"_gl_DrawID",bn),ct.render(Gt[bn]/et,Se[bn])}else if(X.isInstancedMesh)ct.renderInstances(Pe,Et,X.count);else if(Y.isInstancedBufferGeometry){const Gt=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,Se=Math.min(Y.instanceCount,Gt);ct.renderInstances(Pe,Et,Se)}else ct.render(Pe,Et)};function uc(x,B,Y){x.transparent===!0&&x.side===An&&x.forceSinglePass===!1?(x.side=Kt,x.needsUpdate=!0,us(x,B,Y),x.side=Xn,x.needsUpdate=!0,us(x,B,Y),x.side=An):us(x,B,Y)}this.compile=function(x,B,Y=null){Y===null&&(Y=x),R=de.get(Y),R.init(B),y.push(R),Y.traverseVisible(function(X){X.isLight&&X.layers.test(B.layers)&&(R.pushLight(X),X.castShadow&&R.pushShadow(X))}),x!==Y&&x.traverseVisible(function(X){X.isLight&&X.layers.test(B.layers)&&(R.pushLight(X),X.castShadow&&R.pushShadow(X))}),R.setupLights();const W=new Set;return x.traverse(function(X){if(!(X.isMesh||X.isPoints||X.isLine||X.isSprite))return;const xe=X.material;if(xe)if(Array.isArray(xe))for(let Te=0;Te<xe.length;Te++){const Me=xe[Te];uc(Me,Y,X),W.add(Me)}else uc(xe,Y,X),W.add(xe)}),R=y.pop(),W},this.compileAsync=function(x,B,Y=null){const W=this.compile(x,B,Y);return new Promise(X=>{function xe(){if(W.forEach(function(Te){k.get(Te).currentProgram.isReady()&&W.delete(Te)}),W.size===0){X(x);return}setTimeout(xe,10)}H.get("KHR_parallel_shader_compile")!==null?xe():setTimeout(xe,10)})};let Ea=null;function Rh(x){Ea&&Ea(x)}function hc(){Mi.stop()}function fc(){Mi.start()}const Mi=new dh;Mi.setAnimationLoop(Rh),typeof self<"u"&&Mi.setContext(self),this.setAnimationLoop=function(x){Ea=x,ve.setAnimationLoop(x),x===null?Mi.stop():Mi.start()},ve.addEventListener("sessionstart",hc),ve.addEventListener("sessionend",fc),this.render=function(x,B){if(B!==void 0&&B.isCamera!==!0){Oe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;U!==null&&U.renderStart(x,B);const Y=ve.enabled===!0&&ve.isPresenting===!0,W=C!==null&&(K===null||Y)&&C.begin(P,K);if(x.matrixWorldAutoUpdate===!0&&x.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),ve.enabled===!0&&ve.isPresenting===!0&&(C===null||C.isCompositing()===!1)&&(ve.cameraAutoUpdate===!0&&ve.updateCamera(B),B=ve.getCamera()),x.isScene===!0&&x.onBeforeRender(P,x,B,K),R=de.get(x,y.length),R.init(B),R.state.textureUnits=G.getTextureUnits(),y.push(R),yt.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),tt.setFromProjectionMatrix(yt,Cn,B.reversedDepth),Je=this.localClippingEnabled,Qe=Ee.init(this.clippingPlanes,Je),b=ae.get(x,E.length),b.init(),E.push(b),ve.enabled===!0&&ve.isPresenting===!0){const Te=P.xr.getDepthSensingMesh();Te!==null&&wa(Te,B,-1/0,P.sortObjects)}wa(x,B,0,P.sortObjects),b.finish(),P.sortObjects===!0&&b.sort(Ie,Ne,B.reversedDepth),_t=ve.enabled===!1||ve.isPresenting===!1||ve.hasDepthSensing()===!1,_t&&Fe.addToRenderList(b,x),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Qe===!0&&Ee.beginShadows();const X=R.state.shadowsArray;if(Re.render(X,x,B),Qe===!0&&Ee.endShadows(),(W&&C.hasRenderPass())===!1){const Te=b.opaque,Me=b.transmissive;if(R.setupLights(),B.isArrayCamera){const we=B.cameras;if(Me.length>0)for(let Ce=0,He=we.length;Ce<He;Ce++){const $e=we[Ce];mc(Te,Me,x,$e)}_t&&Fe.render(x);for(let Ce=0,He=we.length;Ce<He;Ce++){const $e=we[Ce];pc(b,x,$e,$e.viewport)}}else Me.length>0&&mc(Te,Me,x,B),_t&&Fe.render(x),pc(b,x,B)}K!==null&&z===0&&(G.updateMultisampleRenderTarget(K),G.updateRenderTargetMipmap(K)),W&&C.end(P),x.isScene===!0&&x.onAfterRender(P,x,B),_e.resetDefaultState(),ie=-1,Q=null,y.pop(),y.length>0?(R=y[y.length-1],G.setTextureUnits(R.state.textureUnits),Qe===!0&&Ee.setGlobalState(P.clippingPlanes,R.state.camera)):R=null,E.pop(),E.length>0?b=E[E.length-1]:b=null,U!==null&&U.renderEnd()};function wa(x,B,Y,W){if(x.visible===!1)return;if(x.layers.test(B.layers)){if(x.isGroup)Y=x.renderOrder;else if(x.isLOD)x.autoUpdate===!0&&x.update(B);else if(x.isLightProbeGrid)R.pushLightProbeGrid(x);else if(x.isLight)R.pushLight(x),x.castShadow&&R.pushShadow(x);else if(x.isSprite){if(!x.frustumCulled||tt.intersectsSprite(x)){W&&Mt.setFromMatrixPosition(x.matrixWorld).applyMatrix4(yt);const Te=$.update(x),Me=x.material;Me.visible&&b.push(x,Te,Me,Y,Mt.z,null)}}else if((x.isMesh||x.isLine||x.isPoints)&&(!x.frustumCulled||tt.intersectsObject(x))){const Te=$.update(x),Me=x.material;if(W&&(x.boundingSphere!==void 0?(x.boundingSphere===null&&x.computeBoundingSphere(),Mt.copy(x.boundingSphere.center)):(Te.boundingSphere===null&&Te.computeBoundingSphere(),Mt.copy(Te.boundingSphere.center)),Mt.applyMatrix4(x.matrixWorld).applyMatrix4(yt)),Array.isArray(Me)){const we=Te.groups;for(let Ce=0,He=we.length;Ce<He;Ce++){const $e=we[Ce],Pe=Me[$e.materialIndex];Pe&&Pe.visible&&b.push(x,Te,Pe,Y,Mt.z,$e)}}else Me.visible&&b.push(x,Te,Me,Y,Mt.z,null)}}const xe=x.children;for(let Te=0,Me=xe.length;Te<Me;Te++)wa(xe[Te],B,Y,W)}function pc(x,B,Y,W){const{opaque:X,transmissive:xe,transparent:Te}=x;R.setupLightsView(Y),Qe===!0&&Ee.setGlobalState(P.clippingPlanes,Y),W&&_.viewport(se.copy(W)),X.length>0&&ds(X,B,Y),xe.length>0&&ds(xe,B,Y),Te.length>0&&ds(Te,B,Y),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function mc(x,B,Y,W){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;if(R.state.transmissionRenderTarget[W.id]===void 0){const Pe=H.has("EXT_color_buffer_half_float")||H.has("EXT_color_buffer_float");R.state.transmissionRenderTarget[W.id]=new In(1,1,{generateMipmaps:!0,type:Pe?qn:Qt,minFilter:Gn,samples:Math.max(4,T.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ye.workingColorSpace})}const xe=R.state.transmissionRenderTarget[W.id],Te=W.viewport||se;xe.setSize(Te.z*P.transmissionResolutionScale,Te.w*P.transmissionResolutionScale);const Me=P.getRenderTarget(),we=P.getActiveCubeFace(),Ce=P.getActiveMipmapLevel();P.setRenderTarget(xe),P.getClearColor(We),ze=P.getClearAlpha(),ze<1&&P.setClearColor(16777215,.5),P.clear(),_t&&Fe.render(Y);const He=P.toneMapping;P.toneMapping=mn;const $e=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),R.setupLightsView(W),Qe===!0&&Ee.setGlobalState(P.clippingPlanes,W),ds(x,Y,W),G.updateMultisampleRenderTarget(xe),G.updateRenderTargetMipmap(xe),H.has("WEBGL_multisampled_render_to_texture")===!1){let Pe=!1;for(let st=0,Et=B.length;st<Et;st++){const St=B[st],{object:ct,geometry:Gt,material:Se,group:Yt}=St;if(Se.side===An&&ct.layers.test(W.layers)){const et=Se.side;Se.side=Kt,Se.needsUpdate=!0,gc(ct,Y,W,Gt,Se,Yt),Se.side=et,Se.needsUpdate=!0,Pe=!0}}Pe===!0&&(G.updateMultisampleRenderTarget(xe),G.updateRenderTargetMipmap(xe))}P.setRenderTarget(Me,we,Ce),P.setClearColor(We,ze),$e!==void 0&&(W.viewport=$e),P.toneMapping=He}function ds(x,B,Y){const W=B.isScene===!0?B.overrideMaterial:null;for(let X=0,xe=x.length;X<xe;X++){const Te=x[X],{object:Me,geometry:we,group:Ce}=Te;let He=Te.material;He.allowOverride===!0&&W!==null&&(He=W),Me.layers.test(Y.layers)&&gc(Me,B,Y,we,He,Ce)}}function gc(x,B,Y,W,X,xe){x.onBeforeRender(P,B,Y,W,X,xe),x.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,x.matrixWorld),x.normalMatrix.getNormalMatrix(x.modelViewMatrix),X.onBeforeRender(P,B,Y,W,x,xe),X.transparent===!0&&X.side===An&&X.forceSinglePass===!1?(X.side=Kt,X.needsUpdate=!0,P.renderBufferDirect(Y,B,W,X,x,xe),X.side=Xn,X.needsUpdate=!0,P.renderBufferDirect(Y,B,W,X,x,xe),X.side=An):P.renderBufferDirect(Y,B,W,X,x,xe),x.onAfterRender(P,B,Y,W,X,xe)}function us(x,B,Y){B.isScene!==!0&&(B=It);const W=k.get(x),X=R.state.lights,xe=R.state.shadowsArray,Te=X.state.version,Me=oe.getParameters(x,X.state,xe,B,Y,R.state.lightProbeGridArray),we=oe.getProgramCacheKey(Me);let Ce=W.programs;W.environment=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?B.environment:null,W.fog=B.fog;const He=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap;W.envMap=ne.get(x.envMap||W.environment,He),W.envMapRotation=W.environment!==null&&x.envMap===null?B.environmentRotation:x.envMapRotation,Ce===void 0&&(x.addEventListener("dispose",xn),Ce=new Map,W.programs=Ce);let $e=Ce.get(we);if($e!==void 0){if(W.currentProgram===$e&&W.lightsStateVersion===Te)return vc(x,Me),$e}else Me.uniforms=oe.getUniforms(x),U!==null&&x.isNodeMaterial&&U.build(x,Y,Me),x.onBeforeCompile(Me,P),$e=oe.acquireProgram(Me,we),Ce.set(we,$e),W.uniforms=Me.uniforms;const Pe=W.uniforms;return(!x.isShaderMaterial&&!x.isRawShaderMaterial||x.clipping===!0)&&(Pe.clippingPlanes=Ee.uniform),vc(x,Me),W.needsLights=Lh(x),W.lightsStateVersion=Te,W.needsLights&&(Pe.ambientLightColor.value=X.state.ambient,Pe.lightProbe.value=X.state.probe,Pe.directionalLights.value=X.state.directional,Pe.directionalLightShadows.value=X.state.directionalShadow,Pe.spotLights.value=X.state.spot,Pe.spotLightShadows.value=X.state.spotShadow,Pe.rectAreaLights.value=X.state.rectArea,Pe.ltc_1.value=X.state.rectAreaLTC1,Pe.ltc_2.value=X.state.rectAreaLTC2,Pe.pointLights.value=X.state.point,Pe.pointLightShadows.value=X.state.pointShadow,Pe.hemisphereLights.value=X.state.hemi,Pe.directionalShadowMatrix.value=X.state.directionalShadowMatrix,Pe.spotLightMatrix.value=X.state.spotLightMatrix,Pe.spotLightMap.value=X.state.spotLightMap,Pe.pointShadowMatrix.value=X.state.pointShadowMatrix),W.lightProbeGrid=R.state.lightProbeGridArray.length>0,W.currentProgram=$e,W.uniformsList=null,$e}function _c(x){if(x.uniformsList===null){const B=x.currentProgram.getUniforms();x.uniformsList=ta.seqWithValue(B.seq,x.uniforms)}return x.uniformsList}function vc(x,B){const Y=k.get(x);Y.outputColorSpace=B.outputColorSpace,Y.batching=B.batching,Y.batchingColor=B.batchingColor,Y.instancing=B.instancing,Y.instancingColor=B.instancingColor,Y.instancingMorph=B.instancingMorph,Y.skinning=B.skinning,Y.morphTargets=B.morphTargets,Y.morphNormals=B.morphNormals,Y.morphColors=B.morphColors,Y.morphTargetsCount=B.morphTargetsCount,Y.numClippingPlanes=B.numClippingPlanes,Y.numIntersection=B.numClipIntersection,Y.vertexAlphas=B.vertexAlphas,Y.vertexTangents=B.vertexTangents,Y.toneMapping=B.toneMapping}function Ch(x,B){if(x.length===0)return null;if(x.length===1)return x[0].texture!==null?x[0]:null;M.setFromMatrixPosition(B.matrixWorld);for(let Y=0,W=x.length;Y<W;Y++){const X=x[Y];if(X.texture!==null&&X.boundingBox.containsPoint(M))return X}return null}function Ih(x,B,Y,W,X){B.isScene!==!0&&(B=It),G.resetTextureUnits();const xe=B.fog,Te=W.isMeshStandardMaterial||W.isMeshLambertMaterial||W.isMeshPhongMaterial?B.environment:null,Me=K===null?P.outputColorSpace:K.isXRRenderTarget===!0?K.texture.colorSpace:Ye.workingColorSpace,we=W.isMeshStandardMaterial||W.isMeshLambertMaterial&&!W.envMap||W.isMeshPhongMaterial&&!W.envMap,Ce=ne.get(W.envMap||Te,we),He=W.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,$e=!!Y.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Pe=!!Y.morphAttributes.position,st=!!Y.morphAttributes.normal,Et=!!Y.morphAttributes.color;let St=mn;W.toneMapped&&(K===null||K.isXRRenderTarget===!0)&&(St=P.toneMapping);const ct=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,Gt=ct!==void 0?ct.length:0,Se=k.get(W),Yt=R.state.lights;if(Qe===!0&&(Je===!0||x!==Q)){const pt=x===Q&&W.id===ie;Ee.setState(W,x,pt)}let et=!1;W.version===Se.__version?(Se.needsLights&&Se.lightsStateVersion!==Yt.state.version||Se.outputColorSpace!==Me||X.isBatchedMesh&&Se.batching===!1||!X.isBatchedMesh&&Se.batching===!0||X.isBatchedMesh&&Se.batchingColor===!0&&X.colorTexture===null||X.isBatchedMesh&&Se.batchingColor===!1&&X.colorTexture!==null||X.isInstancedMesh&&Se.instancing===!1||!X.isInstancedMesh&&Se.instancing===!0||X.isSkinnedMesh&&Se.skinning===!1||!X.isSkinnedMesh&&Se.skinning===!0||X.isInstancedMesh&&Se.instancingColor===!0&&X.instanceColor===null||X.isInstancedMesh&&Se.instancingColor===!1&&X.instanceColor!==null||X.isInstancedMesh&&Se.instancingMorph===!0&&X.morphTexture===null||X.isInstancedMesh&&Se.instancingMorph===!1&&X.morphTexture!==null||Se.envMap!==Ce||W.fog===!0&&Se.fog!==xe||Se.numClippingPlanes!==void 0&&(Se.numClippingPlanes!==Ee.numPlanes||Se.numIntersection!==Ee.numIntersection)||Se.vertexAlphas!==He||Se.vertexTangents!==$e||Se.morphTargets!==Pe||Se.morphNormals!==st||Se.morphColors!==Et||Se.toneMapping!==St||Se.morphTargetsCount!==Gt||!!Se.lightProbeGrid!=R.state.lightProbeGridArray.length>0)&&(et=!0):(et=!0,Se.__version=W.version);let tn=Se.currentProgram;et===!0&&(tn=us(W,B,X),U&&W.isNodeMaterial&&U.onUpdateProgram(W,tn,Se));let bn=!1,Jn=!1,Bi=!1;const dt=tn.getUniforms(),wt=Se.uniforms;if(_.useProgram(tn.program)&&(bn=!0,Jn=!0,Bi=!0),W.id!==ie&&(ie=W.id,Jn=!0),Se.needsLights){const pt=Ch(R.state.lightProbeGridArray,X);Se.lightProbeGrid!==pt&&(Se.lightProbeGrid=pt,Jn=!0)}if(bn||Q!==x){_.buffers.depth.getReversed()&&x.reversedDepth!==!0&&(x._reversedDepth=!0,x.updateProjectionMatrix()),dt.setValue(S,"projectionMatrix",x.projectionMatrix),dt.setValue(S,"viewMatrix",x.matrixWorldInverse);const jn=dt.map.cameraPosition;jn!==void 0&&jn.setValue(S,Tt.setFromMatrixPosition(x.matrixWorld)),T.logarithmicDepthBuffer&&dt.setValue(S,"logDepthBufFC",2/(Math.log(x.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&dt.setValue(S,"isOrthographic",x.isOrthographicCamera===!0),Q!==x&&(Q=x,Jn=!0,Bi=!0)}if(Se.needsLights&&(Yt.state.directionalShadowMap.length>0&&dt.setValue(S,"directionalShadowMap",Yt.state.directionalShadowMap,G),Yt.state.spotShadowMap.length>0&&dt.setValue(S,"spotShadowMap",Yt.state.spotShadowMap,G),Yt.state.pointShadowMap.length>0&&dt.setValue(S,"pointShadowMap",Yt.state.pointShadowMap,G)),X.isSkinnedMesh){dt.setOptional(S,X,"bindMatrix"),dt.setOptional(S,X,"bindMatrixInverse");const pt=X.skeleton;pt&&(pt.boneTexture===null&&pt.computeBoneTexture(),dt.setValue(S,"boneTexture",pt.boneTexture,G))}X.isBatchedMesh&&(dt.setOptional(S,X,"batchingTexture"),dt.setValue(S,"batchingTexture",X._matricesTexture,G),dt.setOptional(S,X,"batchingIdTexture"),dt.setValue(S,"batchingIdTexture",X._indirectTexture,G),dt.setOptional(S,X,"batchingColorTexture"),X._colorsTexture!==null&&dt.setValue(S,"batchingColorTexture",X._colorsTexture,G));const Qn=Y.morphAttributes;if((Qn.position!==void 0||Qn.normal!==void 0||Qn.color!==void 0)&&F.update(X,Y,tn),(Jn||Se.receiveShadow!==X.receiveShadow)&&(Se.receiveShadow=X.receiveShadow,dt.setValue(S,"receiveShadow",X.receiveShadow)),(W.isMeshStandardMaterial||W.isMeshLambertMaterial||W.isMeshPhongMaterial)&&W.envMap===null&&B.environment!==null&&(wt.envMapIntensity.value=B.environmentIntensity),wt.dfgLUT!==void 0&&(wt.dfgLUT.value=hx()),Jn){if(dt.setValue(S,"toneMappingExposure",P.toneMappingExposure),Se.needsLights&&Ph(wt,Bi),xe&&W.fog===!0&&ue.refreshFogUniforms(wt,xe),ue.refreshMaterialUniforms(wt,W,le,fe,R.state.transmissionRenderTarget[x.id]),Se.needsLights&&Se.lightProbeGrid){const pt=Se.lightProbeGrid;wt.probesSH.value=pt.texture,wt.probesMin.value.copy(pt.boundingBox.min),wt.probesMax.value.copy(pt.boundingBox.max),wt.probesResolution.value.copy(pt.resolution)}ta.upload(S,_c(Se),wt,G)}if(W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(ta.upload(S,_c(Se),wt,G),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&dt.setValue(S,"center",X.center),dt.setValue(S,"modelViewMatrix",X.modelViewMatrix),dt.setValue(S,"normalMatrix",X.normalMatrix),dt.setValue(S,"modelMatrix",X.matrixWorld),W.uniformsGroups!==void 0){const pt=W.uniformsGroups;for(let jn=0,zi=pt.length;jn<zi;jn++){const yc=pt[jn];j.update(yc,tn),j.bind(yc,tn)}}return tn}function Ph(x,B){x.ambientLightColor.needsUpdate=B,x.lightProbe.needsUpdate=B,x.directionalLights.needsUpdate=B,x.directionalLightShadows.needsUpdate=B,x.pointLights.needsUpdate=B,x.pointLightShadows.needsUpdate=B,x.spotLights.needsUpdate=B,x.spotLightShadows.needsUpdate=B,x.rectAreaLights.needsUpdate=B,x.hemisphereLights.needsUpdate=B}function Lh(x){return x.isMeshLambertMaterial||x.isMeshToonMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isShadowMaterial||x.isShaderMaterial&&x.lights===!0}this.getActiveCubeFace=function(){return L},this.getActiveMipmapLevel=function(){return z},this.getRenderTarget=function(){return K},this.setRenderTargetTextures=function(x,B,Y){const W=k.get(x);W.__autoAllocateDepthBuffer=x.resolveDepthBuffer===!1,W.__autoAllocateDepthBuffer===!1&&(W.__useRenderToTexture=!1),k.get(x.texture).__webglTexture=B,k.get(x.depthTexture).__webglTexture=W.__autoAllocateDepthBuffer?void 0:Y,W.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(x,B){const Y=k.get(x);Y.__webglFramebuffer=B,Y.__useDefaultFramebuffer=B===void 0},this.setRenderTarget=function(x,B=0,Y=0){K=x,L=B,z=Y;let W=null,X=!1,xe=!1;if(x){const Me=k.get(x);if(Me.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(S.FRAMEBUFFER,Me.__webglFramebuffer),se.copy(x.viewport),ce.copy(x.scissor),Be=x.scissorTest,_.viewport(se),_.scissor(ce),_.setScissorTest(Be),ie=-1;return}else if(Me.__webglFramebuffer===void 0)G.setupRenderTarget(x);else if(Me.__hasExternalTextures)G.rebindTextures(x,k.get(x.texture).__webglTexture,k.get(x.depthTexture).__webglTexture);else if(x.depthBuffer){const He=x.depthTexture;if(Me.__boundDepthTexture!==He){if(He!==null&&k.has(He)&&(x.width!==He.image.width||x.height!==He.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");G.setupDepthRenderbuffer(x)}}const we=x.texture;(we.isData3DTexture||we.isDataArrayTexture||we.isCompressedArrayTexture)&&(xe=!0);const Ce=k.get(x).__webglFramebuffer;x.isWebGLCubeRenderTarget?(Array.isArray(Ce[B])?W=Ce[B][Y]:W=Ce[B],X=!0):x.samples>0&&G.useMultisampledRTT(x)===!1?W=k.get(x).__webglMultisampledFramebuffer:Array.isArray(Ce)?W=Ce[Y]:W=Ce,se.copy(x.viewport),ce.copy(x.scissor),Be=x.scissorTest}else se.copy(Le).multiplyScalar(le).floor(),ce.copy(gt).multiplyScalar(le).floor(),Be=Xe;if(Y!==0&&(W=V),_.bindFramebuffer(S.FRAMEBUFFER,W)&&_.drawBuffers(x,W),_.viewport(se),_.scissor(ce),_.setScissorTest(Be),X){const Me=k.get(x.texture);S.framebufferTexture2D(S.FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_CUBE_MAP_POSITIVE_X+B,Me.__webglTexture,Y)}else if(xe){const Me=B;for(let we=0;we<x.textures.length;we++){const Ce=k.get(x.textures[we]);S.framebufferTextureLayer(S.FRAMEBUFFER,S.COLOR_ATTACHMENT0+we,Ce.__webglTexture,Y,Me)}}else if(x!==null&&Y!==0){const Me=k.get(x.texture);S.framebufferTexture2D(S.FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_2D,Me.__webglTexture,Y)}ie=-1},this.readRenderTargetPixels=function(x,B,Y,W,X,xe,Te,Me=0){if(!(x&&x.isWebGLRenderTarget)){Oe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let we=k.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&Te!==void 0&&(we=we[Te]),we){_.bindFramebuffer(S.FRAMEBUFFER,we);try{const Ce=x.textures[Me],He=Ce.format,$e=Ce.type;if(x.textures.length>1&&S.readBuffer(S.COLOR_ATTACHMENT0+Me),!T.textureFormatReadable(He)){Oe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!T.textureTypeReadable($e)){Oe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=x.width-W&&Y>=0&&Y<=x.height-X&&S.readPixels(B,Y,W,X,pe.convert(He),pe.convert($e),xe)}finally{const Ce=K!==null?k.get(K).__webglFramebuffer:null;_.bindFramebuffer(S.FRAMEBUFFER,Ce)}}},this.readRenderTargetPixelsAsync=async function(x,B,Y,W,X,xe,Te,Me=0){if(!(x&&x.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let we=k.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&Te!==void 0&&(we=we[Te]),we)if(B>=0&&B<=x.width-W&&Y>=0&&Y<=x.height-X){_.bindFramebuffer(S.FRAMEBUFFER,we);const Ce=x.textures[Me],He=Ce.format,$e=Ce.type;if(x.textures.length>1&&S.readBuffer(S.COLOR_ATTACHMENT0+Me),!T.textureFormatReadable(He))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!T.textureTypeReadable($e))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Pe=S.createBuffer();S.bindBuffer(S.PIXEL_PACK_BUFFER,Pe),S.bufferData(S.PIXEL_PACK_BUFFER,xe.byteLength,S.STREAM_READ),S.readPixels(B,Y,W,X,pe.convert(He),pe.convert($e),0);const st=K!==null?k.get(K).__webglFramebuffer:null;_.bindFramebuffer(S.FRAMEBUFFER,st);const Et=S.fenceSync(S.SYNC_GPU_COMMANDS_COMPLETE,0);return S.flush(),await Om(S,Et,4),S.bindBuffer(S.PIXEL_PACK_BUFFER,Pe),S.getBufferSubData(S.PIXEL_PACK_BUFFER,0,xe),S.deleteBuffer(Pe),S.deleteSync(Et),xe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(x,B=null,Y=0){const W=Math.pow(2,-Y),X=Math.floor(x.image.width*W),xe=Math.floor(x.image.height*W),Te=B!==null?B.x:0,Me=B!==null?B.y:0;G.setTexture2D(x,0),S.copyTexSubImage2D(S.TEXTURE_2D,Y,0,0,Te,Me,X,xe),_.unbindTexture()},this.copyTextureToTexture=function(x,B,Y=null,W=null,X=0,xe=0){let Te,Me,we,Ce,He,$e,Pe,st,Et;const St=x.isCompressedTexture?x.mipmaps[xe]:x.image;if(Y!==null)Te=Y.max.x-Y.min.x,Me=Y.max.y-Y.min.y,we=Y.isBox3?Y.max.z-Y.min.z:1,Ce=Y.min.x,He=Y.min.y,$e=Y.isBox3?Y.min.z:0;else{const wt=Math.pow(2,-X);Te=Math.floor(St.width*wt),Me=Math.floor(St.height*wt),x.isDataArrayTexture?we=St.depth:x.isData3DTexture?we=Math.floor(St.depth*wt):we=1,Ce=0,He=0,$e=0}W!==null?(Pe=W.x,st=W.y,Et=W.z):(Pe=0,st=0,Et=0);const ct=pe.convert(B.format),Gt=pe.convert(B.type);let Se;B.isData3DTexture?(G.setTexture3D(B,0),Se=S.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?(G.setTexture2DArray(B,0),Se=S.TEXTURE_2D_ARRAY):(G.setTexture2D(B,0),Se=S.TEXTURE_2D),_.activeTexture(S.TEXTURE0),_.pixelStorei(S.UNPACK_FLIP_Y_WEBGL,B.flipY),_.pixelStorei(S.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),_.pixelStorei(S.UNPACK_ALIGNMENT,B.unpackAlignment);const Yt=_.getParameter(S.UNPACK_ROW_LENGTH),et=_.getParameter(S.UNPACK_IMAGE_HEIGHT),tn=_.getParameter(S.UNPACK_SKIP_PIXELS),bn=_.getParameter(S.UNPACK_SKIP_ROWS),Jn=_.getParameter(S.UNPACK_SKIP_IMAGES);_.pixelStorei(S.UNPACK_ROW_LENGTH,St.width),_.pixelStorei(S.UNPACK_IMAGE_HEIGHT,St.height),_.pixelStorei(S.UNPACK_SKIP_PIXELS,Ce),_.pixelStorei(S.UNPACK_SKIP_ROWS,He),_.pixelStorei(S.UNPACK_SKIP_IMAGES,$e);const Bi=x.isDataArrayTexture||x.isData3DTexture,dt=B.isDataArrayTexture||B.isData3DTexture;if(x.isDepthTexture){const wt=k.get(x),Qn=k.get(B),pt=k.get(wt.__renderTarget),jn=k.get(Qn.__renderTarget);_.bindFramebuffer(S.READ_FRAMEBUFFER,pt.__webglFramebuffer),_.bindFramebuffer(S.DRAW_FRAMEBUFFER,jn.__webglFramebuffer);for(let zi=0;zi<we;zi++)Bi&&(S.framebufferTextureLayer(S.READ_FRAMEBUFFER,S.COLOR_ATTACHMENT0,k.get(x).__webglTexture,X,$e+zi),S.framebufferTextureLayer(S.DRAW_FRAMEBUFFER,S.COLOR_ATTACHMENT0,k.get(B).__webglTexture,xe,Et+zi)),S.blitFramebuffer(Ce,He,Te,Me,Pe,st,Te,Me,S.DEPTH_BUFFER_BIT,S.NEAREST);_.bindFramebuffer(S.READ_FRAMEBUFFER,null),_.bindFramebuffer(S.DRAW_FRAMEBUFFER,null)}else if(X!==0||x.isRenderTargetTexture||k.has(x)){const wt=k.get(x),Qn=k.get(B);_.bindFramebuffer(S.READ_FRAMEBUFFER,J),_.bindFramebuffer(S.DRAW_FRAMEBUFFER,I);for(let pt=0;pt<we;pt++)Bi?S.framebufferTextureLayer(S.READ_FRAMEBUFFER,S.COLOR_ATTACHMENT0,wt.__webglTexture,X,$e+pt):S.framebufferTexture2D(S.READ_FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_2D,wt.__webglTexture,X),dt?S.framebufferTextureLayer(S.DRAW_FRAMEBUFFER,S.COLOR_ATTACHMENT0,Qn.__webglTexture,xe,Et+pt):S.framebufferTexture2D(S.DRAW_FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_2D,Qn.__webglTexture,xe),X!==0?S.blitFramebuffer(Ce,He,Te,Me,Pe,st,Te,Me,S.COLOR_BUFFER_BIT,S.NEAREST):dt?S.copyTexSubImage3D(Se,xe,Pe,st,Et+pt,Ce,He,Te,Me):S.copyTexSubImage2D(Se,xe,Pe,st,Ce,He,Te,Me);_.bindFramebuffer(S.READ_FRAMEBUFFER,null),_.bindFramebuffer(S.DRAW_FRAMEBUFFER,null)}else dt?x.isDataTexture||x.isData3DTexture?S.texSubImage3D(Se,xe,Pe,st,Et,Te,Me,we,ct,Gt,St.data):B.isCompressedArrayTexture?S.compressedTexSubImage3D(Se,xe,Pe,st,Et,Te,Me,we,ct,St.data):S.texSubImage3D(Se,xe,Pe,st,Et,Te,Me,we,ct,Gt,St):x.isDataTexture?S.texSubImage2D(S.TEXTURE_2D,xe,Pe,st,Te,Me,ct,Gt,St.data):x.isCompressedTexture?S.compressedTexSubImage2D(S.TEXTURE_2D,xe,Pe,st,St.width,St.height,ct,St.data):S.texSubImage2D(S.TEXTURE_2D,xe,Pe,st,Te,Me,ct,Gt,St);_.pixelStorei(S.UNPACK_ROW_LENGTH,Yt),_.pixelStorei(S.UNPACK_IMAGE_HEIGHT,et),_.pixelStorei(S.UNPACK_SKIP_PIXELS,tn),_.pixelStorei(S.UNPACK_SKIP_ROWS,bn),_.pixelStorei(S.UNPACK_SKIP_IMAGES,Jn),xe===0&&B.generateMipmaps&&S.generateMipmap(Se),_.unbindTexture()},this.initRenderTarget=function(x){k.get(x).__webglFramebuffer===void 0&&G.setupRenderTarget(x)},this.initTexture=function(x){x.isCubeTexture?G.setTextureCube(x,0):x.isData3DTexture?G.setTexture3D(x,0):x.isDataArrayTexture||x.isCompressedArrayTexture?G.setTexture2DArray(x,0):G.setTexture2D(x,0),_.unbindTexture()},this.resetState=function(){L=0,z=0,K=null,_.reset(),_e.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Cn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Ye._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ye._getUnpackColorSpace()}}function Jd(n,e){if(e===Em)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),n;if(e===ml||e===Wu){let t=n.getIndex();if(t===null){const a=[],o=n.getAttribute("position");if(o!==void 0){for(let l=0;l<o.count;l++)a.push(l);n.setIndex(a),t=n.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),n}const i=t.count-2,r=[];if(e===ml)for(let a=1;a<=i;a++)r.push(t.getX(0)),r.push(t.getX(a)),r.push(t.getX(a+1));else for(let a=0;a<i;a++)a%2===0?(r.push(t.getX(a)),r.push(t.getX(a+1)),r.push(t.getX(a+2))):(r.push(t.getX(a+2)),r.push(t.getX(a+1)),r.push(t.getX(a)));r.length/3!==i&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const s=n.clone();return s.setIndex(r),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),n}function px(n){const e=new Map,t=new Map,i=n.clone();return vh(n,i,function(r,s){e.set(s,r),t.set(r,s)}),i.traverse(function(r){if(!r.isSkinnedMesh)return;const s=r,a=e.get(r),o=a.skeleton.bones;s.skeleton=a.skeleton.clone(),s.bindMatrix.copy(a.bindMatrix),s.skeleton.bones=o.map(function(l){return t.get(l)}),s.bind(s.skeleton,s.bindMatrix)}),i}function vh(n,e,t){t(n,e);for(let i=0;i<n.children.length;i++)vh(n.children[i],e.children[i],t)}class mx extends Ar{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Mx(t)}),this.register(function(t){return new xx(t)}),this.register(function(t){return new Ix(t)}),this.register(function(t){return new Px(t)}),this.register(function(t){return new Lx(t)}),this.register(function(t){return new Sx(t)}),this.register(function(t){return new Tx(t)}),this.register(function(t){return new Ex(t)}),this.register(function(t){return new wx(t)}),this.register(function(t){return new yx(t)}),this.register(function(t){return new Ax(t)}),this.register(function(t){return new bx(t)}),this.register(function(t){return new Cx(t)}),this.register(function(t){return new Rx(t)}),this.register(function(t){return new _x(t)}),this.register(function(t){return new Qd(t,Ke.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new Qd(t,Ke.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new Dx(t)})}load(e,t,i,r){const s=this;let a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){const c=Yr.extractUrlBase(e);a=Yr.resolveURL(c,this.path)}else a=Yr.extractUrlBase(e);this.manager.itemStart(e);const o=function(c){r?r(c):console.error(c),s.manager.itemError(e),s.manager.itemEnd(e)},l=new oh(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{s.parse(c,a,function(d){t(d),s.manager.itemEnd(e)},o)}catch(d){o(d)}},i,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,i,r){let s;const a={},o={},l=new TextDecoder;if(typeof e=="string")s=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===yh){try{a[Ke.KHR_BINARY_GLTF]=new Nx(e)}catch(u){r&&r(u);return}s=JSON.parse(a[Ke.KHR_BINARY_GLTF].content)}else s=JSON.parse(l.decode(e));else s=e;if(s.asset===void 0||s.asset.version[0]<2){r&&r(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const c=new $x(s,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let d=0;d<this.pluginCallbacks.length;d++){const u=this.pluginCallbacks[d](c);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[u.name]=u,a[u.name]=!0}if(s.extensionsUsed)for(let d=0;d<s.extensionsUsed.length;++d){const u=s.extensionsUsed[d],h=s.extensionsRequired||[];switch(u){case Ke.KHR_MATERIALS_UNLIT:a[u]=new vx;break;case Ke.KHR_DRACO_MESH_COMPRESSION:a[u]=new Ux(s,this.dracoLoader);break;case Ke.KHR_TEXTURE_TRANSFORM:a[u]=new Fx;break;case Ke.KHR_MESH_QUANTIZATION:a[u]=new Ox;break;default:h.indexOf(u)>=0&&o[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(a),c.setPlugins(o),c.parse(i,r)}parseAsync(e,t){const i=this;return new Promise(function(r,s){i.parse(e,t,r,s)})}}function gx(){let n={};return{get:function(e){return n[e]},add:function(e,t){n[e]=t},remove:function(e){delete n[e]},removeAll:function(){n={}}}}function Rt(n,e,t){const i=n.json.materials[e];return i.extensions&&i.extensions[t]?i.extensions[t]:null}const Ke={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class _x{constructor(e){this.parser=e,this.name=Ke.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let i=0,r=t.length;i<r;i++){const s=t[i];s.extensions&&s.extensions[this.name]&&s.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,s.extensions[this.name].light)}}_loadLight(e){const t=this.parser,i="light:"+e;let r=t.cache.get(i);if(r)return r;const s=t.json,l=((s.extensions&&s.extensions[this.name]||{}).lights||[])[e];let c;const d=new De(16777215);l.color!==void 0&&d.setRGB(l.color[0],l.color[1],l.color[2],en);const u=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new ch(d),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new fi(d),c.distance=u;break;case"spot":c=new i0(d),c.distance=u,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),En(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=t.createUniqueName(l.name||"light_"+e),r=Promise.resolve(c),t.cache.add(i,r),r}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,i=this.parser,s=i.json.nodes[e],o=(s.extensions&&s.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(l){return i._getNodeRef(t.cache,o,l)})}}class vx{constructor(){this.name=Ke.KHR_MATERIALS_UNLIT}getMaterialType(){return Di}extendParams(e,t,i){const r=[];e.color=new De(1,1,1),e.opacity=1;const s=t.pbrMetallicRoughness;if(s){if(Array.isArray(s.baseColorFactor)){const a=s.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],en),e.opacity=a[3]}s.baseColorTexture!==void 0&&r.push(i.assignTexture(e,"map",s.baseColorTexture,Pt))}return Promise.all(r)}}class yx{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);return i===null||i.emissiveStrength!==void 0&&(t.emissiveIntensity=i.emissiveStrength),Promise.resolve()}}class Mx{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?Nn:null}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];if(i.clearcoatFactor!==void 0&&(t.clearcoat=i.clearcoatFactor),i.clearcoatTexture!==void 0&&r.push(this.parser.assignTexture(t,"clearcoatMap",i.clearcoatTexture)),i.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=i.clearcoatRoughnessFactor),i.clearcoatRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",i.clearcoatRoughnessTexture)),i.clearcoatNormalTexture!==void 0&&(r.push(this.parser.assignTexture(t,"clearcoatNormalMap",i.clearcoatNormalTexture)),i.clearcoatNormalTexture.scale!==void 0)){const s=i.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new ke(s,s)}return Promise.all(r)}}class xx{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_DISPERSION}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?Nn:null}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);return i===null||(t.dispersion=i.dispersion!==void 0?i.dispersion:0),Promise.resolve()}}class bx{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?Nn:null}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];return i.iridescenceFactor!==void 0&&(t.iridescence=i.iridescenceFactor),i.iridescenceTexture!==void 0&&r.push(this.parser.assignTexture(t,"iridescenceMap",i.iridescenceTexture)),i.iridescenceIor!==void 0&&(t.iridescenceIOR=i.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),i.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=i.iridescenceThicknessMinimum),i.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=i.iridescenceThicknessMaximum),i.iridescenceThicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,"iridescenceThicknessMap",i.iridescenceThicknessTexture)),Promise.all(r)}}class Sx{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_SHEEN}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?Nn:null}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];if(t.sheenColor=new De(0,0,0),t.sheenRoughness=0,t.sheen=1,i.sheenColorFactor!==void 0){const s=i.sheenColorFactor;t.sheenColor.setRGB(s[0],s[1],s[2],en)}return i.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=i.sheenRoughnessFactor),i.sheenColorTexture!==void 0&&r.push(this.parser.assignTexture(t,"sheenColorMap",i.sheenColorTexture,Pt)),i.sheenRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,"sheenRoughnessMap",i.sheenRoughnessTexture)),Promise.all(r)}}class Tx{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?Nn:null}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];return i.transmissionFactor!==void 0&&(t.transmission=i.transmissionFactor),i.transmissionTexture!==void 0&&r.push(this.parser.assignTexture(t,"transmissionMap",i.transmissionTexture)),Promise.all(r)}}class Ex{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_VOLUME}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?Nn:null}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];t.thickness=i.thicknessFactor!==void 0?i.thicknessFactor:0,i.thicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,"thicknessMap",i.thicknessTexture)),t.attenuationDistance=i.attenuationDistance||1/0;const s=i.attenuationColor||[1,1,1];return t.attenuationColor=new De().setRGB(s[0],s[1],s[2],en),Promise.all(r)}}class wx{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_IOR}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?Nn:null}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);return i===null||(t.ior=i.ior!==void 0?i.ior:1.5,t.ior===0&&(t.ior=1e3)),Promise.resolve()}}class Ax{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_SPECULAR}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?Nn:null}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];t.specularIntensity=i.specularFactor!==void 0?i.specularFactor:1,i.specularTexture!==void 0&&r.push(this.parser.assignTexture(t,"specularIntensityMap",i.specularTexture));const s=i.specularColorFactor||[1,1,1];return t.specularColor=new De().setRGB(s[0],s[1],s[2],en),i.specularColorTexture!==void 0&&r.push(this.parser.assignTexture(t,"specularColorMap",i.specularColorTexture,Pt)),Promise.all(r)}}class Rx{constructor(e){this.parser=e,this.name=Ke.EXT_MATERIALS_BUMP}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?Nn:null}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];return t.bumpScale=i.bumpFactor!==void 0?i.bumpFactor:1,i.bumpTexture!==void 0&&r.push(this.parser.assignTexture(t,"bumpMap",i.bumpTexture)),Promise.all(r)}}class Cx{constructor(e){this.parser=e,this.name=Ke.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return Rt(this.parser,e,this.name)!==null?Nn:null}extendMaterialParams(e,t){const i=Rt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];return i.anisotropyStrength!==void 0&&(t.anisotropy=i.anisotropyStrength),i.anisotropyRotation!==void 0&&(t.anisotropyRotation=i.anisotropyRotation),i.anisotropyTexture!==void 0&&r.push(this.parser.assignTexture(t,"anisotropyMap",i.anisotropyTexture)),Promise.all(r)}}class Ix{constructor(e){this.parser=e,this.name=Ke.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,i=t.json,r=i.textures[e];if(!r.extensions||!r.extensions[this.name])return null;const s=r.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,s.source,a)}}class Px{constructor(e){this.parser=e,this.name=Ke.EXT_TEXTURE_WEBP}loadTexture(e){const t=this.name,i=this.parser,r=i.json,s=r.textures[e];if(!s.extensions||!s.extensions[t])return null;const a=s.extensions[t],o=r.images[a.source];let l=i.textureLoader;if(o.uri){const c=i.options.manager.getHandler(o.uri);c!==null&&(l=c)}return i.loadTextureImage(e,a.source,l)}}class Lx{constructor(e){this.parser=e,this.name=Ke.EXT_TEXTURE_AVIF}loadTexture(e){const t=this.name,i=this.parser,r=i.json,s=r.textures[e];if(!s.extensions||!s.extensions[t])return null;const a=s.extensions[t],o=r.images[a.source];let l=i.textureLoader;if(o.uri){const c=i.options.manager.getHandler(o.uri);c!==null&&(l=c)}return i.loadTextureImage(e,a.source,l)}}class Qd{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){const t=this.parser.json,i=t.bufferViews[e];if(i.extensions&&i.extensions[this.name]){const r=i.extensions[this.name],s=this.parser.getDependency("buffer",r.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return s.then(function(o){const l=r.byteOffset||0,c=r.byteLength||0,d=r.count,u=r.byteStride,h=new Uint8Array(o,l,c);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(d,u,h,r.mode,r.filter).then(function(f){return f.buffer}):a.ready.then(function(){const f=new ArrayBuffer(d*u);return a.decodeGltfBuffer(new Uint8Array(f),d,u,h,r.mode,r.filter),f})})}else return null}}class Dx{constructor(e){this.name=Ke.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,i=t.nodes[e];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;const r=t.meshes[i.mesh];for(const c of r.primitives)if(c.mode!==rn.TRIANGLES&&c.mode!==rn.TRIANGLE_STRIP&&c.mode!==rn.TRIANGLE_FAN&&c.mode!==void 0)return null;const a=i.extensions[this.name].attributes,o=[],l={};for(const c in a)o.push(this.parser.getDependency("accessor",a[c]).then(d=>(l[c]=d,l[c])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(c=>{const d=c.pop(),u=d.isGroup?d.children:[d],h=c[0].count,f=[];for(const g of u){const v=new Ve,m=new O,p=new Yn,w=new O(1,1,1),A=new _l(g.geometry,g.material,h);for(let M=0;M<h;M++)l.TRANSLATION&&m.fromBufferAttribute(l.TRANSLATION,M),l.ROTATION&&p.fromBufferAttribute(l.ROTATION,M),l.SCALE&&w.fromBufferAttribute(l.SCALE,M),A.setMatrixAt(M,v.compose(m,p,w));for(const M in l)if(M==="_COLOR_0"){const b=l[M];A.instanceColor=new is(b.array,b.itemSize,b.normalized)}else M!=="TRANSLATION"&&M!=="ROTATION"&&M!=="SCALE"&&g.geometry.setAttribute(M,l[M]);ht.prototype.copy.call(A,g),this.parser.assignFinalMaterial(A),f.push(A)}return d.isGroup?(d.clear(),d.add(...f),d):f[0]}))}}const yh="glTF",Hr=12,jd={JSON:1313821514,BIN:5130562};class Nx{constructor(e){this.name=Ke.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,Hr),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==yh)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const r=this.header.length-Hr,s=new DataView(e,Hr);let a=0;for(;a<r;){const o=s.getUint32(a,!0);a+=4;const l=s.getUint32(a,!0);if(a+=4,l===jd.JSON){const c=new Uint8Array(e,Hr+a,o);this.content=i.decode(c)}else if(l===jd.BIN){const c=Hr+a;this.body=e.slice(c,c+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class Ux{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Ke.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const i=this.json,r=this.dracoLoader,s=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},l={},c={};for(const d in a){const u=xl[d]||d.toLowerCase();o[u]=a[d]}for(const d in e.attributes){const u=xl[d]||d.toLowerCase();if(a[d]!==void 0){const h=i.accessors[e.attributes[d]],f=pr[h.componentType];c[u]=f.name,l[u]=h.normalized===!0}}return t.getDependency("bufferView",s).then(function(d){return new Promise(function(u,h){r.decodeDracoFile(d,function(f){for(const g in f.attributes){const v=f.attributes[g],m=l[g];m!==void 0&&(v.normalized=m)}u(f)},o,c,en,h)})})}}class Fx{constructor(){this.name=Ke.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class Ox{constructor(){this.name=Ke.KHR_MESH_QUANTIZATION}}class Mh extends Tr{constructor(e,t,i,r){super(e,t,i,r)}copySampleValue_(e){const t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r*3+r;for(let a=0;a!==r;a++)t[a]=i[s+a];return t}interpolate_(e,t,i,r){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=o*2,c=o*3,d=r-t,u=(i-t)/d,h=u*u,f=h*u,g=e*c,v=g-c,m=-2*f+3*h,p=f-h,w=1-m,A=p-h+u;for(let M=0;M!==o;M++){const b=a[v+M+o],R=a[v+M+l]*d,E=a[g+M+o],y=a[g+M]*d;s[M]=w*b+A*R+m*E+p*y}return s}}const kx=new Yn;class Bx extends Mh{interpolate_(e,t,i,r){const s=super.interpolate_(e,t,i,r);return kx.fromArray(s).normalize().toArray(s),s}}const rn={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},pr={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},eu={9728:Dt,9729:At,9984:Ou,9985:Zs,9986:Wr,9987:Gn},tu={33071:Rn,33648:sa,10497:Mr},xo={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},xl={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},li={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},zx={CUBICSPLINE:void 0,LINEAR:jr,STEP:Qr},bo={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Gx(n){return n.DefaultMaterial===void 0&&(n.DefaultMaterial=new tc({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Xn})),n.DefaultMaterial}function Ei(n,e,t){for(const i in t.extensions)n[i]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[i]=t.extensions[i])}function En(n,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(n.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Hx(n,e,t){let i=!1,r=!1,s=!1;for(let c=0,d=e.length;c<d;c++){const u=e[c];if(u.POSITION!==void 0&&(i=!0),u.NORMAL!==void 0&&(r=!0),u.COLOR_0!==void 0&&(s=!0),i&&r&&s)break}if(!i&&!r&&!s)return Promise.resolve(n);const a=[],o=[],l=[];for(let c=0,d=e.length;c<d;c++){const u=e[c];if(i){const h=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):n.attributes.position;a.push(h)}if(r){const h=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):n.attributes.normal;o.push(h)}if(s){const h=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):n.attributes.color;l.push(h)}}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l)]).then(function(c){const d=c[0],u=c[1],h=c[2];return i&&(n.morphAttributes.position=d),r&&(n.morphAttributes.normal=u),s&&(n.morphAttributes.color=h),n.morphTargetsRelative=!0,n})}function Vx(n,e){if(n.updateMorphTargets(),e.weights!==void 0)for(let t=0,i=e.weights.length;t<i;t++)n.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(n.morphTargetInfluences.length===t.length){n.morphTargetDictionary={};for(let i=0,r=t.length;i<r;i++)n.morphTargetDictionary[t[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Wx(n){let e;const t=n.extensions&&n.extensions[Ke.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+So(t.attributes):e=n.indices+":"+So(n.attributes)+":"+n.mode,n.targets!==void 0)for(let i=0,r=n.targets.length;i<r;i++)e+=":"+So(n.targets[i]);return e}function So(n){let e="";const t=Object.keys(n).sort();for(let i=0,r=t.length;i<r;i++)e+=t[i]+":"+n[t[i]]+";";return e}function bl(n){switch(n){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Xx(n){return n.search(/\.jpe?g($|\?)/i)>0||n.search(/^data\:image\/jpeg/)===0?"image/jpeg":n.search(/\.webp($|\?)/i)>0||n.search(/^data\:image\/webp/)===0?"image/webp":n.search(/\.ktx2($|\?)/i)>0||n.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const qx=new Ve;class $x{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new gx,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,r=-1,s=!1,a=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){const o=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(o)===!0;const l=o.match(/Version\/(\d+)/);r=i&&l?parseInt(l[1],10):-1,s=o.indexOf("Firefox")>-1,a=s?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&r<17||s&&a<98?this.textureLoader=new e0(this.options.manager):this.textureLoader=new a0(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new oh(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const i=this,r=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(a){const o={scene:a[0][r.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:r.asset,parser:i,userData:{}};return Ei(s,o,r),En(o,r),Promise.all(i._invokeAll(function(l){return l.afterRoot&&l.afterRoot(o)})).then(function(){for(const l of o.scenes)l.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],i=this.json.meshes||[];for(let r=0,s=t.length;r<s;r++){const a=t[r].joints;for(let o=0,l=a.length;o<l;o++)e[a[o]].isBone=!0}for(let r=0,s=e.length;r<s;r++){const a=e[r];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(i[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,i){if(e.refs[t]<=1)return i;const r=i.clone(),s=(a,o)=>{const l=this.associations.get(a);l!=null&&this.associations.set(o,l);for(const[c,d]of a.children.entries())s(d,o.children[c])};return s(i,r),r.name+="_instance_"+e.uses[t]++,r}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let i=0;i<t.length;i++){const r=e(t[i]);if(r)return r}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const i=[];for(let r=0;r<t.length;r++){const s=e(t[r]);s&&i.push(s)}return i}getDependency(e,t){const i=e+":"+t;let r=this.cache.get(i);if(!r){switch(e){case"scene":r=this.loadScene(t);break;case"node":r=this._invokeOne(function(s){return s.loadNode&&s.loadNode(t)});break;case"mesh":r=this._invokeOne(function(s){return s.loadMesh&&s.loadMesh(t)});break;case"accessor":r=this.loadAccessor(t);break;case"bufferView":r=this._invokeOne(function(s){return s.loadBufferView&&s.loadBufferView(t)});break;case"buffer":r=this.loadBuffer(t);break;case"material":r=this._invokeOne(function(s){return s.loadMaterial&&s.loadMaterial(t)});break;case"texture":r=this._invokeOne(function(s){return s.loadTexture&&s.loadTexture(t)});break;case"skin":r=this.loadSkin(t);break;case"animation":r=this._invokeOne(function(s){return s.loadAnimation&&s.loadAnimation(t)});break;case"camera":r=this.loadCamera(t);break;default:if(r=this._invokeOne(function(s){return s!=this&&s.getDependency&&s.getDependency(e,t)}),!r)throw new Error("Unknown type: "+e);break}this.cache.add(i,r)}return r}getDependencies(e){let t=this.cache.get(e);if(!t){const i=this,r=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(r.map(function(s,a){return i.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],i=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Ke.KHR_BINARY_GLTF].body);const r=this.options;return new Promise(function(s,a){i.load(Yr.resolveURL(t.uri,r.path),s,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(i){const r=t.byteLength||0,s=t.byteOffset||0;return i.slice(s,s+r)})}loadAccessor(e){const t=this,i=this.json,r=this.json.accessors[e];if(r.bufferView===void 0&&r.sparse===void 0){const a=xo[r.type],o=pr[r.componentType],l=r.normalized===!0,c=new o(r.count*a);return Promise.resolve(new zt(c,a,l))}const s=[];return r.bufferView!==void 0?s.push(this.getDependency("bufferView",r.bufferView)):s.push(null),r.sparse!==void 0&&(s.push(this.getDependency("bufferView",r.sparse.indices.bufferView)),s.push(this.getDependency("bufferView",r.sparse.values.bufferView))),Promise.all(s).then(function(a){const o=a[0],l=xo[r.type],c=pr[r.componentType],d=c.BYTES_PER_ELEMENT,u=d*l,h=r.byteOffset||0,f=r.bufferView!==void 0?i.bufferViews[r.bufferView].byteStride:void 0,g=r.normalized===!0;let v,m;if(f&&f!==u){const p=Math.floor(h/f),w="InterleavedBuffer:"+r.bufferView+":"+r.componentType+":"+p+":"+r.count;let A=t.cache.get(w);A||(v=new c(o,p*f,r.count*f/d),A=new Ju(v,f/d),t.cache.add(w,A)),m=new ns(A,l,h%f/d,g)}else o===null?v=new c(r.count*l):v=new c(o,h,r.count*l),m=new zt(v,l,g);if(r.sparse!==void 0){const p=xo.SCALAR,w=pr[r.sparse.indices.componentType],A=r.sparse.indices.byteOffset||0,M=r.sparse.values.byteOffset||0,b=new w(a[1],A,r.sparse.count*p),R=new c(a[2],M,r.sparse.count*l);o!==null&&(m=new zt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let E=0,y=b.length;E<y;E++){const C=b[E];if(m.setX(C,R[E*l]),l>=2&&m.setY(C,R[E*l+1]),l>=3&&m.setZ(C,R[E*l+2]),l>=4&&m.setW(C,R[E*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=g}return m})}loadTexture(e){const t=this.json,i=this.options,s=t.textures[e].source,a=t.images[s];let o=this.textureLoader;if(a.uri){const l=i.manager.getHandler(a.uri);l!==null&&(o=l)}return this.loadTextureImage(e,s,o)}loadTextureImage(e,t,i){const r=this,s=this.json,a=s.textures[e],o=s.images[t],l=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[l])return this.textureCache[l];const c=this.loadImageSource(t,i).then(function(d){d.flipY=!1,d.name=a.name||o.name||"",d.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(d.name=o.uri);const h=(s.samplers||{})[a.sampler]||{};return d.magFilter=eu[h.magFilter]||At,d.minFilter=eu[h.minFilter]||Gn,d.wrapS=tu[h.wrapS]||Mr,d.wrapT=tu[h.wrapT]||Mr,d.generateMipmaps=!d.isCompressedTexture&&d.minFilter!==Dt&&d.minFilter!==At,r.associations.set(d,{textures:e}),d}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){const i=this,r=this.json,s=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());const a=r.images[e],o=self.URL||self.webkitURL;let l=a.uri||"",c=!1;if(a.bufferView!==void 0)l=i.getDependency("bufferView",a.bufferView).then(function(u){c=!0;const h=new Blob([u],{type:a.mimeType});return l=o.createObjectURL(h),l});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const d=Promise.resolve(l).then(function(u){return new Promise(function(h,f){let g=h;t.isImageBitmapLoader===!0&&(g=function(v){const m=new Nt(v);m.needsUpdate=!0,h(m)}),t.load(Yr.resolveURL(u,s.path),g,void 0,f)})}).then(function(u){return c===!0&&o.revokeObjectURL(l),En(u,a),u.userData.mimeType=a.mimeType||Xx(a.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),u});return this.sourceCache[e]=d,d}assignTexture(e,t,i,r){const s=this;return this.getDependency("texture",i.index).then(function(a){if(!a)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(a=a.clone(),a.channel=i.texCoord),s.extensions[Ke.KHR_TEXTURE_TRANSFORM]){const o=i.extensions!==void 0?i.extensions[Ke.KHR_TEXTURE_TRANSFORM]:void 0;if(o){const l=s.associations.get(a);a=s.extensions[Ke.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),s.associations.set(a,l)}}return r!==void 0&&(a.colorSpace=r),e[t]=a,a})}assignFinalMaterial(e){const t=e.geometry;let i=e.material;const r=t.attributes.tangent===void 0,s=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){const o="PointsMaterial:"+i.uuid;let l=this.cache.get(o);l||(l=new ec,ln.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,l.sizeAttenuation=!1,this.cache.add(o,l)),i=l}else if(e.isLine){const o="LineBasicMaterial:"+i.uuid;let l=this.cache.get(o);l||(l=new th,ln.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,this.cache.add(o,l)),i=l}if(r||s||a){let o="ClonedMaterial:"+i.uuid+":";r&&(o+="derivative-tangents:"),s&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let l=this.cache.get(o);l||(l=i.clone(),s&&(l.vertexColors=!0),a&&(l.flatShading=!0),r&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(o,l),this.associations.set(l,this.associations.get(i))),i=l}e.material=i}getMaterialType(){return tc}loadMaterial(e){const t=this,i=this.json,r=this.extensions,s=i.materials[e];let a;const o={},l=s.extensions||{},c=[];if(l[Ke.KHR_MATERIALS_UNLIT]){const u=r[Ke.KHR_MATERIALS_UNLIT];a=u.getMaterialType(),c.push(u.extendParams(o,s,t))}else{const u=s.pbrMetallicRoughness||{};if(o.color=new De(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){const h=u.baseColorFactor;o.color.setRGB(h[0],h[1],h[2],en),o.opacity=h[3]}u.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",u.baseColorTexture,Pt)),o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture))),a=this._invokeOne(function(h){return h.getMaterialType&&h.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(h){return h.extendMaterialParams&&h.extendMaterialParams(e,o)})))}s.doubleSided===!0&&(o.side=An);const d=s.alphaMode||bo.OPAQUE;if(d===bo.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,d===bo.MASK&&(o.alphaTest=s.alphaCutoff!==void 0?s.alphaCutoff:.5)),s.normalTexture!==void 0&&a!==Di&&(c.push(t.assignTexture(o,"normalMap",s.normalTexture)),o.normalScale=new ke(1,1),s.normalTexture.scale!==void 0)){const u=s.normalTexture.scale;o.normalScale.set(u,u)}if(s.occlusionTexture!==void 0&&a!==Di&&(c.push(t.assignTexture(o,"aoMap",s.occlusionTexture)),s.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=s.occlusionTexture.strength)),s.emissiveFactor!==void 0&&a!==Di){const u=s.emissiveFactor;o.emissive=new De().setRGB(u[0],u[1],u[2],en)}return s.emissiveTexture!==void 0&&a!==Di&&c.push(t.assignTexture(o,"emissiveMap",s.emissiveTexture,Pt)),Promise.all(c).then(function(){const u=new a(o);return s.name&&(u.name=s.name),En(u,s),t.associations.set(u,{materials:e}),s.extensions&&Ei(r,u,s),u})}createUniqueName(e){const t=rt.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,i=this.extensions,r=this.primitiveCache;function s(o){return i[Ke.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(l){return nu(l,o,t)})}const a=[];for(let o=0,l=e.length;o<l;o++){const c=e[o],d=Wx(c),u=r[d];if(u)a.push(u.promise);else{let h;c.extensions&&c.extensions[Ke.KHR_DRACO_MESH_COMPRESSION]?h=s(c):h=nu(new Ot,c,t),r[d]={primitive:c,promise:h},a.push(h)}}return Promise.all(a)}loadMesh(e){const t=this,i=this.json,r=this.extensions,s=i.meshes[e],a=s.primitives,o=[];for(let l=0,c=a.length;l<c;l++){const d=a[l].material===void 0?Gx(this.cache):this.getDependency("material",a[l].material);o.push(d)}return o.push(t.loadGeometries(a)),Promise.all(o).then(function(l){const c=l.slice(0,l.length-1),d=l[l.length-1],u=[];for(let f=0,g=d.length;f<g;f++){const v=d[f],m=a[f];let p;const w=c[f];if(m.mode===rn.TRIANGLES||m.mode===rn.TRIANGLE_STRIP||m.mode===rn.TRIANGLE_FAN||m.mode===void 0)p=s.isSkinnedMesh===!0?new Sg(v,w):new me(v,w),p.isSkinnedMesh===!0&&p.normalizeSkinWeights(),m.mode===rn.TRIANGLE_STRIP?p.geometry=Jd(p.geometry,Wu):m.mode===rn.TRIANGLE_FAN&&(p.geometry=Jd(p.geometry,ml));else if(m.mode===rn.LINES)p=new Cg(v,w);else if(m.mode===rn.LINE_STRIP)p=new jl(v,w);else if(m.mode===rn.LINE_LOOP)p=new Ig(v,w);else if(m.mode===rn.POINTS)p=new nh(v,w);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(p.geometry.morphAttributes).length>0&&Vx(p,s),p.name=t.createUniqueName(s.name||"mesh_"+e),En(p,s),m.extensions&&Ei(r,p,m),t.assignFinalMaterial(p),u.push(p)}for(let f=0,g=u.length;f<g;f++)t.associations.set(u[f],{meshes:e,primitives:f});if(u.length===1)return s.extensions&&Ei(r,u[0],s),u[0];const h=new ut;s.extensions&&Ei(r,h,s),t.associations.set(h,{meshes:e});for(let f=0,g=u.length;f<g;f++)h.add(u[f]);return h})}loadCamera(e){let t;const i=this.json.cameras[e],r=i[i.type];if(!r){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return i.type==="perspective"?t=new $t(tg.radToDeg(r.yfov),r.aspectRatio||1,r.znear||1,r.zfar||2e6):i.type==="orthographic"&&(t=new cs(-r.xmag,r.xmag,r.ymag,-r.ymag,r.znear,r.zfar)),i.name&&(t.name=this.createUniqueName(i.name)),En(t,i),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],i=[];for(let r=0,s=t.joints.length;r<s;r++)i.push(this._loadNodeShallow(t.joints[r]));return t.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",t.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(r){const s=r.pop(),a=r,o=[],l=[];for(let c=0,d=a.length;c<d;c++){const u=a[c];if(u){o.push(u);const h=new Ve;s!==null&&h.fromArray(s.array,c*16),l.push(h)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new Jl(o,l)})}loadAnimation(e){const t=this.json,i=this,r=t.animations[e],s=r.name?r.name:"animation_"+e,a=[],o=[],l=[],c=[],d=[];for(let u=0,h=r.channels.length;u<h;u++){const f=r.channels[u],g=r.samplers[f.sampler],v=f.target,m=v.node,p=r.parameters!==void 0?r.parameters[g.input]:g.input,w=r.parameters!==void 0?r.parameters[g.output]:g.output;v.node!==void 0&&(a.push(this.getDependency("node",m)),o.push(this.getDependency("accessor",p)),l.push(this.getDependency("accessor",w)),c.push(g),d.push(v))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l),Promise.all(c),Promise.all(d)]).then(function(u){const h=u[0],f=u[1],g=u[2],v=u[3],m=u[4],p=[];for(let A=0,M=h.length;A<M;A++){const b=h[A],R=f[A],E=g[A],y=v[A],C=m[A];if(b===void 0)continue;b.updateMatrix&&b.updateMatrix();const P=i._createAnimationTracks(b,R,E,y,C);if(P)for(let D=0;D<P.length;D++)p.push(P[D])}const w=new $g(s,void 0,p);return En(w,r),w})}createNodeMesh(e){const t=this.json,i=this,r=t.nodes[e];return r.mesh===void 0?null:i.getDependency("mesh",r.mesh).then(function(s){const a=i._getNodeRef(i.meshCache,r.mesh,s);return r.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let l=0,c=r.weights.length;l<c;l++)o.morphTargetInfluences[l]=r.weights[l]}),a})}loadNode(e){const t=this.json,i=this,r=t.nodes[e],s=i._loadNodeShallow(e),a=[],o=r.children||[];for(let c=0,d=o.length;c<d;c++)a.push(i.getDependency("node",o[c]));const l=r.skin===void 0?Promise.resolve(null):i.getDependency("skin",r.skin);return Promise.all([s,Promise.all(a),l]).then(function(c){const d=c[0],u=c[1],h=c[2];h!==null&&d.traverse(function(f){f.isSkinnedMesh&&f.bind(h,qx)});for(let f=0,g=u.length;f<g;f++)d.add(u[f]);if(d.userData.pivot!==void 0&&u.length>0){const f=d.userData.pivot,g=u[0];d.pivot=new O().fromArray(f),d.position.x-=f[0],d.position.y-=f[1],d.position.z-=f[2],g.position.set(0,0,0),delete d.userData.pivot}return d})}_loadNodeShallow(e){const t=this.json,i=this.extensions,r=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const s=t.nodes[e],a=s.name?r.createUniqueName(s.name):"",o=[],l=r._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&o.push(l),s.camera!==void 0&&o.push(r.getDependency("camera",s.camera).then(function(c){return r._getNodeRef(r.cameraCache,s.camera,c)})),r._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let d;if(s.isBone===!0?d=new eh:c.length>1?d=new ut:c.length===1?d=c[0]:d=new ht,d!==c[0])for(let u=0,h=c.length;u<h;u++)d.add(c[u]);if(s.name&&(d.userData.name=s.name,d.name=a),En(d,s),s.extensions&&Ei(i,d,s),s.matrix!==void 0){const u=new Ve;u.fromArray(s.matrix),d.applyMatrix4(u)}else s.translation!==void 0&&d.position.fromArray(s.translation),s.rotation!==void 0&&d.quaternion.fromArray(s.rotation),s.scale!==void 0&&d.scale.fromArray(s.scale);if(!r.associations.has(d))r.associations.set(d,{});else if(s.mesh!==void 0&&r.meshCache.refs[s.mesh]>1){const u=r.associations.get(d);r.associations.set(d,{...u})}return r.associations.get(d).nodes=e,d}),this.nodeCache[e]}loadScene(e){const t=this.extensions,i=this.json.scenes[e],r=this,s=new ut;i.name&&(s.name=r.createUniqueName(i.name)),En(s,i),i.extensions&&Ei(t,s,i);const a=i.nodes||[],o=[];for(let l=0,c=a.length;l<c;l++)o.push(r.getDependency("node",a[l]));return Promise.all(o).then(function(l){for(let d=0,u=l.length;d<u;d++){const h=l[d];h.parent!==null?s.add(px(h)):s.add(h)}const c=d=>{const u=new Map;for(const[h,f]of r.associations)(h instanceof ln||h instanceof Nt)&&u.set(h,f);return d.traverse(h=>{const f=r.associations.get(h);f!=null&&u.set(h,f)}),u};return r.associations=c(s),s})}_createAnimationTracks(e,t,i,r,s){const a=[],o=e.name?e.name:e.uuid,l=[];function c(f){f.morphTargetInfluences&&l.push(f.name?f.name:f.uuid)}li[s.path]===li.weights?(c(e),e.isGroup&&e.children.forEach(c)):l.push(o);let d;switch(li[s.path]){case li.weights:d=rs;break;case li.rotation:d=ss;break;case li.translation:case li.scale:d=ma;break;default:switch(i.itemSize){case 1:d=rs;break;case 2:case 3:default:d=ma;break}break}const u=r.interpolation!==void 0?zx[r.interpolation]:jr,h=this._getArrayFromAccessor(i);for(let f=0,g=l.length;f<g;f++){const v=new d(l[f]+"."+li[s.path],t.array,h,u);r.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(v),a.push(v)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const i=bl(t.constructor),r=new Float32Array(t.length);for(let s=0,a=t.length;s<a;s++)r[s]=t[s]*i;t=r}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(i){const r=this instanceof ss?Bx:Mh;return new r(this.times,this.values,this.getValueSize()/3,i)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function Kx(n,e,t){const i=e.attributes,r=new Zn;if(i.POSITION!==void 0){const o=t.json.accessors[i.POSITION],l=o.min,c=o.max;if(l!==void 0&&c!==void 0){if(r.set(new O(l[0],l[1],l[2]),new O(c[0],c[1],c[2])),o.normalized){const d=bl(pr[o.componentType]);r.min.multiplyScalar(d),r.max.multiplyScalar(d)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const s=e.targets;if(s!==void 0){const o=new O,l=new O;for(let c=0,d=s.length;c<d;c++){const u=s[c];if(u.POSITION!==void 0){const h=t.json.accessors[u.POSITION],f=h.min,g=h.max;if(f!==void 0&&g!==void 0){if(l.setX(Math.max(Math.abs(f[0]),Math.abs(g[0]))),l.setY(Math.max(Math.abs(f[1]),Math.abs(g[1]))),l.setZ(Math.max(Math.abs(f[2]),Math.abs(g[2]))),h.normalized){const v=bl(pr[h.componentType]);l.multiplyScalar(v)}o.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}r.expandByVector(o)}n.boundingBox=r;const a=new Dn;r.getCenter(a.center),a.radius=r.min.distanceTo(r.max)/2,n.boundingSphere=a}function nu(n,e,t){const i=e.attributes,r=[];function s(a,o){return t.getDependency("accessor",a).then(function(l){n.setAttribute(o,l)})}for(const a in i){const o=xl[a]||a.toLowerCase();o in n.attributes||r.push(s(i[a],o))}if(e.indices!==void 0&&!n.index){const a=t.getDependency("accessor",e.indices).then(function(o){n.setIndex(o)});r.push(a)}return Ye.workingColorSpace!==en&&"COLOR_0"in i&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Ye.workingColorSpace}" not supported.`),En(n,e),Kx(n,e,t),Promise.all(r).then(function(){return e.targets!==void 0?Hx(n,e.targets,t):n})}const Yx={},Zx={paper:"#f4efe0"};function To(n){return Dl[n]}function Jx(){const n=new mx,e=new Map,t=new Map,i=[],r=new Map,s=[];for(const[c,d]of Object.entries(Yx))d&&n.load(d,u=>{u.scene.traverse(h=>{h.castShadow=!1,h.receiveShadow=!1}),e.set(c,u.scene)},void 0,()=>{});return{getGlb:c=>e.get(c)??null,lambert:(c,d={})=>{const u=new nc({color:c,emissive:d.emissive??"#000000",emissiveIntensity:d.emissiveIntensity??0,transparent:d.transparent??!1,opacity:d.opacity??1,depthWrite:!d.transparent});return i.push(u),u},sharedGeo:(c,d)=>{const u=t.get(c);if(u)return u;const h=d();return t.set(c,h),h},labelSprite:(c,d)=>{const u=r.get(c);if(u)return u.clone();const h=64,f=document.createElement("canvas");f.width=h,f.height=h;const g=f.getContext("2d");g&&d(g,h);const v=new Pg(f);v.colorSpace=Pt,v.minFilter=At,v.magFilter=At,s.push(v);const m=new Qu({map:v,transparent:!0,depthWrite:!1});i.push(m);const p=new Mg(m);return p.scale.set(.42,.42,.42),r.set(c,p),p.clone()},dispose:()=>{for(const c of t.values())c.dispose();for(const c of i)c.dispose();for(const c of s)c.dispose();t.clear(),i.length=0,s.length=0,r.clear(),e.clear()}}}function Qx(n,e){return!e||!n?"mark-unknown":`mark-${n}`}function jx(n,e,t,i){if(n.clearRect(0,0,e,e),n.translate(e/2,e/2),!i||!t){n.fillStyle=Wt,n.font=`700 ${Math.round(e*.62)}px ui-sans-serif`,n.textAlign="center",n.textBaseline="middle",n.fillText("?",0,2);return}const r=e*.22;t==="coffee"?(n.fillStyle="#8b5a2b",n.beginPath(),n.ellipse(0,0,r,r*.7,.4,0,Math.PI*2),n.fill()):t==="rose"?(n.fillStyle=vt,n.beginPath(),n.arc(0,0,r,0,Math.PI*2),n.fill()):t==="mint"?(n.strokeStyle=Ue,n.lineWidth=4,n.beginPath(),n.moveTo(0,-r),n.quadraticCurveTo(r,0,0,r),n.quadraticCurveTo(-r,0,0,-r),n.stroke()):t==="lemon"?(n.fillStyle=Ue,n.beginPath(),n.ellipse(0,0,r*.9,r*1.15,0,0,Math.PI*2),n.fill()):t==="pine"?(n.fillStyle="#3f8a4c",n.beginPath(),n.moveTo(0,-r),n.lineTo(r,r),n.lineTo(-r,r),n.closePath(),n.fill()):(n.fillStyle=Bt,n.beginPath(),n.arc(0,0,r,0,Math.PI*2),n.fill())}function xh(n,e){const t=Math.sin(n*127.1+e*311.7)*43758.5453;return t-Math.floor(t)}const Eo=new O(0,18.5,3.8),qs=6.9;function eb(){const n=new cs(-8,8,8,-8,.1,80);n.up.set(0,1,0);const e=new O(12,0,8);let t=1;const i=()=>{n.left=-qs*t,n.right=qs*t,n.top=qs,n.bottom=-qs,n.position.set(e.x+Eo.x,e.y+Eo.y,e.z+Eo.z),n.lookAt(e),n.updateProjectionMatrix()};return{camera:n,snap(r,s){e.set(r,0,s),i()},resize(r,s){t=Math.max(.5,r/Math.max(1,s)),i()},follow(r,s,a,o){e.set(r.player.position.x,0,r.player.position.y),i()}}}const tb={coffee:"coffee",piles:"coffee","storage-seal":"coffee",rose:"rose",thorns:"rose","garden-seal":"rose",mint:"mint"};function nb(n){return tb[vi(n).id]??null}function ib(n,e){if(e>=2||n.difficulty==="junior")return 1;if(n.difficulty==="standard")return .62;const t=nb(n);return t?n.player.activeScentProfileId===t?.55:.12:.4}function rb(n){return n.difficulty==="junior"?5e3:n.difficulty==="standard"?4e3:3e3}function sb(n,e,t){return e>=3?.7:n.difficulty==="junior"?.48:n.difficulty==="standard"?.22:t?.38:0}function ab(n){return{cartridge:"hudClueCartridge",optical:"hudClueOptical",filter:"hudClueFilter",secret:"hudClueSecret",leave:"hudClueLeave"}[n]}function ob(n){return n==="storage"||n==="greenhouse"||n==="signal"?n:null}function lb(n,e){return n==="junior"?Math.max(35e3,Math.min(e,4e4)):n==="standard"?4e4:45e3}const wo=120;function cb(n,e){const t=new ut;t.name="effects",n.add(t);const i=e.lambert(Ue,{transparent:!0,opacity:.7,emissive:Ue,emissiveIntensity:.5}),r=[];for(let w=0;w<4;w+=1){const A=new me(e.sharedGeo("scan-ring",()=>new pa(.92,1,48)),i.clone());A.rotation.x=-Math.PI/2,A.position.y=.04,A.visible=!1,t.add(A),r.push(A)}const s=new Float32Array(wo*3),a=new Float32Array(wo*3),o=new Ot;o.setAttribute("position",new zt(s,3)),o.setAttribute("color",new zt(a,3));const l=new ec({size:.12,vertexColors:!0,transparent:!0,opacity:.85,depthWrite:!1}),c=new nh(o,l);t.add(c);const d=new Map,u=new me(e.sharedGeo("obj-ring",()=>new pa(.38,.46,24)),e.lambert(bt,{transparent:!0,opacity:.85,emissive:bt,emissiveIntensity:.4}));u.rotation.x=-Math.PI/2,u.position.y=.05,t.add(u);const h=e.lambert(Ue,{transparent:!0,opacity:.28,emissive:Ue,emissiveIntensity:.45}),f=new me(e.sharedGeo("beacon",()=>new jt(.05,.08,2.4,8)),h);f.position.y=1.2,f.visible=!1,t.add(f);let g=!1,v=0;const m=new De,p=[];for(let w=0;w<8;w+=1){const A=new me(e.sharedGeo("false-core",()=>new Lt(.08,8,6)),e.lambert(vt,{emissive:vt,emissiveIntensity:.5,transparent:!0,opacity:.7}));A.visible=!1,t.add(A),p.push(A)}return{sync(w,A,M,b,R){const E=w.player.scan.active,y=E?1-w.player.scan.remainingMs/1800:A.nudgeScan?R/900%1:0,C=A.reducedMotion?1:E?4:A.nudgeScan?2:0;for(let Q=0;Q<r.length;Q+=1){const se=r[Q],ce=Q<C&&(E||!!A.nudgeScan);if(se.visible=ce,!ce)continue;const Be=(y+Q/Math.max(1,C))%1,We=.45+Be*(E?5.8:2.4);se.position.set(b.x,.04,b.z),se.scale.setScalar(Math.max(.2,We));const ze=se.material;ze.opacity=(E?.62:.32)*(1-Be),ze.color.set(Q%2===0?Ue:Bt),ze.emissive.set(Q%2===0?Ue:Bt)}const P=E||w.player.highlightedIds.length?Tu(w):[],D=new Set;for(const Q of P){const se=Qx(Q.odorId,Q.classified);let ce=d.get(Q.id);ce||(ce=e.labelSprite(se,(We,ze)=>jx(We,ze,Q.odorId,Q.classified)),t.add(ce),d.set(Q.id,ce)),D.add(Q.id),ce.visible=!0;const Be=A.reducedMotion?.55:.5+Math.sin(R/280+Q.tile.x)*.08;ce.position.set(Q.tile.x+.5,.7+Be*.2,Q.tile.y+.5),ce.scale.setScalar(Q.classified?.46:.4)}for(const[Q,se]of d)D.has(Q)||(se.visible=!1);let U=0;const V=(Q,se,ce,Be)=>{if(U>=wo)return;m.set(Be);const We=U*3;s[We]=Q,s[We+1]=se,s[We+2]=ce,a[We]=m.r,a[We+1]=m.g,a[We+2]=m.b,U+=1};E&&!g&&(v=R+rb(w)),g=E;const I=(E||R<v||A.hintLevel>=2)&&!A.reducedMotion?ib(w,A.hintLevel):0;if(I>.05){const Q=vi(w),se=Q.tile.x+.5,ce=Q.tile.y+.5,Be=b.x+Math.cos(w.player.facing)*.55,We=b.z+Math.sin(w.player.facing)*.55,ze=(Be+se)/2+Math.sin(se+ce)*1.4,te=(We+ce)/2+Math.cos(se)*1.1,fe=Math.round((w.difficulty==="junior"?22:w.difficulty==="standard"?14:8)*I);for(let le=0;le<fe;le+=1){const Ie=(le+.5)/fe,Ne=1-Ie,Le=Ne*Ne*Be+2*Ne*Ie*ze+Ie*Ie*se,gt=Ne*Ne*We+2*Ne*Ie*te+Ie*Ie*ce,Xe=.12+Math.sin(R/280+le)*.08;V(Le,Xe,gt,le%2===0?Ue:Wt)}}if(E&&!A.reducedMotion)for(const Q of P){const se=(R/400+Q.tile.x)%(Math.PI*2);V(Q.tile.x+.5+Math.cos(se)*.28,.25+(Q.intensity??1)*.2,Q.tile.y+.5+Math.sin(se)*.28,Q.classified?Ue:Wt)}if(M)for(const Q of M.particles)V(Q.x,.2+(1-Q.life)*.5,Q.y,Q.color);o.setDrawRange(0,U),o.getAttribute("position").needsUpdate=!0,o.getAttribute("color").needsUpdate=!0,c.visible=U>0;const L=vi(w),z=sb(w,A.hintLevel,E);f.visible=z>.04,f.visible&&(f.position.set(L.tile.x+.5,1.2,L.tile.y+.5),h.opacity=A.reducedMotion?z*.7:z*(.7+.3*Math.sin(R/420))),A.hintLevel>=3?(u.visible=!0,u.position.set(L.tile.x+.5,.05,L.tile.y+.5)):u.visible=!1;let K=0;const ie=E&&!dr(w);for(const Q of w.enemies)if(!(Q.kind!=="noiseWisp"&&Q.kind!=="noiseBloom")&&ie)for(const se of Q.falseMarkerTiles){const ce=p[K];if(!ce)break;ce.visible=!0,ce.position.set(se.x+.5,.12,se.y+.5),K+=1}for(let Q=K;Q<p.length;Q+=1)p[Q].visible=!1},dispose(){n.remove(t),o.dispose(),l.dispose()}}}function db(n,e){const t=ub(e);n.add(t.root);const i=new O(12,0,8),r=[],s=(o,l,c,d,u)=>{const h=o.player.position.x+(c&&u<c.knockUntil?c.knockX:0),f=o.player.position.y+(c&&u<c.knockUntil?c.knockY:0),g=Math.hypot(o.player.position.x-o.player.prevPosition.x,o.player.position.y-o.player.prevPosition.y)>.002;if(l.reducedMotion||!g)i.set(h,0,f);else{const b=1-Math.exp(-d*28);i.x+=(h-i.x)*b,i.z+=(f-i.z)*b}t.root.position.set(i.x,0,i.z),t.root.rotation.y=-o.player.facing;const v=u/1e3,m=l.reducedMotion||!g?0:Math.sin(v*11)*.018;t.body.position.y=.42+m;const p=l.reducedMotion||!g?0:Math.sin(v*11)*.42;t.leftLeg.rotation.x=p,t.rightLeg.rotation.x=-p,t.leftArm.rotation.x=g?-p*.55:Math.sin(v*2.3)*.06;const w=!!(c&&Au(c,u));if(t.rightArm.rotation.x=w?-1.15:g?p*.55:.08,t.slash.visible=w,w&&c){const b=1-(c.slashUntil-u)/220;t.slash.rotation.y=-.4+b*1.4,t.slashMat.opacity=l.reducedMotion?.45:.75*(1-b)}const A=!!(c&&u<c.hitFlashUntil),M=o.player.invulnerableUntilMs>o.elapsedMs;for(const b of t.mats)b.emissive.set(A?vt:M?Ue:"#000000"),b.emissiveIntensity=A?.9:M?.22:0;t.shadow.scale.setScalar(g?.92:1)},a=o=>{let l=r.find(c=>c.id===o.id);return l||(l=hb(e,o.kind),l.id=o.id,l.kind=o.kind,n.add(l.root),r.push(l),l)};return{playerPos:i,sync(o,l,c,d,u){s(o,l,c,d,u);const h=new Set;for(const f of o.enemies){const g=c==null?void 0:c.deaths.get(f.id);if(f.defeated&&!g)continue;const v=a(f);h.add(f.id),v.root.visible=!0;const m=u/1e3;v.root.position.set(f.position.x,0,f.position.y),v.root.rotation.y=-f.facing;const p=l.reducedMotion?0:Math.sin(m*3.4+f.position.x)*.04;if(v.root.position.y=f.kind==="noiseWisp"?.28+p:0,g){const A=Fl(g,u,l.reducedMotion);v.root.scale.setScalar(1+A*.4),v.root.traverse(M=>{M instanceof me&&M.material instanceof nc&&(M.material.transparent=!0,M.material.opacity=1-A)})}else v.root.scale.setScalar(f.kind==="noiseBloom"?1.15+(f.phase-1)*.2:1);const w=o.lastFeedback.hitEnemyIds.includes(f.id);for(const A of v.mats)A.emissive.set(w?vt:f.revealed?Ue:"#000000"),A.emissiveIntensity=w?.8:f.revealed&&o.player.scan.active?.35:0;v.root.visible=!(f.kind==="mimicSpore"&&f.disguised&&!o.player.scan.active)}for(const f of r)h.has(f.id)||(f.root.visible=!1)},dispose(){n.remove(t.root);for(const o of r)n.remove(o.root)}}}function ub(n){const e=n.getGlb("player"),t=new ut,i=[],r=A=>{const M=n.lambert(A);return i.push(M),M};if(e){const A=e.clone(!0);t.add(A)}const s=new ut,a=new me(n.sharedGeo("p-torso",()=>new je(.28,.38,.2)),r("#2a3040")),o=new me(n.sharedGeo("p-vest",()=>new je(.3,.16,.22)),r(Wt));o.position.y=-.04;const l=new me(n.sharedGeo("p-head",()=>new Lt(.12,10,8)),r("#d8d0c0"));l.position.y=.28;const c=new me(n.sharedGeo("p-visor",()=>new je(.16,.05,.06)),r(Ue));c.position.set(.08,.28,0);const d=new me(n.sharedGeo("p-arm",()=>new je(.07,.28,.07)),r("#2a3040")),u=d.clone();d.position.set(0,-.02,.18),u.position.set(0,-.02,-.18);const h=new me(n.sharedGeo("p-leg",()=>new je(.08,.26,.09)),r("#1c2433")),f=h.clone();h.position.set(0,-.32,.07),f.position.set(0,-.32,-.07);const g=new me(n.sharedGeo("p-foot",()=>new je(.14,.05,.1)),r("#121826")),v=g.clone();g.position.set(.04,-.14,0),f.add(v),v.position.set(.04,-.14,0),h.add(g),s.add(a,o,l,c,d,u),s.position.y=.42;const m=n.lambert(Ue,{transparent:!0,opacity:.7,emissive:Ue,emissiveIntensity:.4}),p=new me(n.sharedGeo("p-slash",()=>new xa(.42,.03,6,10,Math.PI*.7)),m);p.rotation.x=Math.PI/2,p.visible=!1;const w=new me(n.sharedGeo("contact-shadow",()=>new as(.22,12)),n.lambert("#05070c",{transparent:!0,opacity:.38}));return w.rotation.x=-Math.PI/2,w.position.y=.02,t.add(s,h,f,p,w),h.position.y=.2,f.position.y=.2,{root:t,body:s,leftArm:d,rightArm:u,leftLeg:h,rightLeg:f,slash:p,slashMat:m,shadow:w,mats:i}}function hb(n,e){const t=new ut,i=[],r=(o,l)=>{const c=n.lambert(o,l);return i.push(c),c},s=n.getGlb(e==="vineCrawler"?"vineCrawler":e==="noiseWisp"?"noiseWisp":e==="noiseBloom"?"noiseBloom":e==="mimicSpore"?"mimicSpore":"sporeling");s&&t.add(s.clone(!0));const a=new me(n.sharedGeo("contact-shadow",()=>new as(.22,12)),n.lambert("#05070c",{transparent:!0,opacity:.32}));if(a.rotation.x=-Math.PI/2,a.position.y=.02,e==="vineCrawler"){const o=new me(n.sharedGeo("vine-body",()=>new je(.22,.18,.48)),r("#3f6b48"));o.position.y=.16;const l=new me(n.sharedGeo("vine-head",()=>new Lt(.12,8,6)),r("#2f6b3c"));l.position.set(.16,.2,0),t.add(o,l,a)}else if(e==="noiseWisp"){const o=new me(n.sharedGeo("wisp",()=>new Lt(.16,10,8)),r(Bt,{transparent:!0,opacity:.72,emissive:Bt,emissiveIntensity:.4}));o.position.y=.34,t.add(o)}else if(e==="noiseBloom"){const o=new me(n.sharedGeo("bloom",()=>new Lt(.28,10,8)),r("#3a2a58",{emissive:Bt,emissiveIntensity:.25}));o.position.y=.32;const l=new me(n.sharedGeo("bloom-petal",()=>new os(.12,.28,6)),r("#5a3a78"));l.position.set(.22,.34,0),t.add(o,l,a)}else{const o=new me(n.sharedGeo("spore",()=>new Lt(.18,10,8)),r(e==="mimicSpore"?"#6a4a2c":"#4a5a2c"));o.position.y=.2;const l=new me(n.sharedGeo("spore-cap",()=>new Lt(.14,8,6,0,Math.PI*2,0,Math.PI/2)),r("#6a7c2e"));l.position.y=.3,t.add(o,l,a)}return{id:"",root:t,kind:e,mats:i}}const ci=new ht,_i=new De;function fb(n,e){const t=new ut;t.name="world",n.add(t);const i=e.sharedGeo("floor",()=>new je(1,.08,1)),r=e.sharedGeo("wall",()=>new je(.98,1.28,.98)),s=new nc({vertexColors:!1}),a=new _l(i,s,400),o=new _l(r,s,400);a.instanceMatrix.setUsage(zc),o.instanceMatrix.setUsage(zc),a.frustumCulled=!1,o.frustumCulled=!1,a.instanceColor=new is(new Float32Array(400*3),3),o.instanceColor=new is(new Float32Array(400*3),3),t.add(a,o);const l=new me(e.sharedGeo("ground",()=>new ls(48,36)),e.lambert("#0a1218"));l.rotation.x=-Math.PI/2,l.position.set(12,-.06,8),t.add(l);let c=0,d=0;const u=[],h=[];let f=new Set,g="";const v=m=>{const p=mr(m.map,m.unlockedPassageIds),w=`${p.width}x${p.height}:${m.unlockedPassageIds.join(",")}`;if(!(w===g&&c+d>0)){g=w,f=new Set(m.interactables.map(A=>`${A.tile.x},${A.tile.y}`)),u.length=0,h.length=0,c=0,d=0;for(let A=0;A<p.height;A+=1)for(let M=0;M<p.width;M+=1){const b=p.collision[A*p.width+M]===!0,R=pn(M,A);if(ci.rotation.set(0,0,0),ci.scale.set(1,1,1),b)ci.position.set(M+.5,.64,A+.5),ci.updateMatrix(),o.setMatrixAt(d,ci.matrix),iu(o,d,To(R).wall),h.push({x:M,y:A,room:R}),d+=1;else{ci.position.set(M+.5,.02,A+.5),ci.updateMatrix(),a.setMatrixAt(c,ci.matrix);const E=To(R);iu(a,c,(M+A)%2===0?E.floorA:E.floorB),u.push({x:M,y:A,room:R}),c+=1}}a.count=c,o.count=d,a.instanceMatrix.needsUpdate=!0,o.instanceMatrix.needsUpdate=!0,a.instanceColor&&(a.instanceColor.needsUpdate=!0),o.instanceColor&&(o.instanceColor.needsUpdate=!0)}};return{group:t,rebuild:v,occupied:()=>f,sync(m,p){v(m);const w=mr(m.map,m.unlockedPassageIds),A=m.player.position.x,M=m.player.position.y,b=m.player.scan.active,R=p.lowDarkness?.55:.28,E=(y,C,P)=>{for(let D=0;D<C.length;D+=1){const U=C[D],J=p.lowDarkness||b||pu(w,{x:A,y:M},m.player.facing,{x:U.x+.5,y:U.y+.5},{haloRadius:p.lowDarkness?2.4:1.15,coneRange:p.lowDarkness?8:5.2})?1:R,I=To(U.room),L=P?I.wall:(U.x+U.y)%2===0?I.floorA:I.floorB;_i.set(L).multiplyScalar(p.highContrast?.55+J*.7:.4+J*.6),y.instanceColor&&y.instanceColor.setXYZ(D,_i.r,_i.g,_i.b)}y.instanceColor&&(y.instanceColor.needsUpdate=!0)};E(a,u,!1),E(o,h,!0)},dispose(){n.remove(t),a.dispose(),o.dispose(),s.dispose()}}}function iu(n,e,t){n.instanceColor&&(_i.set(t),n.instanceColor.setXYZ(e,_i.r,_i.g,_i.b))}function pb(n,e,t){const i=mr(n.map,n.unlockedPassageIds),r=(a,o)=>a>=0&&o>=0&&a<i.width&&o<i.height&&i.collision[o*i.width+a]!==!0;return r(e,t-1)||r(e,t+1)?0:Math.PI/2}function mb(n,e,t){const i=new ut;i.name="environment",n.add(i);const r=[],s=(a,o,l,c=0)=>{a.position.set(o+.5,0,l+.5),a.rotation.y=c,i.add(a),r.push(a)};return{rebuild(a,o){for(const d of r)i.remove(d);r.length=0;const l=a.map.width,c=a.map.height;for(let d=0;d<c;d+=1)for(let u=0;u<l;u+=1){const h=d*l+u;if(a.map.collision[h]){gb(a,u,d)&&s(lr(e,pn(u,d)),u,d);continue}if(o.has(`${u},${d}`))continue;const f=pn(u,d),g=xh(u*1.7,d*2.1);_b(e,f,g,u,d,s)}yb(e,a,o,s);for(const d of a.interactables){if(d.kind!=="scentGate"&&d.kind!=="scentLock")continue;const u=a.openDoorIds.includes(d.id)||a.unlockedPassageIds.includes(d.id);!u&&a.map.collision[d.tile.y*a.map.width+d.tile.x]||s(wb(e,pn(d.tile.x,d.tile.y),u),d.tile.x,d.tile.y,pb(a,d.tile.x,d.tile.y))}},dispose(){n.remove(i)}}}function gb(n,e,t){const i=pn(e,t);if(i!=="atrium"&&i!=="corridor")return!1;const r=n.map.width,s=(o,l)=>o<0||l<0||o>=r||l>=n.map.height?!1:n.map.collision[l*r+o]!==!0;return Number(s(e+1,t))+Number(s(e-1,t))+Number(s(e,t+1))+Number(s(e,t-1))>=2&&xh(e,t)>.62}function _b(n,e,t,i,r,s){e==="storage"?t>.86?s(Mb(n),i,r,t*Math.PI):t>.74&&s(bh(n),i,r):e==="greenhouse"?t>.84&&s(Tb(n),i,r):e==="signal"?t>.86&&s(Sh(n),i,r,t>.93?Math.PI/2:0):e==="atrium"&&t>.9&&s(lr(n,e),i,r)}function vb(n,e,t){return!n.has(`${e},${t}`)}function yb(n,e,t,i){const r=e.map.width,s=(o,l)=>o>=0&&l>=0&&o<r&&l<e.map.height&&e.map.collision[l*r+o]!==!0&&vb(t,o,l),a=new me(n.sharedGeo("atrium-runner",()=>new je(4.2,.03,.42)),n.lambert("#3a4a28",{emissive:"#cde76d",emissiveIntensity:.22}));i(a,12,1),a.position.set(12.4,.05,1.55),s(11,4)&&i(lr(n,"atrium"),11,4),s(13,4)&&i(lr(n,"atrium"),13,4),s(11,8)&&i(lr(n,"atrium"),11,8),s(13,8)&&i(lr(n,"atrium"),13,8);for(const[o,l,c]of[[2,2,0],[5,2,Math.PI/2],[7,3,0],[3,3,Math.PI/2]])s(o,l)&&i(xb(n),o,l,c);for(const[o,l]of[[1,3],[4,1],[6,2],[7,1]])s(o,l)&&i(bh(n),o,l);s(2,7)&&i(ru(n),2,7),s(5,8)&&i(ru(n),5,8);for(const[o,l]of[[1,8],[3,9],[6,7],[7,9]])s(o,l)&&i(Eb(n),o,l);for(const[o,l]of[[2,9],[4,7],[6,9]])s(o,l)&&i(bb(n),o,l);for(const[o,l,c]of[[17,3,0],[20,2,Math.PI/2],[18,6,0],[21,9,Math.PI/2]])s(o,l)&&i(Sb(n),o,l,c);s(19,5)&&i(su(n),19,5),s(21,11)&&i(su(n),21,11),s(17,8)&&i(Sh(n),17,8)}function ki(n,e){const t=n.getGlb(e);return t?t.clone(!0):null}function Mb(n){const e=ki(n,"crate");if(e)return e;const t=new ut,i=new me(n.sharedGeo("crate",()=>new je(.42,.38,.42)),n.lambert("#6a4a2c"));i.position.y=.2;const r=new me(n.sharedGeo("crate-lid",()=>new je(.44,.05,.44)),n.lambert("#8a6136"));return r.position.y=.4,t.add(i,r),t}function xb(n){const e=ki(n,"shelf");if(e)return e;const t=new ut,i=new me(n.sharedGeo("rack",()=>new je(.58,1.55,.28)),n.lambert("#3a2e24"));i.position.y=.78;const r=n.sharedGeo("rack-plank",()=>new je(.54,.04,.26)),s=n.lambert("#cbb79a");for(let a=0;a<4;a+=1){const o=new me(r,s);o.position.y=.28+a*.36,t.add(o)}return t.add(i),t}function ru(n){const e=new ut,t=n.lambert("#cde76d",{transparent:!0,opacity:.14,emissive:"#4a8a52",emissiveIntensity:.08}),i=n.lambert("#24382c"),r=new me(n.sharedGeo("glass-roof",()=>new je(.9,.04,.9)),t);r.position.y=1.15;const s=new me(n.sharedGeo("glass-pane",()=>new je(.86,1.05,.04)),t);s.position.set(0,.55,.42);const a=new me(n.sharedGeo("glass-post",()=>new je(.06,1.12,.06)),i),o=a.clone(),l=a.clone();return o.position.set(-.4,.56,.4),l.position.set(.4,.56,.4),e.add(r,s,o,l),e}function bb(n){const e=new ut,t=new me(n.sharedGeo("rose-bush",()=>new Lt(.22,8,6)),n.lambert("#2f6b3c"));t.position.y=.22;const i=new me(n.sharedGeo("rose-bloom",()=>new Lt(.07,8,6)),n.lambert("#ee7b66",{emissive:"#ee7b66",emissiveIntensity:.18}));return i.position.set(.08,.38,.04),e.add(t,i),e}function Sb(n){const e=new ut,t=new me(n.sharedGeo("fluoro-panel",()=>new je(.7,.85,.06)),n.lambert("#1a2234",{emissive:"#cde76d",emissiveIntensity:.32}));t.position.y=.7;const i=new me(n.sharedGeo("fluoro-bar",()=>new je(.62,.05,.04)),n.lambert("#cde76d",{emissive:"#cde76d",emissiveIntensity:.55}));return i.position.y=.92,e.add(t,i),e}function su(n){const e=new ut,t=n.lambert("#3a4460",{emissive:"#7655e8",emissiveIntensity:.18});for(let i=0;i<3;i+=1){const r=new me(n.sharedGeo("cable",()=>new jt(.02,.02,.9,5)),t);r.rotation.z=Math.PI/2,r.position.set(0,.08+i*.05,(i-1)*.08),e.add(r)}return e}function bh(n){const e=new ut,t=new me(n.sharedGeo("sack",()=>new Lt(.16,8,6)),n.lambert("#8b5a2b"));return t.position.y=.16,t.scale.set(1,.85,1.1),e.add(t),e}function Tb(n){const e=ki(n,"plant");if(e)return e;const t=new ut,i=new me(n.sharedGeo("pot",()=>new jt(.1,.12,.12,8)),n.lambert("#3a2e24"));i.position.y=.06;const r=new me(n.sharedGeo("leaf",()=>new os(.16,.42,6)),n.lambert("#3f6b48"));return r.position.y=.36,t.add(i,r),t}function Eb(n){const e=ki(n,"vine");if(e)return e;const t=new ut,i=n.lambert("#2f6b3c");for(let r=0;r<3;r+=1){const s=new me(n.sharedGeo("vine-stem",()=>new jt(.025,.04,.7,5)),i);s.position.set((r-1)*.08,.34,0),s.rotation.z=(r-1)*.22,t.add(s)}return t}function Sh(n){const e=ki(n,"lab");if(e)return e;const t=new ut,i=new me(n.sharedGeo("lab-bench",()=>new je(.62,.28,.36)),n.lambert("#242c40"));i.position.y=.16;const r=new me(n.sharedGeo("lab-scope",()=>new jt(.05,.05,.28,8)),n.lambert("#3a4460",{emissive:"#cde76d",emissiveIntensity:.35}));r.position.set(-.12,.42,0);const s=new me(n.sharedGeo("lab-vial",()=>new jt(.04,.04,.16,8)),n.lambert("#9b7dff",{emissive:"#7655e8",emissiveIntensity:.28}));return s.position.set(.16,.38,.04),t.add(i,r,s),t}function lr(n,e){const t=ki(n,"pillar");if(t)return t;const i=e==="atrium"?"#5a6a90":"#3a4a48",r=new ut,s=new me(n.sharedGeo("pillar",()=>new jt(.14,.16,1.35,8)),n.lambert(i));s.position.y=.68;const a=new me(n.sharedGeo("pillar-cap",()=>new je(.38,.08,.38)),n.lambert("#cbb79a"));return a.position.y=1.34,r.add(s,a),r}function wb(n,e,t){const i=ki(n,"doorway");if(i)return i;const r=e==="signal"?"#4a5a78":"#5a6a90",s=new ut,a=new me(n.sharedGeo("door-post",()=>new je(.12,1.15,.12)),n.lambert(r)),o=a.clone();a.position.set(-.38,.58,0),o.position.set(.38,.58,0);const l=new me(n.sharedGeo("door-lintel",()=>new je(.9,.12,.14)),n.lambert(t?"#e6c56a":r));return l.position.y=1.18,s.add(a,o,l),s}function Ab(n,e){const t=new ut;t.name="interactables",n.add(t);const i=new Map,r=l=>{const c=e.labelSprite(`key-${l}`,(d,u)=>{d.clearRect(0,0,u,u),d.fillStyle="rgba(18,24,36,0.9)",Pb(d,4,18,56,28,8),d.fill(),d.strokeStyle=Ue,d.lineWidth=3,d.stroke(),d.fillStyle=Wt,d.font="700 18px ui-sans-serif",d.textAlign="center",d.textBaseline="middle",d.fillText(`[${l}]`,u/2,u/2+1)});return c.scale.set(.62,.42,.5),n.add(c),c.visible=!1,c},s=r("E"),a=r("Q"),o=l=>{const c=i.get(l.id);if(c)return c;const d=Ib(e,l);return t.add(d.root),i.set(l.id,d),d};return{sync(l,c,d,u){const h=l.player.scan.active,f=new Set;for(const v of l.interactables){const m=o(v);f.add(v.id),m.root.visible=Cb(l,v),m.root.position.set(v.tile.x+.5,0,v.tile.y+.5);const p=l.player.highlightedIds.includes(v.id),w=d==null?void 0:d.dissolves.get(v.id);if(w){const M=Ul(w,u,c.reducedMotion);m.root.scale.setScalar(Math.max(.05,1-M))}else m.root.scale.setScalar(1);if((v.kind==="chest"||v.kind==="hiddenChest")&&m.root.userData.lid instanceof ht){const M=l.player.openedChestIds.includes(v.id),b=d==null?void 0:d.chests.get(v.id),R=Nl(b,u,c.reducedMotion),E=m.root.userData.lid;E.rotation.x=M||R>.18?-1.1*(M?1:Math.min(1,(R-.18)/.3)):0,(b==null?void 0:b.phase)==="shake"&&!c.reducedMotion&&(m.root.position.x+=Math.sin(u/18)*.04)}if(v.kind==="exit"){const M=m.root.userData.seals;M&&uu.forEach((b,R)=>{const E=l.player.restoredSealIds.includes(b),y=M[R];y&&(y.emissive.set(E?Ue:"#1a2218"),y.emissiveIntensity=E?.85:.04,y.color.set(E?Ue:"#2a3040"))})}if(v.kind==="exitSeal"){const M=l.player.restoredSealIds.includes(v.sealId??"storage");for(const b of m.glow)b.emissive.set(M?bt:"#445"),b.emissiveIntensity=M?.45:.05}if(v.kind==="coffeePile")for(const M of m.glow)M.color.set(p?v.trueTarget?Ue:"#8b5a2b":"#6a4420");const A=p||h&&(v.kind==="odorSample"||v.kind==="decayBarrier"||v.kind==="thornWall"||v.kind==="noisyField");for(const M of m.glow)v.kind==="noisyField"&&h&&!dr(l)?(M.emissive.set(vt),M.emissiveIntensity=.45):A?(M.emissive.set(v.kind==="noisyField"?vt:Ue),M.emissiveIntensity=c.highContrast?.7:.42):v.kind!=="exitSeal"&&(M.emissiveIntensity=v.kind==="modulePedestal"?.28:0);if(v.kind==="scentTrail"&&Pl(l)&&h)for(const M of m.glow)M.emissive.set(Ue),M.emissiveIntensity=v.trailIntensity??.55}for(const[v,m]of i)f.has(v)||(m.root.visible=!1);const g=va(l);if(s.visible=!1,a.visible=!1,g.input!=="none"){const v=g.item?Rb(g.item):l.player.position,m=g.input==="Q"?a:s;m.visible=!0,m.position.set(v.x,.95,v.y)}},dispose(){n.remove(t,s,a)}}}function Rb(n){return{x:n.tile.x+.5,y:n.tile.y+.5}}function Cb(n,e){return e.kind==="hiddenChest"||e.kind==="hiddenPassage"?n.unlockedPassageIds.includes(e.id)||n.player.scan.active:e.kind==="thornWall"||e.kind==="decayBarrier"?!n.unlockedPassageIds.includes(e.id):e.kind==="scentGate"?!n.openDoorIds.includes(e.id):!0}function Ib(n,e){const t=new ut,i=[],r=(a,o)=>{const l=n.lambert(a,o);return i.push(l),l};if(e.kind==="chest"||e.kind==="hiddenChest"){const a=n.getGlb("chest");if(a)t.add(a.clone(!0));else{const o=new me(n.sharedGeo("chest-box",()=>new je(.42,.26,.3)),r("#6a4a2c"));o.position.y=.16;const l=new me(n.sharedGeo("chest-lid",()=>new je(.44,.08,.32)),r("#8a6136",{emissive:bt,emissiveIntensity:.08}));l.position.set(0,.3,-.02),t.userData.lid=l,t.add(o,l)}}else if(e.kind==="exit"){const a=n.getGlb("exitGate");if(a)t.add(a.clone(!0));else{const o=n.lambert("#243044"),l=n.lambert(Ue,{emissive:Ue,emissiveIntensity:.35}),c=new me(n.sharedGeo("exit-post",()=>new je(.22,2.35,.28)),o),d=c.clone();c.position.set(-.85,1.18,.12),d.position.set(.85,1.18,.12);const u=new me(n.sharedGeo("exit-lintel",()=>new je(1.95,.28,.32)),l);u.position.set(0,2.28,.12);const h=new me(n.sharedGeo("exit-back",()=>new je(1.7,2.05,.08)),n.lambert("#121826",{emissive:"#1a2818",emissiveIntensity:.15}));h.position.set(0,1.05,-.08);const f=[];for(let g=0;g<3;g+=1){const v=n.lambert("#2a3040",{emissive:"#1a2218",emissiveIntensity:.04});i.push(v),f.push(v);const m=new me(n.sharedGeo("exit-slot",()=>new Lt(.11,10,8)),v);m.position.set(-.5+g*.5,1.72,.22),t.add(m)}t.userData.seals=f,t.add(c,d,u,h)}}else if(e.kind==="odorSample"){const a=new me(n.sharedGeo("sample",()=>new Lt(.12,10,8)),r("#7aa0c4",{emissive:Ue,emissiveIntensity:.15}));a.position.y=.22,t.add(a)}else if(e.kind==="modulePedestal"){const a=new me(n.sharedGeo("pedestal",()=>new jt(.16,.2,.18,8)),r("#2a3040"));a.position.y=.1;const o=new me(n.sharedGeo("pedestal-gem",()=>new Lt(.1,10,8)),r(Bt,{emissive:Bt,emissiveIntensity:.35}));o.position.y=.28,t.add(a,o)}else if(e.kind==="checkpoint"){const a=new me(n.sharedGeo("flag-pole",()=>new jt(.02,.02,.5,6)),r("#89a"));a.position.y=.26;const o=new me(n.sharedGeo("flag",()=>new je(.2,.12,.02)),r(Ue));o.position.set(.12,.42,0),t.add(a,o)}else if(e.kind==="coffeePile"){const a=new me(n.sharedGeo("pile",()=>new Lt(.18,8,6)),r("#6a4420"));a.position.y=.12,a.scale.set(1.2,.6,1),t.add(a)}else if(e.kind==="exitSeal"){const a=new me(n.sharedGeo("seal",()=>new xa(.16,.03,8,16)),r(bt,{emissive:bt,emissiveIntensity:.2}));a.rotation.x=Math.PI/2,a.position.y=.08;const o=new me(n.sharedGeo("seal-core",()=>new Lt(.07,8,6)),r(bt));o.position.y=.1,t.add(a,o)}else if(e.kind==="thornWall"){const a=new me(n.sharedGeo("thorn",()=>new os(.12,.7,5)),r("#5a3a48"));a.position.y=.36,t.add(a)}else if(e.kind==="decayBarrier"||e.kind==="hiddenPassage"){const a=new me(n.sharedGeo("barrier",()=>new jt(.05,.05,1.1,5)),r("#3f6b48"));a.position.y=.5,a.rotation.z=.3,t.add(a)}else if(e.kind==="noisyField"){const a=new me(n.sharedGeo("noise-field",()=>new Lt(.28,8,6)),r(vt,{transparent:!0,opacity:.22,emissive:vt,emissiveIntensity:.2}));a.position.y=.2,t.add(a)}else if(e.kind==="scentTrail"){const a=new me(n.sharedGeo("trail",()=>new Lt(.1,8,6)),r(Ue,{transparent:!0,opacity:.5,emissive:Ue,emissiveIntensity:.2}));a.position.y=.08,t.add(a)}else{const a=new me(n.sharedGeo("item-stub",()=>new je(.22,.22,.22)),r("#3a4460"));a.position.y=.14,t.add(a)}const s=new me(n.sharedGeo("contact-shadow",()=>new as(.22,12)),n.lambert("#05070c",{transparent:!0,opacity:.28}));return s.rotation.x=-Math.PI/2,s.position.y=.015,t.add(s),{id:e.id,kind:e.kind,root:t,glow:i}}function Pb(n,e,t,i,r,s){n.beginPath(),n.moveTo(e+s,t),n.arcTo(e+i,t,e+i,t+r,s),n.arcTo(e+i,t+r,e,t+r,s),n.arcTo(e,t+r,e,t,s),n.arcTo(e,t,e+i,t,s),n.closePath()}function Lb(n){const e=new t0(16052192,1712688,.72);n.add(e);const t=new ch(16249572,.85);t.position.set(2.4,20,11),t.castShadow=!1,n.add(t);const i=new fi(13494125,1.15,6.5,1.6);i.castShadow=!1,n.add(i);const r=new fi(10190335,0,8,1.4);r.castShadow=!1,n.add(r);const s=new fi(15123818,.22,5.5,2);s.position.set(12.5,1.4,7.5),n.add(s);const a=new fi(9068854,.18,4.2,2);a.position.set(4,1.1,2.5),n.add(a);const o=new fi(4885074,.2,4.4,2);o.position.set(4,1.2,8),n.add(o);const l=new fi(7755240,.2,4.6,2);l.position.set(20,1.3,8),n.add(l);const c=new fi(13494125,.55,6.2,1.6);return c.position.set(14.5,1.6,2.1),n.add(c),{hemi:e,key:t,fill:i,scan:r,sync(d,u,h,f){const g=d.player.scan.active,v=u.lowDarkness?.9:.62,m=u.highContrast?1.18:1;e.intensity=(g?.38:v)*m,e.color.set(g?"#8a90a4":Zx.paper),t.intensity=(g?.42:.82)*m,i.position.set(h.x,1.35,h.z),i.intensity=g?.55:u.lowDarkness?1.35:1.05,i.distance=u.lowDarkness?8.2:6.2,r.position.set(h.x,.4,h.z),r.intensity=g?u.reducedMotion?.55:1.15:0,s.intensity=g?.1:.32,a.color.set(12880458),a.intensity=g?.08:.42,o.intensity=g?.1:.34;const p=u.reducedMotion?.22:.12+(Math.sin(f/110)>.55?.28:.08);l.intensity=g?.08:p,c.intensity=g?.2:.7},dispose(){n.remove(e,t,i,r,s,a,o,l,c)}}}const au=2;function Db(){try{const n=document.createElement("canvas"),e=n.getContext("webgl2")??n.getContext("webgl");if(!e)return!1;const t=e.getExtension("WEBGL_lose_context");return t==null||t.loseContext(),!0}catch{return!1}}function Nb(n,e){if(!Db())return null;try{return Ub(n,e)}catch{return null}}function Ub(n,e){const t=(window.innerWidth||1280)*(window.innerHeight||720)*(window.devicePixelRatio||1),i=new fx({canvas:n,antialias:t<22e5,alpha:!1,powerPreference:"high-performance",stencil:!1,depth:!0,failIfMajorPerformanceCaveat:!1});i.outputColorSpace=Pt,i.toneMapping=mn,i.setClearColor(922655,1),i.shadowMap.enabled=!1,i.setPixelRatio(Math.min(window.devicePixelRatio||1,au));const r=new mg;r.fog=new ua(659480,.028);const s=Jx(),a=eb(),o=Lb(r),l=fb(r,s),c=mb(r,s),d=db(r,s),u=Ab(r,s),h=cb(r,s);let f=1,g=1,v=0,m="",p=!1;const w=(e==null?void 0:e.getContext("2d"))??null;return{resize:(M,b)=>{if(f=Math.max(1,Math.floor(M)),g=Math.max(1,Math.floor(b)),i.setPixelRatio(Math.min(window.devicePixelRatio||1,au)),i.setSize(f,g,!1),a.resize(f,g),e){const R=Math.min(188,Math.floor(f*.32)),E=148;e.width=R,e.height=E}},draw(M,b){const R=b.pulseMs,E=v?Math.min(.05,Math.max(.001,(R-v)/1e3)):.016;v=R,p||(a.snap(M.player.position.x,M.player.position.y),p=!0),l.sync(M,b);const y=`${M.unlockedPassageIds.join(",")}|${M.openDoorIds.join(",")}`;y!==m&&(m=y,c.rebuild(M,l.occupied())),d.sync(M,b,b.fx,E,R),u.sync(M,b,b.fx,R),h.sync(M,b,b.fx,d.playerPos,R),o.sync(M,b,d.playerPos,R),a.follow(M,b,E,R);const C=M.player.scan.active,P=C?b.reducedMotion?.04:.055:b.lowDarkness?.018:.032;r.fog instanceof ua&&(r.fog.density=P),r.fog&&r.fog.color.set(C?"#141820":"#0a1018"),i.render(r,a.camera),e&&w&&(w.clearRect(0,0,e.width,e.height),Ru(w,M,e.width,e.height,!1))},dispose(){o.dispose(),l.dispose(),c.dispose(),d.dispose(),u.dispose(),h.dispose(),s.dispose(),i.dispose()}}}function Fb(){let n=null,e=0,t="";const i=()=>{if(n)return n;const a=window.AudioContext||window.webkitAudioContext;return a?(n=new a,n):null},r=(a,o,l,c=.04,d=0)=>{const u=i();if(!u)return;const h=u.createOscillator(),f=u.createGain();h.type=l,h.frequency.setValueAtTime(a,u.currentTime),d&&h.frequency.exponentialRampToValueAtTime(Math.max(40,a+d),u.currentTime+o),f.gain.setValueAtTime(c,u.currentTime),f.gain.exponentialRampToValueAtTime(.001,u.currentTime+o),h.connect(f),f.connect(u.destination),h.start(),h.stop(u.currentTime+o)};return{play:(a,o)=>{if(o)return;const l=performance.now();a===t&&l-e<80||(e=l,t=a,a==="scan"?(r(420,.18,"sine",.03,280),r(640,.22,"triangle",.018,120)):a==="pickup"?r(520,.12,"sine",.04,260):a==="chest"?(r(180,.1,"square",.03),r(420,.16,"triangle",.03,180)):a==="hit"?r(160,.08,"sawtooth",.035,-40):a==="secret"?r(360,.2,"sine",.03,400):a==="seal"?(r(300,.16,"triangle",.035),r(480,.22,"sine",.03,200)):a==="miss"?r(140,.1,"square",.02,-50):r(240,.12,"sine",.03,80))},unlock:i}}const di={"receptor-cartridge":{en:"Receptor",zh:"受體匣"},"optical-reader":{en:"Optical Reader",zh:"光學讀取"},"signal-filter":{en:"Signal Filter",zh:"訊號濾波"},"pattern-decoder":{en:"Pattern Decoder",zh:"圖樣解碼"}};function be(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")}function ui(n,e){const t=or(n),i=["banana","lemon","rose","coffee","mint","strawberry","chocolate","lavender","orange","cinnamon","apple","vanilla","bread","pine","popcorn","peach"].indexOf(n),r=i>=0?`${i%5*25}% ${Math.floor(i/5)*(100/3)}%`:"0 0",s=(t==null?void 0:t.name[e])??n;return`<span class="sb-odor" style="background-position:${r}" role="img" aria-label="${be(s)}"></span>`}function Ob(n){var _t,xt;const e=n.root;let t=hu(localStorage.getItem(ia)),i="junior",r=`sb-${Date.now().toString(36)}`,s=!1,a,o=0,l=0,c=0,d="",u=0,h=!1,f=null,g="",v=!1,m=null,p="",w="",A="",M="",b=null;const R=Np(),E=Fb(),y=dp();let C=null,P=null;const D=()=>n.getCopy(),U=()=>n.getUi(),V=()=>n.getLocale(),J=()=>{try{localStorage.setItem(ia,JSON.stringify(t))}catch{}},I=()=>{document.documentElement.classList.toggle("high-contrast",t.highContrast),document.documentElement.classList.toggle("reduced-effects",t.reducedMotion),document.documentElement.classList.toggle("low-darkness",t.lowDarkness)};function L(){const S=D(),Z=document.querySelector("#introEyebrow"),H=document.querySelector("#introTitle"),T=document.querySelector("#introLead"),_=document.querySelector("#chooseRun");Z&&(Z.innerHTML=`<span></span> ${kh("02")}`),H&&(H.innerHTML=V()==="en"?"Scentbound <em>Labyrinth</em>":"<em>氣味迷宮</em>"),T&&(T.textContent=S.lead),_&&(_.textContent=S.chooseLevel);const N=document.querySelector("#introChips");N&&(N.innerHTML=`<span><b>${S.junior}</b></span><span><b>${S.standard}</b></span><span><b>${S.challenge}</b></span>`)}function z(){var N,k,G,ne,re,q,$,oe,ue;Mt(),P&&(window.removeEventListener("resize",P),P=null),(N=C==null?void 0:C.dispose)==null||N.call(C),C=null,a=void 0,c=0,h=!1;const S=D(),Z=U();L();const H=e.querySelector("#settingsPanel"),T=e.querySelector("#playArea"),_=e.querySelector(".game-card");!(H instanceof HTMLElement)||!(T instanceof HTMLElement)||(_==null||_.classList.remove("maze-live"),H.innerHTML=`<h3>${be(S.chooseLevel)}</h3>
      ${Nh({label:S.chooseLevel,selectedId:i,cards:[{id:"junior",index:"01",label:S.junior,blurb:S.juniorBlurb},{id:"standard",index:"02",label:S.standard,blurb:S.standardBlurb},{id:"challenge",index:"03",label:S.challenge,blurb:S.challengeBlurb}]})}
      ${Uh({summary:Z.advanced,open:s,body:`
          <div class="seed-row"><label>${be(S.seed)} <input id="seed-input" data-testid="seed-input" type="text" value="${be(r)}" spellcheck="false" autocomplete="off" /></label>
          <button class="secondary-button" id="newSeed" type="button">${be(S.randomize)}</button></div>
          <div class="preference-row">
            <label><input id="reduced" type="checkbox" ${t.reducedMotion?"checked":""}/> ${be(S.reducedMotion)}</label>
            <label><input id="contrast" type="checkbox" ${t.highContrast?"checked":""}/> ${be(S.highContrast)}</label>
            <label><input id="lowDark" type="checkbox" ${t.lowDarkness?"checked":""}/> ${be(S.lowDarkness)}</label>
            <label><input id="muted" type="checkbox" ${t.muted?"checked":""}/> ${be(S.muteSfx)}</label>
          </div>`})}`,T.innerHTML=Fh({kicker:`GAME 02 · ${K()}`,title:S.title,lead:S.readyLead,startId:"start-adventure",startTestId:"start-adventure",startLabel:Z.startGame,stateTestId:"ready"}),Oh(H,ae=>{i=ae,z()}),(k=H.querySelector("#advanced"))==null||k.addEventListener("toggle",ae=>{s=ae.target.open}),(G=H.querySelector("#newSeed"))==null||G.addEventListener("click",()=>{r=`sb-${Date.now().toString(36)}`,z()}),(ne=H.querySelector("#seed-input"))==null||ne.addEventListener("change",ae=>{const de=ae.target.value.trim();de&&(r=de)}),(re=H.querySelector("#reduced"))==null||re.addEventListener("change",ae=>{t={...t,reducedMotion:ae.target.checked},J(),I()}),(q=H.querySelector("#contrast"))==null||q.addEventListener("change",ae=>{t={...t,highContrast:ae.target.checked},J(),I()}),($=H.querySelector("#lowDark"))==null||$.addEventListener("change",ae=>{t={...t,lowDarkness:ae.target.checked},J(),I()}),(oe=H.querySelector("#muted"))==null||oe.addEventListener("change",ae=>{t={...t,muted:ae.target.checked},J()}),(ue=T.querySelector("#start-adventure"))==null||ue.addEventListener("click",()=>{E.unlock(),se()}),ie())}function K(){const S=D();return i==="junior"?S.junior:i==="challenge"?S.challenge:S.standard}function ie(){const S=D(),Z=e.querySelector("#howBody"),H=e.querySelector("#scienceBody");Z&&(Z.innerHTML=`<div class="sb-how" data-testid="how-cards">
        <article><b>${be(S.move)}</b><span>WASD</span></article>
        <article><b>${be(S.attack)}</b><span>SPACE</span></article>
        <article><b>${be(S.scan)}</b><span>Q</span></article>
        <article><b>${be(S.interact)}</b><span>E</span></article>
      </div>`),H&&(H.innerHTML=`<p>${be(S.scienceBody)}</p>`)}function Q(S){return[S.player.collectedModules.join(","),S.player.learnedOdorIds.join(","),S.unlockedPassageIds.join(","),S.player.solvedPuzzleIds.join(","),S.player.restoredSealIds.join(","),String(S.player.exitPatternSolved),String(S.player.inspectedExit)].join("|")}function se(){var G,ne,re,q;Mt(),P&&(window.removeEventListener("resize",P),P=null),(G=C==null?void 0:C.dispose)==null||G.call(C),C=null;const S=e.querySelector("#playArea"),Z=e.querySelector(".game-card");if(!(S instanceof HTMLElement))return;Z==null||Z.classList.add("maze-live"),a=jf({seed:r,difficulty:i}),d=Q(a),u=0,c=0,h=!1,g="",v=!1,m=null,p="",b=null,w="",A="",M="",S.innerHTML=ce();const H=S.querySelector("#maze");if(!H)return;const T=S.querySelector("#maze-minimap"),_=S.querySelector('[data-testid="webgl-fallback"]');if(C=Nb(H,T),C)_&&(_.hidden=!0);else{const $=document.createElement("canvas");$.id="maze",$.dataset.testid="maze-canvas";const oe=H.getAttribute("aria-label");oe&&$.setAttribute("aria-label",oe),H.replaceWith($),T==null||T.remove(),C=Vp($),_&&(_.hidden=!1)}const N=()=>C==null?void 0:C.resize(S.clientWidth,Math.max(420,S.clientHeight));N(),P=N,window.addEventListener("resize",P),y.attach(S),l=performance.now();const k=$=>{if(!a||!C)return;const oe=Math.min(50,$-l);l=$;const ue=y.sample();ue.hintPressed&&Je(),ue.libraryPressed&&yt(),a=Ac(a,ue,oe),a.player.scan.active&&(v=!0);const ae=t.reducedMotion||document.documentElement.classList.contains("reduced-motion");if(Up(R,a,$,ae),ue.attackPressed&&a.phase==="playing"&&Fp(R,a.player.facing,$,ae),fe(a),te(a),a.phase==="victory"){Tt(a);return}const de=Q(a);de!==d?(d=de,u=a.elapsedMs,c=0,h=!1):a.elapsedMs-u>lb(i,Fi[i].hintIdleMs)&&(h=!0);const Ee=!v&&a.elapsedMs>8e3&&a.elapsedMs<45e3;C.draw(a,{lowDarkness:t.lowDarkness,highContrast:t.highContrast,reducedMotion:ae,hintLevel:c,pulseMs:$,nudgeScan:Ee,fx:R}),Be(S,a),a.phase==="puzzle"&&a.activePuzzle&&Qe(S,a),o=requestAnimationFrame(k)};o=requestAnimationFrame(k),(ne=S.querySelector("#pauseBtn"))==null||ne.addEventListener("click",()=>{a=Ac(a,{...Qf(),pausePressed:!0},0)}),(re=S.querySelector("#libraryBtn"))==null||re.addEventListener("click",()=>yt()),(q=S.querySelector("#hintBtn"))==null||q.addEventListener("click",()=>Je()),Ne(S)}function ce(){const S=D();return`<div class="sb-play" data-testid="maze-play">
      <div class="sb-hud">
        <div class="sb-objective" data-testid="objective">
          <div class="sb-goal-title">${be(S.goalTitle)}</div>
          <div class="sb-seals" data-testid="seal-slots" data-tools="true"></div>
          <div class="sb-clue-label">${be(S.currentClue)}</div>
          <div class="sb-obj-row"><strong data-testid="current-clue"></strong></div>
          <div class="sr-only" data-testid="current-wing"></div>
        </div>
        <div class="sb-status">
          <div class="sb-hearts" data-testid="hearts"></div>
          <div class="sb-scan" data-testid="scan-status"></div>
          <div class="sb-active-scent" data-testid="active-scent"></div>
          <button class="text-button" id="libraryBtn" type="button" aria-label="${be(S.library)}">${be(S.library)}</button>
          <button class="text-button" id="hintBtn" type="button" aria-label="${be(S.hint)}">H</button>
        </div>
      </div>
      <canvas id="maze" data-testid="maze-canvas" aria-label="${be(S.title)}"></canvas>
      <canvas id="maze-minimap" class="sb-minimap" width="188" height="148" aria-hidden="true"></canvas>
      <div class="sb-wing-title" data-testid="wing-title" hidden>
        <strong></strong>
        <span></span>
      </div>
      <p class="sb-webgl-fallback" data-testid="webgl-fallback" hidden>${be(S.webglFallback)}</p>
      <div class="sb-scent-wheel" data-testid="scent-wheel"></div>
      <div class="sb-feedback" data-testid="game-feedback" hidden></div>
      <div class="sb-seal-banner" data-testid="seal-banner" hidden></div>
      <div class="sb-prompt" data-testid="context-prompt"></div>
      <p class="sb-hint-prompt" data-testid="hint-prompt" hidden>${be(S.needHint)}</p>
      <div class="sb-mobile" aria-label="${be(S.mobileControls)}">
        <div class="sb-joy" data-joystick aria-label="${be(S.move)}"><i data-joystick-knob></i><span>${be(S.move)}</span></div>
        <div class="sb-btns">
          <button type="button" data-attack-btn aria-label="${be(S.attack)}">${be(S.attack)}</button>
          <button type="button" data-scan-btn aria-label="${be(S.scan)}">${be(S.scan)}</button>
          <button type="button" data-interact-btn aria-label="${be(S.interact)}">${be(S.interact)}</button>
        </div>
      </div>
      <div class="sb-overlay" id="pauseOverlay" hidden role="dialog" aria-label="${be(S.pause)}">
        <div>
          <strong>${be(S.pause)}</strong>
          <button class="primary-button" id="pauseBtn" type="button">${be(S.resume)}</button>
        </div>
      </div>
      <div class="sb-overlay sb-puzzle" id="puzzleOverlay" hidden></div>
      <dialog class="modal guide-modal" id="libraryDialog"></dialog>
    </div>`}function Be(S,Z){const H=D(),T=vi(Z),_=H,N=S.querySelector('[data-testid="seal-slots"]');if(N){const j=["receptor-cartridge","optical-reader","signal-filter"];N.innerHTML=j.map(ge=>{const ve=Z.player.collectedModules.includes(ge),lt=V()==="en"?di[ge].en:di[ge].zh;return`<span class="${ve?"on":""}" title="${be(lt)}">${ve?"◆":"◇"}</span>`}).join("")}const k=S.querySelector('[data-testid="current-wing"]');if(k){const j=pn(Math.floor(Z.player.position.x),Math.floor(Z.player.position.y)),ge=j==="storage"?"wingStorage":j==="greenhouse"?"wingGreenhouse":j==="signal"?"wingSignal":"wingAtrium";k.textContent=_[ge]??ge}const G=S.querySelector('[data-testid="current-clue"]');if(G){const j=ab(T.id);G.textContent=_[j]||_[T.labelKey]||T.labelKey}const ne=S.querySelector('[data-testid="active-scent"]');if(ne){const j=Z.player.activeScentProfileId;ne.innerHTML=j?ui(j,V()):"",ne.hidden=!j}const re=S.querySelector('[data-testid="scent-wheel"]'),q=`${Z.player.learnedOdorIds.join(",")}|${Z.player.activeScentProfileId??""}`;re&&q!==p&&(p=q,re.innerHTML=Z.player.learnedOdorIds.map((j,ge)=>`<button type="button" class="sb-scent-btn${Z.player.activeScentProfileId===j?" is-active":""}" data-scent="${be(j)}" aria-pressed="${Z.player.activeScentProfileId===j}">${ui(j,V())}<em>${ge+1}</em></button>`).join(""));const $=S.querySelector('[data-testid="hearts"]');$&&($.innerHTML=Array.from({length:Z.player.maxHealth},(j,ge)=>`<i class="${ge<Z.player.health?"on":""}" aria-hidden="true"></i>`).join(""),$.setAttribute("aria-label",`${Z.player.health}/${Z.player.maxHealth}`));const oe=S.querySelector('[data-testid="scan-status"]');if(oe){const j=Z.player.inventory.scanCharge,ge=Z.player.scan.cooldownRemainingMs,ve=!v&&Z.elapsedMs>8e3&&Z.elapsedMs<45e3;oe.classList.toggle("is-nudge",ve),oe.textContent=Z.player.scan.active?H.scentVision:ge>0?`${H.scan} ${Math.ceil(ge/1e3)}s`:j===null?H.scanReady:`${H.scan} ${j}`}const ue=S.querySelector('[data-testid="modules"]');if(ue){const j=Z.player.collectedModules.length,ge=hs.filter(ve=>Z.player.collectedModules.includes(ve)).map(ve=>V()==="en"?di[ve].en:di[ve].zh).join(", ");ue.innerHTML=`<span class="on" title="${be(ge)}">${j}/${hs.length}</span>`,ue.setAttribute("aria-label",`${H.modulesAssembled} ${j}/${hs.length}`)}const ae=S.querySelector('[data-testid="context-prompt"]'),de=va(Z);let Ee="";de.disabledReason&&(!de.enabled||de.input==="Q")&&(Ee=ze(Z,de.disabledReason).body||We(H,de.labelKey));const Re=Le(Z);!Ee&&Re&&(Ee=Z.difficulty==="junior"?H.promptBloomJunior:Re.revealed||Z.player.scan.active?H.promptBloomAttack:H.promptBloomScan),ae&&(ae.textContent=Ee),Ie(S),le(S);const Fe=S.querySelector('[data-testid="wing-title"]'),F=pn(Math.floor(Z.player.position.x),Math.floor(Z.player.position.y)),he=ob(F);if(Fe&&he&&he!==M){const ge={storage:{title:_.wingTitleStorage??"COFFEE STORAGE",seal:_.wingSealStorage??"Storage Seal"},greenhouse:{title:_.wingTitleGreenhouse??"GREENHOUSE",seal:_.wingSealGarden??"Garden Seal"},signal:{title:_.wingTitleSignal??"SIGNAL LAB",seal:_.wingSealSignal??"Signal Seal"}}[he],ve=Fe.querySelector("strong"),lt=Fe.querySelector("span");ve&&(ve.textContent=ge.title),lt&&(lt.textContent=ge.seal),Fe.hidden=!1,Fe.classList.remove("is-out"),window.setTimeout(()=>{Fe.classList.add("is-out"),window.setTimeout(()=>{Fe.hidden=!0},280)},t.reducedMotion?200:1e3)}he?M=he:F==="atrium"&&(M="atrium");const ee=S.querySelector('[data-testid="hint-prompt"]');if(ee){const j=vi(Z);ee.dataset.hintLevel=String(c),ee.dataset.hintObjective=j.id,ee.classList.toggle("is-direct",c>=3||!!Re),c>=1||Re?(ee.hidden=!1,ee.textContent=tt(Z,Math.max(c,Re?3:0))):Ee&&!Re?ee.hidden=!0:(ee.hidden=!h,ee.textContent=H.needHint,ee.classList.remove("is-direct"))}const pe=S.querySelector("#pauseOverlay");pe&&(pe.hidden=Z.phase!=="paused");const _e=S.querySelector("#puzzleOverlay");_e&&Z.phase!=="puzzle"&&(_e.hidden=!0,g="",_e.dataset.lock="")}function We(S,Z){return S[Z]??S.promptInteract??""}function ze(S,Z){const H=D();if(!Z)return{title:"",body:""};const T=k=>{var G;return((G=or(k))==null?void 0:G.name[V()])??k.toUpperCase()};if(Z==="learned"){const k=S.lastFeedback.learnedOdorId??S.player.activeScentProfileId??"";return{title:T(k).toUpperCase(),body:H.fbLearned}}if(Z==="module-online"){const k=S.player.collectedModules[S.player.collectedModules.length-1];return{title:(k?V()==="en"?di[k].en:di[k].zh:H.fbModule).toUpperCase(),body:H.fbModule}}if(Z==="seal-restored"){const k=S.lastFeedback.sealId??S.player.restoredSealIds[S.player.restoredSealIds.length-1]??"storage",G={storage:H.sealStorage,garden:H.sealGarden,signal:H.sealSignal},ne=uu.map(re=>S.player.restoredSealIds.includes(re)?"◆":"◇").join(" ");return{title:G[k]??H.fbSealRestored,body:ne}}if(Z.endsWith("-profile-required")){const k=Z.replace(/-profile-required$/,"");return{title:"",body:{coffee:H.fbCoffeeRequired,rose:H.fbRoseRequired,mint:H.fbMintRequired,lemon:H.fbLemonRequired,pine:H.fbPineRequired,banana:H.fbBananaRequired}[k]??`${k.toUpperCase()} profile required`}}const N={"nothing-nearby":{body:H.fbNothing},"scan-surface-first":{body:H.fbScanFirst},"coffee-profile-required":{body:H.fbCoffeeRequired},"rose-profile-required":{body:H.fbRoseRequired},"mint-profile-required":{body:H.fbMintRequired},"lemon-profile-required":{body:H.fbLemonRequired},"pine-profile-required":{body:H.fbPineRequired},"banana-profile-required":{body:H.fbBananaRequired},"already-searched":{body:H.fbAlreadySearched},"already-learned":{body:H.fbAlreadyLearned},"already-open":{body:H.fbAlreadyOpen},"no-matching-pattern":{body:H.fbNoMatch},opened:{body:H.fbOpened},locked:{body:H.fbLocked},checkpoint:{body:H.fbCheckpoint},mimic:{body:H.fbMimic},"decay-reveal":{body:H.fbDecay},"secret-found":{title:H.fbSecret,body:H.fbSecret},"pile-clue":{body:H.fbPileClue},"restore-seals":{title:H.restoreSeals,body:"◆ ◇ ◇"},"seal-restored":{body:H.fbSealRestored},"thorn-open":{body:H.fbThornOpen},"decoder-offline":{body:H.fbDecoderOffline},"need-receptor":{body:H.fbNeedReceptor},"profile-selected":{body:H.fbProfileSelected},"no-scan-charge":{body:H.fbNoScan},"signal-seal-locked":{body:H.fbSignalLocked},"bloom-wrong-core":{body:H.fbBloomWrongCore},"seal-already":{body:H.fbSealAlready},"lock-open":{body:H.fbLockOpen},"skill-miss":{body:H.skillMiss},"pattern-miss":{body:H.patternMiss},"skill-hit":{body:H.skillHit},"pattern-hit":{body:H.patternHit}}[Z];return N?{title:N.title??"",body:N.body}:{title:"",body:H[Z]??Z}}function te(S){const Z=S.lastFeedback.message;if(!Z||Z==="scan"&&!S.lastFeedback.learnedOdorId&&!S.lastFeedback.openedId||Z==="skill-hit"||Z==="pattern-hit"||Z==="puzzle")return;const H=`${Z}|${S.lastFeedback.openedId??""}|${S.lastFeedback.learnedOdorId??""}|${S.lastFeedback.sealId??""}|${S.lastFeedback.unlockedPassageId??""}`;if(H===w)return;w=H;const T=ze(S,Z);!T.body&&!T.title||(m={key:Z,title:T.title,body:T.body,until:performance.now()+(Z==="learned"||Z==="seal-restored"?2e3:1600),odorId:S.lastFeedback.learnedOdorId??void 0},Z==="seal-restored"&&(b={title:T.title,marks:T.body,until:performance.now()+2200}))}function fe(S){const Z=S.lastFeedback,H=`${Z.message??""}|${Z.openedId??""}|${Z.learnedOdorId??""}|${Z.sealId??""}|${Z.unlockedPassageId??""}|${Z.playerDamaged}|${Z.hitEnemyIds.join(",")}`;if(!Z.message&&!Z.playerDamaged&&Z.hitEnemyIds.length===0||H===A)return;A=H;const T=Z.message;T==="scan"?E.play("scan",t.muted):T==="learned"?E.play("pickup",t.muted):T==="opened"||T==="module-online"?E.play("chest",t.muted):T==="secret-found"||T==="thorn-open"||T==="decay-reveal"?E.play("secret",t.muted):T==="seal-restored"?E.play("seal",t.muted):T==="skill-miss"||T==="pattern-miss"?E.play("miss",t.muted):(T==="skill-hit"||T==="pattern-hit")&&E.play("open",t.muted),(Z.playerDamaged||Z.hitEnemyIds.length)&&E.play("hit",t.muted)}function le(S){const Z=S.querySelector('[data-testid="seal-banner"]');if(Z){if(!b||performance.now()>b.until){Z.hidden=!0,Z.innerHTML="";return}Z.hidden=!1,Z.innerHTML=`<strong>${be(b.title)}</strong><span>${be(b.marks)}</span>`}}function Ie(S){const Z=S.querySelector('[data-testid="game-feedback"]');if(Z){if(!m||performance.now()>m.until){Z.hidden=!0,Z.innerHTML="",Z.classList.remove("sb-learn-card");return}if(Z.hidden=!1,m.key==="learned"){const H=m.odorId??"";Z.classList.add("sb-learn-card"),Z.innerHTML=`${H?ui(H,V()):""}<div><b>${be(m.body)}</b><span>${be(m.title)}</span></div>`;return}Z.classList.remove("sb-learn-card"),Z.innerHTML=`${m.title?`<b>${be(m.title)}</b>`:""}<span>${be(m.body)}</span><i class="sb-pattern-flash" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></i>`}}function Ne(S){S.addEventListener("click",Z=>{const H=Z.target.closest("[data-scent]");!H||!a||(a=Ro(a,H.dataset.scent??null),te(a))})}function Le(S){const Z=S.enemies.find(H=>H.kind==="noiseBloom"&&!H.defeated);return Z&&Cl(S.player.position,Z,2.2)?Z:null}function gt(S){const Z=D(),H=Kf(S),T=Math.PI*2,_=Math.round((H%T+T)%T/(Math.PI/2))%4,N=["hintEast","hintSouth","hintWest","hintNorth"];return Z[N[_]]??N[_]}const Xe={cartridge:"howHintCartridge",optical:"howHintOptical",filter:"howHintFilter",secret:"howHintSecret",leave:"howHintLeave"};function tt(S,Z){const H=D(),T=H,_=vi(S),N=T[_.labelKey]??_.labelKey,k=T[_.wingKey]??"",G=Xe[_.id],ne=T[G]||`${H.hintMarker} ${N}`;return Z>=3?`${H.hintDoThis} ${ne}`:Z>=2?`${H.hintTrail} ${k?`${k} · `:""}${N}`:`${gt(S)} ${N}`}function Qe(S,Z){var ne;const H=Z.activePuzzle,T=S.querySelector("#puzzleOverlay");if(!H||!T)return;T.hidden=!1;const _=D();if(H.kind==="skillCheck"){const re=H.indicator??0,q=(H.zoneStart??.4)*100,$=(H.zoneWidth??.2)*100;if(T.dataset.lock!==`skill:${H.id}`)T.dataset.lock=`skill:${H.id}`,T.innerHTML=`<div class="sb-puzzle-card" data-testid="scent-puzzle">
          <strong>${be(_.skillCheckTitle)}</strong>
          <p>${be(_.skillCheckHint)}</p>
          <div class="sb-skill" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(re*100)}">
            <i class="sb-skill-zone" style="left:${q}%;width:${$}%"></i>
            <i class="sb-skill-needle" style="left:${re*100}%"></i>
          </div>
          <p class="sb-skill-hits">${be(_.skillHits)} ${H.hits??0}/${H.needed??2}</p>
        </div>`;else{const oe=T.querySelector(".sb-skill-needle"),ue=T.querySelector(".sb-skill-hits");oe&&(oe.style.left=`${re*100}%`),ue&&(ue.textContent=`${_.skillHits} ${H.hits??0}/${H.needed??2}`)}return}if(H.kind==="patternMemory"){const re=Z.elapsedMs<(H.revealUntilMs??0),q=`pattern:${H.id}:${re}:${((ne=H.input)==null?void 0:ne.length)??0}:${Z.lastFeedback.message}`;if(q===g&&!T.hidden)return;g=q;const $=H.sequence??[],oe=re?$.map(ue=>`<span class="sb-seq">${ui(ue,V())}</span>`).join(""):$.map((ue,ae)=>{var de;return`<span class="sb-seq ${(((de=H.input)==null?void 0:de.length)??0)>ae?"on":""}">◆</span>`}).join("");T.innerHTML=`<div class="sb-puzzle-card" data-testid="scent-puzzle">
        <strong>${be(_.patternTitle)}</strong>
        <p>${be(re?_.patternWatch:_.patternRepeat)}</p>
        <div class="sb-seq-row">${oe}</div>
        ${re?"":`<div class="sb-choices">${H.choices.map(ue=>{var ae;return`<button type="button" data-choice="${be(ue)}">${ui(ue,V())}<span>${be(((ae=or(ue))==null?void 0:ae.name[V()])??ue)}</span></button>`}).join("")}</div>`}
        <p class="sb-wrong" data-testid="puzzle-feedback">${Z.lastFeedback.message==="pattern-miss"?be(_.patternMiss):""}</p>
      </div>`,T.querySelectorAll("[data-choice]").forEach(ue=>{ue.onclick=()=>{a&&(a=Ec(a,ue.dataset.choice??""),a.phase==="puzzle"&&Qe(S,a))}});return}const N=`${H.id}:${Z.lastFeedback.message}:${H.kind}`;if(N===g&&!T.hidden)return;g=N;const k=H.kind==="exit",G=hs.map(re=>{const q=Z.player.collectedModules.includes(re),$=V()==="en"?di[re].en:di[re].zh;return`<li class="${q?"on":""}">${be($)} ${q?"✓":"○"}</li>`}).join("");T.innerHTML=`<div class="sb-puzzle-card" data-testid="scent-puzzle">
      ${k?`<ul class="sb-module-check">${G}</ul>`:""}
      <strong>${be(k?_.exitPuzzle:_.lockPuzzle)}</strong>
      <p>${be(_.puzzleHint)}</p>
      <div class="sb-choices">${H.choices.map(re=>{var q;return`<button type="button" data-choice="${be(re)}">${ui(re,V())}<span>${be(((q=or(re))==null?void 0:q.name[V()])??re)}</span></button>`}).join("")}</div>
      <p class="sb-wrong" data-testid="puzzle-feedback">${Z.lastFeedback.message==="wrong-scent"?be(_.wrongScent):""}</p>
    </div>`,T.querySelectorAll("[data-choice]").forEach(re=>{re.onclick=()=>{a&&(a=Ec(a,re.dataset.choice??""),a.phase==="puzzle"&&Qe(S,a))}})}function Je(){c=Math.min(3,c+1),h=!1,u=(a==null?void 0:a.elapsedMs)??0,a&&c>=2&&(a={...a,enemies:a.enemies.map(S=>S.kind==="noiseBloom"&&!S.defeated?{...S,revealed:!0}:S)})}function yt(){const S=a;if(!S)return;const Z=D(),H=document.querySelector("#libraryDialog")??e.querySelector("#libraryDialog"),T=e.querySelector("#libraryDialog"),_=H??T;if(!_)return;const N=S.player.learnedOdorIds;_.innerHTML=`<div class="modal-header"><div><span class="section-label">${be(Z.library)}</span><h2>${be(Z.libraryTitle)}</h2></div>
      <button class="close-button" type="button" data-close-lib aria-label="${be(U().close)}">×</button></div>
      <div class="sb-lib">${N.length===0?`<p>${be(Z.libraryEmpty)}</p>`:N.map(G=>{const ne=or(G);return`<button type="button" data-lib="${be(G)}">${ui(G,V())}<strong>${be((ne==null?void 0:ne.name[V()])??G)}</strong></button>`}).join("")}</div>
      <div class="sb-lib-detail" id="libDetail"></div>
      <button class="primary-button full-button" type="button" data-close-lib>${be(U().close)}</button>`;const k=G=>{f=G;const ne=or(G),q=((ne==null?void 0:ne.featureVector)??[]).map((oe,ue)=>`<i style="height:${Math.round(oe*100)}%" title="R${ue+1}"></i>`).join(""),$=_.querySelector("#libDetail");$&&($.innerHTML=`${ui(G,V())}<div><h3>${be((ne==null?void 0:ne.name[V()])??G)}</h3>
          <p>${be(Z.librarySentence)}</p>
          <div class="sb-pattern" aria-hidden="true">${q}</div>
          <p class="sb-deep">${be(Z.libraryDeeper)}</p></div>`)};_.querySelectorAll("[data-lib]").forEach(G=>{G.onclick=()=>k(G.dataset.lib??"")}),_.querySelectorAll("[data-close-lib]").forEach(G=>G.addEventListener("click",()=>_.close())),N[0]&&k(f&&N.includes(f)?f:N[0]),_.showModal()}function Tt(S){var oe,ue,ae;Mt(),(oe=C==null?void 0:C.dispose)==null||oe.call(C),C=null;const Z=e.querySelector("#playArea"),H=e.querySelector(".game-card");if(H==null||H.classList.remove("maze-live"),!(Z instanceof HTMLElement))return;const T=D(),_=U(),N=op(S),k=`${S.player.learnedOdorIds.length}/${af(S.difficulty).length}`,G=Yf(S),ne=["receptor-cartridge","optical-reader","signal-filter"],q=`${ne.filter(de=>S.player.collectedModules.includes(de)).length}/${ne.length}`,$=`${Math.floor(S.elapsedMs/6e4)}:${String(Math.floor(S.elapsedMs/1e3%60)).padStart(2,"0")}`;t=lf(t,S.seed,N.total),t={...t,tutorialCompleted:!0,lastSeed:S.seed},J(),Z.innerHTML=Bh({testId:"debrief",kicker:"GAME 02",title:T.cleared,titleTestId:"result-title",metrics:[{value:$,label:T.time,testId:"stat-time"},{value:k,label:T.scentsLearned,testId:"stat-scents"},{value:G.found+"/"+G.total,label:T.secretsFound,testId:"stat-secrets"},{value:q,label:T.modulesAssembled,testId:"stat-modules"}],discoveredTitle:T.discoveredTitle,discoveredBody:T.discoveredBody,actionsHtml:`<button class="primary-button" id="replay" type="button">${be(T.replay)}</button>
        <button class="ghost-button" id="backSetup" type="button">${be(T.backSetup)}</button>`,technicalSummary:_.technicalDetails,technicalHtml:`<p>seed ${be(S.seed)}</p><p>game ${of}</p><p>score ${N.total}</p>`}),(ue=Z.querySelector("#replay"))==null||ue.addEventListener("click",se),(ae=Z.querySelector("#backSetup"))==null||ae.addEventListener("click",z)}function Mt(){o&&cancelAnimationFrame(o),o=0,y.detach()}I(),z(),lp(e),(_t=document.querySelector("#guideButton"))==null||_t.addEventListener("click",()=>La("guideDialog")),(xt=document.querySelector("#scienceButton"))==null||xt.addEventListener("click",()=>{Hh(Vh(Wh(),"labyrinth")),La("scienceDialog")});const It=Dh(()=>La("scienceDialog"));return{destroy(){var S;Mt(),P&&window.removeEventListener("resize",P),(S=C==null?void 0:C.dispose)==null||S.call(C),C=null,It()}}}const Th=document.querySelector("#app");if(!(Th instanceof HTMLElement))throw new Error("#app missing");const Sl=Th,kb=Ks(Xh()),$s=qh(Sl,{homeHref:"../../index.html",actionsHtml:zh(kb.gameUi.howToPlay),onLocaleChange:(n,e)=>{const t=Sl.querySelector("#guideButton");t&&(t.innerHTML=`<span>?</span> ${e.gameUi.howToPlay}`);try{const i=hu(localStorage.getItem(ia));localStorage.setItem(ia,JSON.stringify({...i,locale:n}))}catch{}na==null||na(),Eh()}});let na;function Eh(){const n=$h(Sl),e=$s.getLocale(),t=Ks(e);document.title=e==="en"?"AeroSense: Scentbound Labyrinth":t.scentbound.title,n.innerHTML=`
    <div class="sb-shell" data-testid="scentbound-shell">
      <section class="intro">
        <div class="eyebrow" id="introEyebrow"><span></span> GAME 02</div>
        <h1 id="introTitle"></h1>
        <p id="introLead"></p>
        <div class="intro-chips" id="introChips" aria-label="Game facts"></div>
      </section>
      <section class="lab" aria-label="${t.scentbound.title}">
        <div class="level-header">
          <div>
            <span class="section-label">GAME 02</span>
            <h2 id="chooseRun"></h2>
          </div>
          <div class="lab-actions">
            ${Gh({id:"scienceButton",label:t.gameUi.science})}
          </div>
        </div>
        <div class="game-card">
          <aside class="control-panel" id="settingsPanel"></aside>
          <section class="play-area" id="playArea" aria-live="polite"></section>
        </div>
      </section>
      <dialog id="guideDialog" class="modal guide-modal">
        <div class="modal-header">
          <div>
            <span class="section-label">${t.gameUi.howToPlay}</span>
            <h2>${t.scentbound.howTitle}</h2>
          </div>
          <button class="close-button" data-close="guideDialog" type="button" aria-label="${t.gameUi.close}">×</button>
        </div>
        <div id="howBody"></div>
        <button class="primary-button full-button" data-close="guideDialog" type="button">${t.gameUi.close}</button>
      </dialog>
      <dialog id="scienceDialog" class="modal guide-modal">
        <div class="modal-header">
          <div>
            <span class="section-label">${t.gameUi.science}</span>
            <h2>${t.scentbound.scienceTitle}</h2>
          </div>
          <button class="close-button" data-close="scienceDialog" type="button" aria-label="${t.gameUi.close}">×</button>
        </div>
        <div id="scienceBody"></div>
        <button class="primary-button full-button" data-close="scienceDialog" type="button">${t.gameUi.close}</button>
      </dialog>
    </div>`,na=Ob({root:n,getCopy:()=>Ks($s.getLocale()).scentbound,getUi:()=>Ks($s.getLocale()).gameUi,getLocale:()=>$s.getLocale()}).destroy}Eh();
