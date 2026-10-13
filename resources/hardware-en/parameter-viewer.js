/* Plot recorded scalar results only; no simulated geometry or interpolated fit. */
(() => {
  'use strict';
  const cfg = JSON.parse(document.getElementById('viewer-data').textContent);
  const canvas = document.getElementById('parameter-canvas');
  const ctx = canvas.getContext('2d');
  const selector = document.getElementById('case-select');
  const yaw = document.getElementById('yaw');
  const tilt = document.getElementById('tilt');
  const info = document.getElementById('selected-result');
  let projected = [], selected = cfg.selected || 0, pointer = null;
  const ranges = cfg.axes.map(a => {
    const vals = cfg.rows.map(r => Number(r[a.key])).filter(Number.isFinite);
    return [Math.min(...vals), Math.max(...vals)];
  });
  const fmt = v => Number.isFinite(Number(v)) ? Number(v).toLocaleString('en-US',{maximumSignificantDigits:5}) : v;
  cfg.rows.forEach((r, i) => {
    const option = document.createElement('option'); option.value=i;
    option.textContent=cfg.labelKeys.map(k=>`${k}: ${r[k]}`).join(' · ');
    selector.append(option);
  });
  function project(p,w,h) {
    const a=Number(yaw.value)*Math.PI/180, b=Number(tilt.value)*Math.PI/180;
    const x=p[0]*Math.cos(a)-p[1]*Math.sin(a), depth=p[0]*Math.sin(a)+p[1]*Math.cos(a);
    const y=depth*Math.sin(b)-p[2]*Math.cos(b), scale=Math.min(w*.23,h*.30);
    return [w*.5+x*scale,h*.53+y*scale,depth*Math.cos(b)+p[2]*Math.sin(b)];
  }
  function draw() {
    const w=canvas.clientWidth, h=canvas.clientHeight, dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);ctx.font='12px system-ui';
    const origin=project([-1,-1,-1],w,h);
    cfg.axes.forEach((axis,i)=>{
      const end=[-1,-1,-1];end[i]=1.15;const p=project(end,w,h);
      ctx.strokeStyle='#536e63';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(origin[0],origin[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();
      ctx.fillStyle='#244135';ctx.textAlign=p[0]>w*.75?'right':p[0]<w*.25?'left':'center';
      ctx.fillText(axis.label,Math.max(8,Math.min(w-8,p[0])),Math.max(16,Math.min(h-8,p[1]+(i===2?-12:20))));
      for(let t=0;t<=4;t++){
        const tick=[-1,-1,-1];tick[i]=-1+t*.5;const q=project(tick,w,h);
        ctx.fillStyle='#64776e';ctx.textAlign='left';ctx.fillText(fmt(ranges[i][0]+(ranges[i][1]-ranges[i][0])*t/4),q[0]+5,q[1]+(i===2?0:12));
      }
    });
    projected=cfg.rows.map((r,i)=>{
      const point=cfg.axes.map((a,j)=>{const span=ranges[j][1]-ranges[j][0];return span?2*(Number(r[a.key])-ranges[j][0])/span-1:0;});
      return {i,p:project(point,w,h),level:(point[2]+1)/2};
    }).sort((a,b)=>a.p[2]-b.p[2]);
    projected.forEach(({i,p,level})=>{
      ctx.beginPath();ctx.arc(p[0],p[1],i===selected?8:5,0,Math.PI*2);
      ctx.fillStyle=i===selected?'#ce571b':`hsl(${164-level*100} 42% ${42+level*12}%)`;ctx.fill();
      ctx.strokeStyle=i===selected?'#3c2d19':'#fff';ctx.lineWidth=i===selected?2:1;ctx.stroke();
      if(i===selected){ctx.fillStyle='#243b31';ctx.textAlign='center';ctx.fillText('Selected case',p[0],p[1]-14);}
    });
  }
  function choose(i) {
    selected=i;selector.value=String(i);info.replaceChildren();
    const dl=document.createElement('dl');
    Object.entries(cfg.rows[i]).forEach(([key,value])=>{
      if(key==='raw_json')return;
      const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;dl.append(dt,dd);
    });info.append(dl);draw();
  }
  selector.addEventListener('change',()=>choose(Number(selector.value)));
  for(const input of [yaw,tilt])input.addEventListener('input',draw);
  document.getElementById('reset-view').addEventListener('click',()=>{yaw.value=35;tilt.value=25;draw();});
  canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
    if(!pointer)return;
    yaw.value=Math.max(-180,Math.min(180,Number(yaw.value)+(e.clientX-pointer.x)*.5));
    tilt.value=Math.max(-60,Math.min(70,Number(tilt.value)+(e.clientY-pointer.y)*.5));
    pointer.x=e.clientX;pointer.y=e.clientY;draw();
  });
  canvas.addEventListener('pointerup',e=>{
    if(pointer && Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)<5){
      const b=canvas.getBoundingClientRect();const found=projected.map(p=>({...p,d:Math.hypot(p.p[0]-e.clientX+b.left,p.p[1]-e.clientY+b.top)})).sort((a,b)=>a.d-b.d)[0];
      if(found && found.d<20)choose(found.i);
    }pointer=null;
  });
  canvas.addEventListener('pointercancel',()=>pointer=null);
  new ResizeObserver(draw).observe(canvas);choose(selected);
})();
