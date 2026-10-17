/* BEGIN IGEM STATIC MEDIA MAP __igem_media_js_hardware_product_story_js */
function __igem_media_js_hardware_product_story_js(value) {
  var original = value, text = String(value), split = text.search(/[?#]/);
  var key = split < 0 ? text : text.slice(0, split), suffix = split < 0 ? "" : text.slice(split);
  try { key = decodeURIComponent(key); } catch (_) { return original; }
  key = key.replace(/^(?:\.\/)+/, "");
  var urls = {"../assets/hardware/product-story/pcb-bottom-0911.png":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/lossless-20261018/5466479c62ec-pcb-bottom-0911.webp","../assets/hardware/product-story/pcb-top-0911.png":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/lossless-20261018/044ea9e22bfc-pcb-top-0911.webp","assets/hardware/product-story/pcb-bottom-0911.png":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/lossless-20261018/5466479c62ec-pcb-bottom-0911.webp","assets/hardware/product-story/pcb-top-0911.png":"https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/lossless-20261018/044ea9e22bfc-pcb-top-0911.webp"};
  var target = urls[key]; if (!target) return original;
  var hashAt = target.indexOf("#"), savedHash = hashAt < 0 ? "" : target.slice(hashAt);
  if (hashAt >= 0) target = target.slice(0, hashAt);
  var suffixHash = suffix.indexOf("#"), query = suffixHash < 0 ? suffix : suffix.slice(0, suffixHash);
  if (query) target += (target.indexOf("?") < 0 ? "?" : "&") + query.slice(1);
  return target + (suffixHash < 0 ? savedHash : suffix.slice(suffixHash));
}
/* END IGEM STATIC MEDIA MAP __igem_media_js_hardware_product_story_js */
import * as THREE from './vendor/three.module.js';
import {loadHardwareWebModel} from './hardware-web-model.js?v=b549a49252ead7f1';

// The web GLB losslessly indexes the source faces; no geometry is rescaled.
// Its normals and neon edges are precomputed. Coordinates below are mm in
// the optical-face-up datum from AeroSense v2/09_engineering_sources/CAD.
// The additional PCB is a nominal interpretation of that record, not a STEP
// export or an assertion of fabricated-board fit. No retired v1 asset is used.
const PARTS = [
  {file:'01_base_BLACK.stl',min:[-54,-56,0],key:'enclosure',lift:0},
  {file:'02_black_hood_BLACK.stl',min:[-54,-56,40.8],key:'optics',lift:40},
  {file:'03_gas_lid_BLACK.stl',min:[-54,-56,57.9],key:'airflow',lift:84},
  {file:'04_well_NE_CLEAR.stl',min:[.8,.75,42.5],key:'cellculture',lift:25},
  {file:'05_well_NW_CLEAR.stl',min:[-6.5,.75,42.5],key:'cellculture',lift:25},
  {file:'06_well_SW_CLEAR.stl',min:[-6.5,-5.25,42.5],key:'cellculture',lift:25},
  {file:'07_well_SE_CLEAR.stl',min:[.8,-5.25,42.5],key:'cellculture',lift:25},
  {file:'08_gas_compression_plate_BLACK.stl',min:[-10,-9,56.1],key:'airflow',lift:55}
];
const WELLS = [[3.3,2.65],[-3.3,2.65],[-3.3,-2.65],[3.3,-2.65]];
const LEDS = [[3.3,5.7],[-3.3,5.7],[-3.3,-5.7],[3.3,-5.7]];
// Presentation translations only: no source vertex, dimension or triangle changes.
const EXPLODED_OFFSETS = [[0,0,0],[30,0,94],[0,0,209],[-27.3,-2.65,166],[-4.7,-2.65,166],[11.3,2.65,166],[20.7,2.65,166],[0,0,184]];
const SOURCE_ANCHORS=['base','hood','gas-lid','well-ne','well-nw','well-sw','well-se','well-clamp'];
const STAGES = {
  exploded:{explosion:1,yaw:.58,pitch:.26,center:[0,137,2],span:320,focus:null},
  assembled:{explosion:0,yaw:.65,pitch:.42,center:[0,33,2],span:164,focus:null},
  airflow:{explosion:.68,yaw:.7,pitch:.55,center:[0,73,0],span:194,focus:'airflow'},
  optics:{explosion:.82,yaw:.38,pitch:.71,center:[0,45,0],span:112,focus:'optics'},
  pcb:{explosion:1,yaw:.5,pitch:.76,center:[5,52,0],span:188,focus:'pcb'},
  enclosure:{explosion:.7,yaw:-.7,pitch:.4,center:[0,63,0],span:206,focus:'enclosure'},
  interface:{explosion:0,yaw:.65,pitch:.42,center:[35,33,2],span:215,focus:null},
  verification:{explosion:.3,yaw:.65,pitch:.42,center:[0,47,2],span:181,focus:null}
};
const ALIASES={overview:'assembled',product:'assembled',gas:'airflow',optical:'optics',thermal:'enclosure',phone:'interface',ui:'interface',validation:'verification'};
const COLORS={enclosure:0x4276b5,airflow:0x5a9fe1,optics:0x85b9ed,pcb:0x5288ce,cellculture:0xaccde9};
const clamp=THREE.MathUtils.clamp;

export async function createProductStory(host) {
  if(!host)throw new TypeError('A product-story host is required.');
  const canvas=host.querySelector('canvas');
  if(!canvas)throw new TypeError('The product-story host needs a canvas.');
  const status=host.querySelector('[data-product-status]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const aborter=new AbortController(),events=aborter.signal;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.setClearColor(0xffffff,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  // A single shadow map is refreshed only with an on-demand product frame.
  renderer.shadowMap.autoUpdate=false;
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-100,100,100,-100,.1,1800);
  const introCamera=new THREE.OrthographicCamera();
  scene.add(new THREE.HemisphereLight(0xe9eef4,0x20242a,1.15));
  const keyLight=new THREE.DirectionalLight(0xf5f5f2,3.05);
  keyLight.position.set(-145,245,160);keyLight.target.position.set(0,90,0);
  keyLight.castShadow=true;keyLight.shadow.mapSize.setScalar(matchMedia('(max-width: 600px)').matches?512:1024);
  Object.assign(keyLight.shadow.camera,{left:-190,right:190,top:210,bottom:-190,near:10,far:630});
  keyLight.shadow.bias=-.00018;keyLight.shadow.normalBias=.18;
  scene.add(keyLight,keyLight.target);
  [[0x31cfff,3.2,[150,125,-150]],[0xe9eef3,.75,[90,20,170]]].forEach(([color,power,pos])=>{
    const light=new THREE.DirectionalLight(color,power);light.position.set(...pos);scene.add(light);
  });
  // A distant, soft material highlight has finite falloff across broad panels;
  // it adds depth even to the orthographic view without changing CAD normals.
  const panelLight=new THREE.PointLight(0x97d7f4,26000,0,2);
  panelLight.position.set(-180,390,-250);scene.add(panelLight);
  const assemblyPanelLight=new THREE.PointLight(0xc3d6e9,19000,0,2);
  assemblyPanelLight.position.set(80,220,-320);scene.add(assemblyPanelLight);
  // Broad softboxes produce a real moving specular response as the camera
  // moves, without an image download, a postprocess or a perpetual light loop.
  // Bake the small reflection environment once and release its source scene.
  const softboxes=[
    {size:[10,6],position:[-5,5,-10],color:0xc5ced8,power:.65},
    {size:[6,6],position:[5,4,-10],color:0xd8e3ef,power:.85},
    {size:[8,5],position:[0,10,-3],color:0xf0f4f7,power:2.3},
    {size:[4,9],position:[-6,-4,8],color:0xf1f2f2,power:1.8},
    {size:[4,9],position:[4,-3,9],color:0xdce8f3,power:1.8},
    {size:[3,8],position:[8,-3,-8],color:0x45cfff,power:2}
  ];
  let environmentBakes=0;
  function bakeStudio(){
    const studio=new THREE.Scene();studio.background=new THREE.Color(0x353a41);
    for(const {size,position,color,power} of softboxes){
      const material=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(power),side:THREE.DoubleSide});
      const card=new THREE.Mesh(new THREE.PlaneGeometry(...size),material);card.position.set(...position);card.lookAt(0,0,0);studio.add(card);
    }
    const pmrem=new THREE.PMREMGenerator(renderer),map=pmrem.fromScene(studio,.06,.1,40);
    studio.traverse(obj=>{obj.geometry?.dispose();obj.material?.dispose();});pmrem.dispose();environmentBakes++;
    return map;
  }
  let studioMap=bakeStudio();
  scene.environment=studioMap.texture;scene.environmentIntensity=.9;
  const cad=new THREE.Group();cad.rotation.x=-Math.PI/2;scene.add(cad);
  const sourceMeshes=[],interactive=[],ownedTextures=[],materials=[],geometries=[],edgeHalos=[];
  // One tiny seeded texture gives the finish a fine satin grain. Projection
  // uses the original local position/normal, so the STL needs no UVs or edits.
  const grainSize=256,grainBytes=new Uint8Array(grainSize*grainSize*4);
  let grainSeed=731;
  for(let i=0;i<grainBytes.length;i+=4){
    grainSeed=(Math.imul(1664525,grainSeed)+1013904223)>>>0;
    const value=96+(grainSeed>>>25);grainBytes[i]=grainBytes[i+1]=grainBytes[i+2]=value;grainBytes[i+3]=255;
  }
  const satinGrain=new THREE.DataTexture(grainBytes,grainSize,grainSize,THREE.RGBAFormat);
  satinGrain.wrapS=satinGrain.wrapT=THREE.RepeatWrapping;satinGrain.magFilter=THREE.LinearFilter;
  satinGrain.minFilter=THREE.LinearMipmapLinearFilter;satinGrain.generateMipmaps=true;satinGrain.needsUpdate=true;ownedTextures.push(satinGrain);
  const layers={pcb:new THREE.Group(),fan:new THREE.Group(),gas:new THREE.Group(),light:new THREE.Group()};
  Object.values(layers).forEach(g=>cad.add(g));
  const statistics={sourceMeshes:0,sourceTriangles:0,sourceVertices:0,webVertices:0,sourceBytes:0,loadedBytes:0,modelFormat:'glb',modelLoadMilliseconds:0,modelParseMilliseconds:0,shadowUpdates:0,renderCount:0,fetchCount:0,finishEdgeSegments:0,failed:[],sourceBounds:{}};
  function mat(color,options={}){
    const {physical,...settings}=options;
    const Material=physical?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial;
    const value=new Material({color,roughness:.58,metalness:.08,flatShading:true,...settings});
    value.userData.originalColor=new THREE.Color(color);value.userData.originalOpacity=value.opacity;
    materials.push(value);return value;
  }
  function satin(material){
    material.onBeforeCompile=shader=>{
      shader.uniforms.satinGrain={value:satinGrain};
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSatinPosition;\nvarying vec3 vSatinNormal;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvSatinPosition=position;\nvSatinNormal=normal;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D satinGrain;\nvarying vec3 vSatinPosition;\nvarying vec3 vSatinNormal;')
        .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
          vec3 satinAxis=abs(normalize(vSatinNormal));
          vec2 satinUV=satinAxis.z>satinAxis.x&&satinAxis.z>satinAxis.y?vSatinPosition.xy:(satinAxis.x>satinAxis.y?vSatinPosition.yz:vSatinPosition.xz);
          float satinSample=texture2D(satinGrain,satinUV*.028).r;
          roughnessFactor=clamp(roughnessFactor+(satinSample-.625)*.12,.25,.7);
          diffuseColor.rgb*=.96+satinSample*.064;
        `);
    };
    material.customProgramCacheKey=()=> 'hardware-satin-v43';return material;
  }
  function edgeHalo(edges,clear){
    // Screen-space ribbons soften only the chosen outer CAD edges. This is
    // eight small transparent meshes, not full-screen bloom or a new loop.
    const ep=edges.getAttribute('position'),positions=[],starts=[],ends=[],sides=[],endsAt=[];
    for(let i=0;i<ep.count;i+=2){
      const a=[ep.getX(i),ep.getY(i),ep.getZ(i)],b=[ep.getX(i+1),ep.getY(i+1),ep.getZ(i+1)];
      for(const [at,side] of [[0,-1],[1,-1],[1,1],[0,-1],[1,1],[0,1]]){
        positions.push(...(at?b:a));starts.push(...a);ends.push(...b);sides.push(side);endsAt.push(at);
      }
    }
    const geometry=new THREE.BufferGeometry();
    for(const [name,values,size] of [['position',positions,3],['edgeStart',starts,3],['edgeEnd',ends,3],['edgeSide',sides,1],['edgeAt',endsAt,1]])geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,size));
    geometry.computeBoundingSphere();geometries.push(geometry);
    const material=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
      uniforms:{viewport:{value:new THREE.Vector2(1,1)},width:{value:clear?2.1:3.4},glowColor:{value:new THREE.Color(clear?0x43dfff:0x169fff)},opacity:{value:clear?.32:.5}},
      vertexShader:`attribute vec3 edgeStart;attribute vec3 edgeEnd;attribute float edgeSide;attribute float edgeAt;
        uniform vec2 viewport;uniform float width;varying float vEdgeSide;
        void main(){vec4 a=projectionMatrix*modelViewMatrix*vec4(edgeStart,1.);vec4 b=projectionMatrix*modelViewMatrix*vec4(edgeEnd,1.);
          vec2 delta=(b.xy/b.w-a.xy/a.w)*viewport;float len=length(delta);vec2 tangent=len>.001?delta/len:vec2(1.,0.);
          vec4 clip=mix(a,b,edgeAt);clip.xy+=vec2(-tangent.y,tangent.x)*edgeSide*width*2./viewport*clip.w;
          gl_Position=clip;vEdgeSide=edgeSide;}`,
      fragmentShader:`uniform vec3 glowColor;uniform float opacity;varying float vEdgeSide;
        void main(){float fade=pow(max(0.,1.-abs(vEdgeSide)),1.65);gl_FragColor=vec4(glowColor,opacity*fade);}`
    });materials.push(material);
    const halo=new THREE.Mesh(geometry,material);halo.renderOrder=1;edgeHalos.push(halo);return halo;
  }
  function mesh(geo,material,parent,key,name){
    geometries.push(geo);const obj=new THREE.Mesh(geo,material);parent.add(obj);
    obj.castShadow=!!key&&!material.transparent;obj.receiveShadow=!!key;
    obj.userData.castsShadow=obj.castShadow;
    if(key){obj.userData.key=key;obj.userData.name=name||key;interactive.push(obj);}
    return obj;
  }
  function box(size,at,color,parent=layers.pcb,key='pcb',name,options){
    const obj=mesh(new THREE.BoxGeometry(...size),mat(color,options),parent,key,name);
    obj.position.set(at[0]+size[0]/2,at[1]+size[1]/2,at[2]+size[2]/2);return obj;
  }
  function cylinder(radius,height,at,color,parent,key,name){
    const obj=mesh(new THREE.CylinderGeometry(radius,radius,height,24),mat(color),parent,key,name);
    obj.rotation.x=Math.PI/2;obj.position.set(at[0],at[1],at[2]+height/2);return obj;
  }
  function tube(points,color,radius,parent,opacity=.8){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve,24,radius,6,false),mat(color,{transparent:opacity<1,opacity,depthWrite:false,emissive:color,emissiveIntensity:.12}),parent);
  }
  function label(value,at,width,parent,down=false){
    const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');
    ctx.fillStyle='#dcecff';ctx.font='600 70px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,256,64);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;ownedTextures.push(texture);
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});materials.push(material);
    const obj=mesh(new THREE.PlaneGeometry(width,width/4),material,parent);obj.position.set(...at);if(down)obj.rotation.y=Math.PI;
    return obj;
  }
  // Nominal board outline, thickness and holes exactly follow design_parameters.json.
  // Rounded corners merely represent the vendor drawing; only 100 x 90 x 1.6
  // and the four hole centers are part of the nominal dimension record.
  const outline=new THREE.Shape();
  outline.moveTo(-46,-45);outline.lineTo(46,-45);outline.quadraticCurveTo(50,-45,50,-41);
  outline.lineTo(50,41);outline.quadraticCurveTo(50,45,46,45);outline.lineTo(-46,45);
  outline.quadraticCurveTo(-50,45,-50,41);outline.lineTo(-50,-41);outline.quadraticCurveTo(-50,-45,-46,-45);
  for(const x of [-45,45])for(const y of [-40,40]){const h=new THREE.Path();h.absarc(x,y,1.7,0,Math.PI*2,true);outline.holes.push(h);}
  const pcb=mesh(new THREE.ExtrudeGeometry(outline,{depth:1.6,bevelEnabled:false,curveSegments:12}),mat(0x101d34,{physical:true,roughness:.4,metalness:.12,clearcoat:.25,clearcoatRoughness:.3}),layers.pcb,'pcb','PCB · nominal 100 × 90 × 1.6 mm');pcb.position.z=38;
  for(const x of [-45,45])for(const y of [-40,40]){
    const ring=mesh(new THREE.RingGeometry(1.72,2.8,24),mat(0xd0b76e,{side:THREE.DoubleSide,roughness:.3,metalness:.65}),layers.pcb,'pcb','Mounting hole');ring.position.set(x,y,39.63);
  }
  // Source-derived nominal optical envelopes from check_nominal_board.py.
  box([4,5,.9],[-2,-2.5,39.6],0x252e35,layers.pcb,'optics','D5 · photodiode');
  box([2.1,2.3,.08],[-1.05,-1.55,40.51],0x48516f,layers.pcb,'optics','D5 active region');
  box([1.25,3,1.2],[2.875,-.2,39.6],0xc5c0a4,layers.pcb,'pcb','C21');
  box([1.25,3,1.2],[4.475,-.2,39.6],0x47494a,layers.pcb,'pcb','R27');
  box([5,8,1.75],[6.5,-3.7,39.6],0x313b3c,layers.pcb,'pcb','U8 · TIA envelope');
  for(let i=0;i<4;i++)for(const x of [6.05,11.5])box([.45,.55,.22],[x,-2.9+i*1.8,39.65],0xc7c7b7,layers.pcb,'pcb','U8 pins');
  LEDS.forEach(([x,y],i)=>{
    // Marker dimensions are illustrative; source fixes LED centers, not package shape.
    box([1.6,1.6,.55],[x-.8,y-.8,39.6],0xefe5c0,layers.pcb,'optics','LED '+(i+1));
    box([.8,.8,.12],[x-.4,y-.4,40.16],0x82c9e5,layers.pcb,'optics','LED '+(i+1),{emissive:0x65a7bd,emissiveIntensity:.16});
  });
  // The antenna audit records a module-height assumption z=34.9..38 and
  // vendor-drawn antenna tip y=-51.5399. X center is that source rectangle's center.
  box([18,25.5,3.1],[-5.749,-51.5399,34.9],0x14213a,layers.pcb,'pcb','U4 · ESP32-WROOM-32E nominal envelope');
  box([17,18.6,.12],[-5.249,-44.6399,34.77],0xc5c6bd,layers.pcb,'pcb','U4 shield',{roughness:.32,metalness:.7});
  for(let i=0;i<5;i++)box([13-i*1.4,.4,.05],[-3.3+i*.7,-50.5+i*1.1,34.81],0xcbb474,layers.pcb,'pcb','U4 antenna · illustrative copper');
  label('ESP32',[3.25,-35.5,34.74],12,layers.pcb,true);
  // Additional board markings are the current vendor's original drawings,
  // not invented copper routes. Full-page PDF renders are mapped with UVs;
  // their source pixels are unchanged; the navy material is a presentation tint.
  // TOP is the underside in
  // the optical-face-up assembly datum and therefore uses mirrored X.
  const boardDrawings=[
    {file:'pcb-bottom-0911.png',page:[400.2160034,421.6300049],bounds:[55.4400024,111.9738007,338.9039917,367.0917969],z:39.635,mirror:false},
    {file:'pcb-top-0911.png',page:[400.4320068,421.8460083],bounds:[61.5279884,111.9738007,344.9920044,367.0917969],z:37.985,mirror:true}
  ];
  async function loadBoardDrawings(){
    const loader=new THREE.TextureLoader();
    await Promise.all(boardDrawings.map(async info=>{
      try{
        const texture=await loader.loadAsync(new URL(__igem_media_js_hardware_product_story_js('../assets/hardware/product-story/'+info.file),import.meta.url).href);
        if(disposed){texture.dispose();return;}
        texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());ownedTextures.push(texture);
        const geometry=new THREE.ShapeGeometry(outline,12),uv=geometry.getAttribute('uv'),pos=geometry.getAttribute('position');
        for(let i=0;i<uv.count;i++){
          const u=pos.getX(i)/100+.5,v=pos.getY(i)/90+.5;
          uv.setXY(i,(info.bounds[0]+(info.mirror?1-u:u)*(info.bounds[2]-info.bounds[0]))/info.page[0],(info.page[1]-info.bounds[3]+v*(info.bounds[3]-info.bounds[1]))/info.page[1]);
        }
        uv.needsUpdate=true;
        const material=mat(0x27456c,{physical:true,map:texture,side:THREE.DoubleSide,roughness:.44,metalness:.08,clearcoat:.18,clearcoatRoughness:.34});
        const face=mesh(geometry,material,layers.pcb,'pcb',info.mirror?'Vendor TOP drawing · digital face':'Vendor BOT drawing · optical face');face.position.z=info.z;
        // The solid board casts its shadow; a source drawing is only its skin.
        face.castShadow=false;face.userData.castsShadow=false;
        highlight();schedule();
      }catch(error){if(!disposed)statistics.failed.push(info.file);}
    }));
  }
  // Gas/filter inserts are nominal dimensional references; the original printed
  // solids retain their exact source faces in the GLB. The filter is one layer.
  const filter=box([5.2,4.2,.15],[-2.6,-2.1,41.1],0xdeae42,layers.light,'optics','Single filter layer',{transparent:true,opacity:.66,side:THREE.DoubleSide,metalness:0});
  const fanShape=new THREE.Shape();fanShape.moveTo(-20,-20);fanShape.lineTo(20,-20);fanShape.lineTo(20,20);fanShape.lineTo(-20,20);fanShape.closePath();
  const fanOpening=new THREE.Path();fanOpening.absarc(0,0,17,0,Math.PI*2,true);fanShape.holes.push(fanOpening);
  for(const x of [-16,16])for(const y of [-16,16]){const hole=new THREE.Path();hole.absarc(x,y,1.7,0,Math.PI*2,true);fanShape.holes.push(hole);}
  const fan=mesh(new THREE.ExtrudeGeometry(fanShape,{depth:10,bevelEnabled:false,curveSegments:12}),mat(0x172840,{physical:true,roughness:.4,metalness:.08,clearcoat:.3,clearcoatRoughness:.3}),layers.fan,'enclosure','40 × 40 × 10 mm fan envelope');fan.position.set(-27,-5,6);
  cylinder(5,1,[-27,-5,14.5],0x6e829c,layers.fan,'enclosure','Fan hub');
  for(let i=0;i<7;i++){
    const blade=box([11,5,.8],[-5.5,-2.5,0],0x425b7a,layers.fan,'enclosure','Fan blade · illustrative');
    const angle=i*Math.PI*2/7;blade.position.set(-27+10*Math.cos(angle),-5+10*Math.sin(angle),15.3);blade.rotation.z=angle+.65;
  }
  // Interpretive arrows describe the separated sample-gas and cooling routes;
  // they are not CFD streamline or temperature data.
  tube([[-23,0,60.8],[-12,0,60.8],[-5,3,61],[4,2,61],[12,0,60.8],[23,0,60.8]],0x559fd8,.43,layers.gas);
  for(const x of [-18,-6,7,18]){
    const arrow=mesh(new THREE.ConeGeometry(1.2,3,8),mat(0x76b8ea),layers.gas);arrow.rotation.z=-Math.PI/2;arrow.position.set(x,0,61.2);
  }
  const cooling=new THREE.Group();layers.fan.add(cooling);
  tube([[-27,-5,-7],[-27,-5,4],[-27,-5,21],[-8,-7,24],[23,-9,22],[56,-11,19]],0x7bb2db,.62,cooling,.7);
  const opticalBeams=new THREE.Group();layers.light.add(opticalBeams);
  LEDS.forEach(([x,y],i)=>{
    tube([[x,y,40.8],[WELLS[i][0],WELLS[i][1],47]],0x70bfeb,.17,opticalBeams,.7);
    tube([[WELLS[i][0],WELLS[i][1],47],[0,-.4,41.25]],0x9dce72,.17,opticalBeams,.8);
  });
  // Ground contact is lightweight, procedural canvas, generated once.
  const groundCanvas=document.createElement('canvas');groundCanvas.width=groundCanvas.height=128;
  const context=groundCanvas.getContext('2d'),gradient=context.createRadialGradient(64,64,8,64,64,64);
  gradient.addColorStop(0,'rgba(11,25,48,.32)');gradient.addColorStop(.38,'rgba(16,32,59,.16)');gradient.addColorStop(1,'rgba(16,32,59,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);
  const groundTexture=new THREE.CanvasTexture(groundCanvas);ownedTextures.push(groundTexture);
  const groundMaterial=new THREE.MeshBasicMaterial({map:groundTexture,transparent:true,depthWrite:false});materials.push(groundMaterial);
  const ground=mesh(new THREE.PlaneGeometry(190,180),groundMaterial,cad);ground.position.z=-.15;

  let active=true,visible=false,loaded=false,started=false,disposed=false,raf=0,drag=null;
  let stage='assembled',selected='',hovered='',transition=null,yawOffset=0,pitchOffset=0,zoom=1;
  let state={...STAGES.assembled,center:[...STAGES.assembled.center]},target={...state,center:[...state.center]};
  let size={width:0,height:0},readyResolve;
  let revealStarted=false,revealProgress=0,revealPromise=null,revealResolve=null,revealPending=null;
  let storyProgress=null,storyDeparture=0,shadowPose=null;
  const ready=new Promise(resolve=>{readyResolve=resolve;});
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function writeStatus(value){
    if(!status)return;
    status.dataset.sourceText=value;
    const translated=window.AeroSenseI18n?.t(value)||value;
    if(status.textContent!==translated)status.textContent=translated;
  }
  function emit(type,detail){host.dispatchEvent(new CustomEvent(type,{detail}));}
  let anchors={};
  function projected(local,parent,key){
    const point=parent.localToWorld(new THREE.Vector3(...local)).project(camera);
    return {x:(point.x+1)/2,y:(1-point.y)/2,key,visible:point.z>-1&&point.z<1&&Math.abs(point.x)<=1&&Math.abs(point.y)<=1};
  }
  function updateAnchors(){
    const next={};
    for(const obj of sourceMeshes){
      const part=obj.userData.sourcePart,index=PARTS.indexOf(part),center=obj.geometry.boundingBox.getCenter(new THREE.Vector3());
      next[SOURCE_ANCHORS[index]]=projected(center.toArray(),obj,part.key);
    }
    const wells=['well-ne','well-nw','well-sw','well-se'].map(key=>next[key]).filter(Boolean);
    if(wells.length)next.wells={x:wells.reduce((v,p)=>v+p.x,0)/wells.length,y:wells.reduce((v,p)=>v+p.y,0)/wells.length,key:'cellculture',visible:wells.every(p=>p.visible)};
    next.filter=projected([0,0,0],filter,'optics');
    next.pcb=projected([0,0,39.6],layers.pcb,'pcb');
    next.fan=projected([-27,-5,11],layers.fan,'enclosure');
    anchors=next;
  }
  function getAnchors(){return Object.fromEntries(Object.entries(anchors).map(([key,value])=>[key,{...value}]));}
  function fitExploded(aspect){
    // Fit the complete translated geometry into the left product column. Only
    // camera framing changes; source vertices and dimensions remain untouched.
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const bounds=new THREE.Box3(),point=new THREE.Vector3();
    for(const obj of interactive){
      if(!obj.visible)continue;
      if(!obj.geometry.boundingBox)obj.geometry.computeBoundingBox();
      const b=obj.geometry.boundingBox;
      for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
        point.set(x,y,z).applyMatrix4(obj.matrixWorld).applyMatrix4(camera.matrixWorldInverse);bounds.expandByPoint(point);
      }
    }
    if(bounds.isEmpty())return;
    const midpoint=bounds.getCenter(new THREE.Vector3()),extent=bounds.getSize(new THREE.Vector3());
    const offset=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(midpoint.x)
      .add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).multiplyScalar(midpoint.y));
    camera.position.add(offset);camera.lookAt(new THREE.Vector3(...(transition?.reveal?target.center:state.center)).add(offset));camera.updateMatrixWorld(true);
    const compact=canvas.clientWidth<600,widthFraction=compact?.60:.63;
    const vertical=Math.max(extent.y/.86,extent.x/(aspect*widthFraction))*zoom;
    const centerFraction=compact?.34:.36,shift=(.5-centerFraction)*vertical*aspect;
    camera.left=-vertical*aspect/2+shift;camera.right=vertical*aspect/2+shift;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();
  }
  function highlight(){
    const focus=hovered||selected||target.focus;
    for(const obj of interactive){
      const material=obj.material;
      if(!material.userData.originalColor)continue;
      const match=focus===obj.userData.key||(focus==='optics'&&obj.userData.key==='cellculture');
      material.color.copy(material.userData.originalColor);
      material.emissive.setHex(match?(COLORS[obj.userData.key]||0x5288ce):0x000000);
      material.emissiveIntensity=match?.13:0;
      const source=obj.userData.sourcePart;
      // Reading-topic navigation and optical display grouping are independent:
      // wells link to cell culture, while the optics view still includes them.
      const sourceGroup=source?(source.file.includes('CLEAR')?'optics':source.file.includes('hood')?'enclosure':source.key):null;
      let opacity=material.userData.originalOpacity;
      if(source&&target.focus&&sourceGroup!==target.focus)opacity=Math.min(opacity,.025);
      // The optical close-up omits contextual shells; their exact meshes return
      // in every other stage. This avoids a clipped ghost outline at the frame.
      if(source&&target.focus==='optics'&&sourceGroup!=='optics')opacity=0;
      if(source&&target.focus==='airflow'&&source.file.includes('gas_lid'))opacity=.24;
      if(source&&target.focus==='enclosure'&&source.file.includes('hood'))opacity=.36;
      if(source&&sourceGroup==='optics'&&target.focus==='optics')opacity=.52;
      if(stage==='exploded'&&source?.key==='cellculture')opacity=.48;
      material.opacity=opacity;material.transparent=opacity<1;material.depthWrite=opacity>.65;
      obj.castShadow=obj.userData.castsShadow&&opacity>.65;
      if(obj.userData.finishRim){
        const emphasis=stage==='exploded'?(storyProgress===null?1:.76+.24*storyProgress):.76;
        obj.userData.finishRim.visible=opacity>.2;obj.userData.finishRim.material.opacity=obj.userData.finishRimStrength*opacity*emphasis;
        obj.userData.finishHalo.visible=opacity>.2;obj.userData.finishHalo.material.uniforms.opacity.value=(source?.key==='cellculture'?.32:.5)*opacity*emphasis;
      }
    }
  }
  function draw(time){
    raf=0;if(disposed||!active||!visible||document.hidden||!loaded)return;
    const motion=transition;
    let poseFrom=null,poseEase=1;
    if(transition){
      const p=clamp((time-transition.start)/transition.duration,0,1),e=p*p*(3-2*p);
      poseFrom=transition.poses;poseEase=e;
      for(const key of ['explosion','yaw','pitch','span'])state[key]=THREE.MathUtils.lerp(transition.from[key],target[key],e);
      state.center=transition.from.center.map((v,i)=>THREE.MathUtils.lerp(v,target.center[i],e));
      if(transition.reveal){revealProgress=e;emit('productreveal',{progress:e,complete:p===1});}
      if(p===1)transition=null;
    }
    const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
    if(size.width!==width||size.height!==height){renderer.setSize(width,height,false);size={width,height};}
    for(const halo of edgeHalos)halo.material.uniforms.viewport.value.set(width,height);
    // During the reveal, fit the final exploded arrangement first, then blend
    // the actual camera and part positions from the assembled frame. Fitting
    // intermediate geometry would cancel the opening motion or cause a snap.
    const revealing=!!motion?.reveal,cameraState=revealing?target:state;
    const aspect=width/height,span=cameraState.span*zoom;
    // Wide desktop fits a tall explosion; shallow mobile fits its full width.
    const vertical=aspect<1?span/aspect:span;
    camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();
    const yaw=cameraState.yaw+yawOffset+storyDeparture*.12,pitch=clamp(cameraState.pitch+pitchOffset+storyDeparture*.06,-.6,1.42),distance=440;
    camera.position.set(cameraState.center[0]+Math.sin(yaw)*Math.cos(pitch)*distance,cameraState.center[1]+Math.sin(pitch)*distance,cameraState.center[2]+Math.cos(yaw)*Math.cos(pitch)*distance);
    camera.lookAt(...cameraState.center);
    const exploded=stage==='exploded',spread=width<600?.45:1;
    sourceMeshes.forEach(obj=>{
      const part=obj.userData.sourcePart;
      if(exploded){const offset=EXPLODED_OFFSETS[PARTS.indexOf(part)];obj.position.set(offset[0]*(part.key==='cellculture'?1:spread),offset[1],offset[2]*(width<600?1.35:1));}
      else obj.position.set(0,0,stage==='optics'&&part.key==='cellculture'?0:part.lift*state.explosion);
    });
    const separation=width<600?1.35:1;
    layers.pcb.position.set(exploded?-25*spread:stage==='pcb'?state.explosion*19:0,stage==='pcb'?-state.explosion*12:0,exploded?58*separation:stage==='pcb'?state.explosion*16:0);
    layers.fan.position.set(exploded?65*spread:0,exploded?-15:0,exploded?65*separation:0);
    layers.light.position.set(exploded?-35*spread:0,0,exploded?144*separation:0);
    layers.gas.position.z=84*state.explosion;layers.gas.visible=stage==='airflow';
    opticalBeams.visible=stage==='optics';filter.visible=exploded||stage==='optics'||stage==='pcb';
    ground.visible=!exploded&&stage!=='optics';
    cooling.visible=stage==='enclosure';
    if(exploded)fitExploded(aspect);
    if(storyProgress!==null&&exploded&&storyProgress<1){
      // Scroll owns both the camera and every translated part. Endpoint fitting
      // is stable; an arriving scroll event can never replay an earlier pose.
      const ease=n=>{n=clamp(n,0,1);return n*n*n*(n*(n*6-15)+10);};
      const e=ease(storyProgress),a=STAGES.assembled,ay=-.24+yawOffset,ap=a.pitch+pitchOffset;
      const start=new THREE.Vector3(a.center[0]+Math.sin(ay)*Math.cos(ap)*distance,a.center[1]+Math.sin(ap)*distance,a.center[2]+Math.cos(ay)*Math.cos(ap)*distance);
      introCamera.position.copy(start);introCamera.lookAt(...a.center);
      camera.position.lerpVectors(start,camera.position,e);camera.quaternion.slerpQuaternions(introCamera.quaternion,camera.quaternion.clone(),e);
      const av=(aspect<1?a.span/aspect:a.span)*zoom;
      const initial={left:-av*aspect/2,right:av*aspect/2,top:av/2,bottom:-av/2};
      for(const key of ['left','right','top','bottom'])camera[key]=THREE.MathUtils.lerp(initial[key],camera[key],e);
      camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
      for(const obj of sourceMeshes){
        const key=obj.userData.sourcePart.key,delay=key==='cellculture'?.16:key==='airflow'?.02:key==='optics'?.08:0;
        obj.position.multiplyScalar(ease((storyProgress-delay)/(1-delay)));
      }
      for(const [key,obj] of Object.entries(layers)){
        const delay={pcb:.10,fan:.12,light:.22,gas:0}[key];
        obj.position.multiplyScalar(ease((storyProgress-delay)/(1-delay)));
      }
    }
    if(revealing&&poseEase<1){
      camera.position.lerpVectors(motion.camera.position,camera.position,poseEase);
      camera.quaternion.slerpQuaternions(motion.camera.quaternion,camera.quaternion.clone(),poseEase);
      // A small continuous pullback gives moving corners room on narrow screens.
      const pullback=1+.14*Math.sin(Math.PI*poseEase);
      for(const key of ['left','right','top','bottom'])camera[key]=THREE.MathUtils.lerp(motion.camera[key],camera[key],poseEase)*pullback;
      camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
    }
    if(poseFrom&&poseEase<1)for(const pose of poseFrom)pose.object.position.lerpVectors(pose.position,pose.object.position,poseEase);
    // The light and geometry are fixed during camera/hover-only redraws.
    // Rebuild its shadow map only when a part moves or shadow visibility changes.
    const nextShadowPose=[stage,...[...sourceMeshes,...Object.values(layers)].flatMap(obj=>[obj.position.x,obj.position.y,obj.position.z,obj.visible]),...interactive.map(obj=>obj.castShadow)];
    const updateShadow=!shadowPose||nextShadowPose.length!==shadowPose.length||nextShadowPose.some((value,index)=>value!==shadowPose[index]);
    renderer.shadowMap.needsUpdate=updateShadow;
    if(updateShadow){shadowPose=nextShadowPose;statistics.shadowUpdates++;}
    renderer.render(scene,camera);statistics.renderCount++;
    if(statistics.sourceMeshes===8)host.classList.add('is-ready');
    updateAnchors();emit('productrender',{stage,anchors:getAnchors(),revealProgress:revealStarted?revealProgress:1,loaded:statistics.sourceMeshes});
    if(revealing&&!transition)finishReveal();
    if(transition)schedule();
  }
  function schedule(){if(!disposed&&active&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(draw);}
  function setStage(key,progress){
    key=key==='cellculture'?'optics':ALIASES[key]||key;if(!STAGES[key]||disposed)return false;
    storyProgress=null;storyDeparture=0;
    const interruptedReveal=revealStarted&&revealProgress<1;
    if(interruptedReveal)finishReveal();
    const drivenProgress=progress!==undefined,sameStage=stage===key;
    progress=progress===undefined?(key==='assembled'?0:1):clamp(Number.isFinite(Number(progress))?Number(progress):1,0,1);
    const next={...STAGES[key],center:[...STAGES[key].center]};
    // A numeric progress parameter controls assembly separation within a stage.
    if(key==='assembled'){
      next.explosion=.78*progress;next.center[1]+=31*progress;next.span+=30*progress;
    }else next.explosion*=progress;
    if(stage===key&&Math.abs(target.explosion-next.explosion)<.001&&!interruptedReveal)return true;
    const from={...state,center:[...state.center]};
    let poses;
    if(stage==='exploded'&&key!=='exploded'){
      // Begin from the actual fitted view and translated parts. Mobile fitting
      // differs from the topic-camera span convention, so convert the current
      // frustum before easing; this prevents a one-frame zoom or assembly jump.
      const aspect=Math.max(1,canvas.clientWidth)/Math.max(1,canvas.clientHeight);
      from.span=(camera.top-camera.bottom)*(aspect<1?aspect:1);
      const direction=camera.getWorldDirection(new THREE.Vector3());
      from.yaw=Math.atan2(-direction.x,-direction.z);from.pitch=Math.asin(clamp(-direction.y,-1,1));
      const frameOffset=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar((camera.left+camera.right)/2);
      from.center=camera.position.clone().addScaledVector(direction,440).add(frameOffset).toArray();
      poses=[...sourceMeshes,...Object.values(layers)].map(object=>({object,position:object.position.clone()}));
    }
    stage=key;selected='';hovered='';target=next;yawOffset=0;pitchOffset=0;zoom=1;
    if(key==='exploded'||reduced.matches||(sameStage&&drivenProgress)){state={...next,center:[...next.center]};transition=null;}
    else transition={from,poses,start:performance.now(),duration:560};
    host.dataset.productStage=stage;highlight();schedule();return true;
  }
  function finishReveal(){
    revealProgress=1;revealPending=null;host.dataset.productRevealing='false';
    if(revealResolve){revealResolve({loaded:statistics.sourceMeshes,disposed});revealResolve=null;}
  }
  function beginReveal(){
    if(disposed){finishReveal();return;}
    if(!active||!visible||document.hidden){revealPending=beginReveal;return;}
    revealPending=null;
    stage='assembled';selected='';hovered='';yawOffset=0;pitchOffset=0;zoom=1;transition=null;
    state={...STAGES.assembled,center:[...STAGES.assembled.center]};target={...state,center:[...state.center]};
    highlight();cancelAnimationFrame(raf);raf=0;draw(performance.now());
    const from={...state,center:[...state.center]};
    const poses=[...sourceMeshes,...Object.values(layers)].map(object=>({object,position:object.position.clone()}));
    const fromCamera={position:camera.position.clone(),quaternion:camera.quaternion.clone(),left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom};
    stage='exploded';target={...STAGES.exploded,center:[...STAGES.exploded.center]};
    host.dataset.productStage=stage;
    if(reduced.matches){state={...target,center:[...target.center]};finishReveal();}
    else{host.dataset.productRevealing='true';transition={from,poses,camera:fromCamera,reveal:true,start:performance.now(),duration:1400};}
    highlight();schedule();
  }
  function reveal(){
    // The intro runs once per viewer. Explicit topic navigation always retains
    // the existing immediate, exact exploded restore pose.
    if(revealPromise)return revealPromise;
    revealStarted=true;revealProgress=0;
    revealPromise=new Promise(resolve=>{revealResolve=resolve;});
    if(loaded)beginReveal();else ready.then(beginReveal);
    return revealPromise;
  }
  function setStoryProgress(progress,departure=0){
    const p=reduced.matches?1:clamp(Number(progress)||0,0,1),d=reduced.matches?0:clamp(Number(departure)||0,0,1);
    if(stage==='exploded'&&storyProgress===p&&storyDeparture===d)return;
    storyProgress=p;storyDeparture=d;stage='exploded';transition=null;
    target={...STAGES.exploded,center:[...STAGES.exploded.center]};state={...target,center:[...target.center]};
    revealStarted=true;revealProgress=p;host.dataset.productStage=stage;host.dataset.productRevealing=String(p>0&&p<1);
    highlight();schedule();
  }
  function select(key,source='api',part){
    key=ALIASES[key]||key;if(!STAGES[key]&&!COLORS[key])return false;
    if(stage!=='exploded')setStage(key);
    selected=key;highlight();schedule();emit('productselect',{key,source,part:part||null});return true;
  }
  function hitAt(event){
    const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);scene.updateMatrixWorld(true);
    return raycaster.intersectObjects(interactive.filter(o=>o.visible&&o.material.opacity>.2),false)[0]?.object;
  }
  function hover(event){
    const hit=hitAt(event),key=hit?.userData.key||'';
    if(key===hovered)return;hovered=key;canvas.style.cursor=key?'pointer':'grab';
    highlight();schedule();emit('producthover',{key:key||null,part:hit?.userData.name||null});
  }
  let lastHover=0;
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    drag={startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false,touch:event.pointerType==='touch'};
    if(!drag.touch){canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});}
  },{signal:events});
  canvas.addEventListener('pointermove',event=>{
    if(drag){
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y,totalX=event.clientX-drag.startX,totalY=event.clientY-drag.startY;
      if(!drag.moved&&Math.hypot(totalX,totalY)>5){
        if(drag.touch&&Math.abs(totalY)>Math.abs(totalX)){drag=null;return;}
        drag.moved=true;canvas.setPointerCapture(event.pointerId);
      }
      if(drag.moved){yawOffset-=dx*.008;pitchOffset=clamp(pitchOffset+dy*.006,-1,1);canvas.style.cursor='grabbing';schedule();}
      drag.x=event.clientX;drag.y=event.clientY;
    }else if(event.pointerType!=='touch'&&performance.now()-lastHover>45){lastHover=performance.now();hover(event);}
  },{signal:events});
  canvas.addEventListener('pointerup',event=>{
    if(drag&&!drag.moved){const hit=hitAt(event);if(hit)select(hit.userData.key,'pointer',hit.userData.name);}
    drag=null;canvas.style.cursor='grab';
  },{signal:events});
  ['pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,()=>{drag=null;},{signal:events}));
  canvas.addEventListener('pointerleave',()=>{if(!drag&&hovered){hovered='';highlight();schedule();emit('producthover',{key:null,part:null});}},{signal:events});
  function reset(){yawOffset=0;pitchOffset=0;zoom=1;selected='';hovered='';highlight();schedule();}
  canvas.addEventListener('keydown',event=>{
    const key=event.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home','Enter',' '].includes(key))return;
    event.preventDefault();
    if(key==='ArrowLeft')yawOffset-=.12;if(key==='ArrowRight')yawOffset+=.12;
    if(key==='ArrowUp')pitchOffset=clamp(pitchOffset+.1,-1,1);if(key==='ArrowDown')pitchOffset=clamp(pitchOffset-.1,-1,1);
    if(key==='+'||key==='=')zoom=clamp(zoom-.1,.55,1.7);if(key==='-')zoom=clamp(zoom+.1,.55,1.7);
    if(key==='Home')reset();if(key==='Enter'||key===' ')select(hovered||selected||stage,'keyboard');schedule();
  },{signal:events});
  async function loadSources(){
    if(started||disposed)return;started=true;host.dataset.productLoading='true';
    writeStatus('Loading 3D model…');
    async function loadMeshes(){
      try{
        statistics.fetchCount++;
        const model=await loadHardwareWebModel(events);
        if(disposed){for(const value of model.parts.values()){value.geometry.dispose();value.edges.dispose();}return;}
        statistics.loadedBytes=model.byteLength;statistics.modelLoadMilliseconds=model.loadMilliseconds;statistics.modelParseMilliseconds=model.parseMilliseconds;
        for(const part of PARTS){
          const value=model.parts.get(part.file),geometry=value.geometry,edges=value.edges,clear=part.file.includes('CLEAR');
          const material=mat(clear?0xb9dce4:0x202730,{physical:true,flatShading:clear,roughness:clear?.15:.4,metalness:clear?0:.44,specularColor:new THREE.Color(0xffffff),specularIntensity:clear?.75:.7,clearcoat:clear?.72:.36,clearcoatRoughness:clear?.16:.36,transparent:clear,opacity:clear?.66:1,side:THREE.DoubleSide});
          const obj=mesh(geometry,clear?material:satin(material),cad,part.key,part.file.replace(/\.stl$/,''));
          // Identical outer-edge endpoints are stored in the GLB. No runtime
          // adjacency scan, normal averaging or CAD-edge reconstruction needed.
          const strength=clear?.95:.92,edgeMaterial=new THREE.LineBasicMaterial({color:clear?0x70f0ff:0x4beaff,transparent:true,opacity:strength,depthWrite:false,toneMapped:false});
          geometries.push(edges);materials.push(edgeMaterial);const rim=new THREE.LineSegments(edges,edgeMaterial);rim.renderOrder=2;obj.add(rim);obj.userData.finishRim=rim;obj.userData.finishRimStrength=strength;
          const halo=edgeHalo(edges,clear);obj.add(halo);obj.userData.finishHalo=halo;
          statistics.finishEdgeSegments+=edges.getAttribute('position').count/2;
          obj.userData.sourcePart=part;sourceMeshes.push(obj);
          const triangles=geometry.index.count/3,source=model.metadata.parts.find(record=>record.file===part.file);
          statistics.sourceMeshes++;statistics.sourceTriangles+=triangles;statistics.sourceVertices+=source.sourceVertices;statistics.webVertices+=geometry.attributes.position.count;statistics.sourceBytes+=source.sourceBytes;
          statistics.sourceBounds[part.file]={min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray(),triangles};
          emit('productload',{loaded:statistics.sourceMeshes,total:PARTS.length});
        }
        highlight();schedule();
      }catch(error){if(disposed||error.name==='AbortError')return;statistics.failed.push(...PARTS.filter(part=>!sourceMeshes.some(mesh=>mesh.userData.sourcePart===part)).map(part=>part.file));}
    }
    await Promise.all([loadMeshes(),loadBoardDrawings()]);if(disposed)return;
    loaded=true;host.dataset.productLoading='false';host.dataset.geometry='lossless-indexed-glb';host.dataset.meshCount=String(statistics.sourceMeshes);
    host.dataset.pcbGeometry='source-derived-nominal';
    writeStatus(statistics.failed.length?'Some parts could not load. Open the source drawings below.':'3D model ready.');
    readyResolve({loaded:statistics.sourceMeshes,failed:[...statistics.failed]});schedule();emit('productready',{loaded:statistics.sourceMeshes,failed:[...statistics.failed]});
  }
  const resize=new ResizeObserver(schedule);resize.observe(canvas);
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible){loadSources();if(revealPending&&loaded)revealPending();schedule();}else{cancelAnimationFrame(raf);raf=0;}
  },{rootMargin:'160px'});observer.observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{if(revealPending&&loaded)revealPending();schedule();}},{signal:events});
  reduced.addEventListener('change',()=>{if(reduced.matches&&transition){state={...target,center:[...target.center]};transition=null;if(revealStarted&&revealProgress<1)finishReveal();schedule();}},{signal:events});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();active=false;cancelAnimationFrame(raf);raf=0;writeStatus('3D rendering paused. Use the drawings below.');},{signal:events});
  canvas.addEventListener('webglcontextrestored',()=>{studioMap.dispose();studioMap=bakeStudio();scene.environment=studioMap.texture;shadowPose=null;active=true;writeStatus(loaded?'3D model ready.':'Loading 3D model…');schedule();},{signal:events});
  host.dataset.productStage='assembled';host.dataset.productRenderer='on-demand';host.dataset.productRevealing='false';
  // Fetch the compact source mesh set before the reader reaches the scene.
  // Rendering still waits for a complete set and a visible canvas.
  loadSources();
  return {
    ready,reveal,setStoryProgress,setStage,select,reset,getAnchors,
    highlight(key){hovered=ALIASES[key]||key||'';highlight();schedule();},
    refreshLabels(){if(status?.dataset.sourceText)writeStatus(status.dataset.sourceText);},
    pause(){active=false;cancelAnimationFrame(raf);raf=0;},
    resume(){active=true;if(revealPending&&loaded)revealPending();schedule();},
    zoom(delta){zoom=clamp(zoom+Number(delta||0),.55,1.7);schedule();},
    getDiagnostics(){return {...statistics,failed:[...statistics.failed],sourceBounds:{...statistics.sourceBounds},stage,active,visible,loaded,disposed,framePending:!!raf,lighting:{environment:'procedural softbox studio',environmentBakes,shadowLights:1,shadowUpdatePolicy:'part-pose-or-visibility-change',shadowMapSize:keyLight.shadow.mapSize.x,continuousAnimation:false,finish:'satin charcoal with neon cyan edges',grainTextureSize:grainSize,grainBytes:grainBytes.byteLength,grainSamplesPerFragment:1,normalCreaseDegrees:35,edgeHalo:{method:'local screen-space ribbons',meshes:edgeHalos.length,maxHalfWidthCss:3.4,postprocess:false}},renderResources:{drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,lines:renderer.info.render.lines,textures:renderer.info.memory.textures},reveal:{started:revealStarted,progress:revealProgress,active:!!transition?.reveal,scrollDriven:storyProgress!==null},board:{size:[100,90,1.6],bottomZ:38,opticalFaceZ:39.6,holes:[[-45,-40],[45,-40],[-45,40],[45,40]],status:'source-derived nominal geometry'},camera:{yaw:state.yaw+yawOffset,pitch:state.pitch+pitchOffset,zoom}};},
    dispose(){
      if(disposed)return;disposed=true;aborter.abort();cancelAnimationFrame(raf);raf=0;resize.disconnect();observer.disconnect();
      for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of ownedTextures)texture.dispose();
      scene.environment=null;studioMap.dispose();keyLight.shadow.map?.dispose();
      renderer.dispose();finishReveal();readyResolve({loaded:statistics.sourceMeshes,disposed:true,failed:[...statistics.failed]});
    }
  };
}
