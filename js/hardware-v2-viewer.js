import * as THREE from './vendor/three.module.js';

export async function createViewer(host) {
  const base = 'hardware%20information/AeroSense%20v2/01_print/';
  const parts = [
    ['01_base_BLACK.stl',[-54,-56,0],0,0x080a0c],
    ['02_black_hood_BLACK.stl',[-54,-56,40.8],38,0x080a0c],
    ['03_gas_lid_BLACK.stl',[-54,-56,57.9],94,0x080a0c],
    ['04_well_NE_CLEAR.stl',[.8,.75,42.5],52,0xc0d8dd],
    ['05_well_NW_CLEAR.stl',[-6.5,.75,42.5],52,0xc0d8dd],
    ['06_well_SW_CLEAR.stl',[-6.5,-5.25,42.5],52,0xc0d8dd],
    ['07_well_SE_CLEAR.stl',[.8,-5.25,42.5],52,0xc0d8dd],
    ['08_gas_compression_plate_BLACK.stl',[-10,-9,56.1],72,0x080a0c]
  ];
  const canvas = host.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38,1,.1,1500);
  scene.add(new THREE.HemisphereLight(0xeaf0f6,0x242a32,1.8));
  const key = new THREE.DirectionalLight(0xfff5e8,4.5);key.position.set(-100,180,180);scene.add(key);
  const rim = new THREE.DirectionalLight(0xd6e8ff,3.4);rim.position.set(160,100,-130);scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff,2);fill.position.set(-150,30,-50);scene.add(fill);
  // Local studio light cards produce reflections once; there is no animated environment.
  const studio = new THREE.Scene();studio.background=new THREE.Color(0x4b5059);
  const cards=[];
  [[-180,140,50,120,260],[150,140,-100,100,260],[0,240,0,260,200]].forEach(([x,y,z,w,h])=>{
    const card=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));
    card.position.set(x,y,z);card.lookAt(0,30,0);studio.add(card);cards.push(card);
  });
  const generator=new THREE.PMREMGenerator(renderer);
  const environment=generator.fromScene(studio,.06);
  scene.environment=environment.texture;generator.dispose();
  cards.forEach(card=>{card.geometry.dispose();card.material.dispose();});
  const group = new THREE.Group();scene.add(group);
  const meshes = [];
  function parse(buffer, part) {
    const view = new DataView(buffer), count = view.getUint32(80,true);
    if (buffer.byteLength !== 84 + count*50) throw new Error('Invalid binary STL');
    const positions = new Float32Array(count*9);
    for(let n=0;n<count;n++) for(let v=0;v<3;v++) for(let a=0;a<3;a++) positions[n*9+v*3+a]=view.getFloat32(84+n*50+12+v*12+a*4,true);
    const geometry = new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.computeBoundingBox();
    const min = geometry.boundingBox.min;
    // Print STLs have Z=0. Restore each recorded assembly minimum before display rotation.
    geometry.translate(part[1][0]-min.x,part[1][1]-min.y,part[1][2]-min.z);
    geometry.rotateX(-Math.PI/2);geometry.computeVertexNormals();
    const clear = part[0].includes('CLEAR');
    // Preserve every source triangle and assembly dimension. The faceted look
    // comes from matte flat shading, never from decimating printable CAD.
    const mesh = new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:part[3],roughness:clear?.84:.9,metalness:0,envMapIntensity:.18,flatShading:true,transparent:clear,opacity:clear?.6:1,side:THREE.DoubleSide}));
    mesh.userData.lift=part[2];group.add(mesh);meshes.push(mesh);
  }
  try { await Promise.all(parts.map(async part => {const response=await fetch(base+part[0]);if(!response.ok)throw new Error('Missing STL');parse(await response.arrayBuffer(),part);})); }
  catch(error){meshes.forEach(m=>{m.geometry.dispose();m.material.dispose();});environment.dispose();renderer.dispose();throw error;}
  host.dataset.renderStyle='faceted-matte';
  host.dataset.geometry='source-stl-preserved';
  host.dataset.meshCount=String(meshes.length);
  host.dataset.triangleCount=String(meshes.reduce((total,mesh)=>total+mesh.geometry.attributes.position.count/3,0));
  let active=true,visible=true,frame=0,yaw=.62,pitch=.36,zoom=1,amount=0,drag;
  const slider=host.querySelector('[data-hw-v2-explode]');
  function draw(){frame=0;if(!active||!visible||document.hidden)return;const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();meshes.forEach(m=>m.position.y=m.userData.lift*amount);const centerY=33+amount*45;const distance=(camera.aspect<1?380:290)*zoom+amount*65;camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,centerY+Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(0,centerY,2);renderer.render(scene,camera);}
  function schedule(){if(active&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(draw);}
  function changeZoom(delta){zoom=THREE.MathUtils.clamp(zoom+delta,.5,2);schedule();}
  slider.addEventListener('input',()=>{amount=Number(slider.value)/100;host.querySelector('output').value=`${slider.value}%`;schedule();});
  host.querySelector('[data-hw-v2-reset]').addEventListener('click',()=>{yaw=.62;pitch=.36;zoom=1;amount=0;slider.value='0';host.querySelector('output').value='0%';schedule();});
  host.querySelectorAll('[data-hw-v2-zoom]').forEach(b=>b.addEventListener('click',()=>changeZoom(Number(b.dataset.hwV2Zoom))));
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.008;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.006,-.15,1.35);drag={x:e.clientX,y:e.clientY};schedule();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>canvas.addEventListener(event,()=>drag=null));
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')pitch=Math.min(1.35,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-.15,pitch-.1);if(e.key==='+'||e.key==='=')changeZoom(-.1);if(e.key==='-')changeZoom(.1);if(e.key==='Home')host.querySelector('[data-hw-v2-reset]').click();schedule();});
  new ResizeObserver(schedule).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'60px'}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
  schedule();
  return {pause(){active=false;cancelAnimationFrame(frame);frame=0;},resume(){active=true;schedule();}};
}
