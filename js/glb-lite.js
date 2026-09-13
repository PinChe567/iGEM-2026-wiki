/**
 * Minimal GLB reader for local untextured COLOR_0 meshes.
 * No CDN. No Draco. Enough for the vendored Drosophila asset.
 */
import * as THREE from "./vendor/three.module.js";

const COMP = {
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};
const COMP_BYTES = { 5123: 2, 5125: 4, 5126: 4 };
const TYPE_SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function accessorArray(gltf, bin, accessorIndex) {
  const acc = gltf.accessors[accessorIndex];
  const view = gltf.bufferViews[acc.bufferView];
  const Ctor = COMP[acc.componentType];
  const size = TYPE_SIZE[acc.type];
  const offset = (view.byteOffset || 0) + (acc.byteOffset || 0);
  return new Ctor(bin, offset, acc.count * size);
}

function makeMaterial(def) {
  const pbr = def.pbrMetallicRoughness || {};
  const base = pbr.baseColorFactor || [1, 1, 1, 1];
  const em = def.emissiveFactor || [0, 0, 0];
  const blend = def.alphaMode === "BLEND" || base[3] < 0.99;
  let emit = em[0] + em[1] + em[2] > 0 ? 1 : 0;
  const ext = def.extensions && def.extensions.KHR_materials_emissive_strength;
  if (ext && ext.emissiveStrength != null) emit = ext.emissiveStrength;
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(base[0], base[1], base[2]),
    roughness: pbr.roughnessFactor == null ? 0.7 : pbr.roughnessFactor,
    metalness: pbr.metallicFactor == null ? 0 : pbr.metallicFactor,
    emissive: new THREE.Color(em[0], em[1], em[2]),
    emissiveIntensity: emit,
    vertexColors: false,
    transparent: blend,
    opacity: base[3],
    depthWrite: !blend,
    side: def.doubleSided || blend ? THREE.DoubleSide : THREE.FrontSide
  });
  if (blend) mat.userData.wing = true;
  return mat;
}

function primitiveMesh(gltf, bin, prim, materials) {
  const geo = new THREE.BufferGeometry();
  const pos = accessorArray(gltf, bin, prim.attributes.POSITION);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  if (prim.attributes.NORMAL != null) {
    const nrm = accessorArray(gltf, bin, prim.attributes.NORMAL);
    geo.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  } else {
    geo.computeVertexNormals();
  }
  const hasColor = prim.attributes.COLOR_0 != null;
  if (hasColor) {
    const col = accessorArray(gltf, bin, prim.attributes.COLOR_0);
    const acc = gltf.accessors[prim.attributes.COLOR_0];
    geo.setAttribute("color", new THREE.BufferAttribute(col, TYPE_SIZE[acc.type]));
  }
  if (prim.indices != null) {
    const idx = accessorArray(gltf, bin, prim.indices);
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
  }
  const src = materials[prim.material || 0] || materials[0];
  const mat = src.clone();
  mat.vertexColors = hasColor;
  if (hasColor) mat.color.setHex(0xffffff);
  return new THREE.Mesh(geo, mat);
}

export function parseGlb(buffer) {
  const dv = new DataView(buffer);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("Not a GLB file");
  let offset = 12;
  let json = null;
  let bin = null;
  while (offset + 8 <= dv.byteLength) {
    const len = dv.getUint32(offset, true);
    const type = dv.getUint32(offset + 4, true);
    const start = offset + 8;
    const data = buffer.slice(start, start + len);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(data));
    else if (type === 0x004e4942) bin = data;
    offset = start + len;
  }
  if (!json || !bin) throw new Error("Incomplete GLB");

  const materials = (json.materials || [{}]).map(makeMaterial);
  const meshCache = (json.meshes || []).map(function (meshDef) {
    const group = new THREE.Group();
    group.name = meshDef.name || "";
    (meshDef.primitives || []).forEach(function (prim) {
      const mesh = primitiveMesh(json, bin, prim, materials);
      group.add(mesh);
    });
    return group;
  });

  function buildNode(index) {
    const def = json.nodes[index];
    const obj = new THREE.Group();
    obj.name = def.name || "";
    if (def.translation) obj.position.fromArray(def.translation);
    if (def.rotation) obj.quaternion.fromArray(def.rotation);
    if (def.scale) obj.scale.fromArray(def.scale);
    if (def.mesh != null) {
      const mesh = meshCache[def.mesh];
      if (mesh) obj.add(mesh.clone(true));
    }
    (def.children || []).forEach(function (child) {
      obj.add(buildNode(child));
    });
    return obj;
  }

  const root = new THREE.Group();
  root.name = "gltfRoot";
  const sceneDef = json.scenes[json.scene || 0];
  (sceneDef.nodes || [0]).forEach(function (i) {
    root.add(buildNode(i));
  });
  root.userData.materials = materials;
  return root;
}

export function loadGlb(url) {
  return fetch(url).then(function (res) {
    if (!res.ok) throw new Error("GLB missing");
    return res.arrayBuffer();
  }).then(parseGlb);
}
