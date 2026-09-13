/**
 * Later worlds along the same Follow-the-Signal spline.
 * Conceptual geometry only — not anatomical or circuit-accurate.
 */
import * as THREE from "./vendor/three.module.js";

export const PATH_DURATION = 80;

const PATH_KEYS = [
  { u: 0.0, y: 1.18, x: 0.0 },
  { u: 0.055, y: 2.58, x: 0.22 },
  { u: 0.1, y: 0.76, x: -0.12 },
  { u: 0.14, y: 2.62, x: 0.38 },
  { u: 0.18, y: 0.72, x: 0.55 },
  { u: 0.23, y: 4.38, x: 0.18 },
  { u: 0.28, y: 1.52, x: 0.06 },
  { u: 0.34, y: 4.18, x: 0.2 },
  { u: 0.4, y: 1.4, x: 0.04 },
  { u: 0.43, y: 2.85, x: -0.1 },
  { u: 0.46, y: 1.32, x: 0.16 },
  { u: 0.49, y: 3.58, x: -0.08 },
  { u: 0.52, y: 1.0, x: 0.1 },
  { u: 0.58, y: 3.28, x: 0.22 },
  { u: 0.64, y: 1.06, x: 0.05 },
  { u: 0.7, y: 3.92, x: 0.14 },
  { u: 0.76, y: 1.46, x: 0.0 },
  { u: 0.84, y: 3.42, x: 0.48 },
  { u: 0.9, y: 1.24, x: 1.12 },
  { u: 1.0, y: 1.2, x: 1.48 }
];

export const DIVE_U = [0.1, 0.18, 0.28, 0.4, 0.46, 0.52, 0.64, 0.76, 0.9];

function smoothKey(u, keys, prop) {
  if (u <= keys[0].u) return keys[0][prop];
  for (let i = 1; i < keys.length; i++) {
    if (u <= keys[i].u) {
      const t = (u - keys[i - 1].u) / (keys[i].u - keys[i - 1].u);
      const s = t * t * (3 - 2 * t);
      return keys[i - 1][prop] + (keys[i][prop] - keys[i - 1][prop]) * s;
    }
  }
  return keys[keys.length - 1][prop];
}

export const CARDS = [
  {
    id: "go",
    at: 0.042,
    until: 0.095,
    needScan: false,
    kicker: "01 · Plume",
    heading: "Follow the green trail.",
    text: "The trail swerves. Auto follows it — turn Auto off to steer yourself.",
    chain: ""
  },
  {
    id: "wh",
    at: 0.11,
    until: 0.155,
    needScan: false,
    kicker: "02 · Headspace",
    heading: "Something is changing in the air.",
    text: "Stored food can carry changing volatile patterns before it looks different.",
    chain: ""
  },
  {
    id: "ol",
    at: 0.22,
    until: 0.285,
    needScan: false,
    kicker: "03 · Olfaction",
    heading: "One odor. Many receptors.",
    text: "Fruit-fly olfaction inspired AeroSense to treat odor as a receptor pattern.",
    chain: ""
  },
  {
    id: "sig",
    at: 0.305,
    until: 0.36,
    needScan: false,
    kicker: "04 · Signal",
    heading: "Now you are the signal.",
    text: "The glowing core is the odor pattern moving through AeroSense.",
    chain: ""
  },
  {
    id: "cell",
    at: 0.39,
    until: 0.455,
    needScan: false,
    kicker: "05 · Cell",
    heading: "We borrowed the receptor.",
    text: "Living cells turn receptor activation into a green glow.",
    chain: "OR / Orco  →  HEK293T  →  Ca²⁺  →  GCaMP"
  },
  {
    id: "hw",
    at: 0.52,
    until: 0.595,
    needScan: false,
    kicker: "06 · Reader",
    heading: "A glow becomes a signal.",
    text: "Fly through the reader path: light, photodiode, amplifier, converter.",
    chain: "LIGHT  →  PD  →  TIA  →  ADC"
  },
  {
    id: "fdm",
    at: 0.645,
    until: 0.71,
    needScan: false,
    kicker: "07 · FDM / DLIA",
    heading: "Stay on the synchronized lane.",
    text: "Side traces are other signals. The center trail is the one that moves with you.",
    chain: "FDM  +  DLIA"
  },
  {
    id: "nn",
    at: 0.785,
    until: 0.855,
    needScan: false,
    kicker: "08 · Sparse code",
    heading: "Separate what overlaps.",
    text: "Many inputs become a few glowing nodes — a pattern, not a crowd.",
    chain: "RECEPTORS  →  CONTRAST  →  SPARSE CODE"
  }
];

