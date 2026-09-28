import * as THREE from './vendor/three.module.js';

export async function createPartsViewer(host, api, reduceMotion) {
  const canvas=host.querySelector('canvas'), fallback=host.querySelector('[data-parts-3d-fallback]');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.16;
  const scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xf6fff0,0x284b48,1.3));
  for(const [color,intensity,x,y,z] of [[0xffe9c4,2.1,3,6,5],[0x8adde7,1.5,-4,2,-3]]) {
    const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);
  }
  const camera=new THREE.PerspectiveCamera(38,1,.1,50), target=new THREE.Vector3(-.15,-.12,0);
  let theta=.14,phi=1.34,radius=6.4,visible=true,active=false,raf=0,last=0,time=0;
  const place=()=>{const r=radius/Math.min(1,camera.aspect);camera.position.set(r*Math.sin(phi)*Math.sin(theta),target.y+r*Math.cos(phi),r*Math.sin(phi)*Math.cos(theta));camera.lookAt(target);};
  place();
  // Illustrated topology: rounded, deliberately non-atomic forms make roles clear.
  // Geometry does not assert helix count, molecular structure, or stoichiometry.
  const model=new THREE.Group();scene.add(model);
  function part(feature,geometry,x,y,z){
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());
    mesh.name=feature+'_illustration';mesh.userData.feature=feature;mesh.position.set(x,y,z);model.add(mesh);return mesh;
  }
  part('membrane',new THREE.BoxGeometry(5.4,1.55,1.6),0,.65,-.13);
  for(const [feature,cx] of [['or',-.72],['orco',.72]]){
    for(let i=0;i<5;i++){
      const dx=(i-2)*.16, z=(i%2?-.12:.1);
      const rod=part(feature,new THREE.CylinderGeometry(.105,.12,1.68,20),cx+dx,.68,z);
      rod.rotation.z=.08*Math.sin(i*1.7);
      part(feature,new THREE.SphereGeometry(.11,16,12),cx+dx,1.51,z);
      part(feature,new THREE.SphereGeometry(.12,16,12),cx+dx,-.16,z);
    }
  }
  // A discrete contact between OR and Orco: visual partnership, not a protein interface prediction.
  for(let i=0;i<3;i++)part('orco',new THREE.SphereGeometry(.065,14,10),-.02,.22+i*.34,.18);
  // A flexible linker connects GCaMP6f to Orco in the proposed fusion.
  const bend=new THREE.CatmullRomCurve3([new THREE.Vector3(.72,-.18,.12),new THREE.Vector3(.94,-.45,.16),new THREE.Vector3(.67,-.72,.16),new THREE.Vector3(.89,-.94,.14)]);
  const linker=part('linker',new THREE.TubeGeometry(bend,48,.065,10,false),0,0,0);
  function reporter(feature,x,r){
    part(feature,new THREE.SphereGeometry(r,32,24),x,-1.34,.12);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      part(feature,new THREE.SphereGeometry(.13,16,12),x+Math.cos(a)*(r-.015),-1.34+Math.sin(a)*(r-.015),.33);
    }
  }
  reporter('gcamp',.89,.43);reporter('mcherry',-1.35,.4);
  canvas.dataset.loaded='illustrated-3d';fallback.hidden=true;
  const gltf={scene:model};
  const groups={},pickables=[];
  gltf.scene.traverse(obj=>{
    if(!obj.isMesh)return;
    let owner=obj,feature;
    while(owner&&!feature){feature=owner.userData.feature||owner.name.match(/^(orco|or|gcamp|mcherry|linker|membrane)(?:_|$)/i)?.[1]?.toLowerCase();owner=owner.parent;}
    obj.userData.feature=feature;
    obj.material=obj.material.clone();
    const colors={or:0x42a980,orco:0x56a9d7,gcamp:0x83e74d,mcherry:0xff6b91,linker:0xf8bf5e,membrane:0xabc8b6};
    if(feature==='membrane'){
      obj.material.color.setHex(colors.membrane);obj.material.transparent=true;obj.material.opacity=.085;obj.material.depthWrite=false;obj.material.roughness=.9;
    } else {
      obj.material=new THREE.MeshToonMaterial({color:colors[feature]||0xf8bf5e,emissive:colors[feature]||0xf8bf5e,emissiveIntensity:feature==='gcamp'?1.2:feature==='mcherry'?1.0:.05});
    }
    obj.userData.rest=obj.position.clone();
    obj.userData.baseEmissive=obj.material.emissive.clone();
    obj.userData.baseIntensity=obj.material.emissiveIntensity;
    (groups[feature]??=[]).push(obj);
    if(feature&&feature!=='membrane')pickables.push(obj);
  });
  // Soft illustrated glows make the two reporters legible without presenting a predicted structure.
  const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;
  const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,8,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,.7)');gradient.addColorStop(.35,'rgba(255,255,255,.32)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const glowTexture=new THREE.CanvasTexture(glowCanvas),glows={};
  for(const [feature,color] of [['gcamp',0x66f16e],['mcherry',0xff729b]]){
    const meshes=groups[feature]||[];if(!meshes.length)continue;
    const box=new THREE.Box3();meshes.forEach(mesh=>box.expandByObject(mesh));
    const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:.82,depthWrite:false,depthTest:false}));
    sprite.position.copy(center);sprite.position.z-=.24;sprite.scale.set(Math.max(1.25,size.x*2.5),Math.max(1.25,size.y*2.3),1);sprite.renderOrder=2;scene.add(sprite);sprite.userData.rest=sprite.position.clone();glows[feature]=sprite;
  }
  const ions=new THREE.Group();scene.add(ions);
  for(let i=0;i<7;i++) {
    const ion=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),new THREE.MeshBasicMaterial({color:0x8be7ff}));
    ion.userData.phase=i/7;ions.add(ion);
  }
  ions.visible=false;
  const odor=new THREE.Group();scene.add(odor);odor.visible=false;
  for(let i=0;i<3;i++){
    const bead=new THREE.Mesh(new THREE.SphereGeometry(i===0?.10:.065,16,10),new THREE.MeshStandardMaterial({color:0xedb44e,roughness:.35}));
    bead.position.set((i-1)*.14,i===1?.1:0,0);odor.add(bead);
  }
  odor.position.set(-.55,1.1,.05);
  function render(now=0) {
    raf=0;if(document.hidden||!visible)return;
    const dt=Math.min(.04,(now-last)/1000||0);last=now;time+=dt;
    if(active&&!reduceMotion){
      odor.position.y=1.0+.5*Math.max(0,Math.cos(time*1.6));
      ions.children.forEach((ion,i)=>{const p=(time*.32+ion.userData.phase)%1;ion.position.set(.15*Math.sin(i*2),1.8-p*3.1,.12*Math.cos(i));});
      (groups.gcamp||[]).forEach(o=>{o.material.emissiveIntensity=1.15+.35*Math.sin(time*3);});
      if(glows.gcamp)glows.gcamp.material.opacity=.75+.2*Math.sin(time*3);
    }
    renderer.render(scene,camera);
    if(active&&!reduceMotion)raf=requestAnimationFrame(render);
  }
  function request(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(render);}
  function size(){const w=host.clientWidth;const h=Math.max(350,Math.min(580,w*.72));renderer.setSize(w,h,false);canvas.style.width='100%';canvas.style.height=h+'px';camera.aspect=w/h;camera.updateProjectionMatrix();place();request();}
  const resize=new ResizeObserver(size);resize.observe(host);size();
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=performance.now();request();}else{cancelAnimationFrame(raf);raf=0;}},{threshold:.01}).observe(host);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=performance.now();request();}});
  let selected=null,hovered=null;
  const names={or:'OR · odor selectivity',orco:'Orco · channel partner',gcamp:'GCaMP6f · Ca²⁺ reporter',mcherry:'mCherry · expression marker',linker:'Linker · connects GCaMP6f and Orco'};
  const tooltip=document.createElement('div');tooltip.className='protein-hover';tooltip.hidden=true;host.append(tooltip);
  function highlight(){
    const focus=hovered||selected;
    pickables.forEach(o=>{const on=o.userData.feature===focus;o.material.emissive.copy(o.userData.baseEmissive);o.material.emissiveIntensity=on?1.5:o.userData.baseIntensity;o.material.color.setHex(({or:0x42a980,orco:0x56a9d7,gcamp:0x83e74d,mcherry:0xff6b91,linker:0xf8bf5e})[o.userData.feature]);if(focus&&!on)o.material.color.multiplyScalar(.65);});
    Object.entries(glows).forEach(([feature,sprite])=>{sprite.material.opacity=focus&&focus!==feature?.36:.82;});
    host.querySelectorAll('[data-protein-focus]').forEach(b=>b.classList.toggle('is-highlighted',b.dataset.proteinFocus===focus));request();
  }
  api.focus=feature=>{selected=feature;highlight();};
  host.querySelectorAll('[data-protein-focus]').forEach(button=>{
    button.addEventListener('pointerenter',()=>{hovered=button.dataset.proteinFocus;highlight();});
    button.addEventListener('pointerleave',()=>{hovered=null;highlight();});
    button.addEventListener('focus',()=>{hovered=button.dataset.proteinFocus;highlight();});
    button.addEventListener('blur',()=>{hovered=null;highlight();});
    button.addEventListener('click',()=>api.pick(button.dataset.proteinFocus));
  });
  api.setOrName=name=>{const label=host.querySelector('[data-or-3d-label]');if(label)label.textContent=name;};
  api.setMembrane=on=>{(groups.membrane||[]).forEach(o=>o.visible=on);request();};
  api.setExploded=on=>{for(const [feature,objects] of Object.entries(groups)){const delta={or:[-.5,.2,0],orco:[.5,.2,0],gcamp:[.8,-.65,0],linker:[.7,-.3,0],mcherry:[-.6,-.35,0]}[feature]||[0,0,0];objects.forEach(o=>{o.position.copy(o.userData.rest);if(on)o.position.add(new THREE.Vector3(...delta));});if(glows[feature]){glows[feature].position.copy(glows[feature].userData.rest);if(on)glows[feature].position.add(new THREE.Vector3(...delta));}}request();};
  api.reset=()=>{theta=.14;phi=1.34;radius=6.4;place();request();};
  host.querySelector('[data-receptor-activate]').addEventListener('click',event=>{
    active=!active;event.currentTarget.setAttribute('aria-pressed',String(active));event.currentTarget.textContent=active?'Reset odor response':'Show odor response';ions.visible=active;odor.visible=active;time=0;
    host.querySelector('[data-receptor-caption]').textContent=active?'Conceptual sequence: odor activation → the OR–Orco channel conducts ions → intracellular Ca²⁺ rises → GCaMP6f fluorescence changes. mCherry marks expression; it is not the odor readout.':'OR helps determine odor selectivity. OR and Orco assemble into an odor-gated ion channel; Ca²⁺ entry can drive a GCaMP6f fluorescence change.';
    ions.children.forEach((ion,i)=>ion.position.set(0,1.6-i*.45,0));
    (groups.gcamp||[]).forEach(o=>o.material.emissiveIntensity=active?1.8:o.userData.baseIntensity);
    request();
  });
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;down={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!down){
      const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
      const hit=ray.intersectObjects(pickables)[0],next=hit?.object.userData.feature||null;
      if(next!==hovered){hovered=next;highlight();}
      canvas.style.cursor=next?'pointer':'grab';tooltip.hidden=!next;
      if(next){tooltip.textContent=names[next]+' · click to explore';tooltip.style.left=Math.min(host.clientWidth-250,Math.max(10,event.clientX-r.left+14))+'px';tooltip.style.top=(event.clientY-host.getBoundingClientRect().top+20)+'px';}
      return;
    }if(down.id!==event.pointerId)return;tooltip.hidden=true;theta-=(event.clientX-down.x)*.008;phi=THREE.MathUtils.clamp(phi-(event.clientY-down.y)*.008,.3,2.6);down.x=event.clientX;down.y=event.clientY;place();request();});
  canvas.addEventListener('pointerup',event=>{
    if(!down||down.id!==event.pointerId)return;
    if(Math.hypot(event.clientX-down.startX,event.clientY-down.startY)<5){
      const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
      const hit=ray.intersectObjects(pickables)[0];if(hit)api.pick(hit.object.userData.feature);
    }down=null;
  });
  canvas.addEventListener('pointercancel',()=>down=null);canvas.addEventListener('pointerleave',()=>{hovered=null;tooltip.hidden=true;highlight();});
  canvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home')api.reset();
    if(event.key==='ArrowLeft')theta-=.15;if(event.key==='ArrowRight')theta+=.15;
    if(event.key==='ArrowUp')phi-=.1;if(event.key==='ArrowDown')phi+=.1;
    if(['+','='].includes(event.key))radius-=.5;if(event.key==='-')radius+=.5;
    radius=THREE.MathUtils.clamp(radius,5,14);phi=THREE.MathUtils.clamp(phi,.3,2.6);place();request();
  });
  // Zoom only when deliberately focused; ordinary page scrolling stays available.
  canvas.addEventListener('wheel',event=>{if(document.activeElement!==canvas)return;event.preventDefault();radius=THREE.MathUtils.clamp(radius+event.deltaY*.008,5,14);place();request();},{passive:false});
  matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',event=>{reduceMotion=event.matches;request();});
  request();
}

