/**
 * Homepage 3D teaser — warehouse + fly only.
 * Scripted, no steering. Full interactive lives on description.html.
 */
const WAREHOUSE_URL = "models/full/aerosense_01_warehouse.glb";
const FLY_URL = "models/full/aerosense_fly.glb";
const LOOP = 5.8;
const WING_HZ = 12;
const CLEAR = 0xcfc3b4;
const CLEAR_SCAN = 0xa8b2aa;
const FOG = 0xd4c6b4;
const FOG_SCAN = 0x9aa8a0;
const FALLBACK_PATH = [
  [-0.1, 1.35, -4.0],
  [0.0, 1.18, -1.35],
  [0.28, 1.1, 0.2],
  [0.55, 1.08, 1.08]
];

function qs(sel, ctx) {
  return (ctx || document).querySelector(sel);
}

function qsa(sel, ctx) {
  return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
}

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function damp(c, t, lambda, dt) {
  return c + (t - c) * (1 - Math.exp(-lambda * dt));
}

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (err) {
    return false;
  }
}

function nameOf(obj) {
  return obj && obj.name ? String(obj.name) : "";
}

function loadGltf(loader, url) {
  return new Promise(function (resolve, reject) {
    loader.load(url, resolve, undefined, reject);
  });
}

function findNamed(root, names) {
  let found = null;
  root.traverse(function (obj) {
    if (found) return;
    const n = nameOf(obj);
    for (let i = 0; i < names.length; i++) {
      if (n === names[i] || n.indexOf(names[i]) === 0) {
        found = obj;
        return;
      }
    }
  });
  return found;
}

function worldPos(obj, target) {
  const v = target;
  if (!obj) return v.set(0, 1.1, 0);
  obj.updateWorldMatrix(true, false);
  obj.getWorldPosition(v);
  return v;
}

function extractPath(THREE, root) {
  const pts = [];
  const keys = ["PATH_START", "STAGE_ANCHOR_01", "VOC_SOURCE_ANCHOR", "PATH_TARGET"];
  const tmp = new THREE.Vector3();
  root.updateWorldMatrix(true, true);
  keys.forEach(function (key) {
    const obj = findNamed(root, [key]);
    if (!obj) return;
    worldPos(obj, tmp);
    if (!pts.length || pts[pts.length - 1].distanceTo(tmp) > 0.08) pts.push(tmp.clone());
  });
  const mesh = findNamed(root, ["FLIGHT_PATH_01"]);
  if (pts.length < 2 && mesh) {
    mesh.traverse(function (child) {
      if (!child.isMesh || !child.geometry) return;
      const pos = child.geometry.getAttribute("position");
      if (!pos || pos.count < 4) return;
      const step = Math.max(1, Math.floor(pos.count / 6));
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i);
        child.localToWorld(v);
        pts.push(v.clone());
      }
    });
    pts.sort(function (a, b) {
      return a.z - b.z;
    });
  }
  if (pts.length < 2) {
    return FALLBACK_PATH.map(function (p) {
      return new THREE.Vector3(p[0], p[1], p[2]);
    });
  }
  if (pts[pts.length - 1].z < pts[0].z) pts.reverse();
  return pts;
}

function tagGuides(root) {
  const mats = [];
  root.traverse(function (obj) {
    const n = nameOf(obj);
    if (!/ODOR_GUIDE|VOC_SOURCE|TARGET_EMISSIVE/i.test(n) || !obj.material) return;
    const list = Array.isArray(obj.material) ? obj.material : [obj.material];
    list.forEach(function (mat) {
      if (!mat || mat.userData._teaser) return;
      mat.userData._teaser = true;
      mat.transparent = true;
      const guide = /ODOR_GUIDE/i.test(n);
      mat.userData.baseOpacity = guide ? Math.min(mat.opacity == null ? 1 : mat.opacity, 0.03) : mat.opacity == null ? 1 : mat.opacity;
      mat.opacity = mat.userData.baseOpacity;
      mat.userData.scanOpacity = guide ? 0.46 : 1;
      mat.userData.baseEmissive = mat.emissiveIntensity || 0;
      mat.userData.scanEmissive = guide || /VOC_SOURCE|TARGET_EMISSIVE/i.test(n) ? 1.25 : 0.2;
      if (guide && mat.emissive && mat.emissive.getHex() === 0) mat.emissive.setHex(0x3d8f62);
      mats.push(mat);
    });
  });
  return mats;
}

