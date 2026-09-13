/**
 * Follow the Signal — warehouse / fruit-fly prototype.
 * Three.js r170 vendored at ./vendor/three.module.js
 * Conceptual visualization only. Not experimental data.
 */
import * as THREE from "./vendor/three.module.js";
import { loadGlb } from "./glb-lite.js";
import {
  PATH_DURATION,
  CARDS,
  WORLD_SPECS,
  stageLabel,
  makeExtendedPath,
  makeCourse,
  clipTrailAhead,
  disposeObject,
  cloneProp,
  placeOnPath,
  bindStory
} from "./description-flight-worlds.js";
const SCAN_MS = 0.2;
const OFFSET_MAX = 2.15;
const FLY_BANK_MAX = 0.26;
const WING_HZ = 12;
const FOG_DAY = 0xd4c6b4;
const FOG_SCAN = 0x8ea39c;

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (err) {
    return false;
  }
}

function qs(sel, ctx) {
  return (ctx || document).querySelector(sel);
}

function qsa(sel, ctx) {
  return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
}

function makeWingGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.04, 0.09, 0.18, 0.16, 0.42, 0.05);
  shape.bezierCurveTo(0.5, -0.01, 0.4, -0.13, 0.2, -0.15);
  shape.bezierCurveTo(0.08, -0.1, 0.02, -0.04, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 12);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0.02, 0, 0.02);
  geo.computeVertexNormals();
  return geo;
}

function capsuleMesh(mat, rTop, rBot, len, segs) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, segs, 1), mat);
  return mesh;
}

function collectMats(root) {
  const out = [];
  root.traverse(function (obj) {
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(function (m) {
        if (m && out.indexOf(m) === -1) out.push(m);
      });
    }
  });
  return out;
}

function packFly(root, extra) {
  const fadeMats = collectMats(root);
  const wingMat = extra.wingMat || fadeMats.find(function (m) { return m.userData && m.userData.wing; }) || fadeMats[0];
  const chitin = extra.chitin || fadeMats[0];
  return {
    root: root,
    abdomen: extra.abdomen,
    wingLeftPivot: extra.wingLeftPivot,
    wingRightPivot: extra.wingRightPivot,
    fadeMats: fadeMats,
    chitin: chitin,
    thoraxMat: extra.thoraxMat || chitin,
    eyeMat: extra.eyeMat || fadeMats[1] || chitin,
    wingMat: wingMat,
    legMat: extra.legMat || chitin
  };
}

function flyFromGltf(scene) {
  const root = new THREE.Group();
  root.name = "flyRoot";
  scene.scale.setScalar(0.88);
  root.add(scene);
  const fadeMats = collectMats(root);
  fadeMats.forEach(function (m) {
    m.transparent = true;
    if (m.userData && m.userData.wing) m.depthWrite = false;
  });
  return packFly(root, {
    abdomen: root.getObjectByName("BODY") || root,
    wingLeftPivot: root.getObjectByName("WING_LEFT"),
    wingRightPivot: root.getObjectByName("WING_RIGHT"),
    chitin: fadeMats[0],
    thoraxMat: fadeMats[0],
    eyeMat: fadeMats[1] || fadeMats[0],
    wingMat: fadeMats[2] || fadeMats[0],
    legMat: fadeMats[0]
  });
}

function makeProceduralFly() {
  const root = new THREE.Group();
  root.name = "flyRoot";

  const chitin = new THREE.MeshStandardMaterial({
    color: 0x452c1c,
    roughness: 0.66,
    metalness: 0.04,
    transparent: true,
    opacity: 1
  });
  const thoraxMat = new THREE.MeshStandardMaterial({
    color: 0x2e2016,
    roughness: 0.62,
    metalness: 0.05,
    transparent: true,
    opacity: 1
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0x24160f,
    roughness: 0.7,
    metalness: 0.03,
    transparent: true,
    opacity: 1
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x61241f,
    roughness: 0.28,
    metalness: 0.08,
    transparent: true,
    opacity: 1
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xe4d8c4,
    roughness: 0.22,
    metalness: 0,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  wingMat.userData.wing = true;
  const veinMat = new THREE.MeshStandardMaterial({
    color: 0x8a6f52,
    roughness: 0.45,
    metalness: 0.02,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });
  veinMat.userData.wing = true;
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x1c120c,
    roughness: 0.74,
    metalness: 0,
    transparent: true,
    opacity: 1
  });

  const thorax = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), thoraxMat);
  thorax.scale.set(0.2, 0.168, 0.22);
  thorax.position.set(0, 0.04, 0);
  root.add(thorax);

  const scut = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), thoraxMat);
  scut.scale.set(0.09, 0.07, 0.08);
  scut.position.set(0, 0.1, 0.15);
  root.add(scut);

  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), chitin);
  head.scale.set(0.15, 0.132, 0.16);
  head.position.set(0, 0.03, -0.34);
  root.add(head);

  const eyeGeo = new THREE.IcosahedronGeometry(1, 1);
  const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
  eyeLeft.scale.set(0.13, 0.12, 0.15);
  eyeLeft.position.set(-0.12, 0.035, -0.37);
  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.12;
  root.add(eyeLeft, eyeRight);

  const abdomen = new THREE.Group();
  abdomen.name = "abdomen";
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 10),
      i % 2 === 0 ? chitin : stripeMat
    );
    m.scale.set(0.13 * (1 - t * 0.45), 0.11 * (1 - t * 0.4), 0.12);
    m.position.set(0, 0.02 - t * 0.02, 0.22 + i * 0.11);
    abdomen.add(m);
  }
  root.add(abdomen);

  [-1, 1].forEach(function (side) {
    const ant = capsuleMesh(legMat, 0.01, 0.007, 0.16, 6);
    ant.position.set(side * 0.05, 0.12, -0.46);
    ant.rotation.x = 0.85;
    ant.rotation.z = side * 0.38;
    root.add(ant);
    const club = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), chitin);
    club.scale.set(0.9, 0.45, 1.2);
    club.position.set(side * 0.08, 0.18, -0.54);
    root.add(club);
  });

  const wingGeo = makeWingGeometry();
  const wingLeftPivot = new THREE.Group();
  wingLeftPivot.name = "WING_LEFT";
  wingLeftPivot.position.set(-0.18, 0.09, -0.02);
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.scale.x = -1;
  wingLeftPivot.add(wingL);

  const wingRightPivot = new THREE.Group();
  wingRightPivot.name = "WING_RIGHT";
  wingRightPivot.position.set(0.18, 0.09, -0.02);
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingRightPivot.add(wingR);
  root.add(wingLeftPivot, wingRightPivot);

  const veinGeo = new THREE.CylinderGeometry(0.004, 0.003, 0.38, 4);
  [-1, 1].forEach(function (side) {
    const v = new THREE.Mesh(veinGeo, veinMat);
    v.rotation.z = side * 1.12;
    v.rotation.x = 0.12;
    v.position.set(side * 0.22, 0.1, 0.02);
    root.add(v);
  });

  const legs = [
    [-0.12, -0.08, -0.08, 0.7, 0.45],
    [0.12, -0.08, -0.08, -0.7, -0.45],
    [-0.14, -0.1, 0.04, 0.85, 0.12],
    [0.14, -0.1, 0.04, -0.85, -0.12],
    [-0.11, -0.08, 0.16, 1.02, -0.28],
    [0.11, -0.08, 0.16, -1.02, 0.28]
  ];
  legs.forEach(function (L) {
    const femur = capsuleMesh(legMat, 0.012, 0.008, 0.16, 5);
    femur.position.set(L[0], L[1], L[2]);
    femur.rotation.z = L[3];
    femur.rotation.x = L[4];
    root.add(femur);
  });

  return packFly(root, {
    abdomen: abdomen,
    wingLeftPivot: wingLeftPivot,
    wingRightPivot: wingRightPivot,
    chitin: chitin,
    thoraxMat: thoraxMat,
    eyeMat: eyeMat,
    wingMat: wingMat,
    legMat: legMat
  });
}

