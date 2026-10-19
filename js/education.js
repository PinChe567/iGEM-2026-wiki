/**
 * Education page — ephemeral misconception check.
 * Visitor answers are not stored, sent, or logged.
 */
(function (root) {
  "use strict";

  var COPY = {
    learn: {
      title: "Learn",
      body: "Expose the idea. Put the claim in front of someone before asking them to defend it.",
    },
    play: {
      title: "Play",
      body: "Interact with it. A decision, a mismatch, or a failed guess is more informative than a paragraph.",
    },
    question: {
      title: "Question",
      body: "Challenge assumptions. Screening is not confirmation. A glow is not a measurement. A score is not literacy.",
    },
    measure: {
      title: "Measure",
      body: "Test what changed. Same-concept pre/post items, not satisfaction scores dressed up as learning.",
    },
    listen: {
      title: "Listen",
      body: "Collect feedback. Local reflections and future approved instruments — not invented quotes.",
    },
    iterate: {
      title: "Iterate",
      body: "Change the material, or change how AeroSense talks about risk. Education is unfinished if nothing moved.",
    },
  };

  var EVIDENCE_TAGS = [
    { id: "status", label: "Status", hint: "delivery vs evaluation" },
    { id: "measurement", label: "Evidence", hint: "what was measured" },
    { id: "method", label: "Method", hint: "how we would measure" },
    { id: "dialogue", label: "Dialogue", hint: "participant discussion" },
    { id: "iteration", label: "Iteration", hint: "what changed" },
    { id: "reusable-resource", label: "Reuse", hint: "what others can run" },
    { id: "limitation", label: "Limitation", hint: "what evidence does not show" },
  ];

  function tagMeta(id) {
    var i;
    for (i = 0; i < EVIDENCE_TAGS.length; i++) {
      if (EVIDENCE_TAGS[i].id === id) return EVIDENCE_TAGS[i];
    }
    return null;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function noteFor(el, id) {
    return el.getAttribute("data-note-" + id) || "";
  }

  function hydrateEvidenceMarks(scope) {
    var rootEl = scope || document;
    var marks = rootEl.querySelectorAll("[data-edu-tags]");
    Array.prototype.forEach.call(marks, function (el) {
      if (el.querySelector(".edu-etags")) return;
      if (el.closest("[data-chain-static]")) return;
      var ids = (el.getAttribute("data-edu-tags") || "")
        .trim()
        .split(/\s+/)
        .filter(function (id) {
          return tagMeta(id);
        });
      if (!ids.length) return;
      var list = document.createElement("ul");
      list.className = "edu-etags";
      list.setAttribute("aria-label", "Evidence labels");
      ids.forEach(function (id) {
        var meta = tagMeta(id);
        var note = noteFor(el, id);
        var item = document.createElement("li");
        var chip = document.createElement("span");
        chip.className = "edu-etag";
        chip.setAttribute("data-edu-tag", id);
        var kind = document.createElement("span");
        kind.className = "edu-etag__kind";
        kind.textContent = meta.label;
        chip.appendChild(kind);
        if (note) {
          var extra = document.createElement("span");
          extra.className = "edu-etag__note";
          extra.textContent = note;
          chip.appendChild(extra);
        }
        item.appendChild(chip);
        list.appendChild(item);
      });
      var heading = el.querySelector(":scope > h2, :scope > h3, :scope > h4");
      if (heading) heading.parentNode.insertBefore(list, heading.nextSibling);
      else el.insertBefore(list, el.firstChild);
    });
  }

  function setView(view, persist) {
    var next = view === "evidence" ? "evidence" : "story";
    document.body.setAttribute("data-edu-view", next);
    document.body.classList.toggle("page-education--evidence", next === "evidence");
    var buttons = document.querySelectorAll("button[data-edu-view]");
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-edu-view") === next ? "true" : "false");
    });
    var live = document.querySelector("[data-edu-view-live]");
    if (live) {
      live.textContent =
        next === "evidence"
          ? "Evidence View on. Scanning labels are highlighted. No facts or limitations were hidden."
          : "Story View on. Narrative reading order is unchanged. Limitations remain visible.";
    }
    if (next !== "evidence") {
      setFilter("");
      setLegendOpen(false);
    }
    syncChainView(next);
    if (persist) {
      try {
        var url = new URL(window.location.href);
        if (next === "evidence") url.searchParams.set("view", "evidence");
        else url.searchParams.delete("view");
        history.replaceState({}, "", url);
      } catch (err) {
        /* ignore */
      }
    }
  }

  function setFilter(id) {
    var next = tagMeta(id) ? id : "";
    if (next) document.body.setAttribute("data-edu-filter", next);
    else document.body.removeAttribute("data-edu-filter");
    var chips = document.querySelectorAll("button[data-edu-filter]");
    Array.prototype.forEach.call(chips, function (btn) {
      var on = next && btn.getAttribute("data-edu-filter") === next;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function setLegendOpen(open) {
    var legend = document.querySelector("[data-edu-legend]");
    var toggle = legend && legend.querySelector("[data-edu-legend-toggle]");
    if (!legend || !toggle) return;
    legend.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function fillLegend(legend) {
    var list = legend.querySelector("[data-edu-legend-list]");
    if (!list || list.children.length) return;
    EVIDENCE_TAGS.forEach(function (meta) {
      var item = document.createElement("li");
      var btn = document.createElement("button");
      var chip = document.createElement("span");
      var kind = document.createElement("span");
      var hint = document.createElement("span");
      btn.type = "button";
      btn.setAttribute("data-edu-filter", meta.id);
      btn.setAttribute("aria-pressed", "false");
      chip.className = "edu-etag";
      chip.setAttribute("data-edu-tag", meta.id);
      kind.className = "edu-etag__kind";
      kind.textContent = meta.label;
      hint.className = "edu-etag__note";
      hint.textContent = meta.hint;
      chip.appendChild(kind);
      chip.appendChild(hint);
      btn.appendChild(chip);
      item.appendChild(btn);
      list.appendChild(item);
    });
  }

  function initPhilosophyLoop() {
    var loopRoot = document.querySelector("[data-edu-loop]");
    if (!loopRoot) return;
    var buttons = loopRoot.querySelectorAll("[data-step]");
    var title = loopRoot.querySelector("[data-loop-title]");
    var body = loopRoot.querySelector("[data-loop-body]");
    if (!buttons.length || !title || !body) return;

    function show(id) {
      var item = COPY[id] || COPY.learn;
      title.textContent = item.title;
      body.textContent = item.body;
      Array.prototype.forEach.call(buttons, function (btn) {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-step") === id ? "true" : "false");
      });
    }

    loopRoot.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-step]");
      if (!btn || !loopRoot.contains(btn)) return;
      show(btn.getAttribute("data-step"));
    });

    show("learn");
  }

  function initEvidenceView() {
    var switcher = document.querySelector("[data-edu-view-switch]");
    if (!switcher) return;

    switcher.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-edu-view]");
      if (!btn || !switcher.contains(btn)) return;
      setView(btn.getAttribute("data-edu-view"), true);
    });

    var legend = document.querySelector("[data-edu-legend]");
    if (legend) {
      fillLegend(legend);
      legend.addEventListener("click", function (event) {
        var toggle = event.target.closest("[data-edu-legend-toggle]");
        if (toggle) {
          setLegendOpen(toggle.getAttribute("aria-expanded") !== "true");
          return;
        }
        var filterBtn = event.target.closest("[data-edu-filter]");
        if (!filterBtn || !legend.contains(filterBtn)) return;
        var id = filterBtn.getAttribute("data-edu-filter");
        setFilter(document.body.getAttribute("data-edu-filter") === id ? "" : id);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var search = document.getElementById("project-search");
      if (search && search.open) return;
      var openLegend = document.querySelector("[data-edu-legend].is-open");
      if (openLegend) {
        setLegendOpen(false);
        return;
      }
      if (document.body.getAttribute("data-edu-filter")) {
        setFilter("");
        return;
      }
      if (document.body.getAttribute("data-edu-view") === "evidence") {
        setView("story", true);
      }
    });

    var requested = "";
    try {
      requested = new URL(window.location.href).searchParams.get("view") || "";
    } catch (err) {
      requested = "";
    }
    setView(requested === "evidence" ? "evidence" : "story", false);
  }

  root.AerosenseEducation = root.AerosenseEducation || {};
  root.AerosenseEducation.EVIDENCE_TAGS = EVIDENCE_TAGS;
  root.AerosenseEducation.hydrateEvidenceMarks = hydrateEvidenceMarks;
  root.AerosenseEducation.escapeEvidenceHtml = escapeHtml;

  function initDecideFirst() {
    var root = document.querySelector("[data-edu-decide]");
    if (!root) return;

    var items = root.querySelectorAll("[data-edu-item]");
    var coda = root.querySelector("[data-edu-coda]");

    function markChoice(item, selectedInput) {
      var labels = item.querySelectorAll(".edu-decide__choice");
      Array.prototype.forEach.call(labels, function (label) {
        var radio = label.querySelector("input");
        label.classList.toggle("is-selected", radio === selectedInput);
      });
    }

    function visitorLine(choseCorrect) {
      return choseCorrect
        ? "You disagreed. Correct. The explanation below shows why."
        : "You agreed. Reconsider this claim using the explanation below.";
    }

    function allAnswered() {
      var i;
      for (i = 0; i < items.length; i++) {
        if (!items[i].classList.contains("is-answered")) return false;
      }
      return true;
    }

    root.addEventListener("change", function (event) {
      var input = event.target;
      if (!input || input.type !== "radio") return;
      var item = input.closest("[data-edu-item]");
      if (!item || !root.contains(item)) return;
      var correct = item.getAttribute("data-correct");
      var choseCorrect = input.value === correct;
      var result = item.querySelector(".edu-decide__result");
      var live = item.querySelector(".edu-decide__live");
      var visitor = item.querySelector("[data-edu-visitor]");

      item.classList.add("is-answered");
      markChoice(item, input);
      if (visitor) visitor.textContent = visitorLine(choseCorrect);
      if (live) live.textContent = visitorLine(choseCorrect);
      if (result) result.hidden = false;

      if (coda && allAnswered()) coda.hidden = false;
    });
  }

  function syncChainView(view) {
    var root = document.querySelector("[data-edu-chain]");
    if (!root) return;
    var next = view === "evidence" ? "evidence" : "story";
    root.setAttribute("data-chain-view", next);
    var live = root.querySelector("[data-chain-view-live]");
    var tags = root.querySelectorAll(".edu-chain__tags");
    Array.prototype.forEach.call(tags, function (el) {
      el.setAttribute("aria-hidden", next === "story" ? "true" : "false");
    });
    if (live) {
      live.textContent =
        next === "evidence"
          ? "Chain scanning labels are visible. No chain content was hidden."
          : "Chain scanning labels are tucked. The measurement path is unchanged.";
    }
  }

  function initMeasurementChain() {
    var root = document.querySelector("[data-edu-chain]");
    if (!root) return;

    var panel = root.querySelector("[data-chain-panel]");
    var nodes = root.querySelectorAll("[data-chain-node]");
    var staticList = root.querySelector("[data-chain-static]");

    if (staticList) staticList.setAttribute("hidden", "");
    if (panel) panel.removeAttribute("hidden");

    function showNode(id, fromKeyboard) {
      var source = root.querySelector('[data-chain-source="' + id + '"]');
      if (!source || !panel) return;
      var clone = window.AeroSenseI18n?.cloneSource(source)||source.cloneNode(true);
      clone.removeAttribute("id");
      clone.removeAttribute("data-chain-source");
      var heading = clone.querySelector("h4");
      if (heading) {
        var title = document.createElement("h3");
        title.id = "edu-chain-panel-title";
        title.textContent = window.AeroSenseI18n?.sourceText(heading)||heading.textContent;
        heading.parentNode.replaceChild(title, heading);
      }
      while (panel.firstChild) panel.removeChild(panel.firstChild);
      panel.appendChild(clone);
      Array.prototype.forEach.call(nodes, function (node) {
        var on = node.getAttribute("data-chain-node") === id;
        if (on) node.setAttribute("aria-current", "true");
        else node.removeAttribute("aria-current");
      });
      if (fromKeyboard && panel.focus) {
        panel.setAttribute("tabindex", "-1");
      }
    }

    root.addEventListener("click", function (event) {
      var node = event.target.closest("[data-chain-node]");
      if (!node || !root.contains(node)) return;
      event.preventDefault();
      showNode(node.getAttribute("data-chain-node"), false);
    });

    root.addEventListener("keydown", function (event) {
      var node = event.target.closest("[data-chain-node]");
      if (!node || !root.contains(node)) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      showNode(node.getAttribute("data-chain-node"), true);
    });

    syncChainView(document.body.getAttribute("data-edu-view") || "story");
    showNode("a-survey", false);
  }

  function initLabPath() {
    var nav = document.querySelector("[data-edu-labpath]");
    if (!nav) return;
    var links = nav.querySelectorAll("[data-lab-node]");
    function setCurrent(id) {
      Array.prototype.forEach.call(links, function (link) {
        var on = link.getAttribute("data-lab-node") === id;
        if (on) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    nav.addEventListener("click", function (event) {
      var link = event.target.closest("[data-lab-node]");
      if (!link || !nav.contains(link)) return;
      setCurrent(link.getAttribute("data-lab-node"));
    });
  }

  function initMediaCarousels() {
    // Actual source nodes move between positions; no duplicated image assets.
    Array.prototype.forEach.call(document.querySelectorAll('.edu-source-gallery[data-edu-carousel="photos"], .edu-source-gallery[data-edu-carousel="series"]'), function (track, index) {
      var slides = Array.prototype.slice.call(track.children);
      if (slides.length < 2) return;
      var carousel = document.createElement("div");
      carousel.className = "edu-media-carousel";
      carousel.setAttribute("role", "region");
      var isSeries = track.getAttribute("data-edu-carousel") === "series";
      var seriesLabels = { parts: "Parts Design series", model: "Model series", hardware: "Hardware series" };
      carousel.setAttribute("aria-label", isSeries ? seriesLabels[track.getAttribute("data-notion-gallery")] || "Image gallery" : "Image gallery");
      track.parentNode.insertBefore(carousel, track);
      var viewport = document.createElement("div");
      viewport.className = "edu-media-carousel__viewport";
      carousel.appendChild(viewport);
      viewport.appendChild(track);
      track.classList.add("edu-media-carousel__track");
      track.id = track.id || "edu-gallery-track-" + index;
      track.tabIndex = 0;
      track.setAttribute("aria-label", "Use arrow keys to browse images");
      function arrow(label, direction) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "edu-media-carousel__arrow edu-media-carousel__arrow--" + direction;
        button.setAttribute("aria-label", label);
        button.setAttribute("aria-controls", track.id);
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5 7.5 12l7 7"/></svg>';
        viewport.appendChild(button);
        return button;
      }
      var previous = arrow("Previous image", "previous");
      var next = arrow("Next image", "next");
      var controls = document.createElement("div");
      controls.className = "edu-media-carousel__controls";
      var count = document.createElement("span");
      count.className = "edu-media-carousel__count";
      count.setAttribute("aria-live", "polite");
      count.setAttribute("aria-atomic", "true");
      var progress = document.createElement("div");
      progress.className = "edu-media-carousel__progress";
      progress.setAttribute("role", "group");
      progress.setAttribute("aria-label", "Choose an image");
      var stops = slides.map(function (slide, position) {
        var stop = document.createElement("button");
        stop.type = "button";
        stop.className = "edu-media-carousel__stop";
        stop.setAttribute("aria-label", "Show image " + (position + 1) + " of " + slides.length);
        stop.setAttribute("aria-controls", track.id);
        stop.addEventListener("click", function () { go(position); });
        progress.appendChild(stop);
        slide.classList.add("edu-media-carousel__slide");
        slide.setAttribute("aria-label", "Image " + (position + 1) + " of " + slides.length);
        return stop;
      });
      controls.append(count, progress);
      carousel.appendChild(controls);
      var hint = document.createElement("p");
      hint.className = "edu-media-carousel__hint";
      hint.id = "edu-gallery-help-" + index;
      hint.textContent = isSeries ? "Explore with the arrows. Select a card to open the full image." : "Explore with the arrows. Select a photograph to open the full image.";
      carousel.appendChild(hint);
      track.setAttribute("aria-describedby", hint.id);
      var current = 0;
      function sync() {
        slides.forEach(function (slide, position) {
          var offset = position - current;
          slide.classList.toggle("is-current", offset === 0);
          slide.classList.toggle("is-previous", offset === -1);
          slide.classList.toggle("is-next", offset === 1);
          slide.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
          slide.inert = offset !== 0;
          stops[position].classList.toggle("is-passed", offset < 0);
          if (offset === 0) stops[position].setAttribute("aria-current", "true");
          else stops[position].removeAttribute("aria-current");
        });
        count.textContent = String(current + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
        previous.disabled = current === 0;
        next.disabled = current === slides.length - 1;
        carousel.dataset.currentImage = String(current + 1);
      }
      function go(position) {
        var destination = Math.max(0, Math.min(slides.length - 1, position));
        if (destination === current) return;
        if (slides[current].contains(document.activeElement)) track.focus({ preventScroll: true });
        current = destination;
        sync();
      }
      previous.addEventListener("click", function () { go(current - 1); });
      next.addEventListener("click", function () { go(current + 1); });
      carousel.addEventListener("keydown", function (event) {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(event.key) === -1) return;
        event.preventDefault();
        go(event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1 : current + (event.key === "ArrowRight" ? 1 : -1));
      });
      var gesture = null, suppressClickUntil = 0;
      track.addEventListener("pointerdown", function (event) {
        if (event.pointerType !== "touch") return;
        gesture = { x: event.clientX, y: event.clientY };
      }, { passive: true });
      track.addEventListener("pointerup", function (event) {
        if (!gesture) return;
        var dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
        gesture = null;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          suppressClickUntil = Date.now() + 500;
          go(current + (dx < 0 ? 1 : -1));
        }
      }, { passive: true });
      track.addEventListener("pointercancel", function () { gesture = null; });
      track.addEventListener("click", function (event) {
        if (Date.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
      }, true);
      sync();
    });
  }

  function initMeaningCards() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-meaning-card]"), function (card) {
      var button = card.querySelector(".edu-meaning-card__toggle");
      var biology = card.querySelector(".edu-meaning-card__face--biology");
      var education = card.querySelector(".edu-meaning-card__face--education");
      if (!button || !biology || !education) return;
      button.querySelector('[aria-hidden="true"]').innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M19.5 9a7.8 7.8 0 0 0-13-3L3 9m0-5v5h5M4.5 15a7.8 7.8 0 0 0 13 3l3.5-3m0 5v-5h-5"/></svg>';
      function flip(showEducation) {
        card.classList.toggle("is-flipped", showEducation);
        button.setAttribute("aria-pressed", showEducation ? "true" : "false");
        biology.setAttribute("aria-hidden", showEducation ? "true" : "false");
        education.setAttribute("aria-hidden", showEducation ? "false" : "true");
        biology.inert = showEducation;
        education.inert = !showEducation;
        button.querySelector('[data-meaning-label="education"]').hidden = showEducation;
        button.querySelector('[data-meaning-label="biology"]').hidden = !showEducation;
      }
      card.classList.add("is-enhanced");
      button.hidden = false;
      flip(false);
      card.addEventListener("click", function (event) {
        if (event.target.closest("a") || (!event.target.closest("button") && String(root.getSelection()).length)) return;
        flip(button.getAttribute("aria-pressed") !== "true");
      });
    });
  }

  function initBrainMapNavigation() {
    var map = document.getElementById("education-activity-map");
    if (!map) return;
    var selectors = map.querySelectorAll("[data-brain-select]");
    var panels = map.querySelectorAll("[data-brain-panel]");
    function selectRegion(key) {
      Array.prototype.forEach.call(selectors, function (control) {
        control.setAttribute("aria-pressed", control.getAttribute("data-brain-select") === key ? "true" : "false");
      });
      Array.prototype.forEach.call(panels, function (panel) {
        panel.hidden = panel.getAttribute("data-brain-panel") !== key;
      });
    }
    selectRegion("input");
    map.addEventListener("keydown", function (event) {
      var control = event.target.closest && event.target.closest("svg [data-brain-select]");
      if (!control || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      selectRegion(control.getAttribute("data-brain-select"));
    });
    map.addEventListener("click", function (event) {
      var control = event.target.closest && event.target.closest("[data-brain-select]");
      if (control && map.contains(control)) {
        selectRegion(control.getAttribute("data-brain-select"));
        return;
      }
      var link = event.target.closest && event.target.closest('a[href^="#"]');
      if (!link || !map.contains(link) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var target = document.getElementById(link.getAttribute("href").slice(1));
      if (!target || !root.AeroSenseToc) return;
      event.preventDefault();
      root.AeroSenseToc.navigate(target, { push: true, focus: true, source: "education-map" });
    });

    // Keep the visible passage in place when translated text changes page height.
    var readingPosition = null;
    document.addEventListener("click", function (event) {
      if (!event.target.closest || !event.target.closest("[data-language-toggle]")) return;
      var offset = root.AeroSenseToc ? root.AeroSenseToc.offset() : 100;
      var passages = document.querySelectorAll(".page-article [data-notion-index], .page-article figure");
      readingPosition = null;
      var destination = document.getElementById(root.location.hash.slice(1));
      if (destination) {
        var destinationRect = destination.getBoundingClientRect();
        if (destinationRect.top >= 0 && destinationRect.top < root.innerHeight) {
          readingPosition = { node: destination, top: destinationRect.top, destination: true };
          return;
        }
      }
      for (var i = 0; i < passages.length; i++) {
        var rect = passages[i].getBoundingClientRect();
        if (rect.height && rect.bottom > offset && rect.top < root.innerHeight) {
          readingPosition = { node: passages[i], top: rect.top };
          break;
        }
      }
    }, true);
    document.addEventListener("aerosense:languagechange", function () {
      var position = readingPosition;
      readingPosition = null;
      if (!position) return;
      if (position.destination && root.AeroSenseToc) {
        root.AeroSenseToc.navigate(position.node, { push: false, source: "education-language" });
        return;
      }
      root.requestAnimationFrame(function () {
        var delta = position.node.getBoundingClientRect().top - position.top;
        if (Math.abs(delta) > 1) root.scrollTo({ top: root.scrollY + delta, behavior: "instant" });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPhilosophyLoop();
    hydrateEvidenceMarks(document);
    initEvidenceView();
    initDecideFirst();
    initMeasurementChain();
    initLabPath();
    initBrainMapNavigation();
    initMeaningCards();
    initMediaCarousels();
  });
})(window);