export function stageLabel(p) {
  if (p < DIVE_U[2] - 0.03) return "01 / WAREHOUSE";
  if (p < DIVE_U[3] - 0.03) return "02 / OLFACTION";
  if (p < DIVE_U[5] - 0.03) return "03 / CELL";
  if (p < DIVE_U[6] - 0.03) return "04 / READER";
  if (p < DIVE_U[7] - 0.03) return "05 / LOCK-IN";
  if (p < DIVE_U[8] - 0.03) return "06 / SPARSE CODE";
  return "07 / RETURN";
}

export function makeExtendedPath() {
  const pts = [];
  const n = 96;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const fade = u < 0.045 ? u / 0.045 : u > 0.92 ? Math.max(0, 1 - (u - 0.92) / 0.08) : 1;
    const weave =
      Math.sin(u * Math.PI * 6.4) * 1.42 +
      Math.sin(u * Math.PI * 2.15) * 0.62 +
      Math.sin(u * Math.PI * 10.6) * 0.22;
    pts.push(new THREE.Vector3(weave * fade, smoothKey(u, PATH_KEYS, "y"), 2.2 + u * 280));
  }
  return new THREE.CatmullRomCurve3(pts, false, "centripetal");
}

export function bindStory() {
  const cards = CARDS.map(function (c, i) {
    const trough = DIVE_U[i];
    if (trough == null) return c;
    const prev = i === 0 ? 0.02 : DIVE_U[i - 1];
    const next = DIVE_U[i + 1] != null ? DIVE_U[i + 1] : 0.9;
    const at = i === 0 ? 0.038 : (prev + trough) / 2 + 0.01;
    const until = (trough + next) / 2 - 0.01;
    return Object.assign({}, c, {
      at: at,
      until: Math.max(at + 0.036, until)
    });
  });
  for (let i = 0; i < cards.length - 1; i++) {
    if (cards[i].until > cards[i + 1].at - 0.012) {
      cards[i].until = cards[i + 1].at - 0.012;
    }
  }
  const d = function (i) {
    return DIVE_U[i];
  };
  const worlds = [
    { key: "antenna", in: d(2) - 0.06, out: d(3) - 0.01, u: d(2), align: true, build: makeAntennaWorld },
    { key: "cell", in: d(3) - 0.06, out: d(5) - 0.01, u: d(3), align: true, build: makeCellWorld },
    { key: "hardware", in: d(5) - 0.06, out: d(6) - 0.01, u: d(5), align: true, build: makeHardwareWorld },
    { key: "fdm", in: d(6) - 0.06, out: d(7) - 0.01, u: d(6), align: true, build: makeFdmWorld },
    { key: "neural", in: d(7) - 0.06, out: d(8) - 0.02, u: d(7), align: true, build: makeNeuralWorld },
    { key: "ret", in: d(8) - 0.08, out: 1.08, u: d(8), align: false, build: makeReturnWorld }
  ];
  return { cards: cards, worlds: worlds, morphAt: d(3), dives: DIVE_U };
}

export function cloneProp(src) {
  if (!src) return null;
  const g = src.clone(true);
  g.traverse(function (obj) {
    if (!obj.material) return;
    obj.material = Array.isArray(obj.material)
      ? obj.material.map(function (m) {
          return m.clone();
        })
      : obj.material.clone();
  });
  return g;
}

export function placeOnPath(group, path, u, align) {
  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  const uu = THREE.MathUtils.clamp(u, 0, 0.999);
  path.getPoint(uu, p);
  if (align === false) {
    group.position.set(p.x, 0, p.z);
    group.quaternion.identity();
    return;
  }
  path.getTangent(uu, t).normalize();
  group.position.copy(p);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t);
}

