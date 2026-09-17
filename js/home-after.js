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

  function init() {
    initYouTube();
    initLazyImages();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