function hideExtras(root) {
  root.traverse(function (obj) {
    const n = nameOf(obj);
    if (/^FLIGHT_PATH/.test(n) || /Drosophila/i.test(n) || /MembraneRing|DecodeCurve/i.test(n) || obj.isCamera || obj.isLight) obj.visible = false;
  });
}

function packFly(THREE, root) {
  const wingL = findNamed(root, ["WING_LEFT"]);
  const wingR = findNamed(root, ["WING_RIGHT"]);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  root.rotateY(Math.PI);
  const wrap = new THREE.Group();
  wrap.add(root);
  wrap.scale.setScalar(0.95 / maxDim);
  return { root: wrap, wingLeft: wingL, wingRight: wingR };
}

(function init() {
  const root = qs("[data-signal-teaser]");
  if (!root) return;

  const sceneEl = qs("[data-teaser-scene]", root);
  const glHost = qs("[data-teaser-gl]", root);
  const still = qs("[data-teaser-still]", root);
  const lines = qsa("[data-teaser-line]", root);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 720;

  function setLine(index) {
    lines.forEach(function (el, i) {
      el.classList.toggle("is-on", i === index);
    });
  }

  function useStill() {
    root.classList.add("is-still");
    root.classList.add("is-paused");
    if (still) {
      still.hidden = false;
      if (!still.getAttribute("src")) {
        const src = still.getAttribute("data-teaser-src");
        if (src) still.src = src;
      }
    }
    setLine(0);
  }

  if (reduce || !hasWebGL()) {
    useStill();
    return;
  }

  let started = false;
  let running = false;
  let hidden = document.hidden;
  let inView = false;
  let raf = 0;
  let last = 0;
  let time = 0;
  let renderer = null;
  let scene = null;
  let camera = null;
  let hemi = null;
  let keyLight = null;
  let fill = null;
  let fly = null;
  let path = null;
  let scanMats = [];
  let target = null;
  const _pos = { x: 0, y: 0, z: 0 };
  let THREE = null;
  const camPos = { x: 0, y: 2.2, z: -6 };
  const look = { x: 0, y: 1.2, z: 0 };
  let vecPos = null;
  let vecTan = null;
  let vecLook = null;
  let col = null;

  function lineFromTime(t) {
    const u = t % LOOP;
    if (u < 1.35) return 0;
    if (u < 2.7) return 1;
    if (u < 4.15) return 2;
    return 3;
  }

  function resize() {
    if (!renderer || !camera || !sceneEl) return;
    const w = Math.max(1, sceneEl.clientWidth);
    const h = Math.max(1, sceneEl.clientHeight);
    camera.aspect = w / h;
    camera.fov = mobile ? 48 : 42;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
  }

  function applyScan(scan) {
    hemi.color.setHex(0xf4ead8).lerp(col.setHex(0xc5d4d0), scan * 0.35);
    hemi.groundColor.setHex(0x5a4638).lerp(col.setHex(0x3a4a46), scan * 0.4);
    keyLight.color.setHex(0xffe6c4).lerp(col.setHex(0xc8ddd4), scan * 0.4);
    keyLight.intensity = lerp(1.02, 0.84, scan);
    scene.background.setHex(CLEAR).lerp(col.setHex(CLEAR_SCAN), scan);
    scene.fog.color.setHex(FOG).lerp(col.setHex(FOG_SCAN), scan);
    renderer.setClearColor(scene.background.getHex(), 1);
    root.classList.toggle("is-scan", scan > 0.18);
    scanMats.forEach(function (m) {
      m.opacity = lerp(m.userData.baseOpacity, m.userData.scanOpacity, scan);
      if (m.emissiveIntensity != null) m.emissiveIntensity = lerp(m.userData.baseEmissive, m.userData.scanEmissive, scan);
    });
  }

  function tick(now) {
    if (!running) {
      raf = 0;
      return;
    }
    if (!last) last = now;
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    time += dt;
    const u = (time % LOOP) / LOOP;
    const scan = smoothstep(0.34, 0.52, u) * (1 - smoothstep(0.88, 0.98, u) * 0.55);
    path.getPointAt(clamp(u, 0, 0.999), vecPos);
    path.getTangentAt(clamp(u, 0, 0.999), vecTan).normalize();
    const bob = Math.sin(time * 2.3) * 0.018;
    if (fly) {
      fly.root.position.copy(vecPos);
      fly.root.position.y += bob;
      vecLook.copy(vecPos).add(vecTan);
      fly.root.lookAt(vecLook);
      const wing = Math.sin(time * Math.PI * 2 * WING_HZ);
      if (fly.wingLeft) fly.wingLeft.rotation.x = wing * 0.55;
      if (fly.wingRight) fly.wingRight.rotation.x = -wing * 0.55;
    }
    const chase = mobile ? 2.05 : 2.7;
    const height = mobile ? 0.52 : 0.58;
    const desiredX = vecPos.x - vecTan.x * chase;
    const desiredY = vecPos.y + height;
    const desiredZ = vecPos.z - vecTan.z * chase;
    camPos.x = damp(camPos.x, desiredX, 1.55, dt);
    camPos.y = damp(camPos.y, desiredY, 1.4, dt);
    camPos.z = damp(camPos.z, desiredZ, 1.55, dt);
    camera.position.set(camPos.x, camPos.y, camPos.z);
    look.x = vecPos.x + vecTan.x * 0.9;
    look.y = vecPos.y + 0.16;
    look.z = vecPos.z + vecTan.z * 0.9;
    camera.lookAt(look.x, look.y, look.z);
    applyScan(scan);
    setLine(lineFromTime(time));
    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(tick);
  }

  function startLoop() {
    if (running || !renderer) return;
    running = true;
    last = 0;
    raf = window.requestAnimationFrame(tick);
  }

  function stopLoop() {
    running = false;
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function syncPlay() {
    const play = inView && !hidden && started;
    root.classList.toggle("is-paused", !play);
    if (play) startLoop();
    else stopLoop();
  }

  function boot() {
    if (started) return;
    started = true;
    Promise.all([import("./vendor/three.module.js"), import("./vendor/GLTFLoader.js")])
      .then(function (mods) {
        THREE = mods[0];
        const loader = new mods[1].GLTFLoader();
        renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.06;
        renderer.setClearColor(CLEAR, 1);
        renderer.shadowMap.enabled = false;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(CLEAR);
        scene.fog = new THREE.Fog(FOG, 5, 22);
        camera = new THREE.PerspectiveCamera(mobile ? 48 : 42, 1, 0.08, 48);
        hemi = new THREE.HemisphereLight(0xf4ead8, 0x5a4638, 0.78);
        scene.add(hemi);
        keyLight = new THREE.DirectionalLight(0xffe6c4, 1.02);
        keyLight.position.set(4.5, 9, 3.5);
        scene.add(keyLight);
        fill = new THREE.DirectionalLight(0xd4c4a8, 0.26);
        fill.position.set(-5, 3, -3);
        scene.add(fill);
        vecPos = new THREE.Vector3();
        vecTan = new THREE.Vector3();
        vecLook = new THREE.Vector3();
        col = new THREE.Color();
        if (glHost) glHost.appendChild(renderer.domElement);
        renderer.domElement.setAttribute("aria-hidden", "true");
        return Promise.all([
          loadGltf(loader, WAREHOUSE_URL),
          loadGltf(loader, FLY_URL).catch(function () {
            return null;
          })
        ]);
      })
      .then(function (pack) {
        const warehouse = pack[0].scene;
        hideExtras(warehouse);
        scanMats = tagGuides(warehouse);
        scene.add(warehouse);
        const pts = extractPath(THREE, warehouse);
        path = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.12);
        target = findNamed(warehouse, ["VOC_SOURCE_ANCHOR", "VOC_SOURCE_A", "PATH_TARGET"]);
        if (pack[1] && pack[1].scene) {
          fly = packFly(THREE, pack[1].scene);
          if (mobile) fly.root.scale.multiplyScalar(1.2);
          scene.add(fly.root);
        }
        path.getPointAt(0, vecPos);
        camPos.x = vecPos.x;
        camPos.y = vecPos.y + 0.9;
        camPos.z = vecPos.z - 2.4;
        if (still) still.hidden = true;
        root.classList.add("is-live");
        resize();
        syncPlay();
      })
      .catch(function () {
        started = false;
        useStill();
      });
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          inView = entry.isIntersecting;
          if (inView) boot();
          syncPlay();
        });
      },
      { root: null, rootMargin: "240px 0px", threshold: 0.08 }
    );
    io.observe(root);
  } else {
    inView = true;
    boot();
  }

  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (hidden) last = 0;
    syncPlay();
  });
  window.addEventListener("resize", function () {
    if (renderer) resize();
  });
})();
