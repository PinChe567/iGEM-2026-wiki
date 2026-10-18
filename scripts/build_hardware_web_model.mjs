/**
 * Build the display-only, indexed GLB from the eight original printable STLs.
 * No face is removed, moved, rescaled or reordered. Normals and neon edges use
 * the existing viewer's exact calculations, performed once at build time.
 * The original CAD/STL files remain the manufacturing/reproduction sources.
 * From the site repository: node scripts/build_hardware_web_model.mjs
 */
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import * as THREE from '../js/vendor/three.module.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const researchRoot=process.env.AEROSENSE_RESEARCH_ROOT ||
  ['../zenodo-release/aerosense-wiki','../../zenodo-release/aerosense-wiki']
    .map(relative=>path.resolve(root,relative))
    .find(candidate=>existsSync(path.join(candidate,'hardware information/AeroSense v2/01_print')));
if(!researchRoot)throw new Error('Research sources were not found. Keep zenodo-release in the workspace root or set AEROSENSE_RESEARCH_ROOT.');
const source=path.join(researchRoot,'hardware information/AeroSense v2/01_print');
const output=path.join(root,'assets/hardware/product-story');
const parts=[
  {file:'01_base_BLACK.stl',min:[-54,-56,0],key:'enclosure',lift:0},
  {file:'02_black_hood_BLACK.stl',min:[-54,-56,40.8],key:'optics',lift:40},
  {file:'03_gas_lid_BLACK.stl',min:[-54,-56,57.9],key:'airflow',lift:84},
  {file:'04_well_NE_CLEAR.stl',min:[.8,.75,42.5],key:'cellculture',lift:25},
  {file:'05_well_NW_CLEAR.stl',min:[-6.5,.75,42.5],key:'cellculture',lift:25},
  {file:'06_well_SW_CLEAR.stl',min:[-6.5,-5.25,42.5],key:'cellculture',lift:25},
  {file:'07_well_SE_CLEAR.stl',min:[.8,-5.25,42.5],key:'cellculture',lift:25},
  {file:'08_gas_compression_plate_BLACK.stl',min:[-10,-9,56.1],key:'airflow',lift:55}
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const gltf={asset:{version:'2.0',generator:'AeroSense exact-geometry web-model builder'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'AeroSense',rotation:[-Math.SQRT1_2,0,0,Math.SQRT1_2],children:[]}],meshes:[],buffers:[{byteLength:0}],bufferViews:[],accessors:[],materials:[
  {name:'Charcoal',pbrMetallicRoughness:{baseColorFactor:[.0144,.0203,.0296,1],metallicFactor:.44,roughnessFactor:.4},doubleSided:true},
  {name:'Clear wells',pbrMetallicRoughness:{baseColorFactor:[.485,.716,.776,.66],metallicFactor:0,roughnessFactor:.15},alphaMode:'BLEND',doubleSided:true},
  {name:'Cyan edge guide',pbrMetallicRoughness:{baseColorFactor:[.0704,.823,.913,1],metallicFactor:0,roughnessFactor:1},emissiveFactor:[.0704,.823,.913]}
]};
const chunks=[],records=[];
let binaryBytes=0;
function accessor(array,type,componentType,target,bounds){
  const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength);
  const view=gltf.bufferViews.length;
  gltf.bufferViews.push({buffer:0,byteOffset:binaryBytes,byteLength:bytes.length,target});
  chunks.push(bytes);binaryBytes+=bytes.length;
  const pad=(4-binaryBytes%4)%4;if(pad){chunks.push(Buffer.alloc(pad));binaryBytes+=pad;}
  const id=gltf.accessors.length,size={SCALAR:1,VEC3:3}[type];
  gltf.accessors.push({bufferView:view,componentType,count:array.length/size,type,...bounds});
  return id;
}
function parseSTL(buffer,part){
  const view=new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength),count=view.getUint32(80,true);
  if(buffer.byteLength!==84+count*50)throw new Error('Invalid binary STL: '+part.file);
  const positions=new Float32Array(count*9);
  for(let n=0;n<count;n++)for(let v=0;v<3;v++)for(let a=0;a<3;a++)positions[n*9+v*3+a]=view.getFloat32(84+n*50+12+v*12+a*4,true);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.computeBoundingBox();
  const min=geometry.boundingBox.min;geometry.translate(part.min[0]-min.x,part.min[1]-min.y,part.min[2]-min.z);
  geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}