function collectGlowMats(root) {
  const out = [];
  root.traverse(function (obj) {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach(function (m) {
      if (!m || !m.emissive) return;
      if (m.emissive.g > m.emissive.r + 0.04 && out.indexOf(m) === -1) out.push(m);
    });
  });
  return out;
}

function glowMat(color, opacity) {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: 0x1f8a4c,
    emissiveIntensity: 0,
    roughness: 0.55,
    metalness: 0.04,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

function makeLabelSprite(text, width) {
  const w = 640;
  const h = 160;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(18, 14, 12, 0.12)";
  ctx.fillRect(48, 44, w - 96, h - 88);
  ctx.font = "600 64px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f6f1e8";
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 0.92
  });
  const sprite = new THREE.Sprite(mat);
  const span = width || 2.4;
  sprite.scale.set(span, span * (h / w), 1);
  sprite.userData.label = true;
  return sprite;
}

function makeRingMesh(radius, tube, color, opacity) {
  const mat = glowMat(color, opacity);
  mat.emissiveIntensity = 0.45;
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 22), mat);
  return mesh;
}

function makeStableTube(path, tubular, radius, radial) {
  const positions = [];
  const normals = [];
  const indices = [];
  const p = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const n = new THREE.Vector3(0, 1, 0);
  const b = new THREE.Vector3();
  const framesP = [];
  const framesN = [];
  const framesB = [];
  for (let i = 0; i <= tubular; i++) {
    const u = i / tubular;
    path.getPoint(u, p);
    path.getTangent(u, tan).normalize();
    n.addScaledVector(tan, -n.dot(tan));
    if (n.lengthSq() < 0.25) {
      n.set(0, 1, 0).addScaledVector(tan, -tan.y);
    }
    n.normalize();
    b.crossVectors(tan, n).normalize();
    n.crossVectors(b, tan).normalize();
    framesP.push(p.x, p.y, p.z);
    framesN.push(n.x, n.y, n.z);
    framesB.push(b.x, b.y, b.z);
  }
  for (let i = 0; i <= tubular; i++) {
    const px = framesP[i * 3];
    const py = framesP[i * 3 + 1];
    const pz = framesP[i * 3 + 2];
    const nx = framesN[i * 3];
    const ny = framesN[i * 3 + 1];
    const nz = framesN[i * 3 + 2];
    const bx = framesB[i * 3];
    const by = framesB[i * 3 + 1];
    const bz = framesB[i * 3 + 2];
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const vx = nx * s + bx * c;
      const vy = ny * s + by * c;
      const vz = nz * s + bz * c;
      positions.push(px + vx * radius, py + vy * radius, pz + vz * radius);
      normals.push(vx, vy, vz);
    }
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b0 = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      indices.push(a, c, b0, b0, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

function clipMeshAhead(mesh, u0) {
  const tubular = mesh.userData.tubular;
  const radial = mesh.userData.radial;
  if (!tubular || !radial || !mesh.geometry) return;
  const startSeg = Math.min(tubular, Math.max(0, Math.floor(u0 * tubular)));
  const idxPer = radial * 6;
  mesh.geometry.setDrawRange(startSeg * idxPer, Math.max(0, (tubular - startSeg) * idxPer));
}

export function clipTrailAhead(course, progress) {
  if (!course) return;
  const tubular = (course.ribbon && course.ribbon.userData.tubular) || 180;
  const u0 = Math.min(0.998, progress + 2 / tubular);
  if (course.ribbon) clipMeshAhead(course.ribbon, u0);
  if (course.glow) clipMeshAhead(course.glow, u0);
}

export function makeCourse(path, mobile, assets) {
  const group = new THREE.Group();
  group.name = "courseGuide";
  const segs = mobile ? 110 : 180;
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x8fd4a4,
    transparent: true,
    opacity: 0.78,
    depthWrite: true
  });
  const glowMatRibbon = new THREE.MeshBasicMaterial({
    color: 0xb7e8c4,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ribbon = new THREE.Mesh(makeStableTube(path, segs, 0.075, 7), coreMat);
  ribbon.frustumCulled = false;
  ribbon.userData.tubular = segs;
  ribbon.userData.radial = 7;
  const glow = new THREE.Mesh(makeStableTube(path, segs, 0.14, 6), glowMatRibbon);
  glow.frustumCulled = false;
  glow.userData.tubular = segs;
  glow.userData.radial = 6;
  group.add(glow, ribbon);

  const rings = [];
  const _p = new THREE.Vector3();
  const _t = new THREE.Vector3();
  const _q = new THREE.Quaternion();
  const _z = new THREE.Vector3(0, 0, 1);
  CARDS.forEach(function (card, i) {
    const u = DIVE_U[i];
    if (u == null) return;
    path.getPoint(u, _p);
    path.getTangent(u, _t).normalize();
    const gate = makeRingMesh(0.7, 0.038, 0x8fd4a4, 0.78);
    gate.position.copy(_p);
    _q.setFromUnitVectors(_z, _t);
    gate.quaternion.copy(_q);
    gate.userData.u = u;
    gate.userData.passed = false;
    gate.userData.baseScale = 1;
    gate.userData.checkpoint = true;
    group.add(gate);
    const tag = makeLabelSprite(card.kicker, 2.2);
    tag.position.copy(_p);
    tag.position.y += 0.95;
    tag.userData.checkpoint = true;
    gate.userData.label = tag;
    group.add(tag);
    rings.push(gate);
  });

  const obstacles = [];
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3c, roughness: 0.82, metalness: 0.03 });
  const sackMat = new THREE.MeshStandardMaterial({ color: 0x8a6844, roughness: 0.9 });
  const dummyUp = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3();
  const nObs = mobile ? 6 : 10;
  for (let i = 0; i < nObs; i++) {
    const u = 0.06 + (i / nObs) * 0.7;
    path.getPoint(u, _p);
    path.getTangent(u, _t).normalize();
    right.crossVectors(_t, dummyUp).normalize();
    const side = i % 2 === 0 ? 1 : -1;
    const g = new THREE.Group();
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.5), boxMat);
    crate.position.copy(_p).addScaledVector(right, side * (1.55 + (i % 3) * 0.2));
    crate.position.y = _p.y - 0.22;
    crate.rotation.y = i * 0.2;
    g.add(crate);
    if (i % 4 === 1) {
      const sack = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), sackMat);
      sack.scale.set(1, 0.72, 1.15);
      sack.position.copy(_p).addScaledVector(right, -side * 1.65);
      sack.position.y = _p.y - 0.2;
      g.add(sack);
    }
    group.add(g);
    obstacles.push(g);
  }

  return { group: group, ribbon: ribbon, glow: glow, rings: rings, obstacles: obstacles, kind: "course" };
}

