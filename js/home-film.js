/**
 * AeroSense homepage film — scroll-mapped video, scanner crossfade.
 * Native JS only. Does not hijack wheel / touch scrolling.
 *
 * Smoothness strategy:
 * - Forward scroll plays the active video toward the target time.
 * - Reverse / large jumps seek, but only after the previous seek finishes.
 * - Hidden scanner layer is synced lazily so we never decode two seeks per frame.
 */
(function () {
  "use strict";

  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)");
  var MOBILE = window.matchMedia("(max-width: 700px)");
  var REDUCE_DATA = window.matchMedia("(prefers-reduced-data: reduce)");
  var CLOSE_EPS = 0.03;
  var SEEK_EPS = 0.045;
  var JUMP_SEEK = 1.15;
  var IDLE_MS = 140;

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function prefersReduced() {
    return REDUCE.matches;
  }

  function setHeaderHeight() {
    var header = qs(".site-header");
    var h = header ? Math.ceil(header.getBoundingClientRect().height) : 72;
    document.documentElement.style.setProperty("--actual-header-height", h + "px");
    return h;
  }

  function init() {
    var root = qs("[data-home-film]");
    if (!root) return;

    var track = qs(".home-film__track", root);
    var stage = qs(".home-film__stage", root);
    var visible = qs('[data-film-layer="visible"]', root);
    var scan = qs('[data-film-layer="scan"]', root);
    var bgRoot = qs("[data-film-bg]", root);
    var control = qs("[data-film-control]", root);
    var stateLabel = qs("[data-film-state]", control);
    var led = qs("[data-film-led]", control);
    var captionRoot = qs("[data-captions]", root);
    var scanLayer = qs("[data-scan-layer]", root);
    var beats = qsa("[data-captions] [data-beat]", root);
    var captionGroups = captionRoot ? [captionRoot] : [];
    var bgActive = qs("[data-film-bg-active]", root);
    var scanEgg = qs("[data-scan-egg]", root);
    var scanRing = qs("[data-scan-ring]", control);
    var FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)");
    var PORTRAIT = window.matchMedia("(orientation: portrait)");
    var fgVideos = [visible, scan].filter(Boolean);

    function keyFor(video) {
      return video === scan ? "scan" : "visible";
    }

    if (captionRoot && scanLayer) {
      var scanCaptions = captionRoot.cloneNode(true);
      scanCaptions.classList.add("home-film__captions--scan");
      scanCaptions.removeAttribute("data-captions");
      scanCaptions.setAttribute("data-captions-scan", "");
      scanCaptions.setAttribute("aria-hidden", "true");
      qsa("a", scanCaptions).forEach(function (link) {
        link.setAttribute("tabindex", "-1");
      });
      scanLayer.appendChild(scanCaptions);
      captionGroups.push(scanCaptions);
    }

    var geometry = { top: 0, range: 1, header: 72 };
    var inView = false;
    var raf = 0;
    var scanOn = false;
    var lastBeat = -1;
    var pulsed = {};
    var primed = false;
    var duration = 0;
    var desired = 0;
    var lastScrollAt = 0;
    var pendingSeek = { visible: null, scan: null };
    var seekLock = { visible: false, scan: false };
    var lensRadius = 0;
    var lensTarget = 0;
    var lensRaf = 0;
    var hasLensPoint = false;

    function isLowPower() {
      if (prefersReduced()) return true;
      if (REDUCE_DATA.matches) return true;
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ""))) return true;
      return false;
    }

    function ensureScanSource() {
      if (!scan) return;
      if (scan.getAttribute("src")) return;
      var src = scan.getAttribute("data-src");
      if (!src) return;
      scan.preload = "auto";
      scan.src = src;
    }

    function applyStaticMode(on) {
      root.classList.toggle("is-static", on);
      if (on) {
        captionGroups.forEach(function (group) {
          qsa("[data-beat]", group).forEach(function (beat) {
            beat.classList.add("is-active");
            beat.removeAttribute("inert");
            beat.setAttribute("aria-hidden", "false");
          });
        });
        document.body.classList.remove("is-home-film-active");
        document.body.classList.remove("is-home-header-over-film");
      }
    }

    function setInert(el, on) {
      if (!el) return;
      if ("inert" in el) {
        el.inert = on;
      } else if (on) {
        el.setAttribute("inert", "");
      } else {
        el.removeAttribute("inert");
      }
      el.setAttribute("aria-hidden", on ? "true" : "false");
      qsa("a, button", el).forEach(function (node) {
        if (on) node.setAttribute("tabindex", "-1");
        else node.removeAttribute("tabindex");
      });
    }

    function activateBeat(index) {
      if (prefersReduced() || index === lastBeat) return;
      captionGroups.forEach(function (group) {
        qsa("[data-beat]", group).forEach(function (beat, i) {
          var on = i === index;
          beat.classList.toggle("is-active", on);
          setInert(beat, !on);
        });
      });
      lastBeat = index;
      if ((index === 1 || index === 2) && !pulsed[index] && led) {
        pulsed[index] = true;
        led.classList.remove("is-pulse");
        void led.offsetWidth;
        led.classList.add("is-pulse");
      }
    }

    function measure() {
      geometry.header = setHeaderHeight();
      if (!track || !stage) return;
      var rect = track.getBoundingClientRect();
      geometry.top = rect.top + (window.scrollY || window.pageYOffset);
      geometry.range = Math.max(track.offsetHeight - stage.offsetHeight, 1);
      updateHeaderChrome();
    }

    function progress() {
      var y = window.scrollY || window.pageYOffset;
      return clamp((y - geometry.top) / geometry.range, 0, 1);
    }

    function updateHeaderChrome() {
      var header = qs(".site-header");
      if (!header || !root) return;
      if (prefersReduced() || root.classList.contains("is-static")) {
        document.body.classList.remove("is-home-header-over-film");
        return;
      }
      var headerBottom = header.getBoundingClientRect().bottom;
      var filmBottom = root.getBoundingClientRect().bottom;
      document.body.classList.toggle("is-home-header-over-film", filmBottom > headerBottom + 1);
    }

    function sharedDuration() {
      var d = Infinity;
      fgVideos.forEach(function (video) {
        if (video && isFinite(video.duration) && video.duration > 0) {
          d = Math.min(d, video.duration);
        }
      });
      return !isFinite(d) || d <= 0 ? 0 : d;
    }

    function targetTime(p) {
      var d = duration || sharedDuration();
      if (d <= 0) return 0;
      return clamp(p * Math.max(d - 0.05, 0), 0, Math.max(d - 0.05, 0));
    }

    function ready(video) {
      return video && video.readyState >= 2 && isFinite(video.duration) && video.duration > 0;
    }

    function clampTime(video, t) {
      return clamp(t, 0, Math.max(video.duration - 0.05, 0));
    }

    function ensurePlaying(video) {
      if (!video.paused && !video.ended) return;
      var play = video.play();
      if (play && typeof play.catch === "function") {
        play.catch(function () {
          /* autoplay may wait for a gesture; primeVideos handles that */
        });
      }
    }

    function pauseVideo(video) {
      if (!video || video.paused) return;
      try {
        video.pause();
      } catch (e) {
        /* ignore */
      }
      video.playbackRate = 1;
    }

    function seekTo(video, t) {
      if (!ready(video)) return;
      var k = keyFor(video);
      var next = clampTime(video, t);
      if (Math.abs(video.currentTime - next) < SEEK_EPS) {
        pendingSeek[k] = null;
        return;
      }
      pendingSeek[k] = next;
      if (seekLock[k] || video.seeking) return;
      flushSeek(video);
    }

    function flushSeek(video) {
      var k = keyFor(video);
      var next = pendingSeek[k];
      if (next === null || next === undefined) return;
      if (Math.abs(video.currentTime - next) < SEEK_EPS) {
        pendingSeek[k] = null;
        return;
      }
      pendingSeek[k] = null;
      seekLock[k] = true;
      pauseVideo(video);
      try {
        if (typeof video.fastSeek === "function") video.fastSeek(next);
        else video.currentTime = next;
      } catch (e) {
        seekLock[k] = false;
      }
    }

    function onSeeked(video) {
      var k = keyFor(video);
      seekLock[k] = false;
      if (pendingSeek[k] !== null) flushSeek(video);
    }

    function steer(video) {
      if (!ready(video)) return false;
      var k = keyFor(video);
      if (seekLock[k] || video.seeking) return true;

      var now = video.currentTime;
      var delta = desired - now;
      var abs = Math.abs(delta);
      var scrolling = performance.now() - lastScrollAt < IDLE_MS;

      if (abs <= CLOSE_EPS && !scrolling) {
        pauseVideo(video);
        return false;
      }

      if (abs > JUMP_SEEK || delta < -0.08) {
        seekTo(video, desired);
        return true;
      }

      if (delta <= CLOSE_EPS) {
        pauseVideo(video);
        return false;
      }

      video.playbackRate = clamp(delta / 0.12, 0.4, 2.8);
      ensurePlaying(video);
      return true;
    }

    var lastSyncAt = 0;

    function lazySync(follower, leader) {
      if (!ready(follower) || !ready(leader)) return;
      if (follower.seeking || seekLock[keyFor(follower)]) return;
      var t = performance.now();
      if (t - lastSyncAt < 240) return;
      if (Math.abs(follower.currentTime - leader.currentTime) < 0.08) return;
      lastSyncAt = t;
      try {
        follower.pause();
        follower.currentTime = leader.currentTime;
      } catch (e) {
        /* ignore */
      }
    }

    function updateBeats(p) {
      var n = beats.length || 1;
      activateBeat(Math.min(n - 1, Math.max(0, Math.floor(p * n))));
    }

    function tick() {
      raf = 0;
      if (prefersReduced() || !inView) return;

      var p = progress();
      desired = targetTime(p);
      updateBeats(p);

      var busy = false;

      if (scanOn) {
        busy = steer(visible) || busy;
        busy = steer(scan) || busy;
      } else {
        busy = steer(visible) || busy;
        lazySync(scan, visible);
      }

      if (busy || performance.now() - lastScrollAt < IDLE_MS) {
        raf = window.requestAnimationFrame(tick);
      }
    }

    function kick() {
      if (prefersReduced() || !inView) return;
      lastScrollAt = performance.now();
      if (!raf) raf = window.requestAnimationFrame(tick);
    }

    function stopLoop() {
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
      pauseVideo(visible);
      pauseVideo(scan);
    }

    function pauseAll() {
      fgVideos.forEach(pauseVideo);
    }

    function prepare(video) {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.preload = video.hasAttribute("data-src") ? "none" : "metadata";
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.disablePictureInPicture = true;
      video.addEventListener("seeked", function () {
        onSeeked(video);
      });
      video.addEventListener("loadedmetadata", function () {
        duration = sharedDuration();
        if (prefersReduced()) {
          seekTo(video, duration * 0.42);
          pauseVideo(video);
        } else {
          kick();
        }
      });
    }

    function primeVideos() {
      if (inView) ensureScanSource();
      if (primed) return;
      primed = true;
      if (visible) visible.preload = "auto";
      fgVideos.forEach(function (video) {
        if (!video) return;
        video.muted = true;
        video.defaultMuted = true;
        var play = video.play();
        if (play && typeof play.then === "function") {
          play.catch(function () {
            /* wait for a later gesture */
          });
        }
      });
    }

    function lensSize() {
      if (!stage) return 160;
      var rect = stage.getBoundingClientRect();
      var m = Math.min(rect.width, rect.height);
      return MOBILE.matches ? m * 0.48 : m * 0.42;
    }

    function setLensPoint(clientX, clientY) {
      if (!stage) return;
      var rect = stage.getBoundingClientRect();
      var x = clamp(clientX - rect.left, 0, rect.width);
      var y = clamp(clientY - rect.top, 0, rect.height);
      hasLensPoint = true;
      stage.style.setProperty("--scan-x", x.toFixed(1) + "px");
      stage.style.setProperty("--scan-y", y.toFixed(1) + "px");
    }

    function setLensCenter() {
      if (!stage) return;
      var rect = stage.getBoundingClientRect();
      stage.style.setProperty("--scan-x", (rect.width / 2).toFixed(1) + "px");
      stage.style.setProperty("--scan-y", (rect.height / 2).toFixed(1) + "px");
    }

    function applyLensRadius() {
      if (stage) stage.style.setProperty("--scan-radius", lensRadius.toFixed(1) + "px");
    }

    function tickLens() {
      lensRaf = 0;
      var diff = lensTarget - lensRadius;
      if (prefersReduced() || Math.abs(diff) < 0.6) {
        lensRadius = lensTarget;
        applyLensRadius();
        return;
      }
      lensRadius += diff * 0.2;
      applyLensRadius();
      lensRaf = window.requestAnimationFrame(tickLens);
    }

    function openLens() {
      if (!hasLensPoint) setLensCenter();
      lensTarget = lensSize();
      if (prefersReduced()) {
        lensRadius = lensTarget;
        applyLensRadius();
        return;
      }
      if (!lensRaf) lensRaf = window.requestAnimationFrame(tickLens);
    }

    function closeLens() {
      lensTarget = 0;
      if (prefersReduced()) {
        lensRadius = 0;
        applyLensRadius();
        return;
      }
      if (!lensRaf) lensRaf = window.requestAnimationFrame(tickLens);
    }

    function setScan(on) {
      scanOn = !!on;
      if (scanOn && ready(scan) && ready(visible)) {
        seekTo(scan, visible.currentTime);
      }
      root.classList.toggle("is-scan", scanOn);
      if (scanEgg) {
        scanEgg.hidden = !(scanOn && FINE_POINTER.matches && !prefersReduced());
      }
      if (scanOn) {
        openLens();
        if (scanRing && !prefersReduced()) {
          scanRing.classList.remove("is-burst");
          void scanRing.offsetWidth;
          scanRing.classList.add("is-burst");
        }
      } else closeLens();
      if (root.classList.contains("is-enhanced")) enableEnhancement();
      if (control) {
        control.setAttribute("aria-pressed", scanOn ? "true" : "false");
        control.setAttribute(
          "aria-label",
          scanOn
            ? "AeroSense scanner. Scan active. Move the pointer to inspect. Activate to return to visual."
            : "AeroSense scanner. Visual mode. Activate to scan."
        );
      }
      if (stateLabel) stateLabel.textContent = scanOn ? "SCAN ACTIVE" : "VISUAL";
      kick();
    }

    function enableEnhancement() {
      if (prefersReduced() || isLowPower()) return;
      if (!PORTRAIT.matches) return;
      if (!bgRoot || !bgActive || !visible) return;
      var src = visible.currentSrc || visible.getAttribute("src") || "";
      if (scanOn && scan) {
        src = scan.currentSrc || scan.getAttribute("src") || scan.getAttribute("data-src") || src;
      }
      if (!src) return;
      if (bgActive.getAttribute("src") !== src) bgActive.src = src;
      bgActive.muted = true;
      bgActive.playsInline = true;
      bgActive.preload = "metadata";
      pauseVideo(bgActive);
      if (ready(visible) && isFinite(visible.currentTime)) {
        try {
          bgActive.currentTime = visible.currentTime;
        } catch (e) {
          /* decorative still is enough */
        }
      }
      bgRoot.hidden = false;
      root.classList.add("is-enhanced");
    }

    function disableEnhancement() {
      root.classList.remove("is-enhanced");
      if (bgRoot) bgRoot.hidden = true;
    }

    function configureMotion() {
      applyStaticMode(prefersReduced());
      disableEnhancement();
      if (!prefersReduced()) enableEnhancement();
      if (prefersReduced()) {
        stopLoop();
        duration = sharedDuration();
        var still = duration > 0 ? duration * 0.42 : 0;
        if (visible) seekTo(visible, still);
        if (scan) seekTo(scan, still);
        pauseAll();
        return;
      }
      applyStaticMode(false);
      if (beats.length && lastBeat < 0) activateBeat(0);
      measure();
      if (scanOn) {
        lensTarget = lensSize();
        if (prefersReduced()) {
          lensRadius = lensTarget;
          applyLensRadius();
        } else if (!lensRaf) {
          lensRaf = window.requestAnimationFrame(tickLens);
        }
      }
      kick();
    }

    fgVideos.forEach(prepare);

    if (control) {
      control.addEventListener("click", function (event) {
        primeVideos();
        if (!scanOn) setLensPoint(event.clientX, event.clientY);
        setScan(!scanOn);
      });
    }

    function onPointerMove(event) {
      if (!scanOn) return;
      if (typeof event.clientX !== "number") return;
      setLensPoint(event.clientX, event.clientY);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    if (stage) {
      stage.addEventListener("pointerdown", function (event) {
        if (!scanOn) return;
        if (event.target && event.target.closest && event.target.closest("[data-film-control]")) {
          return;
        }
        setLensPoint(event.clientX, event.clientY);
      }, { passive: true });
    }

    if (led) {
      led.addEventListener("animationend", function () {
        led.classList.remove("is-pulse");
      });
    }

    if (scanRing) {
      scanRing.addEventListener("animationend", function () {
        scanRing.classList.remove("is-burst");
      });
    }

    window.addEventListener("pointerdown", primeVideos, { once: true, passive: true });
    window.addEventListener("touchstart", primeVideos, { once: true, passive: true });
    window.addEventListener("keydown", primeVideos, { once: true });

    window.addEventListener(
      "scroll",
      function () {
        updateHeaderChrome();
        if (prefersReduced() || !inView) return;
        primeVideos();
        kick();
      },
      { passive: true }
    );

    window.addEventListener("resize", function () {
      measure();
      configureMotion();
    });

    window.addEventListener("orientationchange", function () {
      window.setTimeout(function () {
        measure();
        configureMotion();
      }, 80);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", measure);
    }

    var header = qs(".site-header");
    if (header && typeof ResizeObserver === "function") {
      new ResizeObserver(measure).observe(header);
    }

    function onMq(mq, fn) {
      if (mq.addEventListener) mq.addEventListener("change", fn);
      else if (mq.addListener) mq.addListener(fn);
    }

    onMq(REDUCE, configureMotion);
    onMq(MOBILE, configureMotion);
    onMq(PORTRAIT, configureMotion);
    onMq(REDUCE_DATA, configureMotion);

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            inView = entry.isIntersecting;
            document.body.classList.toggle(
              "is-home-film-active",
              inView && !prefersReduced()
            );
            if (inView) {
              ensureScanSource();
              if (visible) visible.preload = "auto";
            }
            if (inView && !prefersReduced()) {
              measure();
              kick();
            } else {
              stopLoop();
              document.body.classList.remove("is-home-film-active");
            }
          });
        },
        { root: null, threshold: [0, 0.01] }
      );
      io.observe(root);
    } else {
      inView = true;
    }

    setScan(false);
    if (beats.length && !prefersReduced()) activateBeat(0);
    var startRect = root.getBoundingClientRect();
    inView =
      startRect.bottom > 0 &&
      startRect.top < (window.innerHeight || document.documentElement.clientHeight || 800);
    if (inView) {
      ensureScanSource();
      if (visible) visible.preload = "auto";
    }
    configureMotion();
    measure();
    updateHeaderChrome();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
