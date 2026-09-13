/**
 * Follow the Signal — third-person forward-flight interactive on description.html.
 * Conceptual visualization only. Not experimental data.
 */
(function () {
  "use strict";

  var root = document.getElementById("follow-the-signal");
  if (!root) return;

  var NS = "http://www.w3.org/2000/svg";
  var DURATION = 65;
  var MIN_LOCK = 0.12;
  var SCAN_MS = 0.23;
  var WISP_N = 8;

  var STAGES = [
    {
      key: "ODOR PLUME",
      num: "01",
      heading: "Something changes before we see it.",
      chain: "",
      text: "Stored food can release changing volatile patterns.",
      start: 0,
      end: 12
    },
    {
      key: "OLFACTION",
      num: "02",
      heading: "One odor. Many receptors.",
      chain: "",
      text: "Fruit-fly olfaction treats odors as receptor patterns.",
      start: 12,
      end: 22
    },
    {
      key: "RECEPTOR / CELL",
      num: "03",
      heading: "We borrowed the receptor.",
      chain: "OR / Orco  →  HEK293T  →  Ca²⁺  →  GCaMP",
      text: "Living cells translate receptor activation into fluorescence.",
      start: 22,
      end: 34
    },
    {
      key: "READER",
      num: "04",
      heading: "A glow becomes a signal.",
      chain: "LIGHT  →  PD  →  TIA  →  ADC",
      text: "The reader converts a weak optical response into a digital path.",
      start: 34,
      end: 45
    },
    {
      key: "FDM / DLIA",
      num: "05",
      heading: "Find what moves with the signal.",
      chain: "FDM  +  DLIA",
      text: "Lock-in processing is designed to isolate a synchronized component.",
      start: 45,
      end: 55
    },
    {
      key: "DECODER / ACT",
      num: "06",
      heading: "Separate what overlaps.",
      chain: "SENSE  →  READ  →  DECODE  →  ACT",
      text: "A sparse code makes overlapping patterns easier to compare.",
      start: 55,
      end: 65
    }
  ];

  var STAGE_COUNT = STAGES.length;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 720;
  var PARTICLE_N = coarse ? 7 : 12;
  var STREAK_N = coarse ? 8 : 14;
  var CRATE_N = coarse ? 8 : 12;
  var NODE_N = coarse ? 20 : 34;

  var els = {
    journey: root.querySelector("[data-journey]"),
    start: root.querySelector("[data-flight-start]"),
    skip: root.querySelectorAll("[data-journey-skip]"),
    skipped: root.querySelector("[data-journey-skipped]"),
    fallback: root.querySelector("#follow-the-signal-text"),
    dialog: root.querySelector("#follow-the-signal-flight"),
    world: root.querySelector("[data-flight-world]"),
    far: root.querySelector("[data-flight-far]"),
    mid: root.querySelector("[data-flight-mid]"),
    canvas: root.querySelector("[data-flight-canvas]"),
    svgReceptor: root.querySelector("[data-svg-receptor]"),
    svgTraces: root.querySelector("[data-svg-traces]"),
    player: root.querySelector("[data-flight-player]"),
    flyRig: root.querySelector("[data-fly-rig]"),
    pulse: root.querySelector("[data-flight-pulse]"),
    pulseTrail: root.querySelector("[data-pulse-trail]"),
    stage: root.querySelector("[data-flight-stage]"),
    scanStatus: root.querySelector("[data-scan-status]"),
    scanDot: root.querySelector("[data-scan-dot]"),
    scanBtn: root.querySelector("[data-flight-scan]"),
    reticle: root.querySelector("[data-flight-reticle]"),
    sourcesHost: root.querySelector("[data-flight-sources]"),
    callout: root.querySelector("[data-flight-callout]"),
    calloutKicker: root.querySelector("[data-callout-kicker]"),
    calloutLabel: root.querySelector("[data-callout-label]"),
    hint: root.querySelector("[data-steer-hint]"),
    pauseBtn: root.querySelector("[data-flight-pause]"),
    fsBtn: root.querySelector("[data-flight-fs]"),
    exitBtns: root.querySelectorAll("[data-flight-exit]"),
    card: root.querySelector("[data-flight-card]"),
    cardKicker: root.querySelector("[data-card-kicker]"),
    cardHeading: root.querySelector("[data-card-heading]"),
    cardChain: root.querySelector("[data-card-chain]"),
    cardText: root.querySelector("[data-card-text]"),
    pin: root.querySelector("[data-flight-pin]"),
    finale: root.querySelector("[data-flight-finale]"),
    live: root.querySelector("[data-flight-live]"),
    staticNav: root.querySelector("[data-static-nav]"),
    staticPrev: root.querySelector("[data-static-prev]"),
    staticNext: root.querySelector("[data-static-next]"),
    flightRoot: root.querySelector("[data-flight-root]")
  };

  var ctx = els.canvas ? els.canvas.getContext("2d", { alpha: true }) : null;

  var state = {
    open: false,
    running: false,
    raf: 0,
    hidden: false,
    userPaused: false,
    staticMode: false,
    progress: 0,
    time: 0,
    stage: 0,
    last: 0,
    dist: 0,
    playerX: 0,
    vx: 0,
    camX: 0,
    bank: 0,
    lock: 0.42,
    scanHeld: false,
    scanSpace: false,
    scanMouse: false,
    scanPad: false,
    scan: 0,
    keyInput: 0,
    pointerInput: 0,
    mouseArmed: false,
    mouseSteer: 0,
    pointer: null,
    drift: 0,
    speedMul: 1,
    cardUntil: 0,
    cardShown: -1,
    hintTimer: 0,
    vw: 1,
    vh: 1,
    dpr: 1,
    focal: 340,
    horizon: 0,
    particles: [],
    streaks: [],
    crates: [],
    nodes: [],
    labels: [],
    wisps: [],
    sources: [],
    primarySource: null
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(a, b, x) {
    if (b === a) return x >= b ? 1 : 0;
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function layerAlpha(p, inS, inE, outS, outE) {
    if (p < inS || p > outE) return 0;
    if (p < inE) return smoothstep(inS, inE, p);
    if (p <= outS) return 1;
    return 1 - smoothstep(outS, outE, p);
  }

  function stageFromTime(sec) {
    var i = 0;
    while (i < STAGE_COUNT - 1 && sec >= STAGES[i].end) i += 1;
    return i;
  }

  function primarySource() {
    var i;
    var best = null;
    for (i = 0; i < state.sources.length; i++) {
      var s = state.sources[i];
      if (s.z < 90 || s.z > 1100) continue;
      if (!best || (s.strong && !best.strong) || (s.strong === best.strong && s.z < best.z)) best = s;
    }
    state.primarySource = best || state.sources[0] || { x: 0.16, y: 0.22, z: 640, strong: true };
    return state.primarySource;
  }

  function plumeX(z, t) {
    var src = primarySource();
    var along = clamp((src.z - z) / 720, 0, 1);
    var u = z * 0.0062;
    var meander =
      Math.sin(u + t * 0.31) * 0.22 +
      Math.sin(u * 0.41 + t * 0.13) * 0.12 +
      Math.sin(u * 0.13 + t * 0.07) * 0.07 +
      state.drift;
    return src.x + meander * along;
  }

  function plumeY(z) {
    var src = primarySource();
    var along = clamp((src.z - z) / 720, 0, 1);
    return lerp(src.y, 0.12, along);
  }

  function plumeWidth(z, t) {
    return 0.1 + 0.07 * (0.5 + 0.5 * Math.sin(z * 0.0048 + t * 0.21)) + 0.05 * Math.sin(z * 0.011 + 1.7);
  }

  function splitAmt(p) {
    return smoothstep(0.16, 0.28, p) * (1 - smoothstep(0.36, 0.5, p));
  }

  function channelOffset(split, p, z, t) {
    var amt = splitAmt(p);
    if (split === 1) return amt * (0.3 + 0.05 * Math.sin(z * 0.01 + t));
    if (split === 2) return -amt * (0.24 + 0.04 * Math.sin(z * 0.009 + t * 0.8));
    return 0;
  }

  function project(wx, wy, z) {
    var zz = Math.max(z, 0.8);
    var s = state.focal / (state.focal + zz);
    return {
      x: state.vw * 0.5 + (wx - state.camX) * s * state.vw * 0.52,
      y: state.horizon + wy * s * state.vh * 0.58,
      s: s
    };
  }

  function svgEl(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function resize() {
    if (!els.canvas || !ctx) return;
    var w = els.world ? els.world.clientWidth : window.innerWidth;
    var h = els.world ? els.world.clientHeight : window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.vw = w;
    state.vh = h;
    state.dpr = dpr;
    state.focal = Math.max(260, Math.min(w, h) * 0.46);
    state.horizon = h * 0.42;
    if (els.canvas.width !== Math.floor(w * dpr) || els.canvas.height !== Math.floor(h * dpr)) {
      els.canvas.width = Math.floor(w * dpr);
      els.canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedParticle(p, far) {
    p.z = far ? 220 + Math.random() * 700 : Math.random() * 820;
    p.split = 0;
    p.scatterX = (Math.random() - 0.5) * 0.08;
    p.scatterY = (Math.random() - 0.5) * 0.05;
    p.r = 0.7 + Math.random() * 0.9;
    p.a = 0.08 + Math.random() * 0.1;
    p.speed = 0.78 + Math.random() * 0.28;
    p.pulse = false;
    p.kind = 0;
  }

  function seedWorld() {
    var i;
    state.particles = [];
    for (i = 0; i < PARTICLE_N; i++) {
      var p = {};
      seedParticle(p, false);
      state.particles.push(p);
    }
    state.streaks = [];
    for (i = 0; i < STREAK_N; i++) {
      state.streaks.push({
        x: (Math.random() - 0.5) * 1.6,
        y: (Math.random() - 0.35) * 0.9,
        z: Math.random() * 900,
        len: 40 + Math.random() * 90
      });
    }
    state.crates = [];
    for (i = 0; i < CRATE_N; i++) {
      var side = i % 2 === 0 ? -1 : 1;
      state.crates.push({
        type: i % 3 === 0 ? "sack" : i % 3 === 1 ? "shelf" : "crate",
        x: side * (0.82 + Math.random() * 0.55),
        y: 0.28 + Math.random() * 0.32,
        z: Math.random() * 1400,
        w: 0.18 + Math.random() * 0.16,
        h: 0.16 + Math.random() * 0.22,
        d: 70 + Math.random() * 90
      });
    }
    state.nodes = [];
    for (i = 0; i < NODE_N; i++) {
      state.nodes.push({
        x: (Math.random() - 0.5) * 1.35,
        y: (Math.random() - 0.5) * 0.85,
        z: 80 + Math.random() * 1000,
        active: i % 7 === 0 || i % 11 === 0,
        link: Math.floor(Math.random() * NODE_N)
      });
    }
    state.wisps = [];
    for (i = 0; i < WISP_N; i++) {
      state.wisps.push({
        offX: (i - 3.5) * 0.028 + (Math.random() - 0.5) * 0.02,
        offY: (Math.random() - 0.5) * 0.05,
        phase: i * 0.9,
        span: 0.55 + Math.random() * 0.35
      });
    }
    state.sources = [
      { strong: true, x: 0.2, y: 0.24, z: 620, w: 0.15, h: 0.2, eyebrow: "HEADSPACE", label: "VOC pattern" },
      { strong: false, x: -0.46, y: 0.28, z: 860, w: 0.12, h: 0.18, eyebrow: "", label: "" },
      { strong: false, x: 0.5, y: 0.3, z: 1040, w: 0.13, h: 0.16, eyebrow: "ODOR SIGNAL", label: "VOC pattern" }
    ];
    if (els.sourcesHost) {
      els.sourcesHost.innerHTML = "";
      for (i = 0; i < state.sources.length; i++) {
        var el = document.createElement("span");
        el.className = "flight__source" + (state.sources[i].strong ? " flight__source--strong" : "");
        els.sourcesHost.appendChild(el);
        state.sources[i].el = el;
      }
    }
    state.labels = [
      { at: 0.2, text: "RECEPTOR CHANNELS", x: 0.18, y: -0.28, z0: 520 },
      { at: 0.36, text: "OR / Orco", x: -0.22, y: -0.18, z0: 420 },
      { at: 0.4, text: "HEK293T", x: 0.26, y: 0.08, z0: 360 },
      { at: 0.44, text: "Ca²⁺", x: -0.08, y: -0.02, z0: 280 },
      { at: 0.47, text: "GCaMP", x: 0.16, y: 0.16, z0: 220 },
      { at: 0.55, text: "LIGHT", x: -0.2, y: -0.22, z0: 480 },
      { at: 0.6, text: "PD", x: 0.18, y: -0.1, z0: 360 },
      { at: 0.64, text: "TIA", x: -0.16, y: 0.12, z0: 280 },
      { at: 0.68, text: "ADC", x: 0.22, y: 0.18, z0: 200 },
      { at: 0.78, text: "FDM + DLIA", x: -0.28, y: -0.3, z0: 420 },
      { at: 0.9, text: "SPARSE CODE", x: 0.2, y: -0.24, z0: 380 }
    ];
  }

  function buildSvg() {
    if (els.svgReceptor) {
      while (els.svgReceptor.firstChild) els.svgReceptor.removeChild(els.svgReceptor.firstChild);
      els.svgReceptor.appendChild(
        svgEl("path", { d: "M42,78 C36,52 30,38 28,22", "stroke-linecap": "round" })
      );
      els.svgReceptor.appendChild(
        svgEl("path", { d: "M50,80 C50,54 58,40 72,24", "stroke-linecap": "round" })
      );
      els.svgReceptor.appendChild(
        svgEl("path", { d: "M58,76 C62,50 78,36 86,30", "stroke-linecap": "round" })
      );
      els.svgReceptor.appendChild(svgEl("circle", { cx: "28", cy: "20", r: "1.6" }));
      els.svgReceptor.appendChild(svgEl("circle", { cx: "72", cy: "22", r: "1.6" }));
      els.svgReceptor.appendChild(svgEl("circle", { cx: "86", cy: "29", r: "1.5" }));
    }
    if (els.svgTraces) {
      while (els.svgTraces.firstChild) els.svgTraces.removeChild(els.svgTraces.firstChild);
      els.svgTraces.appendChild(svgEl("path", { d: "M8,72 L28,48 L46,48 L62,32 L92,32" }));
      els.svgTraces.appendChild(svgEl("path", { d: "M12,84 L34,62 L58,62 L70,44" }));
      els.svgTraces.appendChild(svgEl("rect", { x: "24", y: "44", width: "7", height: "7" }));
      els.svgTraces.appendChild(svgEl("rect", { x: "58", y: "28", width: "8", height: "7" }));
    }
  }

  function resetState() {
    state.progress = 0;
    state.time = 0;
    state.stage = 0;
    state.last = 0;
    state.dist = 0;
    state.playerX = 0;
    state.vx = 0;
    state.camX = 0;
    state.bank = 0;
    state.lock = 0.42;
    state.scanHeld = false;
    state.scanSpace = false;
    state.scanMouse = false;
    state.scanPad = false;
    state.scan = 0;
    state.keyInput = 0;
    state.pointerInput = 0;
    state.mouseArmed = false;
    state.mouseSteer = 0;
    state.pointer = null;
    state.drift = 0;
    state.speedMul = 1;
    state.cardUntil = 0;
    state.cardShown = -1;
    state.userPaused = false;
    state.staticMode = false;
    if (els.hint) els.hint.classList.remove("is-gone");
    root.querySelectorAll(".flight__hint").forEach(function (el) {
      el.classList.remove("is-gone");
    });
    if (els.finale) els.finale.hidden = true;
    if (els.pin) els.pin.hidden = true;
    if (els.card) {
      els.card.hidden = true;
      els.card.classList.remove("is-in", "flight__card--left", "flight__card--right");
    }
    if (els.staticNav) els.staticNav.hidden = true;
    if (els.pauseBtn) {
      els.pauseBtn.textContent = "Pause";
      els.pauseBtn.setAttribute("aria-pressed", "false");
    }
    if (els.flightRoot) els.flightRoot.classList.remove("is-pulse", "is-scan", "is-signal-player");
    if (els.callout) els.callout.hidden = true;
    if (els.scanBtn) els.scanBtn.setAttribute("aria-pressed", "false");
    seedWorld();
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

  function announce(stage) {
    if (!els.live) return;
    var s = STAGES[stage];
    els.live.textContent = s.heading + " " + s.text;
  }

  function applyStageUi(index, enterCard) {
    var s = STAGES[index];
    if (els.stage) els.stage.textContent = s.num + " / " + s.key;
    if (els.journey) els.journey.setAttribute("data-stage", String(index + 1));
    if (els.cardKicker) els.cardKicker.textContent = s.num + " · " + s.key;
    if (els.cardHeading) els.cardHeading.textContent = s.heading;
    if (els.cardText) els.cardText.textContent = s.text;
    if (enterCard && els.card) {
      var right = plumeX(160, state.time) < 0;
      els.card.hidden = false;
      els.card.classList.remove("is-in", "flight__card--left", "flight__card--right");
      els.card.classList.add(right ? "flight__card--right" : "flight__card--left");
      void els.card.offsetWidth;
      els.card.classList.add("is-in");
      if (els.pin) els.pin.hidden = true;
      state.cardUntil = state.time + 4.2;
      state.cardShown = index;
    }
  }

  function pinCard() {
    if (!els.card || !els.pin) return;
    var s = STAGES[state.stage];
    els.card.hidden = true;
    els.pin.hidden = false;
    els.pin.textContent = s.num + " · " + s.heading;
    els.pin.classList.toggle("flight__pin--right", els.card.classList.contains("flight__card--right"));
    els.pin.classList.toggle("flight__pin--left", els.card.classList.contains("flight__card--left"));
  }

  function inputValue() {
    if (state.pointer && state.pointer.mode === "steer") return state.pointerInput;
    if (state.mouseArmed && Math.abs(state.mouseSteer) > 0.02) return state.mouseSteer;
    return state.keyInput;
  }

  function physics(dt) {
    var t = state.time;
    var p = state.progress;
    state.drift += (Math.sin(t * 0.11) * 0.04 - state.drift) * 0.35 * dt;

    var input = clamp(inputValue(), -1, 1);
    state.vx += input * 4.6 * dt;
    state.vx *= Math.exp(-4.4 * dt);
    state.playerX += state.vx * dt;
    if (state.playerX > 0.82) {
      state.playerX = lerp(state.playerX, 0.82, 0.35);
      if (state.vx > 0) state.vx *= 0.45;
    } else if (state.playerX < -0.82) {
      state.playerX = lerp(state.playerX, -0.82, 0.35);
      if (state.vx < 0) state.vx *= 0.45;
    }
    state.playerX = clamp(state.playerX, -0.9, 0.9);
    state.camX += (state.playerX - state.camX) * (1 - Math.exp(-3.1 * dt));

    var targetBank = clamp(state.vx * 9 + input * 5, -14, 14);
    if (Math.abs(input) < 0.04) targetBank *= 0.35;
    state.bank += (targetBank - state.bank) * (1 - Math.exp(-8 * dt));

    var scanTarget = state.scanHeld ? 1 : 0;
    state.scan += (scanTarget - state.scan) * (1 - Math.exp(-dt / SCAN_MS));
    if (els.flightRoot) els.flightRoot.classList.toggle("is-scan", state.scan > 0.08);
    if (els.scanBtn) els.scanBtn.setAttribute("aria-pressed", state.scanHeld ? "true" : "false");

    var dive = layerAlpha(p, 0.32, 0.4, 0.46, 0.55);
    var endSlow = p > 0.94 ? lerp(1, 0.12, smoothstep(0.94, 1, p)) : 1;
    state.speedMul = (1 + dive * 0.28) * endSlow;
    if (!state.staticMode) {
      state.time = Math.min(DURATION, state.time + dt);
      state.progress = state.time / DURATION;
      state.dist += 430 * state.speedMul * dt;
    }

    var target = plumeX(90, t);
    var dist = Math.abs(state.playerX - target);
    if (dist < 0.11) state.lock += dt * 0.38;
    else if (dist < 0.22) state.lock += dt * 0.05;
    else state.lock -= dt * 0.26;
    state.lock = clamp(state.lock, MIN_LOCK, 1);

    var next = stageFromTime(state.time);
    if (next !== state.stage) {
      state.stage = next;
      applyStageUi(indexSafe(next), true);
      announce(next);
    } else if (state.cardShown === state.stage && state.time > state.cardUntil && !state.staticMode) {
      pinCard();
      state.cardShown = -2;
    }

    if (state.progress >= 0.955 && els.finale) els.finale.hidden = false;
  }

  function indexSafe(i) {
    return clamp(i, 0, STAGE_COUNT - 1);
  }

  function moveParticles(dt) {
    var speed = 430 * state.speedMul;
    var i;
    var p;
    for (i = 0; i < state.particles.length; i++) {
      p = state.particles[i];
      p.z -= speed * p.speed * dt;
      if (p.z < -36) seedParticle(p, true);
    }
    for (i = 0; i < state.streaks.length; i++) {
      p = state.streaks[i];
      p.z -= speed * 1.35 * dt;
      if (p.z < -50) {
        p.z = 700 + Math.random() * 600;
        p.x = (Math.random() - 0.5) * 1.55;
        p.y = (Math.random() - 0.35) * 0.9;
      }
    }
    for (i = 0; i < state.crates.length; i++) {
      p = state.crates[i];
      p.z -= speed * 0.92 * dt;
      if (p.z < -80) {
        p.z += 1400;
        p.x = (i % 2 === 0 ? -1 : 1) * (0.82 + Math.random() * 0.5);
      }
    }
    for (i = 0; i < state.sources.length; i++) {
      p = state.sources[i];
      p.z -= speed * 0.78 * dt;
      if (p.z < 70) p.z += 980;
    }
    var neuralPull = smoothstep(0.82, 0.94, state.progress);
    for (i = 0; i < state.nodes.length; i++) {
      p = state.nodes[i];
      p.z -= speed * (0.7 + neuralPull * 0.5) * dt;
      if (p.z < -40) {
        p.z = 200 + Math.random() * 980;
        p.x = (Math.random() - 0.5) * lerp(1.35, 0.35, smoothstep(0.9, 0.98, state.progress));
      }
    }
  }

  function updateReticle() {
    if (!els.reticle) return;
    els.reticle.classList.toggle("is-near", state.lock > 0.62);
  }

  function updateCssLayers() {
    var p = state.progress;
    var barnA = layerAlpha(p, 0, 0, 0.17, 0.34) + layerAlpha(p, 0.88, 0.94, 1.05, 1.2);
    var barnScale = p < 0.85 ? 1.05 + Math.min(state.dist * 0.000035, 0.22) : lerp(1.24, 1.05, smoothstep(0.88, 1, p));
    if (els.far) {
      els.far.style.opacity = String(clamp(barnA, 0, 1));
      els.far.style.transform = "translateX(" + (-state.camX * 7.5).toFixed(2) + "vw) scale(" + barnScale.toFixed(3) + ")";
    }
    if (els.mid) {
      var show = layerAlpha(p, 0, 0, 0.16, 0.33);
      els.mid.style.opacity = String(show);
      var sils = els.mid.children;
      for (var i = 0; i < sils.length; i++) {
        var depth = 0.4 + i * 0.2;
        var cycle = (state.dist * (0.55 + depth) * 0.0022) % 1;
        var scale = 0.55 + cycle * 1.35;
        var y = (cycle - 0.15) * 10;
        var x = -state.camX * (14 + i * 9);
        sils[i].style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "vh) scale(" + scale.toFixed(3) + ")";
        sils[i].style.opacity = String(show * (0.12 + cycle * 0.5));
      }
    }
    var lead = (state.playerX - state.camX) * state.vw * 0.08;
    var bob = Math.sin(state.time * 2.15) * 4;
    var pitch = clamp((state.speedMul - 1) * 10, -6, 8);
    var flyA = 1 - smoothstep(0.34, 0.43, p);
    var pulseA = smoothstep(0.36, 0.44, p) * (1 - smoothstep(0.92, 0.99, p));
    if (els.player) {
      els.player.style.transform = "translate(calc(-50% + " + lead.toFixed(1) + "px), -50%)";
    }
    if (els.flyRig) {
      els.flyRig.style.transform =
        "rotateZ(" + state.bank.toFixed(2) + "deg) rotateX(" + pitch.toFixed(2) + "deg) translateY(" + bob.toFixed(1) + "px)";
      els.flyRig.style.opacity = String(flyA);
    }
    if (els.pulse) {
      els.pulse.style.opacity = String(pulseA);
      var glow = p < 0.52 ? "#1fd36a" : p < 0.74 ? "#d8d8d2" : "#1fd36a";
      els.pulse.style.background = "radial-gradient(circle, #8affc0 0%, " + glow + " 40%, transparent 70%)";
    }
    if (els.pulseTrail) els.pulseTrail.style.opacity = String(pulseA * 0.7);
    if (els.flightRoot) {
      els.flightRoot.classList.toggle("is-pulse", pulseA > 0.08);
      els.flightRoot.classList.toggle("is-signal-player", pulseA > 0.2 && flyA < 0.55);
    }
    updateSourcesUi();
    if (els.svgReceptor) {
      els.svgReceptor.setAttribute("opacity", String(layerAlpha(p, 0.16, 0.24, 0.32, 0.42) * (0.25 + state.scan * 0.45)));
    }
    if (els.svgTraces) {
      els.svgTraces.setAttribute("opacity", String(layerAlpha(p, 0.5, 0.58, 0.7, 0.8) * (0.18 + state.scan * 0.4)));
    }
  }

  function updateSourcesUi() {
    var barnish = layerAlpha(state.progress, 0, 0, 0.18, 0.34);
    var i;
    var shown = null;
    for (i = 0; i < state.sources.length; i++) {
      var src = state.sources[i];
      if (!src.el) continue;
      var vis = barnish > 0.05 && src.z > 80 && src.z < 980;
      var pt = project(src.x, src.y, src.z);
      src.el.style.display = vis ? "block" : "none";
      src.el.style.left = pt.x.toFixed(1) + "px";
      src.el.style.top = pt.y.toFixed(1) + "px";
      var scale = clamp(pt.s * 4.2, 0.35, 1.4);
      src.el.style.width = (7.2 * scale).toFixed(1) + "vw";
      src.el.style.height = (8.4 * scale).toFixed(1) + "vw";
      if (src.strong && vis && state.scan > 0.45 && Math.abs(pt.x - state.vw * 0.5) < state.vw * 0.28 && src.z < 720) {
        shown = src;
        shown.pt = pt;
      }
    }
    if (els.callout) {
      if (shown && shown.eyebrow) {
        els.callout.hidden = false;
        if (els.calloutKicker) els.calloutKicker.textContent = shown.eyebrow;
        if (els.calloutLabel) els.calloutLabel.textContent = shown.label;
        els.callout.style.left = shown.pt.x.toFixed(1) + "px";
        els.callout.style.top = shown.pt.y.toFixed(1) + "px";
      } else {
        els.callout.hidden = true;
      }
    }
  }

  function tintCanvas() {
    var p = state.progress;
    var a =
      layerAlpha(p, 0.12, 0.24, 0.86, 0.96) * 0.18 +
      layerAlpha(p, 0.34, 0.44, 0.5, 0.62) * 0.12 +
      state.scan * 0.08;
    if (a < 0.01) return;
    var g = ctx.createLinearGradient(0, 0, 0, state.vh);
    g.addColorStop(0, "rgba(22, 40, 36, " + (a * 0.7).toFixed(3) + ")");
    g.addColorStop(0.5, "rgba(245, 245, 241, " + (a * 0.05).toFixed(3) + ")");
    g.addColorStop(1, "rgba(18, 32, 30, " + (a * 0.42).toFixed(3) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.vw, state.vh);
  }

  function drawEllipse(x, y, rx, ry) {
    rx = Math.max(0.5, rx);
    ry = Math.max(0.5, ry);
    if (typeof ctx.ellipse === "function") {
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.restore();
  }

  function drawBox(c) {
    var a = layerAlpha(state.progress, 0, 0, 0.18, 0.36);
    if (a < 0.02) return;
    var f = project(c.x, c.y, c.z);
    var b = project(c.x, c.y, c.z + c.d);
    if (f.s < 0.04 && b.s < 0.04) return;
    var fw = c.w * f.s * state.vw * 0.42;
    var fh = c.h * f.s * state.vh * 0.5;
    var bw = c.w * b.s * state.vw * 0.42;
    var bh = c.h * b.s * state.vh * 0.5;
    ctx.strokeStyle = "rgba(10,10,10," + (0.28 * a).toFixed(3) + ")";
    ctx.lineWidth = Math.max(0.6, 1.2 * f.s);
    ctx.beginPath();
    ctx.rect(f.x - fw, f.y - fh, fw * 2, fh * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(f.x - fw, f.y - fh);
    ctx.lineTo(b.x - bw, b.y - bh);
    ctx.moveTo(f.x + fw, f.y - fh);
    ctx.lineTo(b.x + bw, b.y - bh);
    ctx.moveTo(f.x - fw, f.y + fh);
    ctx.lineTo(b.x - bw, b.y + bh);
    ctx.moveTo(f.x + fw, f.y + fh);
    ctx.lineTo(b.x + bw, b.y + bh);
    ctx.stroke();
  }

  function drawAntenna() {
    var a = layerAlpha(state.progress, 0.14, 0.22, 0.34, 0.46);
    if (a < 0.02) return;
    var approach = smoothstep(0.14, 0.4, state.progress);
    var z0 = lerp(980, 40, approach);
    ctx.save();
    ctx.strokeStyle = "rgba(10,10,10," + (0.55 * a).toFixed(3) + ")";
    ctx.lineWidth = 1.4;
    var k;
    for (k = 0; k < 7; k++) {
      var side = k < 4 ? -1 : 1;
      var z = z0 + k * 36;
      var base = project(0.02 * side, 0.22, z + 90);
      var tip = project(side * (0.18 + k * 0.06), -0.42 - k * 0.04, z);
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.quadraticCurveTo(
        lerp(base.x, tip.x, 0.4),
        lerp(base.y, tip.y, 0.55) - 30 * tip.s,
        tip.x,
        tip.y
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, Math.max(2, 5 * tip.s), 0, Math.PI * 2);
      if (state.scan > 0.3 && (k + Math.floor(state.time * 1.4)) % 3 !== 0) {
        ctx.fillStyle = "rgba(31,211,106," + (0.18 + state.scan * 0.45).toFixed(3) + ")";
        ctx.fill();
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCellAndTraces() {
    var p = state.progress;
    var cellA = layerAlpha(p, 0.3, 0.38, 0.5, 0.62);
    var traceA = layerAlpha(p, 0.48, 0.58, 0.7, 0.8);
    var morph = smoothstep(0.46, 0.6, p);
    var i;
    if (cellA > 0.02) {
      ctx.save();
      ctx.strokeStyle = "rgba(11,107,53," + ((0.2 + state.scan * 0.45) * cellA).toFixed(3) + ")";
      for (i = 0; i < 5; i++) {
        var z = lerp(620 - i * 70, 80, smoothstep(0.3, 0.5, p));
        var c = project(0, 0.02, z);
        var rx = (0.55 - i * 0.05) * c.s * state.vw * lerp(0.7, 0.25, morph);
        var ry = (0.38 - i * 0.03) * c.s * state.vh * lerp(0.55, 0.12, morph);
        ctx.lineWidth = Math.max(0.7, 1.6 * c.s);
        ctx.beginPath();
        drawEllipse(c.x, c.y, Math.max(4, rx), Math.max(3, ry));
        ctx.stroke();
      }
      ctx.restore();
    }
    if (traceA > 0.02) {
      ctx.save();
      ctx.strokeStyle = "rgba(10,10,10," + ((0.22 + state.scan * 0.28) * traceA).toFixed(3) + ")";
      var lanes = [-0.42, -0.18, 0.12, 0.38];
      var j;
      for (i = 0; i < lanes.length; i++) {
        ctx.beginPath();
        var first = true;
        for (j = 0; j <= 18; j++) {
          var zt = 40 + j * 55;
          var wobble = Math.sin(j * 0.7 + state.time * 0.8 + i) * 0.03;
          var pt = project(lanes[i] + wobble, 0.08 * Math.sin(j * 0.4 + i), zt);
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineWidth = 1.1 + i * 0.15;
        ctx.stroke();
      }
      var pads = [
        { x: -0.18, z: 220, label: "PD" },
        { x: 0.12, z: 160, label: "TIA" },
        { x: 0.38, z: 110, label: "ADC" }
      ];
      ctx.font = "11px ui-monospace, Consolas, monospace";
      ctx.fillStyle = "rgba(85,85,85," + ((0.35 + state.scan * 0.55) * traceA).toFixed(3) + ")";
      for (i = 0; i < pads.length; i++) {
        var pad = project(pads[i].x, 0.02, pads[i].z);
        var s = 10 * pad.s + 4;
        ctx.strokeRect(pad.x - s, pad.y - s * 0.7, s * 2, s * 1.4);
        ctx.fillText(pads[i].label, pad.x - 10, pad.y - s * 0.9);
      }
      ctx.restore();
    }
  }

  function drawWaves() {
    var a = layerAlpha(state.progress, 0.68, 0.76, 0.86, 0.94);
    if (a < 0.02) return;
    var lock = state.lock;
    var colors = [
      "rgba(10,10,10,",
      "rgba(106,106,100,",
      "rgba(154,160,148,",
      "rgba(31,211,106,"
    ];
    var i;
    var j;
    for (i = 0; i < 4; i++) {
      var signal = i === 3;
      var op = signal
        ? (0.12 + state.scan * (0.28 + lock * 0.45)) * a
        : (0.22 - lock * 0.16) * a * (1 - state.scan * 0.72);
      if (op < 0.02) continue;
      ctx.beginPath();
      var first = true;
      for (j = 0; j <= 28; j++) {
        var z = 30 + j * 42;
        var amp = (signal ? 0.07 : 0.16) * (signal ? 1 : 1.15 - lock);
        var noise = signal ? 0.01 * (1 - lock) : 0.08 * (1 - lock);
        var x =
          (i - 1.5) * 0.28 +
          Math.sin(j * (0.35 + i * 0.12) + state.time * (1.6 + i * 0.3)) * amp +
          Math.sin(j * 0.9 + state.time * 3 + i) * noise;
        var y = 0.02 + Math.sin(j * 0.2 + i) * 0.08;
        var pt = project(x, y, z);
        if (first) {
          ctx.moveTo(pt.x, pt.y);
          first = false;
        } else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = colors[i] + op.toFixed(3) + ")";
      ctx.lineWidth = signal ? 2.1 : 0.9;
      ctx.stroke();
    }
  }

  function drawNeural() {
    var a = layerAlpha(state.progress, 0.82, 0.88, 0.96, 1.02);
    if (a < 0.02) return;
    var sparse = smoothstep(0.86, 0.94, state.progress);
    var i;
    ctx.save();
    for (i = 0; i < state.nodes.length; i++) {
      var n = state.nodes[i];
      var other = state.nodes[n.link];
      var pa = project(n.x, n.y, n.z);
      if (other && sparse < 0.85) {
        var pb = project(other.x, other.y, other.z);
        ctx.strokeStyle = "rgba(10,10,10," + ((0.18 - sparse * 0.12) * a).toFixed(3) + ")";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
      var on = n.active && (state.scan > 0.35 ? sparse > 0.15 : sparse > 0.55);
      var r = (on ? 4.2 : 2.4) * pa.s + 1;
      ctx.beginPath();
      ctx.arc(pa.x, pa.y, r, 0, Math.PI * 2);
      if (on) {
        ctx.fillStyle = "rgba(31,211,106," + (0.35 + state.lock * 0.5).toFixed(3) + ")";
        ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(10,10,10," + ((0.28 - sparse * 0.18) * a).toFixed(3) + ")";
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function strokeRibbon(points, width, color) {
    if (points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    var i;
    for (i = 1; i < points.length - 1; i++) {
      ctx.quadraticCurveTo(
        points[i].x,
        points[i].y,
        (points[i].x + points[i + 1].x) * 0.5,
        (points[i].y + points[i + 1].y) * 0.5
      );
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function drawPlume() {
    var p = state.progress;
    var fade = (1 - smoothstep(0.88, 0.98, p)) * (0.12 + state.scan * 0.88);
    if (fade < 0.02) return;
    var t = state.time;
    var src = primarySource();
    var zMax = Math.min(980, src.z);
    var zMin = 36;
    var n = 28;
    var points = [];
    var i;
    for (i = 0; i <= n; i++) {
      var z = lerp(zMax, zMin, i / n);
      var wx = plumeX(z, t);
      var wy = plumeY(z) + Math.sin(z * 0.01 + t * 0.4) * 0.02;
      points.push(project(wx, wy, z));
    }
    var near = points[points.length - 1] ? points[points.length - 1].s : 0.2;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    strokeRibbon(points, Math.max(18, 46 * near), "rgba(84, 160, 115, " + (0.055 * fade).toFixed(3) + ")");
    strokeRibbon(points, Math.max(7, 16 * near), "rgba(76, 185, 117, " + (0.1 * fade).toFixed(3) + ")");
    strokeRibbon(points, Math.max(1.2, 3.2 * near), "rgba(123, 215, 157, " + (0.14 * fade).toFixed(3) + ")");
    ctx.restore();

    for (i = 0; i < state.wisps.length; i++) {
      var w = state.wisps[i];
      var wFade = fade * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.7 + w.phase)));
      if (wFade < 0.04) continue;
      var wpts = [];
      var j;
      var start = 0.12 + (i % 3) * 0.08;
      var end = Math.min(0.92, start + w.span);
      for (j = 0; j <= 12; j++) {
        var u = lerp(start, end, j / 12);
        var z2 = lerp(zMax, zMin, u);
        var wx2 = plumeX(z2, t) + w.offX * (0.6 + u);
        var wy2 = plumeY(z2) + w.offY;
        wpts.push(project(wx2, wy2, z2));
      }
      strokeRibbon(wpts, Math.max(1, 3.4 * near), "rgba(110, 186, 140, " + (0.09 * wFade).toFixed(3) + ")");
    }

    for (i = 0; i < state.particles.length; i++) {
      var pt = state.particles[i];
      var wx3 = plumeX(pt.z, t) + pt.scatterX;
      var wy3 = plumeY(pt.z) + pt.scatterY;
      var scr = project(wx3, wy3, pt.z);
      if (scr.x < -20 || scr.x > state.vw + 20) continue;
      var r = pt.r * (0.6 + scr.s * 1.8);
      ctx.fillStyle = "rgba(150, 196, 164, " + (pt.a * fade * 0.55).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawStreaks() {
    var a = 0.18 + state.speedMul * 0.12;
    ctx.strokeStyle = "rgba(245,245,241," + a.toFixed(3) + ")";
    ctx.lineWidth = 1;
    var i;
    for (i = 0; i < state.streaks.length; i++) {
      var s = state.streaks[i];
      var a1 = project(s.x, s.y, s.z);
      var a2 = project(s.x, s.y, s.z + s.len);
      ctx.globalAlpha = 0.22 * a1.s + 0.05;
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawLabels() {
    if (state.scan < 0.25) return;
    var p = state.progress;
    ctx.font = "12px ui-monospace, Consolas, monospace";
    ctx.textAlign = "left";
    var i;
    for (i = 0; i < state.labels.length; i++) {
      var lb = state.labels[i];
      var vis = layerAlpha(p, lb.at, lb.at + 0.04, lb.at + 0.08, lb.at + 0.14) * state.scan;
      if (vis < 0.05) continue;
      var z = lb.z0 - (p - lb.at) * 1400;
      var pt = project(lb.x, lb.y, Math.max(40, z));
      ctx.fillStyle = "rgba(245,245,241," + (vis * 0.9).toFixed(3) + ")";
      ctx.fillText(lb.text, pt.x, pt.y);
    }
  }

  function drawDissolve() {
    var win = smoothstep(0.34, 0.4, state.progress) * (1 - smoothstep(0.44, 0.52, state.progress));
    if (win < 0.02) return;
    var cx = state.vw * 0.5 + (state.playerX - state.camX) * 40;
    var cy = state.vh * 0.7;
    ctx.strokeStyle = "rgba(31,211,106," + (0.35 * win).toFixed(3) + ")";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx - 6, cy - 26);
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx + 6, cy - 22);
    ctx.stroke();
  }

  function render() {
    if (!ctx) return;
    resize();
    ctx.clearRect(0, 0, state.vw, state.vh);
    tintCanvas();
    var barnish = layerAlpha(state.progress, 0, 0, 0.2, 0.36);
    var i;
    if (barnish > 0.02) {
      for (i = 0; i < state.crates.length; i++) drawBox(state.crates[i]);
    }
    drawAntenna();
    drawPlume();
    drawStreaks();
    drawDissolve();
    drawCellAndTraces();
    drawWaves();
    drawNeural();
    drawLabels();
    updateCssLayers();
    updateReticle();
  }

  function tick(now) {
    if (!state.open || state.userPaused || state.hidden || state.staticMode) {
      state.running = false;
      state.raf = 0;
      return;
    }
    if (!state.last) state.last = now;
    var dt = clamp((now - state.last) / 1000, 0, 0.05);
    state.last = now;
    physics(dt);
    moveParticles(dt);
    render();
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

  function goStaticStage(index) {
    index = indexSafe(index);
    state.stage = index;
    state.time = STAGES[index].start + 0.6;
    state.progress = state.time / DURATION;
    state.dist = 180 + index * 220;
    applyStageUi(index, true);
    if (els.finale) els.finale.hidden = index !== STAGE_COUNT - 1;
    if (els.pin) els.pin.hidden = true;
    announce(index);
    render();
  }

  function closeFlight() {
    if (!state.open && !(els.dialog && els.dialog.open)) {
      if (els.start) els.start.focus();
      return;
    }
    state.open = false;
    stopLoop();
    state.keyInput = 0;
    state.scanHeld = false;
    state.scanSpace = false;
    state.scanMouse = false;
    state.scanPad = false;
    state.mouseArmed = false;
    state.pointer = null;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    }
    if (els.dialog) {
      if (typeof els.dialog.close === "function" && els.dialog.open) {
        try {
          els.dialog.close();
        } catch (err) {
          els.dialog.removeAttribute("open");
        }
      } else {
        els.dialog.removeAttribute("open");
        els.dialog.classList.remove("is-fallback");
      }
    }
    if (els.start) els.start.focus();
  }

  function openFlight() {
    resetState();
    state.open = true;
    state.staticMode = reduceMotion;
    resize();
    if (els.dialog) {
      if (typeof els.dialog.showModal === "function") {
        try {
          els.dialog.showModal();
        } catch (err) {
          els.dialog.setAttribute("open", "");
          els.dialog.classList.add("is-fallback");
        }
      } else {
        els.dialog.setAttribute("open", "");
        els.dialog.classList.add("is-fallback");
      }
      if (els.world && els.world.focus) {
        try {
          els.world.focus({ preventScroll: true });
        } catch (err2) {
          els.world.focus();
        }
      }
    }
    applyStageUi(0, true);
    announce(0);
    render();
    if (state.staticMode) {
      if (els.staticNav) els.staticNav.hidden = false;
      root.querySelectorAll(".flight__hint").forEach(function (el) {
        el.classList.add("is-gone");
      });
      if (els.pauseBtn) els.pauseBtn.hidden = true;
      goStaticStage(0);
    } else {
      if (els.pauseBtn) els.pauseBtn.hidden = false;
      startLoop();
      window.clearTimeout(state.hintTimer);
      state.hintTimer = window.setTimeout(function () {
        root.querySelectorAll(".flight__hint").forEach(function (el) {
          el.classList.add("is-gone");
        });
      }, 3500);
    }
  }

  function skipJourney() {
    if (els.journey) els.journey.classList.add("is-skipped");
    if (els.fallback) els.fallback.setAttribute("open", "");
    if (els.skipped) els.skipped.focus();
    if (state.open) closeFlight();
  }

  function keyCodeSteer(key, down) {
    var v = 0;
    if (key === "ArrowLeft" || key === "a" || key === "A") v = -1;
    if (key === "ArrowRight" || key === "d" || key === "D") v = 1;
    if (!v) return false;
    if (down) state.keyInput = v;
    else if (state.keyInput === v) state.keyInput = 0;
    return true;
  }

  function onKeyDown(event) {
    if (!state.open) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    var tag = event.target && event.target.tagName;
    var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (event.target && event.target.isContentEditable);
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
    if (keyCodeSteer(event.key, true)) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.preventDefault();
    }
  }

  function onKeyUp(event) {
    if (!state.open) return;
    if (event.key === " " ) {
      state.scanSpace = false;
      refreshScanHeld();
    }
    keyCodeSteer(event.key, false);
  }

  function pointerFromEvent(event) {
    var rect = els.world.getBoundingClientRect();
    return {
      x: event.clientX,
      y: event.clientY,
      nx: (event.clientX - rect.left) / (rect.width || 1),
      ny: (event.clientY - rect.top) / (rect.height || 1)
    };
  }

  function onPointerDown(event) {
    if (!state.open || !els.world) return;
    if (event.target && event.target.closest && event.target.closest("button, a, summary")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    var pt = pointerFromEvent(event);
    state.mouseArmed = event.pointerType !== "touch";
    if (event.pointerType === "mouse") {
      state.scanMouse = true;
      refreshScanHeld();
    }
    state.pointer = {
      id: event.pointerId,
      x: pt.x,
      y: pt.y,
      mode: "pending"
    };
    if (event.pointerType === "mouse") {
      state.mouseSteer = clamp((pt.nx - 0.5) / 0.32, -1, 1);
    }
  }

  function onPointerMove(event) {
    if (!state.open) return;
    if (state.mouseArmed && event.pointerType === "mouse" && (!state.pointer || state.pointer.mode !== "steer")) {
      if (event.target && event.target.closest && event.target.closest("button, a")) return;
      var rect = els.world.getBoundingClientRect();
      var nx = (event.clientX - rect.left) / (rect.width || 1);
      state.mouseSteer = clamp((nx - 0.5) / 0.32, -1, 1);
    }
    if (!state.pointer || event.pointerId !== state.pointer.id) return;
    var dx = event.clientX - state.pointer.x;
    var dy = event.clientY - state.pointer.y;
    if (state.pointer.mode === "pending") {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.15) {
        state.pointer.mode = "ignore";
        return;
      }
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.1) {
        state.pointer.mode = "steer";
        if (els.world.setPointerCapture) els.world.setPointerCapture(event.pointerId);
        els.world.classList.add("is-steering");
      }
    }
    if (state.pointer.mode === "steer") {
      event.preventDefault();
      var r = els.world.getBoundingClientRect();
      state.pointerInput = clamp(dx / (r.width * 0.2), -1, 1);
      if (event.pointerType === "mouse") {
        state.mouseSteer = clamp(((event.clientX - r.left) / r.width - 0.5) / 0.32, -1, 1);
      }
    }
  }

  function onPointerUp(event) {
    if (event.pointerType === "mouse") {
      state.scanMouse = false;
      state.mouseArmed = false;
      state.mouseSteer = 0;
      refreshScanHeld();
    }
    if (!state.pointer || event.pointerId !== state.pointer.id) return;
    state.pointer = null;
    state.pointerInput = 0;
    if (els.world) els.world.classList.remove("is-steering");
  }

  function bind() {
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
      var releaseScan = function () {
        state.scanPad = false;
        refreshScanHeld();
      };
      els.scanBtn.addEventListener("pointerup", releaseScan);
      els.scanBtn.addEventListener("pointercancel", releaseScan);
      els.scanBtn.addEventListener("lostpointercapture", releaseScan);
    }
    if (els.pauseBtn) {
      els.pauseBtn.addEventListener("click", function () {
        setPaused(!state.userPaused);
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
    if (els.staticPrev) {
      els.staticPrev.addEventListener("click", function () {
        goStaticStage(state.stage - 1);
      });
    }
    if (els.staticNext) {
      els.staticNext.addEventListener("click", function () {
        if (state.stage >= STAGE_COUNT - 1) {
          if (els.finale) els.finale.hidden = false;
        } else goStaticStage(state.stage + 1);
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
      els.world.addEventListener("lostpointercapture", onPointerUp);
    }
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("resize", function () {
      if (state.open) {
        resize();
        render();
      }
    });
    document.addEventListener("visibilitychange", function () {
      state.hidden = document.hidden;
      if (document.hidden) {
        state.last = 0;
      } else if (state.open && !state.userPaused && !state.staticMode) {
        startLoop();
      }
    });
    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var onMotion = function () {
      reduceMotion = motion.matches;
      if (els.journey) els.journey.classList.toggle("is-reduced", reduceMotion);
      if (els.start) els.start.textContent = reduceMotion ? "View journey" : "Start flight";
    };
    if (motion.addEventListener) motion.addEventListener("change", onMotion);
    else if (motion.addListener) motion.addListener(onMotion);
    onMotion();
  }

  buildSvg();
  bind();
})();