function muteMat(color, opacity) {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.82,
    metalness: 0.03,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

function hideUnlabeledRings(root) {
  if (!root) return;
  const size = new THREE.Vector3();
  root.traverse(function (obj) {
    if (!obj.isMesh || !obj.geometry) return;
    const n = (obj.name || "").toLowerCase();
    if (/torus|gate/.test(n)) {
      obj.visible = false;
      return;
    }
    const pos = obj.geometry.getAttribute("position");
    if (!pos || pos.count < 180) return;
    obj.geometry.computeBoundingBox();
    const bb = obj.geometry.boundingBox;
    if (!bb) return;
    bb.getSize(size);
    const max = Math.max(size.x, size.y, size.z);
    const min = Math.min(size.x, size.y, size.z);
    if (max > 1.4 && min < 0.22) obj.visible = false;
  });
}

export function disposeObject(obj) {
  if (!obj) return;
  obj.traverse(function (child) {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(function (m) {
        if (m && m.dispose) m.dispose();
      });
    }
  });
  if (obj.parent) obj.parent.remove(obj);
}

export function makeAntennaWorld(mobile, ctx) {
  const group = new THREE.Group();
  group.name = "antennaWorld";
  const assets = (ctx && ctx.assets) || {};
  const title = makeLabelSprite("ANTENNA", 2.8);
  title.position.set(-2.55, 1.15, -1.4);
  group.add(title);
  let receptors = [];
  if (assets.antenna) {
    const prop = cloneProp(assets.antenna);
    hideUnlabeledRings(prop);
    group.add(prop);
    receptors = collectGlowMats(prop);
  } else {
    const n = mobile ? 8 : 12;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 1.15, 12, 24, 1, true),
      muteMat(0xc8b9a4, 0.38)
    );
    shaft.rotation.x = Math.PI / 2;
    group.add(shaft);
    const stalkGeo = new THREE.CylinderGeometry(0.055, 0.04, 1.25, 8);
    const bulbGeo = new THREE.SphereGeometry(0.2, 10, 8);
    const stalkMat = muteMat(0x6a5340, 0.9);
    const bulbMat = glowMat(0x8a7060, 0.8);
    bulbMat.emissiveIntensity = 0.25;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 1.05;
      const g = new THREE.Group();
      g.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.72, -1.4 + (i % 3) * 1.1);
      const stalk = new THREE.Mesh(stalkGeo, stalkMat);
      stalk.rotation.x = Math.PI / 2;
      const bulb = new THREE.Mesh(bulbGeo, bulbMat.clone());
      bulb.position.z = 0.7;
      g.add(stalk, bulb);
      group.add(g);
      receptors.push(bulb.material);
    }
  }
  const sub = makeLabelSprite("receptors", 1.9);
  sub.position.set(2.35, -0.85, 1.2);
  group.add(sub);
  return { group, receptors, kind: "antenna" };
}

