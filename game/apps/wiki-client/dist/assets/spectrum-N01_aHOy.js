import{s as je,S as Ne,a as Oe,b as qt,d as Re}from"./index-CXh1DE2f.js";import{c as Ot,a as De,g as $t,m as Be,l as Ue,b as _e,d as Ge,f as Ve,i as Fe,h as Je,t as Ke}from"./science-hash-BjG7703R.js";import{i as dt,s as We,a as Ht,b as zt,c as Qe,p as St,d as Ye,e as ne,f as ae,m as Xe,g as Ze}from"./study-ui-k0uM9ZOk.js";import{a as oe,b as ie,c as re,t as ts,r as es,m as ss,s as ns}from"./mount-D2POQTHj.js";import{g as O,p as ce,a as Mt,S as kt,r as as,b as os}from"./storage-BgjRJnVt.js";const is=12,Rt="1.1.0",mt="2.0.0",tt={ruleVersion:mt,channelCount:is,saturationK:1.8,noise:{kind:"uniformSymmetric",amplitude:.03},signalRoundingDecimals:6,weightNormalization:"percentOver100",fitMetric:{kind:"normalizedRmse",rmseScale:1}};function rs(e,s){return e<s?-1:e>s?1:0}function Dt(e){return{components:[...e].sort((o,r)=>rs(o.odorId,r.odorId)).map(o=>({odorId:o.odorId,percent:o.percent}))}}function st(e){return e.components.map(s=>`${s.odorId}:${s.percent}`).join("|")}function cs(e,s){return st(e)===st(s)}function xt(e,s){if(e.length===0)return{ok:!1,error:"empty"};const o=s==null?void 0:s.componentCountMin,r=s==null?void 0:s.componentCountMax;if(o!==void 0&&e.length<o)return{ok:!1,error:"component_count"};if(r!==void 0&&e.length>r)return{ok:!1,error:"component_count"};const i=new Set;let l=0;for(const d of e){if(i.has(d.odorId))return{ok:!1,error:"duplicate_odor"};if(i.add(d.odorId),!Number.isInteger(d.percent))return{ok:!1,error:"non_integer_percent"};if(d.percent<0||d.percent>100)return{ok:!1,error:"percent_out_of_range"};if((s==null?void 0:s.minPercent)!==void 0&&d.percent<s.minPercent)return{ok:!1,error:"below_min_percent"};if((s==null?void 0:s.percentStep)!==void 0&&d.percent%s.percentStep!==0)return{ok:!1,error:"not_on_step"};l+=d.percent}return l!==100?{ok:!1,error:"sum_not_100"}:{ok:!0,canonical:Dt(e)}}function ls(e,s,o,r){const i=[];function l(d,c,$){if(d===1){c>=r&&c<=100&&c%o===0&&i.push([...$,c]);return}for(let u=r;u<=c-r*(d-1);u+=o)$.push(u),l(d-1,c-u,$),$.pop()}return l(e,s,[]),i}function ds(e,s){const o=[],r=e.length;if(s<0||s>r)return o;const i=Array.from({length:s},(l,d)=>d);for(;;){o.push(i.map(d=>e[d]));let l=s-1;for(;l>=0&&i[l]===r-s+l;)l-=1;if(l<0)break;i[l]+=1;for(let d=l+1;d<s;d+=1)i[d]=i[d-1]+1}return o}function us(e,s){if(s.weightNormalization!=="percentOver100")throw new Error(`Unsupported weightNormalization: ${s.weightNormalization}`);return e/100}function ps(e,s){if(!Number.isFinite(e))return e;const o=10**s;return Math.round(e*o)/o}function ms(e){return e<0?0:e>1?1:e}function Bt(e,s){return e.map(o=>ps(o,s))}function fe(e,s,o=tt){const r=Array.from({length:o.channelCount},()=>0);for(const i of e.components){const l=s.get(i.odorId);if(!l)throw new Error(`Missing signature for odor ${i.odorId}`);if(l.length!==o.channelCount)throw new Error(`Signature ${i.odorId} length ${l.length} != ${o.channelCount}`);const d=us(i.percent,o);for(let c=0;c<o.channelCount;c+=1)r[c]+=d*l[c]}return Bt(r,o.signalRoundingDecimals)}function fs(e,s=tt){const o=s.saturationK;return Bt(e.map(r=>1-Math.exp(-o*r)),s.signalRoundingDecimals)}function hs(e,s,o=tt){if(o.noise.kind!=="uniformSymmetric")throw new Error(`Unsupported noise kind: ${o.noise.kind}`);const r=Ot(`spectrum-noise:${o.ruleVersion}:${s}`),i=o.noise.amplitude;return Bt(e.map(l=>ms(l+(r()*2-1)*i)),o.signalRoundingDecimals)}function Lt(e,s,o,r,i=tt){const l=fe(e,s,i);if(o==="linear")return{linear:l,saturated:null,observed:[...l]};const d=fs(l,i);if(o==="saturated")return{linear:l,saturated:d,observed:[...d]};const c=hs(d,r,i);return{linear:l,saturated:d,observed:c}}function gs(e,s){for(const o of e.components)if(o.odorId===s)return o.percent;return 0}function he(e,s,o){let r=0,i=0;for(const l of s.components){const d=l.percent,c=gs(e,l.odorId);d===c?r+=1:c>0&&(i+=1)}return{a:r,b:i}}function bs(e,s){return e.a===s&&e.b===0}function Ut(e,s,o=tt){if(o.fitMetric.kind!=="normalizedRmse")throw new Error(`Unsupported fit metric: ${o.fitMetric.kind}`);const r=Math.min(e.length,s.length,o.channelCount);if(r===0)return 0;let i=0;for(let $=0;$<r;$+=1){const u=(e[$]??0)-(s[$]??0);i+=u*u}const l=Math.sqrt(i/r),d=o.fitMetric.rmseScale;if(!(d>0)||!Number.isFinite(l))return 0;const c=100*(1-l/d);return Number.isFinite(c)?Math.max(0,Math.min(100,Math.round(c))):0}function ge(e){const{odorIds:s,preset:o}=e;if(s.length<o.odorCount)throw new Error(`Need at least ${o.odorCount} odors for ${o.id}, got ${s.length}`);const r=s.slice(0,o.odorCount),i=[],l=new Set;for(let d=o.componentCountMin;d<=o.componentCountMax;d+=1){const c=ls(d,100,o.percentStep,o.minPercent),$=ds(r,d);for(const u of $)for(const B of c){const f=u.map((z,I)=>({odorId:z,percent:B[I]})),S=Dt(f),M=st(S);l.has(M)||(l.add(M),i.push(S))}}return i.sort((d,c)=>{const $=st(d),u=st(c);return $<u?-1:$>u?1:0}),i}function ys(e,s,o=tt.ruleVersion){if(e.length===0)throw new Error("No legal mixtures to pick from");const r=Ot(`spectrum-truth:${o}:${s}`),i=Math.floor(r()*e.length);return e[i]}function vs(e){const s=e.rules??tt,o=O(e.difficulty),r=e.odorIds.slice(0,o.odorCount),i=ge({odorIds:e.odorIds,preset:o}),l=ys(i,e.seed,s.ruleVersion),d=Lt(l,e.signatures,o.mixingModel,e.seed,s);return{seed:e.seed,ruleVersion:s.ruleVersion,contentVersion:e.contentVersion,difficulty:e.difficulty,poolIds:r,truth:l,observedSignal:d.observed,linearSignal:d.linear,saturatedSignal:d.saturated,legalMixtureCount:i.length}}function $s(e,s){const o=s.rules??tt,{history:r}=s;return e.filter(i=>{for(const l of r){const d=he(l.guess,i);if(d.a!==l.ab.a||d.b!==l.ab.b)return!1}if(s.fitTolerance!==void 0&&s.observedSignal&&s.signatures&&s.difficulty&&s.seed!==void 0){const l=O(s.difficulty),d=Lt(i,s.signatures,l.mixingModel,s.seed,o);if(Ut(s.observedSignal,d.observed,o)<100-s.fitTolerance)return!1}return!0})}function be(e,s=mt){return`${e}|${s}`}function ut(e=Date.now()){const s=Ot(`spectrum-practice-${e}`),o=()=>Math.floor(s()*1e9).toString(36),r=Math.floor(Math.random()*1e9).toString(36);return`sp-${o()}-${r}`}function Ss(e,s=Rt){return`sd-${e}-v${s}`}function xs(e=new Date){return e.toISOString().slice(0,10)}function ye(e){O(e.difficulty);const s=vs({seed:e.seed,difficulty:e.difficulty,signatures:e.signatures,odorIds:e.odorIds,contentVersion:e.contentVersion});return{meta:{seed:e.seed,mode:e.mode,difficulty:e.difficulty,ruleVersion:mt,contentVersion:e.contentVersion,gameVersion:Rt,scoreKey:be(e.difficulty),dateUTC:e.dateUTC},puzzle:s}}function Cs(e){return ye({seed:e.seed??ut(),mode:"practice",difficulty:e.difficulty,signatures:e.signatures,odorIds:e.odorIds,contentVersion:e.contentVersion})}function Ms(e){const s=e.dateUTC??xs();return ye({seed:Ss(s),mode:"daily",difficulty:e.difficulty,signatures:e.signatures,odorIds:e.odorIds,contentVersion:e.contentVersion,dateUTC:s})}const ks=400;function Is(e){const s=e.ruleVersion??mt,r=O(e.difficulty).maxGuesses,i=Math.max(0,Math.min(r,Math.round(e.guessesUsed))),l=Math.max(0,Math.round(e.elapsedMs)),d=be(e.difficulty,s),c=Math.max(0,Math.min(3,Math.round(e.hintsUsed??0)));if(!e.solved)return{solved:!1,guessesUsed:i,maxGuesses:r,elapsedMs:l,difficulty:e.difficulty,ruleVersion:s,scoreKey:d,guessScore:0,timeScore:0,totalScore:0};const u=5e3+Math.max(0,r-i)*1e3,B=l/1e3,f=e.difficulty==="junior"?0:Math.max(0,Math.round(2e3*Math.max(0,1-Math.max(0,B-30)/150))),S=e.difficulty==="hard"?0:ks*c,M=Math.max(0,u+f-S);return{solved:!0,guessesUsed:i,maxGuesses:r,elapsedMs:l,difficulty:e.difficulty,ruleVersion:s,scoreKey:d,guessScore:u,timeScore:f,totalScore:M}}function Ls(e){const s=Math.max(0,Math.floor(e/1e3)),o=Math.floor(s/60),r=s%60;return`${o}:${String(r).padStart(2,"0")}`}function le(e){const s=new Set;for(const o of e)for(const r of o.components)s.add(r.odorId);return[...s].sort()}function Ts(e){if(e.length===0)return null;const s=new Map;for(const i of e)for(const l of i.components)s.set(l.odorId,(s.get(l.odorId)??0)+1);let o=null,r=-1;for(const[i,l]of s)(l>r||l===r&&(o===null||i<o))&&(o=i,r=l);return o?{odorId:o,inAll:r===e.length}:null}function de(e){const s=e.limit??3;if(e.surviving.length===0)return[];const o=O(e.difficulty),r=new Set(e.surviving.map(st));return e.surviving.map(l=>{const d=Lt(l,e.signatures,o.mixingModel,e.seed).observed;return{mix:l,fit:Ut(e.observedSignal,d),key:st(l)}}).filter(l=>r.has(l.key)).sort((l,d)=>d.fit-l.fit||(l.key<d.key?-1:l.key>d.key?1:0)).slice(0,s).map(l=>l.mix)}function ue(e,s){const o=O(s),r=xt(e.components,{minPercent:o.minPercent,percentStep:o.percentStep,componentCountMin:o.componentCountMin,componentCountMax:o.componentCountMax});return r.ok?r.canonical:null}const Z=12,w={l:40,r:10,t:10,b:28};function pt(e,s,o=w.l){return o+(e+.5)/Z*s}function pe(e,s,o,r,i=w.l){const l=s/Z,d=Math.max(4,l*.62),c=Math.max(0,Math.min(1,r)),$=Math.max(1,c*o);return{x:i+e*l+(l-d)/2,y:w.t+o-$,w:d,h:$}}function Es(e){const s=window.devicePixelRatio||1,o=e.clientWidth||640,r=e.clientHeight||240;e.width=Math.floor(o*s),e.height=Math.floor(r*s);const i=e.getContext("2d");return i?(i.setTransform(s,0,0,s,0,0),i.clearRect(0,0,o,r),{ctx:i,w:o,h:r}):null}function ws(e,s,o,r,i,l,d=!1){const c=s-w.l-w.r,$=o-w.t-w.b;if(e.strokeStyle=l?"rgba(0,0,0,0.55)":"rgba(255,255,255,0.18)",e.fillStyle=l?"rgba(0,0,0,0.7)":"rgba(255,255,255,0.55)",e.lineWidth=1,e.beginPath(),e.moveTo(w.l,w.t),e.lineTo(w.l,w.t+$),e.lineTo(w.l+c,w.t+$),e.stroke(),e.font=d?"12px ui-sans-serif, system-ui, sans-serif":"11px ui-monospace, monospace",e.textAlign="center",!d)for(let u=0;u<Z;u+=1)e.fillText(String(u),pt(u,c),o-10);e.fillText(r,w.l+c/2,o-(d?10:2)),e.save(),e.translate(14,w.t+$/2),e.rotate(-Math.PI/2),e.textAlign="center",e.fillText(i,0,0),e.restore()}function K(e,s){var u,B,f;const o=Es(e);if(!o)return;const{ctx:r,w:i,h:l}=o,d=!!s.highContrast,c=i-w.l-w.r,$=l-w.t-w.b;if(ws(r,i,l,s.xLabel,s.yLabel,d,!!s.simple),s.bars){r.fillStyle=s.bars.color,r.globalAlpha=.35;for(let S=0;S<Z;S+=1){const M=pe(S,c,$,s.bars.values[S]??0);r.fillRect(M.x,M.y,M.w,M.h)}r.globalAlpha=1}if((u=s.emphasizeIndices)!=null&&u.length){r.strokeStyle=s.emphasizeColor??"#ee7b66",r.lineWidth=d?3:2.4,r.globalAlpha=.95;for(const S of s.emphasizeIndices){const M=pe(S,c,$,Math.max(((B=s.bars)==null?void 0:B.values[S])??((f=s.curves[0])==null?void 0:f.values[S])??.15,.12));r.strokeRect(M.x-1,M.y-2,M.w+2,M.h+4)}r.globalAlpha=1}if(s.residualAgainst){const{target:S,guess:M,color:z}=s.residualAgainst;r.fillStyle=z,r.globalAlpha=.22,r.beginPath();for(let I=0;I<Z;I+=1){const P=pt(I,c),_=w.t+$-Math.max(0,Math.min(1,S[I]??0))*$;I===0?r.moveTo(P,_):r.lineTo(P,_)}for(let I=Z-1;I>=0;I-=1){const P=pt(I,c),_=w.t+$-Math.max(0,Math.min(1,M[I]??0))*$;r.lineTo(P,_)}r.closePath(),r.fill(),r.globalAlpha=1}for(const S of s.curves){r.strokeStyle=S.color,r.lineWidth=d?2.5:2,r.beginPath();for(let M=0;M<Z;M+=1){const z=pt(M,c),I=w.t+$-Math.max(0,Math.min(1,S.values[M]??0))*$;M===0?r.moveTo(z,I):r.lineTo(z,I)}if(r.stroke(),s.showDots!==!1){r.fillStyle=S.color;for(let M=0;M<Z;M+=1){const z=pt(M,c),I=w.t+$-Math.max(0,Math.min(1,S.values[M]??0))*$;r.beginPath(),r.arc(z,I,s.reducedMotion?2.5:3.2,0,Math.PI*2),r.fill()}}}}function As(e,s,o=!1,r){K(e,{bars:{values:s,color:o?"#444":"#5ec4d1"},curves:[{values:s,color:o?"#111":"#c4a35a"}],xLabel:(r==null?void 0:r.xLabel)??"",yLabel:(r==null?void 0:r.yLabel)??"",highContrast:o,simple:(r==null?void 0:r.simple)??!0})}function Pt(e,s,o=!1){if(o)return s==="zh-Hant"?"看圖樣的山峰與谷底——這些是受體反應通道，不是光譜。":"Look at the peaks and valleys. These are receptor-response channels, not a light spectrum.";const r=e.map((i,l)=>({v:i,i:l})).sort((i,l)=>l.v-i.v).slice(0,3).map(i=>`#${i.i}=${i.v.toFixed(2)}`);return s==="zh-Hant"?`十二通道相對反應；較高：${r.join(", ")}。連線僅為閱讀輔助，不是時間波。`:`Twelve-channel relative responses; peaks: ${r.join(", ")}. The polyline aids reading — it is not a time wave.`}const F=je(),jt=[...Ne];function qs(){try{return Mt(localStorage.getItem(kt))}catch{return Mt(null)}}function J(e){try{localStorage.setItem(kt,JSON.stringify(e))}catch{}}function ve(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")}const Hs=["banana","lemon","rose","coffee","mint","strawberry","chocolate","lavender","orange","cinnamon","apple","vanilla","bread","pine","popcorn","peach"];function zs(e,s){const o=Hs.indexOf(e);return`<span class="sp-odor-icon" style="background-position:${o>=0?`${o%5*25}% ${Math.floor(o/5)*(100/3)}%`:"0 0"}" role="img" aria-label="${ve(s)}"></span>`}function Ps(e,s,o=.1){const r=[];for(let i=0;i<Math.max(e.length,s.length);i+=1)Math.abs((e[i]??0)-(s[i]??0))>=o&&r.push(i);return r}function H(e,s){const o=Re(e);return o?o.name[s]:e}function Nt(e,s){return e.components.map(o=>`${H(o.odorId,s)} ${o.percent}%`).join(" + ")}function js(e){var Qt,Yt,Xt;const s=document.querySelector("#playArea"),o=document.querySelector("#settingsPanel"),r=document.querySelector("#modeTabs");if(!s||!o||!r)throw new Error("spectrum DOM missing");const i=s,l=o,d=r;let c=qs(),$="practice",u=ce(c.lastDifficulty),B=ut(),f=null,S=[],M=0,z="ready",I=0,P=[],_=[],W=[],X=new Set,G="",T=null,it=!1,q=0,A=[],j="50-50",R=null,_t=!1,ft=!1,nt=!1,rt=0;Tt(c),document.querySelectorAll("[data-close]").forEach(t=>{t.addEventListener("click",()=>{const a=t.dataset.close,n=a?document.querySelector(`#${a}`):null;n==null||n.close()})}),(Qt=document.querySelector("#scienceButton"))==null||Qt.addEventListener("click",()=>{var t;oe(ie(re(),"spectrum")),Gt(),(t=document.querySelector("#scienceDialog"))==null||t.showModal()}),De(()=>{var t;oe(ie(re(),"spectrum")),Gt(),(t=document.querySelector("#scienceDialog"))==null||t.showModal()}),(Yt=document.querySelector("#guideButton"))==null||Yt.addEventListener("click",()=>{var t;$e(),(t=document.querySelector("#guideDialog"))==null||t.showModal()}),window.addEventListener("keydown",t=>{t.key==="Escape"&&document.querySelectorAll("dialog[open]").forEach(a=>a.close())});function Q(){return e.getCopy().spectrum}function E(){return e.getLocale()}function ht(){const t=Q(),a=e.getCopy().gameUi,n=document.querySelector("[data-sp-lead]"),m=document.querySelector("[data-sp-heading]"),g=document.querySelector("[data-sp-science]"),v=document.querySelector("#sp-title"),C=document.querySelector("[data-sp-label]"),k=document.querySelector("#introEyebrow"),x=document.querySelector("#introChips");v&&(v.innerHTML=E()==="en"?"Scent <em>Mixer</em>":t.titleShort),C&&(C.textContent=$t("03")),k&&(k.innerHTML=`<span></span> ${$t("03")}`),document.title=t.title,n&&(n.textContent=t.lead),m&&(m.textContent=t.chooseRun),g&&(g.textContent=a.science),x&&(x.innerHTML=`<span><b>${t.diffJunior}</b></span><span><b>${t.diffEasy}</b></span><span><b>${t.diffHard}</b></span>`),document.querySelectorAll("[data-sp-close]").forEach(p=>{p.textContent=a.close})}function Gt(){const t=Q(),a=document.querySelector("[data-science-title]"),n=document.querySelector("[data-science-body]");a&&(a.textContent=t.scienceTitle),n&&(n.innerHTML=`<p>${t.scienceBody}</p><p class="sp-disclaimer">${Oe.modelDisclaimer[E()]}</p>`)}function $e(){const t=Q(),a=document.querySelector("[data-guide-title]"),n=document.querySelector("[data-guide-body]");a&&(a.textContent=t.guideTitle),n&&(n.innerHTML=`<div class="how-cards" data-testid="how-cards">
        <article><span>01</span><b>${t.how1Title}</b><p>${t.how1Body}</p></article>
        <article><span>02</span><b>${t.how2Title}</b><p>${t.how2Body}</p></article>
        <article><span>03</span><b>${t.how3Title}</b><p>${t.how3Body}</p></article>
      </div>`)}function Tt(t){document.documentElement.classList.toggle("high-contrast",t.highContrast),document.documentElement.classList.toggle("reduced-motion",t.reducedMotion),window.matchMedia("(prefers-reduced-motion: reduce)").matches&&document.documentElement.classList.add("reduced-motion")}function gt(){const t=Q();d.innerHTML=Be({ariaLabel:t.chooseRun,selectedId:$,wrap:!1,tabs:[{id:"practice",label:t.practice},{id:"daily",label:t.daily}]}),d.querySelectorAll("[data-mode]").forEach(a=>{a.addEventListener("click",()=>{$=a.dataset.mode,gt(),et(),ht(),z==="ready"&&ct()})})}function et(){var v,C,k,x,p,y;const t=Q(),a=c.bestByScoreKey[`${u}|${mt}`]??0,n=O(u),m=l.querySelector("#advanced");m&&(m.ontoggle=null),l.innerHTML=`
      <h3>${t.chooseRun}</h3>
      ${Ue({label:t.difficulty,selectedId:u,cards:[{id:"junior",index:"01",label:t.diffJunior,blurb:t.diffJuniorHint,testId:"level-junior"},{id:"easy",index:"02",label:t.diffEasy,blurb:t.diffEasyHint,testId:"level-easy"},{id:"hard",index:"03",label:t.diffHard,blurb:t.diffHardHint,testId:"level-hard"}]})}
      ${_e({summary:t.advanced,open:_t,body:`
          ${$==="practice"?`<div class="seed-row"><label>${t.seed} <input id="seedInput" data-testid="seed" type="text" value="${B}" spellcheck="false" autocomplete="off" /></label><button type="button" class="secondary-button" id="randomSeed">${t.randomizeSeed}</button></div>`:`<p class="illustrative-note" data-testid="daily-note">${t.dailyNote}</p>`}
          <p class="illustrative-note">${t.best}: <strong data-testid="best-score">${a}</strong> (${t.scoreScope})</p>
          <ul class="sp-preset-facts">
            <li>${t.factOdors}: ${n.odorCount}</li>
            <li>${t.factComponents}: ${n.componentCountMin}${n.componentCountMin!==n.componentCountMax?`–${n.componentCountMax}`:""}</li>
            <li>${t.factStep}: ${n.percentStep}%</li>
            <li>${t.factGuesses}: ${n.maxGuesses}</li>
            <li>${t.factModel}: ${n.mixingModel}</li>
          </ul>
          <div class="preference-row">
            <label><input type="checkbox" id="reducedMotion" ${c.reducedMotion?"checked":""} /> ${t.reducedMotion}</label>
            <label><input type="checkbox" id="highContrast" ${c.highContrast?"checked":""} /> ${e.getCopy().shell.highContrast}</label>
          </div>
          <button type="button" class="text-button" id="clearData">${t.clearData}</button>
          <button type="button" class="text-button" id="replayTutorialBtn">${t.replayTutorial}</button>
        `})}
    `,l.querySelectorAll("[data-level]").forEach(b=>{b.addEventListener("click",()=>{u=ce(b.dataset.level),c={...c,lastDifficulty:u},J(c),et(),ht(),z==="ready"&&ct()})}),(v=l.querySelector("#seedInput"))==null||v.addEventListener("change",b=>{B=b.target.value.trim()||ut()}),(C=l.querySelector("#randomSeed"))==null||C.addEventListener("click",()=>{B=ut(),et()}),(k=l.querySelector("#reducedMotion"))==null||k.addEventListener("change",b=>{c={...c,reducedMotion:b.target.checked},J(c),Tt(c)}),(x=l.querySelector("#highContrast"))==null||x.addEventListener("change",b=>{c={...c,highContrast:b.target.checked},J(c),Tt(c)}),(p=l.querySelector("#clearData"))==null||p.addEventListener("click",()=>{c=Mt(null),J(c),et()}),(y=l.querySelector("#replayTutorialBtn"))==null||y.addEventListener("click",()=>{c={...c,tutorialSeen:!1},J(c),Jt()});const g=l.querySelector("#advanced");g&&(g.ontoggle=b=>{_t=b.target.open})}function ct(){var g;z="ready";const t=Q(),a=e.getCopy().gameUi,n=$==="daily"?t.daily:t.practice,m=u==="junior"?t.diffJunior:u==="easy"?t.diffEasy:t.diffHard;i.innerHTML=`${dt()?We(e.getCopy().study)+Ht(e.getCopy().study):""}${Ge({kicker:$t("03",`${n} · ${m}`),title:t.titleShort,lead:t.readyLead,startId:"start",startTestId:"start",startLabel:a.startGame})}`,(g=i.querySelector("#start"))==null||g.addEventListener("click",Vt),dt()&&zt(i)}function Vt(){const t=document.querySelector("#seedInput");$==="practice"&&t&&(B=t.value.trim()||ut());const a=()=>{f=$==="daily"?Ms({difficulty:u,signatures:F,odorIds:jt,contentVersion:qt}):Cs({difficulty:u,signatures:F,odorIds:jt,contentVersion:qt,seed:B}),c=as(c,f.meta.seed),J(c),S=[],T=null,it=!1,ft=!1,nt=!1,rt&&window.clearTimeout(rt),q=0,A=[],j="50-50",M=Date.now(),_=[],c={...c,lastDifficulty:u},J(c),Se(f.puzzle.poolIds),Et(),c.tutorialSeen?wt():Jt()};if(!dt()){a();return}const n=e.getCopy().study,m=E();R=Qe({gameId:"spectrum",gameVersion:Rt,contentVersion:qt,locale:m,selectedDifficulty:u}),St(R);const g=Ye("spectrum");i.innerHTML=ne({title:n.preTitle,lead:n.preLead,items:g,locale:m,copy:n,submitLabel:n.continue}),ae(i,{items:g,session:R,phaseFor:()=>"pre",onDone:v=>{R=v,St(R),a()}})}function Se(t){const a=t??(f==null?void 0:f.puzzle.poolIds)??jt.slice(0,O(u).odorCount);u==="junior"?(P=a.map(n=>({odorId:n,selected:!1,percent:0})),A=[],j="50-50"):P=a.map((n,m)=>({odorId:n,selected:m<2,percent:m===0?60:m===1?40:0})),G=""}function lt(){for(const a of P)a.percent=0,a.selected=!1;if(A.length!==2)return;const t=j==="25-75"?[25,75]:j==="75-25"?[75,25]:[50,50];A.forEach((a,n)=>{const m=P.find(g=>g.odorId===a);m&&(m.percent=t[n],m.selected=!0)})}function bt(){return P.filter(t=>t.percent>0).map(t=>({odorId:t.odorId,percent:t.percent}))}function Et(){if(!f){_=[],W=[],X=new Set;return}_.length===0&&(_=ge({odorIds:[...f.puzzle.poolIds],preset:O(u)}));const t=S.map(a=>({guess:a.guess,ab:{a:a.a,b:a.b}}));W=t.length===0?_:$s(_,{history:t,poolIds:f.puzzle.poolIds}),X=new Set(W.flatMap(a=>a.components.map(n=>n.odorId)))}function Ft(){return bt().reduce((t,a)=>t+a.percent,0)}function Jt(){z="tutorial",I=0,yt()}function yt(){var k,x,p;const t=Q(),n=[{title:t.tut1Title,body:t.tut1Body,demo:"single"},{title:t.tut2Title,body:t.tut2Body,demo:"mix"},{title:t.tut3Title,body:t.tut3Body,demo:"infer"}][I];i.innerHTML=`
      <div class="tutorial-state" data-testid="tutorial" data-tutorial-step="${I}">
        <p class="sp-step-label">${t.tutorial} ${I+1}/3</p>
        <h3>${n.title}</h3>
        <p>${n.body}</p>
        <p class="sp-axis-note">${t.axisNote}</p>
        <canvas class="sp-canvas" data-tut-canvas width="640" height="220" aria-label="${t.chartAria}"></canvas>
        <p class="sr-only" data-tut-sr></p>
        <div class="sp-actions">
          <button type="button" class="text-button" id="skipTutorial" data-testid="skip-tutorial">${t.skipTutorial}</button>
          ${I>0?`<button type="button" class="ghost-button" id="tutPrev">${t.back}</button>`:""}
          <button type="button" class="primary-button" id="tutNext" data-testid="tut-next">${I<2?t.next:t.startPlay}</button>
        </div>
      </div>
    `;const m=i.querySelector("[data-tut-canvas]");let v=F.get("banana");(n.demo==="mix"||n.demo==="infer")&&(v=fe(Dt([{odorId:"banana",percent:60},{odorId:"lemon",percent:40}]),F)),K(m,{bars:{values:v,color:"#6ecf8a"},curves:[{values:v,color:"#c4a35a"}],xLabel:t.xAxis,yLabel:t.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion});const C=i.querySelector("[data-tut-sr]");C&&(C.textContent=Pt(v,E())),(k=i.querySelector("#skipTutorial"))==null||k.addEventListener("click",()=>{c={...c,tutorialSeen:!0},J(c),wt()}),(x=i.querySelector("#tutPrev"))==null||x.addEventListener("click",()=>{I=Math.max(0,I-1),yt()}),(p=i.querySelector("#tutNext"))==null||p.addEventListener("click",()=>{I<2?(I+=1,yt()):(c={...c,tutorialSeen:!0},J(c),wt())})}function wt(){z="play",D()}function D(){var Zt,te,ee;if(!f)return;Et(),u==="junior"&&lt();const t=Q(),a=O(u),n=a.maxGuesses-S.length,m=f.puzzle.observedSignal,g=Ft(),v=bt(),k=xt(v,{minPercent:a.minPercent,percentStep:a.percentStep,componentCountMin:a.componentCountMin,componentCountMax:a.componentCountMax}).ok&&n>0,x=u==="junior",p=[...X].map(N=>H(N,E())).sort((N,At)=>N.localeCompare(At)),y=`
      <p class="sp-candidates" data-testid="candidates">
        ${t.candidatesLeft}: <strong data-testid="candidate-count">${W.length}</strong>
        · ${t.candidateOdors}: <span data-testid="candidate-odors">${p.length?p.join(", "):"—"}</span>
      </p>`,b=q>=2?Ts(W):null,h=q>=3&&f?de({surviving:W,observedSignal:f.puzzle.observedSignal,signatures:F,difficulty:u,seed:f.meta.seed}):[],L=q<3?`<button type="button" class="text-button" id="useHint" data-testid="use-hint" aria-label="${t.hint}">${t.hint}</button>`:"",U=T?`<p class="sp-child-fb" data-testid="feedback" data-ab="${T.a}A${T.b}B">${ke(T,t)}</p>`:"",V=T?Kt(T,t,{animate:nt,overlay:!x}):"",Y=Ce(t),vt=`
      <details class="sp-more" data-testid="more-details"${ft?" open":""}>
        <summary>${t.moreDetails}</summary>
        ${T?Me(T,t):""}
        ${T?Ie(T,t):""}
        ${y}
        <section class="sp-history" data-testid="history">
          <button type="button" class="text-button" id="toggleHistory" data-testid="toggle-history" aria-expanded="${it}">
            ${t.history} (${S.length})
          </button>
          <div class="sp-history-scroll" ${it?"":"hidden"}>
            <table class="sp-history-table">
              <thead><tr><th>#</th><th>${t.guess}</th><th>A/B</th><th>${t.signalFit}</th></tr></thead>
              <tbody>
                ${S.length===0?`<tr><td colspan="4">${t.noHistory}</td></tr>`:S.map(N=>`<tr><td>${N.index}</td><td>${Nt(N.guess,E())}</td><td>${N.a}A${N.b}B</td><td>${N.fit}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>
        <p class="sp-muted">${t.seed}: <code data-testid="play-seed">${f.meta.seed}</code></p>
        <p class="sp-muted" data-testid="channel-note">${x?t.channelNotSpectrum:t.axisNote}</p>
      </details>`;i.innerHTML=`
      <div class="play-state${x?" is-junior":""}" data-testid="play">
        <div class="sp-status">
          <span>${t.remaining}: <strong data-testid="remaining">${n}</strong></span>
          ${a.revealComponentCount?`<span data-testid="mix-count">${t.componentCount}: <strong>${f.puzzle.truth.components.length}</strong></span>`:""}
          ${L}
        </div>
        ${U}
        <div class="sp-pattern-stack" data-testid="pattern-stack">
          <div class="sp-pattern-row is-question">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${t.patternQuestion}</span>
              <strong title="${x?t.channelNotSpectrum:t.axisNote}">${t.targetSignal}</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" id="targetCanvas" width="640" height="168" aria-label="${t.chartAria}"></canvas>
              <p class="sr-only" id="targetSr"></p>
            </div>
          </div>
          ${V}
          ${x?"":`<div id="builderSlots" class="sp-pattern-options">${we(t)}</div>`}
        </div>
        ${Y}
        ${q>0?Le(t,b,h):""}

        <section class="sp-builder" aria-label="${t.builder}" data-testid="builder">
          ${x?Te(t):`<div class="sp-builder-head">
            <h3>${t.builder}</h3>
          </div>
          <p class="sp-sum" data-testid="sum-line">${t.sum}: <strong data-testid="sum">${g}</strong>/100
            ${g!==100?`<span class="sp-warn">${t.sumNeed100}</span>`:""}</p>
          ${G?`<p class="sp-autofill-note" data-testid="autofill-note" role="status">${G}</p>`:""}
          <div class="sp-actions">
            <button type="button" class="ghost-button" id="autofill" data-testid="autofill">${t.autofill}</button>
            <button type="button" class="primary-button" id="submitGuess" data-testid="submit" ${k?"":"disabled"}>${t.submit}</button>
          </div>`}
        </section>
        ${vt}
      </div>
    `,K(i.querySelector("#targetCanvas"),{bars:{values:m,color:"#5ec4d1"},curves:[{values:m,color:"#c4a35a"}],xLabel:x?t.channelTitle:t.xAxis,yLabel:t.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,simple:x});const at=i.querySelector("#targetSr");if(at&&(at.textContent=Pt(m,E(),x)),T&&(Wt(T,f.puzzle.observedSignal,t,x,!x),nt))for(const N of T.guess.components)(Zt=i.querySelector(`[data-testid="odor-card-${N.odorId}"]`))==null||Zt.classList.add("is-submit-flash"),(ee=(te=i.querySelector(`[data-testid="percent-${N.odorId}"]`))==null?void 0:te.closest(".sp-pattern-row"))==null||ee.classList.add("is-submit-flash");a.showSignatureHints&&i.querySelectorAll("[data-hint-canvas]").forEach(N=>{const At=N.dataset.hintCanvas,se=F.get(At);se&&As(N,se,c.highContrast,{xLabel:x?t.channelTitle:t.xAxis,yLabel:t.yAxis,simple:x})}),Ae(t)}function xe(t){const a=E();return t.components.map((n,m)=>{const g=H(n.odorId,a),v=`<span class="sp-mix-chip">${zs(n.odorId,g)} <strong>${ve(g)}</strong> ${n.percent}%</span>`;return m===0?v:`<span class="sp-mix-plus" aria-hidden="true">+</span>${v}`}).join("")}function Kt(t,a,n){return`
      <section class="sp-last-guess${n.animate&&!c.reducedMotion?" is-entering":""}" data-testid="last-guess">
        <div class="sp-last-guess-head">
          <span class="sp-pattern-kicker">${a.lastGuessTitle}</span>
          <div class="sp-last-mix" data-testid="last-guess-mix">${xe(t.guess)}</div>
        </div>
        <div class="sp-guess-compare">
          <div class="sp-pattern-row is-compare">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${a.lastGuessTarget}</span>
              <strong>${a.targetSignal}</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" id="lastTargetCanvas" width="640" height="148" aria-label="${a.chartAria}"></canvas>
            </div>
          </div>
          <div class="sp-pattern-row is-result">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${a.lastGuessYours}</span>
              <strong>${a.patternGuess}</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" id="guessCanvas" data-testid="guess-chart" width="640" height="148" aria-label="${a.chartAria}"></canvas>
            </div>
          </div>
          ${n.overlay?`<div class="sp-pattern-row is-overlay">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${a.overlayCompare}</span>
              <strong>${a.guessCurve}</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" id="overlayCanvas" width="640" height="148" aria-label="${a.chartAria}"></canvas>
              <ul class="sp-legend">
                <li><span class="swatch" style="background:#c4a35a"></span>${a.targetCurve}</li>
                <li><span class="swatch" style="background:#6ecf8a"></span>${a.guessCurve}</li>
              </ul>
            </div>
          </div>`:""}
        </div>
      </section>
    `}function Ce(t){return S.length===0?"":`
      <section class="sp-history-cards" data-testid="guess-history">
        ${S.map(a=>`
          <button type="button" class="sp-history-card${(T==null?void 0:T.index)===a.index?" is-active":""}" data-history-card="${a.index}" data-testid="history-card-${a.index}">
            <span class="sp-pattern-kicker">${t.tryLabel.replace("{n}",String(a.index))}</span>
            <span class="sp-history-mix">${a.guess.components.map(n=>H(n.odorId,E())).join(" + ")}</span>
            <canvas class="sp-mini-canvas" data-mini-history="${a.index}" width="220" height="56" aria-hidden="true"></canvas>
          </button>`).join("")}
      </section>
    `}function Wt(t,a,n,m,g){const v=Ps(a,t.guessSignal),C=i.querySelector("#lastTargetCanvas"),k=i.querySelector("#guessCanvas");C&&K(C,{bars:{values:a,color:"#5ec4d1"},curves:[{values:a,color:"#c4a35a"}],xLabel:m?n.channelTitle:n.xAxis,yLabel:n.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,simple:m}),k&&K(k,{bars:{values:t.guessSignal,color:"#6ecf8a"},curves:[{values:t.guessSignal,color:"#27856a"}],xLabel:m?n.channelTitle:n.xAxis,yLabel:n.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,simple:m,emphasizeIndices:v,emphasizeColor:"#ee7b66"});const x=i.querySelector("#overlayCanvas");g&&x&&K(x,{curves:[{values:a,color:"#c4a35a"},{values:t.guessSignal,color:"#6ecf8a"}],xLabel:n.xAxis,yLabel:n.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,emphasizeIndices:v,emphasizeColor:"#ee7b66"}),i.querySelectorAll("[data-mini-history]").forEach(p=>{const y=Number(p.dataset.miniHistory),b=S.find(h=>h.index===y);b&&K(p,{bars:{values:b.guessSignal,color:"#6ecf8a"},curves:[{values:b.guessSignal,color:"#27856a"}],xLabel:"",yLabel:"",highContrast:c.highContrast,reducedMotion:!0,simple:!0,showDots:!1})})}function Me(t,a){return`
      <div class="sp-pattern-row is-result">
        <div class="sp-pattern-meta">
          <span class="sp-pattern-kicker">${a.patternGuess}</span>
          <strong>${t.a}A${t.b}B</strong>
          <span class="sp-muted">${a.signalFit} ${t.fit}</span>
        </div>
      </div>
    `}function ke(t,a){return t.a>=2&&t.b>0?a.fbBothProportions:t.a===1?a.fbFoundOneOfTwo:t.b>0&&t.fit>=80?a.fbPatternClose:a.fbTryPair}function Ie(t,a){return`
      <section class="sp-feedback" data-testid="feedback-panel" aria-live="assertive">
        <details class="sp-tech-details" data-testid="tech-details">
          <summary>${a.techDetails}</summary>
          <p data-testid="ab-result"><strong>${t.a}A${t.b}B</strong> · ${a.signalFit}: <strong data-testid="fit-score">${t.fit}</strong></p>
          <p class="sp-muted">${a.abBlind}</p>
        </details>
      </section>
    `}function Le(t,a,n){const m=q>=1?le(W):[],g=q>=2&&f?f.puzzle.poolIds.filter(k=>!X.has(k)):[],v=q>=2&&a?`<p class="sp-hint-banner" data-testid="hint-reveal">
            ${a.inAll?t.hintRevealSure.replace("{odor}",H(a.odorId,E())):t.hintRevealMaybe.replace("{odor}",H(a.odorId,E()))}
            ${g.length?`<span data-testid="hint-eliminated"> ${t.hintEliminated}: ${g.map(k=>H(k,E())).join(", ")}</span>`:""}
          </p>`:"",C=q>=3&&n.length?`<div class="sp-hint-mixes" data-testid="hint-mixes">
            <p>${t.hintClosest}</p>
            <div class="sp-hint-mix-grid">
              ${n.map((k,x)=>{const p=ue(k,u);return p?`<button type="button" class="sp-hint-mix" data-hint-mix="${x}" data-testid="hint-mix-${x}">
                    ${Nt(p,E())}
                  </button>`:""}).join("")}
            </div>
          </div>`:"";return`
      <div class="sp-hints" data-testid="hints" data-hint-level="${q}">
        ${q>=1&&m.length?`<p class="sr-only">${t.hintPossible}: ${m.map(k=>H(k,E())).join(", ")}</p>`:""}
        ${v}
        ${C}
        ${q>=3?`<p class="sp-muted">${t.hintsMax}</p>`:""}
      </div>
    `}function Te(t){const a=O(u),n=Ft(),m=a.maxGuesses-S.length,v=xt(bt(),{minPercent:a.minPercent,percentStep:a.percentStep,componentCountMin:a.componentCountMin,componentCountMax:a.componentCountMax}).ok&&m>0,C=E(),k=A.length===2?`${H(A[0],C)} ${j==="25-75"?25:j==="75-25"?75:50}% + ${H(A[1],C)} ${j==="25-75"?75:j==="75-25"?25:50}%`:t.juniorNeedTwo,x=P.map(p=>{const y=A.indexOf(p.odorId),b=y>=0,h=q>=1?new Set(le(W)):null,L=h?h.has(p.odorId):!1,U=h?!h.has(p.odorId):!1,V=a.showSignatureHints?`<canvas class="sp-hint-canvas" data-hint-canvas="${p.odorId}" width="240" height="72" aria-hidden="true"></canvas>`:"";return`<button type="button" class="sp-odor-card${b?" is-picked":""}${L?" is-hint-possible":""}${U?" is-hint-out":""}"
          data-odor-card="${p.odorId}" data-testid="odor-card-${p.odorId}" aria-pressed="${b}" title="${H(p.odorId,C)}">
          <strong class="sp-odor-card-name">${H(p.odorId,C)}</strong>
          ${b?`<span class="sp-odor-order">${y+1}</span>`:""}
          ${V}
        </button>`}).join("");return`
      <div class="sp-junior-builder" data-testid="junior-builder">
        <div class="sp-odor-cards" role="group" aria-label="${t.how1Title}">${x}</div>
        <p class="sp-mix-preview" data-testid="junior-mix">${k}</p>
        <div class="sp-ratio-row" role="group" aria-label="${t.how2Title}">
          <button type="button" class="sp-ratio-btn${j==="25-75"?" is-on":""}" data-ratio="25-75" data-testid="ratio-25-75" aria-pressed="${j==="25-75"}">25 / 75</button>
          <button type="button" class="sp-ratio-btn${j==="50-50"?" is-on":""}" data-ratio="50-50" data-testid="ratio-50-50" aria-pressed="${j==="50-50"}">50 / 50</button>
          <button type="button" class="sp-ratio-btn${j==="75-25"?" is-on":""}" data-ratio="75-25" data-testid="ratio-75-25" aria-pressed="${j==="75-25"}">75 / 25</button>
        </div>
        <div class="sp-actions">
          <button type="button" class="ghost-button" id="swapOdors" data-testid="swap-odors" ${A.length===2?"":"disabled"}>${t.juniorSwap}</button>
        </div>
        <p class="sp-sum" data-testid="sum-line" hidden>${t.sum}: <strong data-testid="sum">${n}</strong>/100</p>
        ${G?`<p class="sp-autofill-note" data-testid="autofill-note" role="status">${G}</p>`:""}
        <div class="sp-actions">
          <button type="button" class="primary-button" id="submitGuess" data-testid="submit" ${v?"":"disabled"}>${t.submit}</button>
        </div>
      </div>
    `}function Ee(t){var n,m;const a=ue(t,u);if(!a)return!1;if(u==="junior"){A=a.components.map(C=>C.odorId);const g=((n=a.components[0])==null?void 0:n.percent)??50,v=((m=a.components[1])==null?void 0:m.percent)??50;g===25&&v===75?j="25-75":g===75&&v===25?j="75-25":j="50-50",lt()}else for(const g of P){const v=a.components.find(C=>C.odorId===g.odorId);g.percent=(v==null?void 0:v.percent)??0,g.selected=g.percent>0}return!0}function we(t){const a=O(u);return P.map((n,m)=>{const g=n.percent>0,v=X.size===0||X.has(n.odorId),C=a.showSignatureHints?`<canvas class="sp-canvas" data-hint-canvas="${n.odorId}" width="640" height="168" aria-label="${t.signatureHint}"></canvas>`:"";return`
          <div class="sp-pattern-row is-option${g?" is-picked":""}${v?"":" is-hint-out"}" data-row="${m}">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${t.patternChoice}</span>
              <div class="sp-odor-name">
                <span>${H(n.odorId,E())}</span>
                <span class="sp-pct-label" data-testid="sel-${n.odorId}">${n.percent}%</span>
              </div>
              <div class="sp-stepper">
                <button type="button" data-dec="${m}" aria-label="${t.stepDown} ${H(n.odorId,E())}">−</button>
                <input type="range" data-range="${m}" data-testid="range-${n.odorId}" min="0" max="100" step="${a.percentStep}" value="${n.percent}" aria-label="${H(n.odorId,E())}" />
                <input type="number" data-num="${m}" data-testid="percent-${n.odorId}" min="0" max="100" step="${a.percentStep}" value="${n.percent}" aria-label="${H(n.odorId,E())} %" />
                <button type="button" data-inc="${m}" aria-label="${t.stepUp} ${H(n.odorId,E())}">+</button>
              </div>
            </div>
            <div class="sp-pattern-chart">${C}</div>
          </div>
        `}).join("")}function Ae(t){var m,g,v,C,k,x;const a=O(u);(m=i.querySelector("#toggleHistory"))==null||m.addEventListener("click",()=>{it=!it,ft=!0,D()}),i.querySelectorAll("[data-history-card]").forEach(p=>{p.addEventListener("click",()=>{const y=Number(p.dataset.historyCard),b=S.find(h=>h.index===y);b&&(T=b,nt=!1,D())})}),(g=i.querySelector('[data-testid="more-details"]'))==null||g.addEventListener("toggle",p=>{ft=p.target.open}),(v=i.querySelector("#useHint"))==null||v.addEventListener("click",()=>{q=Math.min(3,q+1),D()}),i.querySelectorAll("[data-hint-mix]").forEach(p=>{p.addEventListener("click",()=>{const y=Number(p.dataset.hintMix);if(!f)return;const h=de({surviving:W,observedSignal:f.puzzle.observedSignal,signatures:F,difficulty:u,seed:f.meta.seed})[y];h&&Ee(h)&&(G=t.hintAutofillOk,D())})}),i.querySelectorAll("[data-odor-card]").forEach(p=>{p.addEventListener("click",()=>{const y=p.dataset.odorCard;A.indexOf(y)>=0?A=A.filter(h=>h!==y):A.length<2&&(A=[...A,y]),lt(),D()})}),i.querySelectorAll("[data-ratio]").forEach(p=>{p.addEventListener("click",()=>{j=p.dataset.ratio,lt(),D()})}),(C=i.querySelector("#swapOdors"))==null||C.addEventListener("click",()=>{A.length===2&&(A=[A[1],A[0]],lt(),D())}),(k=i.querySelector("#autofill"))==null||k.addEventListener("click",()=>{const p=P.filter(L=>L.percent>0);if(p.length===0){G=t.autofillFail,D();return}const y=p[p.length-1],h=100-p.filter(L=>L.odorId!==y.odorId).reduce((L,U)=>L+U.percent,0);if(h<a.minPercent||h%a.percentStep!==0||h>100)G=t.autofillFail;else{const L=y.percent;y.percent=h,y.selected=!0,G=t.autofillOk.replace("{odor}",H(y.odorId,E())).replace("{from}",String(L)).replace("{to}",String(h))}D()}),(x=i.querySelector("#submitGuess"))==null||x.addEventListener("click",qe);const n=(p,y)=>{const b=a.percentStep;let h=Math.round(y/b)*b;h=Math.max(0,Math.min(100,h)),h>0&&h<a.minPercent&&(h=a.minPercent),P[p].percent=h,P[p].selected=h>0,G="",D()};i.querySelectorAll("[data-inc]").forEach(p=>{p.addEventListener("click",()=>{const y=Number(p.dataset.inc),b=P[y].percent;n(y,b===0?a.minPercent:b+a.percentStep)})}),i.querySelectorAll("[data-dec]").forEach(p=>{p.addEventListener("click",()=>{const y=Number(p.dataset.dec),b=P[y].percent;b<=a.minPercent?n(y,0):n(y,b-a.percentStep)})}),i.querySelectorAll("[data-range]").forEach(p=>{p.addEventListener("change",y=>{const b=Number(y.target.dataset.range);n(b,Number(y.target.value))})}),i.querySelectorAll("[data-num]").forEach(p=>{p.addEventListener("change",y=>{const b=Number(y.target.dataset.num);n(b,Number(y.target.value))})})}function qe(){if(!f)return;const t=O(u);if(S.length>=t.maxGuesses)return;const a=bt(),n=xt(a,{minPercent:t.minPercent,percentStep:t.percentStep,componentCountMin:t.componentCountMin,componentCountMax:t.componentCountMax});if(!n.ok)return;const m=n.canonical,g=he(m,f.puzzle.truth,f.puzzle.poolIds),v=Lt(m,F,t.mixingModel,f.meta.seed),C=Ut(f.puzzle.observedSignal,v.observed),k=new Set(X),x={index:S.length+1,guess:m,a:g.a,b:g.b,fit:C,guessSignal:v.observed,eliminatedOdors:0};S=[...S,x],Et();let p=0;for(const b of k)X.has(b)||(p+=1);x.eliminatedOdors=p,T=x,G="",nt=!0,rt&&window.clearTimeout(rt),rt=window.setTimeout(()=>{var b;nt=!1,(b=i.querySelector(".sp-last-guess"))==null||b.classList.remove("is-entering"),i.querySelectorAll(".is-submit-flash").forEach(h=>h.classList.remove("is-submit-flash"))},c.reducedMotion?80:560);const y=cs(m,f.puzzle.truth)||bs(g,f.puzzle.truth.components.length);if(y||S.length>=t.maxGuesses){He(y);return}D()}function He(t){if(!f)return;z="result";const a=Date.now()-M,n=Is({solved:t,guessesUsed:S.length,difficulty:u,elapsedMs:a,hintsUsed:q});c=os(c,n.scoreKey,n.totalScore),J(c),dt()&&R&&(R=Xe(R,{durationMs:a,numberOfAttempts:S.length,hintsUsed:q,selectedDifficulty:u,outcome:{gameId:"spectrum",spectrum:{guesses:S.length,hintLevel:q,solved:t,difficulty:u}}}),St(R)),ze(t,n)}function ze(t,a){var y,b;if(!f)return;const n=Q(),m=O(u),g=f.puzzle.truth,v=E(),C=g.components.map(h=>{const L=F.get(h.odorId),U=h.percent/100,V=L.map(Y=>Y*U);return`
          <div class="sp-pattern-row is-option">
            <div class="sp-pattern-meta">
              <span class="sp-pattern-kicker">${n.patternChoice}</span>
              <strong>${H(h.odorId,v)} · ${h.percent}%</strong>
            </div>
            <div class="sp-pattern-chart">
              <canvas class="sp-canvas" data-contrib="${h.odorId}" width="640" height="168"></canvas>
              <p class="sr-only">${Pt(V,v)}</p>
            </div>
          </div>
        `}).join(""),k=T?Kt(T,n,{animate:!1,overlay:u!=="junior"}):"",x=m.mixingModel==="linear"?`<div class="sp-pattern-stack" data-testid="result-patterns">
                <div class="sp-pattern-row is-question">
                  <div class="sp-pattern-meta">
                    <span class="sp-pattern-kicker">${n.patternQuestion}</span>
                    <strong>${n.targetSignal}</strong>
                  </div>
                  <div class="sp-pattern-chart">
                    <canvas class="sp-canvas" id="resultTargetCanvas" width="640" height="168" aria-label="${n.chartAria}"></canvas>
                  </div>
                </div>
                ${k}
                ${C}
              </div>`:`<h4>${n.satCompare}</h4>
               <div class="sp-pattern-stack">
                 <div class="sp-pattern-row is-result">
                   <div class="sp-pattern-meta">
                     <span class="sp-pattern-kicker">${n.patternGuess}</span>
                     <strong>${n.satCompare}</strong>
                   </div>
                   <div class="sp-pattern-chart">
                     <canvas class="sp-canvas" id="satCanvas" width="640" height="168"></canvas>
                     <ul class="sp-legend">
                       <li><span class="swatch" style="background:#6ecf8a"></span>${n.linear}</li>
                       <li><span class="swatch" style="background:#5ec4d1"></span>${n.saturated}</li>
                       <li><span class="swatch" style="background:#c4a35a"></span>${n.observed}</li>
                     </ul>
                   </div>
                 </div>
               </div>`,p=[{value:String(a.totalScore),label:n.totalScore,testId:"total-score-metric"},{value:`${a.guessesUsed}/${a.maxGuesses}`,label:n.guessesUsed},{value:String(q),label:n.hintsUsed,testId:"hints-used"}];if(u!=="junior"&&p.push({value:String(a.guessScore),label:n.guessScore,testId:"guess-score"}),i.innerHTML=Ve({testId:"result",extraAttrs:`data-solved="${t}"`,scoreHtml:Fe({score:String(a.totalScore),label:n.totalScore,angle:Math.min(360,a.totalScore/1e4*360)}),scoreExtraHtml:`<span data-testid="total-score" class="sr-only">${a.totalScore}</span>`,badge:{text:t?n.solved:n.failed,fail:!t},kicker:$t("03"),title:t?n.solved:n.failed,titleTestId:"result-title",leadHtml:`<p>${n.truth}: <strong data-testid="truth">${Nt(g,v)}</strong></p>`,metrics:p,discoveredTitle:n.discoveredTitle,discoveredBody:n.discoveredBody,discoveredTestId:"discovered",extraCopyHtml:x,actionsHtml:`<button type="button" class="primary-button" id="again" data-testid="again">${n.playAgain}</button><button type="button" class="secondary-button" id="toSetup" data-testid="to-setup">${n.backSetup}</button>`,technicalSummary:e.getCopy().gameUi.technicalDetails,technicalHtml:`<p class="sp-disclaimer" data-testid="model-disclaimer">${n.modelDisclaimer}</p>
        <p>${n.seed}: <code>${f.meta.seed}</code></p>
        <p>${n.ruleVersion}: ${f.meta.ruleVersion}</p>
        <p>${n.contentVersion}: ${f.meta.contentVersion}</p>
        <p>${n.gameVersion}: ${f.meta.gameVersion}</p>
        <p>${n.factModel}: ${m.mixingModel}</p>
        <p>${n.guessScore}: ${a.guessScore}${u==="junior"?"":` · ${n.timeScore}: ${a.timeScore}`}</p>
        ${u==="junior"?`<p>${n.juniorNoTime}</p>`:`<p>${n.elapsed}: <strong data-testid="elapsed">${Ls(a.elapsedMs)}</strong></p><p class="illustrative-note">${n.scoreScope}</p>`}
        ${m.mixingModel==="saturatedNoisy"?`<p class="sp-disclaimer" data-testid="noise-disclaimer">${n.noiseDisclaimer}</p>`:""}`}),m.mixingModel==="linear"){const h=i.querySelector("#resultTargetCanvas");h&&K(h,{bars:{values:f.puzzle.observedSignal,color:"#5ec4d1"},curves:[{values:f.puzzle.observedSignal,color:"#c4a35a"}],xLabel:u==="junior"?n.channelTitle:n.xAxis,yLabel:n.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,simple:u==="junior"}),T&&Wt(T,f.puzzle.observedSignal,n,u==="junior",u!=="junior"),i.querySelectorAll("[data-contrib]").forEach(L=>{const U=L.dataset.contrib,V=g.components.find(at=>at.odorId===U),vt=F.get(U).map(at=>at*(V.percent/100));K(L,{bars:{values:vt,color:"#6ecf8a"},curves:[{values:vt,color:"#c4a35a"}],xLabel:u==="junior"?n.channelTitle:n.xAxis,yLabel:n.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion,simple:u==="junior"})})}else{const h=i.querySelector("#satCanvas");h&&K(h,{curves:[{values:f.puzzle.linearSignal,color:"#6ecf8a"},{values:f.puzzle.saturatedSignal??f.puzzle.linearSignal,color:"#5ec4d1"},{values:f.puzzle.observedSignal,color:"#c4a35a"}],xLabel:n.xAxis,yLabel:n.yAxis,highContrast:c.highContrast,reducedMotion:c.reducedMotion})}if((y=i.querySelector("#again"))==null||y.addEventListener("click",()=>{Vt()}),(b=i.querySelector("#toSetup"))==null||b.addEventListener("click",()=>{f=null,gt(),et(),ct()}),dt()&&R){const h=document.createElement("div");h.className="edu-post",i.appendChild(h);const L=e.getCopy().study,U=E(),V=Ze("spectrum");h.innerHTML=ne({title:L.postTitle,lead:L.postLead,items:V,locale:U,copy:L,submitLabel:L.continue,allowSkip:!0})+Ht(L),ae(h,{items:V,session:R,phaseFor:Y=>Y.phase==="pre"?"post":Y.phase,onDone:Y=>{R=Y,St(R),h.innerHTML=`<p data-testid="study-thanks">${L.thanks}</p>${Ht(L)}`,zt(h)}}),zt(h)}}function Pe(){ht(),z==="ready"?(gt(),et(),ct()):z==="tutorial"?yt():z==="play"&&D()}ht(),gt(),et(),ct(),(Xt=e.onReady)==null||Xt.call(e,{refreshReady:Pe})}const It=document.querySelector("#app");if(!It)throw new Error("#app missing");const ot=ts(es());let Ct;const me=ss(It,{homeHref:"../../index.html",actionsHtml:Je(ot.gameUi.howToPlay),onLocaleChange:(e,s)=>{const o=It.querySelector("#guideButton");o&&(o.innerHTML=`<span>?</span> ${s.gameUi.howToPlay}`);try{const r=Mt(localStorage.getItem(kt));localStorage.setItem(kt,JSON.stringify({...r,locale:e}))}catch{}Ct==null||Ct()}}),Ns=ns(It);Ns.innerHTML=`
  <section class="intro" aria-labelledby="sp-title">
    <div class="eyebrow" id="introEyebrow"><span></span> GAME 03</div>
    <h1 id="sp-title">Scent <em>Mixer</em></h1>
    <p id="introLead" data-sp-lead></p>
    <div class="intro-chips" id="introChips" aria-label="Game facts">
      <span><b>Junior</b></span><span><b>Standard</b></span><span><b>Challenge</b></span>
    </div>
  </section>
  <section class="lab" aria-label="Scent Mixer">
    <div class="level-header">
      <div>
        <span class="section-label" data-sp-label>GAME 03</span>
        <h2 data-sp-heading></h2>
      </div>
      <div class="lab-actions">
        ${Ke({id:"scienceButton",extra:"data-sp-science",label:ot.gameUi.science})}
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
        <span class="section-label">${ot.gameUi.science}</span>
        <h2 data-science-title></h2>
      </div>
      <button class="close-button" data-close="scienceDialog" type="button" aria-label="${ot.gameUi.close}">×</button>
    </div>
    <div data-science-body></div>
    <button class="primary-button full-button" data-close="scienceDialog" type="button" data-sp-close></button>
  </dialog>
  <dialog id="guideDialog" class="modal guide-modal">
    <div class="modal-header">
      <div>
        <span class="section-label">${ot.gameUi.howToPlay}</span>
        <h2 data-guide-title></h2>
      </div>
      <button class="close-button" data-close="guideDialog" type="button" aria-label="${ot.gameUi.close}">×</button>
    </div>
    <div data-guide-body></div>
    <button class="primary-button full-button" data-close="guideDialog" type="button" data-sp-close></button>
  </dialog>
`;js({getCopy:()=>me.getCopy(),getLocale:()=>me.getLocale(),onReady:e=>{Ct=e.refreshReady}});
