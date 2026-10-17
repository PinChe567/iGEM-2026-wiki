/* One continuous scent current begins softly in research and grows into a galaxy.
   This background is decorative, never experimental data. */
(() => {
 'use strict';
 const host=document.querySelector('[data-scent-continuum]')||document.querySelector('#experience');if(!host)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('div');layer.className='home-scent-current';layer.setAttribute('aria-hidden','true');
 const canvas=document.createElement('canvas');layer.append(canvas);host.prepend(layer);
 const ctx=canvas.getContext('2d');if(!ctx){layer.remove();return;}
 let w=1,h=1,total=1,offset=0,visible=false,frame=0,last=0,time=0,stops=[],experienceY=0,duskStart=0,duskEnd=1,copyBoxes=[],arrival=null,returnStart=0,paperStart=1;
 let seed=2167;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const dots=Array.from({length:9000},()=>{const dot={u:rnd(),v:rnd()-.5,q:rnd(),r:.5+rnd()*1.25};dot.ripple=Math.sin(dot.v*6);return dot;});
 const glow=document.createElement('canvas');glow.width=glow.height=24;
 const gx=glow.getContext('2d'),gradient=gx.createRadialGradient(12,12,0,12,12,12);
 gradient.addColorStop(0,'#fff5d8');gradient.addColorStop(.16,'#eed7a3');gradient.addColorStop(.4,'#b9cfd265');gradient.addColorStop(1,'#b9cfd200');
 gx.fillStyle=gradient;gx.fillRect(0,0,24,24);
 // Paired optic lobes and central neuropil distinguish this schematic insect brain.
 const shapes={
  brain:{label:'FRUIT-FLY BRAIN',path:'M48 42C26 30 8 51 10 78C11 105 32 117 49 101L63 95C77 120 98 110 100 89C102 110 123 120 137 95L151 101C168 117 189 105 190 78C192 51 174 30 152 42L135 56C125 35 108 41 100 54C92 41 75 35 65 56ZM48 43C62 56 60 86 49 101M152 43C138 56 140 86 151 101M74 69C88 57 93 67 93 80M126 69C112 57 107 67 107 80M88 93L95 125M112 93L105 125'},
  neuron:{label:'NEURON · SOMA → AXON',path:'M48 54C57 42 76 43 84 57L95 67L86 80C78 95 62 95 50 83L39 73ZM72 60A10 10 0 1 0 72 80A10 10 0 1 0 72 60M48 56L30 39L21 16M30 39L8 36M52 83L33 101L24 129M33 101L11 104M68 45L73 25L62 9M73 25L88 13M39 73L14 68L3 78M93 71C115 64 134 81 157 71L178 53L194 51M157 71L180 81L197 72M180 81L190 102M178 53L182 32'},
  cell:{label:'LIVING SENSOR',path:'M98 12C141 5 185 23 188 65C198 101 168 135 124 137C78 151 23 123 14 88C0 50 49 16 98 12ZM108 49C138 39 157 62 148 86C142 109 109 113 90 94C70 73 87 52 108 49ZM20 59L36 63M29 106L43 96M160 26L150 40M181 88L165 85'},
  banana:{label:'AN ODOR SOURCE',path:'M31 16C17 76 58 137 124 130C163 126 188 102 192 78C150 108 94 91 72 62C53 40 53 28 51 17L47 5L33 7ZM48 30C53 88 116 123 175 99'}
 };
 function samplePath(shape){
  const c=document.createElement('canvas');c.width=210;c.height=150;const x=c.getContext('2d');
  x.strokeStyle='#fff';x.lineWidth=2.8;x.lineJoin='round';x.stroke(new Path2D(shape.path));
  const data=x.getImageData(0,0,210,150).data,points=[];
  for(let y=2;y<148;y+=2)for(let xx=2;xx<208;xx+=2)if(data[(y*210+xx)*4+3]>80)points.push([xx,y]);
  return {...shape,points,path:new Path2D(shape.path)};
 }
 Object.keys(shapes).forEach(key=>shapes[key]=samplePath(shapes[key]));
 const fly=new Image();fly.crossOrigin='anonymous';fly.onload=()=>{
  const c=document.createElement('canvas');c.width=c.height=180;const x=c.getContext('2d');x.drawImage(fly,0,0,180,180);
  const d=x.getImageData(0,0,180,180).data,points=[];
  for(let y=2;y<178;y+=2)for(let xx=2;xx<178;xx+=2){const i=(y*180+xx)*4+3;
   if(d[i]>110&&(d[i-8]<110||d[i+8]<110||d[i-1440]<110||d[i+1440]<110))points.push([xx*1.12,y*.82]);
  }
  shapes.fly={label:'THE FRUIT FLY',points};wake();
 };fly.src='https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/d9638484592a-logo-fly-cutout.webp';
 function quiet(){return reduced.matches;}
 function refreshViewport(rect=host.getBoundingClientRect()){
  const wasVisible=visible;
  visible=rect.width>0&&total>0&&rect.top<innerHeight&&rect.top+total>0;
  offset=Math.max(0,Math.min(Math.max(0,total-h),-rect.top));
  // Keep the small bitmap in the viewport without relying on nested sticky paint.
  canvas.style.transform='translate3d(0,'+offset+'px,0)';
  return wasVisible!==visible;
 }
 function measure(){
  const rect=host.getBoundingClientRect();w=rect.width;h=Math.min(innerHeight,1000);total=rect.height;
  const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
  stops=[...host.querySelectorAll('.home-xp')].map((p,i)=>({y:p.getBoundingClientRect().top-rect.top+30,kind:['fly','brain','neuron'][i]}));
  const experience=host.querySelector('#experience')?.getBoundingClientRect(),landscape=host.querySelector('.home-flight-cover')?.getBoundingClientRect(),play=host.querySelector('.home-xp--pixel')?.getBoundingClientRect();
  experienceY=experience?experience.top-rect.top:0;
  duskStart=landscape?landscape.bottom-rect.top-40:experienceY+650;
  duskEnd=play?play.top-rect.top+210:duskStart+700;
  host.style.setProperty('--scent-experience-start',experienceY+'px');
  host.style.setProperty('--scent-dusk-start',duskStart+'px');
  host.style.setProperty('--scent-dusk-middle',(duskStart+(duskEnd-duskStart)*.55)+'px');
  host.style.setProperty('--scent-night-start',duskEnd+'px');
  // The same canvas continues behind the people heading and lands at the team
  // photo. Both sections share one transparent drawing plane and color ground.
  const fieldwork=host.querySelector('.home-fieldwork'),photo=fieldwork?.querySelector('.identity-flight__photo');
  if(fieldwork&&photo){
   const ends=[...host.querySelectorAll('.home-xp--lab .home-xp__art,.home-xp--lab .home-xp__copy')].map(el=>el.getBoundingClientRect().bottom-rect.top);
   const field=fieldwork.getBoundingClientRect(),pr=photo.getBoundingClientRect(),tail=parseFloat(getComputedStyle(fieldwork).paddingTop)||85;
   returnStart=Math.max(...ends)+24;paperStart=field.top-rect.top+tail;
   arrival={y:pr.top-rect.top+12,x:pr.left-rect.left+pr.width*(w<700?.88:.68)};
   total=arrival.y;layer.style.height=total+'px';
   layer.style.setProperty('--scent-arrival-x',arrival.x+'px');layer.style.setProperty('--scent-arrival-y',arrival.y+'px');
   host.style.setProperty('--scent-return-start',returnStart+'px');host.style.setProperty('--scent-paper-start',paperStart+'px');
  }
  copyBoxes=[...host.querySelectorAll('.home-xp__copy,#experience>.home-shell h2,.home-demo-kicker,.home-odor-result,.home-demo-note,.home-odor-choices')].map(el=>{const r=el.getBoundingClientRect();return{x:r.left-rect.left,y:r.top-rect.top,width:r.width,height:r.height};});
  // Remove star ink only under the lettering, leaving the surrounding current
  // free to keep the same loose spread as the earlier sections.
  for(const el of host.querySelectorAll('.home-identity__head>*')){const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();copyBoxes.push({x:r.left-rect.left,y:r.top-rect.top,width:r.width,height:r.height,pad:12});}
  refreshViewport(rect);wake();
 }
 function originalCenter(y,t=0){
  const ripple=Math.sin(y*.012+t*.00013)*w*.022+Math.sin(y*.026-t*.00017)*w*.012;
  const join=.5+.41*Math.sin(.5);
  if(y<experienceY){const progress=ease(y/Math.max(1,experienceY));return w*(.84+(join-.84)*progress)+ripple;}
  const span=(stops[2]?.y-stops[0]?.y)/2||700,phase=(y-experienceY)/span*Math.PI+.5;
  return w*(.5+.41*Math.sin(phase))+ripple;
 }
 const clamp=n=>Math.max(0,Math.min(1,n));
 const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
 function center(y,t=0){
  if(!arrival||y<=returnStart)return originalCenter(y,t);
  const p=ease((y-returnStart)/Math.max(1,arrival.y-returnStart));
  return originalCenter(y,t)*(1-p)+arrival.x*p;
 }
 function strength(y){return (.16+.84*ease((y-experienceY+650)/1050))*ease(y/300)*(arrival?1:ease((total-y)/280));}
 const tintDay=[[82,111,83],[143,106,46]],tintNight=[[220,230,207],[239,208,149]],tintPaper=[[64,104,73],[138,105,49]];
 function tintChannel(a,b,paper,p,q){return Math.round((a+(b-a)*p)*(1-q)+paper*q);}
 function tone(y,gold=false,alpha=1){
  const p=ease((y-duskStart)/Math.max(1,duskEnd-duskStart));
  const index=gold?1:0,a=tintDay[index],b=tintNight[index],paper=tintPaper[index],q=arrival?ease((y-returnStart)/Math.max(1,paperStart-returnStart)):0;
  return `rgba(${tintChannel(a[0],b[0],paper[0],p,q)},${tintChannel(a[1],b[1],paper[1],p,q)},${tintChannel(a[2],b[2],paper[2],p,q)},${alpha})`;
 }
 // Orthographic depth projection and Fibonacci directions adapted from
 // thinking-orbs (Jakub Antalik, MIT). See assets/licenses/thinking-orbs.txt.
 // Each readable silhouette holds before dissolving into a rotating sphere
 // and resolving into the next shape. The illustrations are conceptual.
 const sequence=['fly','brain','neuron','cell','banana'];
 // Fixed sphere coordinates and projection storage preserve the authored order
 // before each stable depth sort, without allocating another cloud per frame.
 const motifPools=new Map();
 function motifPool(n){
  if(!motifPools.has(n)){
   const samples=Array.from({length:n},(_,i)=>{const fy=1-2*(i+.5)/n;return{fy,fr:Math.sqrt(1-fy*fy),fa:i*Math.PI*(3-Math.sqrt(5)),z:Math.sin(i*2.3)*5,point:{x:0,y:0,z:0,light:0,r:0}};});
   motifPools.set(n,{samples,points:new Array(n)});
  }
  return motifPools.get(n);
 }
 function motif(index,cx,cy,size){
  if(cy+size<0||cy-size>h)return;
  const phase=(quiet()?index*7:(time/1000+index*7))/7;
  const slot=Math.floor(phase),local=phase-slot,p=Math.max(0,Math.min(1,(local-.63)/.37));
  const smooth=p*p*(3-2*p),cloud=Math.sin(Math.PI*smooth);
  const shape=shapes[sequence[slot%sequence.length]]||shapes.cell;
  const next=shapes[sequence[(slot+1)%sequence.length]]||shapes.cell;
  if(!shape.points.length||!next.points.length)return;
  const n=w<700?260:440,scale=size/210,angle=Math.sin(time*.00023+index)*.18+cloud*.65;
  const c=Math.cos(angle),s=Math.sin(angle),{samples,points}=motifPool(n);
  for(let i=0;i<n;i++){
   const a=shape.points[(i*131)%shape.points.length],b=next.points[(i*131)%next.points.length];
   const sample=samples[i],fy=sample.fy,fr=sample.fr,fa=sample.fa+time*.0005;
   let x=(a[0]+(b[0]-a[0])*smooth-105)*(1-cloud*.65)+fr*Math.cos(fa)*90*cloud;
   let y=(a[1]+(b[1]-a[1])*smooth-75)*(1-cloud*.65)+fy*85*cloud;
   const z=fr*Math.sin(fa)*70*cloud+sample.z;
   const depth=-x*s+z*c;x=x*c+z*s;
   const point=sample.point;point.x=cx+x*scale;point.y=cy+y*scale;point.z=depth;point.light=.63+depth/270;point.r=(i%11?1:1.65)*scale;points[i]=point;
  }
  points.sort((a,b)=>a.z-b.z);
  const motifStrength=strength(cy+offset),motifInk=tone(cy+offset),motifGold=tone(cy+offset,true);
  for(let i=0;i<points.length;i++){const p=points[i];ctx.globalAlpha=Math.min(1,p.light)*motifStrength;ctx.fillStyle=i%7===0?motifGold:motifInk;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.7,p.r),0,Math.PI*2);ctx.fill();}
  const label=(smooth>.5?next:shape).label;
  ctx.globalAlpha=.82*(1-cloud)*motifStrength;ctx.fillStyle=motifInk;ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(window.AeroSenseI18n?.t(label)||label,cx,cy+size*.48);ctx.globalAlpha=1;
 }
 const lineCenters=[];
 function draw(){
  ctx.clearRect(0,0,w,h);const t=quiet()?0:time;
  const start=-25;
  // All eighteen strands share the same moving center and two identical inks.
  for(let yy=start,k=0;yy<h+25;yy+=8,k++)lineCenters[k]=center(yy+offset,t);
  const lineInks=[false,true].map(gold=>{const ink=ctx.createLinearGradient(0,0,0,h);for(let k=0;k<=8;k++){const y=offset+h*k/8;ink.addColorStop(k/8,tone(y,gold,.2*strength(y)));}return ink;});
  for(let j=0;j<18;j++){ctx.beginPath();for(let yy=start,k=0;yy<h+25;yy+=8,k++){const y=yy+offset,taper=32+55*(.5+.5*Math.sin(y*.008+j));
   const x=lineCenters[k]+Math.sin(y*.014+j*.35+t*.0002)*taper+(j-9)*7;
   if(yy===start)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}
   ctx.strokeStyle=lineInks[j%3===0?1:0];ctx.globalAlpha=1;ctx.lineWidth=j%2?.8:1.2;ctx.stroke();}
  const n=w<700?4200:9000;
  for(let i=0;i<n;i++){const p=dots[i],y=(p.u*total+t*.012)%total,yy=y-offset;if(yy<start||yy>h+15)continue;
   const width=(w<700?60:110)+95*(.5+.5*Math.sin(y*.009))**2,ripple=Math.sin(y*.028+t*.0004+p.q*7)*42*p.ripple;
   const x=center(y,t)+p.v*width*2+ripple;ctx.globalAlpha=(.27+p.q*.65)*(1-Math.abs(p.v))*strength(y);
   if(p.q>.93&&y>duskStart&&(!arrival||y<returnStart))ctx.drawImage(glow,x-10,yy-10,20,20);
   else{ctx.fillStyle=tone(y,i%7===0);ctx.beginPath();ctx.arc(x,yy,p.r,0,Math.PI*2);ctx.fill();}}
  stops.forEach((stop,i)=>motif(i,w*(i%2?.37:.63),stop.y-offset,w<700?160:255));
  // Erase only star ink beneath text. The page background remains continuous;
  // no colored vignette or rectangular panel is placed behind the lettering.
  ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;
  for(const box of copyBoxes){const cy=box.y-offset+box.height/2;if(cy+box.height<0||cy-box.height>h)continue;ctx.save();ctx.translate(box.x+box.width/2,cy);ctx.scale((box.width+(box.pad??120))/2,(box.height+(box.pad??100))/2);const fade=ctx.createRadialGradient(0,0,.25,0,0,1);fade.addColorStop(0,'#000');fade.addColorStop(.58,'#000e');fade.addColorStop(1,'#0000');ctx.fillStyle=fade;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=1;
 }
 function tick(now){frame=0;if(!visible||document.hidden)return;if(!last||now-last>=40){time+=last?Math.min(80,now-last):0;last=now;draw();}if(!quiet())frame=requestAnimationFrame(tick);}
 function wake(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;if(visible&&!document.hidden){draw();if(!quiet())frame=requestAnimationFrame(tick);}}
 new IntersectionObserver(()=>{refreshViewport();wake();}).observe(host);new ResizeObserver(measure).observe(host);
 addEventListener('scroll',()=>{const changed=refreshViewport();if(changed)wake();else if(visible&&quiet())draw();},{passive:true});
 addEventListener('resize',measure,{passive:true});addEventListener('load',measure,{once:true});document.addEventListener('visibilitychange',()=>{refreshViewport();wake();});reduced.addEventListener('change',wake);
 let wasQuiet=quiet();new MutationObserver(()=>{const q=quiet();if(q!==wasQuiet){wasQuiet=q;wake();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('aerosense:languagechange',wake);
 measure();
})();