function colorFrom(rand, palette) {
  return palette[Math.floor(rand() * palette.length)];
}

function makeWarehouse(scene, mobile, assets) {
  const group = new THREE.Group();
  group.name = "warehouseWorld";
  const rand = mulberry32(2026);
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.86, metalness: 0.02 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x4a3224, roughness: 0.88, metalness: 0.02 });
  const plaster = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.94, metalness: 0 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xc4b496, roughness: 0.94, metalness: 0 });
  const aisleMat = new THREE.MeshStandardMaterial({ color: 0xd8c8ae, roughness: 0.9, metalness: 0 });
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.03 });
  const sackMat = new THREE.MeshStandardMaterial({ color: 0x7a5c3a, roughness: 0.9, metalness: 0 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x5c4634, roughness: 0.7, metalness: 0.04 });
  const targetWood = new THREE.MeshStandardMaterial({
    color: 0x8a6240,
    roughness: 0.74,
    metalness: 0.02,
    emissive: 0x000000
  });
  const targetSack = new THREE.MeshStandardMaterial({
    color: 0x9a7048,
    roughness: 0.86,
    metalness: 0,
    emissive: 0x000000
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 78), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 36);
  floor.receiveShadow = false;
  group.add(floor);

  const aisle = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 78), aisleMat);
  aisle.rotation.x = -Math.PI / 2;
  aisle.position.set(0, 0.012, 36);
  aisle.receiveShadow = false;
  group.add(aisle);

  const wallL = new THREE.Mesh(new THREE.PlaneGeometry(78, 5.4), plaster);
  wallL.position.set(-7.9, 2.6, 36);
  wallL.rotation.y = Math.PI / 2;
  group.add(wallL);
  const wallR = wallL.clone();
  wallR.position.x = 7.9;
  wallR.rotation.y = -Math.PI / 2;
  group.add(wallR);
  const wallEnd = new THREE.Mesh(new THREE.PlaneGeometry(16, 5.4), plaster);
  wallEnd.position.set(0, 2.6, 75);
  group.add(wallEnd);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(16, 78), woodDark);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 5.05, 36);
  group.add(ceiling);

  const dummy = new THREE.Object3D();
  const pal = [new THREE.Color(0x8a6a45), new THREE.Color(0x5c4030), new THREE.Color(0xa89070), new THREE.Color(0x6e4e32)];

  const boxCount = mobile ? 18 : 28;
  const boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), boxMat, boxCount);
  boxes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  let bi = 0;
  for (let i = 0; i < boxCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 6 + (i * 0.55) % 62 + rand() * 1.4;
    dummy.position.set(side * (3.15 + rand() * 0.55), 0.28 + rand() * 1.55, z);
    dummy.rotation.set(0, (rand() - 0.5) * 0.18, (rand() - 0.5) * 0.04);
    dummy.scale.set(0.42 + rand() * 0.38, 0.32 + rand() * 0.42, 0.38 + rand() * 0.4);
    dummy.updateMatrix();
    boxes.setMatrixAt(bi, dummy.matrix);
    boxes.setColorAt(bi, colorFrom(rand, pal));
    bi += 1;
  }
  boxes.instanceColor.needsUpdate = true;
  boxes.castShadow = false;
  group.add(boxes);
  boxes.instanceMatrix.needsUpdate = true;

  const sackCount = mobile ? 10 : 16;
  const sacks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 8, 6), sackMat, sackCount);
  for (let i = 0; i < sackCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    dummy.position.set(side * (3.4 + rand() * 0.4), 0.28 + rand() * 0.15, 8 + i * 2.3 + rand());
    dummy.rotation.set(rand() * 0.4, rand() * Math.PI, (rand() - 0.5) * 0.3);
    dummy.scale.set(0.55 + rand() * 0.18, 0.4 + rand() * 0.12, 0.7 + rand() * 0.2);
    dummy.updateMatrix();
    sacks.setMatrixAt(i, dummy.matrix);
  }
  group.add(sacks);
  sacks.instanceMatrix.needsUpdate = true;

  const barrelCount = mobile ? 7 : 10;
  const barrels = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.3, 0.52, 10), barrelMat, barrelCount);
  for (let i = 0; i < barrelCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    dummy.position.set(side * (2.55 + rand() * 0.2), 0.26, 12 + i * 5.6 + rand());
    dummy.rotation.set(0, rand() * 0.4, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    barrels.setMatrixAt(i, dummy.matrix);
  }
  group.add(barrels);
  barrels.instanceMatrix.needsUpdate = true;

  const postGeo = new THREE.BoxGeometry(0.12, 2.7, 0.12);
  const plankGeo = new THREE.BoxGeometry(1.85, 0.07, 0.55);
  const postCount = 28;
  const posts = new THREE.InstancedMesh(postGeo, woodDark, postCount);
  const plankCount = 56;
  const planks = new THREE.InstancedMesh(plankGeo, wood, plankCount);
  let pi = 0;
  let pli = 0;
  for (let bay = 0; bay < 7; bay++) {
    const z = 8 + bay * 8.6;
    [-1, 1].forEach(function (side) {
      const x = side * 4.05;
      dummy.position.set(x - side * 0.82, 1.35, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      posts.setMatrixAt(pi++, dummy.matrix);
      dummy.position.set(x + side * 0.82, 1.35, z);
      dummy.updateMatrix();
      posts.setMatrixAt(pi++, dummy.matrix);
      for (let s = 0; s < 4; s++) {
        dummy.position.set(x, 0.42 + s * 0.62, z);
        dummy.rotation.set(0, side > 0 ? 0 : 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        planks.setMatrixAt(pli++, dummy.matrix);
      }
    });
  }
  group.add(posts, planks);
  posts.instanceMatrix.needsUpdate = true;
  planks.instanceMatrix.needsUpdate = true;

  const beamCount = mobile ? 5 : 8;
  const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(15.4, 0.16, 0.22), woodDark, beamCount);
  for (let i = 0; i < beamCount; i++) {
    dummy.position.set(0, 4.82, 8 + i * 8.5);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    beams.setMatrixAt(i, dummy.matrix);
  }
  group.add(beams);
  beams.instanceMatrix.needsUpdate = true;

  const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.09, 0.9), wood);
  pallet.position.set(-1.65, 0.05, 7.4);
  group.add(pallet);
  const startBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.5, 12), barrelMat);
  startBarrel.position.set(-1.35, 0.34, 7.15);
  group.add(startBarrel);

  const target = new THREE.Group();
  target.position.set(2.28, 0, 51.4);
  const crate =
    assets && assets.crate
      ? cloneProp(assets.crate)
      : new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.62, 0.78), targetWood);
  if (assets && assets.crate) {
    crate.scale.setScalar(1.55);
    crate.rotation.y = 0.18;
  } else {
    crate.position.set(0, 0.31, 0);
    crate.rotation.y = 0.18;
    crate.castShadow = false;
  }
  const sackA = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), targetSack);
  sackA.position.set(0.38, 0.32, 0.22);
  sackA.scale.set(1, 0.72, 1.15);
  const sackB = sackA.clone();
  sackB.position.set(-0.12, 0.34, -0.28);
  sackB.rotation.y = 0.7;
  const sackC = sackA.clone();
  sackC.position.set(0.18, 0.72, -0.02);
  sackC.scale.set(0.85, 0.6, 1);
  target.add(crate, sackA, sackB, sackC);
  group.add(target);

  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffe6c8,
    emissive: 0xffd09a,
    emissiveIntensity: 1.25,
    roughness: 0.35,
    metalness: 0.05,
    transparent: true
  });
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0x3d2c22, roughness: 0.78, transparent: true });
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xf3e2c0,
    emissive: 0xf0d3a0,
    emissiveIntensity: 0.55,
    roughness: 1,
    transparent: true
  });
  const lampN = mobile ? 2 : 3;
  for (let i = 0; i < lampN; i++) {
    const z = 12 + i * (mobile ? 22 : 16);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.2, 8, 1, true), shadeMat);
    shade.position.set(0, 4.58, z);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), lampMat);
    bulb.position.set(0, 4.42, z);
    group.add(shade, bulb);
  }
  for (let i = 0; i < 4; i++) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.15), winMat);
    pane.position.set(-7.88, 3.15, 16 + i * 13);
    pane.rotation.y = Math.PI / 2;
    group.add(pane);
    const paneR = pane.clone();
    paneR.position.x = 7.88;
    paneR.rotation.y = -Math.PI / 2;
    group.add(paneR);
  }

  const dustN = mobile ? 12 : 22;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = (rand() - 0.5) * 5.5;
    dustPos[i * 3 + 1] = 0.4 + rand() * 3.6;
    dustPos[i * 3 + 2] = 6 + rand() * 62;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xe8dcc8,
      size: 0.028,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
  dust.name = "warehouseDust";
  group.add(dust);

  if (assets && assets.crate) {
    [
      [-3.35, 0, 14],
      [3.45, 0, 22]
    ].forEach(function (s, i) {
      const c = cloneProp(assets.crate);
      c.position.set(s[0], s[1], s[2]);
      c.rotation.y = i * 0.31;
      c.scale.setScalar(1.45);
      group.add(c);
    });
  }

  scene.add(group);

  plaster.transparent = true;
  wood.transparent = true;
  woodDark.transparent = true;
  floorMat.transparent = true;
  aisleMat.transparent = true;
  boxMat.transparent = true;
  sackMat.transparent = true;
  barrelMat.transparent = true;

  return {
    group,
    target,
    targetMats: [targetWood, targetSack],
    fadeMats: [plaster, wood, woodDark, floorMat, aisleMat, boxMat, sackMat, barrelMat, lampMat, shadeMat, winMat, dust.material],
    boxes,
    sacks,
    barrels
  };
}

