/**
 * Homepage after-film helpers — lazy YouTube and near-viewport images.
 * Native JS only. Does not touch the cinematic scrub loop.
 */
(function () {
  "use strict";

  function hydrateOnView(el, load, rootMargin) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      load();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          load();
          io.disconnect();
        });
      },
      { root: null, rootMargin: rootMargin || "480px 0px", threshold: 0.01 }
    );
    io.observe(el);
  }

  function initYouTube() {
    var host = document.querySelector("[data-yt-embed]");
    if (!host) return;
    var iframe = host.querySelector("iframe[data-yt-src]");
    if (!iframe) return;
    hydrateOnView(host, function () {
      if (iframe.getAttribute("src")) return;
      var src = iframe.getAttribute("data-yt-src");
      if (!src) return;
      iframe.src = src;
    });
  }

  function initLazyImages() {
    var imgs = document.querySelectorAll("img[data-lazy-src]");
    Array.prototype.forEach.call(imgs, function (img) {
      hydrateOnView(img, function () {
        if (img.getAttribute("src")) return;
        var src = img.getAttribute("data-lazy-src");
        if (!src) return;
        img.src = src;
      });
    });
  }

  function initSignalTeaser() {
    var teaser = document.querySelector("[data-signal-teaser]");
    if (!teaser) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      teaser.classList.add("is-paused");
      teaser.classList.add("is-still");
      return;
    }

    if (!("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          teaser.classList.toggle("is-paused", !entry.isIntersecting);
        });
      },
      { root: null, threshold: 0.08 }
    );
    io.observe(teaser);
  }

  function init() {
    initYouTube();
    initLazyImages();
    initSignalTeaser();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
