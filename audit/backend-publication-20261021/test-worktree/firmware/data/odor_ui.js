/* Small, dependency-free charts. Scores are correlations, never probabilities. */
(function(root){
'use strict';
const colors=['#168b80','#6b61b7','#b66a28','#3575b0'];
const zh={'2-heptanone':'2-庚酮','3-octanol':'3-辛醇','benzaldehyde':'苯甲醛','valeric acid':'戊酸'};
function bars(target,scores,enabled,language){
 const nodes=(scores||[]).slice().sort((a,b)=>(b.pearsonR??-2)-(a.pearsonR??-2)).map(s=>{
  const row=document.createElement('div');row.className='odor-bar-row';
  const title=document.createElement('div');title.className='odor-bar-title';
  const label=document.createElement('span');label.textContent=language==='zh'&&zh[s.compound]?zh[s.compound]+' · '+s.compound:s.compound;
  const value=document.createElement('strong'),p=enabled?AeroSession.percent(s.pearsonR):null;value.textContent=p===null?'—':p.toFixed(1)+'%';
  title.append(label,value);const track=document.createElement('div');track.className='odor-bar-track';
  const bar=document.createElement('div');bar.className='odor-bar-fill';bar.style.width=(p||0)+'%';
  row.title=Number.isFinite(s.pearsonR)?'Pearson r = '+s.pearsonR.toFixed(4):'';track.append(bar);row.append(title,track);return row;
 });target.replaceChildren(...nodes);
}
function curve(canvas,data,records,language){
 canvas.hidden=false; // Measure its real responsive width before reading clientWidth.
 const ctx=canvas.getContext('2d'),w=canvas.width=Math.max(300,canvas.clientWidth||1000),h=canvas.height=300;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.font='12px system-ui';
 const ts=data?.timeSec||[],fs=data?.features||[],all=fs.filter(x=>Array.isArray(x)).flat().filter(Number.isFinite).map(x=>x*100);
 if(!all.length){canvas.hidden=true;return false;}canvas.hidden=false;
 const lo0=Math.min(0,...all),hi0=Math.max(0,...all),pad=Math.max((hi0-lo0)*.12,.1),lo=lo0-pad,hi=hi0+pad;
 const left=55,right=w-14,top=28,bottom=258,minT=Math.min(0,...ts),maxT=Math.max(2,...ts);
 const x=t=>left+(t-minT)/(maxT-minT)*(right-left),y=v=>top+(hi-v)/(hi-lo)*(bottom-top);
 ctx.fillStyle='#617181';ctx.fillText('ΔF/F₀ (%)',3,15);
 for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;ctx.strokeStyle='#e5ebef';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y(v));ctx.lineTo(right,y(v));ctx.stroke();ctx.fillText(v.toFixed(1),2,y(v)+4);}
 for(let i=0;i<=4;i++){const t=minT+(maxT-minT)*i/4;ctx.fillText(t.toFixed(0),Math.min(right-14,x(t)-4),278);}
 ctx.fillText(language==='zh'?'時間（秒）':'Time (s)',Math.max(left,(w-70)/2),298);
 for(let j=0;j<4;j++){
  ctx.strokeStyle=colors[j];ctx.fillStyle=colors[j];ctx.lineWidth=2;ctx.beginPath();let pen=false;
  fs.forEach((v,i)=>{if(!v||!Number.isFinite(v[j])){pen=false;return;}
   const gap=i>0&&(ts[i]-ts[i-1]>2.1||(records[i]?.continuousSegment!==records[i-1]?.continuousSegment)||Number(records[i]?.gapBeforeUs)>1000);
   if(pen&&!gap)ctx.lineTo(x(ts[i]),y(v[j]*100));else ctx.moveTo(x(ts[i]),y(v[j]*100));
   ctx.fillRect(x(ts[i])-2,y(v[j]*100)-2,4,4);pen=true;
  });ctx.stroke();
 }
 return true;
}
const api={bars,curve};if(typeof module!=='undefined')module.exports=api;else root.AeroOdorUI=api;
})(globalThis);
