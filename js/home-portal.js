/* The homepage has one doorway, not a second navigation bar. */
(() => {
  'use strict';
  const trigger=document.querySelector('[data-home-menu]');
  const menu=document.querySelector('#home-menu');
  if(!trigger||!menu)return;
  let savedOverflow='';
  let returnSearchFocusToLaunch=false;
  function close(){if(menu.open)menu.close();}
  trigger.addEventListener('click',event=>{
    event.preventDefault();savedOverflow=document.documentElement.style.overflow;
    menu.showModal();document.documentElement.style.overflow='hidden';trigger.setAttribute('aria-expanded','true');
    menu.querySelector('[data-home-menu-close]').focus();
  });
  menu.querySelector('[data-home-menu-close]').addEventListener('click',close);
  menu.addEventListener('close',()=>{document.documentElement.style.overflow=savedOverflow;trigger.setAttribute('aria-expanded','false');});
  // Close before Project Search opens its own dialog, preserving its focus trap.
  menu.addEventListener('click',event=>{
    if(event.target.closest('.btn-search'))returnSearchFocusToLaunch=true;
    if(event.target.closest('a,.fly-toggle'))close();
  },true);
  document.querySelector('#project-search')?.addEventListener('close',()=>{
    // Its original opener is now inside a closed dialog and cannot receive focus.
    if(returnSearchFocusToLaunch&&!menu.open)trigger.focus({preventScroll:true});
    returnSearchFocusToLaunch=false;
  });
  const hero=document.querySelector('.home-wordmark');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const film=document.querySelector('[data-asc]'),filmStage=film?.querySelector('.asc-stage');
  if(filmStage)new IntersectionObserver(entries=>{film.classList.toggle('is-copy-visible',entries[0].isIntersecting);},{threshold:.3}).observe(filmStage);
  const canvases=[...document.querySelectorAll('[data-neural-orb]')];
  canvases.forEach(canvas=>{
    const ctx=canvas.getContext('2d');if(!ctx)return;
    let width=1,height=1,visible=false,frame=0,last=0,time=0;
    const isBrain=!!canvas.closest('dialog');
    const nodes=[],edges=[];
    if(isBrain){
      // Original decorative geometry: paired optic lobes around a central brain.
      // Anatomical reference: https://www.janelia.org/open-science/complete-fly-brain-image
      // This is a stylized shape, not a connectome or experimental reconstruction.
      const golden=Math.PI*(3-Math.sqrt(5));
      const cloud=(cx,cy,cz,rx,ry,rz,count,kind,lean=0)=>{
        for(let i=0;i<count;i++){
          const v=1-2*(i+.5)/count,r=Math.sqrt(1-v*v),a=i*golden;
          const ripple=1+.045*Math.sin(a*3+v*7)+.025*Math.cos(a*5-v*11);
          const x=Math.cos(a)*r*rx*ripple,y=v*ry;
          const nx=Math.cos(a)*r/rx,ny=v/ry,nz=Math.sin(a)*r/rz,norm=Math.hypot(nx,ny,nz);
          nodes.push([cx+x*Math.cos(lean)-y*Math.sin(lean),cy+x*Math.sin(lean)+y*Math.cos(lean),cz+Math.sin(a)*r*rz*ripple,kind,(nx*Math.cos(lean)-ny*Math.sin(lean))/norm,(nx*Math.sin(lean)+ny*Math.cos(lean))/norm,nz/norm]);
        }
      };
      for(const side of [-1,1]){
        // The broad lateral lobes make the insect silhouette legible at a glance.
        cloud(side*1.04,.02,-.04,.48,.64,.30,370,0,side*-.19);
        cloud(side*.34,-.08,0,.49,.49,.38,320,1,side*.12);
        cloud(side*.22,.38,.29,.18,.20,.15,85,2);
      }
      cloud(0,.49,-.03,.24,.27,.23,140,1);
      // Short local connections keep a porous neural texture without a sphere grid.
      const cells=new Map(),cellSize=.16;
      nodes.forEach((p,i)=>{
        const key=p.slice(0,3).map(v=>Math.floor(v/cellSize)),near=[];
        if(i%2===0)for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){
          const bucket=cells.get([key[0]+dx,key[1]+dy,key[2]+dz].join(','))||[];
          for(const j of bucket){const q=nodes[j],d=(p[0]-q[0])**2+(p[1]-q[1])**2+(p[2]-q[2])**2;if(d<.030)near.push([d,j]);}
        }
        near.sort((a,b)=>a[0]-b[0]);near.slice(0,2).forEach(([,j])=>edges.push([i,j,0]));
        const name=key.join(',');if(!cells.has(name))cells.set(name,[]);cells.get(name).push(i);
      });
      // Curved tracts add depth and connect the lateral lobes to the central mass.
      for(const side of [-1,1])for(let strand=0;strand<12;strand++){
        let previous=-1;const spread=(strand-5.5)/11;
        for(let k=0;k<=28;k++){
          const t=k/28,x=side*(1.16-1.08*t),y=spread*.65*(1-t)-.18*Math.sin(t*Math.PI),z=.20*Math.sin(t*Math.PI)+spread*.20;
          const index=nodes.push([x,y,z,1])-1;
          if(previous>=0)edges.push([previous,index,1]);previous=index;
        }
      }
    }else{
      for(let i=0;i<100;i++){const y=1-2*(i+.5)/100,r=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));nodes.push([r*Math.cos(a),y,r*Math.sin(a),0]);}
      nodes.forEach((p,i)=>nodes.slice(i+1).forEach((q,k)=>{if(Math.hypot(...p.slice(0,3).map((v,j)=>v-q[j]))<.39)edges.push([i,i+1+k,0]);}));
    }
    const offsets=nodes.map(()=>({x:0,y:0,vx:0,vy:0}));
    const pointer={x:-9999,y:-9999};
    const surface=canvas.closest('dialog')||canvas.closest('section');
    // Pointer interaction lives on the surface, leaving every menu link clickable.
    surface?.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const rect=canvas.getBoundingClientRect();pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;},{passive:true});
    surface?.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-9999;},{passive:true});
    function draw(){
      ctx.clearRect(0,0,width,height);
      const radius=isBrain?Math.min(width/3.6,height/2.1):Math.min(width,height)*.41;
      const cy=height*.51,cx=width*.5,a=isBrain?.22+time*.000055:time*.00008,c=Math.cos(a),s=Math.sin(a),tilt=isBrain?-.12:.32;
      const points=nodes.map(([x,y,z,kind,nx,ny,nz],i)=>{
        const xx=x*c+z*s,zz=-x*s+z*c,yy=y*Math.cos(tilt)-zz*Math.sin(tilt),depth=zz*Math.cos(tilt)+y*Math.sin(tilt);
        const perspective=isBrain?3.8/(3.8-depth):1,px=cx+xx*radius*perspective,py=cy+yy*radius*perspective;
        const offset=offsets[i],dx=px-pointer.x,dy=py-pointer.y,d=Math.hypot(dx,dy),reach=isBrain?110:145;
        const force=!reduced.matches&&d<reach?Math.pow(1-d/reach,2)*(isBrain?55:105):0;
        const tx=dx/Math.max(1,d)*force,ty=dy/Math.max(1,d)*force;
        offset.vx=(offset.vx+(tx-offset.x)*.13)*.72;offset.vy=(offset.vy+(ty-offset.y)*.13)*.72;
        offset.x+=offset.vx;offset.y+=offset.vy;
        const rim=nx===undefined?0:1-Math.abs((-nx*s+nz*c)*Math.cos(tilt)+ny*Math.sin(tilt));
        return [px+offset.x,py+offset.y,depth,kind,i,rim];
      });
      ctx.lineWidth=isBrain?.65:.7;
      for(const [i,j,tract]of edges){const p=points[i],q=points[j];ctx.strokeStyle=`rgba(171,204,157,${isBrain?(tract?.17:.035)+(p[2]+q[2]+3)*.014:.035+(p[2]+q[2]+2)*.04})`;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();}
      points.sort((a,b)=>a[2]-b[2]).forEach(([x,y,z,kind,i,rim])=>{
        ctx.fillStyle=isBrain?['#bdd9a4','#afdacf','#e7bd79'][kind]:(i%13?'#b9d6a3':'#e7bd79');
        ctx.globalAlpha=isBrain?Math.max(.14,Math.min(.9,.20+.66*rim**3+z*.1)):.18+(z+1)*.3;
        const size=isBrain?Math.max(.55,.76+z*.26+rim*.3)+(i%23===0?.4:0):.7+(z+1)*1.15;
        ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
      });ctx.globalAlpha=1;
    }
    function tick(now){frame=0;if(!visible||document.hidden||canvas.closest('dialog')&&!menu.open)return;if(!last||now-last>40){time+=last?Math.min(80,now-last):0;last=now;draw();}if(!reduced.matches)frame=requestAnimationFrame(tick);}
    function wake(){cancelAnimationFrame(frame);frame=0;last=0;if(visible&&!document.hidden){draw();if(!reduced.matches)frame=requestAnimationFrame(tick);}}
    function size(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);wake();}
    new ResizeObserver(size).observe(canvas);new IntersectionObserver(e=>{visible=e[0].isIntersecting;wake();}).observe(canvas);
    new MutationObserver(wake).observe(menu,{attributes:true,attributeFilter:['open']});
    reduced.addEventListener('change',wake);document.addEventListener('visibilitychange',wake);size();
  });
  // The large logo fly IS the navigation trigger. Its one live element follows
  // a reversible curve into the corner; it never captures or changes scrolling.
  const origin=hero?.querySelector('[data-mascot-origin]');
  const originalArt=trigger.querySelector('img');
  if(hero&&origin&&originalArt){
    const art=document.createElement('span');art.className='home-menu-launch__art';art.setAttribute('aria-hidden','true');
    originalArt.before(art);art.append(originalArt);
    const label=trigger.querySelector(':scope > span:not(.home-menu-launch__art)');
    label?.classList.add('home-menu-launch__label');
    const dock=document.createElement('span');dock.className='home-menu-dock';dock.setAttribute('aria-hidden','true');document.body.append(dock);
    let geometry=null,queued=false,needsMeasure=true,puppet=null,lastProgress=-1,displayedProgress=null,lastTime=0;
    const clamp=n=>Math.max(0,Math.min(1,n));
    const ease=n=>n*n*(3-2*n);
    const cubic=(a,b,c,d,p)=>{const q=1-p;return q*q*q*a+3*q*q*p*b+3*q*p*p*c+p*p*p*d;};
    function measureFlight(){
      // The inert dock gives untransformed fixed coordinates. Geometry is read
      // only on layout changes, not during every scroll frame or wing beat.
      const h=hero.getBoundingClientRect(),o=origin.getBoundingClientRect(),d=dock.getBoundingClientRect();
      if(!geometry||geometry.width!==innerWidth||geometry.height!==innerHeight)displayedProgress=null;
      geometry={start:h.top+scrollY,travel:Math.max(240,Math.min(h.height*.58,innerHeight*.7)),
        x:o.left+o.width/2,y:o.top-h.top+o.height/2,size:origin.clientWidth,
        dockX:d.left+d.width/2,dockY:d.top+d.height/2,artSize:innerWidth<=600?40:49,
        width:innerWidth,height:innerHeight,button:d.width};
      needsMeasure=false;lastProgress=-1;
    }
    function pose(progress){
      if(!puppet)return;
      const awake=!document.hidden&&!reduced.matches;
      puppet.classList.toggle('is-alive',awake);
      puppet.classList.toggle('is-flying',awake&&progress>0&&progress<1);
      puppet.classList.toggle('is-landed',progress===0||progress===1);
    }
    function frame(now=performance.now()){
      queued=false;
      if(document.hidden)return;
      if(needsMeasure||!geometry)measureFlight();
      if(reduced.matches){
        document.body.classList.remove('home-menu-flight-ready');
        trigger.style.removeProperty('transform');displayedProgress=null;pose(1);return;
      }
      const g=geometry,target=clamp((scrollY-g.start)/g.travel);
      const elapsed=now-lastTime,dt=elapsed>100?1/60:Math.max(.001,Math.min(.04,elapsed/1000));lastTime=now;
      if(displayedProgress===null)displayedProgress=target;
      else displayedProgress+=(target-displayedProgress)*(1-Math.exp(-dt*11));
      if(Math.abs(displayedProgress-target)<.0008)displayedProgress=target;
      const p=displayedProgress;
      if(p!==lastProgress){
        const e=ease(p),size=g.size+(g.artSize-g.size)*e;
        // A lifted arc leaves the wordmark above its lettering, then settles
        // onto the same corner target at every viewport size.
        const x=cubic(g.x,Math.min(g.dockX,g.x+g.size*.45),g.dockX-g.width*.1,g.dockX,e);
        const y=cubic(g.y,Math.max(g.dockY,g.y-g.size*.5),g.dockY+g.height*.06,g.dockY,e);
        trigger.style.transform=`translate3d(${(x-g.dockX).toFixed(2)}px,${(y-g.dockY).toFixed(2)}px,0)`;
        trigger.style.setProperty('--menu-fly-scale',(size/g.artSize).toFixed(4));
        trigger.style.setProperty('--menu-fly-turn',`${(-7-16*Math.sin(p*Math.PI)-5*e).toFixed(2)}deg`);
        trigger.style.setProperty('--menu-dock-opacity',ease(clamp((p-.65)/.35)).toFixed(3));
        trigger.style.setProperty('--menu-label-x',`${(size*.46*(1-e)).toFixed(2)}px`);
        trigger.style.setProperty('--menu-label-y',`${((g.button*.5-9)*e).toFixed(2)}px`);
        trigger.classList.toggle('is-docked',p===1);
        trigger.dataset.flightProgress=p.toFixed(3);pose(p);lastProgress=p;
      }
      document.body.classList.add('home-menu-flight-ready');
      // A fast wheel event changes the destination, not the character's position
      // in a single frame. The following frames reuse the cached geometry.
      if(p!==target)queue();
    }
    function queue(measure=false){needsMeasure=needsMeasure||measure;if(!queued){queued=true;requestAnimationFrame(frame);}}
    addEventListener('scroll',()=>queue(),{passive:true});
    addEventListener('resize',()=>queue(true),{passive:true});
    addEventListener('pageshow',()=>queue(true));
    addEventListener('load',()=>queue(true));
    reduced.addEventListener('change',()=>queue(true));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pose(1);else{lastProgress=-1;queue(true);}});
    if('ResizeObserver' in window){const observer=new ResizeObserver(()=>queue(true));observer.observe(hero);observer.observe(origin);}
    document.fonts?.ready.then(()=>queue(true));
    frame();
    // Reuse the supplied logo artwork, including its subtle head/wing movement.
    // The PNG already displays correctly if this optional enhancement fails.
    fetch('assets/brand/logo-fly-puppet.svg?v=20261004-menu-flight').then(response=>{
      if(!response.ok)throw new Error('Mascot illustration unavailable');return response.text();
    }).then(source=>{
      const scoped=source.replaceAll('id="logo-fly-','id="menu-fly-').replaceAll('#logo-fly-','#menu-fly-');
      const svg=new DOMParser().parseFromString(scoped,'image/svg+xml').documentElement;
      if(svg.localName!=='svg')return;
      svg.querySelector('image')?.setAttribute('href',new URL('assets/brand/logo-fly-cutout.png',document.baseURI).href);
      puppet=document.importNode(svg,true);art.replaceChildren(puppet);lastProgress=-1;queue();
    }).catch(()=>{});
  }
})();