export function makeCellWorld(mobile, ctx) {
  const group = new THREE.Group();
  group.name = "cellWorld";
  const assets = (ctx && ctx.assets) || {};
  const title = makeLabelSprite("CELL", 2.3);
  title.position.set(-2.7, 1.35, -0.4);
  group.add(title);
  const fluores = [];
  if (assets.cell) {
    const prop = cloneProp(assets.cell);
    group.add(prop);
    collectGlowMats(prop).forEach(function (m) {
      fluores.push(m);
    });
  } else {
    const membrane = new THREE.Mesh(new THREE.SphereGeometry(2.45, 28, 18), muteMat(0xd8cfc4, 0.28));
    group.add(membrane);
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 14), muteMat(0xb7a898, 0.45));
    nucleus.position.set(0.15, 0.05, 0.1);
    group.add(nucleus);
    const n = mobile ? 7 : 11;
    const gGeo = new THREE.SphereGeometry(0.22, 10, 8);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(gGeo, glowMat(0x9ad4a8, 0.22));
      const a = (i / n) * Math.PI * 2;
      m.position.set(Math.cos(a) * 1.45, Math.sin(a * 1.3) * 0.55, Math.sin(a) * 1.25);
      group.add(m);
      fluores.push(m.material);
    }
  }
  const nucLabel = makeLabelSprite("nucleus", 1.5);
  nucLabel.position.set(2.15, 0.85, 0.2);
  group.add(nucLabel);
  const glowLabel = makeLabelSprite("GCaMP glow", 1.8);
  glowLabel.position.set(2.35, -1.15, 1.4);
  group.add(glowLabel);
  return { group, fluores, kind: "cell" };
}

