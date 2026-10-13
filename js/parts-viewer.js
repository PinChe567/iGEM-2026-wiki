import * as THREE from './vendor/three.module.js';

export async function createPartsViewer(host, api) {
  const canvas=host.querySelector('canvas'), fallback=host.querySelector('[data-parts-3d-fallback]');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!matchMedia('(pointer:coarse)').matches,powerPreference:'low-power'});
<<<<<<< HEAD
  // Keep the page's CSS paper visible without changing any scientific material.
  renderer.setClearColor(0x000000,0);
=======
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(pointer:coarse)').matches?1.25:1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xf6fff0,0x284b48,1.1));
  for(const [color,intensity,x,y,z] of [[0xffe9c4,1.7,3,6,5],[0x8adde7,.7,-4,2,-3]]) {
    const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);
  }
  const camera=new THREE.PerspectiveCamera(38,1,.1,50), target=new THREE.Vector3(-.15,-.12,0);
  let theta=.14,phi=1.34,radius=6.4,visible=true,enabled=!host.hidden,raf=0;
  const place=()=>{const r=radius/Math.min(1,camera.aspect);camera.position.set(r*Math.sin(phi)*Math.sin(theta),target.y+r*Math.cos(phi),r*Math.sin(phi)*Math.cos(theta));camera.lookAt(target);};
  place();
  // Faceted conceptual topology: deliberately non-atomic forms make roles clear.
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
      const rod=part(feature,new THREE.CylinderGeometry(.105,.12,1.68,8),cx+dx,.68,z);
      rod.rotation.z=.08*Math.sin(i*1.7);
      part(feature,new THREE.IcosahedronGeometry(.11,0),cx+dx,1.51,z);
      part(feature,new THREE.IcosahedronGeometry(.12,0),cx+dx,-.16,z);
    }
  }
  // A discrete contact between OR and Orco: visual partnership, not a protein interface prediction.
  for(let i=0;i<3;i++)part('orco',new THREE.IcosahedronGeometry(.065,0),-.02,.22+i*.34,.18);
  // A flexible linker connects GCaMP6f to Orco in the proposed fusion.
  const bend=new THREE.CatmullRomCurve3([new THREE.Vector3(.72,-.18,.12),new THREE.Vector3(.94,-.45,.16),new THREE.Vector3(.67,-.72,.16),new THREE.Vector3(.89,-.94,.14)]);
  const linker=part('linker',new THREE.TubeGeometry(bend,16,.065,6,false),0,0,0);
  function reporter(feature,x,r){
    part(feature,new THREE.IcosahedronGeometry(r,1),x,-1.34,.12);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      part(feature,new THREE.IcosahedronGeometry(.13,0),x+Math.cos(a)*(r-.015),-1.34+Math.sin(a)*(r-.015),.33);
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
      obj.material.color.setHex(colors.membrane);obj.material.transparent=true;obj.material.opacity=.085;obj.material.depthWrite=false;obj.material.roughness=.95;obj.material.flatShading=true;
    } else {
      obj.material=new THREE.MeshStandardMaterial({color:colors[feature]||0xf8bf5e,roughness:.88,metalness:0,flatShading:true,emissive:colors[feature]||0xf8bf5e,emissiveIntensity:feature==='gcamp'?.15:feature==='mcherry'?.1:.025});
    }
    obj.userData.rest=obj.position.clone();
    obj.userData.baseEmissive=obj.material.emissive.clone();
    obj.userData.baseIntensity=obj.material.emissiveIntensity;
    (groups[feature]??=[]).push(obj);
    if(feature&&feature!=='membrane')pickables.push(obj);
  });
  canvas.dataset.renderStyle='low-poly-matte';
  canvas.dataset.meshCount=String(Object.values(groups).flat().length);
  canvas.dataset.triangleCount=String(Object.values(groups).flat().reduce((total,mesh)=>total+(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3,0));
  // A restrained reporter halo keeps the signal cue without flattening the facets.
  const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;
  const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,8,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,.7)');gradient.addColorStop(.35,'rgba(255,255,255,.32)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const glowTexture=new THREE.CanvasTexture(glowCanvas),glows={};
  for(const [feature,color] of [['gcamp',0x66f16e],['mcherry',0xff729b]]){
    const meshes=groups[feature]||[];if(!meshes.length)continue;
    const box=new THREE.Box3();meshes.forEach(mesh=>box.expandByObject(mesh));
    const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:.18,depthWrite:false,depthTest:false}));
    sprite.position.copy(center);sprite.position.z-=.24;sprite.scale.set(Math.max(1.25,size.x*2.5),Math.max(1.25,size.y*2.3),1);sprite.renderOrder=2;scene.add(sprite);sprite.userData.rest=sprite.position.clone();glows[feature]=sprite;
  }
  function render() {
    raf=0;if(document.hidden||!visible||!enabled||host.hidden)return;
    renderer.render(scene,camera);
  }
  function request(){if(!raf&&visible&&enabled&&!host.hidden&&!document.hidden)raf=requestAnimationFrame(render);}
  function size(){const w=host.clientWidth;if(w<=0||host.hidden)return;const h=Math.max(350,Math.min(580,w*.72));renderer.setSize(w,h,false);canvas.style.width='100%';canvas.style.height=h+'px';camera.aspect=w/h;camera.updateProjectionMatrix();place();request();}
  api.setEnabled=on=>{enabled=Boolean(on);if(!enabled){cancelAnimationFrame(raf);raf=0;}else{size();request();}};
  const resize=new ResizeObserver(size);resize.observe(host);size();
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){request();}else{cancelAnimationFrame(raf);raf=0;}},{threshold:.01}).observe(host);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{request();}});
  let selected=null,hovered=null;
  const names={or:'OR · odor selectivity',orco:'Orco · channel partner',gcamp:'GCaMP6f · Ca²⁺ reporter',mcherry:'mCherry · expression marker',linker:'Linker · connects GCaMP6f and Orco'};
  const tooltip=document.createElement('div');tooltip.className='protein-hover';tooltip.hidden=true;host.append(tooltip);
  function highlight(){
    const focus=hovered||selected;
<<<<<<< HEAD
    pickables.forEach(o=>{const on=o.userData.feature===focus;o.material.emissive.copy(o.userData.baseEmissive);o.material.emissiveIntensity=on?.32:o.userData.baseIntensity;o.material.color.setHex(({or:0x42a980,orco:0x56a9d7,gcamp:0x83e74d,mcherry:0xff6b91,linker:0xf8bf5e})[o.userData.feature]);if(focus&&!on)o.material.color.multiplyScalar(.75);});
    Object.entries(glows).forEach(([feature,sprite])=>{sprite.material.opacity=focus===feature?.3:focus?.08:.18;});
=======
    pickables.forEach(o=>{const on=o.userData.feature===focus;o.material.emissive.copy(o.userData.baseEmissive);o.material.emissiveIntensity=on?1.5:o.userData.baseIntensity;o.material.color.setHex(({or:0x42a980,orco:0x56a9d7,gcamp:0x83e74d,mcherry:0xff6b91,linker:0xf8bf5e})[o.userData.feature]);if(focus&&!on)o.material.color.multiplyScalar(.65);});
    Object.entries(glows).forEach(([feature,sprite])=>{sprite.material.opacity=focus&&focus!==feature?.36:.82;});
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0
    request();
  }
  api.focus=feature=>{selected=feature;highlight();};
  api.setOrName=name=>{const label=host.querySelector('[data-or-3d-label]');if(label)label.textContent=name;};
  api.reset=()=>{theta=.14;phi=1.34;radius=6.4;place();request();};
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  function pick(event){
    const rect=canvas.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    ray.setFromCamera(pointer,camera);
    return ray.intersectObjects(pickables)[0]?.object.userData.feature||null;
  }
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;down={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!down){
      const r=canvas.getBoundingClientRect(),next=pick(event);
      if(next!==hovered){hovered=next;highlight();}
      canvas.style.cursor=next?'pointer':'grab';tooltip.hidden=!next;
      if(next){tooltip.textContent=names[next];tooltip.style.left=Math.min(host.clientWidth-250,Math.max(10,event.clientX-r.left+14))+'px';tooltip.style.top=(event.clientY-host.getBoundingClientRect().top+20)+'px';}
      return;
    }if(down.id!==event.pointerId)return;tooltip.hidden=true;theta-=(event.clientX-down.x)*.008;phi=THREE.MathUtils.clamp(phi-(event.clientY-down.y)*.008,.3,2.6);down.x=event.clientX;down.y=event.clientY;place();request();});
  canvas.addEventListener('pointerup',event=>{
    if(!down||down.id!==event.pointerId)return;
    const click=Math.hypot(event.clientX-down.startX,event.clientY-down.startY)<7;
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    down=null;
    if(click){const feature=pick(event);if(feature)api.select?.(feature);}
  });
  canvas.addEventListener('pointercancel',()=>down=null);canvas.addEventListener('pointerleave',()=>{hovered=null;tooltip.hidden=true;highlight();});
  canvas.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();
      const features=['or','orco','linker','gcamp','mcherry'];
      api.select?.(features[(features.indexOf(selected)+1)%features.length]);
      return;
    }
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
  request();
}

