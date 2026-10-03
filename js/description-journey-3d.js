/**
 * Follow the Signal — Description-page 3D journey.
 * Local Three.js + GLTFLoader. Conceptual interactive, not experimental data.
 */
import * as THREE from "./vendor/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";

const FLY_URL = "models/showcase_v3/aerosense_fly_v3.glb";
const WING_HZ = 12;
const BANK_MAX = THREE.MathUtils.degToRad(18);
const CAM_ROLL_MAX = THREE.MathUtils.degToRad(2.5);
const CAM_POS_DAMP = 4.2;
const CAM_LOOK_DAMP = 6.5;
const CAM_YAW_DAMP = 7.5;
const CAM_ROLL_DAMP = 2.0;
const FLY_YAW_DAMP = 5.6;
const FLY_VW_DESKTOP = 0.18;
const FLY_VW_MOBILE = 0.22;
const FLY_SCREEN_Y = 0.73;
const OFFSET_MAX = 2.65;
const SOFT_RAIL = 2.12;
const STEER_ACCEL = 11.2;
const STEER_DRAG = 3.35;
const AUTO_AIM_DAMP = 1.85;
const AUTO_SEEK = 5.4;
const AUTO_DRAG = 4.1;
const ODOR_RIBBON_SEGS = 360;
// Give each destination its own stretch of flight. Doubling the timeline with
// the physical spacing keeps the fly responsive instead of simply slowing it.
const STAGE_SECONDS = 24.0;
const STAGE_DISTANCE = 16;
const WAYPOINT_PHASE = 0.73;
const HANDOFF_SECONDS = 2.8;
const ENTRY_SECONDS = 2.2;
const FINISH_PHASE = 0.78;
const OVERLAP = 0.22;
const DIVE_PRE_START = -1.55;
const DIVE_PRE_END = -0.88;
const DIVE_T0 = -0.82;
const DIVE_T1 = 0.78;
const DIVE_REC_END = 1.85;
const SPEED_PRE = 1.2;
const SPEED_DIVE_LO = 1.85;
const SPEED_DIVE_HI = 2.12;
const FLY_DIVE_PITCH = THREE.MathUtils.degToRad(49);
const FLY_DIVE_PITCH_DAMP = 8.4;
const CAM_DIVE_FOLLOW = 0.57;
const CAM_DIVE_PITCH_DAMP = 1.55;
const CAM_DIVE_Y_DAMP = 1.7;
const DIVE_DROP = 0.48;
const DIVE_GLIDE = 0.85;
const DIVE_LINKS = [
  { outY: 2.85, outZ: -2.25, inY: -2.45, inZ: 0.55, outScale: 1.0, inScale: 1.03 },
  { outY: 1.45, outZ: -0.85, inY: -2.15, inZ: 0.95, outScale: 1.2, inScale: 1.0 },
  { outY: 1.7, outZ: -1.45, inY: -1.85, inZ: 1.15, outScale: 1.0, inScale: 1.0, outStretchZ: 1.22 },
  { outY: 2.25, outZ: -1.15, inY: -1.65, inZ: 0.72, outScale: 1.0, inScale: 1.0, outStretchZ: 1.12 },
  { outY: 3.15, outZ: -0.7, inY: -2.55, inZ: 0.42, outScale: 0.86, inScale: 1.0 }
];
const CARD_ENTER_MS = 420;
const CARD_HOLD_MS = 3100;
const CARD_EXIT_MS = 560;
const CARD_PLACE = ["nw", "ne", "nw", "ne", "nw", "n"];
const SCORE_INNER = 0.36;
const SCORE_MID = 0.85;
const CHECKPOINTS = [
  { id: "voc", stage: 0, bonus: 100, label: "+100 SOURCE", names: ["VOC_SOURCE_A", "VOC_SOURCE_ANCHOR"] },
  { id: "receptor", stage: 1, bonus: 100, label: "+100 CHECKPOINT", names: ["RECEPTOR_MEMBRANE", "OR_ACTIVE_1", "OR_ACTIVE_3"] },
  { id: "gcamp", stage: 2, bonus: 100, label: "+100 CHECKPOINT", names: ["GCAMP_SIGNAL_0", "GCAMP_SIGNAL_1", "GCaMP_0"] },
  { id: "read", stage: 3, bonus: 100, label: "+100 CHECKPOINT", names: ["PD", "TIA"] },
  { id: "sparse", stage: 4, bonus: 100, label: "+100 CHECKPOINT", names: ["KC_ACTIVE"] },
  { id: "final", stage: 5, bonus: 150, label: "+150 SOURCE", names: ["RETURN_TARGET_GLOW", "FINAL_ODOR"] }
];
const FOG_DAY = 0x23453d;
const FOG_SCAN = 0x9aa8a0;
const CLEAR_DAY = 0x23453d;
const CLEAR_SCAN = 0xa8b2aa;

const STAGES = [
  {
    id: "air",
    num: "01",
    key: "AIR",
    url: "models/showcase_v3/aerosense_01_warehouse_v3.glb",
    preview: "models/previews_v3/01_warehouse_v3.png",
    kicker: "01 / AIR",
    heading: "FOLLOW THE SCENT.",
    chain: "",
    text: "A stored batch can change before the warning becomes visible.",
    place: "nw",
    pathNames: ["FLIGHT_PATH_01", "PATH_START", "PATH_TARGET", "STAGE_ANCHOR_01", "VOC_SOURCE_ANCHOR"],
    fallback: [
      [-0.1, 1.35, -4.0],
      [0.0, 1.15, -1.2],
      [0.25, 1.1, 0.25],
      [0.55, 1.08, 1.1]
    ]
  },
  {
    id: "fly",
    num: "02",
    key: "FLY",
    url: "models/showcase_v4/aerosense_02_olfaction_v4.glb",
    preview: "models/previews_v4/02_olfaction_v4.png",
    kicker: "02 / OLFACTION",
    heading: "AT THE\nRECEPTOR.",
    chain: "",
    text: "The fly pauses as the view follows an odor cue toward its antenna. This is an illustrative perspective shift, not a molecule-level simulation.",
    place: "ne",
    pathNames: ["FLIGHT_PATH_02", "PATH_START_02", "PATH_TARGET_02", "STAGE_ANCHOR_02"],
    fallback: [
      [0, 1.4, -4.0],
      [0.22, 1.55, -1.7],
      [0.05, 1.62, 0.1],
      [0, 1.36, 2.5]
    ]
  },
  {
    id: "cell",
    num: "03",
    key: "CELL",
    url: "models/showcase_v4/aerosense_03_cell_v4.glb",
    preview: "models/previews_v4/03_cell_v4.png",
    kicker: "03 / SENSE",
    heading: "WE BORROWED\nTHE RECEPTOR.",
    chain: "OR + Orco → Ca²⁺ → GCaMP6f",
    text: "The story now moves to a separate engineered HEK293T cell carrying the proposed OR–Orco/GCaMP sensing architecture.",
    place: "nw",
    pathNames: ["FLIGHT_PATH_03", "STAGE_ANCHOR_03"],
    fallback: [
      [0, 1.2, -4.0],
      [0.1, 1.3, -1.8],
      [-0.1, 1.1, -0.1],
      [0, 1.0, 2.3]
    ]
  },
  {
    id: "read",
    num: "04",
    key: "READ",
    url: "models/showcase_v4/aerosense_04_hardware_v4.glb",
    preview: "models/previews_v4/04_hardware_v4.png",
    kicker: "04 / READ",
    heading: "A GLOW BECOMES\nA SIGNAL.",
    chain: "LIGHT → PHOTODIODE → TIA → ADC",
    text: "The reader is designed to turn weak fluorescence into a digitized measurement.",
    place: "ne",
    pathNames: ["FLIGHT_PATH_04", "STAGE_ANCHOR_04", "PD", "TIA", "ADC", "TRACE_MAIN"],
    fallback: [
      [-0.1, 0.45, -4.2],
      [-0.2, 0.55, -2.3],
      [-0.02, 0.5, -0.45],
      [0.45, 0.52, 0.8],
      [0.2, 0.5, 2.3]
    ]
  },
  {
    id: "decode",
    num: "05",
    key: "DECODE",
    url: "models/showcase_v4/aerosense_05_decoder_v4.glb",
    preview: "models/previews_v4/05_decoder_v4.png",
    kicker: "05 / DECODE",
    heading: "SEPARATE\nWHAT OVERLAPS.",
    chain: "INPUT → CONTRAST → SPARSE CODE",
    text: "Fly-inspired decoding compares response patterns. This flight illustrates the design, not measured performance.",
    place: "nw",
    pathNames: ["FLIGHT_PATH_05", "STAGE_ANCHOR_05"],
    fallback: [
      [0, 0.9, -4.0],
      [0, 0.9, -1.8],
      [0.1, 0.95, 0.4],
      [0.2, 1.0, 2.9]
    ]
  },
  {
    id: "act",
    num: "06",
    key: "ACT",
    url: "models/showcase_v4/aerosense_06_return_v4.glb",
    preview: "models/previews_v4/06_return_v4.png",
    kicker: "06 / ACT",
    heading: "FROM SIGNAL\nTO A REASON\nTO LOOK CLOSER.",
    chain: "",
    text: "Early screening can help prioritize what deserves inspection or confirmation.",
    place: "n",
    pathNames: ["FLIGHT_PATH_06", "STAGE_ANCHOR_06", "RETURN_TARGET_GLOW", "FINAL_ODOR"],
    fallback: [
      [0, 1.15, -4.2],
      [0.1, 1.12, -1.8],
      [0.2, 1.06, -0.1],
      [0.35, 1.02, 1.0]
    ]
  }
];

const STAGE_LIGHTS = [
  { hemiSky: 0xf4ead8, hemiGround: 0x5a4638, key: 0xffe6c4, keyI: 1.08, fill: 0xd4c4a8 },
  { hemiSky: 0xe8eee8, hemiGround: 0x4a5248, key: 0xe8f0e4, keyI: 0.92, fill: 0xc5d0c4 },
  { hemiSky: 0xdce8e4, hemiGround: 0x3a4844, key: 0xd8ece4, keyI: 0.86, fill: 0xb7c8c0 },
  { hemiSky: 0xd8dee8, hemiGround: 0x2c3238, key: 0xd0d8e4, keyI: 0.9, fill: 0xb0b8c4 },
  { hemiSky: 0xc8d0d4, hemiGround: 0x1c2224, key: 0xc4d0cc, keyI: 0.78, fill: 0x9aa4a8 },
  { hemiSky: 0xf0e6d4, hemiGround: 0x4a4034, key: 0xffe2c0, keyI: 1.0, fill: 0xd4c4a8 }
];

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function smoothstep(a, b, x) {
  if (b === a) return x >= b ? 1 : 0;
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function cinematicEase(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  // Zero velocity and acceleration at both ends make a shorter camera move
  // feel settled instead of abruptly accelerating into or out of the shot.
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function odorOffset(u) {
  const a=clamp(u,0,1)*Math.PI*2;
  return {x:1.10*Math.sin(a*3.2)+.32*Math.sin(a*7.1+.4),y:.07*Math.sin(a*3.2)};
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

function debugCorridor() {
  try {
    return new URLSearchParams(window.location.search).get("aerosenseCorridor") === "1";
  } catch (err) {
    return false;
  }
}

function nameOf(obj) {
  return obj && obj.name ? String(obj.name) : "";
}

function matchesName(obj, names) {
  const n = nameOf(obj);
  if (!n) return false;
  for (let i = 0; i < names.length; i++) {
    if (n === names[i] || n.indexOf(names[i]) === 0) return true;
  }
  return false;
}

function findNamed(root, names) {
  let found = null;
  root.traverse(function (obj) {
    if (!found && matchesName(obj, names)) found = obj;
  });
  return found;
}

function collectNamed(root, test) {
  const out = [];
  root.traverse(function (obj) {
    if (test(nameOf(obj), obj)) out.push(obj);
  });
  return out;
}

function worldPos(obj, target) {
  const v = target || new THREE.Vector3();
  if (!obj) return v.set(0, 1.1, 0);
  obj.updateWorldMatrix(true, false);
  obj.getWorldPosition(v);
  return v;
}

function quatAlignModelToRig(modelForward, modelUp) {
  const fwd = modelForward.clone().normalize();
  const upHint = modelUp.clone().normalize();
  const z = fwd.clone().negate();
  const x = new THREE.Vector3().crossVectors(upHint, z);
  if (x.lengthSq() < 1e-8) x.set(1, 0, 0);
  else x.normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  const m = new THREE.Matrix4().makeBasis(x, y, z);
  return new THREE.Quaternion().setFromRotationMatrix(m).invert();
}

function pickWingHinge(modelForward) {
  const ax = Math.abs(modelForward.x);
  const ay = Math.abs(modelForward.y);
  const az = Math.abs(modelForward.z);
  if (az >= ay && az >= ax) return "z";
  if (ay >= ax) return "y";
  return "x";
}

function restWing(wing, hinge) {
  if (!wing) return;
  wing.userData.rest = wing.rotation.clone();
  wing.userData.hinge = hinge;
}

function flapWing(wing, amount) {
  if (!wing || !wing.userData.rest) return;
  const r = wing.userData.rest;
  const h = wing.userData.hinge || "z";
  wing.rotation.set(r.x, r.y, r.z);
  if (h === "x") wing.rotation.x += amount;
  else if (h === "y") wing.rotation.y += amount;
  else wing.rotation.z += amount;
}

function setGroupPose(obj, origin, forward, up, bank) {
  const fwd = forward.clone().normalize();
  if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, 1);
  const worldUp = up.clone().normalize();
  const right = new THREE.Vector3().crossVectors(fwd, worldUp);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  else right.normalize();
  const trueUp = new THREE.Vector3().crossVectors(right, fwd).normalize();
  if (bank) trueUp.applyAxisAngle(fwd, bank);
  right.crossVectors(fwd, trueUp).normalize();
  trueUp.crossVectors(right, fwd).normalize();
  const m = new THREE.Matrix4().makeBasis(right, trueUp, fwd.clone().negate());
  obj.quaternion.setFromRotationMatrix(m);
  obj.position.copy(origin);
}

function ptsFromFallback(arr) {
  return arr.map(function (p) {
    return new THREE.Vector3(p[0], p[1], p[2]);
  });
}

function sampleCurveMesh(obj) {
  const pts = [];
  obj.traverse(function (child) {
    if (!child.isMesh || !child.geometry) return;
    const pos = child.geometry.getAttribute("position");
    if (!pos || pos.count < 2) return;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      child.localToWorld(v);
      pts.push(v.clone());
    }
  });
  if (pts.length < 2) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  pts.forEach(function (p) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  });
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const spanZ = maxZ - minZ;
  const axis = spanZ >= spanX && spanZ >= spanY ? "z" : spanX >= spanY ? "x" : "y";
  const min = axis === "z" ? minZ : axis === "x" ? minX : minY;
  const span = axis === "z" ? spanZ : axis === "x" ? spanX : spanY;
  if (span < 0.08) return null;

  const bins = 12;
  const acc = [];
  for (let i = 0; i < bins; i++) acc.push({ x: 0, y: 0, z: 0, n: 0 });
  pts.forEach(function (p) {
    const along = axis === "z" ? p.z : axis === "x" ? p.x : p.y;
    const t = (along - min) / span;
    const i = Math.max(0, Math.min(bins - 1, Math.floor(t * bins)));
    acc[i].x += p.x;
    acc[i].y += p.y;
    acc[i].z += p.z;
    acc[i].n += 1;
  });
  const out = [];
  acc.forEach(function (b) {
    if (!b.n) return;
    out.push(new THREE.Vector3(b.x / b.n, b.y / b.n, b.z / b.n));
  });
  return out.length >= 2 ? out : null;
}

