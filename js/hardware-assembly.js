import * as THREE from './vendor/three.module.js';

const host=document.querySelector('[data-stl-viewer]');
if(host){
  const stage=host.querySelector('.hw-exploded__stage'),canvas=host.querySelector('canvas'),fallback=host.querySelector('.hw-exploded__fallback'),controls=host.querySelector('.hw-exploded__controls'),detail=host.querySelector('.hw-exploded__detail');
  const base='hardware%20information/AeroSense/STL/';
  const parts=[
    {name:'Integrated body',file:'01_integrated_body.stl',role:'Encloses the optical and electronic interfaces.',material:'Rigid black resin',color:0x365363,pos:[0,0,0]},
    {name:'Service tray',file:'02_service_tray.stl',role:'Provides access to the electronics beneath the body.',material:'Gray resin',color:0x82949c,pos:[0,-4.4,0]},
    {name:'Hinged lid',file:'03_hinged_lid.stl',role:'Closes the enclosure and locates the upper assembly.',material:'Rigid black resin',color:0x425e69,pos:[0,6.3,0]},
    {name:'Gas-optical cap',file:'04_common_gas_optical_cap.stl',role:'Defines the common gas space and optical assembly above the wells.',material:'Rigid black resin',color:0x587c79,pos:[0,4.1,0]},
    {name:'NE well',file:'05_well_NE_CLEAR.stl',role:'One clear cell-free trial well.',material:'Clear test resin',color:0x83d7d0,pos:[1.35,2.3,-1.2]},
    {name:'NW well',file:'05_well_NW_CLEAR.stl',role:'One clear cell-free trial well.',material:'Clear test resin',color:0x83d7d0,pos:[-1.35,2.3,-1.2]},
    {name:'SW well',file:'05_well_SW_CLEAR.stl',role:'One clear cell-free trial well.',material:'Clear test resin',color:0x83d7d0,pos:[-1.35,2.3,1.2]},
    {name:'SE well',file:'05_well_SE_CLEAR.stl',role:'One clear cell-free trial well.',material:'Clear test resin',color:0x83d7d0,pos:[1.35,2.3,1.2]}
  ];
  function parseStl(buffer){
    const view=new DataView(buffer),n=view.getUint32(80,true);
    if(84+n*50!==buffer.byteLength)throw new Error('Unsupported STL encoding');
    const position=new Float32Array(n*9),normal=new Float32Array(n*9);
    for(let i=0;i<n;i++){
      const off=84+i*50,nx=view.getFloat32(off,true),ny=view.getFloat32(off+4,true),nz=view.getFloat32(off+8,true);
      for(let v=0;v<3;v++)for(let k=0;k<3;k++){position[i*9+v*3+k]=view.getFloat32(off+12+v*12+k*4,true);normal[i*9+v*3+k]=[nx,ny,nz][k];}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(position,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normal,3));geometry.center();return geometry;
  }
  let renderer,scene,camera,group,meshes=[],selected=-1,drag=null,rotX=-.27,rotY=.55,distance=29,visible=false,frame=0;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function render(){frame=0;if(!visible||!renderer)return;group.rotation.set(rotX,rotY,0);renderer.render(scene,camera);frame=requestAnimationFrame(render);}
  function resize(){if(!renderer)return;const width=stage.clientWidth,height=Math.max(300,Math.round(width*.59));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
  function select(index){index=index>=4?4:index;selected=index;parts.forEach((part,i)=>{
    const mesh=meshes[i];if(mesh){mesh.material.opacity=index<0||index===(i>=4?4:i)?1:.18;mesh.material.emissive.setHex(index===(i>=4?4:i)?0x4c9c70:0x000000);mesh.material.emissiveIntensity=index===(i>=4?4:i)?.38:0;}
    controls.children[i]?.setAttribute('aria-pressed',String(index===(i>=4?4:i)));
  });
    detail.replaceChildren();if(index<0){detail.textContent='Select a part in the model or the labels above to inspect its role and download the source mesh.';return;}
    const part=index===4?{...parts[4],name:'Four-well cartridge',role:'Four clear trial wells form one aligned cartridge assembly.'}:parts[index],title=document.createElement('strong'),copy=document.createElement('p'),link=document.createElement('a');
    title.textContent=part.name;copy.textContent=`${part.role} Material: ${part.material}.`;
    link.href=base+part.file;link.download='';link.textContent='Download this STL ↗';detail.append(title,copy,link);if(index===4){link.textContent='Download NE well STL ↗';parts.slice(5).forEach(p=>{const a=document.createElement('a');a.href=base+p.file;a.download='';a.textContent=' · '+p.name+' STL ↗';detail.append(a);});}
  }
  parts.forEach((part,index)=>{if(index>4)return;const button=document.createElement('button');button.type='button';button.textContent=index===4?'Four-well cartridge':part.name;button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>select(index));controls.append(button);});
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
    scene=new THREE.Scene();scene.background=new THREE.Color(0xeaf0e8);
    camera=new THREE.PerspectiveCamera(37,1,.1,100);camera.position.set(0,3,distance);camera.lookAt(0,1,0);
    scene.add(new THREE.HemisphereLight(0xffffff,0x9aaec0,2));const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(5,9,7);scene.add(key);const rim=new THREE.DirectionalLight(0x88edc2,1.1);rim.position.set(-5,2,-5);scene.add(rim);
    group=new THREE.Group();scene.add(group);
    Promise.all(parts.map(async(part,index)=>{const response=await fetch(base+part.file);if(!response.ok)throw new Error(part.file);const geometry=parseStl(await response.arrayBuffer());const material=new THREE.MeshStandardMaterial({color:part.color,roughness:.57,metalness:.1,transparent:true,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geometry,material);mesh.scale.setScalar(.05);mesh.rotation.x=-Math.PI/2;mesh.position.set(...part.pos);mesh.userData.index=index;group.add(mesh);meshes[index]=mesh;})).then(()=>{fallback.hidden=true;host.classList.add('is-ready');select(-1);resize();visible=true;frame=requestAnimationFrame(render);}).catch(()=>{canvas.hidden=true;host.classList.add('is-fallback');select(-1);});
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!frame)frame=requestAnimationFrame(render);else if(!visible&&frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'150px'}).observe(host);
    canvas.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY,ox:rotX,oy:rotY,moved:false};canvas.setPointerCapture(event.pointerId);});
    canvas.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;rotY=drag.oy+dx*.009;rotX=Math.max(-1.2,Math.min(.65,drag.ox+dy*.008));});
    canvas.addEventListener('pointerup',event=>{if(!drag)return;if(!drag.moved){const bounds=canvas.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-((event.clientY-bounds.top)/bounds.height*2-1));raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes.filter(Boolean),false)[0];if(hit)select(hit.object.userData.index);}drag=null;});
    canvas.addEventListener('wheel',event=>{event.preventDefault();distance=Math.max(13,Math.min(45,distance+Math.sign(event.deltaY)*.8));camera.position.set(0,3,distance);camera.lookAt(0,1,0);},{passive:false});
    canvas.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')rotY-=.14;else if(event.key==='ArrowRight')rotY+=.14;else if(event.key==='ArrowUp')rotX-=.12;else if(event.key==='ArrowDown')rotX+=.12;else return;event.preventDefault();});
  }catch{canvas.hidden=true;host.classList.add('is-fallback');select(0);}
}
