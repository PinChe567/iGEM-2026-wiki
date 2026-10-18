
/* ==========================================================================
   AeroSense · Homepage cinematic intro — controller
   --------------------------------------------------------------------------
   Progressive enhancement. Without JS (or with prefers-reduced-motion) the
   section shows a static story (keyframes + text). With JS it becomes a
   sticky, scroll-scrubbed film with an "AeroSense lens".

   MEDIA TRANSPORT
   - Video is loaded only inside official video.igem.org embeds.
   - The embed API seeks both layers and returns JPEG snapshots. The visible
     canvas swaps the pair together; moving the lens never fetches more frames.
   - PeerTube does not expose decoded-frame timestamps or a seeked event.
     Capture stabilization is best effort, not a frame-accuracy guarantee.

   No globals are created. A debug accessor is attached to the section
   element (section.ascDebug()) for automated QA.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-asc]');
  if (!root) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // Reduced motion → keep the static story (CSS shows it). Nothing to load.
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (reduce.matches || (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType)))) {
    root.classList.add('is-static');
    reduce.addEventListener && reduce.addEventListener('change', function () { if (!reduce.matches) location.reload(); });
    return;
  }

  var $ = function (sel, el) { return (el || root).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };

  /* ---------- defaults (overwritten by homepage_animation/media/timeline.json) */
  var TL = {
    fps: 30,
    frames: 660,
    duration: 22,
    shots: [
      { t0: 0, t1: 3, title: 'The world looks normal' },
      { t0: 3, t1: 6, title: 'Invisible change' },
      { t0: 6, t1: 9, title: 'Follow the signal' },
      { t0: 9, t1: 12, title: 'We borrowed a nose' },
      { t0: 12, t1: 15, title: 'A glow is not yet a measurement' },
      { t0: 15, t1: 18, title: 'The odor is a pattern' },
      { t0: 18, t1: 21, title: 'Back to the real world' },
      { t0: 21, t1: 22, title: 'Final statement' }
    ],
    web: {
      scrollMap: [[0.9, 2.2, 1], [2.2, 3.4, 2.6], [3.4, 20.6, 1], [20.6, 22, 2.8]],
      lensFull: [6.25, 18.55],
      cta: [2.15, 3.9],
      labels: { shift: [3.7, 6.3], screen: [19.0, 21.1] }
    }
  };
  // Dark-toned stretches of the film (copy switches to light ink).
  var DARK = [[13.55, 18.35], [21.15, 99]];
  var FINAL_T = 21.1;

  /* ---------- elements */
  var track = $('[data-asc-track]');
  var stage = $('[data-asc-stage]');
  var canvas = $('[data-asc-canvas]');
  var ctx = canvas.getContext('2d', { alpha: false });
  // Keep paired pictures on separate visible layers. CSS moves the circular
  // reveal without redrawing or resampling either video on pointer movement.
  var sensorCanvas = document.createElement('canvas');
  sensorCanvas.className = 'asc-sensor-canvas';
  sensorCanvas.setAttribute('aria-hidden', 'true');
  sensorCanvas.hidden = true;
  canvas.after(sensorCanvas);
  var sensorDisplayContext = sensorCanvas.getContext('2d', { alpha: false });
  var vN = $('[data-asc-video="normal"]');
  var vS = $('[data-asc-video="sensor"]');
  var normalFrame = document.createElement('canvas');
  var sensorFrame = document.createElement('canvas');
  var normalContext = normalFrame.getContext('2d', { alpha: false });
  var sensorContext = sensorFrame.getContext('2d', { alpha: false });
  var lastCompositeKey = '';
  function snapshot(picture, buffer) {
    if (buffer.width !== picture.width) buffer.width = picture.width;
    if (buffer.height !== picture.height) buffer.height = picture.height;
    (buffer === normalFrame ? normalContext : sensorContext).drawImage(picture, 0, 0);
  }
  var lensEl = $('[data-asc-lens]');
  var tagsEl = $('[data-asc-tags]');
  var tags = $$('.asc-tag', tagsEl);
  var beats = $$('.asc-beat');
  var steps = $$('.asc-step');
  // Short word groups make entrances readable; existing line breaks and the
  // screen-reader transcript remain intact. No per-letter animation or filters.
  beats.forEach(function (beat, index) {
    beat.dataset.motion = ['rise', 'question', 'reveal', 'drift', 'rise', 'signal', 'reveal', 'rise', 'drift', 'signal', 'reveal', 'final'][index];
    var wordIndex = 0;
    $$('.asc-line,.asc-ask,.asc-step,.asc-final', beat).forEach(function (line) {
      Array.from(line.childNodes).forEach(function (node) {
        if (node.nodeType !== 3) return;
        var fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (word) {
          if (!word.trim()) { fragment.appendChild(document.createTextNode(word)); return; }
          var span = document.createElement('span');
          span.className = 'asc-word'; span.textContent = word;
          span.style.setProperty('--word-delay', Math.min(wordIndex++, 7) * 38 + 'ms');
          if (/changed|chemistry|receptor|receptors|GCaMP|glows|glow|pattern|sooner|misses/i.test(word)) span.classList.add('asc-word--key');
          fragment.appendChild(span);
        });
        node.replaceWith(fragment);
      });
    });
  });
  var ctaEl = $('[data-asc-cta]');
  // PRODUCT_DOCK: a single product control travels from the story to its dock.
  var dock = $('[data-asc-dock]');
  var ctaNote = $('[data-asc-cta-note]');
  // The invitation spans the scene: its arrow begins near the centre and ends
  // at the real product control, independent of the note's responsive width.
  var productPointer = ctaNote.querySelector('.asc-product-pointer');
  if (productPointer) stage.appendChild(productPointer);
  var controls = $('[data-asc-controls]');
  var useBtn = $('[data-asc-use]');
  var useLabel = $('[data-asc-use-label]');
  var revealBtn = $('[data-asc-reveal]');
  var hint = $('[data-asc-hint]');
  
  var chapter = $('[data-asc-chapter]');
  var live = $('[data-asc-live]');

  root.classList.add('is-cinematic');
  controls.hidden = false;

  var reading = false;
  var productPause = { time: 2.8, state: 'armed', entered: 0, lastWheel: -Infinity, previousTime: null, touch: null };
  // A reading deep link must not be pulled back through the opening's pause.
  var directReadingTarget = null;
  try {
    var requestedSection = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (requestedSection && requestedSection.closest('.home-after')) directReadingTarget = requestedSection;
  } catch (_) { /* A malformed fragment is not a reading target. */ }
  var directReadingPending = !!directReadingTarget;
  $('[data-asc-read]').addEventListener('click', function () { showStory(); });
  $('[data-asc-replay]').addEventListener('click', function () {
    reading = false;
    if (failedLayers.normal) mediaLayout = '';
    productPause.state = 'armed';
    productPause.previousTime = null;
    root.classList.remove('is-reading');
    measure();
    root.scrollIntoView({ behavior: 'instant', block: 'start' });
    useBtn.focus({ preventScroll: true });
    setRunning(true);
  });
  function showStory() {
    if (reading) return;
    productPause.state = 'passed';
    reading = true;
    setMode('off', 'pointer');
    setRunning(false);
    root.classList.add('is-reading');
    document.body.classList.remove('asc-in-film', 'asc-lens-active');
    var story = $('[data-asc-static]');
    story.scrollIntoView({ behavior: 'instant', block: 'start' });
    story.focus({ preventScroll: true });
  }
  function mediaUnavailable() {
    root.classList.add('is-media-error');
    productPause.state = 'passed';
    // A delayed media failure must never collapse thousands of pixels above
    // someone already reading the project, or focus the film behind them.
    var view = stage.getBoundingClientRect();
    if (!document.hidden && view.top < window.innerHeight * 0.5 && view.bottom > window.innerHeight * 0.5) showStory();
  }
  reduce.addEventListener('change', function () { if (reduce.matches) showStory(); });

  /* ---------- state */
  var st = {
    layout: '',
    ready: { normal: false, sensor: false },
    tTarget: 0,
    t: -1, // snaps to the scroll position on the first frame (no flash through the fade-in)
    frameWanted: 0,
    frameShown: -1,
    seek: null, // { frame, pending, started }
    dirty: true,
    mode: 'off', // off | lens | full
    pointerIn: false,
    touchHold: false,
    hold: false,
    px: 0, py: 0, // pointer target (stage px)
    lx: 0, ly: 0, // smoothed lens centre
    r: 0, // current lens radius (stage px)
    tracks: null,
    w: 0, h: 0, dpr: 1,
    running: false,
    lastNow: 0,
    videoW: 1920, videoH: 1080,
    fallback: false
  };

  /* ---------- helpers */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function inWin(t, w) { return t >= w[0] && t <= w[1]; }
  function isTouch() { return !finePointer.matches; }

  function announce(msg) {
    if (!live) return;
    live.textContent = '';
    window.setTimeout(function () { live.textContent = msg; }, 30);
  }

  /* ---------- layout / sizing */
  var pacingViewport = { width: 0, height: 0, stageHeight: 0 };
  var geometry = { trackTop: 0, span: 1, top: 0, dockX: 0, dockY: 0, buttonW: 1, buttonH: 1 };
  function measure() {
    var header = document.querySelector('.site-header');
    var top = header ? Math.round(header.getBoundingClientRect().height) : 0;
    root.style.setProperty('--asc-top', top + 'px');
    var rect = stage.getBoundingClientRect();
    st.w = Math.max(1, rect.width);
    st.h = Math.max(1, rect.height);
    // A high-DPI canvas cannot recover detail from the official rendition.
    // Keep touch devices especially lightweight.
    st.dpr = Math.min(window.devicePixelRatio || 1, finePointer.matches ? 1.5 : 1.25);
    var cw = Math.round(st.w * st.dpr);
    var ch = Math.round(st.h * st.dpr);
    // Match the source's pixel budget rather than repainting an oversized
    // retina canvas. CSS still fills the viewport at every aspect ratio.
    var canvasMaxWidth = st.w / st.h < 0.9 ? 720 : 1280;
    var k = Math.min(1, canvasMaxWidth / cw, Math.sqrt(1280 * 720 / (cw * ch)));
    canvas.width = Math.round(cw * k);
    canvas.height = Math.round(ch * k);
    sensorCanvas.width = canvas.width;
    sensorCanvas.height = canvas.height;
    lastCompositeKey = '';
    st.canvasScale = canvas.width / st.w;
    // Keep the long track fixed through mobile address-bar height changes.
    // Changing it above a reader could otherwise move later chapters by hundreds of pixels.
    if (!pacingViewport.height || Math.abs(window.innerWidth - pacingViewport.width) > 2) {
      pacingViewport = { width: window.innerWidth, height: window.innerHeight, stageHeight: st.h };
    }
    var vh = pacingViewport.height;
    var pacedStage = pacingViewport.stageHeight;
    var scrollSpan = Math.max(1, vh * (st.w < pacedStage ? 7.2 : 6.4) - pacedStage) / (0.8 * 0.7);
    root.style.setProperty('--asc-track', Math.round(pacedStage + scrollSpan) + 'px');
    var layout = st.w / st.h < 0.9 ? 'portrait' : 'landscape';
    st.layout = layout;
    cacheGeometry(top);
    invalidate();
  }
  function cacheGeometry(top) {
    lastTagFrame = -1;
    // These dimensions only change with layout, not with the lens or film
    // frame. Read them together after the sizing writes above.
    var trackRect = track.getBoundingClientRect();
    var stageRect = stage.getBoundingClientRect();
    var dockRect = dock.getBoundingClientRect();
    geometry = {
      trackTop: window.scrollY + trackRect.top,
      span: Math.max(1, track.offsetHeight - stage.offsetHeight),
      top: top === undefined ? geometry.top : top,
      dockX: dockRect.left - stageRect.left,
      dockY: dockRect.top - stageRect.top,
      buttonW: useBtn.offsetWidth,
      buttonH: useBtn.offsetHeight
    };
  }

  /* ---------- official PeerTube embeds: strict-origin RPC, no media URLs */
  var mediaLayout = '';
  var mediaGeneration = 0;
  var players = { normal: null, sensor: null };
  var failedLayers = {};
  var EMBED_ORIGIN = 'https://video.igem.org';
  var VIDEO_IDS = {
    landscape: {
      normal: 'e9061255-56e7-4587-ad3d-13358b46b76d',
      sensor: 'bfb52eef-be2b-497f-9f0d-df724ae8514d'
    },
    portrait: {
      normal: '46349dd9-79d5-43c7-b619-ee7fc177680b',
      sensor: '6e3cf0fe-1525-4155-80b2-d645cd098f51'
    }
  };
  var rpcSerial = 1;
  // Small protocol adapter for PeerTube's documented embed methods.
  // It exchanges JSChannel-compatible JSON messages; no SDK or CDN is loaded.
  function EmbedPlayer(element, url) {
    var pending = new Map();
    var stopped = false, connected = false, ready = false;
    var resolveReady, rejectReady;
    var controller = this;
    this.element = element;
    this.time = 0;
    this.url = url;
    this.lastImage = '';
    // Six recently decoded pictures per layer, in memory only. At the current
    // 854x480 rendition the two caches retain at most about 19 MiB of pixels.
    this.frames = new Map();
    this.ready = new Promise(function (resolve, reject) { resolveReady = resolve; rejectReady = reject; });
    function send(message) {
      if (!stopped) element.contentWindow.postMessage(JSON.stringify(message), EMBED_ORIGIN);
    }
    this.call = function (method, params) {
      return new Promise(function (resolve, reject) {
        if (stopped) { reject(new Error('Player disposed')); return; }
        var id = rpcSerial++;
        var timer = setTimeout(function () { pending.delete(id); reject(new Error('Embed API timeout: ' + method)); }, 10000);
        pending.set(id, { resolve: resolve, reject: reject, timer: timer });
        send({ id: id, method: 'peertube::' + method, params: params });
      });
    };
    function markReady() {
      if (ready || stopped) return;
      ready = true;
      controller.isReady = true;
      clearTimeout(readyTimer);
      clearInterval(handshakeTimer);
      resolveReady(controller);
    }
    function onMessage(event) {
      if (stopped || event.origin !== EMBED_ORIGIN || event.source !== element.contentWindow) return;
      var message;
      try { message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch (_) { return; }
      if (!message || typeof message !== 'object') return;
      if (message.method === 'peertube::__ready') {
        if (message.params && message.params.type === 'publish-request') {
          send({ method: 'peertube::__ready', params: { type: 'publish-reply', publish: [] } });
        }
        if (!connected) {
          connected = true;
          controller.call('isReady').then(function (value) { if (value) markReady(); }).catch(function () {});
        }
      } else if (message.method === 'peertube::ready' && message.params) {
        markReady();
      } else if (message.id && pending.has(message.id)) {
        var task = pending.get(message.id);
        pending.delete(message.id); clearTimeout(task.timer);
        if (message.error) task.reject(new Error(String(message.message || message.error)));
        else task.resolve(message.result);
      }
    }
    window.addEventListener('message', onMessage);
    function handshake() {
      send({ method: 'peertube::__ready', params: { type: 'publish-request', publish: [] } });
    }
    var handshakeTimer = setInterval(handshake, 1000);
    var readyTimer = setTimeout(function () { rejectReady(new Error('Official player did not become ready')); }, 30000);
    this.destroy = function () {
      stopped = true;
      clearInterval(handshakeTimer); clearTimeout(readyTimer);
      window.removeEventListener('message', onMessage);
      pending.forEach(function (task) { clearTimeout(task.timer); task.reject(new Error('Player disposed')); });
      pending.clear();
      controller.frames.clear();
      controller.picture = null;
      controller.lastImage = '';
      rejectReady(new Error('Player disposed'));
      element.removeAttribute('src');
    };
    element.src = url;
  }
  function srcFor(mode) {
    return EMBED_ORIGIN + '/videos/embed/' + VIDEO_IDS[st.layout][mode] +
      '?api=1&p2p=0&muted=1&autoplay=0&controls=0&title=0&warningTitle=0';
  }
  function mediaFailed(which, error) {
    root.dataset.mediaError = which + ': ' + (error && error.message || 'Unavailable');
    failedLayers[which] = true;
    if (players[which]) { players[which].destroy(); players[which] = null; }
    if (which === 'normal') {
      mediaGeneration++;
      if (players.sensor) { players.sensor.destroy(); players.sensor = null; }
      st.ready.normal = st.ready.sensor = false;
      mediaUnavailable();
      return;
    }
    st.ready.sensor = false;
    st.sensorSynced = false;
    st.r = 0;
    useBtn.disabled = true;
    setMode('off', 'media');
  }
  function openPlayer(which) {
    var generation = mediaGeneration;
    var player = new EmbedPlayer(which === 'normal' ? vN : vS, srcFor(which));
    players[which] = player;
    player.ready.then(async function () {
      if (generation !== mediaGeneration) return;
      if (!st.running) throw new Error('Startup paused');
      // A muted play/pause primes the decoder in browsers that otherwise
      // leave an embedded paused video uninitialized.
      await player.call('setVolume', 0);
      await player.call('play');
      var deadline = performance.now() + 20000;
      var primed = false;
      while (performance.now() < deadline) {
        await delay(100);
        if (generation !== mediaGeneration) return;
        if (!st.running) { await player.call('pause'); throw new Error('Startup paused'); }
        var position = await player.call('getCurrentTime');
        var first = await player.call('getImageDataUrl');
        if (position > 0 && typeof first === 'string' && first.length > 1000) { primed = true; break; }
      }
      await player.call('pause');
      if (!primed) throw new Error('Official player could not decode its first frame');
      if (generation !== mediaGeneration) return;
      st.ready[which] = true;
      st.frameShown = -1;
      if (which === 'sensor') useBtn.disabled = false;
      invalidate();
    }).catch(function (error) {
      if (generation !== mediaGeneration) return;
      if (error.message === 'Startup paused') {
        player.destroy();
        players[which] = null;
        if (which === 'normal') mediaLayout = '';
      } else mediaFailed(which, error);
    });
  }
  function loadVideos() {
    mediaLayout = st.layout;
    mediaGeneration++;
    failedLayers = {};
    Object.keys(players).forEach(function (which) {
      if (players[which]) players[which].destroy();
      players[which] = null;
    });
    root.classList.remove('is-drawn', 'is-media-error');
    sensorCanvas.hidden = true;
    delete root.dataset.mediaError;
    root.dataset.mediaProvider = 'igem-embed-api';
    st.ready.normal = st.ready.sensor = false;
    st.sensorSynced = false;
    st.frameShown = -1;
    st.seek = null;
    lastCompositeKey = '';
    useBtn.disabled = true;
    openPlayer('normal');
  }
  function startSensor() {
    if (reading || !st.running || document.hidden || players.sensor || failedLayers.sensor || !st.ready.normal) return;
    openPlayer('sensor');
  }
  useBtn.disabled = true;

  /* ---------- scroll → time (piecewise map with "dwell" segments) */
  // The stage sticks at `top: var(--asc-top)` (below the site header), so the
  // scrub distance is measured from that offset, not from the viewport top.
  function stickyTop() { return geometry.top; }
  function progress() {
    return clamp((window.scrollY + geometry.top - geometry.trackTop) / geometry.span, 0, 1);
  }
  function timeFromProgress(p) {
    var segs = TL.web.scrollMap;
    var total = 0;
    segs.forEach(function (s) { total += (s[1] - s[0]) * s[2]; });
    var d = p * total;
    for (var i = 0; i < segs.length; i++) {
      var len = (segs[i][1] - segs[i][0]) * segs[i][2];
      if (d <= len || i === segs.length - 1) return clamp(segs[i][0] + (d / len) * (segs[i][1] - segs[i][0]), 0, TL.duration);
      d -= len;
    }
    return TL.duration;
  }
  function progressFromTime(t) {
    var segs = TL.web.scrollMap;
    var total = 0;
    var acc = 0;
    segs.forEach(function (s) { total += (s[1] - s[0]) * s[2]; });
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (t <= s[1]) return (acc + (t - s[0]) * s[2]) / total;
      acc += (s[1] - s[0]) * s[2];
    }
    return 1;
  }

  /* One deliberate pause at the product invitation; the rest remains scroll-driven. */
  function productPauseY() {
    return geometry.trackTop - geometry.top + progressFromTime(productPause.time) * geometry.span;
  }
  function pinProductPause() {
    var y = productPauseY();
    if (Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: 'instant' });
  }
  function releaseProductPause() {
    productPause.state = 'passed';
    root.dataset.productPause = 'passed';
    invalidate();
  }
  function pauseReady(continuousGesture) {
    // Input release must not depend on a decoded video frame: a slow seek or
    // missing frame can otherwise trap the reader at the invitation forever.
    return performance.now() - productPause.entered >= (continuousGesture ? 650 : 220);
  }
  function checkProductPause() {
    if (reading || directReadingPending || root.classList.contains('is-media-error')) return;
    var t = timeFromProgress(progress());
    if (productPause.state === 'holding') {
      pinProductPause();
    } else if (productPause.state === 'passed' && t < productPause.time - 0.4) {
      productPause.state = 'armed';
    } else if (productPause.state === 'armed' && productPause.previousTime !== null &&
      productPause.previousTime < productPause.time && t >= productPause.time) {
      productPause.state = 'holding';
      productPause.entered = performance.now();
      pinProductPause();
      setRunning(true);
      announce('Try the AeroSense product. Scroll again to continue.');
    }
    productPause.previousTime = t;
    root.dataset.productPause = productPause.state;
  }
  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaY) return;
    var now = performance.now();
    var fresh = now - productPause.lastWheel > 160;
    productPause.lastWheel = now;
    if (productPause.state !== 'holding' || reading) return;
    // Briefly absorb arrival momentum, then accept the next gesture. A long
    // trackpad/wheel burst can also continue after a bounded reading pause.
    if ((fresh && pauseReady()) || pauseReady(true)) releaseProductPause();
    else e.preventDefault();
  }, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (productPause.state !== 'holding' || reading || e.ctrlKey || e.metaKey || e.altKey ||
      e.target.closest('input,textarea,select,button,a,[contenteditable="true"]')) return;
    if (!['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(e.key)) return;
    if ((!e.repeat && pauseReady()) || pauseReady(true)) releaseProductPause();
    else e.preventDefault();
  });
  window.addEventListener('touchstart', function (e) {
    productPause.touch = e.touches.length === 1 ? {
      y: e.touches[0].clientY, x: e.touches[0].clientX,
      mayRelease: productPause.state === 'holding'
    } : null;
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (productPause.state !== 'holding' || reading || !productPause.touch || e.touches.length !== 1) return;
    if (e.defaultPrevented || st.touchHold) return;
    var dy = e.touches[0].clientY - productPause.touch.y;
    var dx = e.touches[0].clientX - productPause.touch.x;
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) &&
      ((productPause.touch.mayRelease && pauseReady()) || pauseReady(true))) releaseProductPause();
    else e.preventDefault();
  }, { passive: false });

  /* ---------- bounded capture queue and atomic paired presentation */
  function frameTime(f) { return (f + 0.5) / TL.fps; }
  function wantSensor() { return st.ready.sensor && (st.mode !== 'off' || st.r > 0.5); }
  function delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function decodeSnapshot(data) {
    return new Promise(function (resolve, reject) {
      if (typeof data !== 'string' || !data.startsWith('data:image/jpeg;base64,') || data.length < 1000) {
        reject(new Error('Official player returned no usable frame')); return;
      }
      var picture = new Image();
      picture.onload = function () { resolve(picture); };
      picture.onerror = function () { reject(new Error('Cannot decode the official snapshot')); };
      picture.src = data;
    });
  }
  async function capture(player, frame, generation) {
    if (player.frames.has(frame)) {
      var cached = player.frames.get(frame);
      player.frames.delete(frame); player.frames.set(frame, cached);
      // A displayed cached frame must not change our last actual iframe
      // capture: that state is used to detect unchanged live snapshots.
      return cached;
    }
    var target = frameTime(frame);
    // Startup and visibility changes already pause both embeds. No per-frame
    // pause RPC is needed; the hidden players never play during scrubbing.
    await player.call('seek', target);
    var started = performance.now(), previous = '', unchanged = 0, data = '', time = null;
    var minSettle = player.frame === undefined || Math.abs(frame - player.frame) > TL.fps ? 80 : 48;
    // A seek acknowledgement sets the clock, not the decoded pixels. Require
    // successive equal captures after a short settling period. This is an
    // explicit best-effort limitation of the official API.
    while (performance.now() - started < 8000) {
      await delay(previous ? 16 : 24);
      if (generation !== mediaGeneration || !st.running) throw new Error('Capture cancelled');
      if (time === null || Math.abs(time - target) > 0.5 / TL.fps) {
        var response = await Promise.all([player.call('getCurrentTime'), player.call('getImageDataUrl')]);
        time = response[0]; data = response[1];
      } else data = await player.call('getImageDataUrl');
      var age = performance.now() - started;
      unchanged = data === previous ? unchanged + 1 : 0;
      previous = data;
      if (Math.abs(time - target) <= 0.5 / TL.fps && unchanged >= 1 &&
          age >= minSettle && (data !== player.lastImage || age >= 160)) {
        var picture = await decodeSnapshot(data);
        if (generation !== mediaGeneration || !st.running) throw new Error('Capture cancelled');
        player.time = time;
        player.lastImage = data;
        player.frame = frame;
        player.picture = picture;
        player.frames.set(frame, picture);
        while (player.frames.size > 6) player.frames.delete(player.frames.keys().next().value);
        return picture;
      }
    }
    throw new Error('Official frame capture did not settle');
  }
  function pumpSeek() {
    if (st.seek || !st.ready.normal || !st.running) return;
    var f = st.frameWanted;
    if (f === st.frameShown && (!wantSensor() || st.sensorSynced)) return;
    var both = wantSensor(), generation = mediaGeneration;
    var task = { frame: f, started: performance.now(), both: both };
    st.seek = task;
    var modes = both ? ['normal', 'sensor'] : ['normal'];
    task.cached = modes.every(function (which) { return players[which].frames.has(f); });
    Promise.allSettled(modes.map(function (which) {
      return capture(players[which], f, generation).catch(function (error) { error.layer = which; throw error; });
    })).then(function (results) {
      var failure = results.find(function (result) { return result.status === 'rejected'; });
      if (failure) throw failure.reason;
      var pictures = results.map(function (result) { return result.value; });
      if (generation !== mediaGeneration || st.seek !== task || !st.running) return;
      // A reversal can make a completed request counterproductive. Keep the
      // current pair if this result would move farther from the latest target.
      // Still publish useful intermediate frames during continuous scrolling.
      if (st.frameShown >= 0 && Math.abs(f - st.frameWanted) > Math.abs(st.frameShown - st.frameWanted)) return;
      // Do not paint an obsolete orientation or one layer of an incomplete pair.
      snapshot(pictures[0], normalFrame);
      if (both) snapshot(pictures[1], sensorFrame);
      st.videoW = pictures[0].width;
      st.videoH = pictures[0].height;
      st.frameShown = f;
      st.sensorSynced = both;
      root.dataset.mediaFrame = String(f);
      root.dataset.mediaPaired = String(both);
      root.dataset.mediaLatencyMs = String(Math.round(performance.now() - task.started));
      root.dataset.mediaCached = String(task.cached);
    }).catch(function (error) {
      if (generation === mediaGeneration && st.running && error.message !== 'Capture cancelled') mediaFailed(error.layer || 'normal', error);
    }).finally(function () {
      if (st.seek === task) { st.seek = null; invalidate(); }
    });
  }

  /* ---------- cover mapping (video px → stage px) */
  function cover() {
    var s = Math.max(st.w / st.videoW, st.h / st.videoH);
    var dw = st.videoW * s;
    var dh = st.videoH * s;
    return { s: s, x: (st.w - dw) / 2, y: (st.h - dh) / 2, w: dw, h: dh };
  }

  /* ---------- lens geometry */
  function baseRadius() {
    if (isTouch()) return clamp(Math.min(st.w, st.h) * 0.24, 90, 150);
    return clamp(Math.min(st.w, st.h) * 0.19, 130, 190);
  }
  function fullRadius() { return Math.hypot(st.w, st.h) * 1.05; }

  function lensTarget(t) {
    if (st.mode === 'off') return 0;
    if (st.mode === 'full') return fullRadius();
    if (t >= FINAL_T) return 0; // the lens retires for the closing statement
    if (inWin(t, TL.web.lensFull)) return fullRadius(); // inside the sensing system
    if (st.touchHold) return baseRadius() * 1.15;
    if (!st.pointerIn && !st.keyboardLens) return 0;
    return baseRadius() * (st.hold ? 1.7 : 1);
  }

  function defaultLensPoint() {
    // keyboard / first activation: centre on the grain's tag anchor if known
    var a = anchorAt('grain', st.frameShown < 0 ? 0 : st.frameShown);
    var c = cover();
    if (a) return [c.x + a[0] * c.w - 60, c.y + a[1] * c.h + 140];
    return [st.w * 0.34, st.h * 0.52];
  }

  /* ---------- tracks (label anchors) */
  function anchorAt(key, f) {
    var L = st.tracks && st.tracks.layouts && st.tracks.layouts[st.layout];
    if (!L || !L.anchors[key]) return null;
    var v = L.anchors[key][f - (L.from || 0)];
    return v && v !== 0 ? v : null;
  }

  /* ---------- drawing */
  function draw() {
    if (st.frameShown < 0) return;
    var compositeKey = st.frameShown + '|' + st.sensorSynced;
    // Pointer motion only changes the CSS clip. Upload pixels once per paired
    // frame, keeping both visible canvases in the same animation-frame commit.
    if (compositeKey === lastCompositeKey) return;
    var k = st.canvasScale;
    var c = cover();
    if (!ctx || !sensorDisplayContext) { st.fallback = true; mediaUnavailable(); return; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    try {
      ctx.drawImage(normalFrame, c.x * k, c.y * k, c.w * k, c.h * k);
      if (st.sensorSynced) {
        sensorDisplayContext.drawImage(sensorFrame, c.x * k, c.y * k, c.w * k, c.h * k);
      }
      sensorCanvas.hidden = !st.sensorSynced;
      lastCompositeKey = compositeKey;
      if (!root.classList.contains('is-drawn')) root.classList.add('is-drawn');
    } catch (e) {
      // Canvas compositing failed: show the existing static story.
      st.fallback = true;
      mediaUnavailable();
    }
  }

  /* ---------- per-frame UI (copy, tags, lens element, HUD) */
  var lastStoryKey = '';
  var lastTagFrame = -1;
  // Finish the outgoing chapter before introducing the latest requested one.
  // Rapid scroll reversals replace the pending chapter, never stack captions.
  var shownBeat = null, wantedBeat = null, leavingBeat = null, chapterTimer = 0;
  function requestChapter(next) {
    wantedBeat = next;
    if (leavingBeat || shownBeat === next) return;
    if (!shownBeat) {
      shownBeat = wantedBeat;
      if (shownBeat) shownBeat.classList.add('is-active');
      return;
    }
    leavingBeat = shownBeat; shownBeat = null;
    leavingBeat.classList.remove('is-active');
    leavingBeat.classList.add('is-leaving');
    clearTimeout(chapterTimer);
    chapterTimer = setTimeout(function () {
      leavingBeat.classList.remove('is-leaving'); leavingBeat = null;
      requestChapter(wantedBeat);
    }, 240);
  }
  function updateUI(t) {
    var storyKey = [t, st.mode, st.ready.sensor, st.w, st.h, geometry.dockX, geometry.dockY, productPause.state].join('|');
    if (storyKey !== lastStoryKey) {
    lastStoryKey = storyKey;
    var voice = st.mode === 'off' ? 'normal' : 'sensor';
    if (stage.getAttribute('data-voice') !== voice) stage.setAttribute('data-voice', voice);
    var dark = DARK.some(function (w) { return inWin(t, w); });
    var tone = dark ? 'dark' : 'light';
    if (stage.getAttribute('data-tone') !== tone) stage.setAttribute('data-tone', tone);

    // Only one headline occupies a copy zone at a time, including overlaps
    // at scene boundaries. Outgoing copy cannot obscure the next title.
    var activeBeat = null;
    beats.forEach(function (b) {
      if (t >= +b.dataset.in && t < +b.dataset.out && !(b.hasAttribute('data-cta') && st.mode !== 'off')) activeBeat = b;
    });
    requestChapter(activeBeat);
    steps.forEach(function (s) { s.classList.toggle('is-on', t >= +s.getAttribute('data-in')); });

    // The control is introduced once, then follows the scroll into the toolbar.
    var introduced = t >= TL.web.cta[0] && st.ready.sensor;
    var travel = clamp((t - (TL.web.cta[1] - 0.35)) / 0.8, 0, 1);
    travel = travel * travel * (3 - 2 * travel);
    var portrait = st.w / st.h < 0.9;
    var scale = portrait ? 1.45 : 1.9;
    var x0 = portrait ? st.w * 0.40 : st.w * 0.465;
    var y0 = portrait ? Math.min(st.h * 0.69, geometry.dockY - 105) : Math.min(st.h * 0.63, geometry.dockY - 140);
    ctaEl.style.setProperty('--asc-note-width', Math.max(80, (st.w - x0 - 16) / scale - geometry.buttonW - 8) + 'px');
    var x = x0 + (geometry.dockX - x0) * travel;
    var y = y0 + (geometry.dockY - y0) * travel;
    ctaEl.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + (scale + (1-scale)*travel) + ')';
    ctaEl.classList.toggle('is-on', introduced);
    ctaEl.classList.toggle('is-docked', travel > 0.95);
    ctaNote.style.opacity = String(1-travel);
    ctaNote.hidden = travel > 0.95;
    if (productPointer) {
      var tipX = x0 + geometry.buttonW * scale * (portrait ? 0.67 : 0.14);
      var tipY = y0 + geometry.buttonH * scale * 0.2;
      var startX = st.w * (portrait ? 0.54 : 0.44);
      var startY = portrait ? Math.max(80, y0 - 95) : y0 - Math.min(95, st.h * 0.16);
      var bendX = portrait ? startX + 12 : startX + (tipX - startX) * 0.75;
      var bendY = startY + (tipY - startY) * (portrait ? 0.65 : 0.1);
      var angle = Math.atan2(tipY - bendY, tipX - bendX);
      var wing = portrait ? 10 : 13;
      var leftX = tipX - wing * Math.cos(angle - 0.5);
      var leftY = tipY - wing * Math.sin(angle - 0.5);
      var rightX = tipX - wing * Math.cos(angle + 0.5);
      var rightY = tipY - wing * Math.sin(angle + 0.5);
      productPointer.setAttribute('viewBox', '0 0 ' + st.w + ' ' + st.h);
      productPointer.querySelector('path').setAttribute('d', 'M' + startX + ' ' + startY +
        ' Q' + bendX + ' ' + bendY + ' ' + tipX + ' ' + tipY +
        ' M' + leftX + ' ' + leftY + ' L' + tipX + ' ' + tipY + ' L' + rightX + ' ' + rightY);
      productPointer.style.opacity = introduced && st.mode === 'off' ? String(1 - travel) : '0';
    }
    useBtn.tabIndex = introduced ? 0 : -1;
    useBtn.setAttribute('aria-hidden', String(!introduced));

    // shot label + progress
    var si = 0;
    TL.shots.forEach(function (s, i) { if (t >= s.t0) si = i; });
    var label = (productPause.state === 'holding' ? 'SCROLL AGAIN TO CONTINUE · ' : 'SCROLL TO EXPLORE · ') + String(si + 1).padStart(2, '0') + ' / ' + String(TL.shots.length).padStart(2, '0') + ' · ' + TL.shots[si].title;
    if (chapter.textContent !== label) chapter.textContent = label;
    }

    // lens element + shared clip
    var visible = st.r > 1 && st.r < fullRadius() * 0.98;
    stage.classList.toggle('is-lens-visible', visible);
    stage.classList.toggle('is-lens-on', st.mode === 'lens' && st.pointerIn && !isTouch());
    if (visible) {
      var d = st.r * 2;
      lensEl.style.width = d + 'px';
      lensEl.style.height = d + 'px';
      lensEl.style.transform = 'translate3d(' + (st.lx - st.r).toFixed(1) + 'px,' + (st.ly - st.r).toFixed(1) + 'px,0)';
    }
    var clip = st.r >= fullRadius() * 0.98 ? 'none' : 'circle(' + st.r.toFixed(1) + 'px at ' + st.lx.toFixed(1) + 'px ' + st.ly.toFixed(1) + 'px)';
    root.style.setProperty('--asc-clip', clip);
    document.body.classList.toggle('asc-lens-active', st.mode !== 'off' && (st.pointerIn || st.mode === 'full'));

    // tags follow tracks.json for the frame actually on screen
    var f = st.frameShown < 0 ? 0 : st.frameShown;
    var ft = f / TL.fps;
    var c = cover();
    tags.forEach(function (tag) {
      var phase = tag.getAttribute('data-phase');
      var win = TL.web.labels[phase];
      var a = anchorAt(tag.getAttribute('data-tag'), f);
      var on = !!a && win && inWin(ft, win) && st.r > 1;
      if (on && (f !== lastTagFrame || !tag.classList.contains('is-on'))) {
        var ax = c.x + a[0] * c.w;
        var y = c.y + a[1] * c.h;
        // keep tags inside the stage: flip to the left of the anchor if needed
        var w = tag.offsetWidth || 160;
        var x = ax + 14;
        if (x + w > st.w - 10) x = Math.max(10, ax - 14 - w);
        tag.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translateY(-50%)';
      }
      if (on !== tag.classList.contains('is-on')) tag.classList.toggle('is-on', on);
    });
    lastTagFrame = f;
  }

  /* ---------- main loop */
  var tickId = 0;
  function requestTick() {
    if (st.running && !tickId) tickId = requestAnimationFrame(tick);
  }
  function invalidate() {
    st.dirty = true;
    requestTick();
  }
  function tick(now) {
    tickId = 0;
    if (!st.running) return;
    // Direct reading links and offscreen films do not need either movie yet.
    if (!directReadingPending && st.layout && mediaLayout !== st.layout) loadVideos();
    startSensor();
    var dt = st.lastNow ? Math.min(0.05, (now - st.lastNow) / 1000) : 0.016;
    st.lastNow = now;

    st.tTarget = productPause.state === 'holding' ? productPause.time : timeFromProgress(progress());
    // The embed API already samples asynchronously. An additional easing
    // queue seeks obsolete intermediate positions and adds visible lag.
    st.t = st.tTarget;
    st.frameWanted = clamp(Math.round(st.t * TL.fps), 0, TL.frames - 1);

    pumpSeek();

    // lens spring: low latency position, softer radius
    var rt = lensTarget(st.frameShown < 0 ? Math.max(0, st.t) : st.frameShown / TL.fps);
    var kp = 1 - Math.exp(-dt * 44);
    var kr = 1 - Math.exp(-dt * 14);
    var nx = st.lx + (st.px - st.lx) * kp;
    var ny = st.ly + (st.py - st.ly) * kp;
    var nr = st.r + (rt - st.r) * kr;
    if (Math.abs(st.px - nx) < 0.1) nx = st.px;
    if (Math.abs(st.py - ny) < 0.1) ny = st.py;
    if (Math.abs(rt - nr) < 0.3) nr = rt;
    if ((st.r > 0.5 && (nx !== st.lx || ny !== st.ly)) || nr !== st.r) st.dirty = true;
    st.lx = nx;
    st.ly = ny;
    st.r = nr;

    if (st.dirty && !st.fallback) {
      draw();
    }
    if (st.dirty) updateUI(st.frameShown < 0 ? Math.max(0, st.t) : st.frameShown / TL.fps);
    st.dirty = false;
    // Sleep completely on a held frame. Scroll, input, media and layout
    // events wake the loop; only an unfinished transition needs another frame.
    var lensMoving = nr !== rt || (rt > 0.5 && (nx !== st.px || ny !== st.py));
    if (st.t !== st.tTarget || lensMoving) requestTick();
    else st.lastNow = 0;
  }
  function setRunning(on) {
    on = on && !reading && !document.hidden;
    if (on === st.running) { if (on) requestTick(); return; }
    st.running = on;
    st.lastNow = 0;
    if (on) { st.dirty = true; requestTick(); }
    else {
      Object.keys(players).forEach(function (which) {
        var player = players[which];
        if (player && player.isReady) player.call('pause').catch(function () {});
      });
      if (tickId) { cancelAnimationFrame(tickId); tickId = 0; }
    }
  }

  /* ---------- modes */
  function setMode(mode, via) {
    st.mode = mode;
    var on = mode !== 'off';
    [useBtn].forEach(function (b) { b.setAttribute('aria-pressed', String(on)); });
    if (isTouch()) {
      useLabel.textContent = on ? 'Close reader ×' : 'Open reader →';
      revealBtn.hidden = true;
      hint.hidden = false;
      hint.textContent = on ? 'AeroSense view' : 'Or hold & drag to sense';
    } else {
      useLabel.textContent = on ? 'Close reader ×' : 'Open reader →';
      revealBtn.hidden = !on;
      revealBtn.textContent = mode === 'full' ? 'Return to visual view' : 'Reveal all';
      revealBtn.setAttribute('aria-pressed', String(mode === 'full'));
      hint.hidden = mode !== 'lens';
      hint.textContent = 'Move to sense · hold to widen';
    }
    useBtn.setAttribute('aria-label', on ? 'Close the reader and return to visual view' : 'Open the reader and reveal AeroSense view');
    ctaNote.querySelector('[data-asc-note-copy]').innerHTML = on
      ? 'AeroSense view is on.'
      : 'Reveal the hidden odor view.';
    // Revealing a control or changing its label can move the dock without
    // resizing the outer toolbar. Refresh its target before the next frame.
    cacheGeometry();
    if (on && (via === 'keyboard' || !st.pointerIn)) {
      var p = defaultLensPoint();
      st.px = st.lx = p[0];
      st.py = st.ly = p[1];
      st.keyboardLens = via === 'keyboard';
    }
    if (!on) st.keyboardLens = false;
    invalidate();
    announce(mode === 'off' ? 'Visual view. The food looks normal.' : mode === 'full' ? 'Sensor view revealed across the whole scene. Conceptual visualization.' : 'AeroSense lens on. Move the pointer over the food to reveal the hidden odor layer.');
  }
  function toggleUse(e) {
    var via = e && e.detail === 0 ? 'keyboard' : 'pointer';
    if (isTouch()) setMode(st.mode === 'off' ? 'full' : 'off', via);
    else setMode(st.mode === 'off' ? 'lens' : 'off', via);
  }
  useBtn.addEventListener('click', toggleUse);
  revealBtn.addEventListener('click', function (e) {
    if (st.mode === 'full') {
      setMode('off', 'pointer');
      useBtn.focus();
    } else setMode('full', e.detail === 0 ? 'keyboard' : 'pointer');
  });

  /* ---------- pointer (desktop lens) */
  function localXY(e) {
    var r = stage.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var p = localXY(e);
    st.px = p[0];
    st.py = p[1];
    if (!st.pointerIn) {
      st.pointerIn = true;
      if (st.r < 1) { st.lx = st.px; st.ly = st.py; }
    }
    st.keyboardLens = false;
    if (st.mode !== 'off') invalidate();
  }, { passive: true });
  stage.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'touch') return;
    st.pointerIn = false;
    st.hold = false;
    if (st.mode !== 'off') invalidate();
  });
  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch' || st.mode !== 'lens') return;
    if (e.target.closest('button, a')) return;
    st.hold = true;
    invalidate();
  });
  function endPointerHold() { if (st.hold) { st.hold = false; invalidate(); } }
  window.addEventListener('pointerup', endPointerHold);
  window.addEventListener('pointercancel', endPointerHold);

  /* ---------- touch: "hold to sense" (long-press, then drag) */
  var holdTimer = 0;
  var touchStart = null;
  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || e.target.closest('button, a')) return;
    var p = localXY(e.touches[0]);
    touchStart = p;
    clearTimeout(holdTimer);
    holdTimer = window.setTimeout(function () {
      if (!st.ready.sensor) return;
      st.touchHold = true;
      if (st.mode === 'off') st.mode = 'lens';
      // lens sits above the finger so the finger does not cover what it reveals
      st.px = st.lx = p[0];
      st.py = st.ly = p[1] - 90;
      stage.setAttribute('data-voice', 'sensor');
      invalidate();
    }, 260);
  }, { passive: true });
  stage.addEventListener('touchmove', function (e) {
    var p = localXY(e.touches[0]);
    if (!st.touchHold) {
      if (touchStart && Math.hypot(p[0] - touchStart[0], p[1] - touchStart[1]) > 10) clearTimeout(holdTimer);
      return; // normal scrolling
    }
    e.preventDefault(); // holding: drag the lens instead of scrolling
    st.px = p[0];
    st.py = p[1] - 90;
    invalidate();
  }, { passive: false });
  function endTouch() {
    clearTimeout(holdTimer);
    if (st.touchHold) {
      st.touchHold = false;
      if (useBtn.getAttribute('aria-pressed') !== 'true') st.mode = 'off';
      invalidate();
    }
  }
  stage.addEventListener('touchend', endTouch);
  stage.addEventListener('touchcancel', endTouch);

  /* ---------- skip */
  $$('a[href="#intro"]').forEach(function (a) {
    a.addEventListener('click', function (event) {
      event.preventDefault();
      releaseProductPause();
      setMode('off', 'pointer');
      var intro = document.getElementById('intro');
      if (intro) intro.scrollIntoView({ behavior: 'instant', block: 'start' });
      history.replaceState(null, '', '#intro');
    });
  });
  // Keep a direct reading link aligned after the film's scroll space is measured.
  if (directReadingTarget) {
    var introLinkInterrupted = false;
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (eventName) {
      window.addEventListener(eventName, function () { introLinkInterrupted = true; directReadingPending = false; }, { once: true, passive: true });
    });
    window.addEventListener('load', function () {
      if (introLinkInterrupted) return;
      releaseProductPause();
      directReadingTarget.scrollIntoView({ behavior: 'instant', block: 'start' });
      directReadingPending = false;
    }, { once: true });
  }

  /* ---------- visibility + resize */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        setRunning(en.isIntersecting);
        document.body.classList.toggle('asc-in-film', en.isIntersecting && !reading);
        if (!en.isIntersecting) document.body.classList.remove('asc-lens-active');
      });
    }, { rootMargin: '120px 0px 120px 0px' }).observe(track);
  } else setRunning(true);

  // The site header can change height (nav wraps, fonts load): keep the sticky offset exact.
  var headerEl = document.querySelector('.site-header');
  if (headerEl && 'ResizeObserver' in window) {
    new ResizeObserver(function () {
      var h = Math.round(headerEl.getBoundingClientRect().height);
      if (String(h) + 'px' !== root.style.getPropertyValue('--asc-top')) measure();
    }).observe(headerEl);
  }
  if ('ResizeObserver' in window) {
    var controlsObserver = new ResizeObserver(function () { cacheGeometry(); invalidate(); });
    controlsObserver.observe(controls);
    // Chapter text and individual buttons can redistribute a flex row while
    // the toolbar itself retains exactly the same width and height.
    Array.from(controls.children).forEach(function (control) { controlsObserver.observe(control); });
  }
  window.addEventListener('load', measure);
  if (document.fonts) document.fonts.ready.then(measure);

  var rz = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = window.setTimeout(measure, 120);
  });
  window.addEventListener('scroll', function () {
    // Later reading sections do not need film progress or pause calculations.
    // The visibility observer wakes and refreshes the film on return.
    if (!st.running) return;
    // If media failed while the reader was elsewhere, offer the static story
    // only when they return to the film. Never move a reader backwards.
    if (!reading && root.classList.contains('is-media-error')) mediaUnavailable();
    checkProductPause(); invalidate();
  }, { passive: true });
  document.addEventListener('visibilitychange', function () { var rect = track.getBoundingClientRect(); st.dirty = true; setRunning(!document.hidden && rect.bottom > 0 && rect.top < innerHeight); });

  /* ---------- data files (non-blocking) */
  var base = root.getAttribute('data-asc-base') || 'homepage_animation/media/';
  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  getJSON(base === 'homepage_animation/media/' ? "https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/f0f03e36b880-timeline.json" : base + 'timeline.json').then(function (j) {
    if (j && j.fps && j.frames && j.web) TL = j;
    invalidate();
  }).catch(function () {});
  getJSON(base === 'homepage_animation/media/' ? "https://static.igem.wiki/teams/6460/wiki/aerosense-assets-20261017/99e38090c7b0-tracks.json" : base + 'tracks.json').then(function (j) { st.tracks = j; invalidate(); }).catch(function () {});

  /* ---------- go */
  if (isTouch()) {
    ctaNote.querySelector('[data-asc-note-copy]').textContent = 'Reveal the hidden odor view.';
  }
  setMode('off', 'init');
  live.textContent = '';
  measure();
  productPause.previousTime = timeFromProgress(progress());
  invalidate();

  /* ---------- QA accessor (not a global) */
  root.ascDebug = function () {
    return {
      t: st.t,
      tTarget: st.tTarget,
      frameWanted: st.frameWanted,
      frameShown: st.frameShown,
      normalTime: players.normal && players.normal.time,
      sensorTime: players.sensor && players.sensor.time,
      normalFrame: players.normal && Math.floor(players.normal.time * TL.fps + 1e-6),
      sensorFrame: players.sensor && Math.floor(players.sensor.time * TL.fps + 1e-6),
      sensorSynced: !!st.sensorSynced,
      seeking: !!st.seek,
      ready: { normal: st.ready.normal, sensor: st.ready.sensor },
      mode: st.mode,
      r: st.r,
      lens: [st.lx, st.ly],
      layout: st.layout,
      src: [vN.src, vS.src],
      scrollYForTime: function (t) {
        var rect = track.getBoundingClientRect();
        var span = track.offsetHeight - stage.offsetHeight;
        return window.scrollY + rect.top - stickyTop() + progressFromTime(t) * span;
      }
    };
  };
})();