function extractPath(root, spec) {
  const named = {};
  root.updateWorldMatrix(true, true);
  root.traverse(function (obj) {
    if (obj.name) named[obj.name] = obj;
  });

  const curveName = (spec.pathNames || []).find(function (key) {
    return /^FLIGHT_PATH/.test(key);
  });
  if (curveName) {
    const curve = named[curveName] || findNamed(root, [curveName]);
    if (curve) {
      const sampled = sampleCurveMesh(curve);
      if (sampled && sampled.length >= 2) return sampled;
    }
  }

  const start = findNamed(root, ["PATH_START", "PATH_START_02", "FLIGHT_PATH_START"]);
  const end = findNamed(root, ["PATH_TARGET", "PATH_TARGET_02", "FLIGHT_PATH_END"]);
  if (start && end) return [worldPos(start).clone(), worldPos(end).clone()];
  return ptsFromFallback(spec.fallback);
}

function toLocalPts(group, worldPts) {
  group.updateWorldMatrix(true, true);
  return worldPts.map(function (p) {
    return group.worldToLocal(p.clone());
  });
}

function tagSignalMaterials(root, detected) {
  const tagged = [];
  root.traverse(function (obj) {
    const n = nameOf(obj);
    const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
    mats.forEach(function (mat) {
      if (!mat || mat.userData._asTagged) return;
      const matName = mat.name || "";
      let role = null;
      if (/ODOR_GUIDE|ODOR_ARCH|FINAL_ODOR|ODOR_WISP|DecodeCurve/i.test(n)) role = "guide";
      else if (/VOC_SOURCE|TARGET_EMISSIVE|RETURN_TARGET_GLOW/i.test(n)) role = "source";
      else if (/RECEPTOR_MEMBRANE|OR_ACTIVE|OR_CHANNEL|ReceptorTip/i.test(n)) role = "receptor";
      else if (/GCAMP/i.test(n)) role = "gcamp";
      else if (/TRACE_MAIN|SIGNAL_PATH|^PD$|^TIA$|^ADC$/i.test(n)) role = "trace";
      else if (/KC_ACTIVE/i.test(n) || /NodeActive/i.test(matName)) role = "nodeActive";
      else if (/^Node_/i.test(n)) role = /_2_|_3_/.test(n) ? "nodeActive" : "node";
      if (!role) return;
      if (role === "source" || role === "gcamp") {
        const cloned = mat.clone();
        cloned.userData = Object.assign({}, mat.userData);
        if (Array.isArray(obj.material)) {
          const idx = obj.material.indexOf(mat);
          if (idx >= 0) obj.material[idx] = cloned;
        } else obj.material = cloned;
        mat = cloned;
      }
      mat.userData._asTagged = true;
      mat.userData.role = role;
      mat.transparent = true;
      if (mat.opacity == null) mat.opacity = 1;
      mat.userData.baseOpacity = role === "guide" ? Math.min(mat.opacity, 0.035) : mat.opacity;
      mat.opacity = mat.userData.baseOpacity;
      mat.userData.scanOpacity = role === "guide" ? 0.48 : Math.min(1, mat.userData.baseOpacity + 0.28);
      if(role==='gcamp'){mat.color.setHex(0x91c850);mat.emissive.setHex(0x429a35);mat.emissiveIntensity=.45;}
      mat.userData.baseEmissive = mat.emissiveIntensity || 0;
      mat.userData.scanEmissive =
        role === "source" ? 1.85 : role === "guide" || role === "gcamp" || role === "trace" || role === "nodeActive" ? 1.35 : 0.55;
      if (role === "source") {
        if (mat.emissive && mat.emissive.getHex() === 0) mat.emissive.setHex(0x2a8f58);
        mat.userData.baseEmissive = Math.max(mat.userData.baseEmissive, 0.04);
      }
      if (role === "guide") {
        mat.depthWrite = false;
        if (mat.emissive && mat.emissive.getHex() === 0) mat.emissive.setHex(0x3d8f62);
      }
      tagged.push(mat);
    });
    if (/VOC_SOURCE_A/.test(n)) detected.VOC_SOURCE_A = true;
    if (/VOC_SOURCE_BAG/.test(n)) detected.VOC_SOURCE_BAG = true;
    if (/VOC_SOURCE_ANCHOR/.test(n)) detected.VOC_SOURCE_ANCHOR = true;
    if (/PATH_TARGET/.test(n)) detected.PATH_TARGET = true;
    if (/ODOR_GUIDE_A/.test(n)) detected.ODOR_GUIDE_A = true;
    if (/ODOR_GUIDE_B/.test(n)) detected.ODOR_GUIDE_B = true;
    if (/ODOR_ARCH/.test(n)) detected.ODOR_ARCH = true;
    if (/TRACE_MAIN/.test(n)) detected.TRACE_MAIN = true;
    if (/^PD$/.test(n)) detected.PD = true;
    if (/^TIA$/.test(n)) detected.TIA = true;
    if (/^ADC$/.test(n)) detected.ADC = true;
    if (/^Node_/.test(n)) detected.Node = true;
    if (/NodeActive/.test(matNameOf(obj))) detected.NodeActive = true;
    if (/RETURN_TARGET_GLOW/.test(n)) detected.RETURN_TARGET_GLOW = true;
    if (/FINAL_ODOR/.test(n)) detected.FINAL_ODOR = true;
    if (/FLIGHT_PATH/.test(n)) detected.FLIGHT_PATH = true;
    if (/GCaMP/.test(n)) detected.GCaMP = true;
    if (/ReceptorTip/.test(n)) detected.ReceptorTip = true;
  });
  return tagged;
}

function matNameOf(obj) {
  if (!obj || !obj.material) return "";
  const m = Array.isArray(obj.material) ? obj.material[0] : obj.material;
  return m && m.name ? m.name : "";
}

function hideConstruction(root) {
  root.traverse(function (obj) {
    const n = nameOf(obj);
    if (/^FLIGHT_PATH/.test(n)) obj.visible = false;
    if (/^ODOR_WISP/.test(n)) obj.visible = false;
    if (obj.isCamera) obj.visible = false;
    if (obj.isLight) obj.visible = false;
    if (/Drosophila/i.test(n)) obj.visible = false;
    if (/MembraneRing|DecodeCurve|Node_[01]_/i.test(n)) obj.visible = false;
  });
}

function collectFadeMats(root) {
  const out = [];
  root.traverse(function (obj) {
    if (!obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach(function (m) {
      if (!m || out.indexOf(m) !== -1) return;
      m.transparent = true;
      if (m.userData.fadeBase == null) m.userData.fadeBase = m.opacity == null ? 1 : m.opacity;
      out.push(m);
    });
  });
  return out;
}

function setGroupFade(mats, a) {
  mats.forEach(function (m) {
    const base = m.userData.role === "guide" ? m.userData.baseOpacity : m.userData.fadeBase;
    m.opacity = Math.max(0, (base == null ? 1 : base) * a);
    m.visible = a > 0.02;
  });
}

function applyScanToMats(mats, scan) {
  mats.forEach(function (m) {
    if (!m.userData.role) return;
    const bo = m.userData.baseOpacity;
    const so = m.userData.scanOpacity;
    if (bo != null && so != null) m.opacity = lerp(bo, so, scan) * (m.userData.fadeMul == null ? 1 : m.userData.fadeMul);
    if (m.emissiveIntensity != null) {
      m.emissiveIntensity = lerp(m.userData.baseEmissive || 0, m.userData.scanEmissive || 0, scan);
    }
  });
}

function makeTube(pts, radius, color, opacity) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, Math.max(8, pts.length * 4), radius, 5, false);
  const mat = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.05,
    roughness: 0.9,
    metalness: 0,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  mat.userData.role = "guide";
  mat.userData.baseOpacity = opacity;
  mat.userData.scanOpacity = 0.46;
  mat.userData.baseEmissive = 0.05;
  mat.userData.scanEmissive = 1.2;
  mat.userData._asTagged = true;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "ODOR_GUIDE_FALLBACK";
  mesh.frustumCulled = true;
  return mesh;
}

function makeFallbackWorld(spec, index) {
  const group = new THREE.Group();
  group.name = "fallback_" + spec.id;
  const pathPts = ptsFromFallback(spec.fallback);
  const floorMat = new THREE.MeshStandardMaterial({
    color: index === 4 ? 0x2a2e32 : index === 3 ? 0x1e4a32 : 0xe8dcc8,
    roughness: 0.92
  });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.08, 12), floorMat);
  floor.position.set(0, 0, 0);
  group.add(floor);

  const railMat = new THREE.MeshStandardMaterial({ color: index > 2 ? 0x3a4450 : 0xd8c8ae, roughness: 0.88 });
  [-1, 1].forEach(function (side) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.8, 12), railMat);
    rail.position.set(side * 3.4, 0.9, 0);
    group.add(rail);
  });

  if (index === 0 || index === 5) {
    const sackMat = new THREE.MeshStandardMaterial({
      color: 0x8a6240,
      roughness: 0.92,
      emissive: 0x000000
    });
    sackMat.userData.role = "source";
    sackMat.userData.baseOpacity = 1;
    sackMat.userData.scanOpacity = 1;
    sackMat.userData.baseEmissive = 0.04;
    sackMat.userData.scanEmissive = 1.85;
    sackMat.userData._asTagged = true;
    const end = pathPts[pathPts.length - 1];
    const pallet = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.18, 0.72),
      new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.86 })
    );
    pallet.name = "VOC_PALLET";
    pallet.position.set(end.x, 0.12, end.z);
    group.add(pallet);
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10), sackMat);
    sack.scale.set(1.15, 1.35, 0.95);
    sack.position.set(end.x, 0.55, end.z);
    sack.name = index === 0 ? "VOC_SOURCE_A" : "RETURN_TARGET_GLOW";
    group.add(sack);
    if (index === 0) {
      const anchor = new THREE.Object3D();
      anchor.name = "VOC_SOURCE_ANCHOR";
      anchor.position.set(end.x, 1.05, end.z);
      group.add(anchor);
      const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.86 });
      const bagMat = new THREE.MeshStandardMaterial({ color: 0x8a6240, roughness: 0.92 });
      const strapMat = new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.74 });
      [[-1.35, 2.2], [1.4, 0.6], [-1.2, -0.85], [1.55, -2.0]].forEach(function (p, i) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.62), wood);
        box.name = "ObstacleCrate_" + i;
        box.position.set(p[0], 0.32, p[1]);
        group.add(box);
        const bag = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), bagMat);
        bag.name = "ObstacleBag_" + i;
        bag.scale.set(1, 1.35, 0.85);
        bag.position.set(p[0], 0.78, p[1]);
        group.add(bag);
      });
      [-1, 1].forEach(function (side) {
        for (let k = 0; k < 3; k++) {
          const plank = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 2.4), wood);
          plank.name = "ShelfPlank";
          plank.position.set(side * 2.55, 0.55 + k * 0.7, 0.2);
          group.add(plank);
        }
      });
      [[-1.1, 1.15], [1.15, -0.35], [-0.9, -2.35]].forEach(function (p, i) {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.7, 0.02), strapMat);
        strap.name = "HangingStrap_" + i;
        strap.position.set(p[0], 2.7, p[1]);
        group.add(strap);
      });
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.55, 0.65), wood);
      bin.name = "CoffeeBin";
      bin.position.set(-1.8, 0.32, end.z + 0.35);
      group.add(bin);
    }
  }
  if (index === 1) {
    const gate = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.2, 0.16),
      new THREE.MeshStandardMaterial({
        color: 0xc5d8cc,
        roughness: 0.55,
        transparent: true,
        opacity: 0.42
      })
    );
    gate.name = "RECEPTOR_MEMBRANE";
    const end = pathPts[pathPts.length - 1];
    gate.position.set(0, 1.15, end.z);
    group.add(gate);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x6aa87a,
      emissive: 0x1f8a52,
      emissiveIntensity: 0.08,
      roughness: 0.4,
      transparent: true,
      opacity: 0.35
    });
    tipMat.userData.role = "receptor";
    tipMat.userData.baseOpacity = 0.28;
    tipMat.userData.scanOpacity = 0.85;
    tipMat.userData.baseEmissive = 0.08;
    tipMat.userData.scanEmissive = 1.3;
    tipMat.userData._asTagged = true;
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1;
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), tipMat);
      tip.name = "ReceptorTip_" + i;
      tip.position.set(side * (0.9 + (i % 4) * 0.35), 1.15 + (i % 3) * 0.12, -2 + (i % 4) * 1.1);
      group.add(tip);
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.04, 0.9, 6),
        new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.86 })
      );
      shaft.position.copy(tip.position);
      shaft.position.y -= 0.45;
      group.add(shaft);
    }
  }
  if (index === 2) {
    const cellMat = new THREE.MeshStandardMaterial({ color: 0xc5d8cc, roughness: 0.45, transparent: true, opacity: 0.45 });
    const gMat = new THREE.MeshStandardMaterial({
      color: 0x8affc0,
      emissive: 0x1fd36a,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.4
    });
    gMat.userData.role = "gcamp";
    gMat.userData.baseOpacity = 0.28;
    gMat.userData.scanOpacity = 0.9;
    gMat.userData.baseEmissive = 0.12;
    gMat.userData.scanEmissive = 1.4;
    gMat.userData._asTagged = true;
    for (let i = 0; i < 4; i++) {
      const cell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), cellMat);
      cell.position.set(-1.2 + i * 0.8, 0.7, -0.4 + (i % 2) * 0.5);
      const g = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), gMat);
      g.name = "GCaMP_" + i;
      g.position.copy(cell.position);
      group.add(cell, g);
    }
  }
  if (index === 3) {
    const chip = new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: 0.55 });
    [["PD", -0.35, -2.2], ["TIA", -0.02, -0.4], ["ADC", 0.45, 0.8]].forEach(function (d) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.38), chip);
      m.name = d[0];
      m.position.set(d[1], 0.22, d[2]);
      group.add(m);
    });
    const trace = makeTube(pathPts.map(function (p) { return p.clone().setY(0.22); }), 0.05, 0xb08a4a, 0.12);
    trace.name = "TRACE_MAIN";
    group.add(trace);
  }
  if (index === 4) {
    const nodeMat = new THREE.MeshStandardMaterial({ color: 0x6a736c, roughness: 0.4, emissive: 0x000000 });
    const actMat = new THREE.MeshStandardMaterial({
      color: 0x8affc0,
      emissive: 0x1fd36a,
      emissiveIntensity: 0.2,
      roughness: 0.25
    });
    actMat.userData.role = "nodeActive";
    actMat.userData.baseOpacity = 1;
    actMat.userData.scanOpacity = 1;
    actMat.userData.baseEmissive = 0.2;
    actMat.userData.scanEmissive = 1.5;
    actMat.userData._asTagged = true;
    nodeMat.userData.role = "node";
    nodeMat.userData.baseOpacity = 0.55;
    nodeMat.userData.scanOpacity = 0.25;
    nodeMat.userData.baseEmissive = 0;
    nodeMat.userData.scanEmissive = 0.05;
    nodeMat.userData._asTagged = true;
    for (let i = 0; i < 7; i++) {
      const active = i % 2 === 0;
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), active ? actMat : nodeMat);
      node.name = active && i === 0 ? "KC_ACTIVE" : "Node_2_" + i;
      node.position.set((i - 3) * 0.42, 0.62, -0.6 + (i % 3) * 0.35);
      group.add(node);
    }
  }

  if (index !== 0) {
    const guideA = pathPts.map(function (p, i) {
      return p.clone().add(new THREE.Vector3(0.12 * Math.sin(i), 0.08, 0));
    });
    const guideB = pathPts.map(function (p, i) {
      return p.clone().add(new THREE.Vector3(-0.1 * Math.cos(i), 0.04, 0));
    });
    const g1 = makeTube(guideA, 0.03, 0x4c9a72, 0.03);
    g1.name = "ODOR_GUIDE_A";
    const g2 = makeTube(guideB, 0.022, 0x4c9a72, 0.025);
    g2.name = "ODOR_GUIDE_B";
    group.add(g1, g2);
  }

  return { group: group, pathWorld: pathPts };
}