export function makeHardwareWorld(mobile, ctx) {
  const group = new THREE.Group();
  group.name = "hardwareWorld";
  const assets = (ctx && ctx.assets) || {};
  const title = makeLabelSprite("READER", 2.4);
  title.position.set(-2.45, 1.35, -8.2);
  group.add(title);
  const board = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.1, 22), muteMat(0x3a342c, 0.94));
  board.position.y = -0.72;
  board.material.depthWrite = true;
  group.add(board);
  const nodes = [];
  const labels = ["LIGHT", "PD", "TIA", "ADC"];
  const traces = [];
  const centerPts = [];
  for (let k = 0; k < 10; k++) centerPts.push(new THREE.Vector3(0, -0.58, -9 + k * 2.1));
  const mainTrace = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(centerPts), 24, 0.05, 6, false),
    glowMat(0xb7cbb0, 0.7)
  );
  group.add(mainTrace);
  traces.push({ mesh: mainTrace, main: true });
  for (let i = 0; i < 4; i++) {
    const mat = glowMat(0x6a8a70, 0.85);
    mat.depthWrite = true;
    mat.emissiveIntensity = 0.3;
    const ring = makeRingMesh(0.62, 0.05, 0x8fd4a4, 0.75);
    ring.material = mat;
    ring.position.set(0, 0, -7.2 + i * 4.4);
    group.add(ring);
    const tag = makeLabelSprite(labels[i], 1.5);
    tag.position.set(1.55, 0.55, -7.2 + i * 4.4);
    group.add(tag);
    nodes.push({ mesh: ring, mat: mat, label: labels[i] });
  }
  const sideN = mobile ? 6 : 10;
  const chip = new THREE.InstancedMesh(new THREE.BoxGeometry(0.38, 0.08, 0.3), muteMat(0x4a4036, 0.9), sideN);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < sideN; i++) {
    dummy.position.set((i % 2 ? -1.55 : 1.55), -0.62, -8 + i * 1.6);
    dummy.rotation.y = (i % 5) * 0.08;
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    chip.setMatrixAt(i, dummy.matrix);
  }
  chip.instanceMatrix.needsUpdate = true;
  group.add(chip);
  return { group, nodes, traces, kind: "hardware" };
}

export function makeFdmWorld(mobile) {
  const group = new THREE.Group();
  group.name = "fdmWorld";
  const title = makeLabelSprite("LOCK-IN", 2.3);
  title.position.set(-2.4, 1.2, -6.8);
  group.add(title);
  const lanes = [];
  const n = mobile ? 4 : 5;
  const mid = Math.floor(n / 2);
  for (let i = 0; i < n; i++) {
    const pts = [];
    const x = (i - mid) * 0.7;
    const main = i === mid;
    for (let k = 0; k < 12; k++) {
      const z = -8 + k * 1.5;
      const y = main ? 0 : Math.sin(k * (0.95 + i * 0.22)) * 0.32;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, main ? 0.07 : 0.028, 6, false),
      glowMat(main ? 0xb8d4b8 : 0x8a8070, main ? 0.55 : 0.2)
    );
    group.add(tube);
    lanes.push({ mesh: tube, main: main });
  }
  const keep = makeLabelSprite("this lane", 1.6);
  keep.position.set(-1.85, 0.55, 2.0);
  group.add(keep);
  const other = makeLabelSprite("other signals", 1.8);
  other.position.set(2.15, 0.7, -1.6);
  group.add(other);
  return { group, lanes, kind: "fdm" };
}

export function makeNeuralWorld(mobile) {
  const group = new THREE.Group();
  group.name = "neuralWorld";
  const title = makeLabelSprite("SPARSE CODE", 2.6);
  title.position.set(-2.6, 1.35, -7.4);
  group.add(title);
  const count = mobile ? 42 : 70;
  const mute = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 5), muteMat(0x6a5c50, 0.45), count);
  const activeN = mobile ? 8 : 12;
  const live = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 8, 6), glowMat(0x8fd4a4, 0.22), activeN);
  const dummy = new THREE.Object3D();
  const rand = function (i) {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  for (let i = 0; i < count; i++) {
    const z = -9 + rand(i) * 20;
    const spread = z < -2 ? 1.6 : z < 6 ? 1.15 : 0.85;
    dummy.position.set((rand(i + 3) - 0.5) * 2.4 * spread, (rand(i + 7) - 0.5) * 1.5 * spread, z);
    dummy.scale.setScalar(0.7 + rand(i + 2) * 0.6);
    dummy.updateMatrix();
    mute.setMatrixAt(i, dummy.matrix);
  }
  mute.instanceMatrix.needsUpdate = true;
  const activePos = [];
  for (let i = 0; i < activeN; i++) {
    const z = 4 + (i / activeN) * 8;
    dummy.position.set((rand(i + 20) - 0.5) * 0.55, (rand(i + 9) - 0.5) * 0.4, z);
    dummy.scale.setScalar(1.15);
    dummy.updateMatrix();
    live.setMatrixAt(i, dummy.matrix);
    activePos.push(dummy.position.clone());
  }
  live.instanceMatrix.needsUpdate = true;
  group.add(mute, live);
  const links = [];
  const linkMat = muteMat(0x7a6e60, 0.18);
  for (let i = 0; i < activeN - 1; i++) {
    const a = activePos[i];
    const b = activePos[i + 1];
    const dir = b.clone().sub(a);
    const len = dir.length();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 4), linkMat);
    dummy.position.copy(a).add(b).multiplyScalar(0.5);
    dummy.lookAt(b);
    cyl.position.copy(dummy.position);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    group.add(cyl);
    links.push(cyl);
  }
  const dense = makeLabelSprite("many inputs", 1.8);
  dense.position.set(2.2, 0.85, -6);
  group.add(dense);
  const sparse = makeLabelSprite("few active", 1.8);
  sparse.position.set(2.15, 0.85, 8);
  group.add(sparse);
  return { group, mute: mute, live: live, links: links, kind: "neural" };
}

