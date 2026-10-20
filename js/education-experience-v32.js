/* Larger activity photographs, an interactive learning computer and in-page image viewing. */
(function () {
  "use strict";

  var arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  var expand = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/></svg>';
  var icons = {
    gallery: '<svg viewBox="0 0 96 96" aria-hidden="true"><rect x="15" y="17" width="61" height="67" rx="8" fill="#f4d6c0" transform="rotate(-9 46 50)"/><rect x="22" y="11" width="61" height="70" rx="8" fill="#fff9e9" stroke="currentColor" stroke-width="2.5"/><circle cx="66" cy="29" r="7" fill="#dca65c"/><path d="m31 63 15-21 12 15 8-10 8 16Z" fill="#a4b28f"/><path d="m31 70 43 0" stroke="currentColor" stroke-width="2"/><path d="m10 23-4-6m7-7 5 2m65 76 6 3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
    toolkit: '<svg viewBox="0 0 96 96" aria-hidden="true"><path d="M15 31h25l7 9h37v39H15Z" fill="#f0cfb6" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><rect x="28" y="14" width="43" height="46" rx="5" fill="#fff9e9" stroke="currentColor" stroke-width="2.5" transform="rotate(8 49 37)"/><path d="M38 27h22M37 35h22M36 43h15" stroke="#a6af91" stroke-width="3" stroke-linecap="round"/><path d="M12 48h74l-8 34H18Z" fill="#f8e6cf" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M43 61h12m-6-6v12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>'
  };
  var principal = '<svg viewBox="0 0 120 140" aria-hidden="true"><circle cx="60" cy="62" r="53" fill="#f7e7ce"/><path d="M18 132c2-27 18-43 42-43s40 16 42 43" fill="#a6b196" stroke="#743b34" stroke-width="2.5"/><path d="m48 89 12 17 12-17v-7H48Z" fill="#eed0ac" stroke="#743b34" stroke-width="2"/><path d="m39 98 13 23 8-15 8 15 13-23" fill="#fff9e9" stroke="#743b34" stroke-width="2"/><path d="m57 108 6 0 4 25H53Z" fill="#8e3734"/><ellipse cx="60" cy="59" rx="29" ry="34" fill="#eed0ac" stroke="#743b34" stroke-width="2.5"/><path d="M31 58c-8-33 10-46 30-46 22 0 34 15 30 44-7-7-10-20-11-25-13 15-31 14-47 11" fill="#6d5147"/><path d="M38 55h18v12H38Zm26 0h18v12H64Zm-8 5h8" fill="#fff9e944" stroke="#743b34" stroke-width="2.5" stroke-linejoin="round"/><path d="M53 77q7 6 14 0" fill="none" stroke="#743b34" stroke-width="2.5" stroke-linecap="round"/><circle cx="47" cy="60" r="1.5" fill="#743b34"/><circle cx="73" cy="60" r="1.5" fill="#743b34"/><path d="M88 17v12m-6-6h12" stroke="#c5944e" stroke-width="2.5" stroke-linecap="round"/></svg>';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function sourceText(node) {
    return window.AeroSenseI18n ? window.AeroSenseI18n.sourceText(node) : node.textContent;
  }
  function sourceAttribute(node, name) {
    return window.AeroSenseI18n ? window.AeroSenseI18n.sourceAttribute(node, name) : node.getAttribute(name);
  }
  function translate(value) {
    return window.AeroSenseI18n ? window.AeroSenseI18n.t(value) : value;
  }

  function enhancePhotos() {
    document.querySelectorAll('[data-edu-carousel="photos"]').forEach(function (track) {
      var pair = track.closest(".edu-story-pair");
      if (pair) pair.classList.add("edu-story-pair--photography");
      var carousel = track.closest(".edu-media-carousel");
      if (carousel) carousel.classList.add("edu-photo-showcase");
      track.querySelectorAll("figure > a").forEach(function (link) {
        link.setAttribute("data-education-zoom", "");
      });
    });
  }

  function reserveSeriesDimensions() {
    document.querySelectorAll('.edu-story-pair--series [data-edu-carousel="series"] img').forEach(function (image) {
      var width = Number(image.getAttribute("width"));
      var height = Number(image.getAttribute("height"));
      if (width > 0 && height > 0) {
        image.style.setProperty("--edu-source-ratio", width + " / " + height);
      }
    });
  }

  function makeCTA(link, kind, title, subtitle, action) {
    if (!link || link.classList.contains("edu-resource-card")) return;
    var existing = link.getAttribute("data-notion-index");
    // Keep the old translatable anchor as a stable wrapper; its children own the new copy.
    if (existing) {
      link.dataset.originalNotionIndex = existing;
      link.removeAttribute("data-notion-index");
    }
    link.classList.add("edu-resource-card", "edu-resource-card--" + kind);
    link.replaceChildren();
    var art = el("span", "edu-resource-card__art");
    art.innerHTML = icons[kind];
    var copy = el("span", "edu-resource-card__copy");
    copy.append(el("strong", "", title), el("span", "edu-resource-card__description", subtitle));
    var prompt = el("span", "edu-resource-card__action", action);
    var chevron = el("span", "edu-resource-card__arrow");
    chevron.innerHTML = arrow;
    prompt.append(chevron);
    copy.append(prompt);
    link.append(art, copy);
  }

  function initResources() {
    makeCTA(
      document.querySelector("#camp-creative-wall > a"),
      "gallery", "44 young imaginations. One gallery.",
      "Discover the fruit flies, noses and reflections created by our learners.",
      "Explore the student gallery"
    );
    makeCTA(
      document.querySelector('#education-teacher-toolkit a[data-teacher-toolkit]'),
      "toolkit", "Bring the science into your classroom",
      "Lesson slides, activities and teaching guidance, ready to explore and reuse.",
      "Open the Teacher Toolkit"
    );
    var quote = document.querySelector("#learning-lab > blockquote.edu-source-quote");
    if (quote && !quote.classList.contains("edu-principal-quote")) {
      quote.classList.add("edu-principal-quote");
      var avatar = el("span", "edu-principal-quote__portrait");
      avatar.innerHTML = principal;
      quote.prepend(avatar);
    }
  }

  function initComputer() {
    var gallery = document.querySelector('#learning-lab .edu-static-figures[data-notion-gallery="learning"]');
    if (!gallery || gallery.dataset.computerReady) return;
    var slides = Array.from(gallery.querySelectorAll(":scope > figure"));
    if (!slides.length) return;
    gallery.dataset.computerReady = "true";
    var computer = el("section", "edu-computer");
    computer.setAttribute("aria-label", "Explore the Learning Lab");
    gallery.before(computer);
    var casing = el("div", "edu-computer__casing");
    var top = el("div", "edu-computer__top");
    var lights = el("span", "edu-computer__lights");
    lights.setAttribute("aria-hidden", "true");
    lights.innerHTML = "<i></i><i></i><i></i>";
    top.append(lights, el("span", "", "AeroSense Learning Lab"), el("span", "edu-computer__camera"));
    casing.append(top);
    var screen = el("div", "edu-computer__screen");
    screen.tabIndex = 0;
    screen.setAttribute("aria-label", "Use arrow keys to explore the three screens");
    gallery.className = "edu-computer__slides";
    gallery.id = "education-learning-screens";
    screen.append(gallery);
    casing.append(screen);
    var controls = el("div", "edu-computer__controls");
    function button(label, direction) {
      var b = el("button", "edu-computer__arrow edu-computer__arrow--" + direction);
      b.type = "button";
      b.setAttribute("aria-label", label);
      b.setAttribute("aria-controls", gallery.id);
      b.innerHTML = arrow;
      return b;
    }
    var previous = button("Previous screen", "previous");
    var next = button("Next screen", "next");
    var count = el("span", "edu-computer__count");
    count.setAttribute("aria-live", "polite");
    var dots = el("div", "edu-computer__dots");
    var dotButtons = slides.map(function (slide, index) {
      slide.classList.add("edu-computer__slide");
      var link = slide.querySelector("a");
      if (link) link.setAttribute("data-education-zoom", "");
      var dot = el("button");
      dot.type = "button";
      dot.setAttribute("aria-label", ["Discover how we smell", "Build an odor fingerprint", "Explore smell molecules"][index] || "Explore the Learning Lab");
      dot.setAttribute("aria-controls", gallery.id);
      dot.addEventListener("click", function () { show(index); });
      dots.append(dot);
      return dot;
    });
    controls.append(previous, dots, count, next);
    casing.append(controls);
    var stand = el("div", "edu-computer__stand");
    stand.setAttribute("aria-hidden", "true");
    var base = el("div", "edu-computer__base");
    base.setAttribute("aria-hidden", "true");
    computer.append(casing, stand, base);
    var current = 0;
    function show(index) {
      if (index !== current && slides[current].contains(document.activeElement)) {
        screen.focus({ preventScroll: true });
      }
      current = Math.max(0, Math.min(slides.length - 1, index));
      slides.forEach(function (slide, i) {
        var on = i === current;
        slide.classList.toggle("is-current", on);
        slide.setAttribute("aria-hidden", on ? "false" : "true");
        slide.inert = !on;
        dotButtons[i].setAttribute("aria-pressed", on ? "true" : "false");
      });
      previous.disabled = current === 0;
      next.disabled = current === slides.length - 1;
      count.textContent = String(current + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
      computer.dataset.currentScreen = String(current + 1);
    }
    previous.addEventListener("click", function () { show(current - 1); });
    next.addEventListener("click", function () { show(current + 1); });
    computer.addEventListener("keydown", function (event) {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      show(event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1 : current + (event.key === "ArrowRight" ? 1 : -1));
    });
    var gesture = null, swallowClick = false;
    screen.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "touch") gesture = { x: event.clientX, y: event.clientY };
    }, { passive: true });
    screen.addEventListener("pointerup", function (event) {
      if (!gesture) return;
      var dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        swallowClick = true;
        show(current + (dx < 0 ? 1 : -1));
        window.setTimeout(function () { swallowClick = false; }, 450);
      }
    }, { passive: true });
    screen.addEventListener("pointercancel", function () { gesture = null; });
    screen.addEventListener("click", function (event) {
      if (swallowClick) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    show(0);
  }

  function initImageViewer() {
    var survey = document.querySelector('#latest-survey [data-notion-gallery="survey"]');
    if (survey) survey.querySelectorAll("figure > a").forEach(function (link) {
      link.setAttribute("data-education-zoom", "");
      link.classList.add("edu-zoom-target");
      var hint = el("span", "edu-zoom-target__hint");
      hint.innerHTML = expand;
      hint.append(document.createTextNode("Enlarge figure"));
      link.append(hint);
    });
    var links = Array.from(document.querySelectorAll("[data-education-zoom]"));
    if (!links.length || typeof HTMLDialogElement === "undefined") return;
    var dialog = el("dialog", "edu-image-viewer");
    dialog.id = "education-image-viewer";
    dialog.setAttribute("aria-labelledby", "education-image-viewer-title");
    var panel = el("div", "edu-image-viewer__panel");
    var header = el("div", "edu-image-viewer__header");
    var heading = el("strong", "", "Image viewer");
    heading.id = "education-image-viewer-title";
    var count = el("span", "edu-image-viewer__count");
    var close = el("button", "edu-image-viewer__close", "Close");
    close.type = "button";
    close.append(el("span", "", "×"));
    header.append(heading, count, close);
    var stage = el("div", "edu-image-viewer__stage");
    var picture = el("img", "edu-image-viewer__image");
    picture.decoding = "async";
    var status = el("div", "edu-image-viewer__status");
    status.setAttribute("role", "status");
    var spinner = el("span", "edu-image-viewer__spinner");
    spinner.setAttribute("aria-hidden", "true");
    status.append(spinner, el("span", "", "Loading image…"));
    stage.append(picture, status);
    var footer = el("div", "edu-image-viewer__footer");
    var previous = el("button", "edu-image-viewer__arrow edu-image-viewer__arrow--previous");
    previous.type = "button"; previous.setAttribute("aria-label", "Previous image"); previous.innerHTML = arrow;
    var next = el("button", "edu-image-viewer__arrow");
    next.type = "button"; next.setAttribute("aria-label", "Next image"); next.innerHTML = arrow;
    var caption = el("p", "edu-image-viewer__caption");
    footer.append(previous, caption, next);
    panel.append(header, stage, footer);
    dialog.append(panel);
    document.body.append(dialog);
    var group = [], current = 0, returnFocus = null, request = 0;
    function render(index) {
      current = Math.max(0, Math.min(group.length - 1, index));
      var link = group[current], original = link.querySelector("img"), token = ++request;
      stage.setAttribute("aria-busy", "true");
      status.hidden = false; picture.hidden = true; spinner.hidden = false;
      status.lastElementChild.textContent = translate("Loading image…");
      caption.textContent = original ? sourceAttribute(original, "alt") : "";
      picture.alt = caption.textContent;
      count.textContent = (current + 1) + " / " + group.length;
      previous.disabled = current === 0; next.disabled = current === group.length - 1;
      var image = new Image();
      image.src = link.href;
      image.decode().then(function () {
        if (token !== request) return;
        picture.src = image.src; picture.hidden = false; status.hidden = true;
        stage.setAttribute("aria-busy", "false");
      }).catch(function () {
        if (token !== request) return;
        spinner.hidden = true;
        status.lastElementChild.textContent = translate("This image could not be loaded. Please try again.");
        stage.setAttribute("aria-busy", "false");
      });
    }
    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        var container = link.closest('[data-notion-gallery], .edu-computer__slides') || link.parentNode;
        group = Array.from(container.querySelectorAll("[data-education-zoom]"));
        returnFocus = link;
        render(Math.max(0, group.indexOf(link)));
        document.body.classList.add("edu-viewer-open");
        dialog.showModal();
        close.focus({ preventScroll: true });
      });
    });
    close.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", function () {
      request++;
      document.body.classList.remove("edu-viewer-open");
      if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    });
    previous.addEventListener("click", function () { render(current - 1); });
    next.addEventListener("click", function () { render(current + 1); });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault(); render(current + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
  }

  function init() {
    if (!document.body.classList.contains("page-education")) return;
    enhancePhotos();
    reserveSeriesDimensions();
    initResources();
    initComputer();
    initImageViewer();
    if (window.AeroSenseI18n) window.AeroSenseI18n.refresh();
  }
  // This deferred script runs while readyState is interactive. Wait for the
  // earlier education.js DOMContentLoaded handler to build the carousels.
  if (document.readyState !== "complete") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
