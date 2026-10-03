import * as THREE from './vendor/three.module.js';

// All eight meshes retain their common assembly coordinates, in millimetres.
// The reversible offsets below are display-only; 0% restores the supplied pose.
const host = document.querySelector('[data-stl-viewer]');
if (host) initAssembly(host);

function initAssembly(host) {
  const stage = host.querySelector('.hw-exploded__stage');
  const canvas = host.querySelector('canvas');
  const fallback = host.querySelector('.hw-exploded__fallback');
  const controls = host.querySelector('.hw-exploded__controls');
  const detail = host.querySelector('.hw-exploded__detail');
  const slider = host.querySelector('[data-assembly-slider]');
  const output = host.querySelector('[data-assembly-output]');
  const rotationInput = host.querySelector('[data-assembly-turn]');
  const stateLabel = host.querySelector('[data-assembly-state]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const meshBase = 'hardware%20information/AeroSense/CAD/assembly_coordinates/';
  const printBase = 'hardware%20information/AeroSense/STL/';
  const parts = [
    {key:'body',name:'Integrated body',files:['01_integrated_body.stl'],material:'Rigid black resin',role:'The enclosure brings the gas path, optical interface and electronics into a single reader body.',spec:'The common chassis locates the upper optical assembly above the removable electronics tray.',color:0x0b0e13,shift:[-24,0,0]},
    {key:'tray',name:'Service tray',files:['02_service_tray.stl'],material:'Black resin',role:'A removable lower tray carries the PCB supports and the electronics cooling interface.',spec:'Board access is separated from the shared sample-gas space above the wells.',color:0x101319,shift:[-80,-26,0]},
    {key:'lid',name:'Hinged lid',files:['03_hinged_lid.stl'],material:'Rigid black resin',role:'The outer lid closes the reader and provides access to the optical assembly.',spec:'The gas seal belongs to the inner cap and well interface; the outer lid is not an airtight piston.',color:0x090c11,shift:[125,95,0]},
    {key:'cap',name:'Gas–optical cap',files:['04_common_gas_optical_cap.stl'],material:'Rigid black resin',role:'A shared headspace routes sample gas over the four wells while locating the optical interface.',spec:'The integrated divider contains 12 holes of 1.6 mm nominal diameter.',color:0x101218,shift:[80,65,0]},
    {key:'wells',name:'Four-well cartridge',files:['05_well_NE_CLEAR.stl','05_well_NW_CLEAR.stl','05_well_SW_CLEAR.stl','05_well_SE_CLEAR.stl'],material:'Translucent purple resin',role:'Four aligned wells form one optical sampling assembly, shown together as a single selectable group.',spec:'Each well has a nominal 150 µL fill and a 0.5 mm flat floor. The supplied well geometry supports cell-free fit and optical trials.',color:0x9c65d9,shift:[45,35,0]}
  ];
  const meshes = [], groups = [], pointers = new Map();
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const center = new THREE.Vector3(), extent = new THREE.Vector3();
  const bounds = new THREE.Box3(), meshBounds = new THREE.Box3();
  const fitCorner = new THREE.Vector3(), viewDirection = new THREE.Vector3();
  const viewRight = new THREE.Vector3(), viewUp = new THREE.Vector3();
  let renderer, scene, camera, assembly, ground, contactShadow, guideLines;
  let frame = 0, ready = false, visible = true, disposed = false;
  let selected = -1, amount = 0, targetAmount = 0;
  let yaw = .60, pitch = .29, zoom = 1, drag = null, pinchDistance = 0;
  let rotationOffset = 0, lastTime = 0;
  const defaultYaw = .60, defaultPitch = .29;

  function parseStl(buffer) {
    if (buffer.byteLength < 84) throw new Error('Invalid STL file');
    const data = new DataView(buffer), count = data.getUint32(80,true);
    if (84+count*50 !== buffer.byteLength) throw new Error('Unsupported STL encoding');
    const positions = new Float32Array(count*9);
    for (let n=0;n<count;n++) {
      const offset=84+n*50;
      for (let v=0;v<3;v++) for (let axis=0;axis<3;axis++) positions[n*9+v*3+axis]=data.getFloat32(offset+12+v*12+axis*4,true);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI/2); // CAD Z-up to display Y-up; no per-mesh centering.
    geometry.computeBoundingBox();
    return geometry;
  }
  function schedule() {
    if (!ready || disposed || !visible || frame) return;
    frame=requestAnimationFrame(draw);
  }
  function setAmount(value, immediate=false) {
    targetAmount=THREE.MathUtils.clamp(Number(value)/100,0,1);
    slider.value=String(Math.round(targetAmount*100));
    output.value=`${Math.round(targetAmount*100)}%`;
    slider.setAttribute('aria-valuetext',targetAmount===0?'Assembled':targetAmount===1?'Fully exploded':`${Math.round(targetAmount*100)} percent exploded`);
    stateLabel.textContent=targetAmount===0?'Assembled':targetAmount===1?'Exploded':'Opening';
    host.style.setProperty('--assembly-progress',`${targetAmount*100}%`);
    if (motion.matches || immediate) amount=targetAmount;
    schedule();
  }
  function select(index) {
    selected=index;
    parts.forEach((part,i)=>{
      const active=index===i;
      groups[i]?.children.forEach(object=>{
        if(object.userData.outline){object.visible=active;return;}
        if(!object.isMesh)return;
        object.material.opacity=index<0||active?(i===4?.72:1):.16;
        object.material.depthWrite=i!==4&&(index<0||active);
        // Selection is an edge light, not a repaint of the black enclosure.
        object.material.emissive.setHex(active?(i===4?0x703caf:0x5a86b2):0);
        object.material.emissiveIntensity=active?(i===4?.09:.035):0;
      });
      controls.querySelector(`[data-assembly-part="${part.key}"]`)?.setAttribute('aria-pressed',String(active));
    });
    detail.replaceChildren();
    const eyebrow=document.createElement('span');eyebrow.className='hw-showcase__detail-kicker';eyebrow.textContent=index<0?'Eight meshes. One reader.':'Component in focus';
    const title=document.createElement('strong'),copy=document.createElement('p');detail.append(eyebrow,title,copy);
    if(index<0){title.textContent='From the outside in.';copy.textContent='Open the assembly with the slider. Select a component to see how the enclosure, shared gas space and four-well cartridge fit together.';schedule();return;}
    const part=parts[index];title.textContent=part.name;copy.textContent=part.role;
    const spec=document.createElement('p');spec.className='hw-showcase__spec';spec.textContent=part.spec;
    const material=document.createElement('p');material.className='hw-showcase__material';material.textContent=`Material · ${part.material}`;
    const downloads=document.createElement('div');downloads.className='hw-showcase__downloads';
    part.files.forEach(file=>{const a=document.createElement('a');a.href=printBase+file;a.download='';a.textContent=part.files.length===1?'Download print STL ↗':`${file.match(/well_(\w+)_/)[1]} well STL ↗`;downloads.append(a);});
    detail.append(spec,material,downloads);schedule();
  }
  [2,3,4,0,1].forEach((index,order)=>{
    const button=document.createElement('button');button.type='button';button.dataset.assemblyPart=parts[index].key;button.setAttribute('aria-pressed','false');
    const number=document.createElement('span');number.textContent=String(order+1).padStart(2,'0');number.setAttribute('aria-hidden','true');
    button.append(number,document.createTextNode(parts[index].name));button.addEventListener('click',()=>select(selected===index?-1:index));controls.append(button);
  });
  select(-1);rotationInput.checked=!motion.matches;
  function resize(){if(!renderer)return;const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();schedule();}
  function updateTransforms(){
    parts.forEach((part,i)=>groups[i].position.set(...part.shift).multiplyScalar(amount));
    assembly.rotation.y=rotationInput.checked?amount*Math.PI*.25+rotationOffset:rotationOffset;
    assembly.updateMatrixWorld(true);bounds.makeEmpty();
    meshes.forEach(mesh=>{meshBounds.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);bounds.union(meshBounds);});
    bounds.getCenter(center);bounds.getSize(extent);ground.position.y=bounds.min.y-1.5;
    contactShadow.position.set(center.x,bounds.min.y-1.3,center.z);
    contactShadow.scale.set(Math.max(160,extent.x*.92),Math.max(135,extent.z*1.05),1);
    contactShadow.material.opacity=.38-amount*.16;
    const vertical=THREE.MathUtils.degToRad(camera.fov*.5),horizontal=Math.atan(Math.tan(vertical)*camera.aspect);
    viewDirection.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
    viewRight.set(Math.cos(yaw),0,-Math.sin(yaw));viewUp.crossVectors(viewDirection,viewRight);
    // Fit the actual projected component bounds, not an oversized sphere: wide
    // exploded layouts use the stage width while preserving safe edge padding.
    let fitDistance=1;
    meshes.forEach(mesh=>{
      const box=mesh.geometry.boundingBox;
      for(let corner=0;corner<8;corner++){
        fitCorner.set(corner&1?box.max.x:box.min.x,corner&2?box.max.y:box.min.y,corner&4?box.max.z:box.min.z).applyMatrix4(mesh.matrixWorld).sub(center);
        const depth=fitCorner.dot(viewDirection);
        fitDistance=Math.max(fitDistance,Math.abs(fitCorner.dot(viewRight))/Math.tan(horizontal)*1.26+depth,Math.abs(fitCorner.dot(viewUp))/Math.tan(vertical)*1.26+depth);
      }
    });
    const distance=fitDistance*zoom;
    camera.position.set(center.x+Math.sin(yaw)*Math.cos(pitch)*distance,center.y+Math.sin(pitch)*distance,center.z+Math.cos(yaw)*Math.cos(pitch)*distance);
    camera.lookAt(center);camera.updateMatrixWorld();
    const array=guideLines.geometry.attributes.position.array;
    parts.forEach((part,i)=>{const start=groups[i].userData.anchor,end=start.clone().add(groups[i].position);array.set([start.x,start.y,start.z,end.x,end.y,end.z],i*6);});
    guideLines.geometry.attributes.position.needsUpdate=true;guideLines.computeLineDistances();guideLines.visible=amount>.06;
  }
  function draw(time){
    frame=0;if(!ready||!visible||disposed)return;
    const dt=lastTime?Math.min(50,time-lastTime):16;lastTime=time;
    const diff=targetAmount-amount;amount=motion.matches||Math.abs(diff)<.0005?targetAmount:amount+diff*(1-Math.exp(-dt/110));
    updateTransforms();renderer.render(scene,camera);if(amount!==targetAmount)schedule();
  }
  function studioEnvironment(){
    const studio=new THREE.Scene();studio.background=new THREE.Color(0x263246);
    studio.add(new THREE.Mesh(new THREE.BoxGeometry(900,900,900),new THREE.MeshBasicMaterial({color:0x182232,side:THREE.BackSide})));
    // A neutral key softbox and narrow cool rim define the black resin silhouette.
    // The lighting is procedural: no HDRI download or extra animation loop.
    const panel=(w,h,position,color,intensity)=>{const material=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide});material.color.multiplyScalar(intensity);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);mesh.position.set(...position);mesh.lookAt(0,0,0);studio.add(mesh);};
    panel(260,460,[-270,180,250],0xfff9f1,6.2);
    panel(85,470,[280,100,160],0xd1e4ff,5.0);
    panel(380,120,[0,290,-190],0xf0f4ff,5.8);
    // The top and front faces reflect different parts of the studio. A low
    // rear card catches the broad lid; a lower front card catches vertical
    // walls, so black faces remain readable throughout a manual orbit.
    panel(330,240,[-250,130,-280],0xf1f6ff,5.2);
    panel(210,270,[-240,-65,270],0xe8f0ff,3.4);
    panel(130,240,[-250,-80,-180],0x9daac2,1.2);
    const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.05).texture;pmrem.dispose();
    studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});return environment;
  }
  async function load(){
    try{
      renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      scene=new THREE.Scene();scene.environment=studioEnvironment();camera=new THREE.PerspectiveCamera(36,1,.5,6000);
      scene.add(new THREE.HemisphereLight(0xe7efff,0x121a26,.7));
      const key=new THREE.DirectionalLight(0xfff8ef,4.6);key.position.set(-240,480,280);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
      key.shadow.camera.left=-350;key.shadow.camera.right=350;key.shadow.camera.top=400;key.shadow.camera.bottom=-300;key.shadow.camera.far=1500;key.shadow.normalBias=.35;key.shadow.bias=-.0001;key.shadow.radius=5;scene.add(key);
      const rim=new THREE.DirectionalLight(0xd0e3ff,5.8);rim.position.set(220,190,-260);scene.add(rim);
      const fill=new THREE.DirectionalLight(0xc9d7ed,1.8);fill.position.set(100,10,220);scene.add(fill);
      assembly=new THREE.Group();scene.add(assembly);
      ground=new THREE.Mesh(new THREE.PlaneGeometry(2600,2600),new THREE.ShadowMaterial({color:0x02050c,opacity:.25}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
      const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=256;
      const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(128,128,12,128,128,126);
      gradient.addColorStop(0,'rgba(0,12,20,.8)');gradient.addColorStop(.45,'rgba(0,12,20,.4)');gradient.addColorStop(1,'rgba(0,12,20,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
      contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,opacity:.38,depthWrite:false}));contactShadow.rotation.x=-Math.PI/2;scene.add(contactShadow);
      for(const part of parts){
        const group=new THREE.Group();assembly.add(group);groups.push(group);const index=groups.length-1;
        await Promise.all(part.files.map(async file=>{
          const response=await fetch(meshBase+file);if(!response.ok)throw new Error(`Unable to load ${file}`);
          const geometry=parseStl(await response.arrayBuffer());
          const isWell=index===4;
          const material=new THREE.MeshPhysicalMaterial({
            color:isWell?part.color:0x191c22,roughness:isWell?.14:.26,metalness:0,
            clearcoat:1,clearcoatRoughness:.10,envMapIntensity:isWell?1.35:2.7,
            transparent:true,opacity:isWell?.72:1,depthWrite:!isWell,
            // Purple remains translucent without an extra full-resolution refraction pass.
            // These are display materials; supplied mesh dimensions are unchanged.
            side:THREE.DoubleSide
          });
          const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=!isWell;mesh.receiveShadow=true;mesh.userData.index=index;group.add(mesh);meshes.push(mesh);
          const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,38),new THREE.LineBasicMaterial({color:isWell?0xdfbeff:0xb8d8ff,transparent:true,opacity:.7}));outline.userData.outline=true;outline.visible=false;group.add(outline);
        }));
        group.userData.anchor=new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(parts.length*6),3));
      guideLines=new THREE.LineSegments(geometry,new THREE.LineDashedMaterial({color:0xa5bedb,dashSize:3,gapSize:3,transparent:true,opacity:.23,depthWrite:false}));guideLines.frustumCulled=false;assembly.add(guideLines);
      fallback.hidden=true;host.classList.add('is-ready');host.querySelector('[data-assembly-loading]').hidden=true;
      host.querySelectorAll('[data-assembly-controls] input,[data-assembly-controls] button').forEach(el=>{el.disabled=false;});
      ready=true;select(-1);resize();
    }catch(error){canvas.hidden=true;host.classList.add('is-fallback');host.querySelector('[data-assembly-loading]').textContent='Static assembly preview';host.querySelector('[data-assembly-controls]').hidden=true;console.warn('AeroSense assembly preview:',error.message);}
  }
  slider.addEventListener('input',()=>setAmount(slider.value));
  host.querySelectorAll('[data-assembly-preset]').forEach(button=>button.addEventListener('click',()=>setAmount(button.dataset.assemblyPreset)));
  rotationInput.addEventListener('change',()=>{rotationOffset+=(rotationInput.checked?-1:1)*amount*Math.PI*.25;schedule();});
  host.querySelector('[data-assembly-reset]').addEventListener('click',()=>{yaw=defaultYaw;pitch=defaultPitch;zoom=1;rotationOffset=0;rotationInput.checked=!motion.matches;select(-1);setAmount(0);});
  host.querySelectorAll('[data-assembly-zoom]').forEach(button=>button.addEventListener('click',()=>{zoom=THREE.MathUtils.clamp(zoom+Number(button.dataset.assemblyZoom),.65,1.7);schedule();}));
  canvas.addEventListener('pointerdown',event=>{
    if(!ready)return;canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===1)drag={x:event.clientX,y:event.clientY,yaw,pitch,moved:false};
    if(pointers.size===2){const p=[...pointers.values()];pinchDistance=Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);if(drag)drag.moved=true;}
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2){const p=[...pointers.values()],next=Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);if(next>0&&pinchDistance>0)zoom=THREE.MathUtils.clamp(zoom*pinchDistance/next,.65,1.7);pinchDistance=next;schedule();return;}
    if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;
    yaw=drag.yaw-dx*.009;pitch=THREE.MathUtils.clamp(drag.pitch+dy*.007,-.25,1.25);schedule();
  });
  function endPointer(event){
    if(!pointers.has(event.pointerId))return;
    if(event.type==='pointerup'&&pointers.size===1&&drag&&!drag.moved){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-((event.clientY-r.top)/r.height*2-1));raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes,false)[0];if(hit)select(selected===hit.object.userData.index?-1:hit.object.userData.index);}
    pointers.delete(event.pointerId);drag=null;pinchDistance=0;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  }
  canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);
  canvas.addEventListener('wheel',event=>{if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();zoom=THREE.MathUtils.clamp(zoom+Math.sign(event.deltaY)*.055,.65,1.7);schedule();},{passive:false});
  canvas.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft')yaw-=.13;else if(event.key==='ArrowRight')yaw+=.13;else if(event.key==='ArrowUp')pitch=Math.min(1.25,pitch+.10);else if(event.key==='ArrowDown')pitch=Math.max(-.25,pitch-.10);
    else if(event.key==='+'||event.key==='=')zoom=Math.max(.65,zoom-.10);else if(event.key==='-')zoom=Math.min(1.7,zoom+.10);else if(event.key==='Home'){yaw=defaultYaw;pitch=defaultPitch;zoom=1;}else return;event.preventDefault();schedule();
  });
  motion.addEventListener('change',()=>{if(motion.matches){rotationOffset+=rotationInput.checked?amount*Math.PI*.25:0;rotationInput.checked=false;amount=targetAmount;}schedule();});
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&frame){cancelAnimationFrame(frame);frame=0;}else schedule();},{rootMargin:'150px'}).observe(host);
  window.addEventListener('pagehide',()=>{disposed=true;if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',()=>{disposed=false;schedule();});
  load();
}
