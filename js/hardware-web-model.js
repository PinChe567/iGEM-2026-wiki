import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

// The GLB contains eight separate, losslessly indexed CAD display meshes.
// Normals and neon guide edges are baked once by build_hardware_web_model.mjs.
// Manufacturing downloads still use the unchanged original STL/CAD files.
const MODEL=new URL('https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/6b4c9aa2dc05-aerosense-web.glb?v=6b4c9aa2dc05cb23',import.meta.url);

export async function loadHardwareWebModel(signal){
  const started=performance.now();
  const response=await fetch(MODEL,{signal});
  if(!response.ok)throw new Error('Hardware GLB request failed: '+response.status);
  const buffer=await response.arrayBuffer(),parseStarted=performance.now();
  const gltf=await new GLTFLoader().parseAsync(buffer,new URL('.',MODEL).href);
  const parts=new Map(),materials=new Set();
  gltf.scene.traverse(object=>{
    if(object.material)materials.add(object.material);
    if(!object.isMesh||!object.userData.sourceFile)return;
    const edge=object.children.find(child=>child.isLineSegments);
    if(!edge)throw new Error('Hardware GLB is missing edge geometry.');
    object.geometry.computeBoundingBox();object.geometry.computeBoundingSphere();
    parts.set(object.userData.sourceFile,{geometry:object.geometry,edges:edge.geometry,sourceTriangles:object.userData.sourceTriangles});
  });
  // The interactive viewer retains its existing custom satin/glass materials.
  for(const material of materials)material.dispose();
  if(parts.size!==8)throw new Error('Hardware GLB is missing a component.');
  const metadata=gltf.parser.json.extras;
  return {parts,byteLength:buffer.byteLength,loadMilliseconds:performance.now()-started,parseMilliseconds:performance.now()-parseStarted,metadata};
}

// A separate monochrome relief proposal above the unchanged manufacturing lid.
// Its 0.35–0.80 mm height field follows the exact navbar logo's luminance.
// Closed top, bottom and plaque walls catch real light; no flat decal is used.
export function addHardwareLidBranding(lid, rotated = false, onUpdate = () => {}) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=448;
  const context=canvas.getContext('2d');
  context.fillStyle='#e0e0e0';context.font='700 72px Arial, sans-serif';context.fillText('AEROSENSE',480,220);
  context.font='700 31px Arial, sans-serif';context.fillStyle='#bcbcbc';context.fillText('NTHU FLY',486,288);
  const sample=document.createElement('canvas');sample.width=512;sample.height=224;
  const sampled=sample.getContext('2d',{willReadFrequently:true});
  const geometry=new THREE.BufferGeometry();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.38,metalness:.24});
  const print=new THREE.Mesh(geometry,material);print.name='AeroSense navbar-logo lid relief';
  Object.assign(print.userData,{displayOnly:true,reliefHeightMm:[.35,.8],manufacturingSTLChanged:false});
  if(rotated){print.rotation.x=-Math.PI/2;print.position.set(0,66.01,-8);}else print.position.set(0,8,66.01);
  lid.add(print);let disposed=false;
  function rebuild(){
    if(disposed)return;
    sampled.clearRect(0,0,512,224);sampled.drawImage(canvas,0,0,512,224);
    const {data}=sampled.getImageData(0,0,512,224),width=512,height=224;
    const active=new Uint8Array((width-1)*(height-1)),luma=new Float32Array(width*height);
    for(let p=0;p<luma.length;p++)luma[p]=(.2126*data[p*4]+.7152*data[p*4+1]+.0722*data[p*4+2])/255;
    for(let y=0;y<height-1;y++)for(let x=0;x<width-1;x++){
      const p=y*width+x;
      active[y*(width-1)+x]=data[p*4+3]+data[(p+1)*4+3]+data[(p+width)*4+3]+data[(p+width+1)*4+3]>230?1:0;
    }
    const positions=[],colors=[],indices=[],mapped=new Int32Array(width*height*2);mapped.fill(-1);
    function vertex(x,y,top){
      const p=y*width+x,k=p+(top?width*height:0);if(mapped[k]>=0)return mapped[k];
      const index=positions.length/3;positions.push((x/(width-1)-.5)*80,(.5-y/(height-1))*35,top?.35+.45*luma[p]:0);
      const gray=top?.055+.525*luma[p]:.055;colors.push(gray,gray,gray);mapped[k]=index;return index;
    }
    function quad(a,b,c,d){indices.push(a,b,c,a,c,d);}
    const neighbors=[[0,-1],[1,0],[0,1],[-1,0]];
    for(let y=0;y<height-1;y++)for(let x=0;x<width-1;x++){
      if(!active[y*(width-1)+x])continue;
      const points=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]];
      const top=points.map(([i,j])=>vertex(i,j,true)),bottom=points.map(([i,j])=>vertex(i,j,false));
      // Canvas rows run downward, so reverse the top winding for exterior +Z.
      quad(top[3],top[2],top[1],top[0]);quad(...bottom);
      neighbors.forEach(([dx,dy],edge)=>{
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=width-1||ny>=height-1||!active[ny*(width-1)+nx]){
          const next=(edge+1)%4;quad(bottom[next],bottom[edge],top[edge],top[next]);
        }
      });
    }
    geometry.dispose();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);
    // The image adds vertices after the first text-only draw; recreate normals
    // so the attribute has the new vertex count rather than the old text count.
    geometry.deleteAttribute('normal');geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();onUpdate();
  }
  rebuild();
  const image=new Image();image.crossOrigin='anonymous';
  image.onload=()=>{if(disposed)return;context.drawImage(image,0,0,448,448);rebuild();};
  image.src='https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/lossless-part2-20261018/87057e665648-logo.webp';
  return {print,geometry,material,dispose(){disposed=true;image.onload=null;lid.remove(print);geometry.dispose();material.dispose();}};
}