function makeProceduralFly() {
  const root = new THREE.Group();
  root.name = "Drosophila";
  const chitin = new THREE.MeshStandardMaterial({ color: 0x452c1c, roughness: 0.66, transparent: true, opacity: 1 });
  const thoraxMat = new THREE.MeshStandardMaterial({ color: 0x2e2016, roughness: 0.62, transparent: true, opacity: 1 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x61241f, roughness: 0.28, transparent: true, opacity: 1 });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xe4d8c4,
    roughness: 0.22,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), thoraxMat);
  thorax.scale.set(0.16, 0.14, 0.2);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), chitin);
  head.scale.set(0.12, 0.11, 0.13);
  head.position.set(0, 0.02, -0.28);
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), chitin);
  abdomen.scale.set(0.12, 0.1, 0.22);
  abdomen.position.set(0, 0.01, 0.26);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), eyeMat);
  eyeL.position.set(-0.08, 0.03, -0.3);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.08;
  const body = new THREE.Group();
  body.name = "BODY";
  body.add(thorax, head, abdomen, eyeL, eyeR);
  root.add(body);

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.04, 0.09, 0.18, 0.16, 0.42, 0.05);
  shape.bezierCurveTo(0.5, -0.01, 0.4, -0.13, 0.2, -0.15);
  shape.bezierCurveTo(0.08, -0.1, 0.02, -0.04, 0, 0);
  const wingGeo = new THREE.ShapeGeometry(shape, 8);
  wingGeo.rotateX(-Math.PI / 2);
  const wingLeft = new THREE.Group();
  wingLeft.name = "WING_LEFT";
  wingLeft.position.set(-0.1, 0.08, 0);
  const wL = new THREE.Mesh(wingGeo, wingMat);
  wL.scale.x = -1;
  wingLeft.add(wL);
  const wingRight = new THREE.Group();
  wingRight.name = "WING_RIGHT";
  wingRight.position.set(0.1, 0.08, 0);
  wingRight.add(new THREE.Mesh(wingGeo, wingMat));
  root.add(wingLeft, wingRight);
  const anchor = new THREE.Object3D();
  anchor.name = "TARGET_ANCHOR";
  anchor.position.set(0, 0.04, -0.4);
  root.add(anchor);
  const fwd = new THREE.Object3D();
  fwd.name = "FLY_FORWARD";
  fwd.position.set(0, 0.02, -0.75);
  root.add(fwd);
  const camAnchor = new THREE.Object3D();
  camAnchor.name = "FLY_CAMERA_ANCHOR";
  camAnchor.position.set(0, 0.55, 0.95);
  root.add(camAnchor);
  return root;
}

function makeSignalOrb() {
  const group = new THREE.Group();
  group.name = "signalOrb";
  const mat = new THREE.MeshStandardMaterial({
    color: 0xc8e8d0,
    emissive: 0x2f9a62,
    emissiveIntensity: 0.55,
    roughness: 0.32,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), mat);
  // A deliberately abstract molecular token; no chemical identity is implied.
  for (const [x,y,z] of [[-.15,.06,0],[.12,.12,.035],[.05,-.13,-.03]]) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.055,16,10),mat);
    bead.position.set(x,y,z);group.add(bead);
    const v = bead.position.clone();
    const bond = new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,v.length(),8),mat);
    bond.position.copy(v).multiplyScalar(.5);bond.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());group.add(bond);
  }
  const haloMat = mat.clone();
  haloMat.emissiveIntensity = 0.28;
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), haloMat);
  group.add(core, halo);
  const streaks = [];
  const streakMat = new THREE.MeshStandardMaterial({
    color: 0x8affc0,
    emissive: 0x1fd36a,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.22, 4, 6), streakMat);
    s.position.set((i - 1) * 0.04, -0.02, 0.16 + i * 0.05);
    group.add(s);
    streaks.push(s);
  }
  group.visible = false;
  return { mesh: group, mat: mat, haloMat: haloMat, streakMat: streakMat, streaks: streaks };
}

