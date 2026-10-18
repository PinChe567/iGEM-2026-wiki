import{s as De,S as Be,a as Ue,b as qt,d as Ve}from"./index-Dufxn7um.js";import{c as _e,g as vt,m as Ge,l as Fe,a as Je,r as Ke,d as We,s as Qe,h as Ye,t as Xe}from"./science-hash-wXUSeQse.js";import{i as dt,s as Ze,a as Ht,b as zt,c as tn,p as $t,d as en,e as ie,f as re,m as nn,g as sn}from"./study-ui-k0uM9ZOk.js";import{a as ce,b as le,c as de,t as an,r as on,m as rn,s as cn}from"./mount-D3otGpym.js";import{g as R,p as ue,a as Ct,S as Mt,r as ln,b as dn}from"./storage-BgjRJnVt.js";import{c as Rt,s as un}from"./rng-BTVd-NHf.js";const pn=12,Ot="1.2.0",mt="2.1.0",X={ruleVersion:mt,channelCount:pn,saturationK:1.8,noise:{kind:"uniformSymmetric",amplitude:.03},signalRoundingDecimals:6,weightNormalization:"percentOver100",fitMetric:{kind:"normalizedRmse",rmseScale:1}};function mn(e,n){return e<n?-1:e>n?1:0}function Dt(e){return{components:[...e].sort((o,i)=>mn(o.odorId,i.odorId)).map(o=>({odorId:o.odorId,percent:o.percent}))}}function at(e){return e.components.map(n=>`${n.odorId}:${n.percent}`).join("|")}function fn(e,n){return at(e)===at(n)}function St(e,n){if(e.length===0)return{ok:!1,error:"empty"};const o=n==null?void 0:n.componentCountMin,i=n==null?void 0:n.componentCountMax;if(o!==void 0&&e.length<o)return{ok:!1,error:"component_count"};if(i!==void 0&&e.length>i)return{ok:!1,error:"component_count"};const r=new Set;let l=0;for(const d of e){if(r.has(d.odorId))return{ok:!1,error:"duplicate_odor"};if(r.add(d.odorId),!Number.isInteger(d.percent))return{ok:!1,error:"non_integer_percent"};if(d.percent<0||d.percent>100)return{ok:!1,error:"percent_out_of_range"};if((n==null?void 0:n.minPercent)!==void 0&&d.percent<n.minPercent)return{ok:!1,error:"below_min_percent"};if((n==null?void 0:n.percentStep)!==void 0&&d.percent%n.percentStep!==0)return{ok:!1,error:"not_on_step"};l+=d.percent}return l!==100?{ok:!1,error:"sum_not_100"}:{ok:!0,canonical:Dt(e)}}function hn(e,n,o,i){const r=[];function l(d,c,S){if(d===1){c>=i&&c<=100&&c%o===0&&r.push([...S,c]);return}for(let p=i;p<=c-i*(d-1);p+=o)S.push(p),l(d-1,c-p,S),S.pop()}return l(e,n,[]),r}function gn(e,n){const o=[],i=e.length;if(n<0||n>i)return o;const r=Array.from({length:n},(l,d)=>d);for(;;){o.push(r.map(d=>e[d]));let l=n-1;for(;l>=0&&r[l]===i-n+l;)l-=1;if(l<0)break;r[l]+=1;for(let d=l+1;d<n;d+=1)r[d]=r[d-1]+1}return o}function bn(e,n){if(n.weightNormalization!=="percentOver100")throw new Error(`Unsupported weightNormalization: ${n.weightNormalization}`);return e/100}function yn(e,n){if(!Number.isFinite(e))return e;const o=10**n;return Math.round(e*o)/o}function vn(e){return e<0?0:e>1?1:e}function Bt(e,n){return e.map(o=>yn(o,n))}function be(e,n,o=X){const i=Array.from({length:o.channelCount},()=>0);for(const r of e.components){const l=n.get(r.odorId);if(!l)throw new Error(`Missing signature for odor ${r.odorId}`);if(l.length!==o.channelCount)throw new Error(`Signature ${r.odorId} length ${l.length} != ${o.channelCount}`);const d=bn(r.percent,o);for(let c=0;c<o.channelCount;c+=1)i[c]+=d*l[c]}return Bt(i,o.signalRoundingDecimals)}function $n(e,n=X){const o=n.saturationK;return Bt(e.map(i=>1-Math.exp(-o*i)),n.signalRoundingDecimals)}function Sn(e,n,o=X){if(o.noise.kind!=="uniformSymmetric")throw new Error(`Unsupported noise kind: ${o.noise.kind}`);const i=Rt(`spectrum-noise:${o.ruleVersion}:${n}`),r=o.noise.amplitude;return Bt(e.map(l=>vn(l+(i()*2-1)*r)),o.signalRoundingDecimals)}function It(e,n,o,i,r=X){const l=be(e,n,r);if(o==="linear")return{linear:l,saturated:null,observed:[...l]};const d=$n(l,r);if(o==="saturated")return{linear:l,saturated:d,observed:[...d]};const c=Sn(d,i,r);return{linear:l,saturated:d,observed:c}}function xn(e,n){for(const o of e.components)if(o.odorId===n)return o.percent;return 0}function ye(e,n,o){let i=0,r=0;for(const l of n.components){const d=l.percent,c=xn(e,l.odorId);d===c?i+=1:c>0&&(r+=1)}return{a:i,b:r}}function Cn(e,n){return e.a===n&&e.b===0}function Ut(e,n,o=X){if(o.fitMetric.kind!=="normalizedRmse")throw new Error(`Unsupported fit metric: ${o.fitMetric.kind}`);const i=Math.min(e.length,n.length,o.channelCount);if(i===0)return 0;let r=0;for(let S=0;S<i;S+=1){const p=(e[S]??0)-(n[S]??0);r+=p*p}const l=Math.sqrt(r/i),d=o.fitMetric.rmseScale;if(!(d>0)||!Number.isFinite(l))return 0;const c=100*(1-l/d);return Number.isFinite(c)?Math.max(0,Math.min(100,Math.round(c))):0}function ve(e){const{odorIds:n,preset:o}=e;if(n.length<o.odorCount)throw new Error(`Need at least ${o.odorCount} odors for ${o.id}, got ${n.length}`);const i=n.slice(0,o.odorCount),r=[],l=new Set;for(let d=o.componentCountMin;d<=o.componentCountMax;d+=1){const c=hn(d,100,o.percentStep,o.minPercent),S=gn(i,d);for(const p of S)for(const B of c){const f=p.map((H,I)=>({odorId:H,percent:B[I]})),x=Dt(f),k=at(x);l.has(k)||(l.add(k),r.push(x))}}return r.sort((d,c)=>{const S=at(d),p=at(c);return S<p?-1:S>p?1:0}),r}function Mn(e,n,o,i=X.ruleVersion){if(n<1||e.length<n)throw new Error(`Need at least ${n} odors to build a pool of ${n}, got ${e.length}`);return un(e,`spectrum-pool:${i}:${o}`).slice(0,n)}function kn(e,n,o=X.ruleVersion){if(e.length===0)throw new Error("No legal mixtures to pick from");const i=Rt(`spectrum-truth:${o}:${n}`),r=Math.floor(i()*e.length);return e[r]}function In(e){const n=e.rules??X,o=R(e.difficulty),i=Mn(e.odorIds,o.odorCount,e.seed,n.ruleVersion),r=ve({odorIds:i,preset:o}),l=kn(r,e.seed,n.ruleVersion),d=It(l,e.signatures,o.mixingModel,e.seed,n);return{seed:e.seed,ruleVersion:n.ruleVersion,contentVersion:e.contentVersion,difficulty:e.difficulty,poolIds:i,truth:l,observedSignal:d.observed,linearSignal:d.linear,saturatedSignal:d.saturated,legalMixtureCount:r.length}}function Ln(e,n){const o=n.rules??X,{history:i}=n;return e.filter(r=>{for(const l of i){const d=ye(l.guess,r);if(d.a!==l.ab.a||d.b!==l.ab.b)return!1}if(n.fitTolerance!==void 0&&n.observedSignal&&n.signatures&&n.difficulty&&n.seed!==void 0){const l=R(n.difficulty),d=It(r,n.signatures,l.mixingModel,n.seed,o);if(Ut(n.observedSignal,d.observed,o)<100-n.fitTolerance)return!1}return!0})}function $e(e,n=mt){return`${e}|${n}`}function ut(e=Date.now()){const n=Rt(`spectrum-practice-${e}`),o=()=>Math.floor(n()*1e9).toString(36),i=Math.floor(Math.random()*1e9).toString(36);return`sp-${o()}-${i}`}function Tn(e,n=Ot){return`sd-${e}-v${n}`}function wn(e=new Date){return e.toISOString().slice(0,10)}function Se(e){R(e.difficulty);const n=In({seed:e.seed,difficulty:e.difficulty,signatures:e.signatures,odorIds:e.odorIds,contentVersion:e.contentVersion});return{meta:{seed:e.seed,mode:e.mode,difficulty:e.difficulty,ruleVersion:mt,contentVersion:e.contentVersion,gameVersion:Ot,scoreKey:$e(e.difficulty),dateUTC:e.dateUTC},puzzle:n}}function En(e){return Se({seed:e.seed??ut(),mode:"practice",difficulty:e.difficulty,signatures:e.signatures,odorIds:e.odorIds,contentVersion:e.contentVersion})}function An(e){const n=e.dateUTC??wn();return Se({seed:Tn(n),mode:"daily",difficulty:e.difficulty,signatures:e.signatures,odorIds:e.odorIds,contentVersion:e.contentVersion,dateUTC:n})}const qn=400;function Hn(e){const n=e.ruleVersion??mt,i=R(e.difficulty).maxGuesses,r=Math.max(0,Math.min(i,Math.round(e.guessesUsed))),l=Math.max(0,Math.round(e.elapsedMs)),d=$e(e.difficulty,n),c=Math.max(0,Math.min(3,Math.round(e.hintsUsed??0)));if(!e.solved)return{solved:!1,guessesUsed:r,maxGuesses:i,elapsedMs:l,difficulty:e.difficulty,ruleVersion:n,scoreKey:d,guessScore:0,timeScore:0,totalScore:0};const p=5e3+Math.max(0,i-r)*1e3,B=l/1e3,f=e.difficulty==="junior"?0:Math.max(0,Math.round(2e3*Math.max(0,1-Math.max(0,B-30)/150))),x=e.difficulty==="hard"?0:qn*c,k=Math.max(0,p+f-x);return{solved:!0,guessesUsed:r,maxGuesses:i,elapsedMs:l,difficulty:e.difficulty,ruleVersion:n,scoreKey:d,guessScore:p,timeScore:f,totalScore:k}}function zn(e){const n=Math.max(0,Math.floor(e/1e3)),o=Math.floor(n/60),i=n%60;return`${o}:${String(i).padStart(2,"0")}`}function pe(e){const n=new Set;for(const o of e)for(const i of o.components)n.add(i.odorId);return[...n].sort()}function Pn(e){if(e.length===0)return null;const n=new Map;for(const r of e)for(const l of r.components)n.set(l.odorId,(n.get(l.odorId)??0)+1);let o=null,i=-1;for(const[r,l]of n)(l>i||l===i&&(o===null||r<o))&&(o=r,i=l);return o?{odorId:o,inAll:i===e.length}:null}function me(e){const n=e.limit??3;if(e.surviving.length===0)return[];const o=R(e.difficulty),i=new Set(e.surviving.map(at));return e.surviving.map(l=>{const d=It(l,e.signatures,o.mixingModel,e.seed).observed;return{mix:l,fit:Ut(e.observedSignal,d),key:at(l)}}).filter(l=>i.has(l.key)).sort((l,d)=>d.fit-l.fit||(l.key<d.key?-1:l.key>d.key?1:0)).slice(0,n).map(l=>l.mix)}function fe(e,n){const o=R(n),i=St(e.components,{minPercent:o.minPercent,percentStep:o.percentStep,componentCountMin:o.componentCountMin,componentCountMax:o.componentCountMax});return i.ok?i.canonical:null}const et=12,E={l:40,r:10,t:10,b:28};function pt(e,n,o=E.l){return o+(e+.5)/et*n}function he(e,n,o,i,r=E.l){const l=n/et,d=Math.max(4,l*.62),c=Math.max(0,Math.min(1,i)),S=Math.max(1,c*o);return{x:r+e*l+(l-d)/2,y:E.t+o-S,w:d,h:S}}function jn(e){const n=window.devicePixelRatio||1,o=e.clientWidth||640,i=e.clientHeight||240;e.width=Math.floor(o*n),e.height=Math.floor(i*n);const r=e.getContext("2d");return r?(r.setTransform(n,0,0,n,0,0),r.clearRect(0,0,o,i),{ctx:r,w:o,h:i}):null}function Nn(e,n,o,i,r,l,d=!1){const c=n-E.l-E.r,S=o-E.t-E.b;if(e.strokeStyle=l?"rgba(0,0,0,0.55)":"rgba(255,255,255,0.18)",e.fillStyle=l?"rgba(0,0,0,0.7)":"rgba(255,255,255,0.55)",e.lineWidth=1,e.beginPath(),e.moveTo(E.l,E.t),e.lineTo(E.l,E.t+S),e.lineTo(E.l+c,E.t+S),e.stroke(),e.font=d?"12px ui-sans-serif, system-ui, sans-serif":"11px ui-monospace, monospace",e.textAlign="center",!d)for(let p=0;p<et;p+=1)e.fillText(String(p),pt(p,c),o-10);e.fillText(i,E.l+c/2,o-(d?10:2)),e.save(),e.translate(14,E.t+S/2),e.rotate(-Math.PI/2),e.textAlign="center",e.fillText(r,0,0),e.restore()}function Y(e,n){var p,B,f;const o=jn(e);if(!o)return;const{ctx:i,w:r,h:l}=o,d=!!n.highContrast,c=r-E.l-E.r,S=l-E.t-E.b;if(Nn(i,r,l,n.xLabel,n.yLabel,d,!!n.simple),n.bars){i.fillStyle=n.bars.color,i.globalAlpha=.35;for(let x=0;x<et;x+=1){const k=he(x,c,S,n.bars.values[x]??0);i.fillRect(k.x,k.y,k.w,k.h)}i.globalAlpha=1}if((p=n.emphasizeIndices)!=null&&p.length){i.strokeStyle=n.emphasizeColor??"#ee7b66",i.lineWidth=d?3:2.4,i.globalAlpha=.95;for(const x of n.emphasizeIndices){const k=he(x,c,S,Math.max(((B=n.bars)==null?void 0:B.values[x])??((f=n.curves[0])==null?void 0:f.values[x])??.15,.12));i.strokeRect(k.x-1,k.y-2,k.w+2,k.h+4)}i.globalAlpha=1}if(n.residualAgainst){const{target:x,guess:k,color:H}=n.residualAgainst;i.fillStyle=H,i.globalAlpha=.22,i.beginPath();for(let I=0;I<et;I+=1){const j=pt(I,c),_=E.t+S-Math.max(0,Math.min(1,x[I]??0))*S;I===0?i.moveTo(j,_):i.lineTo(j,_)}for(let I=et-1;I>=0;I-=1){const j=pt(I,c),_=E.t+S-Math.max(0,Math.min(1,k[I]??0))*S;i.lineTo(j,_)}i.closePath(),i.fill(),i.globalAlpha=1}for(const x of n.curves){i.strokeStyle=x.color,i.lineWidth=d?2.5:2,i.beginPath();for(let k=0;k<et;k+=1){const H=pt(k,c),I=E.t+S-Math.max(0,Math.min(1,x.values[k]??0))*S;k===0?i.moveTo(H,I):i.lineTo(H,I)}if(i.stroke(),n.showDots!==!1){i.fillStyle=x.color;for(let k=0;k<et;k+=1){const H=pt(k,c),I=E.t+S-Math.max(0,Math.min(1,x.values[k]??0))*S;i.beginPath(),i.arc(H,I,n.reducedMotion?2.5:3.2,0,Math.PI*2),i.fill()}}}}function Rn(e,n,o=!1,i){Y(e,{bars:{values:n,color:o?"#444":"#5ec4d1"},curves:[{values:n,color:o?"#111":"#c4a35a"}],xLabel:(i==null?void 0:i.xLabel)??"",yLabel:(i==null?void 0:i.yLabel)??"",highContrast:o,simple:(i==null?void 0:i.simple)??!0})}function Pt(e,n,o=!1){if(o)return n==="zh-Hant"?"看圖樣的山峰與谷底——這些是受體反應通道，不是光譜。":"Look at the peaks and valleys. These are receptor-response channels, not a light spectrum.";const i=e.map((r,l)=>({v:r,i:l})).sort((r,l)=>l.v-r.v).slice(0,3).map(r=>`#${r.i}=${r.v.toFixed(2)}`);return n==="zh-Hant"?`十二通道相對反應；較高：${i.join(", ")}。連線僅為閱讀輔助，不是時間波。`:`Twelve-channel relative responses; peaks: ${i.join(", ")}. The polyline aids reading — it is not a time wave.`}const F=De(),jt=[...Be];function On(){try{return Ct(localStorage.getItem(Mt))}catch{return Ct(null)}}function J(e){try{localStorage.setItem(Mt,JSON.stringify(e))}catch{}}function xe(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")}const Dn=["banana","lemon","rose","coffee","mint","strawberry","chocolate","lavender","orange","cinnamon","apple","vanilla","bread","pine","popcorn","peach"];function Bn(e,n){const o=Dn.indexOf(e);return`<span class="sp-odor-icon" style="background-position:${o>=0?`${o%5*25}% ${Math.floor(o/5)*(100/3)}%`:"0 0"}" role="img" aria-label="${xe(n)}"></span>`}function Un(e,n,o=.1){const i=[];for(let r=0;r<Math.max(e.length,n.length);r+=1)Math.abs((e[r]??0)-(n[r]??0))>=o&&i.push(r);return i}function P(e,n){const o=Ve(e);return o?o.name[n]:e}function Nt(e,n){return e.components.map(o=>`${P(o.odorId,n)} ${o.percent}%`).join(" + ")}function Vn(e){var Zt,te,ee;const n=document.querySelector("#playArea"),o=document.querySelector("#settingsPanel"),i=document.querySelector("#modeTabs");if(!n||!o||!i)throw new Error("spectrum DOM missing");const r=n,l=o,d=i;let c=On(),S="practice",p=ue(c.lastDifficulty),B=ut(),f=null,x=[],k=0,H="ready",I=0,j=[],_=[],K=[],Z=new Set,U="",T=null,ot=!1,q=0,A=[],z="50-50",O=null,Vt=!1,ct=!1,nt=!1,st=0;Tt(c),document.querySelectorAll("[data-close]").forEach(t=>{t.addEventListener("click",()=>{const s=t.dataset.close,a=s?document.querySelector(`#${s}`):null;a==null||a.close()})}),(Zt=document.querySelector("#scienceButton"))==null||Zt.addEventListener("click",()=>{var t;ce(le(de(),"spectrum")),_t(),(t=document.querySelector("#scienceDialog"))==null||t.showModal()}),_e(()=>{var t;ce(le(de(),"spectrum")),_t(),(t=document.querySelector("#scienceDialog"))==null||t.showModal()}),(te=document.querySelector("#guideButton"))==null||te.addEventListener("click",()=>{var t;Ce(),(t=document.querySelector("#guideDialog"))==null||t.showModal()}),window.addEventListener("keydown",t=>{t.key==="Escape"&&document.querySelectorAll("dialog[open]").forEach(s=>s.close())});function W(){return e.getCopy().spectrum}function w(){return e.getLocale()}function Lt(){const t=W(),s=e.getCopy().gameUi,a=document.querySelector("[data-sp-lead]"),u=document.querySelector("[data-sp-heading]"),g=document.querySelector("[data-sp-science]"),v=document.querySelector("#sp-title"),C=document.querySelector("[data-sp-label]"),M=document.querySelector("#introEyebrow"),$=document.querySelector("#introChips");v&&(v.innerHTML=w()==="en"?"Scent <em>Mixer</em>":t.titleShort),C&&(C.textContent=vt("03")),M&&(M.innerHTML=`<span></span> ${vt("03")}`),document.title=t.title,a&&(a.textContent=t.lead),u&&(u.textContent=t.chooseRun),g&&(g.textContent=s.science),$&&($.innerHTML=`<span><b>${t.diffJunior}</b></span><span><b>${t.diffEasy}</b></span><span><b>${t.diffHard}</b></span>`),document.querySelectorAll("[data-sp-close]").forEach(m=>{m.textContent=s.close})}function _t(){const t=W(),s=document.querySelector("[data-science-title]"),a=document.querySelector("[data-science-body]");s&&(s.textContent=t.scienceTitle),a&&(a.innerHTML=`<p>${t.scienceBody}</p><p class="sp-disclaimer">${Ue.modelDisclaimer[w()]}</p>`)}function Ce(){const t=W(),s=document.querySelector("[data-guide-title]"),a=document.querySelector("[data-guide-body]");s&&(s.textContent=t.guideTitle),a&&(a.innerHTML=`<div class="how-cards" data-testid="how-cards">
        <article><span>01</span><b>${t.how1Title}</b><p>${t.how1Body}</p></article>
        <article><span>02</span><b>${t.how2Title}</b><p>${t.how2Body}</p></article>
        <article><span>03</span><b>${t.how3Title}</b><p>${t.how3Body}</p></article>
      </div>`)}function Tt(t){document.documentElement.classList.toggle("high-contrast",t.highContrast),document.documentElement.classList.toggle("reduced-motion",t.reducedMotion),window.matchMedia("(prefers-reduced-motion: reduce)").matches&&document.documentElement.classList.add("reduced-motion")}function Me(){return H==="tutorial"||H==="play"||H==="result"}function Gt(){f=null,x=[],T=null,ot=!1,ct=!1,nt=!1,st&&window.clearTimeout(st),q=0,A=[],z="50-50",U=""}function Ft(t){const s=Me()&&t;s&&Gt(),ft(),it(),Lt(),(s||H==="ready")&&ht()}function ft(){const t=W();d.innerHTML=Ge({ariaLabel:t.chooseRun,selectedId:S,wrap:!1,tabs:[{id:"practice",label:t.practice},{id:"daily",label:t.daily}]}),d.querySelectorAll("[data-mode]").forEach(s=>{s.addEventListener("click",()=>{const a=s.dataset.mode,u=a!==S;S=a,Ft(u)})})}function it(){var v,C,M,$,m,b;const t=W(),s=c.bestByScoreKey[`${p}|${mt}`]??0,a=R(p),u=l.querySelector("#advanced");u&&(u.ontoggle=null),l.innerHTML=`
      <h3>${t.chooseRun}</h3>
      ${Fe({label:t.difficulty,selectedId:p,cards:[{id:"junior",index:"01",label:t.diffJunior,blurb:t.diffJuniorHint,testId:"level-junior"},{id:"easy",index:"02",label:t.diffEasy,blurb:t.diffEasyHint,testId:"level-easy"},{id:"hard",index:"03",label:t.diffHard,blurb:t.diffHardHint,testId:"level-hard"}]})}
      ${Je({summary:t.advanced,open:Vt,body:`
          ${S==="practice"?`<div class="seed-row"><label>${t.seed} <input id="seedInput" data-testid="seed" type="text" value="${B}" spellcheck="false" autocomplete="off" /></label><button type="button" class="secondary-button" id="randomSeed">${t.randomizeSeed}</button></div>`:`<p class="illustrative-note" data-testid="daily-note">${t.dailyNote}</p>`}
          <p class="illustrative-note">${t.best}: <strong data-testid="best-score">${s}</strong> (${t.scoreScope})</p>
          <ul class="sp-preset-facts">
            <li>${t.factOdors}: ${a.odorCount}</li>
            <li>${t.factComponents}: ${a.componentCountMin}${a.componentCountMin!==a.componentCountMax?`–${a.componentCountMax}`:""}</li>
            <li>${t.factStep}: ${a.percentStep}%</li>
            <li>${t.factGuesses}: ${a.maxGuesses}</li>
            <li>${t.factModel}: ${a.mixingModel}</li>
          </ul>
          <div class="preference-row">
            <label><input type="checkbox" id="reducedMotion" ${c.reducedMotion?"checked":""} /> ${t.reducedMotion}</label>
            <label><input type="checkbox" id="highContrast" ${c.highContrast?"checked":""} /> ${e.getCopy().shell.highContrast}</label>
          </div>
          <button type="button" class="text-button" id="clearData">${t.clearData}</button>
          <button type="button" class="text-button" id="replayTutorialBtn">${t.replayTutorial}</button>
        `})}
    `,l.querySelectorAll("[data-level]").forEach(y=>{y.addEventListener("click",()=>{const h=ue(y.dataset.level),L=h!==p;p=h,c={...c,lastDifficulty:p},J(c),Ft(L)})}),(v=l.querySelector("#seedInput"))==null||v.addEventListener("change",y=>{B=y.target.value.trim()||ut()}),(C=l.querySelector("#randomSeed"))==null||C.addEventListener("click",()=>{B=ut(),it()}),(M=l.querySelector("#reducedMotion"))==null||M.addEventListener("change",y=>{c={...c,reducedMotion:y.target.checked},J(c),Tt(c)}),($=l.querySelector("#highContrast"))==null||$.addEventListener("change",y=>{c={...c,highContrast:y.target.checked},J(c),Tt(c)}),(m=l.querySelector("#clearData"))==null||m.addEventListener("click",()=>{c=Ct(null),J(c),it()}),(b=l.querySelector("#replayTutorialBtn"))==null||b.addEventListener("click",()=>{c={...c,tutorialSeen:!1},J(c),Wt()});const g=l.querySelector("#advanced");g&&(g.ontoggle=y=>{Vt=y.target.open})}function ht(){var g;H="ready";const t=W(),s=e.getCopy().gameUi,a=S==="daily"?t.daily:t.practice,u=p==="junior"?t.diffJunior:p==="easy"?t.diffEasy:t.diffHard;r.innerHTML=`${dt()?Ze(e.getCopy().study)+Ht(e.getCopy().study):""}${Ke({kicker:vt("03",`${a} · ${u}`),title:t.titleShort,lead:t.readyLead,startId:"start",startTestId:"start",startLabel:s.startGame})}`,(g=r.querySelector("#start"))==null||g.addEventListener("click",Jt),dt()&&zt(r)}function Jt(){const t=document.querySelector("#seedInput");S==="practice"&&t&&(B=t.value.trim()||ut());const s=()=>{f=S==="daily"?An({difficulty:p,signatures:F,odorIds:jt,contentVersion:qt}):En({difficulty:p,signatures:F,odorIds:jt,contentVersion:qt,seed:B}),c=ln(c,f.meta.seed),J(c),x=[],T=null,ot=!1,ct=!1,nt=!1,st&&window.clearTimeout(st),q=0,A=[],z="50-50",k=Date.now(),_=[],c={...c,lastDifficulty:p},J(c),ke(f.puzzle.poolIds),wt(),c.tutorialSeen?Et():Wt()};if(!dt()){s();return}const a=e.getCopy().study,u=w();O=tn({gameId:"spectrum",gameVersion:Ot,contentVersion:qt,locale:u,selectedDifficulty:p}),$t(O);const g=en("spectrum");r.innerHTML=ie({title:a.preTitle,lead:a.preLead,items:g,locale:u,copy:a,submitLabel:a.continue}),re(r,{items:g,session:O,phaseFor:()=>"pre",onDone:v=>{O=v,$t(O),s()}})}function ke(t){const s=t??(f==null?void 0:f.puzzle.poolIds)??jt.slice(0,R(p).odorCount);p==="junior"?(j=s.map(a=>({odorId:a,selected:!1,percent:0})),A=[],z="50-50"):j=s.map((a,u)=>({odorId:a,selected:u<2,percent:u===0?60:u===1?40:0})),U=""}function lt(){for(const s of j)s.percent=0,s.selected=!1;if(A.length!==2)return;const t=z==="25-75"?[25,75]:z==="75-25"?[75,25]:[50,50];A.forEach((s,a)=>{const u=j.find(g=>g.odorId===s);u&&(u.percent=t[a],u.selected=!0)})}function gt(){return j.filter(t=>t.percent>0).map(t=>({odorId:t.odorId,percent:t.percent}))}function wt(){if(!f){_=[],K=[],Z=new Set;return}_.length===0&&(_=ve({odorIds:[...f.puzzle.poolIds],preset:R(p)}));const t=x.map(s=>({guess:s.guess,ab:{a:s.a,b:s.b}}));K=t.length===0?_:Ln(_,{history:t,poolIds:f.puzzle.poolIds}),Z=new Set(K.flatMap(s=>s.components.map(a=>a.odorId)))}function Kt(){return gt().reduce((t,s)=>t+s.percent,0)}function Wt(){H="tutorial",I=0,bt()}function bt(){var M,$,m;const t=W(),a=[{title:t.tut1Title,body:t.tut1Body,demo:"single"},{title:t.tut2Title,body:t.tut2Body,demo:"mix"},{title:t.tut3Title,body:t.tut3Body,demo:"infer"}][I];r.innerHTML=`
      <div class="tutorial-state" data-testid="tutorial" data-tutorial-step="${I}">
        <p class="sp-step-label">${t.tutorial} ${I+1}/3</p>
        <h3>${a.title}</h3>
        <p>${a.body}</p>
        <p class="sp-axis-note">${t.axisNote}</p>
        <canvas class="sp-canvas" data-tut-canvas width="640" height="220" aria-label="${t.chartAria}"></canvas>
        <p class="sr-only" data-tut-sr></p>
        <div class="sp-actions">
          <button type="button" class="text-button" id="skipTutorial" data-testid="skip-tutorial">${t.skipTutorial}</button>
          ${I>0?`<button type="button" class="ghost-button" id="tutPrev">${t.back}</button>`:""}
          <button type="button" class="primary-button" id="tutNext" data-testid="tut-next">${I<2?t.next:t.startPlay}</button>
        </div>
      </div>
    `;const u=r.querySelector("[data-tut-canvas]");let v=F.get("banana");(a.demo==="mix"||a.demo==="infer")&&(v=be(Dt([{odorId:"banana",percent:60},{odorId:"lemon",percent:40}]),F)),Y(u,{bars:{values:v,color:"#6ecf8a"},curves:[{values:v,color:"#c4a35a"}],xLabel:t.xAxis,yLabel:t.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion});const C=r.querySelector("[data-tut-sr]");C&&(C.textContent=Pt(v,w())),(M=r.querySelector("#skipTutorial"))==null||M.addEventListener("click",()=>{c={...c,tutorialSeen:!0},J(c),Et()}),($=r.querySelector("#tutPrev"))==null||$.addEventListener("click",()=>{I=Math.max(0,I-1),bt()}),(m=r.querySelector("#tutNext"))==null||m.addEventListener("click",()=>{I<2?(I+=1,bt()):(c={...c,tutorialSeen:!0},J(c),Et())})}function Et(){H="play",D()}function D(){var ne,se,ae;if(!f)return;wt(),p==="junior"&&lt();const t=W(),s=R(p),a=s.maxGuesses-x.length,u=f.puzzle.observedSignal,g=Kt(),v=gt(),M=St(v,{minPercent:s.minPercent,percentStep:s.percentStep,componentCountMin:s.componentCountMin,componentCountMax:s.componentCountMax}).ok&&a>0,$=p==="junior",m=[...Z].map(N=>P(N,w())).sort((N,At)=>N.localeCompare(At)),b=`
      <p class="sp-candidates" data-testid="candidates">
        ${t.candidatesLeft}: <strong data-testid="candidate-count">${K.length}</strong>
        · ${t.candidateOdors}: <span data-testid="candidate-odors">${m.length?m.join(", "):"—"}</span>
      </p>`,y=q>=2?Pn(K):null,h=q>=3&&f?me({surviving:K,observedSignal:f.puzzle.observedSignal,signatures:F,difficulty:p,seed:f.meta.seed}):[],L=q<3?`<button type="button" class="text-button" id="useHint" data-testid="use-hint" aria-label="${t.hint}">${t.hint}</button>`:"",V=T?`<p class="sp-child-fb" data-testid="feedback" data-ab="${T.a}A${T.b}B">${we(T,t)}</p>`:"",G=T?Yt(T,t,{animate:nt,overlay:!$}):"",Q=Le(t),yt=`
      <details class="sp-more" data-testid="more-details"${ct?" open":""}>
        <summary>${t.moreDetails}</summary>
        ${T?Te(T,t):""}
        ${T?Ee(T,t):""}
        ${b}
        <section class="sp-history" data-testid="history">
          <button type="button" class="text-button" id="toggleHistory" data-testid="toggle-history" aria-expanded="${ot}">
            ${t.history} (${x.length})
          </button>
          <div class="sp-history-scroll" ${ot?"":"hidden"}>
            <table class="sp-history-table">
              <thead><tr><th>#</th><th>${t.guess}</th><th>A/B</th><th>${t.signalFit}</th></tr></thead>
              <tbody>
                ${x.length===0?`<tr><td colspan="4">${t.noHistory}</td></tr>`:x.map(N=>`<tr><td>${N.index}</td><td>${Nt(N.guess,w())}</td><td>${N.a}A${N.b}B</td><td>${N.fit}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>
        <p class="sp-muted">${t.seed}: <code data-testid="play-seed">${f.meta.seed}</code></p>
        <p class="sp-muted" data-testid="channel-note">${$?t.channelNotSpectrum:t.axisNote}</p>
      </details>`;r.innerHTML=`
      <div class="play-state${$?" is-junior":""}" data-testid="play">
        <div class="sp-status">
          <span>${t.remaining}: <strong data-testid="remaining">${a}</strong></span>
          ${s.revealComponentCount?`<span data-testid="mix-count">${t.componentCount}: <strong>${f.puzzle.truth.components.length}</strong></span>`:""}
          ${L}
        </div>
        ${V}
        <div class="sp-pattern-stack" data-testid="pattern-stack">
          ${Qt({odorsId:$?void 0:"builderSlots",odorsHtml:ze(t,{controls:!$}),compareHtml:`
          <div class="sp-pattern-row is-question">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${t.patternQuestion}</span>
              <strong title="${$?t.channelNotSpectrum:t.axisNote}">${t.targetSignal}</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" id="targetCanvas" width="640" height="168" aria-label="${t.chartAria}"></canvas>
              <p class="sr-only" id="targetSr"></p>
            </div>
          </div>
          ${G}`})}
        </div>
        ${Q}
        ${q>0?Ae(t,y,h):""}

        <section class="sp-builder" aria-label="${t.builder}" data-testid="builder">
          ${$?qe(t):`<div class="sp-builder-head">
            <h3>${t.builder}</h3>
          </div>
          <p class="sp-sum" data-testid="sum-line">${t.sum}: <strong data-testid="sum">${g}</strong>/100
            ${g!==100?`<span class="sp-warn">${t.sumNeed100}</span>`:""}</p>
          ${U?`<p class="sp-autofill-note" data-testid="autofill-note" role="status">${U}</p>`:""}
          <div class="sp-actions">
            <button type="button" class="ghost-button" id="autofill" data-testid="autofill">${t.autofill}</button>
            <button type="button" class="primary-button" id="submitGuess" data-testid="submit" ${M?"":"disabled"}>${t.submit}</button>
          </div>`}
        </section>
        ${yt}
      </div>
    `,Y(r.querySelector("#targetCanvas"),{bars:{values:u,color:"#5ec4d1"},curves:[{values:u,color:"#c4a35a"}],xLabel:$?t.channelTitle:t.xAxis,yLabel:t.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,simple:$});const rt=r.querySelector("#targetSr");if(rt&&(rt.textContent=Pt(u,w(),$)),T&&(Xt(T,f.puzzle.observedSignal,t,$,!$),nt))for(const N of T.guess.components)(ne=r.querySelector(`[data-testid="odor-card-${N.odorId}"]`))==null||ne.classList.add("is-submit-flash"),(ae=(se=r.querySelector(`[data-testid="percent-${N.odorId}"]`))==null?void 0:se.closest(".sp-pattern-row"))==null||ae.classList.add("is-submit-flash");s.showSignatureHints&&r.querySelectorAll("[data-hint-canvas]").forEach(N=>{const At=N.dataset.hintCanvas,oe=F.get(At);oe&&Rn(N,oe,c.highContrast,{xLabel:$?t.channelTitle:t.xAxis,yLabel:t.yAxis,simple:$})}),Pe(t)}function Ie(t){const s=w();return t.components.map((a,u)=>{const g=P(a.odorId,s),v=`<span class="sp-mix-chip">${Bn(a.odorId,g)} <strong>${xe(g)}</strong> ${a.percent}%</span>`;return u===0?v:`<span class="sp-mix-plus" aria-hidden="true">+</span>${v}`}).join("")}function Qt(t){return`
      <div class="sp-predict">
        <div class="sp-predict-odors"${t.odorsId?` id="${t.odorsId}"`:""}>${t.odorsHtml}</div>
        <div class="sp-predict-compare">${t.compareHtml}</div>
      </div>
    `}function Yt(t,s,a){return`
      <section class="sp-last-guess${a.animate&&!c.reducedMotion?" is-entering":""}" data-testid="last-guess">
        <div class="sp-last-guess-head">
          <span class="sp-pattern-kicker">${s.lastGuessTitle}</span>
          <div class="sp-last-mix" data-testid="last-guess-mix">${Ie(t.guess)}</div>
        </div>
        <div class="sp-guess-compare">
          <div class="sp-pattern-row is-result">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${s.lastGuessYours}</span>
              <strong>${s.patternGuess}</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" id="guessCanvas" data-testid="guess-chart" width="640" height="148" aria-label="${s.chartAria}"></canvas>
            </div>
          </div>
          ${a.overlay?`<div class="sp-pattern-row is-overlay">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${s.overlayCompare}</span>
              <strong>${s.mergePattern}</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" id="overlayCanvas" width="640" height="148" aria-label="${s.chartAria}"></canvas>
              <ul class="sp-legend">
                <li><span class="swatch" style="background:#c4a35a"></span>${s.targetCurve}</li>
                <li><span class="swatch" style="background:#6ecf8a"></span>${s.guessCurve}</li>
              </ul>
            </div>
          </div>`:""}
        </div>
      </section>
    `}function Le(t){return x.length===0?"":`
      <section class="sp-history-cards" data-testid="guess-history">
        ${x.map(s=>`
          <button type="button" class="sp-history-card${(T==null?void 0:T.index)===s.index?" is-active":""}" data-history-card="${s.index}" data-testid="history-card-${s.index}">
            <span class="sp-pattern-kicker">${t.tryLabel.replace("{n}",String(s.index))}</span>
            <span class="sp-history-mix">${s.guess.components.map(a=>P(a.odorId,w())).join(" + ")}</span>
            <canvas class="sp-mini-canvas" data-mini-history="${s.index}" width="220" height="56" aria-hidden="true"></canvas>
          </button>`).join("")}
      </section>
    `}function Xt(t,s,a,u,g){const v=Un(s,t.guessSignal),C=r.querySelector("#guessCanvas");C&&Y(C,{bars:{values:t.guessSignal,color:"#6ecf8a"},curves:[{values:t.guessSignal,color:"#27856a"}],xLabel:u?a.channelTitle:a.xAxis,yLabel:a.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,simple:u,emphasizeIndices:v,emphasizeColor:"#ee7b66"});const M=r.querySelector("#overlayCanvas");g&&M&&Y(M,{curves:[{values:s,color:"#c4a35a"},{values:t.guessSignal,color:"#6ecf8a"}],xLabel:a.xAxis,yLabel:a.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,emphasizeIndices:v,emphasizeColor:"#ee7b66"}),r.querySelectorAll("[data-mini-history]").forEach($=>{const m=Number($.dataset.miniHistory),b=x.find(y=>y.index===m);b&&Y($,{bars:{values:b.guessSignal,color:"#6ecf8a"},curves:[{values:b.guessSignal,color:"#27856a"}],xLabel:"",yLabel:"",highContrast:c.highContrast,reducedMotion:!0,simple:!0,showDots:!1})})}function Te(t,s){return`
      <div class="sp-pattern-row is-result">
        <div class="sp-pattern-meta">
          <span class="sp-pattern-kicker">${s.patternGuess}</span>
          <strong>${t.a}A${t.b}B</strong>
          <span class="sp-muted">${s.signalFit} ${t.fit}</span>
        </div>
      </div>
    `}function we(t,s){return t.a>=2&&t.b>0?s.fbBothProportions:t.a===1?s.fbFoundOneOfTwo:t.b>0&&t.fit>=80?s.fbPatternClose:s.fbTryPair}function Ee(t,s){return`
      <section class="sp-feedback" data-testid="feedback-panel" aria-live="assertive">
        <details class="sp-tech-details" data-testid="tech-details">
          <summary>${s.techDetails}</summary>
          <p data-testid="ab-result"><strong>${t.a}A${t.b}B</strong> · ${s.signalFit}: <strong data-testid="fit-score">${t.fit}</strong></p>
          <p class="sp-muted">${s.abBlind}</p>
        </details>
      </section>
    `}function Ae(t,s,a){const u=q>=1?pe(K):[],g=q>=2&&f?f.puzzle.poolIds.filter(M=>!Z.has(M)):[],v=q>=2&&s?`<p class="sp-hint-banner" data-testid="hint-reveal">
            ${s.inAll?t.hintRevealSure.replace("{odor}",P(s.odorId,w())):t.hintRevealMaybe.replace("{odor}",P(s.odorId,w()))}
            ${g.length?`<span data-testid="hint-eliminated"> ${t.hintEliminated}: ${g.map(M=>P(M,w())).join(", ")}</span>`:""}
          </p>`:"",C=q>=3&&a.length?`<div class="sp-hint-mixes" data-testid="hint-mixes">
            <p>${t.hintClosest}</p>
            <div class="sp-hint-mix-grid">
              ${a.map((M,$)=>{const m=fe(M,p);return m?`<button type="button" class="sp-hint-mix" data-hint-mix="${$}" data-testid="hint-mix-${$}">
                    ${Nt(m,w())}
                  </button>`:""}).join("")}
            </div>
          </div>`:"";return`
      <div class="sp-hints" data-testid="hints" data-hint-level="${q}">
        ${q>=1&&u.length?`<p class="sr-only">${t.hintPossible}: ${u.map(M=>P(M,w())).join(", ")}</p>`:""}
        ${v}
        ${C}
        ${q>=3?`<p class="sp-muted">${t.hintsMax}</p>`:""}
      </div>
    `}function qe(t){const s=R(p),a=Kt(),u=s.maxGuesses-x.length,v=St(gt(),{minPercent:s.minPercent,percentStep:s.percentStep,componentCountMin:s.componentCountMin,componentCountMax:s.componentCountMax}).ok&&u>0,C=w(),M=A.length===2?`${P(A[0],C)} ${z==="25-75"?25:z==="75-25"?75:50}% + ${P(A[1],C)} ${z==="25-75"?75:z==="75-25"?25:50}%`:t.juniorNeedTwo,$=j.map(m=>{const b=A.indexOf(m.odorId),y=b>=0,h=q>=1?new Set(pe(K)):null,L=!!(h&&h.has(m.odorId)),V=!!(h&&!h.has(m.odorId)&&!y),G=s.showSignatureHints?`<canvas class="sp-hint-canvas" data-hint-canvas="${m.odorId}" width="240" height="72" aria-hidden="true"></canvas>`:"";return`<button type="button" class="sp-odor-card${y?" is-picked":""}${L?" is-hint-possible":""}${V?" is-hint-out":""}"
          data-odor-card="${m.odorId}" data-testid="odor-card-${m.odorId}" aria-pressed="${y}" title="${P(m.odorId,C)}">
          <strong class="sp-odor-card-name">${P(m.odorId,C)}</strong>
          ${y?`<span class="sp-odor-order">${b+1}</span>`:""}
          ${G}
        </button>`}).join("");return`
      <div class="sp-junior-builder" data-testid="junior-builder">
        <div class="sp-odor-cards" role="group" aria-label="${t.how1Title}">${$}</div>
        <p class="sp-mix-preview" data-testid="junior-mix">${M}</p>
        <div class="sp-ratio-row" role="group" aria-label="${t.how2Title}">
          <button type="button" class="sp-ratio-btn${z==="25-75"?" is-on":""}" data-ratio="25-75" data-testid="ratio-25-75" aria-pressed="${z==="25-75"}">25 / 75</button>
          <button type="button" class="sp-ratio-btn${z==="50-50"?" is-on":""}" data-ratio="50-50" data-testid="ratio-50-50" aria-pressed="${z==="50-50"}">50 / 50</button>
          <button type="button" class="sp-ratio-btn${z==="75-25"?" is-on":""}" data-ratio="75-25" data-testid="ratio-75-25" aria-pressed="${z==="75-25"}">75 / 25</button>
        </div>
        <div class="sp-actions">
          <button type="button" class="ghost-button" id="swapOdors" data-testid="swap-odors" ${A.length===2?"":"disabled"}>${t.juniorSwap}</button>
        </div>
        <p class="sp-sum" data-testid="sum-line" hidden>${t.sum}: <strong data-testid="sum">${a}</strong>/100</p>
        ${U?`<p class="sp-autofill-note" data-testid="autofill-note" role="status">${U}</p>`:""}
        <div class="sp-actions">
          <button type="button" class="primary-button" id="submitGuess" data-testid="submit" ${v?"":"disabled"}>${t.submit}</button>
        </div>
      </div>
    `}function He(t){var a,u;const s=fe(t,p);if(!s)return!1;if(p==="junior"){A=s.components.map(C=>C.odorId);const g=((a=s.components[0])==null?void 0:a.percent)??50,v=((u=s.components[1])==null?void 0:u.percent)??50;g===25&&v===75?z="25-75":g===75&&v===25?z="75-25":z="50-50",lt()}else for(const g of j){const v=s.components.find(C=>C.odorId===g.odorId);g.percent=(v==null?void 0:v.percent)??0,g.selected=g.percent>0}return!0}function ze(t,s={controls:!0}){const a=R(p);return j.map((u,g)=>{const v=s.controls?u.percent>0:A.includes(u.odorId),C=q>=1&&Z.size>0&&!Z.has(u.odorId)&&!v,M=a.showSignatureHints?`<canvas class="sp-canvas" data-hint-canvas="${u.odorId}" width="640" height="168" aria-label="${t.signatureHint}"></canvas>`:"",$=s.controls?`<div class="sp-stepper">
                <button type="button" data-dec="${g}" aria-label="${t.stepDown} ${P(u.odorId,w())}">−</button>
                <input type="range" data-range="${g}" data-testid="range-${u.odorId}" min="0" max="100" step="${a.percentStep}" value="${u.percent}" aria-label="${P(u.odorId,w())}" />
                <input type="number" data-num="${g}" data-testid="percent-${u.odorId}" min="0" max="100" step="${a.percentStep}" value="${u.percent}" aria-label="${P(u.odorId,w())} %" />
                <button type="button" data-inc="${g}" aria-label="${t.stepUp} ${P(u.odorId,w())}">+</button>
              </div>`:"",m=s.controls?`<span class="sp-pct-label" data-testid="sel-${u.odorId}">${u.percent}%</span>`:"";return`
          <div class="sp-pattern-row is-option${v?" is-picked":""}${C?" is-hint-out":""}" data-row="${g}">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${t.patternChoice}</span>
              <div class="sp-odor-name">
                <span>${P(u.odorId,w())}</span>
                ${m}
              </div>
              ${$}
            </div>
            <div class="sp-pattern-chart">${M}</div>
          </div>
        `}).join("")}function Pe(t){var u,g,v,C,M,$;const s=R(p);(u=r.querySelector("#toggleHistory"))==null||u.addEventListener("click",()=>{ot=!ot,ct=!0,D()}),r.querySelectorAll("[data-history-card]").forEach(m=>{m.addEventListener("click",()=>{const b=Number(m.dataset.historyCard),y=x.find(h=>h.index===b);y&&(T=y,nt=!1,D())})}),(g=r.querySelector('[data-testid="more-details"]'))==null||g.addEventListener("toggle",m=>{ct=m.target.open}),(v=r.querySelector("#useHint"))==null||v.addEventListener("click",()=>{q=Math.min(3,q+1),D()}),r.querySelectorAll("[data-hint-mix]").forEach(m=>{m.addEventListener("click",()=>{const b=Number(m.dataset.hintMix);if(!f)return;const h=me({surviving:K,observedSignal:f.puzzle.observedSignal,signatures:F,difficulty:p,seed:f.meta.seed})[b];h&&He(h)&&(U=t.hintAutofillOk,D())})}),r.querySelectorAll("[data-odor-card]").forEach(m=>{m.addEventListener("click",()=>{const b=m.dataset.odorCard;A.indexOf(b)>=0?A=A.filter(h=>h!==b):A.length<2&&(A=[...A,b]),lt(),D()})}),r.querySelectorAll("[data-ratio]").forEach(m=>{m.addEventListener("click",()=>{z=m.dataset.ratio,lt(),D()})}),(C=r.querySelector("#swapOdors"))==null||C.addEventListener("click",()=>{A.length===2&&(A=[A[1],A[0]],lt(),D())}),(M=r.querySelector("#autofill"))==null||M.addEventListener("click",()=>{const m=j.filter(L=>L.percent>0);if(m.length===0){U=t.autofillFail,D();return}const b=m[m.length-1],h=100-m.filter(L=>L.odorId!==b.odorId).reduce((L,V)=>L+V.percent,0);if(h<s.minPercent||h%s.percentStep!==0||h>100)U=t.autofillFail;else{const L=b.percent;b.percent=h,b.selected=!0,U=t.autofillOk.replace("{odor}",P(b.odorId,w())).replace("{from}",String(L)).replace("{to}",String(h))}D()}),($=r.querySelector("#submitGuess"))==null||$.addEventListener("click",je);const a=(m,b)=>{const y=s.percentStep;let h=Math.round(b/y)*y;h=Math.max(0,Math.min(100,h)),h>0&&h<s.minPercent&&(h=s.minPercent),j[m].percent=h,j[m].selected=h>0,U="",D()};r.querySelectorAll("[data-inc]").forEach(m=>{m.addEventListener("click",()=>{const b=Number(m.dataset.inc),y=j[b].percent;a(b,y===0?s.minPercent:y+s.percentStep)})}),r.querySelectorAll("[data-dec]").forEach(m=>{m.addEventListener("click",()=>{const b=Number(m.dataset.dec),y=j[b].percent;y<=s.minPercent?a(b,0):a(b,y-s.percentStep)})}),r.querySelectorAll("[data-range]").forEach(m=>{m.addEventListener("change",b=>{const y=Number(b.target.dataset.range);a(y,Number(b.target.value))})}),r.querySelectorAll("[data-num]").forEach(m=>{m.addEventListener("change",b=>{const y=Number(b.target.dataset.num);a(y,Number(b.target.value))})})}function je(){if(!f)return;const t=R(p);if(x.length>=t.maxGuesses)return;const s=gt(),a=St(s,{minPercent:t.minPercent,percentStep:t.percentStep,componentCountMin:t.componentCountMin,componentCountMax:t.componentCountMax});if(!a.ok)return;const u=a.canonical,g=ye(u,f.puzzle.truth,f.puzzle.poolIds),v=It(u,F,t.mixingModel,f.meta.seed),C=Ut(f.puzzle.observedSignal,v.observed),M=new Set(Z),$={index:x.length+1,guess:u,a:g.a,b:g.b,fit:C,guessSignal:v.observed,eliminatedOdors:0};x=[...x,$],wt();let m=0;for(const y of M)Z.has(y)||(m+=1);$.eliminatedOdors=m,T=$,U="",nt=!0,st&&window.clearTimeout(st),st=window.setTimeout(()=>{var y;nt=!1,(y=r.querySelector(".sp-last-guess"))==null||y.classList.remove("is-entering"),r.querySelectorAll(".is-submit-flash").forEach(h=>h.classList.remove("is-submit-flash"))},c.reducedMotion?80:560);const b=fn(u,f.puzzle.truth)||Cn(g,f.puzzle.truth.components.length);if(b||x.length>=t.maxGuesses){Ne(b);return}D()}function Ne(t){if(!f)return;H="result";const s=Date.now()-k,a=Hn({solved:t,guessesUsed:x.length,difficulty:p,elapsedMs:s,hintsUsed:q});c=dn(c,a.scoreKey,a.totalScore),J(c),dt()&&O&&(O=nn(O,{durationMs:s,numberOfAttempts:x.length,hintsUsed:q,selectedDifficulty:p,outcome:{gameId:"spectrum",spectrum:{guesses:x.length,hintLevel:q,solved:t,difficulty:p}}}),$t(O)),Re(t,a)}function Re(t,s){var b,y;if(!f)return;const a=W(),u=R(p),g=f.puzzle.truth,v=w(),C=g.components.map(h=>{const L=F.get(h.odorId),V=h.percent/100,G=L.map(Q=>Q*V);return`
          <div class="sp-pattern-row is-option">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${a.patternChoice}</span>
              <strong>${P(h.odorId,v)} · ${h.percent}%</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" data-contrib="${h.odorId}" width="640" height="168"></canvas>
              <p class="sr-only">${Pt(G,v)}</p>
            </div>
          </div>
        `}).join(""),M=T?Yt(T,a,{animate:!1,overlay:p!=="junior"}):"",$=u.mixingModel==="linear"?`<div class="sp-pattern-stack" data-testid="result-patterns">
                ${Qt({odorsHtml:C,compareHtml:`
                <div class="sp-pattern-row is-question">
                  <div class="sp-pattern-meta">
                    <span class="sp-pattern-kicker">${a.patternQuestion}</span>
                    <strong>${a.targetSignal}</strong>
                  </div>
                  <div class="sp-pattern-chart">
                    <canvas class="sp-canvas" id="resultTargetCanvas" width="640" height="168" aria-label="${a.chartAria}"></canvas>
                  </div>
                </div>
                ${M}`})}
              </div>`:`<h4>${a.satCompare}</h4>
               <div class="sp-pattern-stack">
                 <div class="sp-pattern-row is-result">
                   <div class="sp-pattern-meta">
                     <span class="sp-pattern-kicker">${a.patternGuess}</span>
                     <strong>${a.satCompare}</strong>
                   </div>
                   <div class="sp-pattern-chart">
                     <canvas class="sp-canvas" id="satCanvas" width="640" height="168"></canvas>
                     <ul class="sp-legend">
                       <li><span class="swatch" style="background:#6ecf8a"></span>${a.linear}</li>
                       <li><span class="swatch" style="background:#5ec4d1"></span>${a.saturated}</li>
                       <li><span class="swatch" style="background:#c4a35a"></span>${a.observed}</li>
                     </ul>
                   </div>
                 </div>
               </div>`,m=[{value:String(s.totalScore),label:a.totalScore,testId:"total-score-metric"},{value:`${s.guessesUsed}/${s.maxGuesses}`,label:a.guessesUsed},{value:String(q),label:a.hintsUsed,testId:"hints-used"}];if(p!=="junior"&&m.push({value:String(s.guessScore),label:a.guessScore,testId:"guess-score"}),r.innerHTML=We({testId:"result",extraAttrs:`data-solved="${t}"`,scoreHtml:Qe({score:String(s.totalScore),label:a.totalScore,angle:Math.min(360,s.totalScore/1e4*360)}),scoreExtraHtml:`<span data-testid="total-score" class="sr-only">${s.totalScore}</span>`,badge:{text:t?a.solved:a.failed,fail:!t},kicker:vt("03"),title:t?a.solved:a.failed,titleTestId:"result-title",leadHtml:`<p>${a.truth}: <strong data-testid="truth">${Nt(g,v)}</strong></p>`,metrics:m,discoveredTitle:a.discoveredTitle,discoveredBody:a.discoveredBody,discoveredTestId:"discovered",extraCopyHtml:$,actionsHtml:`<button type="button" class="primary-button" id="again" data-testid="again">${a.playAgain}</button><button type="button" class="secondary-button" id="toSetup" data-testid="to-setup">${a.backSetup}</button>`,technicalSummary:e.getCopy().gameUi.technicalDetails,technicalHtml:`<p class="sp-disclaimer" data-testid="model-disclaimer">${a.modelDisclaimer}</p>
        <p>${a.seed}: <code>${f.meta.seed}</code></p>
        <p>${a.ruleVersion}: ${f.meta.ruleVersion}</p>
        <p>${a.contentVersion}: ${f.meta.contentVersion}</p>
        <p>${a.gameVersion}: ${f.meta.gameVersion}</p>
        <p>${a.factModel}: ${u.mixingModel}</p>
        <p>${a.guessScore}: ${s.guessScore}${p==="junior"?"":` · ${a.timeScore}: ${s.timeScore}`}</p>
        ${p==="junior"?`<p>${a.juniorNoTime}</p>`:`<p>${a.elapsed}: <strong data-testid="elapsed">${zn(s.elapsedMs)}</strong></p><p class="illustrative-note">${a.scoreScope}</p>`}
        ${u.mixingModel==="saturatedNoisy"?`<p class="sp-disclaimer" data-testid="noise-disclaimer">${a.noiseDisclaimer}</p>`:""}`}),u.mixingModel==="linear"){const h=r.querySelector("#resultTargetCanvas");h&&Y(h,{bars:{values:f.puzzle.observedSignal,color:"#5ec4d1"},curves:[{values:f.puzzle.observedSignal,color:"#c4a35a"}],xLabel:p==="junior"?a.channelTitle:a.xAxis,yLabel:a.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,simple:p==="junior"}),T&&Xt(T,f.puzzle.observedSignal,a,p==="junior",p!=="junior"),r.querySelectorAll("[data-contrib]").forEach(L=>{const V=L.dataset.contrib,G=g.components.find(rt=>rt.odorId===V),yt=F.get(V).map(rt=>rt*(G.percent/100));Y(L,{bars:{values:yt,color:"#6ecf8a"},curves:[{values:yt,color:"#c4a35a"}],xLabel:p==="junior"?a.channelTitle:a.xAxis,yLabel:a.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,simple:p==="junior"})})}else{const h=r.querySelector("#satCanvas");h&&Y(h,{curves:[{values:f.puzzle.linearSignal,color:"#6ecf8a"},{values:f.puzzle.saturatedSignal??f.puzzle.linearSignal,color:"#5ec4d1"},{values:f.puzzle.observedSignal,color:"#c4a35a"}],xLabel:a.xAxis,yLabel:a.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion})}if((b=r.querySelector("#again"))==null||b.addEventListener("click",()=>{Jt()}),(y=r.querySelector("#toSetup"))==null||y.addEventListener("click",()=>{Gt(),ft(),it(),ht()}),dt()&&O){const h=document.createElement("div");h.className="edu-post",r.appendChild(h);const L=e.getCopy().study,V=w(),G=sn("spectrum");h.innerHTML=ie({title:L.postTitle,lead:L.postLead,items:G,locale:V,copy:L,submitLabel:L.continue,allowSkip:!0})+Ht(L),re(h,{items:G,session:O,phaseFor:Q=>Q.phase==="pre"?"post":Q.phase,onDone:Q=>{O=Q,$t(O),h.innerHTML=`<p data-testid="study-thanks">${L.thanks}</p>${Ht(L)}`,zt(h)}}),zt(h)}}function Oe(){Lt(),H==="ready"?(ft(),it(),ht()):H==="tutorial"?bt():H==="play"&&D()}Lt(),ft(),it(),ht(),(ee=e.onReady)==null||ee.call(e,{refreshReady:Oe})}const kt=document.querySelector("#app");if(!kt)throw new Error("#app missing");const tt=an(on());let xt;const ge=rn(kt,{homeHref:"../../index.html",actionsHtml:Ye(tt.gameUi.howToPlay),onLocaleChange:(e,n)=>{const o=kt.querySelector("#guideButton");o&&(o.innerHTML=`<span>?</span> ${n.gameUi.howToPlay}`);try{const i=Ct(localStorage.getItem(Mt));localStorage.setItem(Mt,JSON.stringify({...i,locale:e}))}catch{}xt==null||xt()}}),_n=cn(kt);_n.innerHTML=`
  <section class="intro" aria-labelledby="sp-title">
    <div class="eyebrow" id="introEyebrow"><span></span> ${tt.hub.gameLabel} 03</div>
    <h1 id="sp-title">Scent <em>Mixer</em></h1>
    <p id="introLead" data-sp-lead></p>
    <div class="intro-chips" id="introChips" aria-label="Game facts">
      <span><b>Junior</b></span><span><b>Standard</b></span><span><b>Challenge</b></span>
    </div>
  </section>
  <section class="lab" aria-label="Scent Mixer">
    <div class="level-header">
      <div>
        <span class="section-label" data-sp-label>${tt.hub.gameLabel} 03</span>
        <h2 data-sp-heading></h2>
      </div>
      <div class="lab-actions">
        ${Xe({id:"scienceButton",extra:"data-sp-science",label:tt.gameUi.science})}
      </div>
    </div>
    <div class="level-tabs" id="modeTabs" role="tablist" aria-label="Game mode"></div>
    <div class="game-card">
      <aside class="control-panel" id="settingsPanel"></aside>
      <section class="play-area" id="playArea" aria-live="polite"></section>
    </div>
  </section>
  <dialog id="scienceDialog" class="modal guide-modal">
    <div class="modal-header">
      <div>
        <span class="section-label">${tt.gameUi.science}</span>
        <h2 data-science-title></h2>
      </div>
      <button class="close-button" data-close="scienceDialog" type="button" aria-label="${tt.gameUi.close}">×</button>
    </div>
    <div data-science-body></div>
    <button class="primary-button full-button" data-close="scienceDialog" type="button" data-sp-close></button>
  </dialog>
  <dialog id="guideDialog" class="modal guide-modal">
    <div class="modal-header">
      <div>
        <span class="section-label">${tt.gameUi.howToPlay}</span>
        <h2 data-guide-title></h2>
      </div>
      <button class="close-button" data-close="guideDialog" type="button" aria-label="${tt.gameUi.close}">×</button>
    </div>
    <div data-guide-body></div>
    <button class="primary-button full-button" data-close="guideDialog" type="button" data-sp-close></button>
  </dialog>
`;Vn({getCopy:()=>ge.getCopy(),getLocale:()=>ge.getLocale(),onReady:e=>{xt=e.refreshReady}});
