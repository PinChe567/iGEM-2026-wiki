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