function packFly(root) {
  const detected = {
    Drosophila: false,
    BODY: false,
    WING_LEFT: false,
    WING_RIGHT: false,
    FLY_FORWARD: false,
    FLY_CAMERA_ANCHOR: false,
    TARGET_ANCHOR: false,
    wingHinge: null
  };
  const dros = findNamed(root, ["Drosophila"]) || root;
  detected.Drosophila = !!findNamed(root, ["Drosophila"]);
  const body = findNamed(root, ["BODY"]);
  const wingL = findNamed(root, ["WING_LEFT"]);
  const wingR = findNamed(root, ["WING_RIGHT"]);
  const fwdNode = findNamed(root, ["FLY_FORWARD"]);
  const camNode = findNamed(root, ["FLY_CAMERA_ANCHOR"]);
  const anchor = findNamed(root, ["TARGET_ANCHOR"]);
  detected.BODY = !!body;
  detected.WING_LEFT = !!wingL;
  detected.WING_RIGHT = !!wingR;
  detected.FLY_FORWARD = !!fwdNode;
  detected.FLY_CAMERA_ANCHOR = !!camNode;
  detected.TARGET_ANCHOR = !!anchor;

  dros.updateWorldMatrix(true, true);
  const origin = worldPos(dros, new THREE.Vector3());
  const modelForward = new THREE.Vector3();
  if (fwdNode) {
    worldPos(fwdNode, modelForward).sub(origin);
    if (modelForward.lengthSq() < 1e-8) modelForward.set(0, -1, 0);
  } else {
    modelForward.set(0, -1, 0);
  }
  const modelCam = new THREE.Vector3();
  if (camNode) {
    worldPos(camNode, modelCam).sub(origin);
  } else {
    modelCam.copy(modelForward).multiplyScalar(-0.95).add(new THREE.Vector3(0, 0.55, 0));
  }
  const fwdN = modelForward.clone().normalize();
  const modelUp = modelCam.clone().addScaledVector(fwdN, -modelCam.dot(fwdN));
  if (modelUp.lengthSq() < 1e-8) modelUp.set(0, 1, 0);
  else modelUp.normalize();
  if (modelUp.y < 0) modelUp.negate();

  const hinge = pickWingHinge(modelForward);
  detected.wingHinge = hinge;
  restWing(wingL, hinge);
  restWing(wingR, hinge);

  const fadeMats = collectFadeMats(dros);
  dros.traverse(function (obj) {
    if (!/WING|Wing_/i.test(nameOf(obj)) || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach(function (m) {
      if (m) m.userData.wing = true;
    });
  });
  fadeMats.forEach(function (m) {
    if ((m.opacity != null && m.opacity < 0.9) || (m.transparent && m.opacity < 1)) m.userData.wing = true;
  });

  dros.quaternion.copy(quatAlignModelToRig(modelForward, modelUp));
  dros.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(dros);
  const size = box.getSize(new THREE.Vector3());
  const nativeWidth = Math.max(size.x, 0.001);
  dros.position.sub(box.getCenter(new THREE.Vector3()));

  const wrap = new THREE.Group();
  wrap.name = "flyWrap";
  wrap.add(dros);
  const chaseLocal = modelCam.clone().applyQuaternion(dros.quaternion);
  if (chaseLocal.z < 0) chaseLocal.z = Math.abs(chaseLocal.z);
  if (chaseLocal.y < 0.05) chaseLocal.y = 0.55;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 20),
    new THREE.MeshBasicMaterial({ color: 0x1a120e, transparent: true, opacity: 0.28, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.12;
  shadow.name = "flyShadow";
  wrap.add(shadow);
  return {
    root: wrap,
    visual: dros,
    body: body || dros,
    wingLeft: wingL,
    wingRight: wingR,
    anchor: anchor,
    fadeMats: fadeMats,
    detected: detected,
    nativeWidth: nativeWidth,
    chaseLocal: chaseLocal,
    modelForward: fwdN,
    modelUp: modelUp
  };
}

const loader = new GLTFLoader();

function loadGltf(url) {
  return new Promise(function (resolve, reject) {
    loader.load(
      url,
      function (gltf) {
        resolve(gltf);
      },
      undefined,
      function (err) {
        reject(err);
      }
    );
  });
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
    calloutKicker: qs("[data-callout-kicker]", root),
    calloutLabel: qs("[data-callout-label]", root),
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
    progress: qs("[data-flight-progress]", root),
    load: qs("[data-flight-load]", root),
    loadText: qs("[data-load-text]", root),
    checkpoint: qs("[data-flight-checkpoint]", root),
    checkpointText: qs("[data-checkpoint-text]", root),
    checkpointBtn: qs("[data-checkpoint-continue]", root),
    preview: qs("[data-flight-preview]", root),
    previewImg: qs("[data-preview-img]", root),
    staticNav: qs("[data-static-nav]", root),
    staticPrev: qs("[data-static-prev]", root),
    staticNext: qs("[data-static-next]", root),
    scanStatus: qs("[data-scan-status]", root),
    scanDot: qs("[data-scan-dot]", root),
    score: qs("[data-flight-score]", root),
    scoreMode: qs("[data-score-mode]", root),
    autoState: qs("[data-auto-state]", root),
    scoreTick: qs("[data-score-tick]", root),
    finaleScore: qs("[data-finale-score]", root)
  };

  const waypointTexts = [
    {title:'The odor source',text:'You reached the food headspace. The fly can follow a changing odor plume before a change is visible.'},
    {title:'The fly antenna',text:'The fly stays here. Continue as an odor cue approaching the receptor; the next scene is an engineered cell, not the fly’s body.'},
    {title:'The engineered cell',text:'OR and Orco form the proposed recognition path. GCaMP6f is the intended green Ca²⁺ reporter; functional validation is a separate question.'},
    {title:'The optical reader',text:'Fluorescence must pass through the photodiode and electronics before it becomes a digital measurement.'},
    {title:'The pattern decoder',text:'A distributed response can inform screening, with follow-up testing needed before any safety decision.'}
  ].map((waypoint, index) => ({...waypoint, at: STAGE_SECONDS * (index + WAYPOINT_PHASE)}));
  const quest=document.createElement('div');quest.className='flight__quest';quest.hidden=true;
  quest.innerHTML='<p class="flight__quest-kicker">Signal waypoint reached</p><h4></h4><p class="flight__quest-copy"></p><button type="button">Continue the journey →</button>';
  const questMap=document.createElement('div');questMap.className='flight__quest-map';questMap.setAttribute('aria-label','Journey waypoint progress');
  questMap.innerHTML=waypointTexts.map(()=>'<span aria-hidden="true"></span>').join('');
  const questLabel=document.createElement('p');questLabel.className='flight__quest-label';questLabel.textContent='FOLLOW THE LUMINOUS TRAIL · NEXT: ODOR SOURCE';
  els.flightRoot.append(questMap,questLabel,quest);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile =
    window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 720px)").matches;
  if (els.journey) els.journey.classList.toggle("is-reduced", reduceMotion);
  if (els.start && reduceMotion) els.start.textContent = "View journey";

  const webgl = hasWebGL();
  if (!webgl && !reduceMotion) {
    if (els.unavailable) els.unavailable.hidden = false;
    if (els.start) els.start.hidden = true;
  }

  const detected = { fly: {}, stages: {} };
  const loaded = {};
  const failed = {};
  const packs = new Array(STAGES.length);
  const prefetch = {};

  const state = {
    open: false,
    running: false,
    raf: 0,
    last: 0,
    time: 0,
    stage: 0,
    stageU: 0,
    offset: 0,
    vx: 0,
    holdY: 0,
    odorX: 0,
    odorY: 0,
    autoAim: 0,
    bank: 0,
    camRoll: 0,
    morph: 0,
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
    built: false,
    opening: false,
    staticMode: false,
    cardShown: -1,
    cardUntil: 0,
    cardHoldT: 0,
    cardDriftT: 0,
    cardHideT: 0,
    hintTimer: 0,
    checkpointOpen: false,
    questIndex: 0,
    questHold: false,
    questApproach: false,
    cinematic: null,
    travelFloor: 0,
    completed: false,
    waitLoad: false,
    auto: false,
    forwardInput: 0,
    score: 0,
    onTrail: true,
    bonusHits: {},
    tickT: 0,
    speedMul: 1,
    dive: 0,
    flyDivePitch: 0,
    camDivePitch: 0,
    camDiveY: 0
  };
  quest.querySelector('button').addEventListener('click',function(){
    if(!state.questHold)return;
    const reached = state.questIndex;
    state.questHold=false;state.questIndex++;
    state.questApproach=false;questLabel.classList.remove('is-approach');
    state.time=Math.min(totalDuration(),state.time+.06);
    quest.hidden=true;
    questLabel.textContent=state.questIndex<waypointTexts.length?'NEXT SIGNAL · '+waypointTexts[state.questIndex].title.toUpperCase():'RETURN TO THE BIG PICTURE';
    if (reached === 0) beginCinematic('handoff');
    else if (reached === 1) beginCinematic('entry');
    if(els.world)els.world.focus({preventScroll:true});
  });

  let renderer = null;
  let scene = null;
  let camera = null;
  let hemi = null;
  let keyLight = null;
  let fill = null;
  let rim = null;
  let fly = null;
  let orb = null;
  let giantFly = null;
  let facingFlyPose = null;
  let path = null;
  let pathLen = 1;
  let course = null;
  let obstacles = [];
  let checkpoints = [];
  let vocSourceObj = null;
  let diveNow = {
    active: false,
    from: 0,
    to: 0,
    pre: 0,
    dive: 0,
    recover: 0,
    blend: 1,
    speed: 1,
    pitchN: 0,
    dropN: 0,
    outSweep: 0,
    inRise: 0,
    link: null
  };
  const camPos = new THREE.Vector3(0, 2.2, -6);
  const camLook = new THREE.Vector3();
  const camQuat = new THREE.Quaternion();
  const camFwd = new THREE.Vector3(0, 0, 1);
  const flyFwd = new THREE.Vector3(0, 0, 1);
  const _pos = new THREE.Vector3();
  const _flyHoldPos = new THREE.Vector3();
  const _tan = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _up = new THREE.Vector3(0, 1, 0);
  const _look = new THREE.Vector3();
  const _ndc = new THREE.Vector3();
  const _coursePos = new THREE.Vector3();
  const _col = new THREE.Color();
  const _sky = new THREE.Color();
  const _gnd = new THREE.Color();
  const _flat = new THREE.Vector3();
  const _diveFwd = new THREE.Vector3(0, 0, 1);
  const _diveAxis = new THREE.Vector3(1, 0, 0);
  const _desiredQuat = new THREE.Quaternion();
  const _camMat = new THREE.Matrix4();
  const _camUp = new THREE.Vector3(0, 1, 0);
  const _railPos = new THREE.Vector3();
  const _odorTan = new THREE.Vector3();
  const _odorRight = new THREE.Vector3();
  const _cinemaPos = new THREE.Vector3();
  const _cinemaLook = new THREE.Vector3();
  const _cinemaOffset = new THREE.Vector3();
  const _orbOffset = new THREE.Vector3();
  let camReady = false;
  let viewW = 0;
  let viewH = 0;

  function beginCinematic(kind) {
    if (state.completed || state.cinematic || !camera || !fly) return;
    if (kind === 'handoff') {
      facingFlyPose = {
        position: fly.root.position.clone(),
        forward: flyFwd.clone().normalize(),
        quaternion: fly.root.quaternion.clone()
      };
    }
    state.cinematic = {
      kind, elapsed: 0, duration: kind === 'handoff' ? HANDOFF_SECONDS : ENTRY_SECONDS,
      start: state.time, end: STAGE_SECONDS * (kind === 'handoff' ? 1.32 : 2.12),
      position: camera.position.clone(), quaternion: camera.quaternion.clone()
    };
    state.forwardInput = 0;
    state.keyInput = 0;
    state.pointerInput = 0;
    state.vx = 0;
    els.flightRoot.dataset.flightMode = kind;
    questLabel.textContent = kind === 'handoff'
      ? 'PERSPECTIVE SHIFT · FOLLOW ONE ODOR MOLECULE'
      : 'ENTERING THE ANTENNA · NEXT: ENGINEERED CELL';
    hideCard();
    announce(kind === 'handoff' ? 'The fly pauses. The camera turns to follow an odor molecule. Movement resumes after the transition.' : 'Follow the molecule toward the antenna. The next scene connects this idea to the engineered cell.');
  }

  function finishJourney() {
    if (state.completed) return;
    state.completed = true;
    state.forwardInput = 0;
    state.keyInput = 0;
    state.pointerInput = 0;
    state.vx = 0;
    state.cinematic = null;
    els.flightRoot.dataset.flightMode = 'complete';
    questLabel.textContent = 'JOURNEY COMPLETE · YOUR SCORE IS SAVED';
    hideCard();
    announce('Journey complete. Your final score is ' + padScore(state.score) + '.');
  }

  window.__aerosenseJourney = { detected: detected, loaded: loaded, failed: failed };

  function setLoading(on, label) {
    if (!els.load) return;
    els.load.hidden = !on;
    if (els.loadText && label) els.loadText.textContent = label;
  }

  function announce(text) {
    if (els.live) els.live.textContent = text;
  }

  function setProgressUi(index) {
    if (els.stage) els.stage.textContent = STAGES[index].num + " / " + STAGES[index].key;
    let entity = els.dialog && els.dialog.querySelector('.flight__entity');
    if (!entity && els.dialog) {
      entity = document.createElement('span'); entity.className = 'flight__entity';
      els.dialog.appendChild(entity);
    }
    if (entity) entity.textContent = index === 0 ? 'YOU ARE THE FLY · FOLLOW THE ODOR' : index < 3 ? 'FOLLOW THE ODOR · MOLECULAR VIEW' : 'FOLLOW THE SIGNAL · SENSOR TO DECISION';
    if (els.progress) {
      qsa("[data-progress-step]", els.progress).forEach(function (li) {
        const i = Number(li.getAttribute("data-progress-step"));
        li.classList.toggle("is-on", i === index);
        li.classList.toggle("is-done", i < index);
      });
    }
    if (els.journey) els.journey.setAttribute("data-stage", String(index + 1));
  }

  function setAuto(on) {
    const next = !!on;
    if (next && !state.auto) state.autoAim = state.offset;
    state.auto = next;
    qsa('.flight__hint--desk', els.dialog || root).forEach(el => {
      el.textContent = 'W / ↑ forward · S / ↓ back · A D / ← → steer · fly into the glow';
    });
    if (els.autoBtn) {
      els.autoBtn.textContent = state.auto ? "Auto pilot on" : "Auto pilot off";
      els.autoBtn.setAttribute("aria-pressed", state.auto ? "true" : "false");
      els.autoBtn.setAttribute("aria-label", "Auto pilot");
    }
    updateScoreUi();
  }

  function takeManual() {
    if (state.auto) setAuto(false);
  }

  function padScore(n) {
    const s = String(Math.max(0, Math.floor(n)));
    return s.length >= 6 ? s : ("000000" + s).slice(-6);
  }

  function trackingRate(dist) {
    if (dist < SCORE_INNER) return lerp(30, 20, dist / SCORE_INNER);
    if (dist < SCORE_MID) return lerp(12, 8, (dist - SCORE_INNER) / (SCORE_MID - SCORE_INNER));
    return 0;
  }

  function showScoreTick(text) {
    if (!els.scoreTick) return;
    els.scoreTick.textContent = text;
    els.scoreTick.hidden = false;
    els.scoreTick.classList.remove("is-in");
    void els.scoreTick.offsetWidth;
    els.scoreTick.classList.add("is-in");
    window.clearTimeout(state.tickT);
    state.tickT = window.setTimeout(function () {
      if (!els.scoreTick) return;
      els.scoreTick.hidden = true;
      els.scoreTick.classList.remove("is-in");
    }, 860);
    if (els.score) {
      els.score.classList.remove("is-pop");
      void els.score.offsetWidth;
      els.score.classList.add("is-pop");
    }
  }

  function updateScoreUi() {
    if (els.score) {
      els.score.textContent = padScore(state.score);
      els.score.classList.toggle("is-on", !state.auto && state.onTrail);
      els.score.classList.toggle("is-off", state.auto || !state.onTrail);
    }
    if (els.scoreMode) els.scoreMode.hidden = false;
    if (els.autoState) els.autoState.textContent = state.completed ? "COMPLETE" : state.cinematic ? "STORY" : state.forwardInput ? "MOVING" : "READY";
    if (els.finaleScore && state.stage === 5 && state.stageU > 0.78) {
      els.finaleScore.textContent = "GAME SCORE · " + padScore(state.score);
    }
  }

  function setStoryLines(el, text) {
    if (!el) return;
    el.textContent = "";
    String(text || "")
      .split("\n")
      .forEach(function (line, i) {
        if (i) el.appendChild(document.createElement("br"));
        el.appendChild(document.createTextNode(line));
      });
  }

  function cardPlace(index) {
    if (window.matchMedia("(max-width: 899px)").matches) return "n";
    return CARD_PLACE[index] || "n";
  }

  function showCard(index) {
    const s = STAGES[index];
    if (els.cardKicker) els.cardKicker.textContent = s.kicker;
    setStoryLines(els.cardHeading, s.heading);
    if (els.cardText) {
      els.cardText.textContent = s.text || "";
      els.cardText.hidden = !s.text;
    }
    if (els.cardChain) {
      els.cardChain.textContent = s.chain || "";
      els.cardChain.hidden = !s.chain;
    }
    if (els.pin) els.pin.hidden = true;
    if (els.card) {
      els.card.hidden = false;
      els.card.classList.remove("is-in", "is-hold", "is-drift", "flight__card--nw", "flight__card--ne", "flight__card--n");
      els.card.classList.add("flight__card--" + cardPlace(index));
      void els.card.offsetWidth;
      els.card.classList.add("is-in");
    }
    if (els.flightRoot) els.flightRoot.classList.add("has-card");
    state.cardShown = index;
    window.clearTimeout(state.cardHoldT);
    window.clearTimeout(state.cardDriftT);
    window.clearTimeout(state.cardHideT);
    state.cardHoldT = window.setTimeout(function () {
      if (!els.card || state.cardShown !== index) return;
      els.card.classList.remove("is-in");
      els.card.classList.add("is-hold");
    }, CARD_ENTER_MS);
    // Captions stay readable while paused and until the next scene's dive.
    announce((s.heading || "").replace(/\n/g, " ") + " " + (s.text || s.chain || ""));
  }

  function hideCard() {
    window.clearTimeout(state.cardHoldT);
    window.clearTimeout(state.cardDriftT);
    window.clearTimeout(state.cardHideT);
    if (els.card) {
      els.card.hidden = true;
      els.card.classList.remove("is-in", "is-hold", "is-drift");
    }
    if (els.flightRoot) els.flightRoot.classList.remove("has-card");
    if (els.pin) els.pin.hidden = true;
  }

  function disposeObject(obj) {
    if (!obj) return;
    obj.traverse(function (child) {
      if (child.geometry) child.geometry.dispose();
      const mats = child.material ? (Array.isArray(child.material) ? child.material : [child.material]) : [];
      mats.forEach(function (m) {
        if (!m) return;
        if (m.map) m.map.dispose();
        m.dispose();
      });
    });
  }

  function disposeCourse() {
    if (!course) return;
    scene.remove(course.group);
    disposeObject(course.group);
    course = null;
  }

  function makeGateLabel(text) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = "rgba(12, 16, 14, 0.42)";
    ctx.fillRect(18, 10, 220, 44);
    ctx.fillStyle = "#d9ffe8";
    ctx.font = "700 28px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    spr.scale.set(1.05, 0.26, 1);
    return spr;
  }

  function dressCourse() {
    disposeCourse();
    if (!path || !scene) return;
    const group = new THREE.Group();
    group.name = "odorCourse";

    const n = ODOR_RIBBON_SEGS;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 2 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const index = [];
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setIndex(index);
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0x6ee8a8,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const trail = new THREE.Mesh(geo, trailMat);
    trail.name = "odorTrail";
    trail.frustumCulled = false;
    group.add(trail);

    const puffGeo = new THREE.SphereGeometry(0.075, 10, 8);
    const puffMat = new THREE.MeshBasicMaterial({
      color: 0x9affc8,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });
    const puffs = [];
    for (let i = 0; i < 20; i++) {
      const puff = new THREE.Mesh(puffGeo, puffMat);
      puff.name = "odorPuff_" + i;
      group.add(puff);
      puffs.push({ mesh: puff, u: (i + 0.4) / 20, phase: i * 0.73 });
    }
    const beacons = waypointTexts.map((waypoint, i) => {
      const marker = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.58,.055,10,48),new THREE.MeshBasicMaterial({color:0xbaffb3,transparent:true,opacity:.92,depthWrite:false}));
      ring.rotation.x=Math.PI/2;
      const core = new THREE.Mesh(new THREE.SphereGeometry(.18,16,12),new THREE.MeshBasicMaterial({color:0xd8ff9b,transparent:true,opacity:.95,depthWrite:false}));
      const halo = new THREE.Mesh(new THREE.SphereGeometry(.43,16,12),new THREE.MeshBasicMaterial({color:0x5bff95,transparent:true,opacity:.17,depthWrite:false}));
      marker.add(ring,core,halo);
      odorWorldAt(waypoint.at/totalDuration(),0,marker.position,_odorTan,_odorRight);
      marker.userData={ring,halo,index:i};
      group.add(marker);
      return marker;
    });
    scene.add(group);
    course = {
      group: group,
      trail: trail,
      trailMat: trailMat,
      trailPos: pos,
      trailGeo: geo,
      trailSegs: n,
      puffs: puffs,
      puffMat: puffMat,
      beacons: beacons
    };
    updateOdorVisual(state.time || 0);
  }

  function odorWorldAt(u, t, target, tanOut, rightOut) {
    const uu = clamp(u, 0, 0.999);
    path.getPointAt(uu, target);
    path.getTangentAt(uu, tanOut).normalize();
    rightOut.crossVectors(tanOut, _up);
    if (rightOut.lengthSq() < 1e-6) rightOut.set(1, 0, 0);
    else rightOut.normalize();
    const o = liveOdor(uu, t);
    target.addScaledVector(rightOut, o.x);
    target.y += o.y;
    return o;
  }

  function hitsStoryRect(world) {
    if (!els.card || els.card.hidden || !camera || !els.world) return false;
    const r = els.card.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    _ndc.copy(world).project(camera);
    const b = els.world.getBoundingClientRect();
    const sx = (_ndc.x * 0.5 + 0.5) * b.width + b.left;
    const sy = (-_ndc.y * 0.5 + 0.5) * b.height + b.top;
    const pad = 40;
    return sx > r.left - pad && sx < r.right + pad && sy > r.top - pad && sy < r.bottom + pad;
  }

  function updateOdorVisual(t) {
    if(!course||!path)return;
    if(!course.fixed){
      const left=[],right=[],center=[];
      for(let i=0;i<course.trailSegs;i++){
        const u=i/(course.trailSegs-1);odorWorldAt(u,0,_coursePos,_odorTan,_odorRight);
        const p=_coursePos.clone();center.push(p);
        left.push(p.clone().addScaledVector(_odorRight,-.38));right.push(p.clone().addScaledVector(_odorRight,.38));
        const a=i*6;course.trailPos.set([left[i].x,left[i].y-.04,left[i].z,right[i].x,right[i].y-.04,right[i].z],a);
      }
      course.trailGeo.attributes.position.needsUpdate=true;course.trailGeo.computeBoundingSphere();
      for(const points of [left,right]){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x90ebba,transparent:true,opacity:.7}));course.group.add(line);}
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(center),new THREE.LineDashedMaterial({color:0xf0e9a3,dashSize:.24,gapSize:.24,transparent:true,opacity:.9}));line.computeLineDistances();course.group.add(line);
      course.fixed=true;
    }
    course.puffs.forEach(puff=>{
      // Light packets travel along the fixed track; the geometry never follows the player.
      odorWorldAt((puff.u+t*.004)%1,0,_coursePos,_odorTan,_odorRight);
      puff.mesh.position.copy(_coursePos);puff.mesh.position.y+=.045;puff.mesh.scale.setScalar(.6);
    });
    course.beacons.forEach((marker,i)=>{
      marker.visible=i===state.questIndex;
      if(!marker.visible)return;
      marker.userData.ring.scale.setScalar(1+.13*Math.sin(t*4));
      marker.userData.halo.scale.setScalar(1+.23*Math.sin(t*3.4));
    });
  }

  function rebuildPath() {
    const stored = packs.map(function (pack) {
      if (!pack || !pack.group) return null;
      const item = { pack: pack, p: pack.group.position.clone(), s: pack.group.scale.clone() };
      if (pack.basePos) pack.group.position.copy(pack.basePos);
      if (pack.baseScale) pack.group.scale.copy(pack.baseScale);
      pack.group.updateWorldMatrix(true, true);
      return item;
    });
    const pts = [];
    // The full route is defined before the lazy-loaded models arrive. Building
    // it from only the loaded scenes changed every beacon's position mid-flight.
    // Keep scene art at its native scale and insert space between destinations.
    STAGES.forEach(function (spec, i) {
      const local = spec.fallback;
      const start = local[0];
      const end = local[local.length - 1];
      const chapterZ = i * STAGE_DISTANCE;
      const waypointZ = chapterZ + WAYPOINT_PHASE * STAGE_DISTANCE;
      const nativeSpan = Math.max(0.8, end[2] - start[2]);
      if (i === 0) pts.push(new THREE.Vector3(0, start[1], chapterZ));
      pts.push(new THREE.Vector3(0, start[1], waypointZ - nativeSpan));
      pts.push(new THREE.Vector3(0, lerp(start[1], end[1], 0.5), waypointZ - nativeSpan * 0.5));
      pts.push(new THREE.Vector3(0, end[1], waypointZ));
      const nextY = STAGES[i + 1]?.fallback[0][1] ?? end[1];
      pts.push(new THREE.Vector3(0, lerp(end[1], nextY, 0.5), chapterZ + STAGE_DISTANCE));
    });
    const raw = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.12);
    const even = [];
    const n = 48;
    for (let i = 0; i <= n; i++) {
      raw.getPoint(i / n, _pos);
      even.push(new THREE.Vector3(0, _pos.y, _pos.z));
    }
    path = new THREE.CatmullRomCurve3(even, false, "centripetal", 0.12);
    pathLen = Math.max(path.getLength(), 0.001);
    gatherHazards();
    dressCourse();
    stored.forEach(function (item) {
      if (!item) return;
      item.pack.group.position.copy(item.p);
      item.pack.group.scale.copy(item.s);
      item.pack.group.updateWorldMatrix(true, true);
    });
  }

  function liveOdor(u, t) {
    const o = odorOffset(u, t);
    let x = o.x;
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      const du = u - obs.u;
      const g = Math.exp(-(du * du) / 0.016);
      const side = obs.lat >= 0 ? -1 : 1;
      x += side * 0.62 * g;
    }
    return { x: clamp(x, -1.95, 1.95), y: o.y };
  }

  function nearestRailU(world) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i <= 48; i++) {
      const u = i / 48;
      path.getPointAt(Math.min(u, 0.999), _pos);
      const d = _pos.distanceToSquared(world);
      if (d < bestD) {
        bestD = d;
        best = u;
      }
    }
    return best;
  }

  function gatherHazards() {
    obstacles = [];
    checkpoints = [];
    vocSourceObj = null;
    if (!path) return;
    packs.forEach(function (pack, index) {
      if (!pack || !pack.group) return;
      pack.group.updateWorldMatrix(true, true);
      pack.group.traverse(function (obj) {
        const n = nameOf(obj);
        if (!/^(ObstacleCrate|ObstacleBag|HangingStrap)/.test(n) && n !== "CoffeeBin") return;
        if (obj.isMesh === false && !obj.isObject3D) return;
        const p = worldPos(obj);
        const u = nearestRailU(p);
        path.getPointAt(clamp(u, 0, 0.999), _pos);
        path.getTangentAt(clamp(u, 0, 0.999), _tan).normalize();
        _right.crossVectors(_tan, _up);
        if (_right.lengthSq() < 1e-6) _right.set(1, 0, 0);
        else _right.normalize();
        const lat = (p.x - _pos.x) * _right.x + (p.z - _pos.z) * _right.z;
        obstacles.push({
          x: p.x,
          y: p.y,
          z: p.z,
          r: /Strap/.test(n) ? 0.3 : 0.74,
          h: 1.15,
          u: u,
          lat: lat
        });
      });
      if (index === 0) vocSourceObj = findNamed(pack.group, ["VOC_SOURCE_ANCHOR", "VOC_SOURCE_A"]);
      CHECKPOINTS.forEach(function (spec) {
        if (spec.stage !== index) return;
        const objs = collectNamed(pack.group, function (n, obj) {
          return matchesName(obj, spec.names);
        });
        if (!objs.length) return;
        checkpoints.push({ id: spec.id, stage: spec.stage, objs: objs, bonus: spec.bonus, label: spec.label });
      });
    });
  }

  function attachSourceHalo(pack) {
    if (!pack || pack.sourceHalo) return;
    const src = findNamed(pack.group, ["VOC_SOURCE_ANCHOR", "VOC_SOURCE_A", "RETURN_TARGET_GLOW"]);
    if (!src) return;
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc8e8d0,
      emissive: 0x2f9a62,
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0.04,
      depthWrite: false
    });
    mat.userData.role = "source";
    mat.userData.baseOpacity = 0.04;
    mat.userData.scanOpacity = 0.42;
    mat.userData.baseEmissive = 0.08;
    mat.userData.scanEmissive = 1.7;
    mat.userData._asTagged = true;
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), mat);
    halo.name = "SOURCE_HALO";
    const p = worldPos(src);
    pack.group.worldToLocal(p);
    halo.position.copy(p);
    halo.position.y += 0.12;
    pack.group.add(halo);
    pack.sourceHalo = halo;
    if (!pack.signalMats) pack.signalMats = [];
    pack.signalMats.push(mat);
    pack.fadeMats = collectFadeMats(pack.group);
  }

  function dressWarehouse(pack) {
    if (!pack || pack.dressedProps) return;
    pack.dressedProps = true;
    const g = pack.group;
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.86 });
    const sackMat = new THREE.MeshStandardMaterial({ color: 0x8a6240, roughness: 0.92 });
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.74 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x7a736c, roughness: 0.48, metalness: 0.28 });

    [[-1.18, 1.25], [1.22, -0.38], [-0.98, -2.35], [1.08, 3.05]].forEach(function (p, i) {
      if (findNamed(g, ["HangingStrap_" + i])) return;
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.65, 0.02), strapMat);
      strap.name = "HangingStrap_" + i;
      strap.position.set(p[0], 2.82, p[1]);
      g.add(strap);
    });

    if (!findNamed(g, ["ObstacleCrate_0"])) {
      [[-1.35, 2.2], [1.4, 0.6], [-1.2, -0.85], [1.55, -2.0]].forEach(function (p, i) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.62), wood);
        box.name = "ObstacleCrate_" + i;
        box.position.set(p[0], 0.32, p[1]);
        g.add(box);
        const bag = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), sackMat);
        bag.name = "ObstacleBag_" + i;
        bag.scale.set(1, 1.35, 0.85);
        bag.position.set(p[0], 0.78, p[1]);
        g.add(bag);
      });
    }

    if (!findNamed(g, ["ShelfPlank"])) {
      [-1, 1].forEach(function (side) {
        const upright = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 0.06), steel);
        upright.name = "ShelfUpright";
        upright.position.set(side * 2.55, 1.2, 0.2);
        g.add(upright);
        for (let k = 0; k < 3; k++) {
          const plank = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 2.4), wood);
          plank.name = "ShelfPlank";
          plank.position.set(side * 2.55, 0.55 + k * 0.7, 0.2);
          g.add(plank);
          const sack = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), sackMat);
          sack.name = "CoffeeSack";
          sack.scale.set(1.1, 0.85, 0.9);
          sack.position.set(side * 2.55, 0.82 + k * 0.7, -0.35 + (k % 2) * 0.7);
          g.add(sack);
        }
      });
    }

    if (!findNamed(g, ["CoffeeBin"])) {
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.55, 0.65), wood);
      bin.name = "CoffeeBin";
      bin.position.set(-1.8, 0.32, -3.6);
      g.add(bin);
    }

    pack.fadeMats = collectFadeMats(g);
  }

  function placePack(pack, index) {
    const local = pack.pathLocal;
    const start = local[0];
    const end = local[local.length - 1];
    const reference = STAGES[index].fallback;
    const referenceEnd = reference[reference.length - 1];
    const waypointZ = (index + WAYPOINT_PHASE) * STAGE_DISTANCE;
    // Align the exhibit with its beacon without stretching cells or electronics.
    pack.group.position.set(-start.x, referenceEnd[1] - end.y, waypointZ - end.z);
    pack.basePos = pack.group.position.clone();
    pack.baseScale = pack.group.scale.clone();
    scene.add(pack.group);
    if (index === 0) dressWarehouse(pack);
    if (index === 0 || index === 5) attachSourceHalo(pack);
    pack.fadeMats = collectFadeMats(pack.group);
  }

  function prepareGltfStage(spec, index, gltf) {
    const group = new THREE.Group();
    group.name = "stage_" + spec.id;
    const src = gltf.scene || gltf;
    hideConstruction(src);
    group.add(src);
    const exhibitLabels=[];
    group.traverse(obj=>{
      if(!obj.isMesh||!/(?:_heading|_subheading|_label|_meaning|_note|_role|Extracellular|Intracellular|Natural_sensilla)/i.test(obj.name))return;
      obj.material=obj.material.clone();obj.material.transparent=true;obj.material.depthWrite=false;
      exhibitLabels.push(obj);
    });
    const det = (detected.stages[spec.id] = detected.stages[spec.id] || {});
    const signalMats = tagSignalMaterials(group, det);
    const pathWorld = extractPath(group, spec);
    group.updateWorldMatrix(true, true);
    const pathLocal = toLocalPts(group, pathWorld);
    if (pathLocal.length >= 2 && pathLocal[pathLocal.length - 1].z < pathLocal[0].z) pathLocal.reverse();
    loaded[spec.id] = "glb";
    return {
      group: group,
      pathLocal: pathLocal,
      exhibitLabels: exhibitLabels,
      signalMats: signalMats,
      fromGlb: true,
      target: findNamed(group, ["VOC_SOURCE_ANCHOR", "PATH_TARGET", "RETURN_TARGET_GLOW", "STAGE_ANCHOR_0" + (index + 1)])
    };
  }

  function prepareFallback(spec, index) {
    const fb = makeFallbackWorld(spec, index);
    const det = (detected.stages[spec.id] = detected.stages[spec.id] || {});
    const signalMats = tagSignalMaterials(fb.group, det);
    loaded[spec.id] = "fallback";
    failed[spec.id] = true;
    return {
      group: fb.group,
      pathLocal: fb.pathWorld,
      signalMats: signalMats,
      fromGlb: false,
      target: findNamed(fb.group, ["VOC_SOURCE_A", "RETURN_TARGET_GLOW"])
    };
  }

  function ensureStage(index, opts) {
    if (packs[index]) return Promise.resolve(packs[index]);
    if (prefetch[index]) return prefetch[index];
    const spec = STAGES[index];
    const silent = opts && opts.silent;
    if (!silent) setLoading(true, "Loading " + spec.num);
    prefetch[index] = loadGltf(spec.url)
      .then(function (gltf) {
        const pack = prepareGltfStage(spec, index, gltf);
        packs[index] = pack;
        if (scene) {
          placePack(pack, index);
        }
        if (!silent) setLoading(false);
        return pack;
      })
      .catch(function () {
        const pack = prepareFallback(spec, index);
        packs[index] = pack;
        if (scene) {
          placePack(pack, index);
        }
        if (!silent) setLoading(false);
        return pack;
      });
    return prefetch[index];
  }

  function prefetchNext(index) {
    if (index + 1 < STAGES.length) ensureStage(index + 1, { silent: true });
  }

  function buildRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(CLEAR_DAY, 1);
    renderer.shadowMap.enabled = false;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(CLEAR_DAY);
    scene.fog = new THREE.Fog(FOG_DAY, 6, 28);
    camera = new THREE.PerspectiveCamera(48, 1, 0.08, 80);
    hemi = new THREE.HemisphereLight(0xf2fff1, 0x23433c, 1.35);
    scene.add(hemi);
    keyLight = new THREE.DirectionalLight(0xffedce, 2.1);
    keyLight.position.set(5, 10, 4);
    scene.add(keyLight);
    fill = new THREE.DirectionalLight(0x98dccc, 0.9);
    fill.position.set(-6, 3, -4);
    scene.add(fill);
    rim = new THREE.DirectionalLight(0xb8d8ff, 1.2);
    rim.position.set(-2, 5, -7);
    scene.add(rim);
    if (els.gl) els.gl.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
  }

  function chaseDistance() {
    return mobile ? 2.05 : 2.55;
  }

  function fitFlyScale() {
    if (!fly || !camera) return;
    const dist = chaseDistance();
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const visibleH = 2 * Math.tan(vFov / 2) * dist;
    const aspect = camera.aspect || 1;
    const visibleW = visibleH * aspect;
    const targetFrac = mobile ? FLY_VW_MOBILE : FLY_VW_DESKTOP;
    const nativeW = fly.nativeWidth || 1;
    fly.root.scale.setScalar((targetFrac * visibleW) / nativeW);
    const shadow = fly.root.getObjectByName("flyShadow");
    if (shadow) {
      const s = Math.max(0.35, fly.root.scale.x * 0.55);
      shadow.scale.setScalar(s);
      shadow.position.y = -0.08 * fly.root.scale.y;
    }
  }

  function loadFly() {
    function addFacingFly() {
      // A separate, fixed fly lets the camera switch to the odor's point of view.
      // Clone materials so fading the player fly cannot fade this target.
      giantFly = fly.root.clone(true);
      giantFly.name = 'stationaryFlyAtAntenna';
      giantFly.traverse(function (obj) { if (obj.isMesh && obj.material) obj.material = Array.isArray(obj.material) ? obj.material.map(m => m.clone()) : obj.material.clone(); });
      giantFly.visible = false;
      scene.add(giantFly);
    }
    return loadGltf(FLY_URL)
      .then(function (gltf) {
        const root = gltf.scene || gltf;
        fly = packFly(root);
        detected.fly = fly.detected;
        detected.fly.source = FLY_URL;
        scene.add(fly.root);
        fitFlyScale();
        addFacingFly();
      })
      .catch(function () {
        fly = packFly(makeProceduralFly());
        detected.fly = fly.detected;
        detected.fly.procedural = true;
        scene.add(fly.root);
        fitFlyScale();
        addFacingFly();
      });
  }

  function maybeLoadCorridor() {
    return Promise.resolve(null);
  }

  function build() {
    if (state.built) return Promise.resolve(true);
    buildRenderer();
    orb = makeSignalOrb();
    scene.add(orb.mesh);
    setLoading(true, 'Preparing the complete journey…');
    return maybeLoadCorridor()
      .then(function () {
        // Decode every chapter before take-off. Loading a GLB and rebuilding the
        // entire route at a chapter boundary caused a visible stall mid-flight.
        return Promise.all([loadFly(), ...STAGES.map((_, index) => ensureStage(index, { silent: true }))]);
      })
      .then(function () {
        rebuildPath();
        setLoading(true, 'Preparing light and materials…');
        orb.mesh.visible = true;
        giantFly.visible = true;
        scene.updateMatrixWorld(true);
        const compiled = renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve(renderer.compile(scene, camera));
        return compiled.then(function () {
          // Upload buffers and textures into a tiny off-screen target before
          // movement starts, so a chapter's first visible frame does no setup.
          const target = new THREE.WebGLRenderTarget(2, 2);
          const culling = [];
          scene.traverse(function (obj) {
            if (obj.isMesh || obj.isSprite || obj.isLine) {
              culling.push([obj, obj.frustumCulled]);
              obj.frustumCulled = false;
            }
          });
          try {
            renderer.setRenderTarget(target);
            renderer.render(scene, camera);
          } finally {
            renderer.setRenderTarget(null);
            culling.forEach(([obj, value]) => { obj.frustumCulled = value; });
            target.dispose();
          }
        }).finally(function () {
          orb.mesh.visible = false;
          giantFly.visible = false;
        });
      })
      .then(function () {
        state.built = true;
        setLoading(false);
        return true;
      })
      .catch(function (err) {
        setLoading(false);
        console.error("Follow the Signal: 3D setup failed", err);
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
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
    renderer.setSize(w, h, false);
    fitFlyScale();
    if (giantFly && fly) giantFly.scale.copy(fly.root.scale).multiplyScalar(8);
  }

  function totalDuration() {
    return STAGE_SECONDS * STAGES.length;
  }

  function stageFromTime(t) {
    const i = Math.floor(t / STAGE_SECONDS);
    return clamp(i, 0, STAGES.length - 1);
  }

  function idleDive(stage) {
    return {
      active: false,
      from: stage,
      to: stage,
      pre: 0,
      dive: 0,
      recover: 0,
      blend: 1,
      speed: 1,
      pitchN: 0,
      dropN: 0,
      outSweep: 0,
      inRise: 0,
      link: null
    };
  }

  function diveEnvelope(t) {
    const idle = idleDive(state.stage);
    if (state.staticMode) return idle;
    let best = null;
    for (let k = 1; k < STAGES.length; k++) {
      const tau = t - k * STAGE_SECONDS;
      if (!best || Math.abs(tau) < Math.abs(best.tau)) best = { k: k, tau: tau };
    }
    if (!best) return idle;
    const tau = best.tau;
    if (tau < DIVE_PRE_START || tau > DIVE_REC_END) return idle;
    const from = best.k - 1;
    const to = best.k;
    const pre = smoothstep(DIVE_PRE_START, DIVE_PRE_END, tau) * (1 - smoothstep(DIVE_PRE_END, DIVE_T0, tau));
    const dive = smoothstep(DIVE_T0, DIVE_T0 + 0.18, tau) * (1 - smoothstep(DIVE_T1 - 0.12, DIVE_T1 + 0.22, tau));
    const recover = smoothstep(DIVE_T1, DIVE_REC_END, tau);
    const blend = smoothstep(DIVE_T0, DIVE_T1, tau);
    const pitchN =
      smoothstep(DIVE_T0 - 0.1, DIVE_T0 + 0.2, tau) * (1 - smoothstep(DIVE_T1 - 0.08, DIVE_REC_END - 0.4, tau));
    const outSweep = smoothstep(DIVE_PRE_END, DIVE_T1 + 0.42, tau);
    const inRise = smoothstep(DIVE_PRE_END, DIVE_T1, tau);
    let speed = lerp(1, SPEED_PRE, smoothstep(DIVE_PRE_START, DIVE_PRE_END, tau));
    if (tau >= DIVE_T0) {
      const u = clamp((tau - DIVE_T0) / Math.max(0.001, DIVE_T1 - DIVE_T0), 0, 1);
      const pulse = SPEED_DIVE_LO + (SPEED_DIVE_HI - SPEED_DIVE_LO) * Math.sin(u * Math.PI);
      speed = lerp(SPEED_PRE, pulse, smoothstep(DIVE_T0, DIVE_T0 + 0.16, tau));
    }
    if (tau >= DIVE_T1) speed = lerp(SPEED_DIVE_LO, 1, recover);
    return {
      active: true,
      from: from,
      to: to,
      pre: pre,
      dive: dive,
      recover: recover,
      blend: blend,
      speed: speed,
      pitchN: pitchN,
      dropN: pitchN,
      outSweep: outSweep,
      inRise: inRise,
      link: DIVE_LINKS[from] || DIVE_LINKS[0],
      tau: tau
    };
  }

  function resetDiveLayers() {
    packs.forEach(function (pack) {
      if (!pack || !pack.group) return;
      if (pack.basePos) pack.group.position.copy(pack.basePos);
      if (pack.baseScale) pack.group.scale.copy(pack.baseScale);
    });
    state.flyDivePitch = 0;
    state.camDivePitch = 0;
    state.camDiveY = 0;
    state.dive = 0;
    state.speedMul = 1;
    diveNow = idleDive(0);
  }

  function applyDiveLayers() {
    packs.forEach(pack=>{if(!pack?.group)return;if(pack.basePos)pack.group.position.copy(pack.basePos);if(pack.baseScale)pack.group.scale.copy(pack.baseScale);});
    if(els.flightRoot){els.flightRoot.style.setProperty('--dive',String(diveNow.dive||0));els.flightRoot.classList.toggle('is-diving',(diveNow.dive||0)>.15);}
  }

  function refreshScanHeld() {
    state.scanHeld = !!(state.scanSpace || state.scanMouse || state.scanPad);
  }

  function setPaused(on) {
    state.userPaused = on;
    if (els.pauseBtn) {
      els.pauseBtn.textContent = on ? "Resume" : "Pause";
      els.pauseBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (on) stopLoop();
    else if (state.open && !state.staticMode) startLoop();
  }

  function physics(dt) {
    state.scan = 0;
    if (state.completed) return;
    const previousTime = state.time;
    const cinematicAtStart = !!state.cinematic;

    const input = state.cinematic ? 0 : clamp(state.pointer && state.pointer.mode === "steer" ? state.pointerInput : state.keyInput, -1, 1);
    if (Math.abs(input) > 0.08) takeManual();

    const progressU = clamp(state.time / totalDuration(), 0, 0.999);
    const odor = liveOdor(progressU, state.time);
    state.odorX = odor.x;
    state.odorY = odor.y;

    if (state.auto) {
      state.autoAim = damp(state.autoAim, state.odorX, AUTO_AIM_DAMP, dt);
      state.vx += (state.autoAim - state.offset) * AUTO_SEEK * dt;
      state.vx *= Math.exp(-AUTO_DRAG * dt);
      state.offset += state.vx * dt;
    } else {
      state.vx += input * STEER_ACCEL * dt;
      state.vx *= Math.exp(-STEER_DRAG * dt);
      state.offset += state.vx * dt;
      if (Math.abs(state.offset) > SOFT_RAIL) {
        const extra = state.offset - Math.sign(state.offset) * SOFT_RAIL;
        state.vx += -extra * 1.7 * dt;
        state.offset = damp(state.offset, Math.sign(state.offset) * SOFT_RAIL, 0.62, dt);
      }
    }
    if (state.offset > OFFSET_MAX) {
      state.offset = lerp(state.offset, OFFSET_MAX, 0.4);
      if (state.vx > 0) state.vx *= 0.35;
    } else if (state.offset < -OFFSET_MAX) {
      state.offset = lerp(state.offset, -OFFSET_MAX, 0.4);
      if (state.vx < 0) state.vx *= 0.35;
    }

    applyObstacleAvoid(dt);

    state.holdY = damp(state.holdY, state.odorY, 6.5, dt);

    const targetBank = clamp(-state.vx * 0.55 - input * 0.12, -BANK_MAX, BANK_MAX);
    state.bank = damp(state.bank, targetBank, 8, dt);

    diveNow = diveEnvelope(state.time);
    state.dive = diveNow.dive;
    state.speedMul = diveNow.speed;

    if (state.cinematic) {
      const movie = state.cinematic;
      movie.elapsed = Math.min(movie.duration, movie.elapsed + dt);
      const progress = cinematicEase(0, 1, movie.elapsed / movie.duration);
      state.time = lerp(movie.start, movie.end, progress);
      state.offset = damp(state.offset, state.odorX, 4, dt);
    } else if (!state.waitLoad && !state.checkpointOpen && !state.staticMode && !state.questHold) {
      const endSlow = state.time > totalDuration() - 3.2 ? 0.42 : 1;
      state.time = clamp(state.time + dt * state.forwardInput * 4.8 * endSlow * state.speedMul, state.travelFloor, totalDuration());
    }
    const waypoint=waypointTexts[state.questIndex];
    if(waypoint && state.time>=waypoint.at && !state.questHold && !state.staticMode && !state.cinematic){
      state.time=waypoint.at;
      const marker=course?.beacons?.[state.questIndex];
      const antennaApproach=state.stage===1;
      const atMarker=!!marker && (antennaApproach || Math.abs(state.offset-state.odorX)<SCORE_MID);
      if(!state.auto && !atMarker){
        if(!state.questApproach){
          state.questApproach=true;
          announce('Glowing waypoint ahead. Fly through its green ring to unlock the next scene.');
        }
        questLabel.classList.add('is-approach');
        questLabel.textContent='WAYPOINT AHEAD · FLY THROUGH THE GREEN RING';
      }else{
        state.questApproach=false;questLabel.classList.remove('is-approach');
        state.questHold=true;quest.hidden=false;
        quest.querySelector('h4').textContent=waypoint.title;
        quest.querySelector('.flight__quest-copy').textContent=waypoint.text;
        quest.querySelector('button').textContent = state.questIndex === 0 ? 'Follow one odor molecule →' : state.questIndex === 1 ? 'Enter the antenna →' : 'Continue the journey →';
        questLabel.textContent='SIGNAL FOUND · '+waypoint.title.toUpperCase();
        quest.querySelector('button').focus({preventScroll:true});
        announce('Waypoint reached. '+waypoint.text);
      }
    }
    questMap.querySelectorAll('span').forEach((el,i)=>{el.classList.toggle('is-complete',i<state.questIndex);el.classList.toggle('is-current',i===state.questIndex);});

    const next = stageFromTime(state.time);
    const localT = (state.time - next * STAGE_SECONDS) / STAGE_SECONDS;
    state.stageU = clamp(localT, 0, 1);
    if (next !== state.stage) {
      state.stage = next;
      setProgressUi(next);
      prefetchNext(next);
      if (!packs[next] && prefetch[next]) {
        state.waitLoad = true;
        setLoading(true, "Loading " + STAGES[next].num);
        prefetch[next].then(function () {
          state.waitLoad = false;
          setLoading(false);
          if (failed[STAGES[next].id] && next > 0) openCheckpoint(next);
        });
      } else if (failed[STAGES[next].id] && next > 0) {
        openCheckpoint(next);
      }
    }
    diveNow = diveEnvelope(state.time);
    state.dive = diveNow.dive;
    if (diveNow.active) ensureStage(diveNow.to, { silent: true });

    const morphT = state.cinematic?.kind === 'handoff' ? cinematicEase(.12, .52, state.cinematic.elapsed / state.cinematic.duration) : next === 0 ? 0 : 1;
    state.morph = damp(state.morph, morphT, 3.2, dt);

    if (state.cardShown < 0 && state.time > 0.78 && !diveNow.active) showCard(0);
    if (diveNow.active && diveNow.pre > 0.35 && state.cardShown === diveNow.from) hideCard();
    if (state.stage > 0 && state.cardShown !== state.stage && !state.cinematic) {
      const textReady = !diveNow.active || (diveNow.to === state.stage && diveNow.recover > 0.62);
      if (textReady) showCard(state.stage);
    }

    const showFinale = state.stage === 5 && state.stageU >= FINISH_PHASE;
    if (els.finale) els.finale.hidden = !showFinale;
    if (showFinale) finishJourney();

    const odorDist = Math.abs(state.offset - state.odorX);
    state.onTrail = odorDist < SCORE_MID;
    if (!state.completed && !cinematicAtStart && !state.questHold && state.time > previousTime && !state.auto && state.forwardInput > 0 && !state.staticMode && !state.userPaused && !state.waitLoad) {
      state.score += trackingRate(odorDist) * dt;
    }
    updateScoreUi();
  }

  function applyObstacleAvoid(dt) {
    if (!path || !obstacles.length) return;
    const u = clamp(state.time / totalDuration(), 0, 0.999);
    path.getPointAt(u, _railPos);
    path.getTangentAt(u, _tan).normalize();
    _right.crossVectors(_tan, _up);
    if (_right.lengthSq() < 1e-6) _right.set(1, 0, 0);
    else _right.normalize();
    const px = _railPos.x + _right.x * state.offset;
    const pz = _railPos.z + _right.z * state.offset;
    const py = _railPos.y + state.holdY;
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      const dx = px - o.x;
      const dz = pz - o.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist >= o.r || Math.abs(py - o.y) > o.h) continue;
      const push = (o.r - dist) / o.r;
      const lat = dx * _right.x + dz * _right.z;
      const dir = lat >= 0 ? 1 : -1;
      state.vx += dir * push * 8.2 * dt;
      state.offset += dir * push * 0.85 * dt;
    }
  }

  function scoreCheckpoints() {
    if (state.completed || state.cinematic || state.questHold || !fly || !fly.root || !checkpoints.length) return;
    const pos = state.stage === 0 ? fly.root.position : orb.mesh.position;
    for (let i = 0; i < checkpoints.length; i++) {
      const ck = checkpoints[i];
      if (state.bonusHits[ck.id] || ck.stage !== state.stage) continue;
      let hit = false;
      for (let j = 0; j < ck.objs.length; j++) {
        if (pos.distanceTo(worldPos(ck.objs[j])) <= 1.32) {
          hit = true;
          break;
        }
      }
      if (!hit) continue;
      state.bonusHits[ck.id] = true;
      state.score += ck.bonus;
      showScoreTick(ck.label);
      const encounters = {
        voc:'Odor source reached. Follow one molecule toward an olfactory receptor.',
        receptor:'Receptor encountered. OR and Orco work together in an odor-gated ion channel.',
        gcamp:'Reporter reached. A calcium change can become a fluorescence change.',
        read:'Reader reached. Optical detection turns light into an electrical signal.',
        sparse:'Pattern stage reached. The model interprets a distributed response.',
        final:'Follow-up point reached. A screening signal calls for confirmatory testing.'
      };
      if (ck.stage === state.stage) {
        showCard(state.stage);
        if (els.cardText) { els.cardText.hidden=false; els.cardText.textContent=encounters[ck.id]; }
        announce(encounters[ck.id]);
      }
    }
    updateScoreUi();
  }

  function openCheckpoint(index) {
    if (!els.checkpoint || state.checkpointOpen) return;
    state.checkpointOpen = true;
    els.checkpoint.hidden = false;
    if (els.checkpointText) {
      els.checkpointText.textContent =
        "Stage " + STAGES[index].num + " could not load from disk. A simplified stand-in is in use. The conceptual path can continue.";
    }
    if (els.checkpointBtn) els.checkpointBtn.focus();
  }

  function closeCheckpoint() {
    state.checkpointOpen = false;
    if (els.checkpoint) els.checkpoint.hidden = true;
  }

  function placePlayer(dt) {
    if (!path) return;
    const step = dt || 0.016;
    const u = clamp(state.time / totalDuration(), 0, 0.999);
    path.getPointAt(u, _railPos);
    path.getTangentAt(u, _tan).normalize();
    _right.crossVectors(_tan, _up).normalize();
    if (_right.lengthSq() < 0.0001) _right.set(1, 0, 0);
    _pos.copy(_railPos).addScaledVector(_right, state.offset);
    _pos.y += state.holdY;

    _flat.copy(_tan).addScaledVector(_right, state.vx * .24);
    _flat.y = 0;
    if (_flat.lengthSq() < 1e-6) _flat.set(_tan.x, 0, _tan.z);
    if (_flat.lengthSq() < 1e-6) _flat.set(0, 0, 1);
    else _flat.normalize();

    const pitchTarget = FLY_DIVE_PITCH * (diveNow.pitchN || 0);
    state.flyDivePitch = damp(state.flyDivePitch, pitchTarget, FLY_DIVE_PITCH_DAMP, step);
    state.camDivePitch = damp(state.camDivePitch, state.flyDivePitch * CAM_DIVE_FOLLOW, CAM_DIVE_PITCH_DAMP, step);

    _diveAxis.crossVectors(_flat, _up);
    if (_diveAxis.lengthSq() < 1e-6) _diveAxis.set(1, 0, 0);
    else _diveAxis.normalize();
    _diveFwd.copy(_flat);
    _diveFwd.applyAxisAngle(_diveAxis, state.flyDivePitch);

    flyFwd.x = damp(flyFwd.x, _diveFwd.x, FLY_YAW_DAMP, step);
    flyFwd.y = damp(flyFwd.y, _diveFwd.y, FLY_DIVE_PITCH_DAMP, step);
    flyFwd.z = damp(flyFwd.z, _diveFwd.z, FLY_YAW_DAMP, step);
    if (flyFwd.lengthSq() < 1e-8) flyFwd.copy(_diveFwd);
    else flyFwd.normalize();

    _pos.addScaledVector(flyFwd, DIVE_GLIDE * (diveNow.pitchN || 0));
    _pos.y -= DIVE_DROP * (diveNow.dropN || 0);
    state.camDiveY = damp(state.camDiveY, flyFwd.y * 0.62 * (diveNow.pitchN || 0), CAM_DIVE_Y_DAMP, step);

    camFwd.x = damp(camFwd.x, _flat.x, CAM_YAW_DAMP, step);
    camFwd.z = damp(camFwd.z, _flat.z, CAM_YAW_DAMP, step);
    camFwd.y = damp(camFwd.y, 0, 3.6, step);
    if (camFwd.lengthSq() < 1e-8) camFwd.copy(_flat);
    else camFwd.normalize();

    const bob = Math.sin(state.time * 2.4) * 0.035;
    if (fly && fly.root) {
      _look.copy(_pos);
      _look.y += bob * (1 - state.morph);
      if(state.morph<.03)_flyHoldPos.copy(_look);
      setGroupPose(fly.root, state.morph<.03?_look:_flyHoldPos, flyFwd, _up, state.bank);
      const flap = Math.sin(state.time * Math.PI * 2 * WING_HZ) * 0.58;
      flapWing(fly.wingLeft, flap);
      flapWing(fly.wingRight, -flap);
      const bodyA = 1 - state.morph;
      fly.fadeMats.forEach(function (m) {
        const wingish = m.userData && m.userData.wing;
        m.opacity = (wingish ? 0.36 : 1) * bodyA;
        if (state.morph > 0.2 && m.emissive) m.emissive.setRGB(0.04 * state.morph, 0.2 * state.morph, 0.07 * state.morph);
      });
      fly.root.visible = bodyA > 0.05 && state.cinematic?.kind !== 'handoff';
      if (!fly.wingLeft && !fly.wingRight) {
        fly.root.position.y += Math.sin(state.time * 9) * 0.008 * bodyA;
      }
    }

    if (giantFly && path) {
      giantFly.visible = state.stage === 1 || state.cinematic?.kind === 'handoff' || (state.cinematic?.kind === 'entry' && state.cinematic.elapsed / state.cinematic.duration < .65);
      if (giantFly.visible) {
        if(!facingFlyPose){
          path.getPointAt(1/STAGES.length,_ndc);
          path.getTangentAt(1/STAGES.length,_odorTan).normalize();
          facingFlyPose={position:_ndc.clone(),forward:_odorTan.clone(),quaternion:fly.root.quaternion.clone()};
        }
        giantFly.position.copy(facingFlyPose.position);
        giantFly.quaternion.copy(facingFlyPose.quaternion);
        const growing = state.cinematic?.kind === 'handoff' ? cinematicEase(.08,.9,state.cinematic.elapsed/state.cinematic.duration) : 1;
        giantFly.scale.copy(fly.root.scale).multiplyScalar(lerp(1,8,growing));
      }
    }

    if (orb) {
      // Keep the molecular token in view during the approach and entry. It sits
      // below the sight line so the visitor can still see the fly's antenna.
      orb.mesh.visible = state.morph > 0.08;
      orb.mesh.position.copy(_pos);
      orb.mat.opacity = 0.92 * state.morph;
      orb.haloMat.opacity = 0.28 * state.morph;
      orb.streakMat.opacity = 0.4 * state.morph;
      orb.streaks.forEach(function (s, i) {
        s.position.set((i - 1) * 0.035, -0.01, 0.14 + i * 0.06);
        s.lookAt(_pos.x - camFwd.x, _pos.y - camFwd.y, _pos.z - camFwd.z);
      });
    }

    const dist = chaseDistance();
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const ndcY = 1 - 2 * FLY_SCREEN_Y;
    const height = dist * Math.tan(vFov / 2) * -ndcY;
    const desired = _look.copy(_pos).addScaledVector(camFwd, -dist);
    desired.y += height;
    const posDamp = !camReady || state.time < 0.08 ? 28 : CAM_POS_DAMP;
    camPos.x = damp(camPos.x, desired.x, posDamp, step);
    camPos.y = damp(camPos.y, desired.y, posDamp * 0.9, step);
    camPos.z = damp(camPos.z, desired.z, posDamp, step);
    camera.position.copy(camPos);
    camera.position.y += state.camDiveY;

    camLook.copy(_pos).addScaledVector(camFwd, dist * 0.8);
    camLook.y = _pos.y + .12 + state.camDiveY * .6;

    const rollTarget = clamp(state.bank * (CAM_ROLL_MAX / BANK_MAX), -CAM_ROLL_MAX, CAM_ROLL_MAX);
    state.camRoll = damp(state.camRoll, rollTarget, CAM_ROLL_DAMP, step);
    _look.subVectors(camLook, camera.position).normalize();
    _camUp.set(0, 1, 0);
    if (_look.lengthSq() > 1e-8) _camUp.applyAxisAngle(_look, state.camRoll);
    _camMat.lookAt(camera.position, camLook, _camUp);
    _desiredQuat.setFromRotationMatrix(_camMat);
    if (!camReady) {
      camQuat.copy(_desiredQuat);
      camReady = true;
    } else {
      const k = 1 - Math.exp(-CAM_LOOK_DAMP * step);
      camQuat.slerp(_desiredQuat, k);
    }
    camera.quaternion.copy(camQuat);
    camera.up.set(0, 1, 0);
    if (giantFly && giantFly.visible && state.stage === 1 && facingFlyPose && !state.cinematic) {
      // The camera turns around the very fly the visitor just controlled, then
      // follows the odor cue toward its antenna rather than spawning a new scene fly.
      const approach = smoothstep(0.15, 0.70, state.stageU);
      const distance = lerp(5.4,3.8,approach);
      const targetCam = _coursePos.copy(facingFlyPose.position).addScaledVector(facingFlyPose.forward, distance);
      targetCam.y += .22 - .12*approach;
      camera.position.copy(targetCam);
      camLook.copy(facingFlyPose.position);camLook.y += .22;
      _camMat.lookAt(camera.position, camLook, _up);
      _desiredQuat.setFromRotationMatrix(_camMat);
      camera.quaternion.copy(_desiredQuat);
    }
    if (state.cinematic && facingFlyPose) {
      const movie = state.cinematic;
      const p = movie.elapsed / movie.duration;
      const eased = cinematicEase(0, 1, p);
      _cinemaLook.copy(facingFlyPose.position);_cinemaLook.y += .22;
      if (movie.kind === 'handoff') {
        // A timed half-orbit around the frozen player fly. Keyboard and touch
        // input cannot scrub or reverse this perspective change.
        _cinemaOffset.subVectors(movie.position, facingFlyPose.position);
        const startRadius = Math.hypot(_cinemaOffset.x, _cinemaOffset.z);
        const startAngle = Math.atan2(_cinemaOffset.x, _cinemaOffset.z);
        const targetAngle = Math.atan2(facingFlyPose.forward.x, facingFlyPose.forward.z);
        let arc = targetAngle - startAngle;
        while (arc < 0) arc += Math.PI * 2;
        while (arc > Math.PI * 2) arc -= Math.PI * 2;
        const endApproach = smoothstep(.15, .70, .32);
        const radius = lerp(startRadius, lerp(5.4,3.8,endApproach), eased);
        const angle = startAngle + arc * eased;
        camera.position.copy(facingFlyPose.position);
        camera.position.x += Math.sin(angle)*radius;
        camera.position.z += Math.cos(angle)*radius;
        camera.position.y += lerp(_cinemaOffset.y,.22-.12*endApproach,eased);
        _camMat.lookAt(camera.position,_cinemaLook,_up);
        _desiredQuat.setFromRotationMatrix(_camMat);
        camera.quaternion.copy(movie.quaternion).slerp(_desiredQuat,cinematicEase(0,.55,p));
      } else {
        // Enter the same fly, then bridge to the engineered-cell scene instead
        // of snapping from an antenna close-up to a distant rail camera.
        _cinemaPos.copy(facingFlyPose.position).addScaledVector(facingFlyPose.forward,.32);
        _cinemaPos.y += .18;
        if (p < .56) {
          camera.position.copy(movie.position).lerp(_cinemaPos,cinematicEase(0,.56,p));
          _camMat.lookAt(camera.position,_cinemaLook,_up);
          _desiredQuat.setFromRotationMatrix(_camMat);
          camera.quaternion.copy(movie.quaternion).slerp(_desiredQuat,cinematicEase(0,.56,p));
        } else {
          camera.position.lerp(_cinemaPos,1-cinematicEase(.56,1,p));
          camera.quaternion.slerp(movie.quaternion,1-cinematicEase(.56,1,p));
        }
      }
    }
    if (orb) {
      const closeView = state.stage === 1 || !!state.cinematic;
      orb.mesh.scale.setScalar(closeView ? .48 : 1);
      orb.mat.depthTest = orb.haloMat.depthTest = orb.streakMat.depthTest = !closeView;
      if (closeView) {
        _orbOffset.set(.09,-.20,-1.05).applyQuaternion(camera.quaternion);
        orb.mesh.position.copy(camera.position).add(_orbOffset);
      }
    }
    // Pull back for the closing view rather than flying into the explanatory labels.
    if(state.stage===5&&packs[5]&&state.stageU>.68){
      const blend=smoothstep(.68,.90,state.stageU),pack=packs[5];
      const overview=pack.group.localToWorld(new THREE.Vector3(0,3.8,-8.5));
      const focus=pack.group.localToWorld(new THREE.Vector3(0,1.0,.4));
      camera.position.lerp(overview,blend);
      _camMat.lookAt(camera.position,focus,_up);_desiredQuat.setFromRotationMatrix(_camMat);
      camera.quaternion.slerp(_desiredQuat,blend);
    }
    updateOdorVisual(state.time);
    if (state.cinematic && state.cinematic.elapsed >= state.cinematic.duration) {
      state.travelFloor = state.cinematic.end;
      state.cinematic = null;
      state.forwardInput = 0;
      state.keyInput = 0;
      state.pointerInput = 0;
      camPos.copy(camera.position);
      camQuat.copy(camera.quaternion);
      els.flightRoot.dataset.flightMode = 'manual';
      questLabel.textContent = 'YOUR MOVE · NEXT: ' + waypointTexts[state.questIndex].title.toUpperCase();
      announce('Perspective change complete. Use forward, back and steering to reach the next glowing waypoint.');
    }
  }

  function applyScanLook() {
    const s = state.scan;
    const Lf = STAGE_LIGHTS[diveNow.from] || STAGE_LIGHTS[state.stage] || STAGE_LIGHTS[0];
    const Lt = STAGE_LIGHTS[diveNow.to] || Lf;
    const mix = diveNow.active ? diveNow.blend : 1;
    _sky.setHex(Lf.hemiSky).lerp(_col.setHex(Lt.hemiSky), mix);
    _sky.lerp(_col.setHex(0xc5d4d0), s * 0.35);
    _gnd.setHex(Lf.hemiGround).lerp(_col.setHex(Lt.hemiGround), mix);
    _gnd.lerp(_col.setHex(0x3a4a46), s * 0.4);
    hemi.color.copy(_sky);
    hemi.groundColor.copy(_gnd);
    keyLight.color.setHex(Lf.key).lerp(_col.setHex(Lt.key), mix);
    keyLight.color.lerp(_col.setHex(0xc8ddd4), s * 0.4);
    keyLight.intensity = lerp(lerp(Lf.keyI, Lt.keyI, mix), lerp(Lf.keyI, Lt.keyI, mix) * 0.82, s);
    fill.color.setHex(Lf.fill).lerp(_col.setHex(Lt.fill), mix);
    if (rim) rim.intensity = lerp(0.24, 0.12, s);
    scene.background.setHex(CLEAR_DAY).lerp(_col.setHex(CLEAR_SCAN), s);
    scene.fog.color.setHex(FOG_DAY).lerp(_col.setHex(FOG_SCAN), s);
    scene.fog.near = lerp(6, 5, s);
    scene.fog.far = lerp(28, 22, s);
    renderer.setClearColor(scene.background.getHex(), 1);
    if (course) {
      const cardDim = 1;
      if (course.trailMat) course.trailMat.opacity = lerp(0.07, 0.18, s) * cardDim;
      if (course.puffMat) course.puffMat.opacity = lerp(0.18, 0.42, s) * cardDim;
    }
    applyDiveLayers();
    packs.forEach(function (pack, i) {
      if (!pack) return;
      const inDive = diveNow.active && (i === diveNow.from || i === diveNow.to);
      let fade = 0;
      if (diveNow.active) {
        if (i === diveNow.from) fade = lerp(1, 0.18, diveNow.outSweep);
        else if (i === diveNow.to) fade = lerp(0.55, 1, diveNow.inRise);
        else if (i === state.stage) fade = 1;
      } else if (i === state.stage) {
        fade = 1;
      } else if (i === state.stage - 1) {
        fade = 1 - smoothstep(0, OVERLAP, state.stageU);
      }
      pack.fadeMats.forEach(function (m) {
        m.userData.fadeMul = fade;
      });
      setGroupFade(pack.fadeMats, fade);
      pack.group.visible = fade > 0.04 || i === state.stage || inDive;
      applyScanToMats(pack.signalMats, s);
      (pack.exhibitLabels||[]).forEach(label=>{
        const distance=worldPos(label).distanceTo(camera.position);
        label.material.opacity*=smoothstep(2.8,6.2,distance)*(els.finale&&!els.finale.hidden?0:1);
      });
    });
  }

  function updateCallout() {
    if (!els.callout) return;
    const nearSource =
      state.stage === 0 &&
      vocSourceObj &&
      fly &&
      fly.root &&
      fly.root.position.distanceTo(worldPos(vocSourceObj)) < 2.55;
    const lateAir = state.stage === 0 && state.stageU > 0.58 && state.stageU < 0.92;
    const show = !state.staticMode && (nearSource || lateAir);
    els.callout.hidden = !show;
    if (show) {
      if (els.calloutKicker) els.calloutKicker.textContent = "SOURCE IN SIGHT";
      if (els.calloutLabel) els.calloutLabel.textContent = "VOC pattern in the headspace.";
    }
  }

  function updateEdge() {
    if (!els.edge) return;
    const pack = packs[state.stage];
    const target = pack && pack.target;
    if (!target || state.stage > 0) {
      els.edge.hidden = true;
      return;
    }
    worldPos(target, _ndc);
    _ndc.project(camera);
    const off = _ndc.z > 1 || Math.abs(_ndc.x) > 0.92;
    els.edge.hidden = !off;
    if (off) {
      const right = _ndc.x >= 0;
      els.edge.textContent = right ? "SIGNAL >" : "< SIGNAL";
      els.edge.classList.toggle("is-right", right);
    }
  }

  function render(dt) {
    if (!renderer) return;
    resize();
    physics(dt || 0.016);
    placePlayer(dt || 0.016);
    scoreCheckpoints();
    applyScanLook();
    updateEdge();
    updateCallout();
    renderer.render(scene, camera);
  }

  function tick(now) {
    if (!state.open || state.userPaused || state.hidden || state.staticMode) {
      state.running = false;
      state.raf = 0;
      return;
    }
    if (!state.last) state.last = now;
    const dt = clamp((now - state.last) / 1000, 0, 0.05);
    state.last = now;
    render(dt);
    state.raf = window.requestAnimationFrame(tick);
  }

  function startLoop() {
    if (state.running || state.staticMode) return;
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

  function probePreview(url) {
    return new Promise(function (resolve) {
      const img = new Image();
      img.onload = function () {
        resolve(url);
      };
      img.onerror = function () {
        resolve("");
      };
      img.src = url;
    });
  }

  function showStaticStage(index) {
    index = clamp(index, 0, STAGES.length - 1);
    state.stage = index;
    state.time = index * STAGE_SECONDS + STAGE_SECONDS * 0.55;
    setProgressUi(index);
    showCard(index);
    if (els.finale) els.finale.hidden = index !== STAGES.length - 1;
    if (els.previewImg) {
      const url = STAGES[index]._previewUrl;
      if (url) {
        els.previewImg.src = url;
        els.previewImg.alt =
          "Conceptual still from Follow the signal: " +
          STAGES[index].heading.replace(/\n/g, " ") +
          ". Not experimental data.";
        if (els.preview) els.preview.hidden = false;
      } else if (els.preview) els.preview.hidden = true;
    }
    announce(STAGES[index].heading);
  }

  function startReduced() {
    state.staticMode = true;
    if (els.staticNav) els.staticNav.hidden = false;
    if (els.pauseBtn) els.pauseBtn.hidden = true;
    if (els.autoBtn) els.autoBtn.hidden = true;
    if (els.scanBtn) els.scanBtn.hidden = true;
    qsa(".flight__hint", els.dialog || root).forEach(function (el) {
      el.classList.add("is-gone");
    });
    Promise.all(
      STAGES.map(function (s) {
        return probePreview(s.preview);
      })
    ).then(function (urls) {
      urls.forEach(function (url, i) {
        STAGES[i]._previewUrl = url;
      });
      showStaticStage(0);
    });
  }

  function resetFlight() {
    state.time = 0;
    state.completed = false;
    state.cinematic = null;
    state.travelFloor = 0;
    facingFlyPose = null;
    els.flightRoot.dataset.flightMode = 'manual';
    state.questIndex=0;state.questHold=false;state.questApproach=false;quest.hidden=true;questLabel.classList.remove('is-approach');
    questLabel.textContent='FOLLOW THE LUMINOUS TRAIL · NEXT: ODOR SOURCE';
    questMap.querySelectorAll('span').forEach(el=>el.className='');
    state.stage = 0;
    state.stageU = 0;
    state.offset = 0;
    state.vx = 0;
    state.holdY = 0;
    state.odorX = 0;
    state.odorY = 0;
    state.autoAim = 0;
    state.bank = 0;
    state.camRoll = 0;
    camReady = false;
    state.morph = 0;
    state.scan = 0;
    state.scanHeld = false;
    state.scanSpace = false;
    state.scanMouse = false;
    state.scanPad = false;
    state.keyInput = 0;
    state.forwardInput = 0;
    state.pointerInput = 0;
    state.pointer = null;
    state.userPaused = false;
    state.cardShown = -1;
    state.waitLoad = false;
    state.score = 0;
    state.onTrail = true;
    state.bonusHits = {};
    state.speedMul = 1;
    state.dive = 0;
    resetDiveLayers();
    setAuto(false);
    closeCheckpoint();
    if (els.finale) els.finale.hidden = true;
    if (els.pin) els.pin.hidden = true;
    if (els.card) els.card.hidden = true;
    if (els.edge) els.edge.hidden = true;
    if (els.callout) els.callout.hidden = true;
    if (els.pauseBtn) {
      els.pauseBtn.hidden = false;
      els.pauseBtn.textContent = "Pause";
      els.pauseBtn.setAttribute("aria-pressed", "false");
    }
    if (els.autoBtn) els.autoBtn.hidden = false;
    if (els.score) els.score.classList.remove("is-pop");
    if (els.scoreTick) {
      els.scoreTick.hidden = true;
      els.scoreTick.classList.remove("is-in");
    }
    window.clearTimeout(state.tickT);
    setProgressUi(0);
    updateScoreUi();
    hideCard();
    state.cardShown = -1;
  }

  function presentDialog() {
    if (!els.dialog) return;
    if (els.dialog.parentElement !== document.body) document.body.appendChild(els.dialog);
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

  function closeFlight() {
    state.open = false;
    quest.hidden=true;
    stopLoop();
    state.scanHeld = false;
    state.scanSpace = false;
    state.scanMouse = false;
    state.scanPad = false;
    state.pointer = null;
    closeCheckpoint();
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
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

  function openFlight() {
    if (state.open || state.opening) return;
    state.opening = true;
    if (els.start) els.start.disabled = true;
    presentDialog();
    const boot = reduceMotion || !webgl ? Promise.resolve("static") : build();
    Promise.resolve(boot)
      .then(function (ok) {
        state.opening = false;
        if (els.start) els.start.disabled = false;
        // The visitor may exit while the one-time scene preparation is running.
        // Keep the prepared assets for next time without starting a hidden loop.
        if (els.dialog && !els.dialog.hasAttribute('open')) return;
        if (ok === "static") {
          state.open = true;
          startReduced();
          return;
        }
        if (!ok) {
          if (els.unavailable) {
            els.unavailable.hidden = false;
            els.unavailable.textContent = "Interactive 3D view unavailable on this device.";
          }
          startReduced();
          state.open = true;
          return;
        }
        resetFlight();
        state.open = true;
        window.requestAnimationFrame(function () {
          if (!state.open) return;
          resize();
          camPos.set(0, 2.1, -6);
          render(0.016);
          startLoop();
          announce("Follow the signal. Hold W or Up to fly forward, A and D or Left and Right to steer. Reach the luminous waypoint to reveal the next scene.");
          window.clearTimeout(state.hintTimer);
          state.hintTimer = window.setTimeout(function () {
            qsa(".flight__hint", els.dialog || root).forEach(function (el) {
              el.classList.add("is-gone");
            });
          }, 5200);
        });
      })
      .catch(function (err) {
        state.opening = false;
        if (els.start) els.start.disabled = false;
        console.error("Follow the Signal: could not open", err);
        if (els.unavailable) {
          els.unavailable.hidden = false;
          els.unavailable.textContent = "Interactive 3D view failed to start. Serve this folder over http and refresh.";
        }
      });
  }

  function skipJourney() {
    if (els.journey) els.journey.classList.add("is-skipped");
    const fallback = qs("#follow-the-signal-text", root);
    if (fallback) fallback.setAttribute("open", "");
    if (els.skipped) els.skipped.focus();
    if (state.open) closeFlight();
  }

  function keySteer(key, down) {
    let v = 0;
    if (key === "ArrowLeft" || key === "a" || key === "A") v = -1;
    if (key === "ArrowRight" || key === "d" || key === "D") v = 1;
    if (!v) return false;
    if (state.cinematic || state.completed) return true;
    if (down) {
      takeManual();
      state.keyInput = v;
    } else if (state.keyInput === v) state.keyInput = 0;
    return true;
  }

  function keyAdvance(key, down) {
    let v = 0;
    if (key === "ArrowUp" || key === "w" || key === "W") v = 1;
    if (key === "ArrowDown" || key === "s" || key === "S") v = -1;
    if (!v) return false;
    if (state.cinematic || state.completed) return true;
    if (down) {
      // A short key tap must still move on devices where keyup arrives before
      // the next animation frame. Held keys use the continuous physics step.
      if (!state.forwardInput && !state.waitLoad && !state.checkpointOpen && !state.questHold && !state.userPaused)
        state.time = clamp(state.time + v * .12, state.travelFloor, totalDuration());
      state.forwardInput = v;
    }
    else if (state.forwardInput === v) state.forwardInput = 0;
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
    if (keyAdvance(event.key, true) || keySteer(event.key, true)) event.preventDefault();
  }

  function onKeyUp(event) {
    if (!state.open) return;
    keyAdvance(event.key, false);
    keySteer(event.key, false);
  }

  function onPointerDown(event) {
    if (!state.open || !els.world || state.staticMode || state.cinematic || state.completed) return;
    if (event.target && event.target.closest && event.target.closest("button, a, summary")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
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
      state.pointerInput = clamp(dx / (r.width * 0.18), -1, 1);
    }
  }

  function onPointerUp(event) {
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
  qsa('[data-flight-move]', els.dialog || root).forEach(function (button) {
    const direction = button.getAttribute('data-flight-move');
    const value = direction === 'forward' ? 1 : direction === 'back' ? -1 : direction === 'left' ? -1 : 1;
    const axis = direction === 'forward' || direction === 'back' ? 'forwardInput' : 'keyInput';
    button.addEventListener('pointerdown', function (event) { event.preventDefault(); button.setPointerCapture(event.pointerId); state[axis] = value; });
    function release() { if (state[axis] === value) state[axis] = 0; }
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });
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
      if (!document.fullscreenElement) (els.dialog || els.flightRoot).requestFullscreen().catch(function () {});
      else document.exitFullscreen().catch(function () {});
    });
  }
  if (els.checkpointBtn) {
    els.checkpointBtn.addEventListener("click", closeCheckpoint);
  }
  if (els.staticPrev) {
    els.staticPrev.addEventListener("click", function () {
      showStaticStage(state.stage - 1);
    });
  }
  if (els.staticNext) {
    els.staticNext.addEventListener("click", function () {
      if (state.stage >= STAGES.length - 1) {
        if (els.finale) els.finale.hidden = false;
      } else showStaticStage(state.stage + 1);
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
    if (state.open && renderer) resize();
  });
  document.addEventListener("visibilitychange", function () {
    state.hidden = document.hidden;
    if (document.hidden) state.last = 0;
    else if (state.open && !state.userPaused && !state.staticMode) startLoop();
  });

  window.__aerosenseOpenFlight = openFlight;
})();