export function makeReturnWorld(_mobile, ctx) {
  const group = new THREE.Group();
  group.name = "returnWorld";
  const assets = (ctx && ctx.assets) || {};
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 18),
    new THREE.MeshStandardMaterial({ color: 0xc4b496, roughness: 0.94, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);
  const aisle = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 18),
    new THREE.MeshStandardMaterial({ color: 0xd8c8ae, roughness: 0.9, metalness: 0 })
  );
  aisle.rotation.x = -Math.PI / 2;
  aisle.position.y = 0.01;
  group.add(aisle);
  const wood = new THREE.MeshStandardMaterial({
    color: 0x8a6240,
    roughness: 0.74,
    metalness: 0.02,
    emissive: 0x000000
  });
  const sack = new THREE.MeshStandardMaterial({
    color: 0x9a7048,
    roughness: 0.86,
    metalness: 0,
    emissive: 0x000000
  });
  const target = new THREE.Group();
  target.position.set(1.5, 0, 2.2);
  const crate = assets.crate ? cloneProp(assets.crate) : new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.58, 0.74), wood);
  if (!assets.crate) crate.position.y = 0.3;
  else crate.scale.setScalar(1.35);
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), sack);
  s1.position.set(0.32, 0.3, 0.18);
  s1.scale.set(1, 0.7, 1.1);
  const s2 = s1.clone();
  s2.position.set(-0.18, 0.32, -0.22);
  target.add(crate, s1, s2);
  group.add(target);
  const foodLabel = makeLabelSprite("STORED FOOD", 2.1);
  foodLabel.position.set(-1.15, 1.15, 2.2);
  group.add(foodLabel);
  const vocPts = [];
  for (let i = 0; i < 7; i++) {
    vocPts.push(new THREE.Vector3(1.5 + Math.sin(i) * 0.2, 0.7 + i * 0.12, 2.2 - i * 0.55));
  }
  const voc = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vocPts), 16, 0.07, 5, false),
    glowMat(0x8aa88c, 0.04)
  );
  group.add(voc);
  return { group, target: target, targetMats: [wood, sack], voc: voc, kind: "return" };
}

export const WORLD_SPECS = [
  { key: "antenna", in: 0.16, out: 0.34, u: 0.24, align: true, build: makeAntennaWorld },
  { key: "cell", in: 0.3, out: 0.5, u: 0.4, align: true, build: makeCellWorld },
  { key: "hardware", in: 0.46, out: 0.64, u: 0.55, align: true, build: makeHardwareWorld },
  { key: "fdm", in: 0.58, out: 0.75, u: 0.66, align: true, build: makeFdmWorld },
  { key: "neural", in: 0.7, out: 0.88, u: 0.79, align: true, build: makeNeuralWorld },
  { key: "ret", in: 0.82, out: 1.08, u: 0.94, align: false, build: makeReturnWorld }
];