function softenCurvedNormals(geometry){
  const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),original=n.array.slice(),groups=new Map();
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*10000)).join(',');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);
  }
  const threshold=Math.cos(35*Math.PI/180);
  for(const indices of groups.values())for(const i of indices){
    const a=i*3;let x=0,y=0,z=0;
    for(const j of indices){const b=j*3;if(original[a]*original[b]+original[a+1]*original[b+1]+original[a+2]*original[b+2]>=threshold){x+=original[b];y+=original[b+1];z+=original[b+2];}}
    const length=Math.hypot(x,y,z)||1;n.setXYZ(i,x/length,y/length,z/length);
  }
}
function exactIndex(geometry){
  const pos=geometry.getAttribute('position').array,norm=geometry.getAttribute('normal').array;
  const pbits=new Uint32Array(pos.buffer,pos.byteOffset,pos.length),nbits=new Uint32Array(norm.buffer,norm.byteOffset,norm.length);
  const seen=new Map(),positions=[],normals=[],indices=[];
  for(let i=0;i<pos.length;i+=3){
    // Match float bit patterns, including signed zero, not approximate distances.
    const key=`${pbits[i]},${pbits[i+1]},${pbits[i+2]};${nbits[i]},${nbits[i+1]},${nbits[i+2]}`;
    let index=seen.get(key);
    if(index===undefined){index=positions.length/3;seen.set(key,index);positions.push(pos[i],pos[i+1],pos[i+2]);normals.push(norm[i],norm[i+1],norm[i+2]);}
    indices.push(index);
  }
  const p=new Float32Array(positions),n=new Float32Array(normals),Index=p.length/3<65536?Uint16Array:Uint32Array,index=new Index(indices);
  for(let i=0;i<indices.length;i++)for(let a=0;a<3;a++){
    if(!Object.is(p[indices[i]*3+a],pos[i*3+a])||!Object.is(n[indices[i]*3+a],norm[i*3+a]))throw new Error('Indexing altered vertex data.');
  }
  return {positions:p,normals:n,indices:index};
}
for(const part of parts){
  const buffer=await fs.readFile(path.join(source,part.file)),geometry=parseSTL(buffer,part),clear=part.file.includes('CLEAR');
  if(!clear)softenCurvedNormals(geometry);
  const indexed=exactIndex(geometry),bounds={min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()};
  const edges=new THREE.EdgesGeometry(geometry,55);
  if(!clear){
    const ep=edges.getAttribute('position'),b=geometry.boundingBox,outer=[];
    for(let i=0;i<ep.count;i+=2){
      const near=axis=>[b.min.getComponent(axis),b.max.getComponent(axis)].some(limit=>Math.abs(ep.array[i*3+axis]-limit)<3.2&&Math.abs(ep.array[(i+1)*3+axis]-limit)<3.2);
      if(near(0)||near(1))for(let j=i*3;j<(i+2)*3;j++)outer.push(ep.array[j]);
    }
    edges.setAttribute('position',new THREE.Float32BufferAttribute(outer,3));
  }
  const meshId=gltf.meshes.length;
  gltf.meshes.push({name:part.file,primitives:[{attributes:{POSITION:accessor(indexed.positions,'VEC3',5126,34962,bounds),NORMAL:accessor(indexed.normals,'VEC3',5126,34962)},indices:accessor(indexed.indices,'SCALAR',indexed.indices.BYTES_PER_ELEMENT===2?5123:5125,34963),material:clear?1:0,mode:4}]});
  const nodeId=gltf.nodes.length;
  gltf.nodes.push({name:part.file.replace(/\.stl$/,''),mesh:meshId,children:[nodeId+1],extras:{sourceFile:part.file,key:part.key,lift:part.lift,sourceTriangles:indexed.indices.length/3}});
  gltf.nodes[0].children.push(nodeId);
  edges.computeBoundingBox();
  const edgeId=gltf.meshes.length;
  gltf.meshes.push({name:part.file+'-edges',primitives:[{attributes:{POSITION:accessor(edges.getAttribute('position').array,'VEC3',5126,34962,{min:edges.boundingBox.min.toArray(),max:edges.boundingBox.max.toArray()})},material:2,mode:1}]});
  gltf.nodes.push({name:part.file.replace(/\.stl$/,'')+'-edges',mesh:edgeId,extras:{role:'precomputed-neon-edges'}});
  records.push({file:part.file,sha256:hash(buffer),sourceBytes:buffer.length,triangles:indexed.indices.length/3,sourceVertices:geometry.getAttribute('position').count,webVertices:indexed.positions.length/3,indexBytes:indexed.indices.byteLength,attributeBytes:indexed.positions.byteLength+indexed.normals.byteLength,edgeSegments:edges.getAttribute('position').count/2,bounds,expandedPositionAndNormalBitsIdentical:true});
  geometry.dispose();edges.dispose();
}
gltf.buffers[0].byteLength=binaryBytes;
gltf.extras={purpose:'Display-only exact-geometry derivative; original CAD and STL are retained.',sourceRoot:'hardware information/AeroSense v2/01_print',normalCreaseDegrees:35,edgeThresholdDegrees:55,parts:records};
let json=Buffer.from(JSON.stringify(gltf)),padding=(4-json.length%4)%4;json=Buffer.concat([json,Buffer.alloc(padding,0x20)]);
const binary=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+json.length+8+binary.length,8);
jh.writeUInt32LE(json.length,0);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(binary.length,0);bh.writeUInt32LE(0x004e4942,4);
const glb=Buffer.concat([header,jh,json,bh,binary]);
const summary={method:'Lossless indexing with precomputed normals and neon edge lines; no decimation or quantization',sourceTriangles:records.reduce((s,p)=>s+p.triangles,0),sourceVertices:records.reduce((s,p)=>s+p.sourceVertices,0),webVertices:records.reduce((s,p)=>s+p.webVertices,0),sourceBytes:records.reduce((s,p)=>s+p.sourceBytes,0),webBytes:glb.length,sha256:hash(glb),parts:records};
await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'aerosense-web.glb'),glb);await fs.writeFile(path.join(output,'aerosense-web-manifest.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