function makePlume(targetPos, mobile) {
  const group = new THREE.Group();
  const curves = [];
  const tubes = [];
  const segs = mobile ? 28 : 42;
  const branches = [
    { seed: 0.2, amp: 0.42, lift: 0.22, len: 26, radius: 0.11 },
    { seed: 1.7, amp: 0.58, lift: 0.38, len: 22, radius: 0.07 },
    { seed: 2.9, amp: 0.33, lift: 0.18, len: 18, radius: 0.055 }
  ];
  if (mobile) branches.pop();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x8aa88c,
    roughness: 0.95,
    metalness: 0,
    transparent: true,
    opacity: 0.02,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  branches.forEach(function (b) {
    const pts = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const z = targetPos.z - t * b.len;
      const x = lerp(targetPos.x, 0.35, t) + Math.sin(t * 4.1 + b.seed) * b.amp * (0.25 + t);
      const y = targetPos.y + 0.55 + b.lift * t + Math.sin(t * 3.4 + b.seed * 1.4) * 0.28;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    curves.push(curve);
    const geo = new THREE.TubeGeometry(curve, segs, b.radius, 5, false);
    const mesh = new THREE.Mesh(geo, mat.clone());
    mesh.material.opacity = 0.018;
    tubes.push(mesh);
    group.add(mesh);
  });

  const pCount = mobile ? 6 : 10;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const points = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: 0xb7cbb8,
      size: 0.035,
      transparent: true,
      opacity: 0.04,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
  group.add(points);

  return { group, curves, tubes, points, pCount, pPos };
}

function makeSignalOrb() {
  const group = new THREE.Group();
  group.name = "signalOrb";
  const mat = new THREE.MeshStandardMaterial({
    color: 0xc8e8d0,
    emissive: 0x2f9a62,
    emissiveIntensity: 0.4,
    roughness: 0.32,
    metalness: 0.02,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mat);
  const haloMat = mat.clone();
  haloMat.opacity = 0;
  haloMat.emissiveIntensity = 0.25;
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), haloMat);
  group.add(core, halo);
  group.frustumCulled = false;
  return { mesh: group, mat: mat, haloMat: haloMat, core: core, halo: halo };
}

function makeWisps() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xcfd8cc,
    transparent: true,
    opacity: 0.045,
    roughness: 1,
    metalness: 0,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  for (let i = 0; i < 4; i++) {
    const pts = [];
    const z0 = 10 + i * 9;
    for (let k = 0; k < 5; k++) {
      pts.push(
        new THREE.Vector3(
          Math.sin(i + k) * 0.22,
          1.28 + Math.sin(k * 0.9 + i) * 0.12,
          z0 + k * 1.15
        )
      );
    }
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.025, 4, false), mat);
    group.add(mesh);
  }
  return group;
}

function makePath() {
  return makeExtendedPath();
}

(function init() {
  const root = document.getElementById("follow-the-signal");
  if (!root) return;

  const els = {
    journey: qs("[data-journey]", root),
    start: qs("[data-flight-start]", root),
    skip: qsa("[data-journey-skip]", root),
    skipped: qs("[data-journey-skipped]", root),
    unavailable: qs("[data-flight-unavailable]", root),
    dialog: qs("#follow-the-signal-flight", root),
    world: qs("[data-flight-world]", root),
    gl: qs("[data-flight-gl]", root),
    intro: qs("[data-flight-intro]", root),
    introLine: qs("[data-intro-line]", root),
    edge: qs("[data-signal-edge]", root),
    callout: qs("[data-flight-callout]", root),
    card: qs("[data-flight-card]", root),
    cardKicker: qs("[data-card-kicker]", root),
    cardHeading: qs("[data-card-heading]", root),
    cardText: qs("[data-card-text]", root),
    cardChain: qs("[data-card-chain]", root),
    pin: qs("[data-flight-pin]", root),
    finale: qs("[data-flight-finale]", root),
    pauseBtn: qs("[data-flight-pause]", root),
    autoBtn: qs("[data-flight-auto]", root),
    fsBtn: qs("[data-flight-fs]", root),
    scanBtn: qs("[data-flight-scan]", root),
    exitBtns: qsa("[data-flight-exit]", root),
    stage: qs("[data-flight-stage]", root),
    live: qs("[data-flight-live]", root),
    flightRoot: qs("[data-flight-root]", root),
    score: qs("[data-flight-score]", root),
    finaleScore: qs("[data-finale-score]", root)
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile =
    window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 720px)").matches;

  if (els.journey) els.journey.classList.toggle("is-reduced", reduceMotion);

  const webgl = hasWebGL();
  if (!webgl) {
    if (els.unavailable) els.unavailable.hidden = false;
    if (els.start) els.start.hidden = true;
  }

  const state = {
    open: false,
    running: false,
    raf: 0,
    last: 0,
    time: 0,
    progress: 0,
    offset: 0,
    vx: 0,
    bank: 0,
    camLag: 0,
    camRoll: 0,
    scan: 0,
    scanHeld: false,
    scanSpace: false,
    scanMouse: false,
    scanPad: false,
    keyInput: 0,
    pointer: null,
    pointerInput: 0,
    userPaused: false,
    hidden: false,
    introUntil: 0,
    cardId: null,
    cardPhase: null,
    cardShownAt: 0,
    cardHideAt: 0,
    built: false,
    opening: false,
    dive: 0,
    speedMul: 1,
    needProj: true,
    score: 0,
    onTrail: true,
    auto: true,
    x: 0
  };

  let renderer = null;
  let scene = null;
  let camera = null;
  let hemi = null;
  let keyLight = null;
  let fill = null;
  let rimLight = null;
  let fly = null;
  let orb = null;
  let warehouse = null;
  let plume = null;
  let course = null;
  let path = null;
  let pathLen = 1;
  let journeyWorlds = {};
  let propAssets = {};
  let story = bindStory();
  const _pos = new THREE.Vector3();
  const _tan = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _up = new THREE.Vector3(0, 1, 0);
  const _look = new THREE.Vector3();
  const _cam = new THREE.Vector3();
  const _ndc = new THREE.Vector3();
  const _flyPos = new THREE.Vector3();
  const _fog = new THREE.Color();
  const _orient = new THREE.Matrix4();
  const _colA = new THREE.Color();
  const _colB = new THREE.Color();
  let viewW = 0;
  let viewH = 0;
  const flyGlbPromise = loadGlb("models/drosophila-melanogaster.glb").catch(function () {
    return null;
  });
  function loadProp(url) {
    return loadGlb(url).catch(function () {
      return null;
    });
  }
  const propsPromise = Promise.all([
    flyGlbPromise,
    loadProp("models/prop-antenna.glb"),
    loadProp("models/prop-cell.glb"),
    loadProp("models/prop-crate.glb"),
    loadProp("models/prop-ring.glb"),
    loadProp("models/prop-gate.glb")
  ]);

  function refreshScanHeld() {
    state.scanHeld = !!(state.scanSpace || state.scanMouse || state.scanPad);
  }

  function setAuto(on) {
    state.auto = !!on;
    if (els.autoBtn) {
      els.autoBtn.textContent = state.auto ? "Auto on" : "Steer";
      els.autoBtn.setAttribute("aria-pressed", state.auto ? "true" : "false");
    }
  }

  function takeManual() {
    if (state.auto) setAuto(false);
  }

  function setPaused(on) {
    state.userPaused = on;
    if (els.pauseBtn) {
      els.pauseBtn.textContent = on ? "Resume" : "Pause";
      els.pauseBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (on) stopLoop();
    else if (state.open) startLoop();
  }

  function skipJourney() {
    if (els.journey) els.journey.classList.add("is-skipped");
    if (els.skipped) els.skipped.focus();
    if (state.open) closeFlight();
  }

  function announce(text) {
    if (els.live) els.live.textContent = text;
  }

  function setFlyFade(bodyA, morph) {
    if (!fly) return;
    (fly.fadeMats || []).forEach(function (m) {
      const wing = m.userData && m.userData.wing;
      m.opacity = isFinite(m.userData.baseOpacity)
        ? m.userData.baseOpacity * bodyA
        : wing
          ? 0.36 * bodyA
          : bodyA;
      if (m.emissive) m.emissive.setRGB(0.05 * morph, 0.22 * morph, 0.08 * morph);
    });
    fly.root.visible = bodyA > 0.04;
  }

  function build() {
    if (state.built) return Promise.resolve(true);
    return propsPromise
      .then(function (pack) {
        propAssets = {
          fly: pack[0],
          antenna: pack[1],
          cell: pack[2],
          crate: pack[3],
          ring: pack[4],
          gate: pack[5]
        };
        const gltfRoot = pack[0];
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: false,
          powerPreference: "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.setClearColor(FOG_DAY, 1);
        renderer.shadowMap.enabled = false;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(FOG_DAY);
        scene.fog = new THREE.Fog(FOG_DAY, 8, 38);

        camera = new THREE.PerspectiveCamera(52, 1, 0.08, 120);

        hemi = new THREE.HemisphereLight(0xf4ead8, 0x5a4638, 0.72);
        scene.add(hemi);
        keyLight = new THREE.DirectionalLight(0xffe6c4, 1.12);
        keyLight.position.set(6.5, 12, 6);
        scene.add(keyLight);
        fill = new THREE.DirectionalLight(0xd4c4a8, 0.28);
        fill.position.set(-8, 4.5, -6);
        scene.add(fill);
        rimLight = new THREE.DirectionalLight(0xfff3dc, 0.42);
        rimLight.position.set(-2, 3.5, -8);
        scene.add(rimLight);

        warehouse = makeWarehouse(scene, mobile, propAssets);
        warehouse.fadeMats.forEach(function (m) {
          if (m.userData.baseOpacity == null) m.userData.baseOpacity = m.opacity;
        });
        fly = gltfRoot ? flyFromGltf(gltfRoot) : makeProceduralFly();
        scene.add(fly.root);
        fly.root.traverse(function (obj) {
          obj.frustumCulled = false;
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
            if (obj.material && obj.material.opacity != null && obj.material.userData.baseOpacity == null) {
              obj.material.userData.baseOpacity = obj.material.opacity;
            }
          }
        });
        orb = makeSignalOrb();
        scene.add(orb.mesh);
        plume = makePlume(warehouse.target.position, mobile);
        scene.add(plume.group);
        plume.group.traverse(function (obj) {
          obj.frustumCulled = false;
        });
        warehouse.group.add(makeWisps());
        path = makePath();
        pathLen = path.getLength();
        story = bindStory();
        course = makeCourse(path, mobile, propAssets);
        scene.add(course.group);
        if (course.ribbon) course.ribbon.frustumCulled = false;

        if (els.gl) {
          els.gl.appendChild(renderer.domElement);
        }
        state.built = true;
        return true;
      })
      .catch(function (err) {
        console.error("Follow the Signal: 3D setup failed", err);
        state.built = false;
        return false;
      });
  }

  function resize() {
    if (!renderer || !camera || !els.world) return;
    const w = Math.max(1, els.world.clientWidth);
    const h = Math.max(1, els.world.clientHeight);
    if (w === viewW && h === viewH) return;
    viewW = w;
    viewH = h;
    camera.aspect = w / h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(w, h, false);
    state.needProj = true;
  }

  function resetFlight() {
    state.time = 0;
    state.progress = 0;
    state.offset = 0;
    state.x = 0;
    state.vx = 0;
    state.bank = 0;
    state.camLag = 0;
    state.camRoll = 0;
    state.scan = 0;
    state.scanHeld = false;
    state.scanSpace = false;
    state.scanMouse = false;
    state.scanPad = false;
    state.keyInput = 0;
    state.pointerInput = 0;
    state.pointer = null;
    state.userPaused = false;
    state.cardId = null;
    state.cardPhase = null;
    state.cardShownAt = 0;
    state.cardHideAt = 0;
    state.dive = 0;
    state.speedMul = 1;
    state.needProj = true;
    state.score = 0;
    state.onTrail = true;
    setAuto(true);
    if (course && course.rings) {
      course.rings.forEach(function (ring) {
        ring.userData.passed = false;
        ring.userData.hit = false;
        ring.visible = true;
        if (ring.userData.label) ring.userData.label.visible = true;
      });
    }
    state.introUntil = 2.6;
    if (els.intro) els.intro.classList.remove("is-gone");
    if (els.introLine) els.introLine.textContent = "";
    if (els.card) {
      els.card.hidden = true;
      els.card.classList.remove("is-in", "is-hold", "is-drift");
    }
    if (els.pin) els.pin.hidden = true;
    if (els.finale) els.finale.hidden = true;
    if (els.callout) els.callout.hidden = true;
    if (els.edge) els.edge.hidden = true;
    if (els.pauseBtn) {
      els.pauseBtn.hidden = false;
      els.pauseBtn.textContent = "Pause";
      els.pauseBtn.setAttribute("aria-pressed", "false");
    }
    if (els.flightRoot) els.flightRoot.classList.remove("is-scan");
    if (els.scanBtn) els.scanBtn.setAttribute("aria-pressed", "false");
    qsa(".flight__hint", els.flightRoot || root).forEach(function (el) {
      el.classList.add("is-gone");
    });
    resetJourneyVisuals();
  }

  function resetJourneyVisuals() {
    Object.keys(journeyWorlds).forEach(function (k) {
      if (journeyWorlds[k]) disposeObject(journeyWorlds[k].group);
    });
    journeyWorlds = {};
    if (warehouse && warehouse.group) {
      warehouse.group.visible = true;
      warehouse.fadeMats.forEach(function (m) {
        m.opacity = m.userData.baseOpacity != null ? m.userData.baseOpacity : 1;
      });
    }
    if (fly) setFlyFade(1, 0);
    if (orb) {
      orb.mat.opacity = 0;
      orb.mat.emissiveIntensity = 0.4;
    }
    if (plume) {
      plume.group.visible = true;
      plume.group.scale.set(1, 1, 1);
      plume.group.position.set(0, 0, 0);
    }
  }

  function updateIntro() {
    if (!els.introLine || !els.intro) return;
    if (state.time > state.introUntil) {
      els.intro.classList.add("is-gone");
      return;
    }
    if (state.time < 0.25) els.introLine.textContent = "";
    else els.introLine.textContent = state.auto
      ? "Auto follows the trail   ·   ← → to take over"
      : "Stay on the trail   ← → steer";
  }

  function physics(dt) {
    const input = clamp(state.pointer && state.pointer.mode === "steer" ? state.pointerInput : state.keyInput, -1, 1);
    const steer = -input;
    if (Math.abs(input) > 0.12) takeManual();

    const scanTarget = state.scanHeld ? 1 : 0;
    state.scan = damp(state.scan, scanTarget, 1 / SCAN_MS, dt);
    if (els.flightRoot) els.flightRoot.classList.toggle("is-scan", state.scan > 0.08);
    if (els.scanBtn) els.scanBtn.setAttribute("aria-pressed", state.scanHeld ? "true" : "false");

    if (path) {
      path.getTangent(clamp(state.progress, 0, 0.999), _tan);
      const dive = clamp(-_tan.y * 2.7, 0, 1);
      const climb = clamp(_tan.y * 2.0, 0, 1);
      state.dive = dive;
      state.speedMul = lerp(1, 2.05, dive) * lerp(1, 0.55, climb);
    } else {
      state.dive = 0;
      state.speedMul = 1;
    }
    const cards = (story && story.cards) || CARDS;
    const inCard = cards.some(function (c) {
      return state.progress >= c.at && state.progress <= c.until;
    });
    if (inCard) state.speedMul *= 0.52;
    const endSlow = state.progress > 0.92 ? lerp(1, 0.1, (state.progress - 0.92) / 0.08) : 1;
    state.time += dt;
    state.progress = clamp(state.progress + (dt * endSlow * state.speedMul) / PATH_DURATION, 0, 1);

    let trailX = 0;
    if (path) {
      path.getPoint(clamp(state.progress, 0, 0.999), _pos);
      trailX = _pos.x;
    }
    if (state.auto) {
      const prevX = state.x;
      state.x = damp(state.x, trailX, 5.6, dt);
      state.vx = (state.x - prevX) / Math.max(dt, 0.0001);
    } else {
      state.vx += steer * 8.4 * dt;
      state.vx *= Math.exp(-3.45 * dt);
      state.x += state.vx * dt;
    }
    state.x = clamp(state.x, trailX - OFFSET_MAX, trailX + OFFSET_MAX);
    state.offset = state.x - trailX;
    state.camLag = damp(state.camLag, state.offset, 3.1, dt);

    const targetBank = clamp(-state.vx * 0.42 - steer * 0.18, -FLY_BANK_MAX, FLY_BANK_MAX);
    state.bank = damp(state.bank, targetBank, 7.5, dt);
    state.camRoll = damp(state.camRoll, state.bank * 0.28, 5.2, dt);

    const ON_TRAIL = 0.55;
    state.onTrail = Math.abs(state.offset) < ON_TRAIL;
    if (state.progress < 0.9) {
      if (state.onTrail) state.score += 200 * dt;
      if (course && course.rings) {
        course.rings.forEach(function (ring) {
          const u = ring.userData.u;
          if (u == null || ring.userData.passed) return;
          if (state.progress >= u) {
            if (state.onTrail) {
              state.score += 400;
              ring.userData.hit = true;
            }
            ring.userData.passed = true;
          }
        });
      }
    }
  }

  function applyWorldScan(w, scan, p) {
    const pulse = 0.65 + 0.35 * Math.sin(state.time * 2.1);
    if (w.receptors) {
      w.receptors.forEach(function (mat, i) {
        if (!mat) return;
        const on = i % 3 === 0 || i % 4 === 0;
        mat.emissiveIntensity = on ? scan * (0.55 + 0.4 * pulse) : scan * 0.06;
        if (mat.transparent) mat.opacity = 0.45 + (on ? scan * 0.35 : 0.1);
      });
    }
    if (w.fluores) {
      w.fluores.forEach(function (mat, i) {
        const on = i % 2 === 0;
        mat.opacity = 0.05 + (on ? scan * 0.55 * pulse : scan * 0.08);
        mat.emissiveIntensity = on ? scan * 1.1 * pulse : 0;
      });
    }
    if (w.traces) {
      w.traces.forEach(function (t) {
        t.mesh.material.emissiveIntensity = t.main ? 0.2 + scan * 1.1 : 0.04 + scan * 0.12;
        t.mesh.material.opacity = t.main ? 0.45 + scan * 0.4 : 0.28 * (1 - scan * 0.55);
      });
    }
    if (w.nodes) {
      w.nodes.forEach(function (n) {
        if (n.mat) n.mat.emissiveIntensity = 0.08 + scan * 0.85 * pulse;
      });
    }
    if (w.lanes) {
      w.lanes.forEach(function (ln) {
        ln.mesh.material.emissiveIntensity = ln.main ? 0.15 + scan * 1.2 : 0.04;
        ln.mesh.material.opacity = ln.main ? 0.28 + scan * 0.45 : 0.2 * (1 - scan * 0.7);
      });
    }
    if (w.live && w.live.material) {
      w.live.material.opacity = 0.1 + scan * 0.75;
      w.live.material.emissiveIntensity = 0.2 + scan * 1.15;
    }
    if (w.mute && w.mute.material) {
      w.mute.material.opacity = 0.4 * (1 - scan * 0.45);
    }
    if (w.voc) {
      w.voc.material.opacity = 0.03 + scan * 0.24;
      w.voc.material.emissiveIntensity = scan * 0.7;
    }
    if (w.targetMats) {
      w.targetMats.forEach(function (mat) {
        mat.emissive.setRGB(0.05 * scan * pulse, 0.16 * scan * pulse, 0.06 * scan * pulse);
        mat.emissiveIntensity = 1.05 * scan;
      });
    }
  }

  function updateJourneyWorlds(p, scan) {
    (story.worlds || WORLD_SPECS).forEach(function (spec) {
      const want = p > spec.in - 0.05 && p < spec.out + 0.06;
      if (want && !journeyWorlds[spec.key]) {
        journeyWorlds[spec.key] = spec.build(mobile, { assets: propAssets, path: path });
        placeOnPath(
          journeyWorlds[spec.key].group,
          path,
          spec.u != null ? spec.u : (spec.in + spec.out) / 2,
          spec.align !== false
        );
        scene.add(journeyWorlds[spec.key].group);
      }
      const w = journeyWorlds[spec.key];
      if (!w) return;
      w.group.visible = p > spec.in - 0.04 && p < spec.out + 0.04;
      if (w.group.visible) applyWorldScan(w, scan, p);
      if (!want && p > spec.out + 0.14) {
        disposeObject(w.group);
        journeyWorlds[spec.key] = null;
      }
    });
  }

  function applyScanLook() {
    const s = state.scan;
    const p = state.progress;
    _colA.setHex(FOG_DAY);
    if (p > 0.18 && p < 0.34) _colA.setHex(0xcfc6b8);
    else if (p > 0.32 && p < 0.5) _colA.setHex(0xd5cfc6);
    else if (p > 0.46 && p < 0.64) _colA.setHex(0xb8b0a6);
    else if (p > 0.58 && p < 0.74) _colA.setHex(0xc4bfb6);
    else if (p > 0.68 && p < 0.86) _colA.setHex(0xc8c8c0);
    else if (p > 0.82) _colA.setHex(FOG_DAY);
    _colB.setHex(FOG_SCAN);
    const fog = _fog.copy(_colA).lerp(_colB, s * 0.55);
    scene.fog.color.copy(fog);
    scene.background.copy(fog);
    renderer.setClearColor(fog, 1);
    scene.fog.near = lerp(10, 7, s);
    scene.fog.far = (p < 0.16 ? 44 : p < 0.5 ? 38 : 42) + (state.dive || 0) * 10;
    renderer.toneMappingExposure = lerp(1.02, 0.84, s);
    hemi.color.setHex(0xf2e6d4);
    _colA.setHex(0xc5d4ce);
    hemi.color.lerp(_colA, s * 0.55);
    hemi.groundColor.setHex(0x5a4638);
    _colB.setHex(0x3a4744);
    hemi.groundColor.lerp(_colB, s * 0.45);
    hemi.intensity = lerp(0.78, 0.58, s);
    keyLight.intensity = lerp(1.08, 0.72, s);
    fill.intensity = lerp(0.32, 0.22, s);

    const pulse = 0.65 + 0.35 * Math.sin(state.time * 2.2);
    warehouse.targetMats.forEach(function (mat) {
      mat.emissive.setRGB(0.05 * s * pulse, 0.16 * s * pulse, 0.06 * s * pulse);
      mat.emissiveIntensity = 1.15 * s;
    });

    const fade = clamp((p - 0.14) / 0.1, 0, 1);
    if (warehouse.group.visible || fade < 0.97) {
      warehouse.fadeMats.forEach(function (m) {
        const base = m.userData.baseOpacity != null ? m.userData.baseOpacity : 1;
        m.opacity = base * (1 - fade);
      });
      warehouse.group.visible = fade < 0.97;
    }

    const lift = clamp((p - 0.11) / 0.12, 0, 1);
    plume.group.scale.set(1, 1 + lift * 0.35, 1 + lift * 0.12);
    plume.group.position.y = lift * 0.2;
    plume.group.visible = p < 0.32;
    const off = Math.abs(state.offset);
    const guide = clamp((off - 1.05) / 0.9, 0, 1);
    const nearBoost = guide * (p < 0.22 ? 0.12 : 0);
    plume.tubes.forEach(function (mesh, i) {
      const base = 0.016 + i * 0.004;
      mesh.material.opacity = base + s * (0.2 - i * 0.03) + nearBoost + lift * 0.08;
    });
    plume.points.material.opacity = 0.03 + s * 0.22 + nearBoost * 0.4;

    const morphAt = story.morphAt != null ? story.morphAt : 0.4;
    const morph = clamp((p - morphAt) / 0.1, 0, 1);
    setFlyFade(Math.max(0.18, 1 - morph * 0.82), morph);
    orb.mat.opacity = morph * (0.5 + s * 0.25);
    orb.mat.emissiveIntensity = 0.4 + morph * 0.9 + s * 0.3;
    if (orb.haloMat) {
      orb.haloMat.opacity = morph * 0.22;
      orb.haloMat.emissiveIntensity = 0.2 + morph * 0.5;
    }
    if (course && course.ribbon && course.ribbon.material) {
      course.ribbon.material.opacity = 0.7 + s * 0.18;
    }
    if (course && course.rings) {
      const ringPulse = 0.7 + 0.3 * Math.sin(state.time * 3.2);
      course.rings.forEach(function (ring) {
        const u = ring.userData.u;
        const behind = u != null && p > u + 0.03;
        ring.visible = !behind;
        const near = u == null ? 0 : 1 - Math.min(1, Math.abs(u - p) * 16);
        if (ring.userData.baseScale == null) ring.userData.baseScale = ring.scale.x || 1;
        ring.scale.setScalar(ring.userData.baseScale * (1 + near * 0.18 + (ring.userData.hit ? 0.12 : 0)));
        const mats = [];
        ring.traverse(function (obj) {
          if (obj.material && obj.material.opacity != null) mats.push(obj.material);
        });
        mats.forEach(function (m) {
          if (m.emissiveIntensity != null) {
            m.emissiveIntensity = ring.userData.hit ? 0.95 : 0.35 + s * 0.5 * ringPulse * (0.4 + near);
          }
        });
      });
    }

    updateJourneyWorlds(p, s);
    if (els.stage) els.stage.textContent = stageLabel(p);
  }

  function placeFlyAndCamera() {
    const u = clamp(state.progress, 0, 0.999);
    path.getPoint(u, _pos);
    path.getTangent(u, _tan).normalize();
    // Chase camera looks along +tan. Three.js lookAt uses x = tan × up as screen-right.
    _right.crossVectors(_tan, _up).normalize();
    if (_right.lengthSq() < 0.0001) _right.set(1, 0, 0);

    const flyPos = _flyPos.set(state.x, _pos.y, _pos.z);
    flyPos.y += Math.sin(state.time * 5.4) * 0.04;
    fly.root.position.copy(flyPos);
    _look.copy(flyPos).add(_tan);
    fly.root.up.copy(_up);
    _orient.lookAt(flyPos, _look, _up);
    fly.root.quaternion.setFromRotationMatrix(_orient);
    fly.root.rotateX(0.06 + Math.sin(state.time * 5.2) * 0.04 + (state.dive || 0) * 0.48);
    fly.root.rotateZ(state.bank);
    if (fly.abdomen) fly.abdomen.rotation.x = Math.sin(state.time * 4.6) * 0.05;

    const beat = Math.sin(state.time * Math.PI * 2 * WING_HZ);
    if (fly.wingRightPivot) fly.wingRightPivot.rotation.z = beat * 0.42;
    if (fly.wingLeftPivot) fly.wingLeftPivot.rotation.z = -beat * 0.42;

    if (orb) {
      orb.mesh.position.copy(flyPos);
      const pulse = 1 + Math.sin(state.time * 4.2) * 0.08;
      const morph = clamp((state.progress - (story.morphAt != null ? story.morphAt : 0.4)) / 0.1, 0, 1);
      orb.mesh.scale.setScalar((0.9 + morph * 0.55) * pulse);
    }

    const intro = clamp(state.time / 1.5, 0, 1);
    const ease = intro * intro * (3 - 2 * intro);
    const dive = state.dive || 0;
    const back = lerp(5.6, 2.55, ease) + dive * 1.65;
    const height = lerp(2.45, 1.12, ease) - dive * 0.5;
    _cam.copy(flyPos);
    _cam.addScaledVector(_tan, -back);
    _cam.addScaledVector(_up, height);
    _cam.addScaledVector(_right, state.camLag * 0.22);
    camera.position.copy(_cam);
    _look.copy(flyPos).addScaledVector(_tan, 1.15 + dive * 0.4).addScaledVector(_up, 0.28 - dive * 0.22);
    camera.up.copy(_up);
    camera.lookAt(_look);
    camera.rotateZ(state.camRoll);
    clipTrailAhead(course, state.progress);
    const fov = 52 + dive * 11;
    if (state.needProj || Math.abs(camera.fov - fov) > 0.15) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
      state.needProj = false;
    }
  }

  function showCard(card) {
    if (!els.card || !card) return;
    state.cardId = card.id;
    state.cardPhase = "in";
    state.cardShownAt = state.time;
    state.cardHideAt = 0;
    if (els.cardKicker) els.cardKicker.textContent = card.kicker;
    if (els.cardHeading) els.cardHeading.textContent = card.heading;
    if (els.cardText) els.cardText.textContent = card.text;
    if (els.cardChain) {
      els.cardChain.textContent = card.chain || "";
      els.cardChain.hidden = !card.chain;
    }
    els.card.hidden = false;
    els.card.classList.remove("is-in", "is-hold", "is-drift");
    void els.card.offsetWidth;
    els.card.classList.add("is-in");
    announce(card.heading + " " + card.text);
  }

  function hideCard() {
    if (!els.card) return;
    els.card.hidden = true;
    els.card.classList.remove("is-in", "is-hold", "is-drift");
    state.cardId = null;
    state.cardPhase = null;
    state.cardHideAt = 0;
  }

  function beginCardDrift() {
    if (!els.card || els.card.hidden) return;
    setCardPhase("drift");
    state.cardPhase = "drift";
    state.cardHideAt = state.time + 1.0;
  }

  function setCardPhase(phase) {
    if (!els.card) return;
    els.card.classList.toggle("is-in", phase === "in");
    els.card.classList.toggle("is-hold", phase === "hold");
    els.card.classList.toggle("is-drift", phase === "drift");
  }

  function setWorldLabelsVisible(on) {
    Object.keys(journeyWorlds).forEach(function (k) {
      const w = journeyWorlds[k];
      if (!w || !w.group) return;
      w.group.traverse(function (obj) {
        if (obj.userData && obj.userData.label) obj.visible = on;
      });
    });
  }

  function updateHud() {
    const p = state.progress;
    const vw = els.world ? els.world.clientWidth : 1;
    const vh = els.world ? els.world.clientHeight : 1;
    const ret = journeyWorlds.ret;
    if (p > 0.82 && ret && ret.target) {
      ret.target.getWorldPosition(_ndc);
      _ndc.y += 0.55;
    } else {
      _ndc.copy(warehouse.target.position);
      _ndc.y += 0.55;
    }
    _ndc.project(camera);
    const inFront = _ndc.z < 1;
    const centered = Math.abs(_ndc.x) < 0.38 && _ndc.y > -0.42 && _ndc.y < 0.55 && inFront;

    if (els.edge) {
      const drifted = Math.abs(state.offset) > 1.28;
      const need = drifted && p < 0.92;
      els.edge.hidden = !need;
      if (need) {
        const right = state.offset > 0;
        els.edge.textContent = right ? "< PATH" : "PATH >";
        els.edge.classList.toggle("is-right", !right);
      }
    }

    if (els.callout) {
      let show = false;
      let kicker = "01 / Headspace";
      let label = "VOC pattern";
      if (state.scan > 0.45 && p < 0.22 && centered) {
        show = fly.root.position.distanceTo(warehouse.target.position) < 16;
      } else if (state.scan > 0.45 && journeyWorlds.hardware && journeyWorlds.hardware.nodes) {
        const nodes = journeyWorlds.hardware.nodes;
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].mesh.getWorldPosition(_ndc);
          _ndc.project(camera);
          if (_ndc.z < 1 && Math.abs(_ndc.x) < 0.3 && Math.abs(_ndc.y) < 0.42) {
            show = true;
            kicker = "04 / Reader";
            label = nodes[i].label;
            break;
          }
        }
      }
      els.callout.hidden = !show;
      if (show) {
        const kickEl = qs("[data-callout-kicker]", els.callout);
        const labelEl = qs("[data-callout-label]", els.callout);
        if (kickEl) kickEl.textContent = kicker;
        if (labelEl) labelEl.textContent = label;
        els.callout.style.left = ((_ndc.x * 0.5 + 0.5) * vw).toFixed(1) + "px";
        els.callout.style.top = ((-_ndc.y * 0.5 + 0.5) * vh).toFixed(1) + "px";
      }
    }

    const card = (story.cards || CARDS).find(function (c) {
      return p >= c.at && p <= c.until && (!c.needScan || state.scan > 0.22);
    });
    if (state.cardPhase === "drift") {
      if (state.time >= state.cardHideAt) hideCard();
    } else if (card) {
      if (state.cardId !== card.id) {
        showCard(card);
      } else {
        const age = state.time - state.cardShownAt;
        const nearEnd = p >= card.until - 0.008;
        if (nearEnd && age > 1.2) beginCardDrift();
        else if (age < 1.65) setCardPhase("in");
        else setCardPhase("hold");
      }
    } else if (state.cardId) {
      beginCardDrift();
    }
    const showingCard = !!(els.card && !els.card.hidden && state.cardId);
    if (els.flightRoot) els.flightRoot.classList.toggle("has-card", showingCard);
    setWorldLabelsVisible(!showingCard);
    if (showingCard) {
      if (els.callout) els.callout.hidden = true;
      if (els.intro) els.intro.classList.add("is-gone");
    }
    if (els.pin) els.pin.hidden = true;

    if (course && course.rings) {
      course.rings.forEach(function (ring) {
        const tag = ring.userData.label;
        if (!tag) return;
        const u = ring.userData.u;
        const near = u != null && Math.abs(p - u) < 0.07;
        const behind = u != null && p > u + 0.03;
        tag.visible = !showingCard && near && !behind;
      });
    }
    if (els.score) {
      els.score.textContent = String(Math.floor(state.score));
      els.score.classList.toggle("is-on", !!(state.onTrail && p < 0.9));
      els.score.classList.toggle("is-off", !(state.onTrail && p < 0.9));
    }
    if (els.finale) els.finale.hidden = p < 0.9;
    if (els.finaleScore && p >= 0.9) {
      els.finaleScore.textContent = "On-trail score · " + Math.floor(state.score);
    }
  }

  function updateParticles() {
    if (!plume || !plume.group.visible) return;
    const arr = plume.pPos;
    const n = plume.pCount;
    for (let i = 0; i < n; i++) {
      const curve = plume.curves[i % plume.curves.length];
      const t = (state.time * 0.07 + i / n) % 1;
      const p = curve.getPointAt(t);
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y + Math.sin(state.time * 1.4 + i) * 0.04;
      arr[i * 3 + 2] = p.z;
    }
    plume.points.geometry.attributes.position.needsUpdate = true;
  }

  function render() {
    if (!renderer) return;
    resize();
    applyScanLook();
    placeFlyAndCamera();
    updateParticles();
    updateHud();
    updateIntro();
    renderer.render(scene, camera);
  }

  function tick(now) {
    if (!state.open || state.userPaused || state.hidden) {
      state.running = false;
      state.raf = 0;
      return;
    }
    if (!state.last) state.last = now;
    const dt = clamp((now - state.last) / 1000, 0, 0.05);
    state.last = now;
    physics(dt);
    render();
    state.raf = window.requestAnimationFrame(tick);
  }

  function startLoop() {
    if (state.running) return;
    state.running = true;
    state.last = 0;
    state.raf = window.requestAnimationFrame(tick);
  }

  function stopLoop() {
    state.running = false;
    if (state.raf) {
      window.cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
  }

  function closeFlight() {
    state.open = false;
    stopLoop();
    state.scanHeld = false;
    state.scanSpace = false;
    state.scanMouse = false;
    state.scanPad = false;
    state.pointer = null;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    }
    if (els.dialog) {
      els.dialog.classList.remove("is-open");
      if (typeof els.dialog.close === "function" && els.dialog.open) {
        try {
          els.dialog.close();
        } catch (err) {
          els.dialog.removeAttribute("open");
        }
      } else {
        els.dialog.removeAttribute("open");
      }
      els.dialog.classList.remove("is-fallback");
    }
    if (els.start) els.start.focus();
  }

  function presentDialog() {
    if (!els.dialog) return;
    if (els.dialog.parentElement !== document.body) {
      document.body.appendChild(els.dialog);
    }
    els.dialog.classList.add("is-open", "is-fallback");
    if (typeof els.dialog.showModal === "function") {
      try {
        if (!els.dialog.open) els.dialog.showModal();
      } catch (err) {
        els.dialog.setAttribute("open", "");
      }
    } else {
      els.dialog.setAttribute("open", "");
    }
    if (els.world && els.world.focus) {
      try {
        els.world.focus({ preventScroll: true });
      } catch (err2) {
        els.world.focus();
      }
    }
  }

  function openFlight() {
    if (state.open || state.opening) return;
    state.opening = true;
    if (els.start) els.start.disabled = true;
    Promise.resolve(webgl ? build() : Promise.resolve(false))
      .then(function (ok) {
        state.opening = false;
        if (els.start) els.start.disabled = false;
        if (!ok) {
          if (els.unavailable) {
            els.unavailable.hidden = false;
            els.unavailable.textContent = "Interactive 3D view unavailable on this device.";
          }
          if (els.start) els.start.hidden = true;
          return;
        }
        resetFlight();
        state.open = true;
        presentDialog();
        window.requestAnimationFrame(function () {
          if (!state.open) return;
          resize();
          render();
          announce("Follow the signal. Steer left and right. Hold Space for Signal view.");
          startLoop();
        });
      })
      .catch(function (err) {
        state.opening = false;
        if (els.start) els.start.disabled = false;
        console.error("Follow the Signal: could not open", err);
        if (els.unavailable) {
          els.unavailable.hidden = false;
          els.unavailable.textContent = "Interactive 3D view failed to start. Refresh and try again.";
        }
      });
  }

  function keySteer(key, down) {
    let v = 0;
    if (key === "ArrowLeft" || key === "a" || key === "A") v = -1;
    if (key === "ArrowRight" || key === "d" || key === "D") v = 1;
    if (!v) return false;
    if (down) {
      state.keyInput = v;
      takeManual();
    } else if (state.keyInput === v) state.keyInput = 0;
    return true;
  }

  function onKeyDown(event) {
    if (!state.open) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target && event.target.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA" || (event.target && event.target.isContentEditable);
    if (event.key === "Escape") {
      closeFlight();
      return;
    }
    if (typing) return;
    if (event.key === " " && tag !== "BUTTON" && tag !== "A") {
      event.preventDefault();
      state.scanSpace = true;
      refreshScanHeld();
      return;
    }
    if (keySteer(event.key, true) && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    if (!state.open) return;
    if (event.key === " ") {
      state.scanSpace = false;
      refreshScanHeld();
    }
    keySteer(event.key, false);
  }

  function onPointerDown(event) {
    if (!state.open || !els.world) return;
    if (event.target && event.target.closest && event.target.closest("button, a, summary")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.pointerType === "mouse") {
      state.scanMouse = true;
      refreshScanHeld();
    }
    state.pointer = { id: event.pointerId, x: event.clientX, mode: "pending" };
  }

  function onPointerMove(event) {
    if (!state.open || !state.pointer || event.pointerId !== state.pointer.id) return;
    const dx = event.clientX - state.pointer.x;
    if (state.pointer.mode === "pending" && Math.abs(dx) > 8) {
      state.pointer.mode = "steer";
      takeManual();
      if (els.world.setPointerCapture) els.world.setPointerCapture(event.pointerId);
      els.world.classList.add("is-steering");
    }
    if (state.pointer.mode === "steer") {
      event.preventDefault();
      const r = els.world.getBoundingClientRect();
      state.pointerInput = clamp(dx / (r.width * 0.2), -1, 1);
    }
  }

  function onPointerUp(event) {
    if (event.pointerType === "mouse") {
      state.scanMouse = false;
      refreshScanHeld();
    }
    if (!state.pointer || event.pointerId !== state.pointer.id) return;
    state.pointer = null;
    state.pointerInput = 0;
    if (els.world) els.world.classList.remove("is-steering");
  }

  if (els.start) {
    els.start.addEventListener("click", function () {
      openFlight();
    });
  }
  els.skip.forEach(function (btn) {
    btn.addEventListener("click", skipJourney);
  });
  els.exitBtns.forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      closeFlight();
    });
  });
  if (els.scanBtn) {
    els.scanBtn.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      event.stopPropagation();
      state.scanPad = true;
      refreshScanHeld();
    });
    const release = function () {
      state.scanPad = false;
      refreshScanHeld();
    };
    els.scanBtn.addEventListener("pointerup", release);
    els.scanBtn.addEventListener("pointercancel", release);
  }
  if (els.pauseBtn) {
    els.pauseBtn.addEventListener("click", function () {
      setPaused(!state.userPaused);
    });
  }
  if (els.autoBtn) {
    els.autoBtn.addEventListener("click", function () {
      setAuto(!state.auto);
    });
  }
  if (els.fsBtn && document.fullscreenEnabled) {
    els.fsBtn.hidden = false;
    els.fsBtn.addEventListener("click", function () {
      if (!document.fullscreenElement) {
        (els.dialog || els.flightRoot).requestFullscreen().catch(function () {});
      } else {
        document.exitFullscreen().catch(function () {});
      }
    });
  }
  if (els.dialog) {
    els.dialog.addEventListener("close", function () {
      if (state.open) {
        state.open = false;
        stopLoop();
        if (els.start) els.start.focus();
      }
    });
    els.dialog.addEventListener("cancel", function () {
      state.open = false;
      stopLoop();
    });
  }
  if (els.world) {
    els.world.addEventListener("pointerdown", onPointerDown);
    els.world.addEventListener("pointermove", onPointerMove, { passive: false });
    els.world.addEventListener("pointerup", onPointerUp);
    els.world.addEventListener("pointercancel", onPointerUp);
  }
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keyup", onKeyUp, true);
  window.addEventListener("resize", function () {
    if (state.open) resize();
  });
  document.addEventListener("visibilitychange", function () {
    state.hidden = document.hidden;
    if (document.hidden) state.last = 0;
    else if (state.open && !state.userPaused) startLoop();
  });

  window.__aerosenseOpenFlight = openFlight;
})();
